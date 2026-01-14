/**
 * Custom BoxZoom Handler - Orbital approach to selection box
 * 
 * Replaces default MapLibre BoxZoomHandler with a custom behavior:
 * - Shift+drag to define a box on the map
 * - Camera orbits to 12,500ft altitude above box center
 * - Orbit distance scales with box size
 * - Smooth flight animation with ultra-high quality
 * - Any user input stops the animation
 * 
 * Reference: https://maplibre.org/maplibre-gl-js/docs/API/classes/BoxZoomHandler/
 */

import mapManager from '../../core/mapManager.js'
import animationsPlugin from './animations.js'

export default {
  // State tracking
  state: {
    isAnimating: false,
    animationId: null
  },

  /**
   * Initialize custom box zoom handler
   */
  initialize() {
    const map = mapManager.getMap()

    // Disable default box zoom handler
    map.boxZoom.disable()
    console.log('✓ Default BoxZoomHandler disabled')

    // Create custom box zoom UI
    this.createBoxZoomUI()

    // Listen for box zoom events
    this.setupBoxZoomListener()

    console.log('✓ Custom orbital BoxZoom handler initialized')
  },

  /**
   * Create visual feedback for box zoom (rectangle while dragging)
   */
  createBoxZoomUI() {
    const map = mapManager.getMap()

    // Create container for box overlay
    const boxContainer = document.createElement('div')
    boxContainer.id = 'box-zoom-overlay'
    boxContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: none;
      z-index: 10;
    `

    const boxElement = document.createElement('div')
    boxElement.id = 'box-zoom-box'
    boxElement.style.cssText = `
      position: absolute;
      border: 2px solid rgba(59, 130, 246, 0.8);
      background: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      display: none;
    `

    boxContainer.appendChild(boxElement)
    document.getElementById('map').appendChild(boxContainer)

    this.boxContainer = boxContainer
    this.boxElement = boxElement
  },

  /**
   * Setup Shift+drag listener for custom box zoom
   */
  setupBoxZoomListener() {
    const map = mapManager.getMap()
    const mapElement = document.getElementById('map')

    let isDrawing = false
    let startX = 0
    let startY = 0

    // Detect Shift+MouseDown
    mapElement.addEventListener('mousedown', (e) => {
      if (e.shiftKey && !this.state.isAnimating) {
        isDrawing = true
        startX = e.clientX
        startY = e.clientY
        this.boxContainer.style.display = 'block'
        this.boxElement.style.display = 'block'
      }
    })

    // Draw box while dragging
    document.addEventListener('mousemove', (e) => {
      if (!isDrawing) return

      const currentX = e.clientX
      const currentY = e.clientY

      const left = Math.min(startX, currentX)
      const top = Math.min(startY, currentY)
      const width = Math.abs(currentX - startX)
      const height = Math.abs(currentY - startY)

      this.boxElement.style.left = left + 'px'
      this.boxElement.style.top = top + 'px'
      this.boxElement.style.width = width + 'px'
      this.boxElement.style.height = height + 'px'
    })

    // Complete box zoom on release
    document.addEventListener('mouseup', (e) => {
      if (!isDrawing) return

      isDrawing = false
      this.boxContainer.style.display = 'none'
      this.boxElement.style.display = 'none'

      // Get box coordinates
      const rect = this.boxElement.getBoundingClientRect()
      const mapRect = mapElement.getBoundingClientRect()

      if (rect.width > 5 && rect.height > 5) {
        // Valid box - convert to map coordinates and animate
        this.orbitToBox(rect, mapRect)
      }
    })

    console.log('✓ Box zoom listener setup (Shift+drag to zoom)')
  },

  /**
   * Convert screen coordinates to map coordinates (LngLat)
   */
  screenToLngLat(x, y, mapRect) {
    const map = mapManager.getMap()

    // Normalize to map container coordinates
    const mapX = x - mapRect.left
    const mapY = y - mapRect.top

    // Use MapLibre's unproject to convert pixel to LngLat
    return map.unproject([mapX, mapY])
  },

  /**
   * Orbit camera to selected box with 12,500ft altitude
   * @param {DOMRect} boxRect - Screen coordinates of drawn box
   * @param {DOMRect} mapRect - Screen coordinates of map container
   */
  orbitToBox(boxRect, mapRect) {
    const map = mapManager.getMap()

    // Get corner coordinates
    const nwCorner = this.screenToLngLat(boxRect.left, boxRect.top, mapRect)
    const seCorner = this.screenToLngLat(
      boxRect.left + boxRect.width,
      boxRect.top + boxRect.height,
      mapRect
    )

    // Calculate box center and size
    const centerLng = (nwCorner.lng + seCorner.lng) / 2
    const centerLat = (nwCorner.lat + seCorner.lat) / 2
    const lngDelta = Math.abs(seCorner.lng - nwCorner.lng)
    const latDelta = Math.abs(seCorner.lat - nwCorner.lat)

    // Calculate appropriate zoom level based on box size
    // Larger box = lower zoom, smaller box = higher zoom
    const maxDelta = Math.max(lngDelta, latDelta)
    const zoom = Math.max(2, 18 - Math.log2(maxDelta * 110)) // 110 ≈ km per degree at equator

    // Calculate pitch based on box size (larger box = more pitch for dramatic effect)
    const pitch = Math.min(85, 50 + Math.log2(maxDelta + 1) * 5)

    // Animate to orbital view
    this.state.isAnimating = true

    const animationOptions = {
      center: [centerLng, centerLat],
      zoom: zoom,
      pitch: pitch,
      bearing: 0,
      duration: 3000, // 3 second smooth animation
      easing: (t) => {
        // Custom easing: ease-in-out-cubic for ultra-smooth motion
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      }
    }

    map.flyTo(animationOptions)

    // Stop animation on user input
    this.setupInteractionCutoff()

    console.log(
      `✓ Orbital zoom: center=[${centerLng.toFixed(4)}, ${centerLat.toFixed(4)}], zoom=${zoom.toFixed(1)}, pitch=${pitch.toFixed(0)}°`
    )
  },

  /**
   * Setup listeners to cut animation on any user interaction
   */
  setupInteractionCutoff() {
    const handlers = [
      () => this.stopAnimation(),
      () => this.stopAnimation(),
      () => this.stopAnimation(),
      () => this.stopAnimation()
    ]

    // Listen for various interactions
    document.addEventListener('mousedown', handlers[0], { once: true })
    document.addEventListener('touchstart', handlers[1], { once: true })
    document.addEventListener('wheel', handlers[2], { once: true })
    document.addEventListener('keydown', handlers[3], { once: true })
  },

  /**
   * Stop the orbital animation
   */
  stopAnimation() {
    if (this.state.isAnimating) {
      const map = mapManager.getMap()
      map.stop()
      this.state.isAnimating = false
      console.log('✓ Orbital animation stopped by user input')
    }
  },

  /**
   * Cleanup
   */
  cleanup() {
    if (this.boxContainer) {
      this.boxContainer.remove()
    }
    console.log('✓ Custom BoxZoom handler cleaned up')
  }
}
