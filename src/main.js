/**
 * MASTERMAP - Bare Map Entry Point
 * Simple Australia terrain map with standard MapLibre interactions only
 */

import mapManager from './core/mapManager.js'
import stateManager from './core/stateManager.js'
import terrainFeature from './plugins/features/terrain.js'
import imageryFeature from './plugins/features/imagery.js'
import controlsPlugin from './plugins/features/controls.js'

import trafficPlugin from './plugins/features/traffic.js'
import consolidatedDashboard from './plugins/ui/consolidated-dashboard.js'
import './plugins/ui/consolidated-dashboard.css'



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

    

    // 6. Initialize Traffic Intel plugin (map layer only, no UI)
    trafficPlugin.initialize()

    // 7. Expose traffic plugin globally
    window.trafficPlugin = trafficPlugin

    // 8. Initialize consolidated dashboard (left sidebar)
    consolidatedDashboard.initialize()

    

    

    // 14. Set globe projection after all plugins initialized
    const map = mapManager.getMap()
    // Use standard MapLibre projection name to avoid projection warnings
    map.setProjection('globe')
    console.log('✓ Globe projection enabled on startup')

    console.log('✓ MASTERMAP initialized successfully')
    console.log('✓ Traffic Intel dashboard active (left sidebar)')
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
  trafficPlugin.cleanup()
  consolidatedDashboard.cleanup()
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
