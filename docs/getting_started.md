# Terma Getting Started Guide

This guide covers installation and initial development with the Terma terminal component for Tekton.

## Installation

### Prerequisites

- Python 3.10 or higher
- UV package manager (recommended)
- For native terminal features: tmux or screen
- Node.js (for development of UI components)

### Installation Options

#### Option 1: Using the Tekton component installer (Recommended)

The easiest way to install Terma is using the Tekton component installer:

```bash
./component-setup.sh Terma
```

This will:
1. Create a virtual environment
2. Install all dependencies using UV
3. Install Terma in development mode
4. Register Terma with Hermes

#### Option 2: Manual Installation

For a manual installation:

```bash
# Clone the repository if you haven't already
git clone https://github.com/username/Terma.git
cd Terma

# Run the setup script
./setup.sh
```

The setup script will:
1. Check for and install UV if needed
2. Create a virtual environment in ./venv
3. Install dependencies
4. Set up the basic directory structure

#### Option 3: Development Installation

For development, you may want to install in editable mode:

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in editable mode
uv pip install -e .
```

### Configuration

Terma uses a configuration file located at `~/.terma/config.json`. This file is created automatically on first run, but you can customize it for your needs:

```json
{
  "terminal": {
    "default_shell": "/bin/bash",
    "font_size": 14,
    "theme": "dark"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8765
  }
}
```

### Hermes Integration

To register Terma with Hermes:

```bash
python register_with_hermes.py
```

You can specify a custom Hermes URL with `--hermes-url`.

### Verifying Installation

You can verify that Terma is correctly installed by running:

```bash
python -m terma.cli.main --version
```

This should display the installed version of Terma.

## Development Environment

### Project Structure

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

## Quick Start Examples

### Starting the Terminal Server

```bash
# Start the terminal server
python -m terma.cli.main

# Or with custom configuration
python -m terma.cli.main --config /path/to/config.json
```

### Creating a Terminal Session via API

```bash
# Create a new terminal session
curl -X POST http://localhost:8765/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"shell_command": "/bin/bash"}'
```

### Connecting via WebSocket (JavaScript)

```javascript
// Connect to a terminal session
const socket = new WebSocket("ws://localhost:8765/ws/your-session-id");

// Handle terminal output
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "output") {
        console.log(message.data);
    }
};

// Send terminal input
socket.send(JSON.stringify({
    type: "input",
    data: "ls -la\n"
}));
```

### Hephaestus Integration

To install Terma in Hephaestus:

```bash
./install_in_hephaestus.sh
```

This will integrate the Terma terminal component into the Hephaestus UI.

## Next Steps

- Review the [architecture documentation](./architecture.md) to understand the system design
- Check the [API reference](./api_reference.md) for details on available endpoints
- Explore the [integration guide](./integration.md) for connecting with other Tekton components
- See the [usage documentation](./usage.md) for more detailed examples