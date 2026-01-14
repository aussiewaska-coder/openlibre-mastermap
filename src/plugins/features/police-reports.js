/**
 * Police Reports Plugin
 * Manages police report data layer with subtype-based clustering
 * Click to fly + orbit animation using reusable orbit module
 */

import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'
import { orbitAroundPoint, addInterruptListeners } from '../../core/orbitAnimation.js'

const POLICE_SOURCE_ID = 'police-data'
const POLICE_LAYER_ID = 'police-points'

// Icon and color config by subtype (or type if subtype is null)
const POLICE_ICONS = {
  // POLICE subtypes
  POLICE_WITH_MOBILE_CAMERA: { icon: '📷', color: '#0066cc', label: 'Police Camera' },
  POLICE_HIDING: { icon: '🕵️', color: '#003d99', label: 'Police Hiding' },
  POLICE_VISIBLE: { icon: '🚔', color: '#0066cc', label: 'Police Visible' },
  POLICE_ROADBLOCK: { icon: '🚧', color: '#003d99', label: 'Police Roadblock' },
  POLICE: { icon: '🚔', color: '#0066cc', label: 'Police' },

  // ACCIDENT subtypes
  ACCIDENT_MAJOR: { icon: '💥', color: '#dc2626', label: 'Major Accident' },
  ACCIDENT_MINOR: { icon: '🚗', color: '#f87171', label: 'Minor Accident' },
  ACCIDENT: { icon: '🚗', color: '#dc2626', label: 'Accident' },

  // HAZARD subtypes
  HAZARD_ON_ROAD_POT_HOLE: { icon: '🕳️', color: '#f59e0b', label: 'Pot Hole' },
  HAZARD_ON_ROAD_CONSTRUCTION: { icon: '🏗️', color: '#f59e0b', label: 'Construction' },
  HAZARD_ON_ROAD_OBJECT: { icon: '⚠️', color: '#f59e0b', label: 'Road Hazard' },
  HAZARD_ON_ROAD_LANE_CLOSED: { icon: '🚫', color: '#ea580c', label: 'Lane Closed' },
  HAZARD_ON_ROAD_CAR_STOPPED: { icon: '🚗', color: '#f59e0b', label: 'Stopped Vehicle' },
  HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT: { icon: '🚦', color: '#f59e0b', label: 'Traffic Light' },
  HAZARD_ON_SHOULDER_CAR_STOPPED: { icon: '🚗', color: '#fbbf24', label: 'Car on Shoulder' },
  HAZARD_WEATHER_FLOOD: { icon: '🌊', color: '#06b6d4', label: 'Flood' },
  HAZARD_WEATHER_FOG: { icon: '🌫️', color: '#6b7280', label: 'Fog' },
  HAZARD_WEATHER: { icon: '⛈️', color: '#60a5fa', label: 'Weather' },
  HAZARD_ON_ROAD: { icon: '⚠️', color: '#f59e0b', label: 'Road Hazard' },
  HAZARD_ON_SHOULDER: { icon: '⚠️', color: '#fbbf24', label: 'Shoulder Hazard' },
  HAZARD: { icon: '⚠️', color: '#f59e0b', label: 'Hazard' },

  // ROAD_CLOSED subtypes
  ROAD_CLOSED_EVENT: { icon: '🚫', color: '#6b21a8', label: 'Road Closed' },
  ROAD_CLOSED: { icon: '🚫', color: '#6b21a8', label: 'Road Closed' },

  // JAM subtypes
  JAM_STAND_STILL_TRAFFIC: { icon: '🚦', color: '#ea580c', label: 'Stand Still Traffic' },
  JAM_HEAVY_TRAFFIC: { icon: '🚦', color: '#dc2626', label: 'Heavy Traffic' },
  JAM: { icon: '🚦', color: '#ea580c', label: 'Traffic Jam' },

  // CAMERA subtypes
  CAMERA_SPEED: { icon: '📸', color: '#7c3aed', label: 'Speed Camera' },
  CAMERA: { icon: '📸', color: '#7c3aed', label: 'Camera' },
}

export default {
  isInitialized: false,
  currentData: null,
  selectedReport: null,
  currentOrbit: null,
  cleanupInterrupts: null,

  initialize() {
    const map = mapManager.getMap()

    // Add GeoJSON source for police data
    map.addSource(POLICE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    // Add symbol layer for police reports (emoji rendered as text, not icons)
    map.addLayer({
      id: POLICE_LAYER_ID,
      type: 'symbol',
      source: POLICE_SOURCE_ID,
      layout: {
        // Emoji rendered as large text symbols (MapLibre renders emoji text natively)
        'text-field': ['get', 'icon'],
        'text-font': ['Arial Unicode MS Regular'],
        'text-size': 24,
        'text-allow-overlap': true,
        'text-ignore-placement': false,
      },
      paint: {
        'text-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.7],
        'text-halo-color': '#fff',
        'text-halo-width': 1,
      },
    })

    // Click handler for map selection
    map.on('click', POLICE_LAYER_ID, (e) => {
      if (e.features.length > 0) {
        this.selectReport(e.features[0])
      }
    })

    // Hover cursor
    map.on('mouseenter', POLICE_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', POLICE_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })

    // Initialize state
    stateManager.set('policeEnabled', true)
    stateManager.set('policeSelectedId', null)

    console.log('✓ Police Reports plugin initialized')
  },

  async loadReports(bbox = null) {
    try {
      const endpoint = '/api/police-reports'
      const body = bbox
        ? {
            bbox: {
              w: bbox.getWest(),
              s: bbox.getSouth(),
              e: bbox.getEast(),
              n: bbox.getNorth(),
            },
          }
        : {}

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      this.updateReportData(data.geojson)
      stateManager.set('policeDataCount', data.geojson.features.length)

      console.log(`✓ Police reports loaded: ${data.geojson.features.length} items`)
      return data.geojson.features
    } catch (error) {
      console.error('Failed to load police reports:', error)
      return []
    }
  },

  updateReportData(geoJSON) {
    const map = mapManager.getMap()

    if (!geoJSON || !geoJSON.features) return

    // Enrich each feature with icon based on subtype or type
    const enrichedFeatures = geoJSON.features.map((feature) => {
      const subtype = feature.properties.subtype || feature.properties.type
      const iconConfig = POLICE_ICONS[subtype] || POLICE_ICONS[feature.properties.type] || {
        icon: '📍',
        color: '#6b7280',
        label: 'Alert',
      }

      return {
        ...feature,
        properties: {
          ...feature.properties,
          icon: iconConfig.icon,
          iconColor: iconConfig.color,
          label: iconConfig.label,
        },
      }
    })

    const enrichedGeoJSON = {
      type: 'FeatureCollection',
      features: enrichedFeatures,
    }

    // Update source
    const source = map.getSource(POLICE_SOURCE_ID)
    if (source) {
      source.setData(enrichedGeoJSON)
    }

    this.currentData = enrichedGeoJSON
  },

  selectReport(feature) {
    const map = mapManager.getMap()
    const coords = feature.geometry.coordinates
    const props = feature.properties

    // Clear previous selection
    if (this.selectedReport) {
      map.setFeatureState(
        { source: POLICE_SOURCE_ID, id: this.selectedReport.properties.alert_id },
        { selected: false }
      )
    }

    // Set new selection
    this.selectedReport = feature
    stateManager.set('policeSelectedId', props.alert_id)
    map.setFeatureState({ source: POLICE_SOURCE_ID, id: props.alert_id }, { selected: true })

    // Dispatch event for UI panel to listen
    const event = new CustomEvent('policeReportSelected', {
      detail: { feature, coordinates: coords, properties: props },
    })
    document.dispatchEvent(event)

    // Animate to location
    this.animateToReport(coords, props)
  },

  animateToReport(coords, props) {
    const map = mapManager.getMap()

    // Stop any existing orbit
    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.cleanupInterrupts) {
      this.cleanupInterrupts()
    }

    // Calculate flight duration based on distance
    const currentCenter = map.getCenter()
    const dx = coords[0] - currentCenter.lng
    const dy = coords[1] - currentCenter.lat
    const distance = Math.sqrt(dx * dx + dy * dy)
    const durationMs = Math.max(800, Math.min(1600, distance * 100))

    // Fly to location with 3D pitch
    map.flyTo({
      center: coords,
      zoom: Math.max(15, map.getZoom()),
      pitch: 55,
      duration: durationMs,
    })

    // Start orbit after flight completes
    setTimeout(() => {
      this.currentOrbit = orbitAroundPoint({
        center: { lng: coords[0], lat: coords[1] },
        duration: 60000,
        degreesPerSecond: 6,
        pitch: 55,
        onStop: () => {
          console.log('✓ Orbit completed')
        },
      })

      // Add interrupt listeners (stops orbit on user interaction)
      this.cleanupInterrupts = addInterruptListeners(this.currentOrbit)
    }, durationMs + 100)
  },

  enable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(POLICE_LAYER_ID, 'visibility', 'visible')
    stateManager.set('policeEnabled', true)
  },

  disable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(POLICE_LAYER_ID, 'visibility', 'none')
    stateManager.set('policeEnabled', false)
  },

  clearSelection() {
    const map = mapManager.getMap()

    if (this.selectedReport) {
      map.setFeatureState(
        { source: POLICE_SOURCE_ID, id: this.selectedReport.properties.alert_id },
        { selected: false }
      )
    }

    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.cleanupInterrupts) {
      this.cleanupInterrupts()
    }

    this.selectedReport = null
    stateManager.set('policeSelectedId', null)
  },

  cleanup() {
    const map = mapManager.getMap()

    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.cleanupInterrupts) {
      this.cleanupInterrupts()
    }

    try {
      map.removeLayer(POLICE_LAYER_ID)
      map.removeSource(POLICE_SOURCE_ID)
    } catch (e) {
      // Layer/source may not exist
    }

    stateManager.set('policeEnabled', false)
    stateManager.set('policeSelectedId', null)
  },
}
