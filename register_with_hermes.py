#!/usr/bin/env python3
"""
Register Terma with Hermes message bus
"""

import argparse
import json
import os
import sys
import requests
from pathlib import Path

# Default Hermes API URL
DEFAULT_HERMES_URL = "http://localhost:8000"

# Registration data
REGISTRATION_DATA = {
    "name": "Terma",
    "description": "Terminal integration system for Tekton",
    "version": "0.1.0",
    "capabilities": [
        {
            "name": "terminal.create",
            "description": "Create a new terminal session",
            "parameters": {
                "shell_command": {
                    "type": "string",
                    "description": "Optional shell command to run",
                    "required": False
                }
            },
            "returns": {
                "session_id": {
                    "type": "string",
                    "description": "ID of the created session"
                }
            }
        },
        {
            "name": "terminal.close",
            "description": "Close a terminal session",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "ID of the session to close",
                    "required": True
                }
            },
            "returns": {
                "status": {
                    "type": "string",
                    "description": "Operation status"
                }
            }
        },
        {
            "name": "terminal.write",
            "description": "Write data to a terminal session",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "ID of the session to write to",
                    "required": True
                },
                "data": {
                    "type": "string",
                    "description": "Data to write",
                    "required": True
                }
            },
            "returns": {
                "status": {
                    "type": "string",
                    "description": "Operation status"
                }
            }
        },
        {
            "name": "terminal.read",
            "description": "Read data from a terminal session",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "ID of the session to read from",
                    "required": True
                }
            },
            "returns": {
                "data": {
                    "type": "string",
                    "description": "Terminal output data"
                }
            }
        }
    ],
    "endpoints": {
        "api": "http://localhost:8765/api",
        "websocket": "ws://localhost:8765/ws"
    }
}

def register_with_hermes(hermes_url, registration_path):
    """Register Terma with Hermes
    
    Args:
        hermes_url: URL of Hermes API
        registration_path: Path to save the registration file
    """
    try:
        # Save registration file
        registration_file = Path(registration_path)
        registration_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(registration_file, 'w') as f:
            json.dump(REGISTRATION_DATA, f, indent=2)
        
        print(f"Saved registration data to {registration_file}")
        
        # Register with Hermes
        registration_url = f"{hermes_url}/api/register"
        response = requests.post(registration_url, json=REGISTRATION_DATA)
        
        if response.status_code == 200:
            print(f"Successfully registered Terma with Hermes")
            print(response.json())
            return True
        else:
            print(f"Error registering with Hermes: {response.status_code}")
            print(response.text)
            return False
    
    except Exception as e:
        print(f"Error during registration: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Register Terma with Hermes")
    parser.add_argument("--hermes-url", default=DEFAULT_HERMES_URL,
                       help=f"Hermes API URL (default: {DEFAULT_HERMES_URL})")
    parser.add_argument("--save-path", default="./terma_registration.json",
                       help="Path to save registration data")
    parser.add_argument("--dry-run", action="store_true",
                       help="Save registration file without contacting Hermes")
    
    args = parser.parse_args()
    
    if args.dry_run:
        # Save registration file only
        registration_file = Path(args.save_path)
        registration_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(registration_file, 'w') as f:
            json.dump(REGISTRATION_DATA, f, indent=2)
        
        print(f"Saved registration data to {registration_file} (dry run)")
        return 0
    else:
        # Register with Hermes
        success = register_with_hermes(args.hermes_url, args.save_path)
        return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())