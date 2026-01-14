/**
 * Police Reports UI Panel
 * Bottom sheet for viewing, filtering, and selecting police reports
 */

import stateManager from '../../core/stateManager.js'
import mapManager from '../../core/mapManager.js'

export default {
  panelEl: null,
  isOpen: false,
  allReports: [],
  filteredReports: [],
  selectedReport: null,

  initialize() {
    this.createPanel()
    this.createFloatingButton()
    this.attachEventListeners()

    // Listen for police report selection from map
    document.addEventListener('policeReportSelected', (e) => {
      this.showReportDetail(e.detail)
      this.openPanel()
    })

    stateManager.subscribe('policeEnabled', (enabled) => {
      if (enabled) {
        this.showPanel()
      } else {
        this.hidePanel()
      }
    })

    console.log('✓ Police Reports UI panel initialized')
  },

  createFloatingButton() {
    const button = document.createElement('button')
    button.id = 'police-intel-toggle'
    button.className = 'police-intel-toggle'
    button.title = 'Police Reports Dashboard'
    button.innerHTML = '🚓'
    button.addEventListener('click', () => {
      this.togglePanel()
    })
    document.body.appendChild(button)
  },

  createPanel() {
    const panel = document.createElement('div')
    panel.id = 'police-intel-panel'
    panel.className = 'police-panel'
    panel.innerHTML = `
      <div class="police-panel-content">
        <!-- Header -->
        <div class="police-panel-header">
          <div class="police-panel-title-section">
            <h2 class="police-panel-title">Police Reports <span class="source-badge">(Local)</span></h2>
            <p class="police-panel-subtitle">Source: Local Database</p>
          </div>
          <button class="police-panel-close" aria-label="Close panel">✕</button>
        </div>

        <!-- Status Bar -->
        <div class="police-panel-status">
          <div class="status-item">
            <span class="status-label">Total:</span>
            <span class="status-value" id="total-count">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">In View:</span>
            <span class="status-value" id="in-view-count">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">Filtered:</span>
            <span class="status-value" id="filtered-count">0</span>
          </div>
        </div>

        <!-- Load CTA -->
        <div class="police-panel-cta">
          <button id="load-reports-btn" class="btn btn-primary btn-full">
            <span class="btn-icon">📍</span>
            <span class="btn-text">Load Reports</span>
          </button>
          <button id="cancel-load-btn" class="btn btn-secondary btn-full" style="display: none;">
            Cancel
          </button>
          <div id="load-progress" class="load-progress" style="display: none;">
            <div class="progress-spinner"></div>
            <span>Loading...</span>
          </div>
        </div>

        <!-- Filters Strip -->
        <div class="police-filters">
          <div class="filter-group">
            <label class="filter-label">Type:</label>
            <div class="filter-chips">
              <button class="filter-chip" data-filter="type" data-value="POLICE">
                🚔 Police
              </button>
              <button class="filter-chip" data-filter="type" data-value="ACCIDENT">
                🚗 Accident
              </button>
              <button class="filter-chip" data-filter="type" data-value="HAZARD">
                ⚠️ Hazard
              </button>
              <button class="filter-chip" data-filter="type" data-value="ROAD_CLOSED">
                🚫 Road Closed
              </button>
              <button class="filter-chip" data-filter="type" data-value="JAM">
                🚦 Jam
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label\">\n              <input type=\"checkbox\" id=\"sort-recency\" checked />\n              Sort by Recency\n            </label>\n          </div>\n        </div>\n\n        <!-- Results List -->\n        <div class=\"police-results\" id=\"police-results\">\n          <div class=\"empty-state\">\n            <p>👀 No police reports loaded</p>\n            <p class=\"empty-hint\">Tap \"Load Reports\" to fetch data</p>\n          </div>\n        </div>\n\n        <!-- Detail View -->\n        <div class=\"police-detail\" id=\"police-detail\" style=\"display: none;\">\n          <button class=\"police-detail-back\" id=\"detail-back\">← Back</button>\n          <div class=\"detail-content\" id=\"detail-content\"></div>\n        </div>\n      </div>\n    `
    document.body.appendChild(panel)
    this.panelEl = panel
  },

  attachEventListeners() {
    // Close button
    this.panelEl.querySelector('.police-panel-close').addEventListener('click', () => {
      this.togglePanel()
    })

    // Load button
    document.getElementById('load-reports-btn').addEventListener('click', () => {
      this.loadReports()
    })

    // Cancel button
    document.getElementById('cancel-load-btn').addEventListener('click', () => {
      this.cancelLoad()
    })

    // Filter chips
    this.panelEl.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        chip.classList.toggle('active')
        this.applyFilters()
      })
    })

    // Sort toggle
    document.getElementById('sort-recency').addEventListener('change', () => {
      this.applyFilters()
    })

    // Back button in detail view
    document.getElementById('detail-back').addEventListener('click', () => {
      this.showResultsList()
    })
  },

  togglePanel() {
    if (this.isOpen) {
      this.closePanel()
    } else {
      this.openPanel()
    }
  },

  openPanel() {
    this.panelEl.classList.add('open')
    this.isOpen = true
  },

  closePanel() {
    this.panelEl.classList.remove('open')
    this.isOpen = false
  },

  showPanel() {
    this.panelEl.style.display = 'flex'
  },

  hidePanel() {
    this.panelEl.style.display = 'none'
  },

  async loadReports() {
    const map = mapManager.getMap()
    const bounds = map.getBounds()

    const bbox = {
      w: bounds.getWest(),
      s: bounds.getSouth(),
      e: bounds.getEast(),
      n: bounds.getNorth(),
    }

    this.updateLoadUI(true)

    try {
      const response = await fetch('/api/police-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox, limit: 500 }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Store all reports
      this.allReports = data.geojson.features || []

      // Update state
      stateManager.set('policeDataCount', this.allReports.length)

      // Update map layer
      const policePlugin = window.policePlugin
      if (policePlugin && policePlugin.updateReportData) {
        await policePlugin.updateReportData(data.geojson)
      }

      // Update UI
      this.applyFilters()
      this.renderResultsList()
      this.openPanel()

      console.log(`✓ Police reports loaded: ${this.allReports.length} items`)
    } catch (error) {
      console.error('Load failed:', error)
      this.showError('Failed to load reports. Please try again.')
    } finally {
      this.updateLoadUI(false)
    }
  },

  cancelLoad() {
    this.updateLoadUI(false)
  },

  updateLoadUI(loading) {
    const loadBtn = document.getElementById('load-reports-btn')
    const cancelBtn = document.getElementById('cancel-load-btn')
    const progress = document.getElementById('load-progress')

    if (loading) {
      loadBtn.style.display = 'none'
      cancelBtn.style.display = 'flex'
      progress.style.display = 'flex'
      loadBtn.disabled = true
    } else {
      loadBtn.style.display = 'flex'
      cancelBtn.style.display = 'none'
      progress.style.display = 'none'
      loadBtn.disabled = false
    }
  },

  applyFilters() {
    const activeTypes = Array.from(
      this.panelEl.querySelectorAll('.filter-chip[data-filter="type"].active')
    ).map((chip) => chip.dataset.value)

    const sortByRecency = document.getElementById('sort-recency').checked

    // Filter reports
    this.filteredReports = this.allReports.filter((report) => {
      if (activeTypes.length > 0 && !activeTypes.includes(report.properties.type)) {
        return false
      }
      return true
    })

    // Sort if enabled
    if (sortByRecency) {
      this.filteredReports.sort((a, b) => {
        const timeA = new Date(a.properties.publishedAt || 0).getTime()
        const timeB = new Date(b.properties.publishedAt || 0).getTime()
        return timeB - timeA
      })
    }

    // Update counts
    document.getElementById('total-count').textContent = this.allReports.length.toString()
    document.getElementById('in-view-count').textContent = this.allReports.length.toString()
    document.getElementById('filtered-count').textContent = this.filteredReports.length.toString()

    this.renderResultsList()
  },

  renderResultsList() {
    const resultsEl = document.getElementById('police-results')

    if (this.filteredReports.length === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <p>🔍 No results</p>
          <p class="empty-hint">Adjust filters or load a different area</p>
        </div>
      `
      return
    }

    // Group by type then subtype
    const grouped = {}
    this.filteredReports.forEach((report) => {
      const type = report.properties.type
      const subtype = report.properties.subtype || '(Unknown)'

      if (!grouped[type]) {
        grouped[type] = {}
      }
      if (!grouped[subtype]) {
        grouped[type][subtype] = []
      }
      grouped[type][subtype].push(report)
    })

    // Render categorized list
    let html = ''
    for (const [type, subtypes] of Object.entries(grouped)) {
      html += `<div class="police-category"><h3 class="category-title">${this.getTypeEmoji(type)} ${type}</h3>`

      for (const [subtype, reports] of Object.entries(subtypes)) {
        reports.forEach((report) => {
          const props = report.properties
          const icon = this.getSubtypeEmoji(props.subtype || props.type)
          const ageText = props.publishedAt ? this.getTimeAgo(new Date(props.publishedAt)) : 'Unknown'

          html += `
            <div class="police-card" data-alert-id="${props.alert_id}">
              <div class="card-icon">${icon}</div>
              <div class="card-content">
                <h4 class="card-subtype">${subtype || 'General'}</h4>
                <p class="card-location">${props.street || props.city || 'Unknown location'}</p>
                <div class="card-meta">
                  <span class="badge badge-age">${ageText}</span>
                  ${props.reliability ? `<span class="badge badge-reliability">Rel: ${props.reliability}%</span>` : ''}
                </div>
              </div>
            </div>
          `
        })
      }

      html += '</div>'
    }

    resultsEl.innerHTML = html

    // Attach click handlers
    resultsEl.querySelectorAll('.police-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const alertId = card.dataset.alertId
        const report = this.filteredReports.find((f) => f.properties.alert_id === alertId)
        if (report) {
          this.showReportDetail({ feature: report, properties: report.properties })
        }
      })
    })
  },

  showReportDetail(reportData) {
    const { feature, properties } = reportData
    const detailEl = document.getElementById('police-detail')
    const contentEl = document.getElementById('detail-content')

    const icon = this.getSubtypeEmoji(properties.subtype || properties.type)
    const publishDate = properties.publishedAt ? new Date(properties.publishedAt) : new Date()
    const formattedDate = this.formatPublishDate(publishDate)
    const timeAgo = this.getTimeAgo(publishDate)

    contentEl.innerHTML = `
      <div class="detail-header">
        <span class="detail-icon">${icon}</span>
        <div class="detail-header-text">
          <p class="detail-report-id">Report ID: ${properties.alert_id || 'N/A'}</p>
          <h2 class="detail-type">${properties.type}</h2>
        </div>
      </div>

      ${
        properties.subtype
          ? `
      <div class="detail-section">
        <h3 class="detail-section-title">Category</h3>
        <p class="detail-subtype">${properties.subtype}</p>
      </div>
      `
          : ''
      }

      <div class="detail-section">
        <h3 class="detail-section-title">Location</h3>
        ${properties.street ? `<p class="detail-street">${properties.street}</p>` : ''}
        ${properties.city ? `<p class="detail-city">${properties.city}</p>` : ''}
        ${!properties.street && !properties.city ? '<p class="detail-address">Unknown location</p>' : ''}
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">Details</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item-label">Report ID:</span>
            <span class="detail-item-value">${properties.alert_id || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Reliability:</span>
            <span class="detail-item-value">${properties.reliability || 'N/A'}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Reported:</span>
            <span class="detail-item-value">${timeAgo}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">Timestamp</h3>
        <p class="detail-timestamp-formatted">${formattedDate}</p>
        <p class="detail-timestamp-utc">${publishDate.toISOString()}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">Source</h3>
        <p class="detail-source">Local Police Reports Database</p>
      </div>
    `

    // Hide results, show detail
    document.getElementById('police-results').style.display = 'none'
    detailEl.style.display = 'block'
  },

  formatPublishDate(date) {
    const options = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    }
    const formatted = date.toLocaleString('en-AU', options)
    // Convert "02" to "2nd", "03" to "3rd", etc.
    return formatted.replace(/\b(\d{1,2})\b/, (match) => {
      const num = parseInt(match)
      if (num === 1 || num === 21 || num === 31) return num + 'st'
      if (num === 2 || num === 22) return num + 'nd'
      if (num === 3 || num === 23) return num + 'rd'
      return num + 'th'
    })
  },

  showResultsList() {
    document.getElementById('police-results').style.display = 'block'
    document.getElementById('police-detail').style.display = 'none'
  },

  getTypeEmoji(type) {
    const emojis = {
      POLICE: '🚔',
      ACCIDENT: '🚗',
      HAZARD: '⚠️',
      ROAD_CLOSED: '🚫',
      JAM: '🚦',
      CAMERA: '📸',
    }
    return emojis[type] || '📍'
  },

  getSubtypeEmoji(subtype) {
    const emojis = {
      POLICE_WITH_MOBILE_CAMERA: '📷',
      POLICE_HIDING: '🕵️',
      POLICE_VISIBLE: '🚔',
      POLICE_ROADBLOCK: '🚧',
      ACCIDENT_MAJOR: '💥',
      ACCIDENT_MINOR: '🚗',
      HAZARD_ON_ROAD_POT_HOLE: '🕳️',
      HAZARD_ON_ROAD_CONSTRUCTION: '🏗️',
      HAZARD_ON_ROAD_OBJECT: '⚠️',
      HAZARD_ON_ROAD_LANE_CLOSED: '🚫',
      HAZARD_ON_SHOULDER_CAR_STOPPED: '🚗',
      HAZARD_WEATHER_FLOOD: '🌊',
      HAZARD_WEATHER_FOG: '🌫️',
      HAZARD_WEATHER: '⛈️',
      JAM_STAND_STILL_TRAFFIC: '🚦',
      JAM_HEAVY_TRAFFIC: '🚦',
      ROAD_CLOSED_EVENT: '🚫',
      CAMERA_SPEED: '📸',
    }
    return emojis[subtype] || this.getTypeEmoji(subtype)
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
    const resultsEl = document.getElementById('police-results')
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
