import stateManager from '../../core/stateManager.js'
import mapManager from '../../core/mapManager.js'

/**
 * Traffic Intel UI Panel
 * Bottom sheet for scanning, filtering, and viewing traffic data
 */

export default {
  panelEl: null,
  isScanning: false,
  isOpen: false,
  currentScan: null,
  filteredEvents: [],
  selectedEvent: null,

  initialize() {
    this.createPanel()
    this.createFloatingButton()
    this.attachEventListeners()
    stateManager.subscribe('trafficEnabled', (enabled) => {
      if (enabled) {
        this.show()
      } else {
        this.hide()
      }
    })
    console.log('✓ Traffic Intel UI panel initialized')
  },

  createFloatingButton() {
    const button = document.createElement('button')
    button.id = 'traffic-intel-toggle'
    button.className = 'traffic-intel-toggle'
    button.title = 'Traffic Intel Dashboard'
    button.innerHTML = '🚗'
    button.addEventListener('click', () => {
      this.toggle()
    })
    document.body.appendChild(button)
  },

  createPanel() {
    const panel = document.createElement('div')
    panel.id = 'traffic-intel-panel'
    panel.className = 'traffic-panel'
    panel.innerHTML = `
      <div class="traffic-panel-content">
        <!-- Header -->
        <div class="traffic-panel-header">
          <div class="traffic-panel-title-section">
            <h2 class="traffic-panel-title">Traffic Intel <span class="source-badge">(Community)</span></h2>
            <p class="traffic-panel-subtitle">Source: OpenWebNinja (Waze)</p>
          </div>
          <button class="traffic-panel-close" aria-label="Close panel">✕</button>
        </div>

        <!-- Status Bar -->
        <div class="traffic-panel-status">
          <div class="status-item">
            <span class="status-label">Last Scan:</span>
            <span class="status-value" id="last-scan-time">Never</span>
          </div>
          <div class="status-item">
            <span class="status-label">In View:</span>
            <span class="status-value" id="in-view-count">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">Total:</span>
            <span class="status-value" id="total-count">0</span>
          </div>
        </div>

        <!-- Scan CTA -->
        <div class="traffic-panel-cta">
          <button id="scan-view-btn" class="btn btn-primary btn-full">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">Scan View</span>
          </button>
          <button id="cancel-scan-btn" class="btn btn-secondary btn-full" style="display: none;">
            Cancel
          </button>
          <div id="scan-progress" class="scan-progress" style="display: none;">
            <div class="progress-spinner"></div>
            <span>Scanning...</span>
          </div>
        </div>

        <!-- Filters Strip -->
        <div class="traffic-filters">
          <div class="filter-group">
            <label class="filter-label">Type:</label>
            <div class="filter-chips">
              <button class="filter-chip" data-filter="type" data-value="ACCIDENT">
                🚗 Accident
              </button>
              <button class="filter-chip" data-filter="type" data-value="HAZARD">
                ⚠️ Hazard
              </button>
              <button class="filter-chip" data-filter="type" data-value="POLICE">
                🚔 Police
              </button>
              <button class="filter-chip" data-filter="type" data-value="CLOSURE">
                🚫 Closure
              </button>
              <button class="filter-chip" data-filter="type" data-value="JAM">
                🚦 Jam
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Recency:</label>
            <div class="filter-chips">
              <button class="filter-chip" data-filter="recency" data-value="15">15m</button>
              <button class="filter-chip" data-filter="recency" data-value="60">1h</button>
              <button class="filter-chip" data-filter="recency" data-value="360">6h</button>
              <button class="filter-chip" data-filter="recency" data-value="1440">24h</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <input type="checkbox" id="view-toggle" checked />
              Only show items in view
            </label>
          </div>
        </div>

        <!-- Results List -->
        <div class="traffic-results" id="traffic-results">
          <div class="empty-state">
            <p>👀 No traffic events yet</p>
            <p class="empty-hint">Tap "Scan View" to search the current map area</p>
          </div>
        </div>

        <!-- Detail View -->
        <div class="traffic-detail" id="traffic-detail" style="display: none;">
          <button class="traffic-detail-back" id="detail-back">← Back</button>
          <div class="detail-content" id="detail-content"></div>
        </div>
      </div>
    `
    document.body.appendChild(panel)
    this.panelEl = panel
  },

  attachEventListeners() {
    // Close button
    this.panelEl.querySelector('.traffic-panel-close').addEventListener('click', () => {
      this.toggle()
    })

    // Scan button
    document.getElementById('scan-view-btn').addEventListener('click', () => {
      this.scanView()
    })

    // Cancel button
    document.getElementById('cancel-scan-btn').addEventListener('click', () => {
      this.cancelScan()
    })

    // Filter chips
    this.panelEl.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        chip.classList.toggle('active')
        this.applyFilters()
      })
    })

    // View toggle
    document.getElementById('view-toggle').addEventListener('change', () => {
      this.applyFilters()
    })

    // Back button in detail view
    document.getElementById('detail-back').addEventListener('click', () => {
      this.showResultsList()
    })

    // Listen for traffic item selection from map
    document.addEventListener('trafficItemSelected', (e) => {
      this.showItemDetail(e.detail)
    })
  },

  toggle() {
    if (this.isOpen) {
      this.hide()
    } else {
      this.show()
    }
  },

  show() {
    this.panelEl.classList.add('open')
    this.isOpen = true
  },

  hide() {
    this.panelEl.classList.remove('open')
    this.isOpen = false
  },

  async scanView() {
    const map = mapManager.getMap()
    const bounds = map.getBounds()
    const zoom = map.getZoom()

    // Australia bounding box (conservative)
    const AUSTRALIA_BOUNDS = {
      west: 112.5,
      east: 154.0,
      south: -44.0,
      north: -9.0,
    }

    // Clamp viewport to Australia bounds
    let bbox = {
      w: bounds.getWest(),
      s: bounds.getSouth(),
      e: bounds.getEast(),
      n: bounds.getNorth(),
    }

    // Clamp to Australia
    bbox.w = Math.max(bbox.w, AUSTRALIA_BOUNDS.west)
    bbox.e = Math.min(bbox.e, AUSTRALIA_BOUNDS.east)
    bbox.s = Math.max(bbox.s, AUSTRALIA_BOUNDS.south)
    bbox.n = Math.min(bbox.n, AUSTRALIA_BOUNDS.north)

    // Check if viewport is entirely outside Australia
    if (bbox.w >= bbox.e || bbox.s >= bbox.n) {
      this.showError('Scan area is outside Australia. Please pan to Australia first.')
      return
    }

    this.isScanning = true
    this.updateScanUI(true)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bbox,
          zoom,
          filters: this.getActiveFilters(),
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Update current scan
      this.currentScan = data.scan
      this.filteredEvents = data.geojson.features || []

      // Update state
      stateManager.set('trafficDataCount', this.filteredEvents.length)

      // Update traffic plugin with new data
      const trafficPlugin = window.trafficPlugin
      if (trafficPlugin && trafficPlugin.updateTrafficData) {
        await trafficPlugin.updateTrafficData(data.geojson)
      }

      // Update UI
      this.updateScanStatus()
      this.renderResultsList()
      this.show()

      console.log(`✓ Scan complete: ${this.filteredEvents.length} events found`)
    } catch (error) {
      console.error('Scan failed:', error)
      this.showError('Scan failed. Please try again.')
    } finally {
      this.isScanning = false
      this.updateScanUI(false)
    }
  },

  cancelScan() {
    this.isScanning = false
    this.updateScanUI(false)
  },

  updateScanUI(scanning) {
    const scanBtn = document.getElementById('scan-view-btn')
    const cancelBtn = document.getElementById('cancel-scan-btn')
    const progress = document.getElementById('scan-progress')

    if (scanning) {
      scanBtn.style.display = 'none'
      cancelBtn.style.display = 'flex'
      progress.style.display = 'flex'
      scanBtn.disabled = true
    } else {
      scanBtn.style.display = 'flex'
      cancelBtn.style.display = 'none'
      progress.style.display = 'none'
      scanBtn.disabled = false
    }
  },

  updateScanStatus() {
    if (!this.currentScan) return

    const now = new Date()
    const scannedAt = new Date(this.currentScan.scannedAt || now)
    const timeAgo = this.getTimeAgo(scannedAt)

    document.getElementById('last-scan-time').textContent = timeAgo
    document.getElementById('total-count').textContent = this.filteredEvents.length.toString()
    document.getElementById('in-view-count').textContent = this.filteredEvents.length.toString()
  },

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  },

  getActiveFilters() {
    const filters = { types: [], maxAgeMinutes: null, minConfidence: 0 }

    // Get type filters
    this.panelEl.querySelectorAll('.filter-chip[data-filter="type"].active').forEach((chip) => {
      filters.types.push(chip.dataset.value)
    })

    // Get recency filter
    const activeRecency = this.panelEl.querySelector('.filter-chip[data-filter="recency"].active')
    if (activeRecency) {
      filters.maxAgeMinutes = Number(activeRecency.dataset.value)
    }

    return filters
  },

  applyFilters() {
    const filters = this.getActiveFilters()
    stateManager.set('trafficFilters', filters)
    this.renderResultsList()
  },

  renderResultsList() {
    const resultsEl = document.getElementById('traffic-results')

    if (this.filteredEvents.length === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <p>🔍 No results</p>
          <p class="empty-hint">Adjust filters or scan a different area</p>
        </div>
      `
      return
    }

    // Sort by recency then confidence
    const sorted = [...this.filteredEvents].sort((a, b) => {
      const timeA = new Date(a.properties.publishedAt || 0).getTime()
      const timeB = new Date(b.properties.publishedAt || 0).getTime()
      if (timeA !== timeB) return timeB - timeA
      return (b.properties.confidence || 0) - (a.properties.confidence || 0)
    })

    resultsEl.innerHTML = sorted
      .map((event) => {
        const props = event.properties
        const icon = props.kind === 'jam' ? '🚦' : this.getIconForType(props.type)
        const ageText = props.publishedAt ? this.getTimeAgo(new Date(props.publishedAt)) : 'Unknown'

        return `
          <div class="traffic-card" data-event-id="${props.id}">
            <div class="card-icon">${icon}</div>
            <div class="card-content">
              <h3 class="card-type">${props.type || 'Alert'}</h3>
              <p class="card-location">${props.street || props.city || 'Unknown location'}</p>
              <div class="card-meta">
                <span class="badge badge-age">${ageText}</span>
                <span class="badge badge-confidence">Conf: ${Math.round(props.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        `
      })
      .join('')

    // Attach click handlers
    resultsEl.querySelectorAll('.traffic-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const eventId = card.dataset.eventId
        const event = this.filteredEvents.find((f) => f.properties.id === eventId)
        if (event) {
          this.showItemDetail({ feature: event, properties: event.properties })
        }
      })
    })
  },

  showItemDetail(eventData) {
    const { feature, properties } = eventData
    const detailEl = document.getElementById('traffic-detail')
    const contentEl = document.getElementById('detail-content')

    const icon = properties.kind === 'jam' ? '🚦' : this.getIconForType(properties.type)
    const ageText = properties.publishedAt ? this.getTimeAgo(new Date(properties.publishedAt)) : 'Unknown'
    const confidence = properties.confidence ? Math.round(properties.confidence * 100) : 'N/A'

    contentEl.innerHTML = `
      <div class="detail-header">
        <span class="detail-icon">${icon}</span>
        <h2 class="detail-type">${properties.type || 'Traffic Alert'}</h2>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">Location</h3>
        <p class="detail-street">${properties.street || 'Unknown'}</p>
        <p class="detail-city">${properties.city || ''}</p>
        <p class="detail-coords">
          ${parseFloat(properties.publishedAt).toFixed(4)}° N,
          ${parseFloat(properties.publishedAt).toFixed(4)}° E
        </p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">Details</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item-label">Reported:</span>
            <span class="detail-item-value">${ageText}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Confidence:</span>
            <span class="detail-item-value">${confidence}%</span>
          </div>
          ${properties.reliability ? `<div class="detail-item">
            <span class="detail-item-label">Reliability:</span>
            <span class="detail-item-value">${Math.round(properties.reliability * 100)}%</span>
          </div>` : ''}
        </div>
      </div>

      ${
        properties.description
          ? `
      <div class="detail-section">
        <h3 class="detail-section-title">Description</h3>
        <p class="detail-description">${this.escapeHtml(properties.description)}</p>
      </div>
      `
          : ''
      }

      <div class="detail-section">
        <h3 class="detail-section-title">Source</h3>
        <p class="detail-source">OpenWebNinja (Waze)</p>
        <p class="source-disclaimer">
          ⓘ Community-sourced data. Not official emergency information.
        </p>
      </div>

      ${
        properties.link
          ? `
      <div class="detail-section">
        <a href="${this.escapeHtml(properties.link)}" target="_blank" class="btn btn-secondary">
          View on Waze
        </a>
      </div>
      `
          : ''
      }
    `

    // Hide results, show detail
    document.getElementById('traffic-results').style.display = 'none'
    detailEl.style.display = 'block'
  },

  showResultsList() {
    document.getElementById('traffic-results').style.display = 'block'
    document.getElementById('traffic-detail').style.display = 'none'
  },

  getIconForType(type) {
    const icons = {
      ACCIDENT: '🚗',
      HAZARD: '⚠️',
      POLICE: '🚔',
      CLOSURE: '🚫',
      JAM: '🚦',
      ALERT: '⚡',
    }
    return icons[type] || '📍'
  },

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  },

  showError(message) {
    const resultsEl = document.getElementById('traffic-results')
    resultsEl.innerHTML = `
      <div class="empty-state error">
        <p>❌ ${message}</p>
      </div>
    `
  },

  cleanup() {
    if (this.panelEl) {
      this.panelEl.remove()
    }
  },
}
