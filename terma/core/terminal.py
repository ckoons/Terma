"""Terminal session management and PTY interface"""

import os
import signal
import fcntl
import termios
import struct
import ptyprocess
import asyncio
import uuid
import logging
import time
from typing import Optional, Dict, Any, Tuple, List, Callable

from ..utils.logging import setup_logging

logger = setup_logging()

class TerminalSession:
    """Manages a single terminal session with PTY interface"""
    
    def __init__(self, session_id: Optional[str] = None, shell_command: Optional[str] = None):
        """Initialize a new terminal session
        
        Args:
            session_id: Optional identifier for the session
            shell_command: Shell command to run (defaults to user's default shell)
        """
        self.session_id = session_id or str(uuid.uuid4())
        self.shell_command = shell_command or os.environ.get("SHELL", "/bin/bash")
        self.active = False
        self.pty = None
        self.created_at = time.time()
        self.last_activity = time.time()
        self.output_callbacks: List[Callable[[str], None]] = []
        self._read_task = None
        
    def start(self) -> bool:
        """Start the terminal session
        
        Returns:
            bool: True if successful, False otherwise
        """
        if self.active:
            logger.warning(f"Session {self.session_id} already active")
            return True
            
        try:
            # Start the PTY process
            command = self.shell_command.split() if " " in self.shell_command else [self.shell_command]
            self.pty = ptyprocess.PtyProcess.spawn(command)
            self.active = True
            logger.info(f"Started session {self.session_id} with command: {self.shell_command}")
            
            # Start the read loop
            self._start_read_loop()
            
            return True
        except Exception as e:
            logger.error(f"Failed to start session {self.session_id}: {e}")
            return False
    
    def _start_read_loop(self):
        """Start the asynchronous read loop"""
        if asyncio.get_event_loop().is_running():
            self._read_task = asyncio.create_task(self._read_loop())
        else:
            logger.warning("Event loop not running, read loop not started")
    
    async def _read_loop(self):
        """Continuously read from the PTY and call output callbacks"""
        if not self.pty:
            logger.error("Cannot start read loop: PTY not initialized")
            return
            
        try:
            while self.active and self.pty.isalive():
                # Make sure we have data to read
                if not self.pty.fileobj.closed:
                    # Set up the PTY for non-blocking reads
                    fd = self.pty.fileobj.fileno()
                    fl = fcntl.fcntl(fd, fcntl.F_GETFL)
                    fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
                    
                    try:
                        # Try to read output (non-blocking)
                        data = await asyncio.get_event_loop().run_in_executor(
                            None, 
                            lambda: self.pty.read(1024)
                        )
                        
                        if data:
                            # Update last activity time
                            self.last_activity = time.time()
                            
                            # Call output callbacks
                            for callback in self.output_callbacks:
                                try:
                                    callback(data)
                                except Exception as cb_error:
                                    logger.error(f"Output callback error: {cb_error}")
                    except EOFError:
                        logger.info(f"Session {self.session_id} EOF reached")
                        self.active = False
                        break
                    except OSError as e:
                        if e.errno == 11:  # Would block
                            pass  # Normal, just no data yet
                        else:
                            logger.error(f"PTY read error: {e}")
                            break
                    
                # Yield to allow other tasks to run
                await asyncio.sleep(0.01)
                
            logger.info(f"Read loop for session {self.session_id} exited")
        except Exception as e:
            logger.error(f"Read loop error for session {self.session_id}: {e}")
            self.active = False
            
    def stop(self) -> bool:
        """Stop the terminal session
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.active:
            logger.warning(f"Session {self.session_id} already inactive")
            return True
            
        try:
            # Cancel the read task if it's running
            if self._read_task and not self._read_task.done():
                self._read_task.cancel()
                
            # Terminate the PTY
            if self.pty and self.pty.isalive():
                self.pty.terminate(force=True)
                
            self.active = False
            logger.info(f"Stopped session {self.session_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to stop session {self.session_id}: {e}")
            return False
    
    def write(self, data: str) -> bool:
        """Write data to the terminal
        
        Args:
            data: Data to write
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.active or not self.pty:
            logger.warning(f"Cannot write to inactive session {self.session_id}")
            return False
            
        try:
            # Update last activity time
            self.last_activity = time.time()
            
            # Write data to the PTY
            self.pty.write(data)
            return True
        except Exception as e:
            logger.error(f"Failed to write to session {self.session_id}: {e}")
            return False
    
    def read(self, size: int = 1024) -> Optional[str]:
        """Read data from the terminal
        
        Args:
            size: Maximum number of bytes to read
            
        Returns:
            str: The data read, or None if an error occurred
        """
        if not self.active or not self.pty:
            logger.warning(f"Cannot read from inactive session {self.session_id}")
            return None
            
        try:
            # Update last activity time
            self.last_activity = time.time()
            
            # Read data from the PTY
            data = self.pty.read(size)
            return data
        except Exception as e:
            logger.error(f"Failed to read from session {self.session_id}: {e}")
            return None
    
    def resize(self, rows: int, cols: int) -> bool:
        """Resize the terminal
        
        Args:
            rows: Number of rows
            cols: Number of columns
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.active or not self.pty:
            logger.warning(f"Cannot resize inactive session {self.session_id}")
            return False
            
        try:
            # Update last activity time
            self.last_activity = time.time()
            
            # Resize the PTY
            self.pty.setwinsize(rows, cols)
            return True
        except Exception as e:
            logger.error(f"Failed to resize session {self.session_id}: {e}")
            return False
    
    def register_output_callback(self, callback: Callable[[str], None]):
        """Register a callback to be called when output is received
        
        Args:
            callback: Function to call with the output string
        """
        self.output_callbacks.append(callback)
        
    def unregister_output_callback(self, callback: Callable[[str], None]):
        """Unregister a previously registered output callback
        
        Args:
            callback: Function to remove
        """
        if callback in self.output_callbacks:
            self.output_callbacks.remove(callback)
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about the session
        
        Returns:
            dict: Session information
        """
        return {
            "id": self.session_id,
            "active": self.active,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "shell_command": self.shell_command,
            "idle_time": time.time() - self.last_activity
        }