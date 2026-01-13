/**
 * Info Panel UI Module
 * Handles info panel display and updates
 */

/**
 * Update the info panel with current map state
 */
export function updateInfoPanel(zoom, center) {
  const zoomInfo = document.getElementById('zoom-info')
  const centerInfo = document.getElementById('center-info')

  if (zoomInfo) {
    zoomInfo.textContent = `Zoom: ${zoom.toFixed(2)}`
  }

  if (centerInfo) {
    centerInfo.textContent = `Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
  }
}
