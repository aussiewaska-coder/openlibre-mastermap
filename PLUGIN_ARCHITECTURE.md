# Plugin Architecture Guide

MASTERMAP uses a **standard plugin system** where all map capabilities are isolated, testable, and composable.

## Plugin Structure

Each plugin is a **self-contained module** with a consistent lifecycle:

```
src/plugins/
├── features/          # Data-driven plugins (terrain, imagery, alerts)
│   ├── terrain.js
│   ├── imagery.js
│   └── alerts.js      # Future
└── [feature-name].js  # New plugins here
```

## Standard Plugin Interface

Every plugin **must export** an object with these methods:

```js
export default {
  /**
   * Initialize plugin - called once on app startup
   * Access map via mapManager.getMap()
   */
  initialize() {
    const map = mapManager.getMap()
    // Add sources, layers, event listeners
  },

  /**
   * Enable/disable plugin functionality
   * Used for user preferences, tier-based access control
   */
  enable() {
    const map = mapManager.getMap()
    // Show layers, resume event listeners
  },

  disable() {
    const map = mapManager.getMap()
    // Hide layers, pause functionality
  },

  /**
   * Update plugin state from external config
   * Used for runtime layer switching, data filtering
   */
  update(config) {
    // config example: { opacity: 0.8, maxZoom: 15 }
  },

  /**
   * Cleanup on app shutdown
   * Remove layers, clear event listeners, deallocate resources
   */
  cleanup() {
    const map = mapManager.getMap()
    // Remove all state created by this plugin
  }
}
```

## Example: Terrain Plugin

```js
import mapManager from '../core/mapManager.js'

export default {
  initialize() {
    const map = mapManager.getMap()

    // Add DEM source
    map.addSource('dem', {
      type: 'raster-dem',
      tiles: ['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'],
      tileSize: 256,
      encoding: 'terrarium',
      minzoom: 0,
      maxzoom: 15
    })

    // Apply terrain effect
    map.setTerrain({
      source: 'dem',
      exaggeration: 1.0
    })
  },

  enable() {
    const map = mapManager.getMap()
    map.setTerrain({
      source: 'dem',
      exaggeration: map.getTerrain().exaggeration || 1.0
    })
  },

  disable() {
    const map = mapManager.getMap()
    map.setTerrain(null)
  },

  update(config) {
    const map = mapManager.getMap()
    if (config.exaggeration !== undefined) {
      map.setTerrain({
        source: 'dem',
        exaggeration: config.exaggeration
      })
    }
  },

  cleanup() {
    const map = mapManager.getMap()
    map.setTerrain(null)
    // Source will be cleaned up automatically
  }
}
```

## Plugin Lifecycle

### On App Startup (`src/main.js`)
```js
// Initialize all plugins in order
terrainFeature.initialize()
imageryFeature.initialize()
// alertsFeature.initialize()  // Future
```

### Runtime Control (for user preferences, tier-based access)
```js
const map = mapManager.getMap()

// Disable for free users
if (userTier === 'free') {
  terrainFeature.disable()
}

// Enable on upgrade
if (userTier === 'pro') {
  terrainFeature.enable()
  alertsFeature.enable()
}

// Update with user config
terrainFeature.update({ exaggeration: 2.0 })
alertsFeature.update({ severity: ['high', 'critical'] })
```

### On App Shutdown
```js
// Cleanup all plugins
terrainFeature.cleanup()
imageryFeature.cleanup()
```

## Adding a New Plugin

### 1. Create the plugin file
```js
// src/plugins/features/my-feature.js

import mapManager from '../../core/mapManager.js'

export default {
  initialize() {
    const map = mapManager.getMap()
    // Setup your feature
  },

  enable() {
    // Show/activate your feature
  },

  disable() {
    // Hide/deactivate your feature
  },

  update(config) {
    // Apply runtime configuration
  },

  cleanup() {
    // Remove all state and listeners
  }
}
```

### 2. Import in main.js
```js
import myFeature from './plugins/features/my-feature.js'

async function initialize() {
  mapManager.initialize('map')
  await new Promise((resolve) => { mapManager.onLoad(resolve) })
  
  terrainFeature.initialize()
  imageryFeature.initialize()
  myFeature.initialize()  // ← Add here
  
  console.log('✓ App initialized')
}
```

### 3. Test in isolation
```js
// In browser console
myFeature.disable()   // Hide it
myFeature.enable()    // Show it
myFeature.update({ option: value })
myFeature.cleanup()
```

## Accessing MapLibre

All plugins access the map instance via **mapManager**:

```js
import mapManager from '../../core/mapManager.js'

const map = mapManager.getMap()

// Standard MapLibre methods work directly
map.addSource(...)
map.addLayer(...)
map.setLayoutProperty(...)
map.on('click', ...)
map.flyTo(...)
```

See `src/core/mapManager.js` for the full wrapper API.

## State Management

Use **stateManager** for shared state that affects multiple plugins:

```js
import stateManager from '../../core/stateManager.js'

// Read state
const isTerrainEnabled = stateManager.get('satelliteEnabled')

// Write state
stateManager.set('terrainExaggeration', 2.0)

// Subscribe to changes
const unsubscribe = stateManager.subscribe('satelliteEnabled', (newVal, oldVal) => {
  console.log(`Satellite toggled: ${oldVal} → ${newVal}`)
})

// Unsubscribe
unsubscribe()
```

**Current state keys:**
- `satelliteEnabled` (boolean)
- `hillshadeVisible` (boolean)
- `terrainExaggeration` (number)

Add new keys as needed—they'll persist across plugin enable/disable cycles.

## Best Practices

1. **One concern per plugin** — terrain plugin does terrain only
2. **No side effects in exports** — only execute code in `initialize()`
3. **Always cleanup** — remove layers, cancel intervals, unsubscribe listeners
4. **Use mapManager, not global map** — keeps plugins composable
5. **Document config in update()** — make plugins discoverable
6. **Test disable/enable cycles** — ensure layer visibility toggles work

## Future: Alerts Plugin Example

```js
// src/plugins/features/alerts.js
export default {
  initialize() {
    const map = mapManager.getMap()
    
    // Add alert markers/clusters layer
    map.addSource('alerts', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
    
    map.addLayer({
      id: 'alerts-points',
      source: 'alerts',
      type: 'circle',
      paint: { 'circle-radius': 6, 'circle-color': '#ff0000' }
    })
    
    // Listen for alert updates from server
    this.connectToAlertStream()
  },

  update(config) {
    // Filter alerts by severity, time range
    const filtered = this.alertsData.filter(a => 
      config.severity.includes(a.severity)
    )
    
    const source = mapManager.getMap().getSource('alerts')
    source.setData({
      type: 'FeatureCollection',
      features: filtered
    })
  },

  disable() {
    mapManager.getMap().setLayoutProperty('alerts-points', 'visibility', 'none')
  },

  cleanup() {
    mapManager.getMap().removeLayer('alerts-points')
    mapManager.getMap().removeSource('alerts')
  }
}
```

---

**Result:** Clean, testable, composable map features. Each plugin can be developed, tested, and deployed independently.
