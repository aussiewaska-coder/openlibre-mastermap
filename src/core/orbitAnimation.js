/**
 * Reusable Orbit Animation Module
 * Standalone orbit camera movement for any feature/plugin
 * Can be used by: traffic alerts, police reports, custom markers, box zoom, etc.
 * 
 * Single source of truth for orbit behavior - change once, applies everywhere
 */

import mapManager from './mapManager.js'

/**
 * Start orbital camera animation around a fixed center point
 * @param {object} options - Configuration object
 * @param {object} options.center - {lng, lat} center point (LngLat)
 * @param {number} options.duration - Total animation duration in milliseconds (default: 60000)
 * @param {number} options.degreesPerSecond - Rotation speed (default: 6)
 * @param {number} options.pitch - Camera pitch angle 0-85 (default: 60)
 * @param {function} options.onComplete - Callback when animation finishes
 * @param {function} options.onStop - Callback when animation is stopped
 * @returns {object} - Control object with stop() and isRunning() methods
 */
export function orbitAroundPoint(options) {
  const {
    center,
    duration = 60000,
    degreesPerSecond = 6,
    pitch = 60,
    onComplete,
    onStop,
  } = options

  const map = mapManager.getMap()
  const startTime = Date.now()
  const startBearing = map.getBearing()
  let animationId = null
  let isRunning = true

  const animate = () => {
    if (!isRunning) return

    const elapsed = Date.now() - startTime

    if (elapsed >= duration) {
      // Animation complete
      isRunning = false
      animationId = null
      if (onComplete) onComplete()
      return
    }

    // Calculate new bearing around fixed center
    const secondsElapsed = elapsed / 1000
    const currentBearing = (startBearing + secondsElapsed * degreesPerSecond) % 360

    // Rotate only - center and zoom stay fixed
    map.rotateTo(currentBearing, { duration: 0 })

    // Continue animation
    animationId = requestAnimationFrame(animate)
  }

  // Start animation loop
  animationId = requestAnimationFrame(animate)

  console.log(
    `✓ Orbit started: ${degreesPerSecond}°/sec around [${center.lng.toFixed(2)}, ${center.lat.toFixed(2)}]`
  )

  // Return control object
  return {
    stop() {
      if (!isRunning) return

      isRunning = false
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }

      // Return to start bearing
      map.rotateTo(startBearing, { duration: 0 })

      if (onStop) onStop()
      console.log('✓ Orbit stopped')
    },

    isRunning() {
      return isRunning
    },

    getState() {
      return {
        isRunning,
        center,
        degreesPerSecond,
        pitch,
      }
    },
  }
}

/**
 * Helper: Create standard interrupt listeners for orbit
 * Stops orbit on any user interaction
 * @param {object} orbitControl - Control object returned from orbitAroundPoint()
 * @returns {function} - Cleanup function to remove listeners
 */
export function addInterruptListeners(orbitControl) {
  const stopOnInteraction = () => {
    if (orbitControl.isRunning()) {
      orbitControl.stop()
      console.log('✓ Orbit stopped by user interaction')
      cleanup()
    }
  }

  const cleanup = () => {
    document.removeEventListener('mousedown', stopOnInteraction)
    document.removeEventListener('touchstart', stopOnInteraction)
    document.removeEventListener('wheel', stopOnInteraction)
    document.removeEventListener('keydown', stopOnInteraction)
  }

  // Add listeners
  document.addEventListener('mousedown', stopOnInteraction)
  document.addEventListener('touchstart', stopOnInteraction)
  document.addEventListener('wheel', stopOnInteraction)
  document.addEventListener('keydown', stopOnInteraction)

  return cleanup
}

export default {
  orbitAroundPoint,
  addInterruptListeners,
}
