/**
 * MASTERMAP - Bare Map Entry Point
 * Simple Australia terrain map with standard MapLibre interactions only
 */

import mapManager from './core/mapManager.js'
import stateManager from './core/stateManager.js'
import terrainFeature from './plugins/features/terrain.js'
import imageryFeature from './plugins/features/imagery.js'

import trafficPlugin from './plugins/features/traffic.js'
import trafficPanel from './plugins/ui/traffic-panel.js'
import './plugins/ui/traffic-panel.css'


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

    // 4. Initialize Traffic Intel plugin (map layer only, no UI)
    trafficPlugin.initialize()

    // 5. Expose traffic plugin globally
    window.trafficPlugin = trafficPlugin

    // 6. Load initial traffic data (live /api/scan or demo fallback) so clusters exist
    if (trafficPlugin.loadInitialData) {
      trafficPlugin.loadInitialData()
    }

    // 7. Initialize minimal traffic scan UI (bottom sheet toggle with Scan button)
    trafficPanel.initialize()

    

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
  mapManager.destroy()
}

// Start the application
initialize()

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup)
