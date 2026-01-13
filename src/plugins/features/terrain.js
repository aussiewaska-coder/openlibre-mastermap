/**
 * Terrain Feature Module
 * Handles DEM setup, hillshade layer, and terrain exaggeration control
 */

import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'
import { DEM_SOURCE } from '../../config/tiles.js'
import { MAP_CONFIG } from '../../config/defaults.js'

class TerrainFeature {
  constructor() {
    this.listeners = []
  }

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

    // Listen for DEM loading
    this._setupDebugListeners(map)

    console.log('✓ Terrain (DEM) source added with Terrarium encoding')
    console.log('✓ Hillshade layer added')

    // Update state
    stateManager.set('terrainExaggeration', MAP_CONFIG.defaultExaggeration)
    stateManager.set('hillshadeVisible', true)
  }

  /**
   * Set terrain exaggeration
   */
  setExaggeration(value) {
    value = Math.max(
      MAP_CONFIG.minExaggeration,
      Math.min(MAP_CONFIG.maxExaggeration, value)
    )

    mapManager.setTerrain({
      source: DEM_SOURCE.id,
      exaggeration: value
    })

    stateManager.set('terrainExaggeration', value)
  }

  /**
   * Get current exaggeration
   */
  getExaggeration() {
    return stateManager.get('terrainExaggeration')
  }

  /**
   * Toggle hillshade visibility
   */
  setHillshadeVisible(visible) {
    mapManager.setLayoutProperty(
      MAP_CONFIG.hillshadeId,
      'visibility',
      visible ? 'visible' : 'none'
    )
    stateManager.set('hillshadeVisible', visible)
  }

  /**
   * Get hillshade visibility
   */
  isHillshadeVisible() {
    return stateManager.get('hillshadeVisible')
  }

  /**
   * Setup debug listeners for terrain loading
   */
  _setupDebugListeners(map) {
    map.on('sourcedataloading', (e) => {
      if (e.sourceId === DEM_SOURCE.id) {
        console.log('DEM tiles loading...')
      }
    })

    map.on('error', (e) => {
      if (e.error && e.error.message) {
        console.error('Map error:', e.error.message)
      }
    })
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.listeners.forEach(({ map, event, callback }) => {
      map.off(event, callback)
    })
    this.listeners = []
  }
}

export default new TerrainFeature()
