/**
 * Australian landmarks database
 * Used for random initial map centering and landmark markers
 */
export const AUSTRALIA_LANDMARKS = [
  { name: 'Bondi Beach', lng: 151.2844, lat: -33.8906, zoom: 8 },
  { name: 'Cape Byron Headland', lng: 153.6371, lat: -28.6397, zoom: 8 },
  { name: 'Shoalwater Bay', lng: 150.5, lat: -21.65, zoom: 7 },
  { name: 'Cape Tribulation', lng: 145.4514, lat: -16.0885, zoom: 8 },
  { name: 'Whitsunday Islands', lng: 149.1833, lat: -20.3667, zoom: 7 },
  { name: 'Magnetic Island', lng: 146.8667, lat: -19.15, zoom: 8 },
  { name: 'Cairns Inlet', lng: 145.7781, lat: -16.8861, zoom: 8 },
  { name: 'Ningaloo Reef', lng: 113.7667, lat: -22.0167, zoom: 8 },
  { name: 'Shark Bay', lng: 113.7667, lat: -25.2833, zoom: 7 },
  { name: 'Cape Leeuwin', lng: 114.9167, lat: -34.3833, zoom: 8 },
  { name: 'Rottnest Island', lng: 115.5, lat: -32.0167, zoom: 8 },
  { name: 'Twelve Apostles', lng: 142.5597, lat: -38.6637, zoom: 8 },
  { name: 'Freycinet Peninsula', lng: 148.2, lat: -41.8, zoom: 8 },
  { name: 'Wineglass Bay', lng: 148.3, lat: -41.8, zoom: 8 },
  { name: 'Port Arthur Cliffs', lng: 147.8667, lat: -43.1667, zoom: 8 },
  { name: 'Bruny Island', lng: 147.1667, lat: -43.4167, zoom: 8 },
  { name: 'Jervis Bay', lng: 150.6833, lat: -35.1333, zoom: 8 },
  { name: 'Batemans Bay', lng: 150.1833, lat: -35.7167, zoom: 8 },
  { name: 'Snowy Mountains', lng: 148.2639, lat: -36.4565, zoom: 8 },
  { name: 'Blue Mountains', lng: 150.3167, lat: -33.7167, zoom: 8 },
  { name: 'Lord Howe Island', lng: 159.0833, lat: -31.55, zoom: 8 },
  { name: 'Noosa Heads', lng: 153.0984, lat: -26.3994, zoom: 8 },
  { name: 'Fraser Island', lng: 145.5, lat: -25.3, zoom: 8 },
  { name: 'Port Stephens', lng: 152.2333, lat: -32.7167, zoom: 8 },
  { name: 'Batehurst Bay', lng: 149.9, lat: -36.25, zoom: 8 }
]

/**
 * Get a random landmark from the database
 */
export function getRandomLandmark() {
  return AUSTRALIA_LANDMARKS[Math.floor(Math.random() * AUSTRALIA_LANDMARKS.length)]
}
