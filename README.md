# Terma: Terminal Integration for Tekton

Terma is an advanced terminal system designed for integration with the Tekton ecosystem. It provides rich terminal functionality with features such as PTY-based terminal sessions, WebSocket communication, LLM assistance, and Hephaestus UI integration.

![Terma Terminal](./images/icon.jpg)

## Features

- **PTY-based Terminal**: Full terminal emulation with support for interactive applications
- **WebSocket Communication**: Real-time terminal interaction with reconnection support
- **Session Management**: Create, manage, and monitor terminal sessions with recovery
- **LLM Assistance**: AI-powered help with terminal commands and output analysis
- **Hermes Integration**: Seamless communication with other Tekton components
- **Hephaestus UI Integration**: Rich terminal UI with theme support
- **Multiple LLM Providers**: Support for Claude, OpenAI, and other LLM services
- **Markdown Rendering**: Beautiful rendering of LLM responses with syntax highlighting
- **Single Port Architecture**: Compatible with Tekton's unified port management system

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Tekton.git
cd Tekton/Terma

# Install dependencies
./setup.sh

# Start the server
python -m terma.cli.main
```

### Basic Usage

Create a terminal session:

```bash
curl -X POST http://localhost:8765/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"shell_command": "/bin/bash"}'
```

Connect to the terminal via WebSocket:

```javascript
const socket = new WebSocket("ws://localhost:8765/ws/your-session-id");

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "output") {
        console.log(message.data);
    }
};

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

Then open Hephaestus and select the Terma Terminal component.

## Documentation

### Core Documentation

- [Getting Started](./docs/getting_started.md): Quick start guide for new users and developers
- [Architecture](./docs/architecture.md): System design and component interactions
- [API Reference](./docs/api_reference.md): Comprehensive API documentation for REST and WebSocket interfaces
- [Integration](./docs/integration.md): How to integrate with other Tekton components
- [Usage](./docs/usage.md): Detailed usage examples for both embedded and standalone modes
- [Installation](./docs/installation.md): Complete installation and configuration instructions
- [Developer Guide](./docs/developer_guide.md): Guide for developers who want to extend or modify Terma

### Single Port Architecture

Terma follows the Tekton Single Port Architecture pattern, providing standardized endpoints:

- **HTTP API**: Available at `/api/*` endpoints
- **WebSocket**: Available at `/ws/{session_id}` endpoint 
- **UI**: Available at `/terminal/launch` endpoint

The API is designed to work seamlessly when deployed behind a proxy with path-based routing, following the ecosystem's standardized port allocation scheme.

### Component Interaction

Terma interacts with other Tekton components through:

1. **Hermes**: For service discovery and message passing
2. **LLM Adapter**: For AI-assisted terminal capabilities 
3. **Hephaestus UI**: For visual presentation and user interaction

## System Requirements

- Python 3.8 or higher
- FastAPI and Uvicorn
- WebSockets support
- PTY process support (Linux, macOS, or WSL on Windows)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Terma is part of the Tekton ecosystem, an intelligent orchestration system that coordinates multiple AI models and resources.
- Special thanks to the Tekton team for their support and collaboration.