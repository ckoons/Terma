/**
 * Terma Component for Hephaestus UI
 * 
 * This script provides the integration logic for the Terma terminal component
 * within the Hephaestus UI system. It handles:
 * 
 * 1. Switching between advanced (Terma) and simple terminal modes
 * 2. Terminal session management
 * 3. Settings persistence
 * 4. Hephaestus UI integration
 */

class TermaComponent {
    /**
     * Initialize the Terma component
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            containerId: 'terma-component',
            serverUrl: window.location.protocol + '//' + window.location.host,
            wsUrl: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws'
        }, options);
        
        // Terminal instances
        this.termaTerminal = null;
        this.simpleTerminal = null;
        
        // Current terminal mode (advanced or simple)
        this.currentTerminalMode = localStorage.getItem('terma_terminal_mode') || 'advanced';
        
        // DOM elements
        this.elements = {};
        
        // Initialization state
        this.initialized = false;
    }
    
    /**
     * Initialize the component
     */
    async init() {
        this.log('Initializing Terma component');
        
        try {
            // Find DOM elements
            this.getElements();
            
            // Load required styles and scripts
            await this.loadDependencies();
            
            // Connect to the Hephaestus settings manager
            this.connectToSettingsManager();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Initialize terminal based on saved preference
            await this.initializeTerminal();
            
            // Register with Tekton UI if available
            this.registerWithTektonUI();
            
            this.initialized = true;
            this.log('Terma component initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Terma component:', error);
            return false;
        }
    }
    
    /**
     * Connect to the Hephaestus settings manager
     */
    connectToSettingsManager() {
        if (window.settingsManager) {
            this.log('Connected to Hephaestus settings manager');
            
            // Get terminal settings from global settings manager
            const settings = window.settingsManager.settings;
            
            // Override current terminal mode if set in settings
            if (settings.terminalMode) {
                this.currentTerminalMode = settings.terminalMode;
            }
            
            // Update title based on Greek/functional name setting
            this.updateTitle();
            
            // Listen for names settings changes
            window.settingsManager.addEventListener('namesChanged', () => {
                this.updateTitle();
            });
            
            // Listen for terminal settings changes
            window.settingsManager.addEventListener('terminalModeChanged', (event) => {
                this.log(`Terminal mode changed to: ${event.mode}`);
                if (this.currentTerminalMode !== event.mode) {
                    this.currentTerminalMode = event.mode;
                    this.toggleTerminalMode();
                }
            });
            
            window.settingsManager.addEventListener('terminalFontSizeChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('fontSize', event.size);
                }
            });
            
            window.settingsManager.addEventListener('terminalFontFamilyChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('fontFamily', event.fontFamily);
                }
            });
            
            window.settingsManager.addEventListener('terminalThemeChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('theme', event.theme);
                }
            });
            
            window.settingsManager.addEventListener('terminalCursorStyleChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('cursorStyle', event.cursorStyle);
                }
            });
            
            window.settingsManager.addEventListener('terminalCursorBlinkChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('cursorBlink', event.cursorBlink);
                }
            });
            
            window.settingsManager.addEventListener('terminalScrollbackChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('scrollback', event.scrollback);
                }
            });
            
            window.settingsManager.addEventListener('terminalScrollbackLinesChanged', (event) => {
                if (this.termaTerminal) {
                    this.termaTerminal.updateOption('scrollback', event.scrollback ? event.lines : 0);
                }
            });
            
            window.settingsManager.addEventListener('terminalSettingsChanged', (event) => {
                if (this.termaTerminal) {
                    // Apply all settings at once
                    Object.entries(event.settings).forEach(([key, value]) => {
                        this.termaTerminal.updateOption(key, value);
                    });
                }
            });
        } else {
            this.log('Hephaestus settings manager not found, using local settings');
        }
    }
    
    /**
     * Get DOM elements
     */
    getElements() {
        this.elements = {
            container: document.getElementById(this.options.containerId) || document.querySelector('.terma-container'),
            termaTerminal: document.getElementById('terma-terminal'),
            simpleTerminal: document.getElementById('simple-terminal'),
            sessionSelector: document.getElementById('terma-session-selector'),
            terminalType: document.getElementById('terma-terminal-type'),
            detachBtn: document.getElementById('terma-detach-btn'),
            settingsBtn: document.getElementById('terma-settings-btn'),
            toggleModeBtn: document.getElementById('terma-toggle-mode-btn'),
            settingsModal: document.getElementById('terma-settings-modal'),
            settingsClose: document.getElementById('terma-settings-close'),
            settingsSave: document.getElementById('terma-settings-save'),
            settingsReset: document.getElementById('terma-settings-reset'),
            useAdvancedCheckbox: document.getElementById('terma-use-advanced-terminal'),
            llmToggle: document.getElementById('terma-llm-toggle'),
            llmContent: document.getElementById('terma-llm-content'),
            fontSizeInput: document.getElementById('terma-font-size'),
            fontSizeValue: document.getElementById('terma-font-size-value')
        };
    }
    
    /**
     * Load required dependencies
     */
    async loadDependencies() {
        // Load Terma styles if not already loaded
        this.loadStyles('/ui/css/terma-hephaestus.css');
        
        if (this.currentTerminalMode === 'advanced') {
            // Load xterm.js dependencies for advanced terminal
            await this.loadXtermDependencies();
            
            // Load Terma terminal script
            await this.loadTermaScript();
        }
    }
    
    /**
     * Load a CSS stylesheet
     * @param {string} url - URL of the stylesheet
     */
    loadStyles(url) {
        if (document.querySelector(`link[href="${url}"]`)) {
            return; // Already loaded
        }
        
        const styles = document.createElement('link');
        styles.rel = 'stylesheet';
        styles.href = url;
        document.head.appendChild(styles);
    }
    
    /**
     * Load xterm.js dependencies
     */
    async loadXtermDependencies() {
        const dependencyUrls = [
            'https://cdn.jsdelivr.net/npm/xterm@5.1.0/lib/xterm.min.js',
            'https://cdn.jsdelivr.net/npm/xterm@5.1.0/css/xterm.css',
            'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.7.0/lib/xterm-addon-fit.min.js',
            'https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.8.0/lib/xterm-addon-web-links.min.js',
            'https://cdn.jsdelivr.net/npm/xterm-addon-search@0.12.0/lib/xterm-addon-search.min.js'
        ];
        
        const loadPromises = dependencyUrls.map(url => {
            return new Promise((resolve, reject) => {
                if (url.endsWith('.js')) {
                    if (document.querySelector(`script[src="${url}"]`)) {
                        resolve();
                        return;
                    }
                    
                    const script = document.createElement('script');
                    script.src = url;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                } else if (url.endsWith('.css')) {
                    if (document.querySelector(`link[href="${url}"]`)) {
                        resolve();
                        return;
                    }
                    
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = url;
                    link.onload = resolve;
                    link.onerror = reject;
                    document.head.appendChild(link);
                }
            });
        });
        
        return Promise.all(loadPromises);
    }
    
    /**
     * Load Terma terminal script
     */
    async loadTermaScript() {
        return new Promise((resolve, reject) => {
            const scriptPath = '/terma/ui/js/terma-terminal.js';
            
            if (document.querySelector(`script[src="${scriptPath}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Toggle mode button
        if (this.elements.toggleModeBtn) {
            this.elements.toggleModeBtn.addEventListener('click', () => this.toggleTerminalMode());
        }
        
        // Settings checkbox for terminal mode
        if (this.elements.useAdvancedCheckbox) {
            this.elements.useAdvancedCheckbox.addEventListener('change', () => {
                if (this.elements.useAdvancedCheckbox.checked && this.currentTerminalMode \!== 'advanced') {
                    this.toggleTerminalMode();
                } else if (\!this.elements.useAdvancedCheckbox.checked && this.currentTerminalMode \!== 'simple') {
                    this.toggleTerminalMode();
                }
            });
        }
        
        // Settings button
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        
        // Settings close button
        if (this.elements.settingsClose) {
            this.elements.settingsClose.addEventListener('click', () => this.hideSettingsModal());
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
            this.elements.settingsReset.addEventListener('click', () => this.resetSettings());
        }
        
        // LLM toggle button
        if (this.elements.llmToggle) {
            this.elements.llmToggle.addEventListener('click', () => this.toggleLlmPanel());
        }
        
        // Detach button
        if (this.elements.detachBtn) {
            this.elements.detachBtn.addEventListener('click', () => this.detachTerminal());
        }
    }
    
    /**
     * Initialize terminal based on saved preference
     */
    async initializeTerminal() {
        if (this.currentTerminalMode === 'advanced') {
            // Show advanced terminal
            if (this.elements.termaTerminal) this.elements.termaTerminal.style.display = 'block';
            if (this.elements.simpleTerminal) this.elements.simpleTerminal.style.display = 'none';
            
            // Initialize advanced terminal
            await this.initAdvancedTerminal();
        } else {
            // Show simple terminal
            if (this.elements.termaTerminal) this.elements.termaTerminal.style.display = 'none';
            if (this.elements.simpleTerminal) this.elements.simpleTerminal.style.display = 'block';
            
            // Initialize simple terminal
            this.initSimpleTerminal();
        }
        
        // Update checkbox state
        if (this.elements.useAdvancedCheckbox) {
            this.elements.useAdvancedCheckbox.checked = this.currentTerminalMode === 'advanced';
        }
    }
    
    /**
     * Initialize advanced terminal (Terma)
     */
    async initAdvancedTerminal() {
        try {
            if (typeof TermaTerminal === 'undefined') {
                this.log('TermaTerminal class not found, loading dependencies');
                await this.loadTermaScript();
            }
            
            if (typeof TermaTerminal === 'undefined') {
                throw new Error('Failed to load TermaTerminal class');
            }
            
            // Use settings from the Hephaestus settings manager if available
            let terminalOptions = {
                containerId: 'terma-terminal',
                serverUrl: this.options.serverUrl,
                wsUrl: this.options.wsUrl
            };
            
            // Apply settings from the Hephaestus settings manager if available
            if (window.settingsManager) {
                const settings = window.settingsManager.settings;
                
                // Map Hephaestus settings to Terma terminal options
                if (settings.terminalFontSizePx) terminalOptions.fontSize = settings.terminalFontSizePx;
                if (settings.terminalFontFamily) terminalOptions.fontFamily = settings.terminalFontFamily;
                if (settings.terminalTheme) terminalOptions.theme = settings.terminalTheme;
                if (settings.terminalCursorStyle) terminalOptions.cursorStyle = settings.terminalCursorStyle;
                if (settings.terminalCursorBlink !== undefined) terminalOptions.cursorBlink = settings.terminalCursorBlink;
                if (settings.terminalScrollback !== undefined) {
                    if (settings.terminalScrollback && settings.terminalScrollbackLines) {
                        terminalOptions.scrollback = settings.terminalScrollbackLines;
                    } else {
                        terminalOptions.scrollback = 0; // Disable scrollback
                    }
                }
                
                this.log('Applied Hephaestus settings to terminal');
            }
            
            // Create terminal instance with combined options
            this.termaTerminal = new TermaTerminal(terminalOptions);
            
            // Initialize terminal
            await this.termaTerminal.init();
            
            // Make settings button open the Hephaestus settings panel
            if (this.elements.settingsBtn) {
                this.elements.settingsBtn.removeEventListener('click', this.showSettingsModal);
                this.elements.settingsBtn.addEventListener('click', () => {
                    // Open Hephaestus settings panel and show Terminal section
                    if (window.tektonUI && window.tektonUI.showSettingsPanel) {
                        window.tektonUI.showSettingsPanel();
                        
                        // Focus on terminal settings section (delayed to ensure settings UI is loaded)
                        setTimeout(() => {
                            const terminalSettings = document.querySelector('.settings-section:has(h3:contains("Terminal Settings"))');
                            if (terminalSettings) {
                                terminalSettings.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 300);
                    }
                });
            }
            
            this.log('Advanced terminal initialized');
            return true;
        } catch (error) {
            console.error('Error initializing advanced terminal:', error);
            
            // Fall back to simple terminal
            this.currentTerminalMode = 'simple';
            await this.initializeTerminal();
            return false;
        }
    }
    
    /**
     * Initialize simple terminal
     */
    initSimpleTerminal() {
        try {
            // Check if TerminalManager exists
            if (typeof TerminalManager === 'undefined') {
                this.log('TerminalManager class not found, simple terminal may not function correctly');
                return false;
            }
            
            // Create terminal instance
            this.simpleTerminal = new TerminalManager('simple-terminal');
            this.simpleTerminal.init();
            
            this.log('Simple terminal initialized');
            return true;
        } catch (error) {
            console.error('Error initializing simple terminal:', error);
            return false;
        }
    }
    
    /**
     * Toggle between terminal modes
     */
    async toggleTerminalMode() {
        // Get terminal elements
        const termaTerminalEl = this.elements.termaTerminal;
        const simpleTerminalEl = this.elements.simpleTerminal;
        
        if (\!termaTerminalEl || \!simpleTerminalEl) {
            this.log('Terminal elements not found');
            return;
        }
        
        if (this.currentTerminalMode === 'advanced') {
            // Switch to simple terminal
            termaTerminalEl.style.display = 'none';
            simpleTerminalEl.style.display = 'block';
            this.currentTerminalMode = 'simple';
            
            // Initialize simple terminal if not already done
            if (\!this.simpleTerminal) {
                this.initSimpleTerminal();
            }
        } else {
            // Switch to advanced terminal
            termaTerminalEl.style.display = 'block';
            simpleTerminalEl.style.display = 'none';
            this.currentTerminalMode = 'advanced';
            
            // Initialize advanced terminal if not already done
            if (\!this.termaTerminal) {
                await this.initAdvancedTerminal();
            } else if (this.termaTerminal.fitTerminal) {
                // Fit the terminal to its container
                this.termaTerminal.fitTerminal();
            }
        }
        
        // Update checkbox state
        if (this.elements.useAdvancedCheckbox) {
            this.elements.useAdvancedCheckbox.checked = this.currentTerminalMode === 'advanced';
        }
        
        // Save preference
        localStorage.setItem('terma_terminal_mode', this.currentTerminalMode);
        this.log(`Switched to ${this.currentTerminalMode} terminal mode`);
    }
    
    /**
     * Save terminal settings
     */
    saveSettings() {
        if (this.termaTerminal) {
            // Update terminal settings
            this.termaTerminal.saveSettings();
        }
        
        // Save current mode
        localStorage.setItem('terma_terminal_mode', this.currentTerminalMode);
        
        this.log('Terminal settings saved');
    }
    
    /**
     * Reset terminal settings to defaults
     */
    resetSettings() {
        if (this.termaTerminal) {
            // Reset terminal settings
            this.termaTerminal.resetSettings();
        }
        
        this.log('Terminal settings reset to defaults');
    }
    
    /**
     * Show settings modal
     */
    showSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'block';
        }
    }
    
    /**
     * Hide settings modal
     */
    hideSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
        }
    }
    
    /**
     * Toggle LLM assistance panel
     */
    toggleLlmPanel() {
        if (this.elements.container) {
            const llmPanel = this.elements.container.querySelector('.terma-llm-assistance');
            if (llmPanel) {
                llmPanel.classList.toggle('terma-llm-collapsed');
                
                if (this.termaTerminal && this.termaTerminal.fitTerminal) {
                    // Resize terminal after toggling panel
                    this.termaTerminal.fitTerminal();
                }
            }
        }
    }
    
    /**
     * Detach terminal to separate window
     */
    detachTerminal() {
        if (this.termaTerminal && this.currentTerminalMode === 'advanced') {
            // Use Terma's detach functionality
            this.termaTerminal.detachTerminal();
        } else if (this.simpleTerminal && this.currentTerminalMode === 'simple') {
            // Simple terminal doesn't support detaching, but we could implement it
            this.log('Detaching simple terminal is not supported');
        }
    }
    
    /**
     * Update title based on Greek/functional name setting
     */
    updateTitle() {
        const titleElement = document.getElementById('terma-title');
        if (titleElement && window.settingsManager) {
            const showGreekNames = window.settingsManager.settings.showGreekNames;
            if (showGreekNames) {
                titleElement.textContent = titleElement.getAttribute('data-greek-name') || 'Terma - Terminal';
            } else {
                titleElement.textContent = titleElement.getAttribute('data-functional-name') || 'Terminal';
            }
            this.log(`Updated title to: ${titleElement.textContent}`);
        }
    }
    
    /**
     * Register with Tekton UI if available
     */
    registerWithTektonUI() {
        if (window.tektonUI) {
            window.tektonUI.registerComponentHandler('terma', {
                onActivate: () => {
                    this.log('Terma component activated');
                    
                    // Update title based on current settings
                    this.updateTitle();
                    
                    // Resize terminal if needed
                    if (this.termaTerminal && this.currentTerminalMode === 'advanced') {
                        this.termaTerminal.fitTerminal();
                    }
                },
                onDeactivate: () => {
                    this.log('Terma component deactivated');
                }
            });
        }
    }
    
    /**
     * Log a message for debugging
     * @param {string} message - Message to log
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[TermaComponent] ${message}`);
        }
    }
}

// Initialize component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create component instance
    const termaComponent = new TermaComponent({
        debug: false
    });
    
    // Initialize component
    termaComponent.init().then(success => {
        if (success) {
            // Expose component to global scope for production use
            window.termaComponent = termaComponent;
        }
    });
});
EOF < /dev/null