/**
 * MASTERMAP - Bare Map Entry Point
 * Simple Australia terrain map with no interaction systems
 */

import mapManager from './core/mapManager.js'
import stateManager from './core/stateManager.js'
import terrainFeature from './plugins/features/terrain.js'
import imageryFeature from './plugins/features/imagery.js'

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
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
