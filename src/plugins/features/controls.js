/**
 * Controls Plugin - Instantiates all MapLibre official UI controls
 * Uses the standard MapLibre API for navigation, location, scale, and projection
 */

import mapManager from '../../core/mapManager.js'
import { AUSTRALIA_VIEW } from '../../config/defaults.js'
import {
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
  GlobeControl,
  LogoControl,
  AttributionControl
} from 'maplibre-gl'

/**
 * Custom Australia Home Control
 * Returns map to overhead view of Australia
 */
class AustraliaControl {
  onAdd(map) {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'maplibre-ctrl maplibre-ctrl-group'

    this.button = document.createElement('button')
    this.button.className = 'maplibre-ctrl-icon'
    this.button.setAttribute('aria-label', 'Return to Australia view')
    this.button.type = 'button'
    this.button.title = 'Return to Australia view'
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        <path d="M15 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/>
      </svg>
    `

    this.button.addEventListener('click', () => this.returnToAustralia())
    this.container.appendChild(this.button)

    return this.container
  }

  onRemove() {
    this.button.removeEventListener('click', () => this.returnToAustralia())
    this.container.remove()
  }

  returnToAustralia() {
    this.map.flyTo({
      center: AUSTRALIA_VIEW.center,
      zoom: AUSTRALIA_VIEW.zoom,
      pitch: AUSTRALIA_VIEW.pitch,
      bearing: AUSTRALIA_VIEW.bearing,
      duration: AUSTRALIA_VIEW.duration,
      easing: (t) => t * (2 - t) // easeOutQuad
    })
  }
}

export default {
  initialize() {
    const map = mapManager.getMap()

    // NavigationControl - zoom buttons + compass
    // Positioned top-left
    map.addControl(new NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true
    }), 'top-left')

    // AustraliaControl - return to overhead view of Australia
    // Positioned top-left below NavigationControl
    map.addControl(new AustraliaControl(), 'top-left')

    // GlobeControl - toggle between globe and mercator projections
    // Positioned top-right
    map.addControl(new GlobeControl(), 'top-right')

    // GeolocateControl - user geolocation button
    // Shows user's location on map
    map.addControl(new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false
      },
      trackUserLocation: true,
      showUserLocation: true
    }), 'top-right')

    // FullscreenControl - enter/exit fullscreen
    map.addControl(new FullscreenControl(), 'top-right')

    // ScaleControl - displays map scale bar
    // Shows distance reference (km/mi)
    map.addControl(new ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-right')

    // AttributionControl - already added by default
    // Shows map attribution and copyright info
    // (initialized with attributionControl: true in mapManager)

    // LogoControl - MapLibre logo
    // Enabled by default, shows in bottom-left

    console.log('✓ MapLibre official controls initialized')
    console.log('  • NavigationControl (zoom + compass) - top-left')
    console.log('  • AustraliaControl (return to home view) - top-left')
    console.log('  • GlobeControl (projection toggle) - top-right')
    console.log('  • GeolocateControl (user location) - top-right')
    console.log('  • FullscreenControl - top-right')
    console.log('  • ScaleControl (distance scale) - bottom-right')
  },

  enable() {
    const map = mapManager.getMap()
    // Controls are always visible, this is a no-op
    // Kept for plugin interface consistency
  },

  disable() {
    const map = mapManager.getMap()
    // Would need to remove and re-add controls to truly disable
    // Kept for plugin interface consistency
  },

  update(config) {
    // Controls are static UI, no runtime config needed
    // Kept for plugin interface consistency
  },

  cleanup() {
    const map = mapManager.getMap()
    // MapLibre automatically removes controls when map is destroyed
    // No manual cleanup needed
  }
}
