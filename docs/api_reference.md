# Terma API Reference

This document provides a comprehensive reference for the Terma Terminal API, including both REST and WebSocket interfaces.

## REST API Endpoints

The Terma API is organized into the following categories:

- [Status Endpoints](#status-endpoints)
- [Session Management Endpoints](#session-management-endpoints)
- [Terminal I/O Endpoints](#terminal-io-endpoints)
- [LLM Integration Endpoints](#llm-integration-endpoints)
- [Hermes Integration Endpoints](#hermes-integration-endpoints)
- [UI Integration Endpoints](#ui-integration-endpoints)

### Status Endpoints

#### `GET /`

Root endpoint that returns basic information about the API.

**Response:**
```json
{
  "message": "Terma Terminal API",
  "version": "0.1.0"
}
```

#### `GET /health`

Health check endpoint for monitoring service status.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600.5,
  "version": "0.1.0",
  "active_sessions": 2
}
```

### Session Management Endpoints

#### `GET /api/sessions`

List all active terminal sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "active": true,
      "created_at": 1617184632.54,
      "last_activity": 1617184932.54,
      "shell_command": "/bin/bash",
      "idle_time": 300.0
    }
  ]
}
```

#### `POST /api/sessions`

Create a new terminal session.

**Request Body:**
```json
{
  "shell_command": "/bin/bash"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": 1617184632.54
}
```

#### `GET /api/sessions/{session_id}`

Get information about a specific terminal session.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "active": true,
  "created_at": 1617184632.54,
  "last_activity": 1617184932.54,
  "shell_command": "/bin/bash",
  "idle_time": 300.0
}
```

#### `DELETE /api/sessions/{session_id}`

Close a terminal session.

**Response:**
```json
{
  "status": "success"
}
```

### Terminal I/O Endpoints

#### `POST /api/sessions/{session_id}/write`

Write data to a terminal session.

**Request Body:**
```json
{
  "data": "ls -la\n"
}
```

**Response:**
```json
{
  "status": "success",
  "bytes_written": 7
}
```

#### `GET /api/sessions/{session_id}/read`

Read data from a terminal session.

**Query Parameters:**
- `size` (optional): Maximum number of bytes to read. Default: 1024

**Response:**
```json
{
  "data": "total 128\ndrwxr-xr-x  3 user group  96 Apr  1 10:50 .\n..."
}
```

### LLM Integration Endpoints

#### `GET /api/llm/providers`

Get available LLM providers and models.

**Response:**
```json
{
  "providers": {
    "claude": {
      "name": "Claude",
      "models": [
        {
          "id": "claude-3-sonnet-20240229",
          "name": "Claude 3 Sonnet"
        }
      ]
    },
    "openai": {
      "name": "OpenAI",
      "models": [
        {
          "id": "gpt-4",
          "name": "GPT-4"
        }
      ]
    }
  },
  "current_provider": "claude",
  "current_model": "claude-3-sonnet-20240229"
}
```

#### `GET /api/llm/models/{provider_id}`

Get models for a specific LLM provider.

**Response:**
```json
{
  "models": [
    {
      "id": "claude-3-sonnet-20240229",
      "name": "Claude 3 Sonnet"
    },
    {
      "id": "claude-3-haiku-20240307",
      "name": "Claude 3 Haiku"
    }
  ],
  "current_model": "claude-3-sonnet-20240229"
}
```

#### `POST /api/llm/set`

Set the LLM provider and model.

**Request Body:**
```json
{
  "provider": "claude",
  "model": "claude-3-sonnet-20240229"
}
```

**Response:**
```json
{
  "status": "success"
}
```

### Hermes Integration Endpoints

#### `POST /api/hermes/message`

Handle messages from Hermes.

**Request Body:**
```json
{
  "id": "msg-123456",
  "source": "hermes",
  "target": "terma",
  "command": "TERMINAL_CREATE",
  "timestamp": 1617184632.54,
  "payload": {
    "shell_command": "/bin/bash"
  }
}
```

**Response:** 
Varies based on the command.

#### `POST /api/events`

Handle events from Hermes.

**Request Body:**
```json
{
  "event": "component.initialized",
  "source": "hermes",
  "timestamp": 1617184632.54,
  "payload": {
    "component_id": "rhetor"
  }
}
```

**Response:**
```json
{
  "status": "success"
}
```

### UI Integration Endpoints

#### `GET /terminal/launch`

Launch a standalone terminal for a session.

**Query Parameters:**
- `session_id`: The ID of the session to connect to

**Response:**
HTML content for the standalone terminal UI.

## WebSocket API

The WebSocket API enables real-time terminal interaction and is accessed through the `/ws/{session_id}` endpoint.

### Connection

To establish a WebSocket connection, connect to:

```
ws://{host}:{port}/ws/{session_id}
```

### Message Format

All messages are JSON objects with a `type` field that indicates the message type.

### Client-to-Server Messages

#### Input Message

Send terminal input to the server.

```json
{
  "type": "input",
  "data": "ls -la\n"
}
```

#### Resize Message

Notify the server of terminal size changes.

```json
{
  "type": "resize",
  "rows": 24,
  "cols": 80
}
```

#### LLM Assistance Request

Request LLM assistance for a command.

```json
{
  "type": "llm_assist",
  "command": "find . -name \"*.js\" | xargs grep \"function\"",
  "is_output_analysis": false
}
```

### Server-to-Client Messages

#### Output Message

Terminal output from the server.

```json
{
  "type": "output",
  "data": "total 128\ndrwxr-xr-x  3 user group  96 Apr  1 10:50 .\n..."
}
```

#### Error Message

Error notification from the server.

```json
{
  "type": "error",
  "message": "Session expired"
}
```

#### LLM Response Message

Response from LLM for assistance requests.

```json
{
  "type": "llm_response",
  "content": "This command finds all JavaScript files and searches for the word 'function' in them.",
  "loading": false,
  "error": false
}
```

## Client Library

Terma provides a JavaScript client library (`terma-terminal.js`) for easy integration with web applications. The library handles WebSocket communication, terminal rendering, and event handling.

### Example Usage

```javascript
// Create a Terma client
const termaClient = new TermaClient({
  apiUrl: 'http://localhost:8765/api',
  wsUrl: 'ws://localhost:8765/ws'
});

// Create a terminal session
const sessionId = await termaClient.createSession('/bin/bash');

// Connect to the session
await termaClient.connectToSession(sessionId);

// Send input to the terminal
termaClient.sendInput('ls -la\n');

// Request LLM assistance
termaClient.requestLlmAssistance('find . -type f -name "*.py"');
```

## Error Handling

The API uses standard HTTP status codes for error responses:

- `200 OK`: Successful operation
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found (e.g., session doesn't exist)
- `500 Internal Server Error`: Server-side error

Error responses include a JSON object with a `detail` field describing the error:

```json
{
  "detail": "Session 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

## API Rate Limits

Currently, there are no strict rate limits implemented. However, excessive API requests may impact performance, especially when creating multiple terminal sessions.