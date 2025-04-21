# Terma Installation

## Prerequisites

- Python 3.10 or higher
- UV package manager (recommended)
- For native terminal features: tmux or screen
- Node.js (for development of UI components)

## Installation Options

### Option 1: Using the Tekton component installer (Recommended)

The easiest way to install Terma is using the Tekton component installer:

```bash
./component-setup.sh Terma
```

This will:
1. Create a virtual environment
2. Install all dependencies using UV
3. Install Terma in development mode
4. Register Terma with Hermes

### Option 2: Manual Installation

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

### Option 3: Development Installation

For development, you may want to install in editable mode:

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in editable mode
uv pip install -e .
```

## Configuration

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

## Hermes Integration

To register Terma with Hermes:

```bash
python register_with_hermes.py
```

You can specify a custom Hermes URL with `--hermes-url`.

## Verifying Installation

You can verify that Terma is correctly installed by running:

```bash
python -m terma.cli.main --version
```

This should display the installed version of Terma.
