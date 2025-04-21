# Terma Developer Guide

## Project Structure

The Terma project follows this structure:

```
Terma/
├── docs/                   # Documentation
├── examples/               # Usage examples
├── images/                 # Images and icons
├── terma/                  # Main package
│   ├── api/                # API interfaces
│   │   ├── app.py          # FastAPI application
│   │   └── websocket.py    # WebSocket server
│   ├── cli/                # Command-line tools
│   │   ├── launch.py       # Terminal launcher
│   │   └── main.py         # Main CLI entry point
│   ├── core/               # Core functionality
│   │   ├── terminal.py     # Terminal session
│   │   └── session_manager.py # Session management
│   ├── integrations/       # Integration with other components
│   │   └── hermes_integration.py # Hermes integration
│   └── utils/              # Utility functions
│       ├── config.py       # Configuration management
│       └── logging.py      # Logging utilities
├── tests/                  # Tests
├── LICENSE                 # License file
├── README.md               # Project readme
├── register_with_hermes.py # Hermes registration script
├── requirements.txt        # Package dependencies
├── setup.py                # Package setup script
└── setup.sh                # Setup script
```

## Development Environment

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/username/Terma.git
   cd Terma
   ```

2. Create a virtual environment:
   ```bash
   uv venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies in development mode:
   ```bash
   uv pip install -e .
   ```

### Running Tests

Run tests using pytest:

```bash
python -m pytest
```

Run tests with coverage:

```bash
python -m pytest --cov=terma tests/
```

## Development Workflow

### Adding a New Feature

1. Create a new branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Implement the feature

3. Add tests

4. Run tests to ensure they pass

5. Submit a pull request

### Coding Standards

- Follow PEP 8 coding style
- Use f-strings for string formatting
- Add docstrings for all functions and classes
- Add type hints to function signatures
- Follow the existing architecture patterns

## Terminal Session Implementation

The core of Terma is the terminal session implementation. Here's an overview of how it works:

### PTY Interface

Terma uses the `ptyprocess` library to create a pseudo-terminal (PTY) that connects to the user's shell. This allows full terminal capabilities including control sequences, color, etc.

```python
from ptyprocess import PtyProcess

pty = PtyProcess.spawn(['/bin/bash'])
pty.write('ls -la\n')
output = pty.read()
```

### WebSocket Communication

Browser terminals communicate with the PTY through WebSockets. The WebSocket server streams data between the browser and the PTY.

```python
async def handle_websocket(websocket, path):
    # Extract session_id from path
    session = get_session(session_id)
    
    # Set up background task to read from PTY and send to WebSocket
    asyncio.create_task(read_from_pty(session, websocket))
    
    # Handle messages from WebSocket
    async for message in websocket:
        data = json.loads(message)
        if data['type'] == 'input':
            session.write(data['data'])
```

### Session Management

The SessionManager tracks all active terminal sessions and handles their lifecycle.

```python
class SessionManager:
    def __init__(self):
        self.sessions = {}
        
    def create_session(self, session_id=None, shell_command=None):
        # Create a new session with the given ID or generate one
        # Initialize the PTY
        # Store in sessions dictionary
        return session_id
```

## UI Integration

The browser terminal UI is implemented using xterm.js and integrated into the Hephaestus UI. The UI code will be in the Hephaestus component but needs to communicate with Terma.

```javascript
const term = new Terminal();
term.open(document.getElementById('terminal'));

const socket = new WebSocket(`ws://localhost:8765/ws/${sessionId}`);

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'output') {
        term.write(data.data);
    }
};

term.onData((data) => {
    socket.send(JSON.stringify({
        type: 'input',
        data: data
    }));
});
```

## LLM Integration

Terma integrates with Tekton's LLM services through the Hermes message bus. When a user requests LLM assistance, Terma sends a message to Hermes, which routes it to the appropriate LLM service.

```python
async def request_llm_assistance(command, context):
    message = {
        "type": "llm_request",
        "command": command,
        "context": context
    }
    response = await hermes_client.send_message("llm.analyze_command", message)
    return response
```

## Future Development

- **Rhetor Integration**: Planned for future development
- **Multi-user Sessions**: Shared terminal sessions
- **Terminal Recording**: Recording and playback of terminal sessions
- **Advanced Terminal Features**: Split panes, tabs, etc.
