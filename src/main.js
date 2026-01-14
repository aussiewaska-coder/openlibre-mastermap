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

    // 7. Setup box zoom → orbit feature
    // When user completes a box zoom selection (Shift+drag), automatically start
    // an orbit animation around the center of the zoomed area
    const map = mapManager.getMap()
    let boxZoomActive = false

    map.on('boxzoomstart', () => {
      boxZoomActive = true
      // Stop any existing animations
      if (animationsPlugin.isAnimating()) {
        animationsPlugin.stop()
      }
      console.log('🎯 Box zoom started')
    })

    map.on('moveend', () => {
      if (boxZoomActive) {
        boxZoomActive = false
        const center = map.getCenter()
        const zoom = map.getZoom()

        console.log(`✓ Starting orbit at [${center.lng.toFixed(2)}, ${center.lat.toFixed(2)}] zoom: ${zoom.toFixed(1)}`)

        // Ultra-smooth orbit animation
        // Duration: 60 seconds for one complete rotation cycle
        // Bearing increment: 0.05 degrees per frame = smooth, slow rotation
        animationsPlugin.orbitCenter(60000, 0.05)
      }
    })

    map.on('boxzoomcancel', () => {
      boxZoomActive = false
      console.log('🎯 Box zoom cancelled')
    })

    // 8. Set globe projection after all plugins initialized
    // CRITICAL: Must use object format {type: 'globe'}, not string 'globe'
    map.setProjection({type: 'globe'})
    console.log('✓ Globe projection enabled on startup')

    // 9. Start subtle continuous horizontal pan animation immediately
    // Camera pans horizontally across the globe (longitude changes)
    // The animation runs for 2 hours (7200000ms) providing continuous panning
    animationsPlugin.orbitCenter(
      7200000,   // Duration: 2 hours (continuous rotation)
      -0.01      // Longitude increment: -0.01 degrees per frame (eastward pan)
    )
    console.log('✓ Globe horizontal pan animation started - smooth panning across Australia')

    // 10. Stop animation on any user interaction
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

    // Expose animations plugin globally for console access
    window.animationsPlugin = animationsPlugin

    console.log('✓ MASTERMAP initialized successfully')
    console.log('✓ Animations UI panel active - toggle button bottom-left')
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
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
