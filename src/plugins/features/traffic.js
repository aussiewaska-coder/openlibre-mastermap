import mapManager from '../../core/mapManager.js'
import stateManager from '../../core/stateManager.js'

/**
 * Traffic Intel Plugin
 * Manages Waze traffic data layer with MapLibre native clustering
 */

const TRAFFIC_SOURCE_ID = 'traffic-data'
const TRAFFIC_CLUSTER_SOURCE_ID = 'traffic-cluster'
const TRAFFIC_CLUSTERS_LAYER_ID = 'traffic-clusters'
const TRAFFIC_COUNT_LAYER_ID = 'traffic-cluster-count'
const TRAFFIC_UNCLUSTERED_LAYER_ID = 'traffic-unclustered-points'

export default {

  initialize() {
    const map = mapManager.getMap()

    // Single clustered GeoJSON source
    map.addSource(TRAFFIC_CLUSTER_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    // Cluster circles
    map.addLayer({
      id: TRAFFIC_CLUSTERS_LAYER_ID,
      type: 'circle',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ea580c',
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 100, 40],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // Cluster count labels
    map.addLayer({
      id: TRAFFIC_COUNT_LAYER_ID,
      type: 'symbol',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#fff'
      }
    })

    // Individual unclustered points
    map.addLayer({
      id: TRAFFIC_UNCLUSTERED_LAYER_ID,
      type: 'circle',
      source: TRAFFIC_CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#dc2626',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    this.setupClusterClick()
    this.setupDebugClickLog()
    console.log('✓ Traffic plugin initialized')
  },

  setupClusterClick() {
    const map = mapManager.getMap()

    const handleClusterClick = (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
      if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
        e.originalEvent.stopPropagation()
      }

      const feature = e.features && e.features[0]
      if (!feature) return

      const clusterId = feature.properties.cluster_id
      const coords = feature.geometry.coordinates
      const source = map.getSource(TRAFFIC_CLUSTER_SOURCE_ID)

      if (!source || typeof source.getClusterExpansionZoom !== 'function') {
        map.easeTo({ center: coords, zoom: map.getZoom() + 1.5 })
        return
      }

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || typeof zoom !== 'number') {
          console.warn('Cluster expansion failed; applying fallback zoom', err)
          map.easeTo({ center: coords, zoom: map.getZoom() + 1.5 })
          return
        }

        map.easeTo({
          center: coords,
          zoom
        })
      })
    }

    // Click handlers for both cluster bubble and count label layers
    map.on('click', TRAFFIC_CLUSTERS_LAYER_ID, handleClusterClick)
    map.on('click', TRAFFIC_COUNT_LAYER_ID, handleClusterClick)
    // Double-click: prevent default zoom so the cluster expansion wins
    map.on('dblclick', TRAFFIC_CLUSTERS_LAYER_ID, handleClusterClick)
    map.on('dblclick', TRAFFIC_COUNT_LAYER_ID, handleClusterClick)

    // Click unclustered points: zoom in slightly to show movement
    map.on('click', TRAFFIC_UNCLUSTERED_LAYER_ID, (e) => {
      const feature = e.features && e.features[0]
      if (!feature) return
      if (e && typeof e.preventDefault === 'function') e.preventDefault()
      if (e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
        e.originalEvent.stopPropagation()
      }
      map.easeTo({ center: feature.geometry.coordinates, zoom: Math.max(map.getZoom() + 1.5, 10) })
    })

    // Global fallback: any map click will try to hit traffic layers and expand clusters or zoom to point
    map.on('click', (e) => {
      const hits = map.queryRenderedFeatures(e.point, {
        layers: [TRAFFIC_CLUSTERS_LAYER_ID, TRAFFIC_COUNT_LAYER_ID, TRAFFIC_UNCLUSTERED_LAYER_ID]
      })
      if (!hits.length) return

      const clusterFeature = hits.find((f) => !!f.properties?.cluster_id)
      if (clusterFeature) {
        handleClusterClick({ ...e, features: [clusterFeature] })
        return
      }

      const pointFeature = hits.find((f) => !f.properties?.cluster_id)
      if (pointFeature) {
        map.easeTo({
          center: pointFeature.geometry.coordinates,
          zoom: Math.max(map.getZoom() + 1.5, 10)
        })
      }
    })

    // Pointer cursor on both layers
    const pointerLayers = [TRAFFIC_CLUSTERS_LAYER_ID, TRAFFIC_COUNT_LAYER_ID]
    pointerLayers.forEach((layerId) => {
      map.on('mouseenter', layerId, function () {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', layerId, function () {
        map.getCanvas().style.cursor = ''
      })
    })
  },

  setupDebugClickLog() {
    const map = mapManager.getMap()
    const layers = [TRAFFIC_CLUSTERS_LAYER_ID, TRAFFIC_COUNT_LAYER_ID, TRAFFIC_UNCLUSTERED_LAYER_ID]
    map.on('click', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers })
      console.log('Traffic click debug:', feats.map((f) => ({
        id: f.properties?.id || f.properties?.cluster_id,
        layer: f.layer?.id,
        cluster: !!f.properties?.cluster_id,
        pointCount: f.properties?.point_count
      })))
    })
  },

  updateTrafficData(geoJSON) {
    const map = mapManager.getMap()
    if (!geoJSON || !geoJSON.features) return

    const source = map.getSource(TRAFFIC_CLUSTER_SOURCE_ID)
    if (source) {
      source.setData(geoJSON)
    }

    console.log(`✓ Traffic data updated: ${geoJSON.features.length} items`)
  },

  enable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(TRAFFIC_CLUSTERS_LAYER_ID, 'visibility', 'visible')
    map.setLayoutProperty(TRAFFIC_COUNT_LAYER_ID, 'visibility', 'visible')
    map.setLayoutProperty(TRAFFIC_UNCLUSTERED_LAYER_ID, 'visibility', 'visible')
  },

  disable() {
    const map = mapManager.getMap()
    map.setLayoutProperty(TRAFFIC_CLUSTERS_LAYER_ID, 'visibility', 'none')
    map.setLayoutProperty(TRAFFIC_COUNT_LAYER_ID, 'visibility', 'none')
    map.setLayoutProperty(TRAFFIC_UNCLUSTERED_LAYER_ID, 'visibility', 'none')
  },

  /**
   * Load initial data so clusters exist even if UI is absent or API fails.
   * Attempts live /api/scan first; falls back to baked demo data.
   */
  async loadInitialData() {
    // Try live data if the API is available
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bbox: { w: 112.5, s: -44.0, e: 154.0, n: -9.0 },
          zoom: 5
        })
      })

      if (resp.ok) {
        const data = await resp.json()
        if (data?.geojson?.features?.length) {
          this.updateTrafficData(data.geojson)
          console.log(`✓ Traffic data loaded from /api/scan (${data.geojson.features.length} features)`)
          return
        }
      }
    } catch (e) {
      console.warn('Live traffic load failed, using demo data', e)
    }

    // Fallback demo data so clusters are interactive
    const demo = {
      type: 'FeatureCollection',
      features: [
        // Dense cluster around Sydney to guarantee a visible cluster bubble
        ...Array.from({ length: 12 }).map((_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              151.2093 + (Math.random() - 0.5) * 0.15,
              -33.8688 + (Math.random() - 0.5) * 0.1
            ]
          },
          properties: {
            id: `demo-syd-${i}`,
            type: 'ACCIDENT',
            icon: '🚗',
            publishedAt: new Date().toISOString()
          }
        })),
        // A couple of outliers
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [144.9631, -37.8136] }, // Melbourne
          properties: { id: 'demo-melb', type: 'HAZARD', icon: '⚠️', publishedAt: new Date().toISOString() }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [153.026, -27.4698] }, // Brisbane
          properties: { id: 'demo-bne', type: 'POLICE', icon: '🚔', publishedAt: new Date().toISOString() }
        }
      ]
    }

    this.updateTrafficData(demo)
    console.log('✓ Demo traffic data loaded (fallback)')
  },

  cleanup() {
    const map = mapManager.getMap()
    try {
      map.removeLayer(TRAFFIC_UNCLUSTERED_LAYER_ID)
      map.removeLayer(TRAFFIC_COUNT_LAYER_ID)
      map.removeLayer(TRAFFIC_CLUSTERS_LAYER_ID)
      map.removeSource(TRAFFIC_CLUSTER_SOURCE_ID)
    } catch (e) {}
  }
}
