# OPENLIBRE MASTERMAP — PLUGIN-CENTRIC ARCHITECTURE GOSPEL
**Version:** v1.0 (living doc)  
**Date:** 2026-01-13 (Australia/Brisbane)  

> **This is the complete, canonical architecture document for the OpenLibre MasterMap system.**  
> It replaces all prior architecture notes. If it’s not here, it’s not “real.”

---

## Table of Contents
- [1. Overview](#1-overview)
- [2. Canonical File Structure](#2-canonical-file-structure)
- [3. Plugin-Centric Model](#3-plugin-centric-model)
- [4. Module Dependency Graph](#4-module-dependency-graph)
- [5. Data Flow](#5-data-flow)
- [6. State Management Flow](#6-state-management-flow)
- [7. Feature Plugin Pattern](#7-feature-plugin-pattern)
- [8. Control Panel Architecture](#8-control-panel-architecture)
- [9. Module Initialization Order](#9-module-initialization-order)
- [10. Configuration Hierarchy](#10-configuration-hierarchy)
- [11. Camera Animation States](#11-camera-animation-states)
- [12. Error Handling Strategy](#12-error-handling-strategy)
- [13. Memory Management](#13-memory-management)
- [14. Extension Points](#14-extension-points)
- [15. Testing Strategy](#15-testing-strategy)
- [16. Performance Considerations](#16-performance-considerations)
- [17. Migration Path](#17-migration-path)
- [18. Plugin Runtime Enable/Disable](#18-plugin-runtime-enabledisable)
- [19. UI Architecture — Path A + Path B](#19-ui-architecture--path-a--path-b)
- [20. Mobile-First Doctrine (Non-Negotiable)](#20-mobile-first-doctrine-non-negotiable)
- [21. Icons + Animated Icons Standard](#21-icons--animated-icons-standard)
- [22. Troubleshooting](#22-troubleshooting)
- [23. Summary](#23-summary)
- [Appendix A — 100% Compliance Rename/Replace Commands](#appendix-a--100-compliance-renamereplace-commands)

---

## 1. Overview

The original monolithic `main.js` (593 lines) was refactored into a modular architecture with clear separation of concerns.
**This gospel document further formalizes that refactor into a plugin-centric system**, where different plugins add different capabilities to the *same* MapLibre instance.

### What “Plugin-Centric” means here
- There is **one MapLibre map instance**.
- Capabilities such as Terrain, Camera, Imagery, Controls, UI panels, and interactions are implemented as **plugins**.
- Plugins can be **enabled/disabled by users at runtime** (where appropriate) or by config at startup.
- Plugins never “reach into” each other directly. They communicate through:
  - `MapManager` (map operations)
  - `StateManager` (reactive state)
  - configuration (`config/*`)


---

## 🔐 Platform Runtime & Data Layer (Canonical)

> **OpenLibre MasterMap is designed to run on Vercel, with server-side data and runtime configuration.**
> Static-only hosting is explicitly out of scope.

### Deployment Runtime

- **Deployment platform:** Vercel (only)
- **Execution model:** Client (MapLibre) + Server Functions
- **Secrets handling:** Vercel Environment Variables
- **Edge compatibility:** Optional (future)

This runtime model is considered **part of the architecture**, not an implementation detail.

---

## 🗄️ Data Architecture

### Neon (Primary Database)

**Neon (Serverless Postgres)** is the canonical persistent datastore for the system.

Neon is used for:
- alert records
- alert metadata & severity
- geospatial event history
- user preferences (future)
- plugin configuration (future)

Why Neon:
- Serverless Postgres
- Native Vercel integration
- Branching for environments
- Excellent fit for spatial + temporal data

### Redis (Optional, First-Class)

Redis is an **optional but first-class** component.

Used for:
- real-time alert fan-out
- hot alert caches
- rate limiting
- websocket / SSE acceleration
- deduplication & throttling

The system must function without Redis, but scale better with it.

---

## 🚨 Alerts Dashboard Plugin (Primary Feature)

The **Alerts Dashboard Plugin** is the primary upcoming feature plugin and a core design driver.

### Responsibilities

- Ingest alerts via server functions
- Query alerts from Neon
- Optional real-time acceleration via Redis
- Spatial filtering & clustering
- Time-based playback
- Severity-based styling
- Mobile-safe alert panels (bottom sheets)

### Architectural Rules

- Alerts logic lives in **feature plugins**
- Data access lives in **server functions**
- UI is an optional plugin layer
- No direct client → database access

### Example Server Function Boundary

```ts
// /api/alerts/query.ts
export default async function handler(req, res) {
  const alerts = await db.query(
    'SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100'
  )
  res.json(alerts)
}
```

The Alerts Plugin consumes this API via fetch and renders spatial state onto the map.

---

## 🌍 Environment Variables (Runtime)

All configuration is supplied via **Vercel Environment Variables**.

### Required

```
DATABASE_URL=postgresql://...
```

(Provided automatically when Neon is connected via Vercel.)

### Optional

```
DEM_TILE_URL=https://elevation-tiles-prod.s3.amazonaws.com/{z}/{x}/{y}.png
REDIS_URL=redis://...
```

### Rules

- Secrets **never** ship to the client bundle
- Server Functions read via `process.env`
- Client variables must be explicitly exposed (avoid unless required)

---


---

## 2. Canonical File Structure

> **All prior `src/plugins/features/*` paths are deprecated.**  
> The canonical location is now `src/plugins/features/*`.

```
src/
├── main.js                           # Entry point (thin orchestration only)
├── style.css                         # Styling (global)
│
├── config/                           # Configuration & constants
│   ├── landmarks.js                  # Australian landmarks database
│   ├── defaults.js                   # Default configuration values
│   └── tiles.js                      # Tile server URLs & styles
│
├── core/                             # Core infrastructure (runtime substrate)
│   ├── mapManager.js                 # MapLibre GL wrapper
│   └── stateManager.js               # Global state management
│
├── plugins/                          # Plugin implementations
│   ├── features/                     # Map capabilities (terrain/camera/imagery/etc.)
│   │   ├── terrain.js                # DEM, hillshade, exaggeration
│   │   ├── camera.js                 # Orbit, flight, targeting modes
│   │   ├── imagery.js                # Basemap switching
│   │   └── controls.js               # Control panel setup (wires UI → features)
│   │
│   ├── ui/                           # UI components (optional, replaceable)
│   │   ├── infoPanel.js              # Info panel updates
│   │   └── landmarks.js              # Landmark marker creation
│   │
│   ├── interactions/                 # Event handlers (optional)
│   │   ├── keyboard.js               # Keyboard shortcuts
│   │   ├── mouse.js                  # Click/drag handlers
│   │   └── loadingAnimation.js       # Fade animation
│   │
│   └── utils/                        # Utility functions
│       └── svg.js                    # SVG/crosshair creation
│
└── main-original.js                  # Backup of original monolithic file
```

---

## 3. Plugin-Centric Model

### Core runtime (non-plugin substrate)
- `core/mapManager.js` — the sole owner of the MapLibre GL instance.
- `core/stateManager.js` — the sole owner of global app state.

### Plugins
A “plugin” is a module that can be enabled/disabled and provides a capability:
- Feature plugins: terrain, camera, imagery, controls
- UI plugins: info panel, landmark labels
- Interaction plugins: keyboard, mouse, startup animation
- Utility modules: SVG builders and shared helpers

### PluginContext (recommended contract)
To keep plugins decoupled and testable, plugins should be initialized with a context object:

```js
// PluginContext
const ctx = {
  map: mapManager,
  state: stateManager,
  config: {
    MAP_CONFIG,
    CAMERA_CONFIG,
    UI_CONFIG,
    ANIMATION_CONFIG,
    CROSSHAIR_CONFIG,
    AUSTRALIA_VIEW,
    TILE_SOURCES,
    DEM_SOURCE,
  },
  uiMode: 'headless' // or 'full'
}
```

Plugins may still import config directly if you want, but **context injection is the canonical direction** because it:
- makes enable/disable clean,
- makes unit tests trivial (inject mocks),
- prevents hidden coupling.

---

## 4. Module Dependency Graph

> Updated to reflect plugin-centric folder paths.

```
                        ┌─────────────┐
                        │  main.js    │ (Entry Point)
                        │ (thin orchestration) │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
          ┌─────▼────┐   ┌─────▼────┐   ┌───▼────────────┐
          │  config/ │   │   core/  │   │ plugins/features│
          └──────────┘   └──────────┘   └────────────────┘
               │              │              │
        ┌──────┴──────┐      │        ┌──────┴──────┬──────────┬──────────┐
        │             │      │        │             │          │          │
   landmarks.js   defaults.js  │   terrain.js   camera.js   imagery.js  controls.js
   tiles.js       mapManager   │
                  stateManager │
                              │
                              └─ Manages shared state
                                 and map instance
                                 
                ┌────────────────┬──────────────┬──────────────┐
                │                │              │              │
          ┌─────▼────┐    ┌──────▼────────┐   ┌─────▼────┐   ┌────▼─────┐
          │ plugins/ui│    │plugins/interactions│   │plugins/utils│
          └──────────┘    └───────────────┘   └──────────┘
               │                  │              │
        ┌──────┴──────┐    ┌──────┴──────┬──────┴──────────────┐
        │             │    │             │                     │
   infoPanel.js   landmarks.js  keyboard.js  mouse.js  loadingAnimation.js   svg.js
```

---

## 5. Data Flow

```
User Action (Click, Key, Move)
    │
    ├─→ Interaction Plugin (keyboard.js, mouse.js)
    │       │
    │       └─→ Feature Plugin (camera.js, terrain.js, etc.)
    │               │
    │               ├─→ MapManager (map operations)
    │               │       │
    │               │       └─→ MapLibre GL
    │               │
    │               └─→ StateManager (update state)
    │                       │
    │                       └─→ State Subscribers (UI update)
    │
    └─→ UI Update (infoPanel.js, landmarks.js)
```

---

## 6. State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    StateManager (Singleton)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ State Object:                                         │  │
│  │  - tilesLoaded: boolean                              │  │
│  │  - is3DMode: boolean                                 │  │
│  │  - isOrbiting: boolean                               │  │
│  │  - isFlying: boolean                                 │  │
│  │  - terrainExaggeration: number                       │  │
│  │  - satelliteEnabled: boolean                         │  │
│  │  - hillshadeVisible: boolean                         │  │
│  │  - ... and more                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Methods:                                                   │
│  • get(key) → value                                        │
│  • set(key, value) → notify subscribers                    │
│  • subscribe(key, callback) → unsubscribe function        │
│  • cleanup() → clear all resources                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Feature Plugin Pattern

Each feature plugin follows this pattern:

```js
class FeatureModule {
  // 1. Initialize (called in main.js / pluginManager)
  initialize(ctx) {
    // Read from config
    // Interact with mapManager
    // Update state via stateManager
    // Set up event listeners
  }

  // 2. Public API (methods other modules call)
  publicMethod() {
    // Update map
    // Update state
    // Notify via console or callbacks
  }

  // 3. Internal helpers (private methods)
  _privateHelper() {
    // Internal logic
  }

  // 4. Cleanup (called on app shutdown or plugin disable)
  cleanup() {
    // Cancel intervals
    // Remove listeners
    // Cleanup DOM
  }
}
```

---

## 8. Control Panel Architecture

```
┌─────────────────────────────────────────────┐
│        HTML Control Panel                    │
│  ┌─────────────────────────────────────────┐│
│  │ [Slider]  [Checkbox]  [Button]  [Button]││
│  └─────────────────────────────────────────┘│
└────────────┬────────────────────────────────┘
             │
             ├─→ addEventListener (browser)
             │
             └─→ controlsPlugin.setupControls()
                 │
                 ├─→ exaggerationSlider.addEventListener('input')
                 │       │
                 │       └─→ terrainPlugin.setExaggeration()
                 │
                 ├─→ hillshadeToggle.addEventListener('change')
                 │       │
                 │       └─→ terrainPlugin.setHillshadeVisible()
                 │
                 ├─→ satelliteToggle.addEventListener('change')
                 │       │
                 │       └─→ imageryPlugin.toggleBasemap()
                 │
                 ├─→ pitchButton.addEventListener('click')
                 │       │
                 │       └─→ cameraPlugin.toggle3DMode()
                 │
                 ├─→ orbitButton.addEventListener('click')
                 │       │
                 │       ├─→ cameraPlugin.startOrbit()
                 │       │   └─→ setInterval (updates bearing)
                 │       │
                 │       └─→ cameraPlugin.stopOrbit()
                 │           └─→ clearInterval
                 │
                 ├─→ flightButton.addEventListener('click')
                 │       │
                 │       ├─→ cameraPlugin.startFlight()
                 │       │   ├─→ mapManager.flyTo() (transition)
                 │       │   └─→ requestAnimationFrame (forward motion)
                 │       │
                 │       └─→ cameraPlugin.stopFlight()
                 │           ├─→ cancelAnimationFrame
                 │           └─→ mapManager.easeTo() (decelerate)
                 │
                 └─→ australiaButton.addEventListener('click')
                     │
                     ├─→ Hide landmark markers
                     ├─→ Enable satellite imagery
                     └─→ cameraPlugin.flyToAustralia()
```

---

## 9. Module Initialization Order

> Canonical initialization flow (plugin-centric).

```
main.js
    ↓
1. mapManager.initialize('map')        ← Creates map instance
    ↓
2. mapManager.onLoad(callback)         ← Wait for map ready
    ↓
3. terrainPlugin.initialize()          ← Add DEM, hillshade
    ↓
4. imageryPlugin.setSatellite()        ← Set initial basemap
    ↓
5. createLandmarkMarkers()             ← Add landmark labels (UI plugin)
    ↓
6. controlsPlugin.setupControls()      ← Attach event listeners
    ↓
7. controlsPlugin.setupMapInteractionListeners()  ← Drag/zoom handlers
    ↓
8. controlsPlugin.setupInfoPanelUpdates()  ← Update zoom/center
    ↓
9. setupKeyboardListeners()            ← Space key handler (interaction plugin)
    ↓
10. setupMouseListeners()              ← Cmd+Click handler (interaction plugin)
    ↓
11. setupLoadingAnimation()            ← Fade animation (interaction plugin)
    ↓
12. cameraPlugin.startOrbit()          ← Initial animation
```

---

## 10. Configuration Hierarchy

```
defaults.js (Central Repository)
    │
    ├─→ MAP_CONFIG
    │   ├─→ initialPitch: 45
    │   ├─→ terrainSource: 'dem'
    │   ├─→ defaultExaggeration: 1.0
    │   └─→ hillshadeExaggeration: 0.6
    │
    ├─→ CAMERA_CONFIG
    │   ├─→ orbitBearingIncrement: 0.1
    │   ├─→ flightSpeed: 0.001
    │   └─→ flightTargetZoom: 14.5
    │
    ├─→ UI_CONFIG
    │   ├─→ controlsOpacity: 0.95
    │   ├─→ buttonDefaultColor: '#2563eb'
    │   └─→ fontSize12: '12px'
    │
    ├─→ ANIMATION_CONFIG
    │   └─→ fadeOutDuration: 3000
    │
    └─→ CROSSHAIR_CONFIG
        ├─→ size: 80
        ├─→ color: '#ffdd00'
        └─→ rotationDuration: 4000
```

---

## 11. Camera Animation States

```
Map Camera
    │
    ├─→ Normal Mode (User can pan, zoom, rotate)
    │   └─→ User drags → Stop animations
    │
    ├─→ Orbit Mode (isOrbiting = true)
    │   ├─→ setInterval(updateBearing, 30ms)
    │   ├─→ dragRotate disabled
    │   └─→ User drag → Stop orbit
    │
    ├─→ Flight Mode (isFlying = true)
    │   ├─→ flyTo() → Smooth transition
    │   ├─→ requestAnimationFrame → Forward motion
    │   ├─→ dragRotate disabled
    │   └─→ Space key → Stop flight
    │
    └─→ 3D Mode (is3DMode = true)
        ├─→ pitch → 0° (top-down) or 75° (3D)
        └─→ Can combine with orbit/flight
```

---

## 12. Error Handling Strategy

```
┌─────────────────────────────────┐
│  Feature Plugin                  │
├─────────────────────────────────┤
│                                 │
│  try {                          │
│    // Plugin logic              │
│    mapManager.setTerrain()      │
│    stateManager.set()           │
│  } catch (error) {             │
│    console.error()              │
│    // Could add error UI here   │
│  }                              │
│                                 │
└─────────────────────────────────┘
```

```js
mapManager.on('error', (e) => {
  console.error('Map error:', e.error.message)
  // Map loading failed
})
```

Subscription callbacks wrapped:

```js
stateManager.subscribe(key, (value) => {
  try {
    callback(value)
  } catch (error) {
    console.error(`Error in listener for ${key}:`, error)
  }
})
```

---

## 13. Memory Management

```
┌─────────────────────────────────────────────┐
│          Cleanup on App Unload              │
└──────────┬──────────────────────────────────┘
           │
           ├─→ stateManager.cleanup()
           │   ├─→ clearInterval(orbitIntervalId)
           │   ├─→ cancelAnimationFrame(flightAnimationId)
           │   ├─→ Remove landmark markers
           │   └─→ Clear listeners map
           │
           ├─→ terrainPlugin.cleanup()
           │   └─→ Remove event listeners
           │
           ├─→ cameraPlugin.cleanup()
           │   ├─→ stopOrbit()
           │   └─→ stopFlight()
           │
           └─→ mapManager.destroy()
               └─→ map.remove()

window.addEventListener('beforeunload', cleanup)
```

---

## 14. Extension Points

### 14.1 Add New Feature Plugin
Create `src/plugins/features/myFeature.js`:

```js
class MyFeature {
  initialize(ctx) { /* ... */ }
  myMethod() { /* ... */ }
  cleanup() { /* ... */ }
}
export default new MyFeature()
```

### 14.2 Add New Interaction Plugin
Create `src/plugins/interactions/myInteraction.js`:

```js
export function setupMyInteraction(ctx) {
  document.addEventListener('...', () => {
    // translate input → feature intent
  })
}
```

### 14.3 Add New Config
Update `src/config/defaults.js`:

```js
export const MY_CONFIG = {
  // ...
}
```

### 14.4 Add New UI Component Plugin
Create `src/plugins/ui/myComponent.js`:

```js
export function createMyComponent(ctx) { /* ... */ }
```

---

## 15. Testing Strategy

With modular structure, testing becomes straightforward:

```js
// Test terrain plugin in isolation
describe('TerrainPlugin', () => {
  let originalMapManager
  
  beforeEach(() => {
    // Mock MapManager
    originalMapManager = mapManager
    mapManager = {
      setTerrain: jest.fn(),
      setLayoutProperty: jest.fn()
    }
  })
  
  afterEach(() => {
    mapManager = originalMapManager
  })
  
  it('should set exaggeration', () => {
    terrainPlugin.setExaggeration(2.0)
    expect(mapManager.setTerrain).toHaveBeenCalledWith({
      source: 'dem',
      exaggeration: 2.0
    })
  })
})
```

---

## 16. Performance Considerations

1. **Lazy Loading:** Plugins can be dynamically imported
   ```js
   if (userWantsWeatherLayer) {
     const weatherPlugin = await import('./plugins/features/weather.js')
   }
   ```

2. **Tree Shaking:** Unused plugins removed in build
   ```bash
   npm run build  # Vite removes unused modules
   ```

3. **Code Splitting:** Break into chunks
   ```js
   // vite.config.js
   export default {
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             terrain: ['src/plugins/features/terrain.js'],
             camera: ['src/plugins/features/camera.js']
           }
         }
       }
     }
   }
   ```

4. **State Subscriptions:** Only notify changed listeners
   ```js
   if (oldValue === newValue) return  // Skip notification
   ```

---

## 17. Migration Path

```
Phase 1: Modularization (✓ DONE)
  - Split into modules
  - Core managers
  - Feature isolation

Phase 2: Type Safety (TODO)
  - Migrate to TypeScript
  - Add JSDoc types
  - Better IDE support

Phase 3: Testing (TODO)
  - Unit tests for each module
  - Integration tests
  - E2E tests

Phase 4: Plugin System (TODO → NOW FORMALIZED HERE)
  - Plugin manager
  - Plugin interface
  - Example plugins

Phase 5: Advanced Features (TODO)
  - Performance monitoring
  - Analytics tracking
  - Error reporting
  - State persistence
```

---

## 18. Plugin Runtime Enable/Disable

You explicitly want: **users can enable/disable plugins**.

### Canonical PluginManager
```js
class PluginManager {
  constructor(ctx) {
    this.ctx = ctx
    this.registry = new Map()  // name → plugin factory OR plugin object
    this.active = new Map()    // name → active plugin instance
  }
  
  register(name, plugin) {
    this.registry.set(name, plugin)
  }
  
  enable(name, configOverride = {}) {
    if (this.active.has(name)) return this.active.get(name)

    const plugin = this.registry.get(name)
    if (!plugin) throw new Error(`Plugin not registered: ${name}`)

    // Allow either object plugins or factory plugins
    const instance = (typeof plugin === 'function') ? plugin() : plugin

    // Merge config override shallowly (your config system can do deeper merges later)
    const ctx = {
      ...this.ctx,
      config: {
        ...this.ctx.config,
        ...configOverride
      }
    }

    instance.initialize?.(ctx)
    this.active.set(name, instance)
    return instance
  }
  
  disable(name) {
    const instance = this.active.get(name)
    if (!instance) return
    instance.cleanup?.()
    this.active.delete(name)
  }
  
  isEnabled(name) {
    return this.active.has(name)
  }
  
  disableAll() {
    for (const name of [...this.active.keys()]) this.disable(name)
  }
}
```

### User toggles (UI)
- Any UI layer (Path A or Path B) can drive enable/disable by calling:
  - `pluginManager.enable('terrain')`
  - `pluginManager.disable('terrain')`

### Rule
- Plugins must be **idempotent**: calling enable twice must not double-register listeners, intervals, or layers.

---

## 19. UI Architecture — Path A + Path B

You want **both**:

### Path A (Vanilla UI, zero framework)
- Ships today
- Lightweight DOM + CSS
- Great for performance and minimal dependencies

### Path B (React UI, shadcn/ui)
- Opt-in UI layer
- React + Tailwind + shadcn/ui (Radix primitives)
- `lucide-react` icons
- Strong component primitives (dialog, sheet, dropdown, tabs)

### UI Mode: Headless vs Full
You explicitly want headless map mode:
- **Headless**: map + minimal pan/zoom controls + map selection
- **Full**: full controls panels, info panels, landmarks, etc.

Canonical state key:
```js
stateManager.set('uiMode', 'headless') // or 'full'
```

### Minimal “Headless” Requirements
- Map canvas
- MapLibre zoom + compass controls
- Basemap selector (compact button that opens a mobile-safe sheet/modal)

---

## 20. Mobile-First Doctrine (Non-Negotiable)

This is absolute.

### Hard requirements
- Touch targets ≥ **44px**
- No hover-only interactions
- Sheets/modals must be mobile-safe (bottom sheet preferred)
- Controls placed in thumb zones (lower corners)
- UI must adapt to any device size/orientation
- Avoid blocking pinch/rotate gestures (map gestures win)

### Layout rules
- Use `clamp()` for font sizing
- Use responsive spacing tokens
- Avoid fixed widths on panels; use max-width with breakpoints

---

## 21. Icons + Animated Icons Standard

### Icon set (canonical)
- **Lucide** icons (SVG based)
- Path A: inline SVG / sprite
- Path B: `lucide-react`

### Animated icons
- Use animated variants **where available**
- Otherwise, animate with:
  - CSS transitions
  - SVG transforms
  - minimal keyframes
- Avoid heavy animation libs unless the UI layer requires it

---

## 22. Troubleshooting

### Issue: Module not found
- Ensure import paths use `./` prefix
- Ensure file extensions are included (`.js`)
- Confirm all legacy `features/` references are gone (see Appendix A)

### Issue: State not updating
- Check you're calling `stateManager.set()` after changes
- Verify listeners are subscribed

### Issue: Plugins not initialized
- Ensure `initialize()` is called via pluginManager or in `main.js`
- Check order of initialization (dependencies first)

---

## 23. Summary

The architecture is:

- ✅ **Plugin-centric**: capabilities are composable modules
- ✅ **Core runtime substrate**: mapManager + stateManager
- ✅ **Enable/disable capable**: user toggles are first-class
- ✅ **Replaceable UI**: vanilla now, React/shadcn later
- ✅ **Mobile-first**: mandatory design constraints
- ✅ **Performance ready**: lazy loading + code splitting + tree-shaking

---

