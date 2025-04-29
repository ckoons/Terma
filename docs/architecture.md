# Terma Architecture

## Overview

Terma is a terminal integration system for the Tekton ecosystem that provides rich terminal functionality with PTY-based terminal sessions, WebSocket communication, LLM assistance, and UI integration. It serves as a comprehensive terminal solution that can be embedded in other applications (particularly the Hephaestus UI) or used as a standalone service.

## System Architecture

Terma follows a layered architecture with clear separation of concerns:

```
┌───────────────────────────────────────────┐
│                   UI Layer                │
│ (terma-component.html, terma-terminal.js) │
└───────────────────────────────────────────┘
                     ▲
                     │
                     ▼
┌───────────────────────────────────────────┐
│               API Layer                   │
│       (app.py, websocket.py, ui_server.py)│
└───────────────────────────────────────────┘
                     ▲
                     │
                     ▼
┌───────────────────────────────────────────┐
│               Core Layer                  │
│ (terminal.py, session_manager.py, llm_adapter.py) │
└───────────────────────────────────────────┘
                     ▲
                     │
                     ▼
┌───────────────────────────────────────────┐
│           Integration Layer               │
│       (hermes_integration.py)             │
└───────────────────────────────────────────┘
```

### Core Layer

The core layer handles terminal session management, PTY processes, and interactions with LLMs.

#### Key Components:

1. **TerminalSession** (`terminal.py`): Manages individual terminal sessions with PTY (pseudoterminal) interfaces. Handles starting, stopping, reading from, and writing to terminal processes.

2. **SessionManager** (`session_manager.py`): Creates, manages, and monitors multiple terminal sessions. Handles session creation, closing, and idle session cleanup.

3. **LLMAdapter** (`llm_adapter.py`): Facilitates communication with language models for terminal assistance. Supports multiple providers and models through a unified interface.

### API Layer

The API layer exposes the core functionality through HTTP and WebSocket interfaces.

#### Key Components:

1. **FastAPI Application** (`app.py`): Provides REST API endpoints for terminal session management, including creating, listing, and closing sessions, as well as reading from and writing to sessions.

2. **WebSocket Server** (`websocket.py`): Manages real-time bidirectional communication for terminal I/O, supporting features like streaming output and immediate input.

3. **UI Server** (`ui_server.py`): Serves the terminal UI components and handles static assets.

### UI Layer

The UI layer provides the visual interface for users to interact with terminal sessions.

#### Key Components:

1. **Terma Component** (`terma-component.html`, `terma-component.js`): A web component for embedding in the Hephaestus UI, providing a rich terminal experience with xterm.js integration.

2. **Terminal JS** (`terma-terminal.js`): JavaScript library for terminal functionality, handling rendering, input, output, and WebSocket communication.

3. **CSS Styles** (`terma-terminal.css`): Styling for the terminal interface.

### Integration Layer

The integration layer connects Terma with other Tekton components, particularly the Hermes messaging system.

#### Key Components:

1. **Hermes Integration** (`hermes_integration.py`): Registers Terma with Hermes service discovery, handles messages from other components, and publishes events.

## Communication Flows

### Terminal Session Communication

```
User Input ──► UI Component ──► WebSocket ──► WebSocket Server ──► Session Manager ──► Terminal Session ──► PTY Process
                                                                                                              │
Terminal Output ◄── UI Component ◄── WebSocket ◄── WebSocket Server ◄── Session Manager ◄── Terminal Session ◄┘
```

### LLM Assistance Flow

```
User Query ──► UI Component ──► WebSocket ──► WebSocket Server ──► Session Manager ──► LLM Adapter ──► LLM Provider
                                                                                                          │
LLM Response ◄── UI Component ◄── WebSocket ◄── WebSocket Server ◄── Session Manager ◄── LLM Adapter ◄───┘
```

## Technical Implementation Details

### PTY Process Management

Terma uses the `ptyprocess` library to create and manage pseudo-terminal processes. This allows for:

- Running interactive applications that require a TTY
- Handling terminal control sequences
- Supporting terminal resizing
- Managing process lifecycles

### WebSocket Communication

Terma implements a WebSocket protocol for bidirectional communication between the UI and terminal sessions:

- **Message Types**:
  - `input`: Terminal input from the user
  - `output`: Terminal output to the UI
  - `resize`: Terminal resize events
  - `error`: Error messages
  - `llm_assist`: LLM assistance requests
  - `llm_response`: LLM responses

### LLM Integration

The LLM Adapter supports different LLM providers and models:

- **HTTP API**: For synchronous requests
- **WebSocket API**: For streaming responses
- **Provider Management**: Selection between different LLM providers (Claude, OpenAI, etc.)
- **Context Management**: Maintaining conversation context for better assistance

### Session Management

The Session Manager provides:

- Session creation with different shell commands
- Session cleanup for idle sessions
- Session reconnection
- Resource management
- Session information tracking

## Configuration

Terma can be configured through environment variables and configuration files:

- **Port Configuration**: Default HTTP port 8765, WebSocket port 8767
- **LLM Configuration**: Provider, model, and connection details
- **Session Configuration**: Idle timeout, cleanup interval
- **UI Configuration**: Theme, font, and other display options

## Single Port Architecture Integration

Terma follows the Tekton Single Port Architecture pattern:

- **HTTP Endpoints**: Available at `/api/*` 
- **WebSocket Endpoint**: Available at `/ws/{session_id}`
- **UI Endpoints**: Available at `/terminal/launch`
- **Standard Environment Variables**: Used for port configuration
- **Graceful Degradation**: When LLM services are unavailable

The component works on its assigned port (8767) but can be accessed through path-based routing when deployed behind a proxy in the integrated Tekton environment.