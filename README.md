# Terma Terminal System

<div align="center">
  <img src="images/icon.png" alt="Terma Logo" width="200"/>
  <h3>Terma<br>Full-Featured Terminal Integration for Tekton</h3>
</div>

Terma is a comprehensive terminal integration system for the Tekton AI orchestration platform. It provides both embedded browser-based terminals and native system terminals with seamless LLM integration.

## Overview

Terma serves as the terminal interface layer between users and Tekton's AI capabilities. It provides a flexible, powerful terminal environment that can be embedded within the Hephaestus UI or launched as a standalone application.

### Key Features

- **Dual Interface** - Works both embedded in browser and as standalone terminal
- **Full Terminal Capabilities** - Complete shell access with all terminal features
- **LLM Integration** - Seamless communication with Tekton's LLM services
- **Session Management** - Persistent sessions across interfaces
- **Customizable** - Configurable appearance and behavior

## Installation

```bash
# Set up Terma with package dependencies
./component-setup.sh Terma
```

## Usage

Terma can be used in two primary modes:

### Embedded Browser Terminal

Access the terminal directly within the Hephaestus UI in the RIGHT PANEL section. This provides a seamless experience for quick interactions.

### Standalone System Terminal

Launch a dedicated terminal window for more intensive terminal work:

```bash
# Launch a standalone Terma terminal
python -m terma.cli.launch
```

## Integration

Terma integrates with:

- **Hephaestus**: For UI embedding
- **Hermes**: For message passing and LLM communication
- **Rhetor**: For advanced prompt engineering (future)

## License

MIT License