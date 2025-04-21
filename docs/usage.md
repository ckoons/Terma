# Terma Usage Guide

This guide explains how to use Terma, the terminal integration system for Tekton.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Terminal Sessions](#terminal-sessions)
4. [Hephaestus UI Integration](#hephaestus-ui-integration)
5. [CLI Tools](#cli-tools)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Python 3.8 or higher
- FastAPI and Uvicorn
- WebSockets support
- PTY process support

### Installing Terma

1. Clone the repository:

```bash
git clone https://github.com/yourusername/Tekton.git
cd Tekton/Terma
```

2. Install dependencies:

```bash
# Using the setup script
./setup.sh

# Or manually
pip install -e .
```

3. Start the Terma service:

```bash
# Using Python
python -m terma.cli.main

# Using the launcher script
./run_terma.sh
```

## Basic Usage

Terma provides a terminal service that can be accessed via API, WebSocket, or the Hephaestus UI.

### Using the REST API

Create a terminal session:

```bash
curl -X POST http://localhost:8765/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"shell_command": "/bin/bash"}'
```

This returns a session ID that you can use for further operations:

```json
{
  "session_id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
  "created_at": 1712345678.9
}
```

Write to the terminal:

```bash
curl -X POST http://localhost:8765/api/sessions/f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l/write \
  -H "Content-Type: application/json" \
  -d '{"data": "ls -la\n"}'
```

Read from the terminal:

```bash
curl -X GET http://localhost:8765/api/sessions/f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l/read
```

Close the session when done:

```bash
curl -X DELETE http://localhost:8765/api/sessions/f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l
```

### Using the Python Client

```python
from terma.client import TermaClient

async def main():
    # Create client
    client = TermaClient("http://localhost:8765")
    
    # Create session
    session = await client.create_session(shell_command="/bin/bash")
    session_id = session["session_id"]
    
    # Write to session
    await client.write_to_session(session_id, "ls -la\n")
    
    # Read from session
    response = await client.read_from_session(session_id)
    print(response["data"])
    
    # Close session
    await client.close_session(session_id)
```

## Terminal Sessions

Terma manages terminal sessions that run as PTY processes on the server.

### Session Lifecycle

1. **Creation**: A new session is created with a unique ID
2. **Execution**: Commands are sent to the session and output is received
3. **Idle**: Sessions become idle when not used for a period
4. **Cleanup**: Idle sessions are automatically cleaned up

### Session Types

Terma supports different types of terminal sessions:

1. **Default Shell**: Uses the default system shell
2. **Specific Shell**: Uses a specified shell like bash, zsh, etc.
3. **Command Execution**: Runs a specific command or program

### Session Management

List all active sessions:

```bash
curl -X GET http://localhost:8765/api/sessions
```

Get information about a specific session:

```bash
curl -X GET http://localhost:8765/api/sessions/f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l
```

## Hephaestus UI Integration

Terma integrates with the Hephaestus UI system to provide a rich terminal interface.

### Installation

To install Terma in Hephaestus:

```bash
# From the Terma directory
./install_in_hephaestus.sh
```

### Using the Terminal UI

1. **Open Hephaestus**: Launch the Hephaestus UI
2. **Select Terma**: Click on the Terma Terminal component in the sidebar
3. **Create Session**: A new terminal session will be created automatically
4. **Use Terminal**: Type commands as you would in a regular terminal

### Terminal Features

The Terma terminal in Hephaestus provides several features:

1. **Session Management**: Create, select, and close sessions
2. **Terminal Types**: Choose between different shell types
3. **Settings**: Customize terminal appearance and behavior
4. **LLM Assistance**: Get help with terminal commands
5. **Detachable Terminals**: Open terminals in separate windows

### Terminal Settings

You can customize the terminal by clicking the settings button (gear icon):

- **Font Size**: Adjust the terminal font size
- **Font Family**: Choose a different font
- **Theme**: Select from various color themes
- **Cursor Style**: Choose between block, bar, or underline
- **Scrollback**: Enable/disable scrollback and set buffer size
- **Terminal Mode**: Switch between advanced and simple terminal modes

### LLM Assistance

The Terma terminal provides LLM assistance for command help:

1. **Command Explanation**: Type `?command` to get an explanation
   ```
   ?docker run -it --rm ubuntu
   ```

2. **Output Analysis**: Run a command followed by `?` to analyze output
   ```
   ls -la /etc ?
   ```

3. **Assistance Panel**: View detailed explanations in the LLM assistance panel

## CLI Tools

Terma provides command-line tools for terminal management.

### Launching External Terminals

Launch a terminal in a separate window:

```bash
python -m terma.cli.launch
```

With specific options:

```bash
python -m terma.cli.launch --shell python --size 80x24
```

### Managing Sessions

List active sessions:

```bash
python -m terma.cli.main list
```

Create a new session:

```bash
python -m terma.cli.main create --shell /bin/bash
```

Close a session:

```bash
python -m terma.cli.main close --session-id f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l
```

## Advanced Features

### WebSocket Communication

For real-time terminal interaction, connect to the WebSocket endpoint:

```javascript
// Connect to terminal WebSocket
const socket = new WebSocket("ws://localhost:8765/ws/session-id");

// Handle messages
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message);
};

// Send input
socket.send(JSON.stringify({
    type: "input",
    data: "ls -la\n"
}));

// Resize terminal
socket.send(JSON.stringify({
    type: "resize",
    rows: 24,
    cols: 80
}));
```

### Hermes Integration

Terma registers capabilities with Hermes for ecosystem integration:

```bash
# Register Terma with Hermes
python register_with_hermes.py
```

Other components can then use Terma capabilities:

```python
import requests

# Send message to Hermes
response = requests.post(
    "http://localhost:8000/api/message",
    json={
        "id": "msg123",
        "source": "MyComponent",
        "target": "Terma",
        "command": "terminal.create",
        "timestamp": 1712345678.9,
        "payload": {
            "shell_command": "/bin/bash"
        }
    }
)
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the Terma service is running
   - Check the server address and port

2. **Session Not Found**
   - Session may have expired or been cleaned up
   - Create a new session

3. **WebSocket Connection Fails**
   - Check WebSocket URL format (ws://host:port/ws/session-id)
   - Ensure the session exists

4. **PTY Process Errors**
   - Check shell path or command
   - Verify system PTY support

### Logging

Terma logs information to help diagnose issues:

```bash
# Enable detailed logging
export TERMA_LOG_LEVEL=DEBUG
python -m terma.cli.main
```

Log files are stored in:
- `/var/log/terma/terma.log` (system-wide installation)
- `./logs/terma.log` (local installation)

### Getting Help

For additional help:

1. Check the documentation in the `docs/` directory
2. Look for error messages in the logs
3. Submit issues to the repository
EOF < /dev/null