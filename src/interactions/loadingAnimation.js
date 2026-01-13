/**
 * Loading Animation Handler
 * Manages the initial fade-out animation when tiles are loaded
 */

import mapManager from '../core/mapManager.js'
import stateManager from '../core/stateManager.js'

/**
 * Setup loading animation listeners
 */
export function setupLoadingAnimation() {
  mapManager.on('idle', () => {
    if (!stateManager.get('fadeTriggered') && !stateManager.get('tilesLoaded')) {
      stateManager.set('tilesLoaded', true)
      stateManager.set('fadeTriggered', true)

      // Trigger fade-in by adding the class
      const mapFade = document.getElementById('map-fade')
      if (mapFade) {
        mapFade.classList.add('fade-out')
      }

      console.log('✓ Tiles loaded, fading in...')
    }
  })
}
