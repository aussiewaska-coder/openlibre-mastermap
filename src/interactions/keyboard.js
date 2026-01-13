/**
 * Keyboard Interaction Handler
 * Manages keyboard event listeners
 */

import stateManager from '../core/stateManager.js'
import cameraFeature from '../features/camera.js'

/**
 * Setup keyboard event listeners
 */
export function setupKeyboardListeners() {
  document.addEventListener('keydown', (e) => {
    // Spacebar to stop flight
    if (e.code === 'Space' && stateManager.get('isFlying')) {
      e.preventDefault()
      cameraFeature.stopFlight()
    }

    // Add other keyboard shortcuts here as needed
  })
}

/**
 * Remove keyboard event listeners
 */
export function removeKeyboardListeners() {
  // Note: If we want to remove specific listeners, we'd need to
  // store the callback function as a reference
}
