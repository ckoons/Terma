"""LLM communication adapter for terminal assistance"""

import asyncio
import json
import logging
import requests
from typing import Dict, Any, Optional, List, Callable, Awaitable

from ..utils.logging import setup_logging

logger = setup_logging()

class LLMAdapter:
    """LLM adapter for terminal assistance
    
    This adapter handles communication with LLMs through various backends.
    It will be enhanced in Phase 2 to work with the Rhetor component.
    """
    
    def __init__(self, adapter_url: Optional[str] = None):
        """Initialize the LLM adapter
        
        Args:
            adapter_url: URL of the LLM adapter service
        """
        self.adapter_url = adapter_url or "http://localhost:8080"
        self._session_contexts: Dict[str, List[Dict[str, str]]] = {}
        
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
                    "content": (
                        "You are a terminal assistant that helps users with command-line tasks. "
                        "Provide concise explanations and suggestions for terminal commands. "
                        "Focus on being helpful, accurate, and security-conscious."
                    )
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
            response = await self._request_llm_response(context)
            
            # Add the response to the context
            if response:
                self.add_message(session_id, response, role="assistant")
                
            return response
        except Exception as e:
            logger.error(f"Error analyzing command: {e}")
            return None
    
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
        if len(output) > 2000:
            output = output[:1000] + "...[output truncated]..." + output[-1000:]
            
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
            response = await self._request_llm_response(context)
            
            # Add the response to the context
            if response:
                self.add_message(session_id, response, role="assistant")
                
            return response
        except Exception as e:
            logger.error(f"Error analyzing output: {e}")
            return None
    
    async def _request_llm_response(self, context: List[Dict[str, str]]) -> Optional[str]:
        """Make a request to the LLM adapter
        
        Args:
            context: The conversation context
            
        Returns:
            The LLM response, or None if an error occurred
        """
        # This is a placeholder for Phase 2 LLM integration
        # In Phase 2, we'll integrate with the Tekton LLM Adapter
        
        # For now, return a placeholder message
        await asyncio.sleep(0.1)  # Simulate a network request
        return "LLM assistance will be implemented in Phase 2."