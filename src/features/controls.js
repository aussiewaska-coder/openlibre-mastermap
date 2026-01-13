/**
 * Controls Feature Module
 * Handles all control panel interactions and event listeners
 */

import stateManager from '../core/stateManager.js'
import terrainFeature from './terrain.js'
import imageryFeature from './imagery.js'
import cameraFeature from './camera.js'
import { updateInfoPanel } from '../ui/infoPanel.js'
import mapManager from '../core/mapManager.js'

class ControlsFeature {
  /**
   * Setup all control panel event listeners
   */
  setupControls() {
    this._setupTerrainControls()
    this._setupImageryControls()
    this._setupCameraControls()
  }

  /**
   * Setup terrain exaggeration slider
   */
  _setupTerrainControls() {
    const exaggerationSlider = document.getElementById('exaggeration-slider')
    const exaggerationValue = document.getElementById('exaggeration-value')

    if (!exaggerationSlider) {
      console.warn('Exaggeration slider not found')
      return
    }

    exaggerationSlider.addEventListener('input', (e) => {
      const exaggeration = parseFloat(e.target.value)
      exaggerationValue.textContent = exaggeration.toFixed(1)
      terrainFeature.setExaggeration(exaggeration)
    })

    // Setup hillshade toggle
    const hillshadeToggle = document.getElementById('hillshade-toggle')
    if (hillshadeToggle) {
      hillshadeToggle.addEventListener('change', (e) => {
        terrainFeature.setHillshadeVisible(e.target.checked)
      })
    }
  }

  /**
   * Setup imagery/basemap controls
   */
  _setupImageryControls() {
    const satelliteToggle = document.getElementById('satellite-toggle')
    if (!satelliteToggle) {
      console.warn('Satellite toggle not found')
      return
    }

    satelliteToggle.addEventListener('change', (e) => {
      imageryFeature.toggleBasemap(e.target.checked)
    })
  }

  /**
   * Setup camera control buttons
   */
  _setupCameraControls() {
    // 3D Mode button
    const pitchButton = document.getElementById('pitch-button')
    if (pitchButton) {
      pitchButton.addEventListener('click', () => {
        cameraFeature.toggle3DMode()
        pitchButton.textContent = stateManager.get('is3DMode')
          ? 'Exit 3D Mode'
          : 'Enter 3D Mode (Right-click to rotate)'
      })
    }

    // Orbit button
    const orbitButton = document.getElementById('orbit-button')
    if (orbitButton) {
      orbitButton.addEventListener('click', (e) => {
        e.stopPropagation()
        if (stateManager.get('isOrbiting')) {
          cameraFeature.stopOrbit()
          orbitButton.textContent = 'Start Orbit (45°)'
        } else {
          cameraFeature.startOrbit()
          orbitButton.textContent = 'Stop Orbit'
        }
      })
    }

    // Flight button
    const flightButton = document.getElementById('flight-button')
    if (flightButton) {
      flightButton.addEventListener('click', (e) => {
        e.stopPropagation()
        if (stateManager.get('isFlying')) {
          cameraFeature.stopFlight()
          flightButton.textContent = 'Random Flight'
        } else {
          cameraFeature.startFlight()
          flightButton.textContent = 'Stop Flight'
        }
      })
    }

    // Australia view button
    const australiaButton = document.getElementById('australia-button')
    if (australiaButton) {
      australiaButton.addEventListener('click', (e) => {
        e.stopPropagation()

        // Hide landmark labels
        const landmarkMarkers = stateManager.get('landmarkMarkers')
        const hideMarkers = () => {
          for (const marker of landmarkMarkers) {
            marker.remove()
          }
        }

        // Enable satellite imagery
        const satelliteToggle = document.getElementById('satellite-toggle')
        if (satelliteToggle) {
          satelliteToggle.checked = true
        }
        imageryFeature.setSatellite()

        // Fly to Australia
        cameraFeature.flyToAustralia(hideMarkers)
      })
    }
  }

  /**
   * Stop auto-animations on user interaction
   */
  setupMapInteractionListeners() {
    mapManager.on('dragstart', () => {
      if (stateManager.get('isOrbiting')) {
        cameraFeature.stopOrbit()
      }
      if (stateManager.get('isFlying')) {
        cameraFeature.stopFlight()
      }
    })

    mapManager.on('zoomstart', () => {
      if (stateManager.get('isOrbiting')) {
        cameraFeature.stopOrbit()
      }
      if (stateManager.get('isFlying')) {
        cameraFeature.stopFlight()
      }
    })
  }

  /**
   * Update info panel on map movement
   */
  setupInfoPanelUpdates() {
    const updateInfo = () => {
      const center = mapManager.getCenter()
      const zoom = mapManager.getZoom()
      updateInfoPanel(zoom, center)
    }

    mapManager.on('move', updateInfo)
    mapManager.on('zoom', updateInfo)
    updateInfo()
  }

  /**
   * Cleanup all event listeners
   */
  cleanup() {
    // Note: Event listeners attached via addEventListener should be cleaned up
    // by removing the elements or calling removeEventListener
  }
}

export default new ControlsFeature()
