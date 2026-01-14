/**
 * MASTERMAP - Bare Map Entry Point
 * Simple Australia terrain map with standard MapLibre interactions only
 */

import mapManager from './core/mapManager.js'
import stateManager from './core/stateManager.js'
import terrainFeature from './plugins/features/terrain.js'
import imageryFeature from './plugins/features/imagery.js'
import controlsPlugin from './plugins/features/controls.js'
import animationsPlugin from './plugins/features/animations.js'
import animationsPanelUI from './plugins/ui/animations-panel.js'
import trafficPlugin from './plugins/features/traffic.js'
import trafficPanelUI from './plugins/ui/traffic-panel.js'
import policePlugin from './plugins/features/police-reports.js'
import policePanelUI from './plugins/ui/police-panel.js'
import './plugins/ui/traffic-panel.css'
import './plugins/ui/police-panel.css'
import { orbitAroundPoint, addInterruptListeners } from './core/orbitAnimation.js'

// Module-level state for box zoom orbit (accessible in cleanup)
let currentBoxOrbit = null
let cleanupBoxInterrupts = null

/**
 * Initialize the application
 */
async function initialize() {
  try {
    // 1. Initialize map
    console.log('Initializing MASTERMAP...')
    mapManager.initialize('map')

    // 2. Wait for map to load
    await new Promise((resolve) => {
      mapManager.onLoad(resolve)
    })

    // 3. Initialize terrain features
    terrainFeature.initialize()
    imageryFeature.setSatellite()

    // 4. Initialize MapLibre official controls
    controlsPlugin.initialize()

    // 5. Initialize animations plugin
    animationsPlugin.initialize()

    // 6. Initialize animations UI panel
    animationsPanelUI.initialize()

    // 7. Initialize Traffic Intel plugin
    trafficPlugin.initialize()

    // 8. Initialize Traffic Intel UI panel
    trafficPanelUI.initialize()

    // 9. Expose traffic plugin globally for map interactions
    window.trafficPlugin = trafficPlugin

    // 10. Initialize Police Reports plugin
    policePlugin.initialize()

    // 11. Initialize Police Reports UI panel
    policePanelUI.initialize()

    // 12. Expose police plugin globally for map interactions
    window.policePlugin = policePlugin

    // 13. Setup box zoom → orbit feature
    // When user completes a box zoom selection (Shift+drag), automatically start
    // an orbit animation around the center of the zoomed area using reusable orbit module
    const map = mapManager.getMap()
    let boxZoomActive = false

    map.on('boxzoomstart', () => {
      boxZoomActive = true
      // Stop any existing orbit
      if (currentBoxOrbit && currentBoxOrbit.isRunning()) {
        currentBoxOrbit.stop()
      }
      if (cleanupBoxInterrupts) {
        cleanupBoxInterrupts()
      }
      // Also stop animations plugin orbits
      if (animationsPlugin.isAnimating()) {
        animationsPlugin.stop()
      }
      console.log('🎯 Box zoom started')
    })

    map.on('moveend', () => {
      if (boxZoomActive) {
        boxZoomActive = false

        // Get the center point of the selected box (this stays FIXED)
        const bounds = map.getBounds()
        const centerPoint = bounds.getCenter()
        const currentZoom = map.getZoom()

        // Get current bearing to keep camera locked on center
        const currentBearing = map.getBearing()

        // Adaptive pitch based on zoom level
        const targetPitch = Math.max(20, 65 - (currentZoom * 3))

        // Fly to center with CURRENT bearing - keeps camera locked
        map.flyTo({
          center: centerPoint,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: targetPitch,
          duration: 2000
        })

        console.log(`✓ Flying to adaptive pitch, center locked`)

        // Start orbital animation after flyTo completes using reusable orbit module
        setTimeout(() => {
          currentBoxOrbit = orbitAroundPoint({
            center: centerPoint,
            duration: 60000,
            degreesPerSecond: 6,
            pitch: targetPitch,
            onStop: () => {
              console.log('✓ Box zoom orbit completed')
            },
          })

          // Add interrupt listeners - stops orbit on user interaction
          cleanupBoxInterrupts = addInterruptListeners(currentBoxOrbit)
        }, 2100) // Wait for flyTo (2000ms) + small buffer
      }
    })

    map.on('boxzoomcancel', () => {
      boxZoomActive = false
      console.log('🎯 Box zoom cancelled')
    })

    // 14. Set globe projection after all plugins initialized
    // CRITICAL: Must use object format {type: 'globe'}, not string 'globe'
    map.setProjection({type: 'globe'})
    console.log('✓ Globe projection enabled on startup')

    // 15. Start subtle continuous horizontal pan animation immediately
    // Camera pans horizontally across the globe (longitude changes)
    // The animation runs for 2 hours (7200000ms) providing continuous panning
    animationsPlugin.orbitCenter(
      7200000,   // Duration: 2 hours (continuous rotation)
      -0.01      // Longitude increment: -0.01 degrees per frame (eastward pan)
    )
    console.log('✓ Globe horizontal pan animation started - smooth panning across Australia')

    // 16. Stop animation on any user interaction
    // Listen for all types of user input and stop the animation
    const stopAnimationOnInteraction = () => {
      if (animationsPlugin.isAnimating()) {
        animationsPlugin.stop()
        console.log('✓ Animation stopped by user interaction')
        // Remove all listeners after first interaction
        document.removeEventListener('mousedown', stopAnimationOnInteraction)
        document.removeEventListener('touchstart', stopAnimationOnInteraction)
        document.removeEventListener('wheel', stopAnimationOnInteraction)
        document.removeEventListener('keydown', stopAnimationOnInteraction)
      }
    }

    // Add listeners for all types of interaction
    document.addEventListener('mousedown', stopAnimationOnInteraction, { once: false })
    document.addEventListener('touchstart', stopAnimationOnInteraction, { once: false })
    document.addEventListener('wheel', stopAnimationOnInteraction, { once: false })
    document.addEventListener('keydown', stopAnimationOnInteraction, { once: false })

    // 17. Expose animations plugin globally for console access
    window.animationsPlugin = animationsPlugin

    console.log('✓ MASTERMAP initialized successfully')
    console.log('✓ Traffic Intel & Police Reports plugins loaded')
    console.log('✓ Reusable orbit animation module active - used by box zoom, traffic alerts, & police reports')
  } catch (error) {
    console.error('Failed to initialize MASTERMAP:', error)
  }
}

/**
 * Cleanup on page unload
 */
function cleanup() {
  stateManager.cleanup()
  terrainFeature.cleanup()
  animationsPlugin.cleanup()
  animationsPanelUI.cleanup()
  trafficPlugin.cleanup()
  trafficPanelUI.cleanup()
  policePlugin.cleanup()
  policePanelUI.cleanup()
  if (currentBoxOrbit && currentBoxOrbit.isRunning()) {
    currentBoxOrbit.stop()
  }
  if (cleanupBoxInterrupts) {
    cleanupBoxInterrupts()
  }
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
