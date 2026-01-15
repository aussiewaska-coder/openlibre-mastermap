import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'
import { orbitAroundPoint, addInterruptListeners } from '../../core/orbitAnimation.js'

/**
 * Traffic Intel Plugin
 * Manages Waze traffic data layer with clustering, filtering, and cinematic selection
 */

const TRAFFIC_SOURCE_ID = 'traffic-data'
const TRAFFIC_CLUSTER_SOURCE_ID = 'traffic-cluster'
const TRAFFIC_CLUSTERS_LAYER_ID = 'traffic-clusters'
const TRAFFIC_COUNT_LAYER_ID = 'traffic-cluster-count'
const TRAFFIC_UNCLUSTERED_LAYER_ID = 'traffic-unclustered-points'

// Icon configurations by event type
const TRAFFIC_ICONS = {
  ACCIDENT: { icon: '🚗', color: '#dc2626', label: 'Accident' },
  HAZARD: { icon: '⚠️', color: '#f59e0b', label: 'Hazard' },
  POLICE: { icon: '🚔', color: '#0066cc', label: 'Police' },
  CLOSURE: { icon: '🚫', color: '#6b21a8', label: 'Closure' },
  JAM: { icon: '🚦', color: '#ea580c', label: 'Traffic Jam' },
  ALERT: { icon: '⚡', color: '#ea580c', label: 'Alert' },
}

export default {
  currentOrbit: null,
  cleanupInterrupts: null,

  initialize() {
    const map = mapManager.getMap()

    // Add GeoJSON source for traffic data (not clustered initially)
    map.addSource(TRAFFIC_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    // Add clustered source
    map.addSource(TRAFFIC_CLUSTER_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 13,
      clusterRadius: 40,
    })

    // Cluster circles layer
    map.addLayer({
      id: TRAFFIC_CLUSTERS_LAYER_ID,
      type: 'circle',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ea580c',
        'circle-radius': ['step', ['get', 'point_count'], 25, 100, 35, 750, 45],
        'circle-opacity': 0.85,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#fff',
      },
    })

    // Cluster count text layer
    map.addLayer({
      id: TRAFFIC_COUNT_LAYER_ID,
      type: 'symbol',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#fff',
      },
    })

    // Unclustered points layer - emoji rendered as text symbols
    map.addLayer({
      id: TRAFFIC_UNCLUSTERED_LAYER_ID,
      type: 'symbol',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'icon'],
        'text-font': ['Arial Unicode MS Regular'],
        'text-size': 24,
        'text-allow-overlap': true,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color': '#1f2937',
        'text-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.9],
        'text-halo-color': '#fff',
        'text-halo-width': 2,
      },
    })

    // Initialize state
    stateManager.set('trafficEnabled', true)
    stateManager.set('trafficSelectedId', null)
    stateManager.set('trafficFilters', {
      types: [],
      maxAgeMinutes: null,
      minConfidence: 0,
    })

    // Map interaction handlers
    this.setupInteractions()

    console.log('✓ Traffic Intel plugin initialized')
  },

  setupInteractions() {
    const map = mapManager.getMap()

    // Click on clustered features - zoom to show individual markers
    map.on('click', TRAFFIC_CLUSTERS_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return

      const clickedFeature = e.features[0]
      const clusterId = clickedFeature.properties.cluster_id

      if (clusterId != null) {
        console.log('✓ Cluster clicked:', clusterId)
        
        const source = map.getSource(TRAFFIC_CLUSTER_SOURCE_ID)
        if (!source) {
          console.error('Cluster source not found')
          return
        }

        console.log('DEBUG: Source found, type:', source.type)
        console.log('DEBUG: Has getClusterLeaves?', typeof source.getClusterLeaves)
        
        // Get all individual points in this cluster
        source.getClusterLeaves(clusterId, 100, 0, (err, features) => {
          if (err) {
            console.error('Failed to get cluster leaves:', err)
            return
          }

          if (!features || features.length === 0) {
            console.warn('No features found in cluster')
            return
          }

          console.log(`✓ Cluster contains ${features.length} points, calculating bounds...`)

          // Calculate bounding box from all point coordinates
          let minLng = Infinity
          let maxLng = -Infinity
          let minLat = Infinity
          let maxLat = -Infinity

          features.forEach((feature) => {
            const [lng, lat] = feature.geometry.coordinates
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
          })

          // Frame all constituent markers with padding
          const bounds = [
            [minLng, minLat], // southwest
            [maxLng, maxLat], // northeast
          ]

          map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            duration: 800,
            pitch: 0,
            maxZoom: 18, // Don't zoom in too far even for small clusters
          })

          console.log('✓ Fitted bounds to show all cluster constituents')
        })
      }
    })

    // Click on unclustered points - select and show detail
    map.on('click', TRAFFIC_UNCLUSTERED_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return
      
      const feature = e.features[0]
      console.log('✓ Individual marker clicked:', feature.properties.id)
      this.selectTrafficItem(feature)
    })

    // Change cursor on hover
    map.on('mouseenter', TRAFFIC_UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', TRAFFIC_UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('mouseenter', TRAFFIC_CLUSTERS_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'zoom-in'
    })
    map.on('mouseleave', TRAFFIC_CLUSTERS_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })
  },

  selectTrafficItem(feature) {
    const map = mapManager.getMap()
    const coords = feature.geometry.coordinates
    const props = feature.properties

    // Update selected state
    stateManager.set('trafficSelectedId', props.id)

    // Highlight the marker
    map.setFeatureState({ source: TRAFFIC_CLUSTER_SOURCE_ID, id: props.id }, { selected: true })

    // Dispatch custom event for UI panel to listen
    const event = new CustomEvent('trafficItemSelected', {
      detail: { feature, coordinates: coords, properties: props },
    })
    document.dispatchEvent(event)

    // Trigger cinematic animation if available
    this.animateToTrafficItem(coords, props)
  },

  animateToTrafficItem(coords, props) {
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

    // Approach pitch and bearing
    const approachPitch = 55

    // Fly to the target
    map.flyTo({
      center: coords,
      zoom: Math.max(15, map.getZoom()),
      pitch: approachPitch,
      duration: durationMs,
    })

    // Start orbit after approach completes using reusable orbit module
    setTimeout(() => {
      this.currentOrbit = orbitAroundPoint({
        center: { lng: coords[0], lat: coords[1] },
        duration: 60000,
        degreesPerSecond: 6,
        pitch: approachPitch,
        onStop: () => {
          console.log('✓ Traffic alert orbit completed')
        },
      })

      // Add interrupt listeners - stops orbit on user interaction
      this.cleanupInterrupts = addInterruptListeners(this.currentOrbit)
    }, durationMs + 100)
  },

  async updateTrafficData(geoJSON) {
    const map = mapManager.getMap()

    if (!geoJSON || !geoJSON.features) return

    // Update both sources with the same data
    const source = map.getSource(TRAFFIC_SOURCE_ID)
    if (source) {
      source.setData(geoJSON)
    }

    const clusterSource = map.getSource(TRAFFIC_CLUSTER_SOURCE_ID)
    if (clusterSource) {
      clusterSource.setData(geoJSON)
    }

    // Update state
    stateManager.set('trafficDataCount', geoJSON.features.length)

    console.log(`✓ Traffic data updated: ${geoJSON.features.length} items`)
  },

  enable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(TRAFFIC_CLUSTERS_LAYER_ID, 'visibility', 'visible')
    map.setLayoutProperty(TRAFFIC_COUNT_LAYER_ID, 'visibility', 'visible')
    map.setLayoutProperty(TRAFFIC_UNCLUSTERED_LAYER_ID, 'visibility', 'visible')
    stateManager.set('trafficEnabled', true)
  },

  disable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(TRAFFIC_CLUSTERS_LAYER_ID, 'visibility', 'none')
    map.setLayoutProperty(TRAFFIC_COUNT_LAYER_ID, 'visibility', 'none')
    map.setLayoutProperty(TRAFFIC_UNCLUSTERED_LAYER_ID, 'visibility', 'none')
    stateManager.set('trafficEnabled', false)
  },

  update(config) {
    const map = mapManager.getMap()

    if (config.filters) {
      stateManager.set('trafficFilters', config.filters)
      this.applyFilters(config.filters)
    }

    if (config.opacity !== undefined) {
      map.setPaintProperty(TRAFFIC_CLUSTERS_LAYER_ID, 'circle-opacity', config.opacity)
    }
  },

  applyFilters(filters) {
    const map = mapManager.getMap()

    // Build filter expression
    let filterExpr = ['all']

    if (filters.types && filters.types.length > 0) {
      filterExpr.push(['in', ['get', 'type'], ['literal', filters.types]])
    }

    if (filters.maxAgeMinutes !== undefined && filters.maxAgeMinutes !== null) {
      // Filter based on publishedAt timestamp
      const cutoff = new Date(Date.now() - filters.maxAgeMinutes * 60 * 1000).toISOString()
      filterExpr.push(['>=', ['get', 'publishedAt'], cutoff])
    }

    if (filters.minConfidence !== undefined && filters.minConfidence > 0) {
      filterExpr.push(['>=', ['get', 'confidence'], filters.minConfidence])
    }

    // Apply filter to unclustered layer
    map.setFilter(TRAFFIC_UNCLUSTERED_LAYER_ID, filterExpr)
  },

  clearSelection() {
    const map = mapManager.getMap()
    const selectedId = stateManager.get('trafficSelectedId')

    if (selectedId) {
      map.setFeatureState({ source: TRAFFIC_CLUSTER_SOURCE_ID, id: selectedId }, { selected: false })
    }

    // Stop any running orbit
    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.cleanupInterrupts) {
      this.cleanupInterrupts()
    }

    stateManager.set('trafficSelectedId', null)
  },

  cleanup() {
    const map = mapManager.getMap()

    // Stop any running orbit
    if (this.currentOrbit && this.currentOrbit.isRunning()) {
      this.currentOrbit.stop()
    }
    if (this.cleanupInterrupts) {
      this.cleanupInterrupts()
    }

    // Remove layers
    try {
      map.removeLayer(TRAFFIC_UNCLUSTERED_LAYER_ID)
      map.removeLayer(TRAFFIC_COUNT_LAYER_ID)
      map.removeLayer(TRAFFIC_CLUSTERS_LAYER_ID)
    } catch (e) {
      // Layer may not exist
    }

    // Remove sources
    try {
      map.removeSource(TRAFFIC_CLUSTER_SOURCE_ID)
      map.removeSource(TRAFFIC_SOURCE_ID)
    } catch (e) {
      // Source may not exist
    }

    // Clear state
    stateManager.set('trafficEnabled', false)
    stateManager.set('trafficSelectedId', null)
  },
}
