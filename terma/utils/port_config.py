"""
Port configuration utilities for Terma component.

This module provides functions to standardize port configuration
according to the Tekton Single Port Architecture pattern.
"""

import os
import logging

logger = logging.getLogger(__name__)

# Standard port assignments based on Tekton Single Port Architecture
PORT_ASSIGNMENTS = {
    "hephaestus": 8080,
    "engram": 8000,
    "hermes": 8001,
    "ergon": 8002,
    "rhetor": 8003,
    "terma": 8004,
    "athena": 8005,
    "prometheus": 8006,
    "harmonia": 8007,
    "telos": 8008,
    "synthesis": 8009,
    "tekton_core": 8010,
    "llm_adapter": 8300,
    "terma_ws": 8767,  # Legacy WebSocket port for Terma
}

# Environment variable names for each component
ENV_VAR_NAMES = {
    "hephaestus": "HEPHAESTUS_PORT",
    "engram": "ENGRAM_PORT",
    "hermes": "HERMES_PORT",
    "ergon": "ERGON_PORT",
    "rhetor": "RHETOR_PORT",
    "terma": "TERMA_PORT",
    "athena": "ATHENA_PORT",
    "prometheus": "PROMETHEUS_PORT",
    "harmonia": "HARMONIA_PORT",
    "telos": "TELOS_PORT",
    "synthesis": "SYNTHESIS_PORT", 
    "tekton_core": "TEKTON_CORE_PORT",
    "llm_adapter": "LLM_ADAPTER_HTTP_PORT",
    "terma_ws": "TERMA_WS_PORT",
}

def get_component_port(component_id):
    """
    Get the port for a specific component based on Tekton port standards.
    
    Args:
        component_id (str): The component identifier (e.g., "rhetor", "hermes")
        
    Returns:
        int: The port number for the component
    """
    if component_id not in ENV_VAR_NAMES:
        logger.warning(f"Unknown component ID: {component_id}, using default port 8000")
        return 8000
        
    env_var = ENV_VAR_NAMES[component_id]
    default_port = PORT_ASSIGNMENTS[component_id]
    
    try:
        return int(os.environ.get(env_var, default_port))
    except (ValueError, TypeError):
        logger.warning(f"Invalid port value in {env_var}, using default: {default_port}")
        return default_port

def get_terma_port():
    """
    Get the configured port for the Terma component.
    
    Returns:
        int: The port number for Terma (default 8004)
    """
    return get_component_port("terma")

def get_terma_ws_port():
    """
    Get the configured WebSocket port for Terma.
    
    Returns:
        int: The WebSocket port for Terma (default 8767)
    """
    return get_component_port("terma_ws")

def get_hermes_port():
    """
    Get the configured port for the Hermes component.
    
    Returns:
        int: The port number for Hermes (default 8001)
    """
    return get_component_port("hermes")

def get_component_url(component_id, protocol="http", path=""):
    """
    Get the full URL for a component endpoint.
    
    Args:
        component_id (str): The component identifier
        protocol (str): The protocol (http or ws)
        path (str): The path part of the URL (should start with /)
        
    Returns:
        str: The full URL for the component endpoint
    """
    host = os.environ.get(f"{component_id.upper()}_HOST", "localhost")
    port = get_component_port(component_id)
    
    if not path.startswith("/") and path:
        path = f"/{path}"
        
    return f"{protocol}://{host}:{port}{path}"

def get_api_url(component_id, path=""):
    """
    Get the API URL for a component.
    
    Args:
        component_id (str): The component identifier
        path (str): The API path (without /api prefix)
        
    Returns:
        str: The full API URL
    """
    api_path = f"/api{path}" if path else "/api"
    return get_component_url(component_id, protocol="http", path=api_path)

def get_ws_url(component_id, path=""):
    """
    Get the WebSocket URL for a component.
    
    Args:
        component_id (str): The component identifier
        path (str): The WebSocket path (without /ws prefix)
        
    Returns:
        str: The full WebSocket URL
    """
    ws_path = f"/ws{path}" if path else "/ws"
    return get_component_url(component_id, protocol="ws", path=ws_path)

def get_hermes_api_url():
    """
    Get the URL for the Hermes API.
    
    Returns:
        str: The Hermes API URL
    """
    # First check for the specific environment variable
    hermes_url = os.environ.get("HERMES_API_URL", None)
    if hermes_url:
        return hermes_url
    
    # Otherwise, build the URL using the standard pattern
    return get_api_url("hermes")