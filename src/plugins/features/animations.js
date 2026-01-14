/**
 * Animations Plugin - Camera movement animations using MapLibre official API
 * Provides orbit, flyover, and camera path animations
 * Reference: https://maplibre.org/maplibre-gl-js/docs/examples/animate-map-camera-around-a-point/
 */

import mapManager from '../../core/mapManager.js'

export default {
  // Animation state
  animationState: {
    isAnimating: false,
    currentAnimation: null,
    animationId: null,
    startTime: null
  },

  /**
   * Initialize animations plugin
   */
  initialize() {
    console.log('✓ Animations plugin initialized')
  },

  /**
   * Horizontal pan animation - pans camera horizontally across the globe
   * @param {number} durationMs - Total animation duration in milliseconds
   * @param {number} longitudeIncrement - Longitude change per frame (degrees)
   */
  orbitCenter(durationMs = 30000, degreesPerSecond = 10) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()
    const center = map.getCenter()
    const startTime = Date.now()
    const startBearing = map.getBearing()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'orbit'

    const animate = (timestamp) => {
      const elapsed = Date.now() - startTime

      if (elapsed >= durationMs) {
        // Animation complete - return to start bearing
        map.rotateTo(startBearing, { duration: 0 })
        this.animationState.isAnimating = false
        this.animationState.currentAnimation = null
        this.animationState.animationId = null
        console.log('✓ Orbit animation complete')
        return
      }

      // Calculate bearing based on elapsed time
      // degreesPerSecond determines rotation speed
      const secondsElapsed = elapsed / 1000
      const newBearing = (startBearing + (secondsElapsed * degreesPerSecond)) % 360

      // Rotate camera to new bearing around fixed center
      // duration: 0 means instant rotation (smoothness from requestAnimationFrame)
      map.rotateTo(newBearing, { duration: 0 })

      // Continue animation
      this.animationState.animationId = requestAnimationFrame(animate)
    }

    this.animationState.animationId = requestAnimationFrame(animate)
    console.log(`✓ Orbit animation started: ${degreesPerSecond}°/sec around [${center.lng.toFixed(2)}, ${center.lat.toFixed(2)}]`)
  },

  /**
   * Orbit camera around a center point at a fixed radius
   * Camera moves in circular path while maintaining distance and looking at center
   * @param {number} durationMs - Total animation duration in milliseconds
   * @param {number} degreesPerSecond - Rotation speed (degrees per second)
   * @param {object} centerPoint - LngLat object of orbit center
   * @param {number} radiusDegrees - Orbital radius in degrees
   * @param {number} pitch - Camera pitch angle (0-85, default: 60)
   */
  orbitWithRadius(durationMs = 60000, degreesPerSecond = 6, centerPoint, radiusDegrees, pitch = 60) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()
    const startTime = Date.now()
    const startBearing = map.getBearing()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'orbit-radius'

    const animate = (timestamp) => {
      const elapsed = Date.now() - startTime

      if (elapsed >= durationMs) {
        this.animationState.isAnimating = false
        this.animationState.currentAnimation = null
        this.animationState.animationId = null
        console.log('✓ Orbital animation complete')
        return
      }

      // Calculate current bearing angle around center
      const secondsElapsed = elapsed / 1000
      const currentBearing = (startBearing + (secondsElapsed * degreesPerSecond)) % 360

      // Calculate camera position at this bearing and radius
      const bearingRad = (currentBearing * Math.PI) / 180
      const cameraLng = centerPoint.lng + radiusDegrees * Math.sin(bearingRad)
      const cameraLat = centerPoint.lat + radiusDegrees * Math.cos(bearingRad)

      // Move camera to new position, pointing toward center
      map.jumpTo({
        center: { lng: cameraLng, lat: cameraLat },
        bearing: (currentBearing + 180) % 360, // Always face center
        pitch: pitch,
        zoom: map.getZoom() // Maintain current zoom
      })

      this.animationState.animationId = requestAnimationFrame(animate)
    }

    this.animationState.animationId = requestAnimationFrame(animate)
    console.log(`✓ Orbital animation started: ${degreesPerSecond}°/sec at radius ${radiusDegrees.toFixed(3)}° around [${centerPoint.lng.toFixed(2)}, ${centerPoint.lat.toFixed(2)}]`)
  },

  /**
   * Smooth camera flyover - zoom in, pan, and return to original position
   * @param {number} targetZoom - Zoom level to fly to
   * @param {number} targetPitch - Pitch angle (0-85)
   * @param {number} durationMs - Animation duration
   */
  flyover(targetZoom = 12, targetPitch = 60, durationMs = 5000) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()
    const startCenter = map.getCenter()
    const startZoom = map.getZoom()
    const startPitch = map.getPitch()
    const startBearing = map.getBearing()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'flyover'

    // Fly to target position
    map.flyTo({
      center: startCenter,
      zoom: targetZoom,
      pitch: targetPitch,
      bearing: startBearing,
      duration: durationMs * 0.6, // 60% of total time for approach
      easing: (t) => t // Linear easing
    })

    // After approach, return to original position
    setTimeout(() => {
      map.flyTo({
        center: startCenter,
        zoom: startZoom,
        pitch: startPitch,
        bearing: startBearing,
        duration: durationMs * 0.4, // 40% of total time for return
        easing: (t) => t // Linear easing
      })

      setTimeout(() => {
        this.animationState.isAnimating = false
        this.animationState.currentAnimation = null
        console.log('✓ Flyover animation complete')
      }, durationMs * 0.4)
    }, durationMs * 0.6)

    console.log('✓ Flyover animation started')
  },

  /**
   * Animate bearing rotation to a target bearing
   * @param {number} targetBearing - Target bearing (0-360)
   * @param {number} durationMs - Animation duration
   */
  rotateTo(targetBearing, durationMs = 3000) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'rotate'

    map.easeTo({
      bearing: targetBearing,
      duration: durationMs,
      easing: (t) => t * (2 - t) // easeOutQuad
    })

    setTimeout(() => {
      this.animationState.isAnimating = false
      this.animationState.currentAnimation = null
      console.log('✓ Rotation animation complete')
    }, durationMs)

    console.log('✓ Rotation animation started')
  },

  /**
   * Animate pitch (3D tilt) to a target angle
   * @param {number} targetPitch - Target pitch (0-85)
   * @param {number} durationMs - Animation duration
   */
  pitchTo(targetPitch, durationMs = 2000) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'pitch'

    map.easeTo({
      pitch: targetPitch,
      duration: durationMs,
      easing: (t) => t * (2 - t) // easeOutQuad
    })

    setTimeout(() => {
      this.animationState.isAnimating = false
      this.animationState.currentAnimation = null
      console.log('✓ Pitch animation complete')
    }, durationMs)

    console.log('✓ Pitch animation started')
  },

  /**
   * Animate camera to a new location
   * @param {object} options - MapLibre FlyToOptions or EaseToOptions
   * @param {boolean} useFlying - Use flyTo (curved path) vs easeTo (direct)
   */
  animateTo(options, useFlying = true) {
    if (this.animationState.isAnimating) {
      console.warn('Animation already in progress')
      return
    }

    const map = mapManager.getMap()

    this.animationState.isAnimating = true
    this.animationState.currentAnimation = 'custom'

    const duration = options.duration || 3000

    if (useFlying) {
      map.flyTo(options)
    } else {
      map.easeTo(options)
    }

    setTimeout(() => {
      this.animationState.isAnimating = false
      this.animationState.currentAnimation = null
      console.log('✓ Animation complete')
    }, duration)

    console.log('✓ Custom animation started')
  },

  /**
   * Stop any running animation
   */
  stop() {
    const map = mapManager.getMap()

    // CRITICAL: Stop MapLibre's camera animation
    map.stop()

    if (this.animationState.animationId) {
      cancelAnimationFrame(this.animationState.animationId)
      this.animationState.animationId = null
    }

    this.animationState.isAnimating = false
    this.animationState.currentAnimation = null

    console.log('✓ Animation stopped')
  },

  /**
   * Check if animation is currently running
   */
  isAnimating() {
    return this.animationState.isAnimating
  },

  /**
   * Get current animation type
   */
  getCurrentAnimation() {
    return this.animationState.currentAnimation
  },

  /**
   * Enable animations (no-op for this plugin, but for interface consistency)
   */
  enable() {
    console.log('✓ Animations enabled')
  },

  /**
   * Disable animations - stops any running animation
   */
  disable() {
    this.stop()
    console.log('✓ Animations disabled')
  },

  /**
   * Update animation configuration at runtime
   * @param {object} config - Configuration object
   */
  update(config) {
    // Config could include default durations, easing functions, etc.
    if (config.defaultDuration) {
      this.defaultDuration = config.defaultDuration
    }
    if (config.defaultBearingIncrement) {
      this.defaultBearingIncrement = config.defaultBearingIncrement
    }
  },

  /**
   * Cleanup - stop all animations
   */
  cleanup() {
    this.stop()
    console.log('✓ Animations plugin cleaned up')
  }
}
