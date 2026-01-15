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
    console.log('✓ Traffic plugin initialized')
  },

  setupClusterClick() {
    const map = mapManager.getMap()

    const handleClusterClick = (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
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
