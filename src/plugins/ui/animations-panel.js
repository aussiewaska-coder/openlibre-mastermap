/**
 * Animations Panel UI Plugin
 * Provides a collapsible control panel for testing camera animations
 * Features: Toggle button, preset buttons, advanced parameter controls
 */

import animationsPlugin from '../features/animations.js'

export default {
  // Internal state
  state: {
    isPanelOpen: false,
    isAdvancedOpen: false,
    selectedAnimation: 'orbit',
    currentParams: {
      orbit: { duration: 30000, speed: 0.05 },
      flyover: { zoom: 12, pitch: 60, duration: 5000 },
      rotate: { bearing: 0, duration: 3000 },
      pitch: { pitch: 60, duration: 2000 }
    }
  },

  // DOM element references
  elements: {},

  // State monitoring interval
  monitoringInterval: null,

  /**
   * Initialize the animations UI panel
   */
  initialize() {
    this.createPanelDOM()
    this.cacheElements()
    this.attachEventListeners()
    this.startStateMonitoring()

    console.log('✓ Animations UI panel initialized')
  },

  /**
   * Create and inject panel HTML into DOM
   */
  createPanelDOM() {
    // Create toggle button
    const toggleBtn = document.createElement('button')
    toggleBtn.id = 'animations-toggle'
    toggleBtn.className = 'animations-toggle'
    toggleBtn.setAttribute('aria-label', 'Toggle animations panel')
    toggleBtn.setAttribute('aria-expanded', 'false')
    toggleBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `
    document.body.appendChild(toggleBtn)

    // Create panel
    const panel = document.createElement('div')
    panel.id = 'animations-panel'
    panel.className = 'animations-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'Animation Controls')
    panel.setAttribute('hidden', '')
    panel.innerHTML = `
      <!-- Header -->
      <div class="animations-panel-header">
        <h3 class="animations-panel-title">Animations</h3>
        <button class="animations-close" aria-label="Close panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Status Indicator -->
      <div class="animations-status">
        <span class="animations-status-dot"></span>
        <span class="animations-status-text">Ready</span>
      </div>

      <!-- Preset Buttons -->
      <div class="animations-presets">
        <button class="animations-btn" data-action="orbit" aria-label="Orbit around map center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 12L19 5"></path>
          </svg>
          <span>Orbit</span>
        </button>
        <button class="animations-btn" data-action="flyover" aria-label="Zoom in and tilt">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 17V5h16v12"></path>
            <path d="M7 12l5-5 5 5"></path>
          </svg>
          <span>Flyover</span>
        </button>
        <button class="animations-btn" data-action="rotate" aria-label="Rotate to face north">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2v10"></path>
            <path d="M12 22a10 10 0 0 0 0-20"></path>
          </svg>
          <span>Rotate North</span>
        </button>
        <button class="animations-btn" data-action="pitch" aria-label="Tilt camera up">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Pitch Up</span>
        </button>
        <button class="animations-btn animations-btn-stop" data-action="stop" aria-label="Stop animation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          <span>Stop</span>
        </button>
      </div>

      <!-- Advanced Controls Toggle -->
      <button class="animations-advanced-toggle" aria-expanded="false">
        <span>Advanced Options</span>
        <svg class="animations-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Advanced Controls (hidden by default) -->
      <div class="animations-advanced" hidden>
        <!-- Orbit Controls -->
        <div class="animations-control-group" data-animation="orbit">
          <label class="animations-label">
            <span>Duration (sec)</span>
            <span class="animations-value" id="orbit-duration-value">30</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="orbit-duration"
            min="5" 
            max="60" 
            value="30"
            step="5"
            aria-label="Orbit duration"
          />
          
          <label class="animations-label">
            <span>Speed</span>
            <span class="animations-value" id="orbit-speed-value">0.05</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="orbit-speed"
            min="0.01" 
            max="0.2" 
            value="0.05"
            step="0.01"
            aria-label="Orbit speed"
          />
        </div>

        <!-- Flyover Controls -->
        <div class="animations-control-group" data-animation="flyover" hidden>
          <label class="animations-label">
            <span>Zoom</span>
            <span class="animations-value" id="flyover-zoom-value">12</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="flyover-zoom"
            min="8" 
            max="18" 
            value="12"
            step="0.5"
            aria-label="Flyover zoom"
          />
          
          <label class="animations-label">
            <span>Pitch</span>
            <span class="animations-value" id="flyover-pitch-value">60</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="flyover-pitch"
            min="0" 
            max="85" 
            value="60"
            step="5"
            aria-label="Flyover pitch"
          />
          
          <label class="animations-label">
            <span>Duration (sec)</span>
            <span class="animations-value" id="flyover-duration-value">5</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="flyover-duration"
            min="2" 
            max="10" 
            value="5"
            step="1"
            aria-label="Flyover duration"
          />
        </div>

        <!-- Rotate Controls -->
        <div class="animations-control-group" data-animation="rotate" hidden>
          <label class="animations-label">
            <span>Bearing (°)</span>
            <span class="animations-value" id="rotate-bearing-value">0</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="rotate-bearing"
            min="0" 
            max="360" 
            value="0"
            step="15"
            aria-label="Rotate bearing"
          />
          
          <label class="animations-label">
            <span>Duration (sec)</span>
            <span class="animations-value" id="rotate-duration-value">3</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="rotate-duration"
            min="1" 
            max="5" 
            value="3"
            step="0.5"
            aria-label="Rotate duration"
          />
        </div>

        <!-- Pitch Controls -->
        <div class="animations-control-group" data-animation="pitch" hidden>
          <label class="animations-label">
            <span>Pitch</span>
            <span class="animations-value" id="pitch-pitch-value">60</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="pitch-pitch"
            min="0" 
            max="85" 
            value="60"
            step="5"
            aria-label="Pitch value"
          />
          
          <label class="animations-label">
            <span>Duration (sec)</span>
            <span class="animations-value" id="pitch-duration-value">2</span>
          </label>
          <input 
            type="range" 
            class="animations-slider"
            id="pitch-duration"
            min="1" 
            max="5" 
            value="2"
            step="0.5"
            aria-label="Pitch duration"
          />
        </div>
      </div>
    `
    document.body.appendChild(panel)
  },

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.elements = {
      toggleBtn: document.getElementById('animations-toggle'),
      panel: document.getElementById('animations-panel'),
      closeBtn: document.querySelector('.animations-close'),
      statusDot: document.querySelector('.animations-status-dot'),
      statusText: document.querySelector('.animations-status-text'),
      presetBtns: document.querySelectorAll('.animations-btn'),
      advancedToggle: document.querySelector('.animations-advanced-toggle'),
      advancedChevron: document.querySelector('.animations-chevron'),
      advancedSection: document.querySelector('.animations-advanced'),
      sliders: document.querySelectorAll('.animations-slider')
    }
  },

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    // Toggle panel
    this.elements.toggleBtn.addEventListener('click', () => this.togglePanel())
    this.elements.closeBtn.addEventListener('click', () => this.closePanel())

    // Preset buttons
    this.elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action
        this.executePreset(action)
      })
    })

    // Advanced toggle
    this.elements.advancedToggle.addEventListener('click', () => this.toggleAdvanced())

    // Sliders - update value displays and store params
    this.elements.sliders.forEach(slider => {
      slider.addEventListener('input', (e) => this.handleSliderChange(e))
    })

    // Keyboard accessibility - ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isPanelOpen) {
        this.closePanel()
      }
    })
  },

  /**
   * Toggle panel open/closed
   */
  togglePanel() {
    if (this.state.isPanelOpen) {
      this.closePanel()
    } else {
      this.openPanel()
    }
  },

  /**
   * Open panel
   */
  openPanel() {
    this.state.isPanelOpen = true
    this.elements.panel.removeAttribute('hidden')
    this.elements.toggleBtn.setAttribute('aria-expanded', 'true')
  },

  /**
   * Close panel
   */
  closePanel() {
    this.state.isPanelOpen = false
    this.elements.panel.setAttribute('hidden', '')
    this.elements.toggleBtn.setAttribute('aria-expanded', 'false')
  },

  /**
   * Toggle advanced controls
   */
  toggleAdvanced() {
    this.state.isAdvancedOpen = !this.state.isAdvancedOpen

    if (this.state.isAdvancedOpen) {
      this.elements.advancedSection.removeAttribute('hidden')
      this.elements.advancedToggle.setAttribute('aria-expanded', 'true')
      this.showControlsForAnimation(this.state.selectedAnimation)
    } else {
      this.elements.advancedSection.setAttribute('hidden', '')
      this.elements.advancedToggle.setAttribute('aria-expanded', 'false')
    }
  },

  /**
   * Show controls for specific animation type
   */
  showControlsForAnimation(animationType) {
    const controlGroups = this.elements.advancedSection.querySelectorAll('.animations-control-group')
    controlGroups.forEach(group => {
      if (group.dataset.animation === animationType) {
        group.removeAttribute('hidden')
      } else {
        group.setAttribute('hidden', '')
      }
    })
  },

  /**
   * Execute preset animation with current parameters
   */
  executePreset(action) {
    switch (action) {
      case 'orbit': {
        const params = this.state.currentParams.orbit
        animationsPlugin.orbitCenter(params.duration, params.speed)
        this.state.selectedAnimation = 'orbit'
        break
      }

      case 'flyover': {
        const params = this.state.currentParams.flyover
        animationsPlugin.flyover(
          params.zoom,
          params.pitch,
          params.duration
        )
        this.state.selectedAnimation = 'flyover'
        break
      }

      case 'rotate': {
        const params = this.state.currentParams.rotate
        animationsPlugin.rotateTo(params.bearing, params.duration)
        this.state.selectedAnimation = 'rotate'
        break
      }

      case 'pitch': {
        const params = this.state.currentParams.pitch
        animationsPlugin.pitchTo(params.pitch, params.duration)
        this.state.selectedAnimation = 'pitch'
        break
      }

      case 'stop': {
        animationsPlugin.stop()
        break
      }
    }

    // Update controls visibility if advanced is open
    if (this.state.isAdvancedOpen && action !== 'stop') {
      this.showControlsForAnimation(this.state.selectedAnimation)
    }
  },

  /**
   * Handle slider input changes
   */
  handleSliderChange(event) {
    const slider = event.target
    const value = parseFloat(slider.value)
    const valueDisplay = document.getElementById(`${slider.id}-value`)

    // Update display
    if (valueDisplay) {
      valueDisplay.textContent = value
    }

    // Parse slider ID: format is {animation}-{param} (e.g., "orbit-duration")
    const parts = slider.id.split('-')
    const animation = parts[0]
    const param = parts.slice(1).join('-')

    // Update stored parameters
    if (this.state.currentParams[animation]) {
      if (param === 'duration') {
        this.state.currentParams[animation].duration = value * 1000 // Convert to ms
      } else if (param === 'speed') {
        this.state.currentParams[animation].speed = value
      } else if (param === 'zoom') {
        this.state.currentParams[animation].zoom = value
      } else if (param === 'pitch') {
        this.state.currentParams[animation].pitch = value
      } else if (param === 'bearing') {
        this.state.currentParams[animation].bearing = value
      }
    }
  },

  /**
   * Monitor animation state and update UI
   */
  startStateMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const isAnimating = animationsPlugin.isAnimating()
      const currentAnimation = animationsPlugin.getCurrentAnimation()

      // Update status indicator
      if (isAnimating) {
        this.elements.statusDot.classList.add('animating')
        this.elements.statusText.textContent = `Playing: ${currentAnimation}`

        // Disable preset buttons except Stop
        this.elements.presetBtns.forEach(btn => {
          if (btn.dataset.action !== 'stop') {
            btn.disabled = true
          } else {
            btn.disabled = false
          }
        })
      } else {
        this.elements.statusDot.classList.remove('animating')
        this.elements.statusText.textContent = 'Ready'

        // Enable all preset buttons
        this.elements.presetBtns.forEach(btn => {
          btn.disabled = false
        })
      }
    }, 100) // Check every 100ms
  },

  /**
   * Standard plugin lifecycle methods
   */
  enable() {
    this.elements.toggleBtn.style.display = 'block'
  },

  disable() {
    this.closePanel()
    this.elements.toggleBtn.style.display = 'none'
  },

  update(config) {
    // Could update default params, theme, etc.
  },

  cleanup() {
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Remove DOM elements
    this.elements.toggleBtn?.remove()
    this.elements.panel?.remove()
  }
}
