/**
 * Landmark Markers UI Module
 * Creates and manages landmark label markers on the map
 */

import maplibregl from 'maplibre-gl'
import stateManager from '../core/stateManager.js'

/**
 * Create landmark label markers
 */
export function createLandmarkMarkers(landmarks, map) {
  const markers = []

  for (const landmark of landmarks) {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.color = '#ffffff'
    el.style.fontWeight = 'bold'
    el.style.fontSize = '12px'
    el.style.textShadow = '2px 2px 4px #000000'
    el.style.pointerEvents = 'none'
    el.style.whiteSpace = 'nowrap'
    el.textContent = landmark.name

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([landmark.lng, landmark.lat])
      .addTo(map)

    markers.push(marker)
  }

  // Store markers in state for later access
  stateManager.set('landmarkMarkers', markers)

  return markers
}

/**
 * Remove all landmark markers
 */
export function removeLandmarkMarkers() {
  const markers = stateManager.get('landmarkMarkers')
  for (const marker of markers) {
    marker.remove()
  }
  stateManager.set('landmarkMarkers', [])
}
