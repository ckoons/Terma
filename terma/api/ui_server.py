"""UI server for Terma terminal"""

import os
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from ..utils.logging import setup_logging

# Set up logging
logger = setup_logging()

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.absolute()
UI_DIR = PROJECT_ROOT / "ui"

# Create the FastAPI application
app = FastAPI(title="Terma UI Server")

# Mount the static files
app.mount("/ui", StaticFiles(directory=str(UI_DIR)), name="ui")

@app.get("/")
async def root():
    """Redirect to the terminal page"""
    return RedirectResponse(url="/terminal")

@app.get("/terminal", response_class=HTMLResponse)
async def get_terminal_ui():
    """Return the terminal UI"""
    try:
        html_path = UI_DIR / "terma-terminal.html"
        if html_path.exists():
            return FileResponse(html_path)
        else:
            logger.error(f"Terminal UI file not found: {html_path}")
            return HTMLResponse(content="<h1>Terminal UI not found</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving terminal UI: {e}")
        return HTMLResponse(content=f"<h1>Error serving terminal UI: {str(e)}</h1>", status_code=500)

@app.get("/terminal/launch")
async def launch_terminal(session_id: str = None, server_url: str = None, ws_url: str = None):
    """Launch a standalone terminal"""
    try:
        html_path = UI_DIR / "launcher.html"
        if html_path.exists():
            return FileResponse(html_path)
        else:
            logger.error(f"Launcher UI file not found: {html_path}")
            return HTMLResponse(content="<h1>Launcher UI not found</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving launcher UI: {e}")
        return HTMLResponse(content=f"<h1>Error serving launcher UI: {str(e)}</h1>", status_code=500)

@app.get("/terminal/{session_id}")
async def get_terminal_session(session_id: str):
    """Return the terminal UI for a specific session"""
    return await get_terminal_ui()

@app.get("/images/{filename}")
async def get_image(filename: str):
    """Serve images"""
    try:
        image_path = PROJECT_ROOT / "images" / filename
        if image_path.exists():
            return FileResponse(image_path)
        else:
            logger.error(f"Image not found: {image_path}")
            return HTMLResponse(content="<h1>Image not found</h1>", status_code=404)
    except Exception as e:
        logger.error(f"Error serving image: {e}")
        return HTMLResponse(content=f"<h1>Error serving image: {str(e)}</h1>", status_code=500)

# Function to start the server
def start_ui_server(host: str = "0.0.0.0", port: int = 8766):
    """Start the UI server"""
    import uvicorn
    logger.info(f"Starting UI server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)