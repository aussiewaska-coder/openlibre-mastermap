/**
 * Terrain Feature Module
 * Handles DEM setup and hillshade layer
 */

import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'
import { DEM_SOURCE } from '../../config/tiles.js'
import { MAP_CONFIG } from '../../config/defaults.js'

class TerrainFeature {
  /**
   * Initialize terrain (DEM and hillshade)
   */
  initialize() {
    const map = mapManager.getMap()

    // Add DEM source (Terrarium encoding)
    mapManager.addSource(DEM_SOURCE.id, {
      type: DEM_SOURCE.type,
      tiles: DEM_SOURCE.tiles,
      tileSize: DEM_SOURCE.tileSize,
      encoding: DEM_SOURCE.encoding,
      minzoom: DEM_SOURCE.minzoom,
      maxzoom: DEM_SOURCE.maxzoom
    })

    // Set terrain effect
    mapManager.setTerrain({
      source: DEM_SOURCE.id,
      exaggeration: MAP_CONFIG.defaultExaggeration
    })

    // Add hillshade layer
    mapManager.addLayer({
      id: MAP_CONFIG.hillshadeId,
      source: DEM_SOURCE.id,
      type: 'hillshade',
      paint: {
        'hillshade-shadow-color': MAP_CONFIG.hillshadeShadowColor,
        'hillshade-highlight-color': MAP_CONFIG.hillshadeHighlightColor,
        'hillshade-exaggeration': MAP_CONFIG.hillshadeExaggeration
      }
    })

    // Setup error listeners
    map.on('error', (e) => {
      if (e.error && e.error.message) {
        console.error('Map error:', e.error.message)
      }
    })

    console.log('✓ Terrain (DEM) initialized')
    console.log('✓ Hillshade layer added')
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup handled by mapManager
  }
}

export default new TerrainFeature()
