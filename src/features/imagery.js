/**
 * Imagery Feature Module
 * Handles basemap switching between satellite and OpenStreetMap
 */

import mapManager from '../core/mapManager.js'
import stateManager from '../core/stateManager.js'

class ImageryFeature {
  /**
   * Toggle between satellite and OSM basemap
   */
  toggleBasemap(useSatellite) {
    const osmVisibility = useSatellite ? 'none' : 'visible'
    const satelliteVisibility = useSatellite ? 'visible' : 'none'

    mapManager.setLayoutProperty('osm-basemap', 'visibility', osmVisibility)
    mapManager.setLayoutProperty('satellite-basemap', 'visibility', satelliteVisibility)

    stateManager.set('satelliteEnabled', useSatellite)

    const name = useSatellite ? 'Satellite Imagery' : 'OpenStreetMap'
    console.log(`✓ Switched to ${name}`)
  }

  /**
   * Get current basemap
   */
  isSatelliteEnabled() {
    return stateManager.get('satelliteEnabled')
  }

  /**
   * Set to satellite
   */
  setSatellite() {
    this.toggleBasemap(true)
  }

  /**
   * Set to OSM
   */
  setOSM() {
    this.toggleBasemap(false)
  }
}

export default new ImageryFeature()
