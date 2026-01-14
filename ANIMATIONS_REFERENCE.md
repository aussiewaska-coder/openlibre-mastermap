# Animations Plugin Reference

The Animations plugin provides camera movement animations using MapLibre's official API (`easeTo()` and `flyTo()`).

## Quick Start (Browser Console)

All animation methods are available on `window.animationsPlugin`:

```js
// Orbit around current map center for 30 seconds
animationsPlugin.orbitCenter(30000, 0.05)

// Stop any running animation
animationsPlugin.stop()
```

## Methods

### `orbitCenter(durationMs, bearingIncrement)`

Continuously rotate around the current map center.

**Parameters:**
- `durationMs` (number) - Total animation duration in milliseconds (default: 30000)
- `bearingIncrement` (number) - Bearing rotation per frame in degrees (default: 0.05)

**Example:**
```js
// Orbit for 20 seconds with faster rotation
animationsPlugin.orbitCenter(20000, 0.1)
```

---

### `flyover(targetZoom, targetPitch, durationMs)`

Smooth flyover animation - zoom in to a location and return to original position.

**Parameters:**
- `targetZoom` (number) - Zoom level to fly to (default: 12)
- `targetPitch` (number) - Pitch angle 0-85° (default: 60)
- `durationMs` (number) - Total animation duration in milliseconds (default: 5000)

**Example:**
```js
// Zoom to level 14 with 70° pitch, 4 second animation
animationsPlugin.flyover(14, 70, 4000)
```

---

### `rotateTo(targetBearing, durationMs)`

Smoothly rotate the map to a target bearing.

**Parameters:**
- `targetBearing` (number) - Target bearing 0-360° (required)
- `durationMs` (number) - Animation duration in milliseconds (default: 3000)

**Example:**
```js
// Rotate to face north (0°) over 2 seconds
animationsPlugin.rotateTo(0, 2000)

// Rotate to face east (90°) over 3 seconds
animationsPlugin.rotateTo(90, 3000)
```

---

### `pitchTo(targetPitch, durationMs)`

Smoothly tilt the camera to a target pitch angle.

**Parameters:**
- `targetPitch` (number) - Target pitch 0-85° (required)
- `durationMs` (number) - Animation duration in milliseconds (default: 2000)

**Example:**
```js
// Tilt to 45° over 1.5 seconds
animationsPlugin.pitchTo(45, 1500)

// Tilt to flat (0°)
animationsPlugin.pitchTo(0, 2000)
```

---

### `animateTo(options, useFlying)`

Custom camera animation with full MapLibre options.

**Parameters:**
- `options` (object) - MapLibre `FlyToOptions` or `EaseToOptions`:
  - `center` - [lng, lat] coordinates
  - `zoom` - Zoom level
  - `bearing` - Rotation 0-360°
  - `pitch` - Tilt 0-85°
  - `duration` - Animation duration ms
  - `easing` - Custom easing function
- `useFlying` (boolean) - Use flyTo (curved path) vs easeTo (direct) (default: true)

**Example:**
```js
// Custom animation - fly to a location with all parameters
animationsPlugin.animateTo({
  center: [135, -25], // Australia center
  zoom: 5,
  bearing: 45,
  pitch: 30,
  duration: 4000,
  easing: (t) => t * (2 - t) // easeOutQuad
})

// Direct animation instead of curved flyTo
animationsPlugin.animateTo({
  center: [151.2, -33.8], // Sydney
  zoom: 12,
  pitch: 60,
  duration: 3000
}, false) // useFlying = false
```

---

### `stop()`

Stop any running animation immediately.

**Example:**
```js
animationsPlugin.stop()
```

---

### `isAnimating()`

Check if an animation is currently running.

**Returns:** `boolean`

**Example:**
```js
if (animationsPlugin.isAnimating()) {
  console.log('Animation in progress:', animationsPlugin.getCurrentAnimation())
} else {
  console.log('No animation running')
}
```

---

### `getCurrentAnimation()`

Get the type of currently running animation.

**Returns:** `string` - Animation type ('orbit', 'flyover', 'rotate', 'pitch', 'custom') or `null`

**Example:**
```js
console.log(animationsPlugin.getCurrentAnimation()) // 'orbit'
```

---

### `enable()` / `disable()`

Enable or disable the animations plugin. Disabling stops any running animation.

**Example:**
```js
animationsPlugin.disable() // Stops all animations
animationsPlugin.enable()  // Re-enables (doesn't auto-start animations)
```

---

## Real-World Examples

### Create an automated tour
```js
async function australiaTour() {
  // Orbit for 15 seconds
  animationsPlugin.orbitCenter(15000, 0.08)
  
  // Wait for orbit to finish
  await new Promise(r => setTimeout(r, 15000))
  
  // Flyover Sydney at high pitch
  animationsPlugin.flyover(14, 75, 5000)
  
  // Wait for flyover
  await new Promise(r => setTimeout(r, 5000))
  
  // Return to Australia view
  animationsPlugin.animateTo({
    center: [135, -25],
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
    duration: 3000
  })
}

// Start tour
australiaTour()
```

### Dynamic response to user action
```js
// When user clicks, show location details with flyover
map.on('click', (e) => {
  const { lng, lat } = e.lngLat
  
  // Stop current animation
  animationsPlugin.stop()
  
  // Fly to clicked location
  animationsPlugin.animateTo({
    center: [lng, lat],
    zoom: 12,
    pitch: 45,
    duration: 2000
  })
})
```

### Synchronized animations
```js
// Rotate and tilt simultaneously using animateTo
animationsPlugin.animateTo({
  bearing: 180,
  pitch: 60,
  duration: 2000
})
```

---

## Notes

- **No overlapping animations** - Starting a new animation stops the previous one (prevents animation conflicts)
- **Uses MapLibre official API** - All animations use `easeTo()` and `flyTo()` from MapLibre GL
- **Mobile-friendly** - Works with touch gestures and mobile viewport
- **Easing included** - Default easing is `easeOutQuad` for smooth, natural motion
- **Pauseable** - Call `stop()` anytime to halt an animation

---

## API Reference Links

- [MapLibre FlyTo Options](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)
- [MapLibre EaseTo Options](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/EaseToOptions/)
- [MapLibre Camera Animation Example](https://maplibre.org/maplibre-gl-js/docs/examples/animate-map-camera-around-a-point/)
