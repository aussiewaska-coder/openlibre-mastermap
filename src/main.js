/**
 * MASTERMAP - Modular Refactored Entry Point
 * Coordinates initialization of all modules and features
 */

import mapManager from './core/mapManager.js'
import stateManager from './core/stateManager.js'
import terrainFeature from './plugins/features/terrain.js'
import imageryFeature from './plugins/features/imagery.js'
import cameraFeature from './plugins/features/camera.js'
import controlsFeature from './plugins/features/controls.js'

import { createLandmarkMarkers } from './plugins/ui/landmarks.js'
import { AUSTRALIA_LANDMARKS } from './config/landmarks.js'

import { setupKeyboardListeners } from './plugins/interactions/keyboard.js'
import { setupMouseListeners } from './plugins/interactions/mouse.js'
import { setupLoadingAnimation } from './plugins/interactions/loadingAnimation.js'

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

    // 3. Initialize features
    terrainFeature.initialize()
    imageryFeature.setSatellite() // Start with satellite imagery

    // 4. Create landmark markers
    createLandmarkMarkers(AUSTRALIA_LANDMARKS, mapManager.getMap())

    // 5. Setup controls
    controlsFeature.setupControls()
    controlsFeature.setupMapInteractionListeners()
    controlsFeature.setupInfoPanelUpdates()

    // 6. Setup interactions
    setupKeyboardListeners()
    setupMouseListeners()
    setupLoadingAnimation()

    // 7. Start initial orbit animation
    cameraFeature.startOrbit()

    console.log('✓ MASTERMAP initialized successfully')
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
  cameraFeature.cleanup()
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
