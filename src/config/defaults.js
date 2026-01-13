/**
 * Default configuration values for MASTERMAP
 * Centralized constants to make tuning behavior easier
 */

export const MAP_CONFIG = {
  // Initial map state
  initialPitch: 45,
  initialBearing: 0,
  maxPitch: 85,
  
  // Terrain
  terrainSource: 'dem',
  defaultExaggeration: 1.0,
  minExaggeration: 0.5,
  maxExaggeration: 3.0,
  exaggerationStep: 0.1,
  
  // Hillshade styling
  hillshadeId: 'hillshade',
  hillshadeShadowColor: '#473B24',
  hillshadeHighlightColor: '#F7F1D7',
  hillshadeExaggeration: 0.6,
  
  // Background
  backgroundColor: '#e0e5ff'
}

export const CAMERA_CONFIG = {
  // Orbit mode
  orbitBearingIncrement: 0.1,
  orbitIntervalMs: 30,
  
  // Flight mode
  flightSpeed: 0.001,           // Degrees per frame
  flightTransitionDuration: 4000,
  flightDeceleration: 2000,
  flightEasing: (t) => t * (2 - t), // easeOutQuad
  flightTargetZoom: 14.5,
  flightTargetPitch: 75,
  
  // Targeting
  targetingDuration: 6000,
  targetingZoom: 12,
  targetingPitch: 60,
  targetingBearing: 540,
  targetingFadeDuration: 2000,
  targetingFadeStart: 3500,
  targetingOrbitStart: 5500
}

export const UI_CONFIG = {
  // Control panel
  controlsOpacity: 0.95,
  controlsPaddingPx: 20,
  controlsMaxWidthPx: 280,
  
  // Buttons
  buttonPaddingPx: 10,
  buttonBorderRadiusPx: 4,
  buttonHoverColor: '#1d4ed8',
  buttonActiveColor: '#1e40af',
  buttonDefaultColor: '#2563eb',
  
  // Text
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize14: '14px',
  fontSize13: '13px',
  fontSize12: '12px'
}

export const ANIMATION_CONFIG = {
  // Loading fade
  fadeOutDuration: 3000,
  fadeOutDelay: 0,
  
  // Transitions
  defaultTransitionDuration: 1000
}

export const CROSSHAIR_CONFIG = {
  size: 80,
  outterRingRadius: 35,
  middleRingRadius: 20,
  lineLength: 20,
  dotRadius: 4,
  color: '#ffdd00',
  shadowBlur: 5,
  shadowColor: 'rgba(255,221,0,0.5)',
  rotationDuration: 4000,
  pulseDuration: 800,
  strokeWidth: 2
}

export const AUSTRALIA_VIEW = {
  center: [135, -25],
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
  duration: 3000
}
