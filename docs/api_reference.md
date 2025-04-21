# Terma API Reference

This document provides detailed information about the Terma Terminal API endpoints and WebSocket interface.

## REST API Endpoints

Terma provides a RESTful API for managing terminal sessions and accessing terminal functionality.

### Base URL

`http://localhost:8765/api`

### Session Management

#### List Terminal Sessions

Lists all active terminal sessions.

- **URL:** `/sessions`
- **Method:** `GET`
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "sessions": [
      {
        "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
        "active": true,
        "created_at": 1712345678.9,
        "last_activity": 1712345700.1,
        "shell_command": "/bin/bash",
        "idle_time": 21.2
      }
    ]
  }
  ```

#### Create Terminal Session

Creates a new terminal session.

- **URL:** `/sessions`
- **Method:** `POST`
- **Request Format:** JSON
- **Request Example:**
  ```json
  {
    "shell_command": "/bin/bash"
  }
  ```
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "session_id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
    "created_at": 1712345678.9
  }
  ```

#### Get Session Information

Gets information about a specific terminal session.

- **URL:** `/sessions/{session_id}`
- **Method:** `GET`
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
    "active": true,
    "created_at": 1712345678.9,
    "last_activity": 1712345700.1,
    "shell_command": "/bin/bash",
    "idle_time": 21.2
  }
  ```

#### Close Terminal Session

Closes a terminal session.

- **URL:** `/sessions/{session_id}`
- **Method:** `DELETE`
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "status": "success"
  }
  ```

### Terminal I/O

#### Write to Terminal

Writes data to a terminal session.

- **URL:** `/sessions/{session_id}/write`
- **Method:** `POST`
- **Request Format:** JSON
- **Request Example:**
  ```json
  {
    "data": "ls -la\n"
  }
  ```
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "status": "success",
    "bytes_written": 6
  }
  ```

#### Read from Terminal

Reads data from a terminal session.

- **URL:** `/sessions/{session_id}/read`
- **Method:** `GET`
- **Query Parameters:**
  - `size` (optional): Maximum number of bytes to read (default: 1024)
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "data": "total 12\ndrwxr-xr-x  2 user user 4096 Apr  1 12:00 .\ndrwxr-xr-x 10 user user 4096 Apr  1 11:00 ..\n-rw-r--r--  1 user user   42 Apr  1 12:00 file.txt\n"
  }
  ```

### Hermes Integration

#### Handle Hermes Message

Handles a message from Hermes.

- **URL:** `/hermes/message`
- **Method:** `POST`
- **Request Format:** JSON
- **Request Example:**
  ```json
  {
    "id": "msg123",
    "source": "Prometheus",
    "target": "Terma",
    "command": "terminal.create",
    "timestamp": 1712345678.9,
    "payload": {
      "shell_command": "/bin/bash"
    }
  }
  ```
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "id": "msg123",
    "status": "success",
    "source": "Terma",
    "target": "Prometheus",
    "response_to": "terminal.create",
    "payload": {
      "session_id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l"
    }
  }
  ```

#### Handle Hermes Event

Handles an event from Hermes.

- **URL:** `/events`
- **Method:** `POST`
- **Request Format:** JSON
- **Request Example:**
  ```json
  {
    "event": "terminal.session.created",
    "source": "Rhetor",
    "timestamp": 1712345678.9,
    "payload": {
      "session_id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l"
    }
  }
  ```
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "status": "success"
  }
  ```

### Health Monitoring

#### Health Check

Checks the health status of the Terma service.

- **URL:** `/health`
- **Method:** `GET`
- **Response Format:** JSON
- **Response Example:**
  ```json
  {
    "status": "healthy",
    "uptime": 3600.5,
    "version": "0.1.0",
    "active_sessions": 3
  }
  ```

## WebSocket Interface

Terma provides a WebSocket interface for real-time terminal communication.

### Terminal WebSocket

- **URL:** `ws://localhost:8765/ws/{session_id}`
- **Description:** Provides real-time interaction with a terminal session.

#### Messages from Client to Server

1. **Terminal Input**

   Send input to the terminal.
   ```json
   {
     "type": "input",
     "data": "ls -la\n"
   }
   ```

2. **Terminal Resize**

   Resize the terminal.
   ```json
   {
     "type": "resize",
     "rows": 24,
     "cols": 80
   }
   ```

3. **LLM Assistance Request**

   Request LLM assistance for a command.
   ```json
   {
     "type": "llm_assist",
     "command": "docker run -it --rm ubuntu"
   }
   ```

#### Messages from Server to Client

1. **Terminal Output**

   Output from the terminal.
   ```json
   {
     "type": "output",
     "data": "total 12\ndrwxr-xr-x  2 user user 4096 Apr  1 12:00 .\ndrwxr-xr-x 10 user user 4096 Apr  1 11:00 ..\n-rw-r--r--  1 user user   42 Apr  1 12:00 file.txt\n"
   }
   ```

2. **Error Message**

   Error message from the server.
   ```json
   {
     "type": "error",
     "message": "Failed to execute command"
   }
   ```

3. **LLM Response**

   Response from the LLM assistant.
   ```json
   {
     "type": "llm_response",
     "content": "The `docker run -it --rm ubuntu` command starts a new Docker container with the Ubuntu image. The flags mean:\n- `-i`: Interactive mode (keeps STDIN open)\n- `-t`: Allocates a pseudo-TTY\n- `--rm`: Automatically removes the container when it exits"
   }
   ```

## Hermes Integration Capabilities

Terma registers the following capabilities with Hermes:

1. **terminal.create**
   - Creates a new terminal session
   - Parameters:
     - `shell_command` (optional): Shell command to run
   - Returns:
     - `session_id`: ID of the created session

2. **terminal.close**
   - Closes a terminal session
   - Parameters:
     - `session_id`: ID of the session to close
   - Returns:
     - `status`: Operation status

3. **terminal.write**
   - Writes data to a terminal session
   - Parameters:
     - `session_id`: ID of the session to write to
     - `data`: Data to write
   - Returns:
     - `status`: Operation status
     - `bytes_written`: Number of bytes written

4. **terminal.read**
   - Reads data from a terminal session
   - Parameters:
     - `session_id`: ID of the session to read from
     - `size` (optional): Maximum number of bytes to read
   - Returns:
     - `data`: Terminal output data

5. **terminal.list**
   - Lists all terminal sessions
   - Parameters: none
   - Returns:
     - `sessions`: List of session information

6. **terminal.resize**
   - Resizes a terminal session
   - Parameters:
     - `session_id`: ID of the session to resize
     - `rows`: Number of rows
     - `cols`: Number of columns
   - Returns:
     - `status`: Operation status

## Hermes Events

Terma publishes the following events to Hermes:

1. **terminal.session.created**
   - Published when a new terminal session is created
   - Payload:
     - `session_id`: ID of the created session
     - `shell_command`: Shell command used (if any)
     - `created_at`: Creation timestamp

2. **terminal.session.closed**
   - Published when a terminal session is closed
   - Payload:
     - `session_id`: ID of the closed session
     - `closed_at`: Closing timestamp

3. **terminal.output.available**
   - Published when new output is available from a terminal
   - Payload:
     - `session_id`: ID of the session
     - `output_size`: Size of the available output in bytes

4. **terminal.command.executed**
   - Published when a command is executed in a terminal
   - Payload:
     - `session_id`: ID of the session
     - `command`: The command that was executed
EOF < /dev/null