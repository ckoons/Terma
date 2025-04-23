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

- [Architecture](./docs/architecture.md): System design and component interactions
- [API Reference](./docs/api_reference.md): API reference for both REST and WebSocket interfaces
- [Integration](./docs/integration.md): How to integrate with other Tekton components
- [Usage](./docs/usage.md): Detailed usage examples for both embedded and standalone modes

### Implementation Documentation

- [Implementation Guide](/MetaData/Implementation/TermaImplementation.md): Comprehensive implementation documentation
- [Integration Points](/MetaData/Implementation/TermaIntegrationPoints.md): Detailed integration interfaces and protocols
- [Vision & Concepts](/MetaData/Implementation/TermaVision.md): Conceptual overview and long-term vision

### Project Status

- [PHASE3_COMPLETED.md](./PHASE3_COMPLETED.md): Summary of completed Phase 3 implementation
- [PHASE4_PLANNING.md](./PHASE4_PLANNING.md): Planning document for Phase 4 implementation

### Documentation Hierarchy

The Terma documentation follows a hierarchical structure:

1. **Top-level Understanding** (for new developers/AI sessions):
   - **[TermaImplementation.md](/MetaData/Implementation/TermaImplementation.md)**: Comprehensive implementation details
   - **[TermaVision.md](/MetaData/Implementation/TermaVision.md)**: Conceptual overview and future direction
   - **[getting_started.md](./docs/getting_started.md)**: How to install and begin development

2. **Specialized References**:
   - **[TermaIntegrationPoints.md](/MetaData/Implementation/TermaIntegrationPoints.md)**: Integration APIs and protocols
   - **[api_reference.md](./docs/api_reference.md)**: Detailed API documentation
   - **[architecture.md](./docs/architecture.md)**: Technical system architecture

3. **User Guides**:
   - **[usage.md](./docs/usage.md)**: End-user documentation
   - **[installation.md](./docs/installation.md)**: Installation instructions

### Documentation Changes and Recommendations

We've recently reorganized the documentation to improve clarity and comprehensiveness:

1. **Consolidated Implementation Documentation**:
   - Combined implementation details into a comprehensive guide
   - Added code examples and troubleshooting information
   - Updated status and next steps information

2. **Combined Installation and Developer Guide**:
   - Created a unified getting_started.md that covers both installation and development
   - Added quick start examples and workflow guidelines

3. **Maintained Specialized Documentation**:
   - Kept integration points as a standalone technical reference
   - Preserved vision document for conceptual understanding
   - Maintained API and architecture docs for specialized reference

For new developers and AI assistants, we recommend starting with:
1. **[TermaImplementation.md](/MetaData/Implementation/TermaImplementation.md)** for comprehensive implementation details
2. **[TermaIntegrationPoints.md](/MetaData/Implementation/TermaIntegrationPoints.md)** for integration information
3. **[getting_started.md](./docs/getting_started.md)** for installation and development setup

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
EOF < /dev/null