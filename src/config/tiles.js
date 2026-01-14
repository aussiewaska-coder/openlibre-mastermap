/**
 * Tile server URLs and configurations
 */

export const TILE_SOURCES = {
  osm: {
    id: 'osm-raster',
    type: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '© OpenStreetMap contributors'
  },
  
  satellite: {
    id: 'satellite',
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Esri, DigitalGlobe, Earthstar Geographics'
  }
}

export const DEM_SOURCE = {
  id: 'dem',
  type: 'raster-dem',
  tiles: [
    'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
  ],
  tileSize: 256,
  encoding: 'terrarium',
  minzoom: 0,
  maxzoom: 15
}

/**
 * Initial map style definition
 */
export function createMapStyle() {
  return {
    version: 8,
    sources: {
      [TILE_SOURCES.osm.id]: {
        type: TILE_SOURCES.osm.type,
        tiles: TILE_SOURCES.osm.tiles,
        tileSize: TILE_SOURCES.osm.tileSize,
        attribution: TILE_SOURCES.osm.attribution
      },
      [TILE_SOURCES.satellite.id]: {
        type: TILE_SOURCES.satellite.type,
        tiles: TILE_SOURCES.satellite.tiles,
        tileSize: TILE_SOURCES.satellite.tileSize,
        attribution: TILE_SOURCES.satellite.attribution
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#87ceeb' }
      },
      {
        id: 'osm-basemap',
        type: 'raster',
        source: 'osm-raster',
        minzoom: 0,
        maxzoom: 19,
        layout: { visibility: 'none' }
      },
      {
        id: 'satellite-basemap',
        type: 'raster',
        source: 'satellite',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
}
