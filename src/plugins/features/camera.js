/**
 * Camera Feature Module
 * Handles orbit mode, flight mode, and targeting
 */

import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'
import { CAMERA_CONFIG, AUSTRALIA_VIEW } from '../../config/defaults.js'
import { createCrosshairSVG } from '../utils/svg.js'
import maplibregl from 'maplibre-gl'

class CameraFeature {
  constructor() {
    this.listeners = []
  }

  /**
   * Start orbit mode (auto-rotating camera)
   */
  startOrbit() {
    if (stateManager.get('isOrbiting')) return

    stateManager.set('isOrbiting', true)

    let bearing = mapManager.getBearing()
    const intervalId = setInterval(() => {
      bearing = (bearing + CAMERA_CONFIG.orbitBearingIncrement) % 360
      mapManager.setBearing(bearing)
    }, CAMERA_CONFIG.orbitIntervalMs)

    stateManager.set('orbitBearing', bearing)
    stateManager.set('orbitIntervalId', intervalId)

    mapManager.setDragRotate(false)
    console.log('✓ Orbit started')
  }

  /**
   * Stop orbit mode
   */
  stopOrbit() {
    if (!stateManager.get('isOrbiting')) return

    const intervalId = stateManager.get('orbitIntervalId')
    if (intervalId) {
      clearInterval(intervalId)
    }

    stateManager.set('isOrbiting', false)
    stateManager.set('orbitIntervalId', null)
    mapManager.setDragRotate(true)

    console.log('✓ Orbit stopped')
  }

  /**
   * Start random flight
   */
  startFlight() {
    if (stateManager.get('isFlying')) return

    stateManager.set('isFlying', true)
    stateManager.set('flightTransitioning', true)

    // Stop orbit if running
    if (stateManager.get('isOrbiting')) {
      this.stopOrbit()
    }

    const flightBearing = Math.random() * 360
    stateManager.set('flightBearing', flightBearing)

    console.log('START FLIGHT - bearing:', flightBearing)

    // Disable drag rotate
    mapManager.setDragRotate(false)

    // Smooth transition into flight mode
    mapManager.flyTo({
      zoom: CAMERA_CONFIG.flightTargetZoom,
      pitch: CAMERA_CONFIG.flightTargetPitch,
      bearing: flightBearing,
      speed: 1.2,
      curve: 1.42,
      duration: CAMERA_CONFIG.flightTransitionDuration
    })

    // Start forward motion animation
    const animationId = requestAnimationFrame((timestamp) =>
      this._animateFlight(timestamp)
    )
    stateManager.set('flightAnimationId', animationId)

    // Clear transitioning flag after flight starts
    setTimeout(() => {
      stateManager.set('flightTransitioning', false)
    }, 500)
  }

  /**
   * Stop flight mode
   */
  stopFlight() {
    if (!stateManager.get('isFlying') || stateManager.get('flightTransitioning')) {
      return
    }

    const animationId = stateManager.get('flightAnimationId')
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    const currentCenter = mapManager.getCenter()
    const currentBearing = mapManager.getBearing()
    const currentPitch = mapManager.getPitch()

    mapManager.easeTo({
      center: [currentCenter.lng, currentCenter.lat],
      bearing: currentBearing,
      pitch: currentPitch,
      duration: CAMERA_CONFIG.flightDeceleration,
      easing: CAMERA_CONFIG.flightEasing
    })

    stateManager.set('isFlying', false)
    stateManager.set('flightTransitioning', false)
    stateManager.set('flightAnimationId', null)

    mapManager.setDragRotate(true)
    console.log('✓ Flight stopped')
  }

  /**
   * Animate forward flight motion
   */
  _animateFlight(timestamp) {
    if (!stateManager.get('isFlying')) return

    const center = mapManager.getCenter()
    const zoom = mapManager.getZoom()
    const pitch = mapManager.getPitch()
    const flightBearing = stateManager.get('flightBearing')

    // Pan forward based on bearing
    const latChange =
      CAMERA_CONFIG.flightSpeed * Math.cos((flightBearing * Math.PI) / 180)
    const lngChange =
      CAMERA_CONFIG.flightSpeed * Math.sin((flightBearing * Math.PI) / 180)

    const newCenter = [center.lng + lngChange, center.lat + latChange]

    mapManager.jumpTo({
      center: newCenter,
      zoom: zoom,
      pitch: pitch
    })

    const nextAnimationId = requestAnimationFrame((timestamp) =>
      this._animateFlight(timestamp)
    )
    stateManager.set('flightAnimationId', nextAnimationId)
  }

  /**
   * Fly to a target location with crosshair targeting effect
   */
  flyToTarget(lngLat) {
    // Stop orbiting and flying
    if (stateManager.get('isOrbiting')) {
      this.stopOrbit()
    }
    if (stateManager.get('isFlying')) {
      this.stopFlight()
    }

    mapManager.setDragRotate(true)

    // Create crosshair marker
    const svgElement = createCrosshairSVG()
    const marker = new maplibregl.Marker({ element: svgElement })
      .setLngLat(lngLat)
      .addTo(mapManager.getMap())

    // Fly to location
    mapManager.flyTo({
      center: lngLat,
      zoom: CAMERA_CONFIG.targetingZoom,
      pitch: CAMERA_CONFIG.targetingPitch,
      bearing: CAMERA_CONFIG.targetingBearing,
      duration: CAMERA_CONFIG.targetingDuration
    })

    // Fade out crosshair
    setTimeout(() => {
      svgElement.style.opacity = '0'
      setTimeout(() => marker.remove(), CAMERA_CONFIG.targetingFadeDuration)
    }, CAMERA_CONFIG.targetingFadeStart)

    // Auto-start orbit at target
    setTimeout(() => {
      this.startOrbit()
    }, CAMERA_CONFIG.targetingOrbitStart)
  }

  /**
   * Fly to full Australia view
   */
  flyToAustralia(hideMarkers = () => {}) {
    // Stop auto-animations
    if (stateManager.get('isOrbiting')) {
      this.stopOrbit()
    }
    if (stateManager.get('isFlying')) {
      this.stopFlight()
    }

    mapManager.setDragRotate(true)
    hideMarkers()

    // Fly to Australia
    mapManager.flyTo({
      center: AUSTRALIA_VIEW.center,
      zoom: AUSTRALIA_VIEW.zoom,
      pitch: AUSTRALIA_VIEW.pitch,
      bearing: AUSTRALIA_VIEW.bearing,
      duration: AUSTRALIA_VIEW.duration
    })

    // Try to set globe projection if supported
    try {
      mapManager.getMap().setProjection('globe')
    } catch (e) {
      // Globe mode not supported, continue with default projection
    }
  }

  /**
   * Enter 3D mode
   */
  enter3DMode() {
    if (stateManager.get('is3DMode')) return

    stateManager.set('is3DMode', true)
    mapManager.easeTo({
      pitch: 75,
      duration: 1000
    })
  }

  /**
   * Exit 3D mode
   */
  exit3DMode() {
    if (!stateManager.get('is3DMode')) return

    stateManager.set('is3DMode', false)
    mapManager.easeTo({
      pitch: 0,
      duration: 1000
    })
  }

  /**
   * Toggle 3D mode
   */
  toggle3DMode() {
    if (stateManager.get('is3DMode')) {
      this.exit3DMode()
    } else {
      this.enter3DMode()
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopOrbit()
    this.stopFlight()
  }
}

export default new CameraFeature()
