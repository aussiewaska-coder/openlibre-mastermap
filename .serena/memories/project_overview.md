# MASTERMAP Project Overview

## Purpose
Minimalist MapLibre GL JS geospatial platform for Australia with plugin-based architecture, real-time traffic alerts, and 3D terrain.

## Tech Stack
- **Map Engine**: MapLibre GL JS 5.0
- **Build**: Vite
- **Deployment**: Vercel (only)
- **Database**: Neon (Postgres)
- **Package Manager**: npm
- **Language**: JavaScript (ES modules)

## Code Style & Conventions
- **ES modules**: `import/export default`
- **Plugin pattern**: Each feature is a module with `initialize()`, `enable()`, `disable()`, `cleanup()` methods
- **State management**: Singleton `stateManager` for global app state
- **Map access**: Singleton `mapManager` provides single MapLibre instance via `getMap()`
- **No over-engineering**: Use MapLibre official APIs first; only build custom code when needed
- **Icons**: Unicode emoji + Lucide-based (emoji in features)
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants (IDs, configs)

## Project Structure
```
src/
├── main.js                    # Entry point, plugin initialization
├── core/
│   ├── mapManager.js          # MapLibre singleton
│   └── stateManager.js        # Global state management
├── config/
│   ├── defaults.js            # Default plugin configs
│   └── tiles.js               # Tile source definitions
├── plugins/
│   ├── features/
│   │   ├── terrain.js         # 3D DEM terrain
│   │   ├── imagery.js         # Satellite imagery toggle
│   │   ├── controls.js        # MapLibre official controls
│   │   ├── animations.js      # Camera animations (orbit, flyto, pitch)
│   │   └── traffic.js         # Traffic Intel map layer + clustering
│   └── ui/
│       ├── traffic-panel.js   # Traffic Intel UI (bottom sheet)
│       ├── traffic-panel.css  # Mobile-optimized styling
│       └── animations-panel.js # Animations UI
└── style.css                  # Global styles
```

## Key Commands
- `npm run dev` - Start Vite dev server (http://localhost:5173)
- `npm run build` - Production build (output: dist/)
- `npm run preview` - Preview production build

## Important Patterns

### Plugin Structure
```javascript
export default {
  initialize() { /* setup */ },
  enable() { /* show */ },
  disable() { /* hide */ },
  update(config) { /* reconfigure */ },
  cleanup() { /* teardown */ }
}
```

### Plugin Initialization (main.js)
1. Initialize mapManager
2. Wait for map load
3. Initialize feature plugins
4. Initialize UI panels
5. Set projection & animations
6. Expose plugins to window for global access

### Clustering & Layers
- Use MapLibre clustering: `cluster: true, clusterMaxZoom: 15, clusterRadius: 50`
- Group by property using `filter` expressions
- Unclustered layer for individual points with icons
- Cluster layer for grouped count badges

### Animations
- `orbitAtBearing(duration, degreesPerSecond, centerPoint, pitch)` - Orbit around fixed point
- `animateTo(options, useFlying)` - Generic flyTo or easeTo
- `stop()` - Stop animation immediately
- Interruption listeners on mousedown, touchstart, wheel, keydown

### Responsive Design
- 44px+ touch targets (mobile-first)
- Bottom sheets instead of side panels
- `clamp()` for responsive typography
- Touch gesture handlers built-in to MapLibre

## Current Features
✅ Terrain, Imagery, Controls, Animations, Traffic Intel
🔴 Police Reports (not yet implemented)

## Deployment
- Vercel only
- Environment variables: OPENWEBNINJA_API_KEY, DATABASE_URL (future)
- Vercel Functions proxy APIs and database operations
