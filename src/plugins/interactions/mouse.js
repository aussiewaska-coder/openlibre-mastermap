/**
 * Mouse Interaction Handler
 * Manages mouse/click event listeners (Cmd+Click targeting)
 */

import mapManager from '../../core/mapManager.js'
import cameraFeature from '../../features/camera.js'

/**
 * Setup mouse event listeners
 */
export function setupMouseListeners() {
  mapManager.on('click', (e) => {
    // Cmd/Ctrl+Click to target and orbit
    if (e.originalEvent.metaKey || e.originalEvent.ctrlKey) {
      cameraFeature.flyToTarget(e.lngLat)
    }
  })
}

/**
 * Remove mouse event listeners
 */
export function removeMouseListeners() {
  // Mouse listeners attached via mapManager.on() are cleaned up
  // when the map is destroyed
}
