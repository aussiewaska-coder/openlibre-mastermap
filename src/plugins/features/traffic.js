import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'

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
      clusterMaxZoom: 15,
      clusterRadius: 50,
    })

    // Cluster circles layer
    map.addLayer({
      id: TRAFFIC_CLUSTERS_LAYER_ID,
      type: 'circle',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ea580c',
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
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

    // Unclustered points layer
    map.addLayer({
      id: TRAFFIC_UNCLUSTERED_LAYER_ID,
      type: 'symbol',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['coalesce', ['get', 'icon'], '📍'],
        'icon-size': 1.5,
        'icon-allow-overlap': true,
        'text-field': ['get', 'description'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 12,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#000',
        'text-halo-color': '#fff',
        'text-halo-width': 1,
        'text-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.7],
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

    // Click on clustered features - zoom to cluster
    map.on('click', TRAFFIC_CLUSTERS_LAYER_ID, (e) => {
      const features = map.querySourceFeatures(TRAFFIC_CLUSTER_SOURCE_ID, {
        sourceLayer: '',
        filter: ['has', 'point_count'],
      })

      const feature = features.find((f) => f.properties.cluster_id === e.features[0].properties.cluster_id)

      if (feature && feature.properties.cluster_id != null) {
        const clusterId = feature.properties.cluster_id
        map.getSource(TRAFFIC_CLUSTER_SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return
          map.easeTo({
            center: feature.geometry.coordinates,
            zoom: zoom,
            duration: 500,
          })
        })
      }
    })

    // Click on unclustered points - select and animate
    map.on('click', TRAFFIC_UNCLUSTERED_LAYER_ID, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0]
        this.selectTrafficItem(feature)
      }
    })

    // Change cursor on hover
    map.on('mouseenter', TRAFFIC_UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', TRAFFIC_UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('mouseenter', TRAFFIC_CLUSTERS_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer'
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

    // Get animations plugin if available
    const animationsPlugin = window.animationsPlugin
    if (!animationsPlugin) return

    // Cancel any running animations
    if (animationsPlugin.isAnimating && animationsPlugin.isAnimating()) {
      animationsPlugin.stop && animationsPlugin.stop()
    }

    // Calculate flight duration based on distance
    const currentCenter = map.getCenter()
    const dx = coords[0] - currentCenter.lng
    const dy = coords[1] - currentCenter.lat
    const distance = Math.sqrt(dx * dx + dy * dy)
    const durationMs = Math.max(800, Math.min(1600, distance * 100))

    // Approach pitch and bearing
    const approachPitch = 55
    const currentBearing = map.getBearing()
    const targetBearing = props.bearing ?? currentBearing

    // Fly to the target
    map.flyTo({
      center: coords,
      zoom: Math.max(15, map.getZoom()),
      pitch: approachPitch,
      bearing: targetBearing,
      duration: durationMs,
    })

    // Start orbit after approach completes
    setTimeout(() => {
      if (animationsPlugin && animationsPlugin.startOrbit) {
        const zoomLevel = map.getZoom()
        const radiusMeters = animationsPlugin.radiusFromZoom ? animationsPlugin.radiusFromZoom(zoomLevel) : 200

        animationsPlugin.startOrbit({
          target: { lng: coords[0], lat: coords[1] },
          radiusMeters,
          speed: 1.0,
        })
      }
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

    stateManager.set('trafficSelectedId', null)
  },

  cleanup() {
    const map = mapManager.getMap()

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
