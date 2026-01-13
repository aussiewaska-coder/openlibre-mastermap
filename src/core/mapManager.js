/**
 * Map Manager - Handles MapLibre GL initialization and core map operations
 */

import maplibregl from 'maplibre-gl'
import { createMapStyle } from '../config/tiles.js'
import { getRandomLandmark } from '../config/landmarks.js'
import { MAP_CONFIG } from '../config/defaults.js'

class MapManager {
  constructor() {
    this.map = null
  }

  /**
   * Initialize the map with a random Australian landmark
   */
  initialize(containerId = 'map') {
    const landmark = getRandomLandmark()

    this.map = new maplibregl.Map({
      container: containerId,
      style: createMapStyle(),
      center: [landmark.lng, landmark.lat],
      zoom: landmark.zoom,
      pitch: MAP_CONFIG.initialPitch,
      bearing: MAP_CONFIG.initialBearing,
      maxPitch: MAP_CONFIG.maxPitch,
      attributionControl: true,
      dragPan: true,
      dragRotate: true
    })

    console.log(`✓ Map initialized at ${landmark.name}`)
    return this.map
  }

  /**
   * Get the map instance
   */
  getMap() {
    return this.map
  }

  /**
   * Check if map is loaded
   */
  isLoaded() {
    return this.map && this.map.isStyleLoaded()
  }

  /**
   * Wait for map to be ready
   */
  onLoad(callback) {
    if (!this.map) {
      throw new Error('Map not initialized')
    }
    this.map.on('load', callback)
  }

  /**
   * Listen for map events
   */
  on(event, callback) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.on(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.off(event, callback)
  }

  /**
   * Add a source to the map
   */
  addSource(id, source) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.addSource(id, source)
  }

  /**
   * Add a layer to the map
   */
  addLayer(layer) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.addLayer(layer)
  }

  /**
   * Set terrain effect
   */
  setTerrain(terrainConfig) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.setTerrain(terrainConfig)
  }

  /**
   * Update layout property
   */
  setLayoutProperty(layerId, property, value) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.setLayoutProperty(layerId, property, value)
  }

  /**
   * Update paint property
   */
  setPaintProperty(layerId, property, value) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.setPaintProperty(layerId, property, value)
  }

  /**
   * Ease to a new position
   */
  easeTo(options) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.easeTo(options)
  }

  /**
   * Fly to a new position
   */
  flyTo(options) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.flyTo(options)
  }

  /**
   * Jump to a position instantly
   */
  jumpTo(options) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.jumpTo(options)
  }

  /**
   * Get current center
   */
  getCenter() {
    if (!this.map) throw new Error('Map not initialized')
    return this.map.getCenter()
  }

  /**
   * Get current zoom
   */
  getZoom() {
    if (!this.map) throw new Error('Map not initialized')
    return this.map.getZoom()
  }

  /**
   * Get current pitch
   */
  getPitch() {
    if (!this.map) throw new Error('Map not initialized')
    return this.map.getPitch()
  }

  /**
   * Get current bearing
   */
  getBearing() {
    if (!this.map) throw new Error('Map not initialized')
    return this.map.getBearing()
  }

  /**
   * Set bearing
   */
  setBearing(bearing) {
    if (!this.map) throw new Error('Map not initialized')
    this.map.setBearing(bearing)
  }

  /**
   * Enable/disable drag rotate
   */
  setDragRotate(enabled) {
    if (!this.map) throw new Error('Map not initialized')
    if (enabled) {
      this.map.dragRotate.enable()
    } else {
      this.map.dragRotate.disable()
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  }
}

export default new MapManager()
