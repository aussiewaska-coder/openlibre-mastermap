/**
 * Imagery Feature Module
 * Handles basemap layer setup
 */

import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'

class ImageryFeature {
  /**
   * Initialize satellite basemap
   */
  setSatellite() {
    mapManager.setLayoutProperty('osm-basemap', 'visibility', 'none')
    mapManager.setLayoutProperty('satellite-basemap', 'visibility', 'visible')
    stateManager.set('satelliteEnabled', true)
    console.log('✓ Satellite imagery enabled')
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup handled by mapManager
  }
}

export default new ImageryFeature()
