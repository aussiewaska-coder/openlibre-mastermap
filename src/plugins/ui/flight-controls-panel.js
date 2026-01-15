/**
 * Flight Controls Panel
 * Left-side panel for map animations and camera controls
 */

import mapManager from '../../core/mapManager.js'
import { orbitAroundPoint, addInterruptListeners } from '../../core/orbitAnimation.js'

export default {
  panelEl: null,

  initialize() {
    this.createPanel()
    this.attachEventListeners()
    console.log('✓ Flight controls panel initialized')
  },

  createPanel() {
    const panel = document.createElement('div')
    panel.id = 'flight-controls-panel'
    panel.className = 'flight-controls'
    panel.innerHTML = `
      <div class="flight-header">
        <h3 class="flight-title">Flight Controls</h3>
      </div>

      <div class="flight-controls-content">
        <div class="control-section">
          <label class="control-label">Pitch</label>
          <input type="range" id="pitch-slider" class="control-slider" min="0" max="85" value="60" />
          <span class="control-value" id="pitch-value">60°</span>
        </div>

        <div class="control-section">
          <label class="control-label">Bearing</label>
          <input type="range" id="bearing-slider" class="control-slider" min="0" max="360" value="0" />
          <span class="control-value" id="bearing-value">0°</span>
        </div>

        <div class="control-section">
          <label class="control-label">Zoom</label>
          <input type="range" id="zoom-slider" class="control-slider" min="0" max="20" step="0.5" value="8" />
          <span class="control-value" id="zoom-value">8</span>
        </div>

        <div class="flight-buttons">
          <button id="orbit-toggle" class="flight-btn flight-btn-secondary">
            <span class="btn-icon">⟳</span>
            Start Orbit
          </button>
          <button id="stop-orbit" class="flight-btn flight-btn-secondary" style="display: none;">
            <span class="btn-icon">⏹</span>
            Stop Orbit
          </button>
        </div>

        <div class="control-section">
          <label class="control-label">Projection</label>
          <button id="toggle-projection" class="flight-btn flight-btn-full">
            🌍 Globe Mode
          </button>
        </div>
      </div>
    `
    document.body.appendChild(panel)
    this.panelEl = panel
  },

  attachEventListeners() {
    const map = mapManager.getMap()

    // Pitch slider
    document.getElementById('pitch-slider').addEventListener('input', (e) => {
      const pitch = parseFloat(e.target.value)
      map.setPitch(pitch)
      document.getElementById('pitch-value').textContent = `${pitch}°`
    })

    // Bearing slider
    document.getElementById('bearing-slider').addEventListener('input', (e) => {
      const bearing = parseFloat(e.target.value)
      map.setBearing(bearing)
      document.getElementById('bearing-value').textContent = `${bearing}°`
    })

    // Zoom slider
    document.getElementById('zoom-slider').addEventListener('input', (e) => {
      const zoom = parseFloat(e.target.value)
      map.setZoom(zoom)
      document.getElementById('zoom-value').textContent = zoom.toFixed(1)
    })

    // Sync sliders from map changes
    map.on('pitchend', () => {
      document.getElementById('pitch-slider').value = map.getPitch()
      document.getElementById('pitch-value').textContent = `${Math.round(map.getPitch())}°`
    })

    map.on('rotateend', () => {
      document.getElementById('bearing-slider').value = map.getBearing()
      document.getElementById('bearing-value').textContent = `${Math.round(map.getBearing())}°`
    })

    map.on('zoomend', () => {
      document.getElementById('zoom-slider').value = map.getZoom()
      document.getElementById('zoom-value').textContent = map.getZoom().toFixed(1)
    })

    // Orbit button
    document.getElementById('orbit-toggle').addEventListener('click', () => {
      this.startOrbit()
    })

    document.getElementById('stop-orbit').addEventListener('click', () => {
      this.stopOrbit()
    })

    // Projection toggle
    document.getElementById('toggle-projection').addEventListener('click', () => {
      const currentProj = map.getProjection()
      if (!currentProj || !currentProj.type) return
      const newProj = currentProj.type === 'globe' ? { type: 'mercator' } : { type: 'globe' }
      map.setProjection(newProj)
      this.updateProjectionButton()
    })

    // Defer updateProjectionButton until map is ready
    setTimeout(() => this.updateProjectionButton(), 100)
  },

  startOrbit() {
    const map = mapManager.getMap()
    const center = map.getCenter()
    const pitch = map.getPitch()

    const orbitControl = orbitAroundPoint({
      center,
      duration: 60000,
      degreesPerSecond: 6,
      pitch,
      onStop: () => this.onOrbitStop(),
    })

    this.currentOrbit = orbitControl
    addInterruptListeners(orbitControl)

    // Update UI
    document.getElementById('orbit-toggle').style.display = 'none'
    document.getElementById('stop-orbit').style.display = 'flex'
  },

  stopOrbit() {
    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
      this.onOrbitStop()
    }
  },

  onOrbitStop() {
    document.getElementById('orbit-toggle').style.display = 'flex'
    document.getElementById('stop-orbit').style.display = 'none'
    this.currentOrbit = null
  },

  updateProjectionButton() {
    const map = mapManager.getMap()
    const btn = document.getElementById('toggle-projection')
    if (!btn) return
    const proj = map.getProjection()
    if (!proj || !proj.type) return
    const isGlobe = proj.type === 'globe'
    btn.textContent = isGlobe ? '🗺️ Mercator Mode' : '🌍 Globe Mode'
  },

  cleanup() {
    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.panelEl) this.panelEl.remove()
  },
}
