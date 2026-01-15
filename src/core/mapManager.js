/**
 * Map Manager - Handles MapLibre GL initialization and core map operations
 */

import maplibregl from 'maplibre-gl'
import { createMapStyle } from '../config/tiles.js'
import { MAP_CONFIG, AUSTRALIA_VIEW } from '../config/defaults.js'

class MapManager {
  constructor() {
    this.map = null
  }

  /**
   * Initialize the map with top-down Australia view in globe projection
   *
   * MapLibre Handlers Enabled (built-in, automatic):
   * - BoxZoomHandler: Shift + drag to draw selection box and zoom to bounds
   * - DragPanHandler: Click + drag to pan the map (dragPan: true)
   * - DragRotateHandler: Right-click + drag to rotate the map (dragRotate: true)
   * - ScrollZoomHandler: Mouse wheel to zoom
   * - DoubleClickZoomHandler: Double-click to zoom in
   * - KeyboardHandler: Arrow keys to pan, +/- to zoom
   * - TwoFingersTouchZoomHandler: Pinch to zoom (mobile)
   * - TwoFingersTouchRotateHandler: Two-finger rotate (mobile)
   *
   * MapLibre Controls Added (via controls plugin):
   * - NavigationControl: Zoom buttons + compass
   * - AustraliaControl: Return to home view
   * - GlobeControl: Toggle between globe and mercator projections
   * - GeolocateControl: Show user's location
   * - FullscreenControl: Fullscreen toggle
   * - ScaleControl: Distance scale bar
   * - AttributionControl: Map attribution (automatic)
   * - LogoControl: MapLibre logo (automatic)
   *
   * No custom interaction handlers - using official MapLibre API only.
   */
  initialize(containerId = 'map') {
    this.map = new maplibregl.Map({
      container: containerId,
      style: createMapStyle(),
      center: AUSTRALIA_VIEW.center,
      zoom: AUSTRALIA_VIEW.zoom,
      pitch: AUSTRALIA_VIEW.pitch,
      bearing: AUSTRALIA_VIEW.bearing,
      maxPitch: MAP_CONFIG.maxPitch,
      attributionControl: true
    })

    // Expose map for debugging
    if (typeof window !== 'undefined') {
      window.map = this.map
    }

    // Globe projection is set in main.js after all plugins initialize

    console.log(`✓ Map initialized`)
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
