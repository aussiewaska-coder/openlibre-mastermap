import mapManager from '../../core/mapManager.js'

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

    console.log('✓ Traffic plugin initialized')
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
