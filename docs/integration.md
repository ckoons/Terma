# Terma Integration Guide

This guide explains how to integrate Terma with other components in the Tekton ecosystem.

## Table of Contents

1. [Integrating with Hermes](#integrating-with-hermes)
2. [Integrating with Hephaestus UI](#integrating-with-hephaestus-ui)
3. [Integrating with LLM Adapter](#integrating-with-llm-adapter)
4. [Integrating with External Applications](#integrating-with-external-applications)
5. [Using Terma in Workflows](#using-terma-in-workflows)

## Integrating with Hermes

Terma integrates with the Hermes message bus to enable communication with other Tekton components.

### Registering with Hermes

To register Terma with Hermes, use the included registration script:

```bash
# From the Terma directory
python register_with_hermes.py
```

Or programmatically:

```python
from terma.integrations.hermes_integration import HermesIntegration

# Initialize Hermes integration
hermes = HermesIntegration(api_url="http://localhost:8000")

# Register capabilities
success = hermes.register_capabilities()
if success:
    print("Successfully registered with Hermes")
else:
    print("Failed to register with Hermes")
```

### Component Communication

Other components can communicate with Terma through Hermes messages:

```python
import requests
import json

# Send a message to create a terminal session
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

# Process the response
result = response.json()
session_id = result["payload"]["session_id"]
print(f"Created terminal session: {session_id}")
```

### Subscribing to Terma Events

To subscribe to events from Terma:

```python
import requests

# Subscribe to terminal session created events
response = requests.post(
    "http://localhost:8000/api/subscribe",
    json={
        "component": "MyComponent",
        "event": "terminal.session.created",
        "callback_url": "http://localhost:8080/api/events"
    }
)

print(f"Subscription status: {response.status_code}")
```

## Integrating with Hephaestus UI

Terma provides UI components for integration with the Hephaestus UI system.

### Automatic Installation

The easiest way to integrate Terma with Hephaestus is using the included installation script:

```bash
# From the Terma directory
./install_in_hephaestus.sh
```

This script creates the necessary symlinks and adds Terma to the Hephaestus component registry.

### Manual Installation

For manual installation:

1. Copy or symlink the UI files to Hephaestus:

```bash
mkdir -p /path/to/hephaestus/ui/components/terma
mkdir -p /path/to/hephaestus/ui/scripts/terma
mkdir -p /path/to/hephaestus/ui/styles/terma

ln -sf /path/to/terma/ui/hephaestus/terma-component.html /path/to/hephaestus/ui/components/terma/
ln -sf /path/to/terma/ui/hephaestus/js/terma-component.js /path/to/hephaestus/ui/scripts/terma/
ln -sf /path/to/terma/ui/hephaestus/css/terma-hephaestus.css /path/to/hephaestus/ui/styles/terma/
```

2. Add Terma to the Hephaestus component registry (`component_registry.json`):

```json
{
    "terma": {
        "name": "Terma Terminal",
        "description": "Advanced terminal with PTY integration and LLM assistance",
        "icon": "terminal",
        "componentPath": "components/terma/terma-component.html",
        "scripts": [
            "scripts/terma/terma-component.js"
        ],
        "styles": [
            "styles/terma/terma-hephaestus.css"
        ],
        "position": "right-panel"
    }
}
```

3. Add API routes to the Hephaestus server to serve Terma UI files:

```python
@app.get("/terma/ui/{path:path}")
async def serve_terma_ui(path: str):
    """Serve Terma UI files"""
    terma_ui_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "Terma", "ui")
    file_path = os.path.join(terma_ui_dir, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail=f"Terma UI file {path} not found")
```

### Customizing the UI

You can customize the Terma terminal UI appearance by modifying the CSS variables in your Hephaestus theme:

```css
body.theme-dark .terma-container {
    --terminal-bg-color: #1a1a1a;
    --terminal-fg-color: #f0f0f0;
    --component-header-bg: #2a2a2a;
    --component-border-color: #3a3a3a;
    /* Additional variables... */
}
```

## Integrating with LLM Adapter

Terma can integrate with LLM Adapter for command assistance.

### Configuration

To configure LLM Adapter integration:

1. Set the LLM Adapter URL in your environment:

```bash
export LLM_ADAPTER_URL="http://localhost:8080"
```

2. Or configure it programmatically:

```python
from terma.core.llm_adapter import LLMAdapter

# Initialize LLM adapter with custom URL
llm_adapter = LLMAdapter(adapter_url="http://localhost:8080")

# Use the adapter
response = await llm_adapter.analyze_command("session123", "docker run -it --rm ubuntu")
print(response)
```

### Example Usage

To analyze a command with the LLM:

```python
from terma.core.llm_adapter import LLMAdapter

async def example_usage():
    llm_adapter = LLMAdapter()
    
    # Analyze a command
    command_explanation = await llm_adapter.analyze_command(
        "session123",
        "docker run -it --rm ubuntu"
    )
    print(f"Command explanation: {command_explanation}")
    
    # Analyze command output
    output_explanation = await llm_adapter.analyze_output(
        "session123",
        "ls -la",
        "total 12\ndrwxr-xr-x  2 user user 4096 Apr  1 12:00 .\ndrwxr-xr-x 10 user user 4096 Apr  1 11:00 ..\n-rw-r--r--  1 user user   42 Apr  1 12:00 file.txt"
    )
    print(f"Output explanation: {output_explanation}")
```

## Integrating with External Applications

Terma can be integrated with external applications through its REST API and WebSocket interface.

### REST API Integration

To interact with Terma's REST API from an external application:

```python
import requests

# API base URL
base_url = "http://localhost:8765/api"

# Create a terminal session
response = requests.post(
    f"{base_url}/sessions",
    json={"shell_command": "/bin/bash"}
)
session_id = response.json()["session_id"]

# Write to the terminal
response = requests.post(
    f"{base_url}/sessions/{session_id}/write",
    json={"data": "ls -la\n"}
)

# Read from the terminal
response = requests.get(f"{base_url}/sessions/{session_id}/read")
output = response.json()["data"]
print(output)

# Close the session when done
requests.delete(f"{base_url}/sessions/{session_id}")
```

### WebSocket Integration

For real-time communication with a terminal session:

```javascript
// Connect to terminal WebSocket
const sessionId = "your-session-id";
const socket = new WebSocket(`ws://localhost:8765/ws/${sessionId}`);

// Handle messages from the server
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === "output") {
        // Display terminal output
        console.log(message.data);
    } else if (message.type === "error") {
        // Handle error
        console.error(message.message);
    } else if (message.type === "llm_response") {
        // Display LLM assistance
        console.log("LLM Assistance:", message.content);
    }
};

// Send input to the terminal
function sendInput(text) {
    socket.send(JSON.stringify({
        type: "input",
        data: text
    }));
}

// Resize the terminal
function resizeTerminal(rows, cols) {
    socket.send(JSON.stringify({
        type: "resize",
        rows: rows,
        cols: cols
    }));
}

// Request LLM assistance
function requestAssistance(command) {
    socket.send(JSON.stringify({
        type: "llm_assist",
        command: command
    }));
}
```

## Using Terma in Workflows

Terma can be incorporated into Tekton workflows using Hermes capabilities.

### Example Workflow Integration

```python
from tekton.workflow import Workflow
from tekton.steps import Step

# Define a workflow that includes Terma terminal operations
workflow = Workflow("CommandExecution")

# Step 1: Create a terminal session
create_terminal = Step(
    name="CreateTerminal",
    component="Terma",
    capability="terminal.create",
    params={
        "shell_command": "/bin/bash"
    },
    outputs=["session_id"]
)

# Step 2: Execute a command
execute_command = Step(
    name="ExecuteCommand",
    component="Terma",
    capability="terminal.write",
    params={
        "session_id": "${steps.CreateTerminal.outputs.session_id}",
        "data": "ls -la\n"
    }
)

# Step 3: Read command output
read_output = Step(
    name="ReadOutput",
    component="Terma",
    capability="terminal.read",
    params={
        "session_id": "${steps.CreateTerminal.outputs.session_id}"
    },
    outputs=["data"]
)

# Step 4: Close the terminal
close_terminal = Step(
    name="CloseTerminal",
    component="Terma",
    capability="terminal.close",
    params={
        "session_id": "${steps.CreateTerminal.outputs.session_id}"
    }
)

# Add steps to workflow
workflow.add_step(create_terminal)
workflow.add_step(execute_command)
workflow.add_step(read_output)
workflow.add_step(close_terminal)

# Execute the workflow
workflow.execute()
```

### Terminal-Based Agents

Terma can be used to create terminal-based agents within the Tekton ecosystem:

```python
from tekton.agent import Agent
from terma.client import TermaClient

class TerminalAgent(Agent):
    def __init__(self, name, shell_command=None):
        super().__init__(name)
        self.terma_client = TermaClient()
        self.session_id = None
        self.shell_command = shell_command
        
    async def initialize(self):
        # Create a terminal session
        response = await self.terma_client.create_session(
            shell_command=self.shell_command
        )
        self.session_id = response["session_id"]
        
    async def execute_command(self, command):
        # Write command to terminal
        await self.terma_client.write_to_session(
            self.session_id, 
            command + "\n"
        )
        
        # Read output
        response = await self.terma_client.read_from_session(
            self.session_id
        )
        return response["data"]
        
    async def cleanup(self):
        # Close the terminal session
        if self.session_id:
            await self.terma_client.close_session(self.session_id)
```

## Summary

Terma provides multiple integration points for other components and applications:

1. **Hermes Integration** - For communication within the Tekton ecosystem
2. **Hephaestus UI Integration** - For embedding terminal UI in Hephaestus
3. **LLM Adapter Integration** - For terminal command assistance
4. **External Application Integration** - Through REST API and WebSocket
5. **Workflow Integration** - For use in Tekton workflows and agents

These integration capabilities make Terma a flexible and powerful terminal solution within the Tekton ecosystem.
EOF < /dev/null