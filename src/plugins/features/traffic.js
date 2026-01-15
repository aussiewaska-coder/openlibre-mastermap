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

    // Inspect cluster on click - zoom to expansion zoom
    map.on('click', TRAFFIC_CLUSTERS_LAYER_ID, function (e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: [TRAFFIC_CLUSTERS_LAYER_ID]
      })
      var clusterId = features[0].properties.cluster_id
      map.getSource(TRAFFIC_CLUSTER_SOURCE_ID).getClusterExpansionZoom(
        clusterId,
        function (err, zoom) {
          if (err) return
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          })
        }
      )
    })

    map.on('mouseenter', TRAFFIC_CLUSTERS_LAYER_ID, function () {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', TRAFFIC_CLUSTERS_LAYER_ID, function () {
      map.getCanvas().style.cursor = ''
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
