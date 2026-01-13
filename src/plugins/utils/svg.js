/**
 * SVG Utility Module
 * Helper functions for creating and managing SVG elements
 */

import { CROSSHAIR_CONFIG } from '../config/defaults.js'

/**
 * Create animated crosshair SVG element
 */
export function createCrosshairSVG() {
  // Create animation styles
  const style = document.createElement('style')
  style.textContent = `
    @keyframes rotateRing {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulseDot {
      0%, 100% { r: ${CROSSHAIR_CONFIG.dotRadius}; }
      50% { r: ${CROSSHAIR_CONFIG.dotRadius + 2}; }
    }
    .target-crosshair {
      animation: rotateRing ${CROSSHAIR_CONFIG.rotationDuration}ms linear infinite;
      transform-origin: center;
    }
    .target-dot {
      animation: pulseDot ${CROSSHAIR_CONFIG.pulseDuration}ms ease-in-out infinite;
    }
  `
  document.head.appendChild(style)

  // Create SVG container
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', CROSSHAIR_CONFIG.size)
  svg.setAttribute('height', CROSSHAIR_CONFIG.size)
  svg.setAttribute('viewBox', `0 0 ${CROSSHAIR_CONFIG.size} ${CROSSHAIR_CONFIG.size}`)
  svg.style.position = 'absolute'
  svg.style.pointerEvents = 'none'
  svg.style.filter = `drop-shadow(0 0 ${CROSSHAIR_CONFIG.shadowBlur}px ${CROSSHAIR_CONFIG.shadowColor})`
  svg.style.transition = 'opacity 2s ease-out'
  svg.style.opacity = '1'

  const center = CROSSHAIR_CONFIG.size / 2

  // Outer rotating ring
  const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  outerRing.setAttribute('cx', center)
  outerRing.setAttribute('cy', center)
  outerRing.setAttribute('r', CROSSHAIR_CONFIG.outterRingRadius)
  outerRing.setAttribute('fill', 'none')
  outerRing.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  outerRing.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth)
  outerRing.setAttribute('opacity', '0.7')
  outerRing.classList.add('target-crosshair')

  // Middle ring
  const midRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  midRing.setAttribute('cx', center)
  midRing.setAttribute('cy', center)
  midRing.setAttribute('r', CROSSHAIR_CONFIG.middleRingRadius)
  midRing.setAttribute('fill', 'none')
  midRing.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  midRing.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth - 0.5)
  midRing.setAttribute('opacity', '0.8')

  // Horizontal crosshair lines
  const hline1 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  hline1.setAttribute('x1', center - CROSSHAIR_CONFIG.lineLength)
  hline1.setAttribute('y1', center)
  hline1.setAttribute('x2', center - CROSSHAIR_CONFIG.lineLength / 2)
  hline1.setAttribute('y2', center)
  hline1.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  hline1.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth)

  const hline2 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  hline2.setAttribute('x1', center + CROSSHAIR_CONFIG.lineLength / 2)
  hline2.setAttribute('y1', center)
  hline2.setAttribute('x2', center + CROSSHAIR_CONFIG.lineLength)
  hline2.setAttribute('y2', center)
  hline2.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  hline2.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth)

  // Vertical crosshair lines
  const vline1 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  vline1.setAttribute('x1', center)
  vline1.setAttribute('y1', center - CROSSHAIR_CONFIG.lineLength)
  vline1.setAttribute('x2', center)
  vline1.setAttribute('y2', center - CROSSHAIR_CONFIG.lineLength / 2)
  vline1.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  vline1.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth)

  const vline2 = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  vline2.setAttribute('x1', center)
  vline2.setAttribute('y1', center + CROSSHAIR_CONFIG.lineLength / 2)
  vline2.setAttribute('x2', center)
  vline2.setAttribute('y2', center + CROSSHAIR_CONFIG.lineLength)
  vline2.setAttribute('stroke', CROSSHAIR_CONFIG.color)
  vline2.setAttribute('stroke-width', CROSSHAIR_CONFIG.strokeWidth)

  // Center pulsing dot
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  dot.setAttribute('cx', center)
  dot.setAttribute('cy', center)
  dot.setAttribute('r', CROSSHAIR_CONFIG.dotRadius)
  dot.setAttribute('fill', CROSSHAIR_CONFIG.color)
  dot.classList.add('target-dot')

  // Append elements
  svg.appendChild(outerRing)
  svg.appendChild(midRing)
  svg.appendChild(hline1)
  svg.appendChild(hline2)
  svg.appendChild(vline1)
  svg.appendChild(vline2)
  svg.appendChild(dot)

  return svg
}
