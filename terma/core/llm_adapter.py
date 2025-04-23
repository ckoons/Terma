"""LLM communication adapter for terminal assistance"""

import asyncio
import json
import logging
import aiohttp
import websockets
from typing import Dict, Any, Optional, List, Callable, Awaitable, Tuple

from ..utils.logging import setup_logging
from ..utils.config import Config

logger = setup_logging()

class LLMAdapter:
    """LLM adapter for terminal assistance
    
    This adapter handles communication with LLMs through various backends.
    It will be enhanced in the future to work with the Rhetor component.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the LLM adapter
        
        Args:
            config_path: Path to the configuration file
        """
        self.config = Config(config_path)
        self.adapter_url = self.config.get("llm.adapter_url", "http://localhost:8300")
        self.adapter_ws_url = self.config.get("llm.adapter_ws_url", "ws://localhost:8301")
        self.provider = self.config.get("llm.provider", "claude")
        self.model = self.config.get("llm.model", "claude-3-sonnet-20240229")
        self.system_prompt = self.config.get("llm.system_prompt", 
            "You are a terminal assistant that helps users with command-line tasks. "
            "Provide concise explanations and suggestions for terminal commands. "
            "Focus on being helpful, accurate, and security-conscious."
        )
        
        self._session_contexts: Dict[str, List[Dict[str, str]]] = {}
        self._ws_connection = None
        self._connection_lock = asyncio.Lock()
        
    def _get_session_context(self, session_id: str) -> List[Dict[str, str]]:
        """Get or create the conversation context for a session
        
        Args:
            session_id: The terminal session ID
            
        Returns:
            The session context as a list of messages
        """
        if session_id not in self._session_contexts:
            # Initialize with system message
            self._session_contexts[session_id] = [
                {
                    "role": "system",
                    "content": self.system_prompt
                }
            ]
        return self._session_contexts[session_id]
    
    def add_message(self, session_id: str, message: str, role: str = "user"):
        """Add a message to the conversation context
        
        Args:
            session_id: The terminal session ID
            message: The message content
            role: The message role (user or assistant)
        """
        context = self._get_session_context(session_id)
        context.append({"role": role, "content": message})
        
        # Keep context at a reasonable size (last 10 messages)
        if len(context) > 11:  # 1 system message + 10 conversation messages
            context = [context[0]] + context[-10:]
            self._session_contexts[session_id] = context
    
    def clear_context(self, session_id: str):
        """Clear the conversation context for a session
        
        Args:
            session_id: The terminal session ID
        """
        if session_id in self._session_contexts:
            # Keep the system message
            system_message = self._session_contexts[session_id][0]
            self._session_contexts[session_id] = [system_message]
    
    def set_provider_and_model(self, provider: str, model: str):
        """Set the LLM provider and model
        
        Args:
            provider: Provider ID (e.g., 'claude', 'openai')
            model: Model ID (e.g., 'claude-3-sonnet-20240229')
        """
        self.provider = provider
        self.model = model
        
        # Update the config
        self.config.set("llm.provider", provider)
        self.config.set("llm.model", model)
        
        logger.info(f"Set LLM provider to {provider} and model to {model}")
    
    async def get_available_providers(self) -> Dict[str, Dict[str, Any]]:
        """Get all available LLM providers and their models from the LLM Adapter
        
        Returns:
            Dict of provider information
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.adapter_url}/providers", timeout=2.0) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("providers", {})
                    else:
                        logger.warning(f"Failed to get providers from LLM Adapter: {response.status}")
        except Exception as e:
            logger.warning(f"Error getting providers from LLM Adapter: {e}")
        
        # Fallback to config
        return self.config.get_all_llm_providers()
    
    def get_current_provider_and_model(self) -> Tuple[str, str]:
        """Get the current provider and model
        
        Returns:
            Tuple of (provider, model)
        """
        return (self.provider, self.model)
    
    async def analyze_command(self, session_id: str, command: str) -> Optional[str]:
        """Analyze a command and provide assistance
        
        Args:
            session_id: The terminal session ID
            command: The command to analyze
            
        Returns:
            The LLM response, or None if an error occurred
        """
        prompt = f"Please explain this command concisely: {command}"
        try:
            # Add the command to the context
            self.add_message(session_id, prompt)
            
            # Get the context for this session
            context = self._get_session_context(session_id)
            
            # Make a request to the LLM adapter
            response = await self._request_llm_response(context, session_id)
            
            # Add the response to the context
            if response:
                self.add_message(session_id, response, role="assistant")
                
            return response
        except Exception as e:
            logger.error(f"Error analyzing command: {e}")
            return f"Error analyzing command: {str(e)}"
    
    async def analyze_output(self, session_id: str, command: str, output: str) -> Optional[str]:
        """Analyze command output and provide assistance
        
        Args:
            session_id: The terminal session ID
            command: The command that was run
            output: The command output
            
        Returns:
            The LLM response, or None if an error occurred
        """
        # Trim output if it's too long
        if len(output) > 4000:
            output = output[:2000] + "...[output truncated]..." + output[-2000:]
            
        prompt = (
            f"Please explain the output of this command: {command}\n\n"
            f"Output:\n{output}"
        )
        
        try:
            # Add the prompt to the context
            self.add_message(session_id, prompt)
            
            # Get the context for this session
            context = self._get_session_context(session_id)
            
            # Make a request to the LLM adapter
            response = await self._request_llm_response(context, session_id)
            
            # Add the response to the context
            if response:
                self.add_message(session_id, response, role="assistant")
                
            return response
        except Exception as e:
            logger.error(f"Error analyzing output: {e}")
            return f"Error analyzing output: {str(e)}"
    
    async def _request_llm_response(self, context: List[Dict[str, str]], session_id: str) -> Optional[str]:
        """Make a request to the LLM adapter
        
        Args:
            context: The conversation context
            session_id: The terminal session ID
            
        Returns:
            The LLM response, or None if an error occurred
        """
        try:
            # Try to use the HTTP API first
            return await self._request_http_llm_response(context)
        except Exception as http_error:
            logger.warning(f"HTTP request failed, trying WebSocket: {http_error}")
            try:
                # Fall back to WebSocket API
                return await self._request_ws_llm_response(context, session_id)
            except Exception as ws_error:
                logger.error(f"WebSocket request also failed: {ws_error}")
                
                # Fall back to simulated response if both methods fail
                return (
                    f"I'm currently unable to connect to the LLM adapter service. "
                    f"Please check the connection to the service at {self.adapter_url} "
                    f"and make sure it's running properly."
                )
    
    async def _request_http_llm_response(self, context: List[Dict[str, str]]) -> Optional[str]:
        """Make a request to the LLM adapter using HTTP
        
        Args:
            context: The conversation context
            
        Returns:
            The LLM response, or None if an error occurred
        """
        async with aiohttp.ClientSession() as session:
            # Construct the message payload
            user_message = context[-1]["content"]  # Get the last user message
            
            payload = {
                "message": user_message,
                "context_id": "terma",
                "streaming": False,
                "options": {
                    "model": self.model,
                    "provider": self.provider,
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            }
            
            # Make the request
            async with session.post(f"{self.adapter_url}/message", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("message", "No response from LLM adapter")
                else:
                    error_text = await response.text()
                    raise Exception(f"HTTP error {response.status}: {error_text}")
    
    async def _request_ws_llm_response(self, context: List[Dict[str, str]], session_id: str) -> Optional[str]:
        """Make a request to the LLM adapter using WebSocket
        
        Args:
            context: The conversation context
            session_id: The terminal session ID
            
        Returns:
            The LLM response, or None if an error occurred
        """
        # Acquire a lock to ensure only one connection attempt at a time
        async with self._connection_lock:
            # Check if we have an active connection
            if self._ws_connection is None or self._ws_connection.closed:
                try:
                    # Connect to the WebSocket server
                    self._ws_connection = await websockets.connect(self.adapter_ws_url)
                    
                    # Register with the server
                    register_msg = {
                        "type": "REGISTER",
                        "source": "TERMA",
                        "timestamp": asyncio.get_event_loop().time(),
                        "payload": {
                            "client_id": f"terma_{session_id}",
                            "capabilities": ["llm_requests"]
                        }
                    }
                    await self._ws_connection.send(json.dumps(register_msg))
                    
                    # Wait for registration response
                    response = await self._ws_connection.recv()
                    response_data = json.loads(response)
                    
                    if response_data.get("type") != "RESPONSE" or \
                       "registered" not in response_data.get("payload", {}).get("status", ""):
                        raise Exception(f"Failed to register with LLM adapter: {response_data}")
                    
                except Exception as e:
                    logger.error(f"Failed to connect to WebSocket server: {e}")
                    self._ws_connection = None
                    raise
            
            # Get the user message
            user_message = context[-1]["content"]
            
            # Send the LLM request
            request_msg = {
                "type": "LLM_REQUEST",
                "source": "TERMA",
                "timestamp": asyncio.get_event_loop().time(),
                "payload": {
                    "message": user_message,
                    "context": "terma",
                    "streaming": False,
                    "options": {
                        "model": self.model,
                        "provider": self.provider,
                        "temperature": 0.7,
                        "max_tokens": 500
                    }
                }
            }
            
            try:
                await self._ws_connection.send(json.dumps(request_msg))
                
                # Wait for the response
                full_response = ""
                message_complete = False
                
                # Keep receiving messages until we get a response
                while not message_complete:
                    try:
                        response = await asyncio.wait_for(self._ws_connection.recv(), timeout=30.0)
                        response_data = json.loads(response)
                        
                        msg_type = response_data.get("type", "")
                        
                        if msg_type == "RESPONSE":
                            # Got a complete response
                            full_response = response_data.get("payload", {}).get("message", "")
                            message_complete = True
                            
                        elif msg_type == "UPDATE":
                            # Check if typing status update
                            is_typing = response_data.get("payload", {}).get("isTyping", None)
                            if is_typing is not None:
                                continue
                                
                            # Check if it's a chunk update
                            chunk = response_data.get("payload", {}).get("chunk", "")
                            if chunk:
                                full_response += chunk
                                
                            # Check if it's the final chunk
                            done = response_data.get("payload", {}).get("done", False)
                            if done:
                                message_complete = True
                                
                        elif msg_type == "ERROR":
                            # Got an error
                            error_msg = response_data.get("payload", {}).get("error", "Unknown error")
                            raise Exception(f"LLM adapter error: {error_msg}")
                    except asyncio.TimeoutError:
                        raise Exception("Timeout waiting for LLM adapter response")
                
                return full_response
            except Exception as e:
                logger.error(f"Error communicating with WebSocket server: {e}")
                # Close the connection so we'll try to reconnect next time
                if self._ws_connection:
                    await self._ws_connection.close()
                    self._ws_connection = None
                raise