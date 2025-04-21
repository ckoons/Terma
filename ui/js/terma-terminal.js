/**
 * Terma Terminal Component
 * Implementation of xterm.js-based terminal for Tekton
 */

class TermaTerminal {
    /**
     * Initialize the terminal
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            containerId: 'terma-terminal',
            fontSize: 14,
            fontFamily: "'Courier New', monospace",
            theme: 'default',
            cursorStyle: 'block',
            cursorBlink: true,
            scrollback: 1000,
            serverUrl: 'http://localhost:8765',
            wsUrl: 'ws://localhost:8765/ws'
        }, options);
        
        // Terminal state
        this.terminal = null;
        this.fitAddon = null;
        this.searchAddon = null;
        this.webLinksAddon = null;
        this.socket = null;
        this.sessionId = null;
        this.sessionList = [];
        this.connected = false;
        this.llmCollapsed = false;
        
        // DOM elements
        this.elements = {
            container: null,
            terminalEl: null,
            sessionSelector: null,
            terminalType: null,
            detachBtn: null,
            settingsBtn: null,
            settingsModal: null,
            settingsClose: null,
            settingsSave: null,
            settingsReset: null,
            llmToggle: null,
            llmContent: null,
            llmOutput: null,
            fontSizeInput: null,
            fontSizeValue: null,
            fontFamilySelect: null,
            themeSelect: null,
            cursorStyleSelect: null,
            cursorBlinkCheckbox: null,
            scrollbackCheckbox: null,
            scrollbackLinesInput: null
        };
        
        // Terminal themes
        this.themes = {
            default: {
                foreground: '#f0f0f0',
                background: '#1a1a1a',
                cursor: '#f0f0f0',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#f8f8f2',
                brightBlack: '#6272a4',
                brightRed: '#ff6e6e',
                brightGreen: '#69ff94',
                brightYellow: '#ffffa5',
                brightBlue: '#d6acff',
                brightMagenta: '#ff92df',
                brightCyan: '#a4ffff',
                brightWhite: '#ffffff'
            },
            light: {
                foreground: '#333',
                background: '#f5f5f5',
                cursor: '#333',
                selection: 'rgba(0, 0, 0, 0.3)',
                black: '#000000',
                red: '#c91b00',
                green: '#00c200',
                yellow: '#c7c400',
                blue: '#0037da',
                magenta: '#c839c5',
                cyan: '#00c5c7',
                white: '#c7c7c7',
                brightBlack: '#767676',
                brightRed: '#e74856',
                brightGreen: '#16c60c',
                brightYellow: '#f9f1a5',
                brightBlue: '#3b78ff',
                brightMagenta: '#b4009e',
                brightCyan: '#61d6d6',
                brightWhite: '#f2f2f2'
            },
            dark: {
                foreground: '#f0f0f0',
                background: '#1a1a1a',
                cursor: '#f0f0f0',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#f8f8f2',
                brightBlack: '#6272a4',
                brightRed: '#ff6e6e',
                brightGreen: '#69ff94',
                brightYellow: '#ffffa5',
                brightBlue: '#d6acff',
                brightMagenta: '#ff92df',
                brightCyan: '#a4ffff',
                brightWhite: '#ffffff'
            },
            monokai: {
                foreground: '#f8f8f2',
                background: '#272822',
                cursor: '#f8f8f2',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#272822',
                red: '#f92672',
                green: '#a6e22e',
                yellow: '#f4bf75',
                blue: '#66d9ef',
                magenta: '#ae81ff',
                cyan: '#a1efe4',
                white: '#f8f8f2',
                brightBlack: '#75715e',
                brightRed: '#f92672',
                brightGreen: '#a6e22e',
                brightYellow: '#f4bf75',
                brightBlue: '#66d9ef',
                brightMagenta: '#ae81ff',
                brightCyan: '#a1efe4',
                brightWhite: '#f9f8f5'
            },
            solarized: {
                foreground: '#839496',
                background: '#002b36',
                cursor: '#839496',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#073642',
                red: '#dc322f',
                green: '#859900',
                yellow: '#b58900',
                blue: '#268bd2',
                magenta: '#d33682',
                cyan: '#2aa198',
                white: '#eee8d5',
                brightBlack: '#002b36',
                brightRed: '#cb4b16',
                brightGreen: '#586e75',
                brightYellow: '#657b83',
                brightBlue: '#839496',
                brightMagenta: '#6c71c4',
                brightCyan: '#93a1a1',
                brightWhite: '#fdf6e3'
            }
        };
    }
    
    /**
     * Initialize the terminal component
     */
    async init() {
        console.log('Initializing Terma Terminal...');
        
        // Get DOM elements
        this.getElements();
        
        // Initialize terminal
        this.initXterm();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Get available sessions
        await this.fetchSessions();
        
        // Create a new session
        if (this.sessionList.length === 0) {
            await this.createSession();
        } else {
            // Connect to the first available session
            this.connectToSession(this.sessionList[0].id);
        }
        
        // Apply terminal size
        this.fitTerminal();
        
        // Set up resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        
        console.log('Terma Terminal initialized');
    }
    
    /**
     * Get DOM elements
     */
    getElements() {
        this.elements.container = document.querySelector('.terma-terminal-container');
        this.elements.terminalEl = document.getElementById(this.options.containerId);
        this.elements.sessionSelector = document.getElementById('terma-session-selector');
        this.elements.terminalType = document.getElementById('terma-terminal-type');
        this.elements.detachBtn = document.getElementById('terma-detach-btn');
        this.elements.settingsBtn = document.getElementById('terma-settings-btn');
        this.elements.settingsModal = document.getElementById('terma-settings-modal');
        this.elements.settingsClose = document.getElementById('terma-settings-close');
        this.elements.settingsSave = document.getElementById('terma-settings-save');
        this.elements.settingsReset = document.getElementById('terma-settings-reset');
        this.elements.llmToggle = document.getElementById('terma-llm-toggle');
        this.elements.llmContent = document.getElementById('terma-llm-content');
        this.elements.llmOutput = document.getElementById('terma-llm-output');
        this.elements.fontSizeInput = document.getElementById('terma-font-size');
        this.elements.fontSizeValue = document.getElementById('terma-font-size-value');
        this.elements.fontFamilySelect = document.getElementById('terma-font-family');
        this.elements.themeSelect = document.getElementById('terma-theme');
        this.elements.cursorStyleSelect = document.getElementById('terma-cursor-style');
        this.elements.cursorBlinkCheckbox = document.getElementById('terma-cursor-blink');
        this.elements.scrollbackCheckbox = document.getElementById('terma-scroll-back');
        this.elements.scrollbackLinesInput = document.getElementById('terma-scrollback-lines');
    }
    
    /**
     * Initialize xterm.js terminal
     */
    initXterm() {
        // Create terminal instance
        this.terminal = new Terminal({
            fontSize: this.options.fontSize,
            fontFamily: this.options.fontFamily,
            theme: this.themes[this.options.theme],
            cursorStyle: this.options.cursorStyle,
            cursorBlink: this.options.cursorBlink,
            scrollback: this.options.scrollback,
            allowTransparency: true,
            convertEol: true,
            disableStdin: false,
            drawBoldTextInBrightColors: true,
            rightClickSelectsWord: true
        });
        
        // Add addons
        this.fitAddon = new FitAddon.FitAddon();
        this.searchAddon = new SearchAddon.SearchAddon();
        this.webLinksAddon = new WebLinksAddon.WebLinksAddon();
        
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.searchAddon);
        this.terminal.loadAddon(this.webLinksAddon);
        
        // Open terminal
        this.terminal.open(this.elements.terminalEl);
        
        // Handle user input
        this.terminal.onData(data => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                // Check if this is a query for LLM assistance
                if (data === '?' && this.terminal._core.buffer.normal.baseY + this.terminal.rows === this.terminal._core.buffer.normal.viewportY + this.terminal.rows) {
                    // Show LLM output for the current command
                    const currentLine = this.getCurrentLine();
                    this.requestLlmAssistance(currentLine);
                    return;
                }
                
                // Send the data to the terminal session
                const message = JSON.stringify({
                    type: 'input',
                    data: data
                });
                this.socket.send(message);
            }
        });
        
        // Handle key commands
        this.terminal.attachCustomKeyEventHandler(event => {
            // Ctrl+Shift+F: Search
            if (event.ctrlKey && event.shiftKey && event.key === 'F' && event.type === 'keydown') {
                this.searchAddon.activate();
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Session selector
        if (this.elements.sessionSelector) {
            this.elements.sessionSelector.addEventListener('change', () => {
                const value = this.elements.sessionSelector.value;
                if (value === 'new') {
                    this.createSession();
                } else {
                    this.connectToSession(value);
                }
            });
        }
        
        // Terminal type selector
        if (this.elements.terminalType) {
            this.elements.terminalType.addEventListener('change', () => {
                this.createSession(this.elements.terminalType.value);
            });
        }
        
        // Detach button
        if (this.elements.detachBtn) {
            this.elements.detachBtn.addEventListener('click', () => {
                this.detachTerminal();
            });
        }
        
        // Settings button
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // Settings close button
        if (this.elements.settingsClose) {
            this.elements.settingsClose.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }
        
        // Settings save button
        if (this.elements.settingsSave) {
            this.elements.settingsSave.addEventListener('click', () => {
                this.saveSettings();
                this.hideSettingsModal();
            });
        }
        
        // Settings reset button
        if (this.elements.settingsReset) {
            this.elements.settingsReset.addEventListener('click', () => {
                this.resetSettings();
            });
        }
        
        // LLM toggle button
        if (this.elements.llmToggle) {
            this.elements.llmToggle.addEventListener('click', () => {
                this.toggleLlmPanel();
            });
        }
        
        // Font size input
        if (this.elements.fontSizeInput && this.elements.fontSizeValue) {
            this.elements.fontSizeInput.addEventListener('input', () => {
                const value = this.elements.fontSizeInput.value;
                this.elements.fontSizeValue.textContent = `${value}px`;
                this.updateTerminalOption('fontSize', parseInt(value, 10));
            });
        }
    }
    
    /**
     * Update terminal option
     * @param {string} option - The option name
     * @param {any} value - The option value
     */
    updateTerminalOption(option, value) {
        if (!this.terminal) return;
        
        switch (option) {
            case 'fontSize':
                this.terminal.options.fontSize = value;
                break;
            case 'fontFamily':
                this.terminal.options.fontFamily = value;
                break;
            case 'theme':
                this.terminal.options.theme = this.themes[value];
                break;
            case 'cursorStyle':
                this.terminal.options.cursorStyle = value;
                break;
            case 'cursorBlink':
                this.terminal.options.cursorBlink = value;
                break;
            case 'scrollback':
                this.terminal.options.scrollback = value;
                break;
        }
        
        // Save the option to local settings
        this.options[option] = value;
        
        // Force xterm to reload with new options
        this.fitTerminal();
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('terma_terminal_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Apply settings
                this.options = { ...this.options, ...settings };
                
                // Update UI to match settings
                if (this.elements.fontSizeInput) {
                    this.elements.fontSizeInput.value = this.options.fontSize;
                    this.elements.fontSizeValue.textContent = `${this.options.fontSize}px`;
                }
                
                if (this.elements.fontFamilySelect) {
                    this.elements.fontFamilySelect.value = this.options.fontFamily;
                }
                
                if (this.elements.themeSelect) {
                    this.elements.themeSelect.value = this.options.theme;
                }
                
                if (this.elements.cursorStyleSelect) {
                    this.elements.cursorStyleSelect.value = this.options.cursorStyle;
                }
                
                if (this.elements.cursorBlinkCheckbox) {
                    this.elements.cursorBlinkCheckbox.checked = this.options.cursorBlink;
                }
                
                if (this.elements.scrollbackCheckbox) {
                    this.elements.scrollbackCheckbox.checked = this.options.scrollback > 0;
                }
                
                if (this.elements.scrollbackLinesInput) {
                    this.elements.scrollbackLinesInput.value = this.options.scrollback > 0 ? this.options.scrollback : 1000;
                }
                
                // Apply settings to terminal
                if (this.terminal) {
                    this.terminal.options.fontSize = this.options.fontSize;
                    this.terminal.options.fontFamily = this.options.fontFamily;
                    this.terminal.options.theme = this.themes[this.options.theme];
                    this.terminal.options.cursorStyle = this.options.cursorStyle;
                    this.terminal.options.cursorBlink = this.options.cursorBlink;
                    this.terminal.options.scrollback = this.options.scrollback;
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            // Get settings from UI
            if (this.elements.fontSizeInput) {
                this.options.fontSize = parseInt(this.elements.fontSizeInput.value, 10);
            }
            
            if (this.elements.fontFamilySelect) {
                this.options.fontFamily = this.elements.fontFamilySelect.value;
            }
            
            if (this.elements.themeSelect) {
                this.options.theme = this.elements.themeSelect.value;
            }
            
            if (this.elements.cursorStyleSelect) {
                this.options.cursorStyle = this.elements.cursorStyleSelect.value;
            }
            
            if (this.elements.cursorBlinkCheckbox) {
                this.options.cursorBlink = this.elements.cursorBlinkCheckbox.checked;
            }
            
            if (this.elements.scrollbackCheckbox && this.elements.scrollbackLinesInput) {
                this.options.scrollback = this.elements.scrollbackCheckbox.checked ? parseInt(this.elements.scrollbackLinesInput.value, 10) : 0;
            }
            
            // Apply settings to terminal
            this.terminal.options.fontSize = this.options.fontSize;
            this.terminal.options.fontFamily = this.options.fontFamily;
            this.terminal.options.theme = this.themes[this.options.theme];
            this.terminal.options.cursorStyle = this.options.cursorStyle;
            this.terminal.options.cursorBlink = this.options.cursorBlink;
            this.terminal.options.scrollback = this.options.scrollback;
            
            // Save settings to localStorage
            localStorage.setItem('terma_terminal_settings', JSON.stringify({
                fontSize: this.options.fontSize,
                fontFamily: this.options.fontFamily,
                theme: this.options.theme,
                cursorStyle: this.options.cursorStyle,
                cursorBlink: this.options.cursorBlink,
                scrollback: this.options.scrollback
            }));
            
            // Force terminal to update
            this.fitTerminal();
            
            console.log('Settings saved');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        // Reset to default values
        this.options.fontSize = 14;
        this.options.fontFamily = "'Courier New', monospace";
        this.options.theme = 'default';
        this.options.cursorStyle = 'block';
        this.options.cursorBlink = true;
        this.options.scrollback = 1000;
        
        // Update UI
        if (this.elements.fontSizeInput) {
            this.elements.fontSizeInput.value = this.options.fontSize;
            this.elements.fontSizeValue.textContent = `${this.options.fontSize}px`;
        }
        
        if (this.elements.fontFamilySelect) {
            this.elements.fontFamilySelect.value = this.options.fontFamily;
        }
        
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = this.options.theme;
        }
        
        if (this.elements.cursorStyleSelect) {
            this.elements.cursorStyleSelect.value = this.options.cursorStyle;
        }
        
        if (this.elements.cursorBlinkCheckbox) {
            this.elements.cursorBlinkCheckbox.checked = this.options.cursorBlink;
        }
        
        if (this.elements.scrollbackCheckbox) {
            this.elements.scrollbackCheckbox.checked = true;
        }
        
        if (this.elements.scrollbackLinesInput) {
            this.elements.scrollbackLinesInput.value = this.options.scrollback;
        }
        
        // Apply settings to terminal
        this.terminal.options.fontSize = this.options.fontSize;
        this.terminal.options.fontFamily = this.options.fontFamily;
        this.terminal.options.theme = this.themes[this.options.theme];
        this.terminal.options.cursorStyle = this.options.cursorStyle;
        this.terminal.options.cursorBlink = this.options.cursorBlink;
        this.terminal.options.scrollback = this.options.scrollback;
        
        // Force terminal to update
        this.fitTerminal();
        
        console.log('Settings reset to defaults');
    }
    
    /**
     * Show the settings modal
     */
    showSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'block';
        }
    }
    
    /**
     * Hide the settings modal
     */
    hideSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
        }
    }
    
    /**
     * Toggle the LLM assistance panel
     */
    toggleLlmPanel() {
        if (this.elements.container) {
            if (this.llmCollapsed) {
                this.elements.container.querySelector('.terma-llm-assistance').classList.remove('terma-llm-collapsed');
            } else {
                this.elements.container.querySelector('.terma-llm-assistance').classList.add('terma-llm-collapsed');
            }
            
            this.llmCollapsed = !this.llmCollapsed;
            this.fitTerminal();
        }
    }
    
    /**
     * Fit the terminal to the container
     */
    fitTerminal() {
        if (this.fitAddon) {
            try {
                this.fitAddon.fit();
                
                // Send terminal size to server if connected
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const message = JSON.stringify({
                        type: 'resize',
                        cols: this.terminal.cols,
                        rows: this.terminal.rows
                    });
                    this.socket.send(message);
                }
            } catch (error) {
                console.error('Error fitting terminal:', error);
            }
        }
    }
    
    /**
     * Handle window resize event
     */
    handleResize() {
        this.fitTerminal();
    }
    
    /**
     * Fetch available sessions from the server
     */
    async fetchSessions() {
        try {
            const response = await fetch(`${this.options.serverUrl}/api/sessions`);
            if (response.ok) {
                const data = await response.json();
                this.sessionList = data.sessions || [];
                
                // Update session selector
                this.updateSessionSelector();
                
                return this.sessionList;
            } else {
                console.error('Error fetching sessions:', response.statusText);
                return [];
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }
    }
    
    /**
     * Update the session selector dropdown
     */
    updateSessionSelector() {
        if (!this.elements.sessionSelector) return;
        
        // Clear existing options (except "New Session")
        while (this.elements.sessionSelector.options.length > 1) {
            this.elements.sessionSelector.remove(1);
        }
        
        // Add sessions
        this.sessionList.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.text = `Session ${session.id.slice(0, 8)}...`;
            if (this.sessionId === session.id) {
                option.selected = true;
            }
            this.elements.sessionSelector.add(option);
        });
    }
    
    /**
     * Create a new terminal session
     * @param {string} shellCommand - Optional shell command to run
     */
    async createSession(shellCommand = null) {
        try {
            // Close existing connection
            this.closeConnection();
            
            // Determine shell command
            if (!shellCommand && this.elements.terminalType) {
                shellCommand = this.getShellCommandFromType(this.elements.terminalType.value);
            }
            
            // Create payload
            const payload = {};
            if (shellCommand) {
                payload.shell_command = shellCommand;
            }
            
            // Make request to create session
            const response = await fetch(`${this.options.serverUrl}/api/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.session_id;
                
                // Update session list
                await this.fetchSessions();
                
                // Connect to the session
                this.connectToSession(this.sessionId);
                
                console.log(`Created new session: ${this.sessionId}`);
                return this.sessionId;
            } else {
                const errorText = await response.text();
                console.error('Error creating session:', errorText);
                return null;
            }
        } catch (error) {
            console.error('Error creating session:', error);
            return null;
        }
    }
    
    /**
     * Get shell command from terminal type
     * @param {string} terminalType - Terminal type
     * @returns {string} Shell command
     */
    getShellCommandFromType(terminalType) {
        switch (terminalType) {
            case 'bash':
                return '/bin/bash';
            case 'python':
                return 'python';
            case 'node':
                return 'node';
            default:
                return null;
        }
    }
    
    /**
     * Connect to a terminal session
     * @param {string} sessionId - Session ID
     */
    connectToSession(sessionId) {
        // Close existing connection
        this.closeConnection();
        
        // Set session ID
        this.sessionId = sessionId;
        
        // Update session selector
        if (this.elements.sessionSelector) {
            for (let i = 0; i < this.elements.sessionSelector.options.length; i++) {
                if (this.elements.sessionSelector.options[i].value === sessionId) {
                    this.elements.sessionSelector.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Create WebSocket connection
        const wsUrl = `${this.options.wsUrl}/${sessionId}`;
        this.socket = new WebSocket(wsUrl);
        
        // Clear terminal
        this.terminal.clear();
        
        // Set up WebSocket event handlers
        this.socket.onopen = () => {
            this.connected = true;
            console.log(`Connected to session: ${sessionId}`);
            this.terminal.writeln('\x1b[32mConnected to terminal session\x1b[0m');
        };
        
        this.socket.onclose = () => {
            this.connected = false;
            console.log(`Disconnected from session: ${sessionId}`);
            
            // Only write a message if we were previously connected
            if (this.connected) {
                this.terminal.writeln('\x1b[31mDisconnected from terminal session\x1b[0m');
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.terminal.writeln('\x1b[31mError connecting to terminal session\x1b[0m');
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                // Handle different message types
                switch (message.type) {
                    case 'output':
                        // Write output to terminal
                        this.terminal.write(message.data);
                        break;
                        
                    case 'error':
                        // Write error to terminal
                        this.terminal.writeln(`\x1b[31mError: ${message.message}\x1b[0m`);
                        break;
                        
                    case 'llm_response':
                        // Display LLM response in the assistance panel
                        this.displayLlmResponse(message.content);
                        break;
                        
                    default:
                        console.warn('Unknown message type:', message.type);
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        };
    }
    
    /**
     * Close current WebSocket connection
     */
    closeConnection() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
    }
    
    /**
     * Detach the terminal to a standalone window
     */
    detachTerminal() {
        if (!this.sessionId) return;
        
        // Open URL to launch the terminal
        const launchUrl = `${this.options.serverUrl}/terminal/launch?session_id=${this.sessionId}`;
        window.open(launchUrl, '_blank');
    }
    
    /**
     * Get the current command line text
     * @returns {string} Current command line
     */
    getCurrentLine() {
        // Get the buffer content of the current line
        const buffer = this.terminal._core.buffer;
        const lineY = buffer.normal.baseY + buffer.normal.cursorY;
        const line = buffer.normal.lines.get(lineY);
        
        let text = '';
        for (let i = 0; i < line.length; i++) {
            text += line.getString(i);
        }
        
        return text.trim();
    }
    
    /**
     * Request LLM assistance for a command
     * @param {string} command - The command to analyze
     */
    async requestLlmAssistance(command) {
        if (!command) return;
        
        try {
            // Ensure the LLM panel is visible
            if (this.llmCollapsed) {
                this.toggleLlmPanel();
            }
            
            // Show loading state
            this.elements.llmOutput.innerHTML = '<p>Loading response...</p>';
            
            // Send WebSocket message for LLM assistance
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: 'llm_assist',
                    command: command
                });
                this.socket.send(message);
            } else {
                this.elements.llmOutput.innerHTML = '<p>Error: WebSocket not connected</p>';
            }
        } catch (error) {
            console.error('Error requesting LLM assistance:', error);
            this.elements.llmOutput.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
    
    /**
     * Display LLM response in the assistance panel
     * @param {string} response - The LLM response
     */
    displayLlmResponse(response) {
        if (!this.elements.llmOutput) return;
        
        // Format the response
        const formattedResponse = this.formatMarkdown(response);
        
        // Update the LLM output
        this.elements.llmOutput.innerHTML = formattedResponse;
        
        // Make sure the LLM panel is visible
        if (this.llmCollapsed) {
            this.toggleLlmPanel();
        }
    }
    
    /**
     * Format markdown text for display
     * @param {string} text - The markdown text
     * @returns {string} HTML formatted text
     */
    formatMarkdown(text) {
        if (!text) return '';
        
        // Convert code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Convert headers
        text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        
        // Convert lists
        text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*?<\/li>)\n(?!<li>)/g, '$1</ul>\n');
        text = text.replace(/(?<!<\/ul>\n)(<li>)/g, '<ul>$1');
        
        // Convert paragraphs (lines with content)
        text = text.replace(/^([^<].*?)$/gm, '<p>$1</p>');
        
        // Clean up excess paragraph tags
        text = text.replace(/<p><\/p>/g, '');
        
        return text;
    }
}

// Initialize the terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const terminalOptions = {
        containerId: 'terma-terminal',
        serverUrl: 'http://localhost:8765',
        wsUrl: 'ws://localhost:8765/ws'
    };
    
    const terminal = new TermaTerminal(terminalOptions);
    terminal.init();
    
    // Expose terminal to global scope for debugging
    window.termaTerminal = terminal;
});