import maplibregl from 'maplibre-gl'

// Australia landmarks - coastal, islands, cliffs, mountains, inlets
const AUSTRALIA_LANDMARKS = [
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

// Pick random landmark on page load
const AUSTRALIA_CENTER = AUSTRALIA_LANDMARKS[Math.floor(Math.random() * AUSTRALIA_LANDMARKS.length)]

// Initialize map
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'osm-raster': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      },
      'satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Esri, DigitalGlobe, Earthstar Geographics'
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#e0e5ff' }
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
  },
  center: [AUSTRALIA_CENTER.lng, AUSTRALIA_CENTER.lat],
  zoom: AUSTRALIA_CENTER.zoom,
  pitch: 45,
  bearing: 0,
  maxPitch: 85,
  attributionControl: true,
  dragPan: true,
  dragRotate: true
})

// Track when tiles have loaded
let tilesLoaded = false

// Add terrain DEM from AWS Marketplace (Terrarium format)
map.on('load', () => {
  // Add DEM source (Terrarium encoding)
  // Terrarium formula: elevation = (R * 256 + G + B / 256) - 32768
  // Source: AWS Marketplace elevation-tiles-prod bucket
  map.addSource('dem', {
    type: 'raster-dem',
    tiles: [
      'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    encoding: 'terrarium',
    minzoom: 0,
    maxzoom: 15
  })

  // Debug: Check if DEM source is loaded
  map.on('sourcedataloading', (e) => {
    if (e.sourceId === 'dem') {
      console.log('DEM tiles loading...')
    }
  })

  map.on('error', (e) => {
    if (e.error && e.error.message) {
      console.error('Map error:', e.error.message)
    }
  })

  // Add terrain effect using the DEM
  map.setTerrain({
    source: 'dem',
    exaggeration: 1.0
  })

  // Add hillshade layer derived from DEM
  // Note: Added AFTER basemap so it appears on top
  map.addLayer({
    id: 'hillshade',
    source: 'dem',
    type: 'hillshade',
    paint: {
      'hillshade-shadow-color': '#473B24',
      'hillshade-highlight-color': '#F7F1D7',
      'hillshade-exaggeration': 0.6
    }
  })

  // Add landmark labels as HTML overlays
  const landmarkMarkers = []
  AUSTRALIA_LANDMARKS.forEach((landmark) => {
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

    landmarkMarkers.push(marker)
  })

  // Update info panel on move
  function updateInfo() {
    const center = map.getCenter()
    const zoom = map.getZoom()
    document.getElementById('zoom-info').textContent = `Zoom: ${zoom.toFixed(2)}`
    document.getElementById('center-info').textContent = `Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
  }

  map.on('move', updateInfo)
  map.on('zoom', updateInfo)
  updateInfo()

  // Terrain exaggeration slider
  const exaggerationSlider = document.getElementById('exaggeration-slider')
  const exaggerationValue = document.getElementById('exaggeration-value')

  exaggerationSlider.addEventListener('input', (e) => {
    const exaggeration = parseFloat(e.target.value)
    exaggerationValue.textContent = exaggeration.toFixed(1)
    map.setTerrain({
      source: 'dem',
      exaggeration: exaggeration
    })
  })

  // Hillshade toggle
  const hillshadeToggle = document.getElementById('hillshade-toggle')
  hillshadeToggle.addEventListener('change', (e) => {
    const visible = e.target.checked
    map.setLayoutProperty('hillshade', 'visibility', visible ? 'visible' : 'none')
  })

  // Satellite map toggle
  const satelliteToggle = document.getElementById('satellite-toggle')
  satelliteToggle.addEventListener('change', (e) => {
    const useSatellite = e.target.checked
    map.setLayoutProperty('osm-basemap', 'visibility', useSatellite ? 'none' : 'visible')
    map.setLayoutProperty('satellite-basemap', 'visibility', useSatellite ? 'visible' : 'none')
    console.log(`✓ Switched to ${useSatellite ? 'Satellite Imagery' : 'OpenStreetMap'}`)
  })

  // Pitch button for 3D mode
  const pitchButton = document.getElementById('pitch-button')
  let is3DMode = false
  pitchButton.addEventListener('click', () => {
    is3DMode = !is3DMode
    map.easeTo({
      pitch: is3DMode ? 75 : 0,
      duration: 1000
    })
    pitchButton.textContent = is3DMode
      ? 'Exit 3D Mode'
      : 'Enter 3D Mode (Right-click to rotate)'
  })

  // Orbit button for camera rotation
  const orbitButton = document.getElementById('orbit-button')
  let bearing = 0
  let orbitInterval = null
  let isOrbiting = false

  // Random Flight Mode State
  let isFlying = false
  let flightTransitioning = false // Prevent stopFlight during initial transition
  let flightAnimationId = null
  let flightSpeed = 0.001         // Speed of forward panning (degrees per frame) - 100x slower
  let flightBearing = 0           // Direction of flight

  function stopOrbit() {
    if (orbitInterval) {
      clearInterval(orbitInterval)
      orbitInterval = null
      isOrbiting = false
      orbitButton.textContent = 'Start Orbit (45°)'
      console.log('✓ Orbit stopped')
    }
  }

  orbitButton.addEventListener('click', (e) => {
    e.stopPropagation()
    if (isOrbiting) {
      stopOrbit()
      map.dragRotate.enable()
    } else {
      isOrbiting = true
      bearing = map.getBearing()
      orbitButton.textContent = 'Stop Orbit'
      map.dragRotate.disable()
      orbitInterval = setInterval(() => {
        bearing = (bearing + 0.1) % 360
        map.setBearing(bearing)
      }, 30)
    }
  })

  // Flight animation loop - simple forward motion
  function animateFlight(timestamp) {
    if (!isFlying) return

    const center = map.getCenter()
    const zoom = map.getZoom()
    const pitch = map.getPitch()

    // Pan forward based on bearing
    const latChange = flightSpeed * Math.cos(flightBearing * Math.PI / 180)
    const lngChange = flightSpeed * Math.sin(flightBearing * Math.PI / 180)

    const newCenter = [center.lng + lngChange, center.lat + latChange]

    console.log('Flight frame:', { isFlying, flightBearing, latChange, lngChange, newCenter })

    map.jumpTo({
      center: newCenter,
      zoom: zoom,
      pitch: pitch
    })

    // Continue animation
    flightAnimationId = requestAnimationFrame(animateFlight)
  }

  function stopFlight() {
    if (!isFlying || flightTransitioning) return

    // Cancel animation
    if (flightAnimationId) {
      cancelAnimationFrame(flightAnimationId)
      flightAnimationId = null
    }

    // Decelerate smoothly to current position
    const currentCenter = map.getCenter()
    const currentBearing = map.getBearing()
    const currentPitch = map.getPitch()

    map.easeTo({
      center: [currentCenter.lng, currentCenter.lat],
      bearing: currentBearing,
      pitch: currentPitch,
      duration: 2000,
      easing: (t) => t * (2 - t) // easeOutQuad
    })

    // Reset state
    isFlying = false
    flightTransitioning = false

    // Update button
    const flightButton = document.getElementById('flight-button')
    if (flightButton) {
      flightButton.textContent = 'Random Flight'
    }

    // Re-enable drag rotate
    map.dragRotate.enable()
  }

  function startFlight() {
    if (isFlying) return

    isFlying = true
    flightTransitioning = true

    // Random bearing direction (0-360)
    flightBearing = Math.random() * 360
    console.log('START FLIGHT - bearing:', flightBearing)

    // Update button
    const flightButton = document.getElementById('flight-button')
    if (flightButton) {
      flightButton.textContent = 'Stop Flight'
    }

    // Disable drag rotate during flight
    map.dragRotate.disable()

    // One smooth flyTo transition to flight mode with easing
    map.flyTo({
      zoom: 14.5,
      pitch: 75,
      bearing: flightBearing,
      speed: 1.2,
      curve: 1.42,
      duration: 4000
    })

    // Start forward motion animation immediately - blended with the flyTo
    flightAnimationId = requestAnimationFrame(animateFlight)

    // Clear transitioning flag after flight starts
    setTimeout(() => {
      flightTransitioning = false
    }, 500)
  }

  // Random Flight button
  const flightButton = document.getElementById('flight-button')
  if (flightButton) {
    flightButton.addEventListener('click', (e) => {
      e.stopPropagation()
      console.log('Flight button clicked - isFlying:', isFlying, 'isOrbiting:', isOrbiting)
      if (isFlying) {
        stopFlight()
      } else {
        if (isOrbiting) {
          stopOrbit()
        }
        map.dragRotate.enable()
        startFlight()
      }
    })
  }

  // Spacebar to stop flight
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isFlying) {
      e.preventDefault()
      stopFlight()
    }
  })

  // Command+click to orbit and zoom to location
  map.on('click', (e) => {
    if (e.originalEvent.metaKey || e.originalEvent.ctrlKey) {
      stopOrbit()
      stopFlight()
      map.dragRotate.enable()

      // Create military crosshair target
      const style = document.createElement('style')
      style.textContent = `
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { r: 4; }
          50% { r: 6; }
        }
        .target-crosshair {
          animation: rotateRing 4s linear infinite;
          transform-origin: center;
        }
        .target-dot {
          animation: pulseDot 0.8s ease-in-out infinite;
        }
      `
      document.head.appendChild(style)

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '80')
      svg.setAttribute('height', '80')
      svg.setAttribute('viewBox', '0 0 80 80')
      svg.style.position = 'absolute'
      svg.style.pointerEvents = 'none'
      svg.style.filter = 'drop-shadow(0 0 5px rgba(255,221,0,0.5))'
      svg.style.transition = 'opacity 2s ease-out'
      svg.style.opacity = '1'

      // Outer rotating ring
      const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      outerRing.setAttribute('cx', '40')
      outerRing.setAttribute('cy', '40')
      outerRing.setAttribute('r', '35')
      outerRing.setAttribute('fill', 'none')
      outerRing.setAttribute('stroke', '#ffdd00')
      outerRing.setAttribute('stroke-width', '2')
      outerRing.setAttribute('opacity', '0.7')
      outerRing.classList.add('target-crosshair')

      // Middle ring
      const midRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      midRing.setAttribute('cx', '40')
      midRing.setAttribute('cy', '40')
      midRing.setAttribute('r', '20')
      midRing.setAttribute('fill', 'none')
      midRing.setAttribute('stroke', '#ffdd00')
      midRing.setAttribute('stroke-width', '1.5')
      midRing.setAttribute('opacity', '0.8')

      // Crosshair lines
      const hline = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      hline.setAttribute('x1', '10')
      hline.setAttribute('y1', '40')
      hline.setAttribute('x2', '30')
      hline.setAttribute('y2', '40')
      hline.setAttribute('stroke', '#ffdd00')
      hline.setAttribute('stroke-width', '2')

      const hline2 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      hline2.setAttribute('x1', '50')
      hline2.setAttribute('y1', '40')
      hline2.setAttribute('x2', '70')
      hline2.setAttribute('y2', '40')
      hline2.setAttribute('stroke', '#ffdd00')
      hline2.setAttribute('stroke-width', '2')

      const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      vline.setAttribute('x1', '40')
      vline.setAttribute('y1', '10')
      vline.setAttribute('x2', '40')
      vline.setAttribute('y2', '30')
      vline.setAttribute('stroke', '#ffdd00')
      vline.setAttribute('stroke-width', '2')

      const vline2 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      vline2.setAttribute('x1', '40')
      vline2.setAttribute('y1', '50')
      vline2.setAttribute('x2', '40')
      vline2.setAttribute('y2', '70')
      vline2.setAttribute('stroke', '#ffdd00')
      vline2.setAttribute('stroke-width', '2')

      // Center pulsing dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', '40')
      dot.setAttribute('cy', '40')
      dot.setAttribute('r', '4')
      dot.setAttribute('fill', '#ffdd00')
      dot.classList.add('target-dot')

      svg.appendChild(outerRing)
      svg.appendChild(midRing)
      svg.appendChild(hline)
      svg.appendChild(hline2)
      svg.appendChild(vline)
      svg.appendChild(vline2)
      svg.appendChild(dot)

      const marker = new maplibregl.Marker({ element: svg })
        .setLngLat(e.lngLat)
        .addTo(map)

      const targetEl = svg

      map.flyTo({
        center: e.lngLat,
        zoom: 12,
        pitch: 60,
        bearing: 540,
        duration: 6000
      })

      setTimeout(() => {
        targetEl.style.opacity = '0'
        setTimeout(() => marker.remove(), 2000)
      }, 3500)

      setTimeout(() => {
        isOrbiting = true
        bearing = map.getBearing()
        orbitButton.textContent = 'Stop Orbit'
        map.dragRotate.disable()
        orbitInterval = setInterval(() => {
          bearing = (bearing + 0.1) % 360
          map.setBearing(bearing)
        }, 30)
      }, 5500)
    }
  })

  // Australia button - show full country in satellite view
  const australiaButton = document.getElementById('australia-button')
  australiaButton.addEventListener('click', (e) => {
    e.stopPropagation()
    stopOrbit()
    map.dragRotate.enable()

    // Hide landmark labels
    landmarkMarkers.forEach((marker) => marker.remove())

    // Enable satellite view
    satelliteToggle.checked = true
    map.setLayoutProperty('osm-basemap', 'visibility', 'none')
    map.setLayoutProperty('satellite-basemap', 'visibility', 'visible')

    // Fly to Australia - top down view
    map.flyTo({
      center: [135, -25],
      zoom: 3.5,
      pitch: 0,
      bearing: 0,
      duration: 3000
    })

    // Try to set globe projection if supported
    try {
      map.setProjection('globe')
    } catch (e) {
      // Globe mode not supported, continue with default projection
    }
  })

  // Stop orbit and flight on user interaction
  map.on('dragstart', () => {
    stopOrbit()
    stopFlight()
  })
  map.on('zoomstart', () => {
    stopOrbit()
    stopFlight()
  })

  // Auto-start orbit on load
  isOrbiting = true
  bearing = map.getBearing()
  orbitButton.textContent = 'Stop Orbit'
  map.dragRotate.disable()
  orbitInterval = setInterval(() => {
    bearing = (bearing + 0.1) % 360
    map.setBearing(bearing)
  }, 30)

  // Wait for tiles to load before fading in
  let fadeTriggered = false
  map.on('idle', () => {
    if (!fadeTriggered && !tilesLoaded) {
      tilesLoaded = true
      fadeTriggered = true
      // Trigger fade-in by adding the class
      document.getElementById('map-fade').classList.add('fade-out')
      console.log('✓ Tiles loaded, fading in...')
    }
  })

  console.log('✓ Map loaded successfully')
  console.log('✓ Terrain (DEM) source added with Terrarium encoding')
  console.log('✓ Hillshade layer added')
  console.log('✓ Controls initialized')
})

// Error handling
map.on('error', (e) => {
  console.error('Map error:', e)
})
