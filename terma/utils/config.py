"""Configuration utilities for Terma"""

import os
import json
from pathlib import Path

class Config:
    """Configuration manager for Terma"""
    
    def __init__(self, config_path=None):
        """Initialize the configuration manager
        
        Args:
            config_path: Path to the configuration file
        """
        self.config_path = config_path or os.path.expanduser("~/.terma/config.json")
        self.config = {}
        self._load()
        
    def _load(self):
        """Load the configuration file"""
        config_file = Path(self.config_path)
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    self.config = json.load(f)
            except Exception as e:
                print(f"Error loading config: {e}")
                self.config = {}
        else:
            self._create_default()
            
    def _create_default(self):
        """Create a default configuration"""
        self.config = {
            "terminal": {
                "default_shell": os.environ.get("SHELL", "/bin/bash"),
                "font_size": 14,
                "theme": "dark"
            },
            "server": {
                "host": "0.0.0.0",
                "port": 8765
            }
        }
        self._save()
        
    def _save(self):
        """Save the configuration file"""
        config_file = Path(self.config_path)
        config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
            
    def get(self, key, default=None):
        """Get a configuration value
        
        Args:
            key: The configuration key (can be dot-separated)
            default: Default value if the key doesn't exist
            
        Returns:
            The configuration value
        """
        keys = key.split('.')
        value = self.config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
        
    def set(self, key, value):
        """Set a configuration value
        
        Args:
            key: The configuration key (can be dot-separated)
            value: The value to set
        """
        keys = key.split('.')
        config = self.config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value
        self._save()
