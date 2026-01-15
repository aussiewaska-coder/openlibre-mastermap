/**
 * Consolidated Dashboard
 * Left sidebar with Traffic Intel + Police Reports (tabbed)
 * Single collapsible interface for all data scanning and filtering
 */

import stateManager from '../../core/stateManager.js'
import mapManager from '../../core/mapManager.js'

export default {
  panelEl: null,
  isOpen: true,
  activeTab: 'traffic', // 'traffic' or 'police'
  trafficData: [],
  policeData: [],

  initialize() {
    this.createSidebar()
    this.attachEventListeners()
    console.log('✓ Consolidated dashboard initialized')
  },

  createSidebar() {
    const sidebar = document.createElement('div')
    sidebar.id = 'consolidated-dashboard'
    sidebar.className = 'dashboard-sidebar open'
    sidebar.innerHTML = `
      <div class="dashboard-header">
        <div class="dashboard-title-section">
          <h2 class="dashboard-title">Data Dashboard</h2>
        </div>
        <button class="dashboard-collapse" aria-label="Toggle sidebar">☰</button>
      </div>

      <!-- Tab Navigation -->
      <div class="dashboard-tabs">
        <button class="tab-button active" data-tab="traffic">
          <span class="tab-icon">🚗</span>
          <span class="tab-label">Traffic</span>
        </button>
        <button class="tab-button" data-tab="police">
          <span class="tab-icon">🚓</span>
          <span class="tab-label">Police</span>
        </button>
      </div>

      <!-- Traffic Tab Content -->
      <div class="tab-content active" data-tab="traffic">
        <!-- Status Bar -->
        <div class="dashboard-status">
          <div class="status-item">
            <span class="status-label">Last Scan:</span>
            <span class="status-value" id="traffic-last-scan">Never</span>
          </div>
          <div class="status-item">
            <span class="status-label">Total:</span>
            <span class="status-value" id="traffic-total">0</span>
          </div>
        </div>

        <!-- Scan Button -->
        <button id="traffic-scan-btn" class="btn btn-primary btn-full">
          <span class="btn-icon">🔍</span>
          <span class="btn-text">Scan View</span>
        </button>
        <div id="traffic-scan-progress" class="scan-progress" style="display: none;">
          <div class="progress-spinner"></div>
          <span>Scanning...</span>
        </div>

        <!-- Filters -->
        <div class="dashboard-filters">
          <label class="filter-label">Type:</label>
          <div class="filter-chips">
            <button class="filter-chip" data-filter="traffic-type" data-value="ACCIDENT">🚗 Accident</button>
            <button class="filter-chip" data-filter="traffic-type" data-value="HAZARD">⚠️ Hazard</button>
            <button class="filter-chip" data-filter="traffic-type" data-value="POLICE">🚔 Police</button>
            <button class="filter-chip" data-filter="traffic-type" data-value="CLOSURE">🚫 Closure</button>
            <button class="filter-chip" data-filter="traffic-type" data-value="JAM">🚦 Jam</button>
          </div>
        </div>

        <!-- Results List -->
        <div class="dashboard-results" id="traffic-results">
          <div class="empty-state">
            <p>👀 No data yet</p>
            <p class="empty-hint">Click "Scan View" to load</p>
          </div>
        </div>
      </div>

      <!-- Police Tab Content -->
      <div class="tab-content" data-tab="police">
        <!-- Status Bar -->
        <div class="dashboard-status">
          <div class="status-item">
            <span class="status-label">Total:</span>
            <span class="status-value" id="police-total">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">Filtered:</span>
            <span class="status-value" id="police-filtered">0</span>
          </div>
        </div>

        <!-- Load Button -->
        <button id="police-load-btn" class="btn btn-primary btn-full">
          <span class="btn-icon">📍</span>
          <span class="btn-text">Load Reports</span>
        </button>
        <div id="police-load-progress" class="scan-progress" style="display: none;">
          <div class="progress-spinner"></div>
          <span>Loading...</span>
        </div>

        <!-- Filters -->
        <div class="dashboard-filters">
          <label class="filter-label">Type:</label>
          <div class="filter-chips">
            <button class="filter-chip" data-filter="police-type" data-value="POLICE">🚔 Police</button>
            <button class="filter-chip" data-filter="police-type" data-value="ACCIDENT">🚗 Accident</button>
            <button class="filter-chip" data-filter="police-type" data-value="HAZARD">⚠️ Hazard</button>
            <button class="filter-chip" data-filter="police-type" data-value="ROAD_CLOSED">🚫 Road Closed</button>
            <button class="filter-chip" data-filter="police-type" data-value="JAM">🚦 Jam</button>
          </div>
          <label class="filter-label">
            <input type="checkbox" id="police-sort-recency" checked />
            Sort by Recency
          </label>
        </div>

        <!-- Results List -->
        <div class="dashboard-results" id="police-results">
          <div class="empty-state">
            <p>👀 No data yet</p>
            <p class="empty-hint">Click "Load Reports" to fetch</p>
          </div>
        </div>
      </div>

      <!-- Detail View (shared) -->
      <div class="dashboard-detail" id="dashboard-detail" style="display: none;">
        <button class="detail-back" id="dashboard-detail-back">← Back</button>
        <div class="detail-content" id="dashboard-detail-content"></div>
      </div>
    `
    document.body.appendChild(sidebar)
    this.panelEl = sidebar
  },

  attachEventListeners() {
    // Collapse button
    this.panelEl.querySelector('.dashboard-collapse').addEventListener('click', () => {
      this.toggleSidebar()
    })

    // Tab buttons
    this.panelEl.querySelectorAll('.tab-button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.closest('.tab-button').dataset.tab)
      })
    })

    // Scan/Load buttons
    document.getElementById('traffic-scan-btn').addEventListener('click', () => {
      this.scanTraffic()
    })
    document.getElementById('police-load-btn').addEventListener('click', () => {
      this.loadPolice()
    })

    // Detail back button
    document.getElementById('dashboard-detail-back').addEventListener('click', () => {
      this.showResults()
    })

    // Listen for external events
    document.addEventListener('trafficItemSelected', (e) => {
      this.showDetail('traffic', e.detail)
    })
    document.addEventListener('policeReportSelected', (e) => {
      this.showDetail('police', e.detail)
    })
  },

  toggleSidebar() {
    this.isOpen = !this.isOpen
    this.panelEl.classList.toggle('open')
  },

  switchTab(tab) {
    this.activeTab = tab

    // Update tab buttons
    this.panelEl.querySelectorAll('.tab-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    // Update tab content
    this.panelEl.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.toggle('active', content.dataset.tab === tab)
    })
  },

  async scanTraffic() {
    const trafficPlugin = window.trafficPlugin
    if (!trafficPlugin) return

    const map = mapManager.getMap()
    const bounds = map.getBounds()

    const AUSTRALIA_BOUNDS = { west: 112.5, east: 154.0, south: -44.0, north: -9.0 }
    let bbox = {
      w: Math.max(bounds.getWest(), AUSTRALIA_BOUNDS.west),
      s: Math.max(bounds.getSouth(), AUSTRALIA_BOUNDS.south),
      e: Math.min(bounds.getEast(), AUSTRALIA_BOUNDS.east),
      n: Math.min(bounds.getNorth(), AUSTRALIA_BOUNDS.north),
    }

    if (bbox.w >= bbox.e || bbox.s >= bbox.n) {
      alert('Scan area is outside Australia')
      return
    }

    this.updateProgressUI('traffic-scan', true)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox, zoom: map.getZoom() }),
      })

      const data = await response.json()
      this.trafficData = data.geojson.features || []
      await trafficPlugin.updateTrafficData(data.geojson)
      this.renderTrafficResults()
      this.updateTrafficStatus(data.geojson.features.length)
    } catch (error) {
      console.error('Traffic scan failed:', error)
      alert('Scan failed. Please try again.')
    } finally {
      this.updateProgressUI('traffic-scan', false)
    }
  },

  async loadPolice() {
    const policePlugin = window.policePlugin
    if (!policePlugin) return

    const map = mapManager.getMap()
    const bounds = map.getBounds()

    const AUSTRALIA_BOUNDS = { west: 112.5, east: 154.0, south: -44.0, north: -9.0 }
    let bbox = {
      w: Math.max(bounds.getWest(), AUSTRALIA_BOUNDS.west),
      s: Math.max(bounds.getSouth(), AUSTRALIA_BOUNDS.south),
      e: Math.min(bounds.getEast(), AUSTRALIA_BOUNDS.east),
      n: Math.min(bounds.getNorth(), AUSTRALIA_BOUNDS.north),
    }

    if (bbox.w >= bbox.e || bbox.s >= bbox.n) {
      alert('Load area is outside Australia')
      return
    }

    this.updateProgressUI('police-load', true)

    try {
      const response = await fetch('/api/police-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox, limit: 500 }),
      })

      const data = await response.json()
      this.policeData = data.geojson.features || []
      await policePlugin.updateReportData(data.geojson)
      this.renderPoliceResults()
      document.getElementById('police-total').textContent = this.policeData.length.toString()
    } catch (error) {
      console.error('Police load failed:', error)
      alert('Load failed. Please try again.')
    } finally {
      this.updateProgressUI('police-load', false)
    }
  },

  renderTrafficResults() {
    const resultsEl = document.getElementById('traffic-results')

    if (this.trafficData.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state"><p>🔍 No results</p></div>'
      return
    }

    resultsEl.innerHTML = this.trafficData
      .map((item) => {
        const props = item.properties
        const icon = props.icon || '📍'
        const ageText = props.publishedAt ? this.getTimeAgo(new Date(props.publishedAt)) : 'Unknown'

        return `
          <div class="result-card" data-id="${props.id}">
            <div class="result-icon">${icon}</div>
            <div class="result-info">
              <div class="result-type">${props.type}</div>
              <div class="result-location">${props.street || props.city || 'Unknown'}</div>
              <div class="result-meta">${ageText}</div>
            </div>
          </div>
        `
      })
      .join('')

    resultsEl.querySelectorAll('.result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id
        const item = this.trafficData.find((f) => f.properties.id === id)
        if (item) this.showDetail('traffic', { feature: item, properties: item.properties })
      })
    })
  },

  renderPoliceResults() {
    const resultsEl = document.getElementById('police-results')

    if (this.policeData.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state"><p>🔍 No results</p></div>'
      return
    }

    resultsEl.innerHTML = this.policeData
      .map((item) => {
        const props = item.properties
        const icon = props.icon || '📍'
        const ageText = props.publishedAt ? this.getTimeAgo(new Date(props.publishedAt)) : 'Unknown'

        return `
          <div class="result-card" data-id="${props.alert_id}">
            <div class="result-icon">${icon}</div>
            <div class="result-info">
              <div class="result-type">${props.type}</div>
              <div class="result-location">${props.street || props.city || 'Unknown'}</div>
              <div class="result-meta">${ageText}</div>
            </div>
          </div>
        `
      })
      .join('')

    resultsEl.querySelectorAll('.result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.id
        const item = this.policeData.find((f) => f.properties.alert_id === id)
        if (item) this.showDetail('police', { feature: item, properties: item.properties })
      })
    })
  },

  showDetail(source, data) {
    const { properties } = data
    const detailEl = document.getElementById('dashboard-detail')
    const contentEl = document.getElementById('dashboard-detail-content')

    const icon = properties.icon || '📍'
    const ageText = properties.publishedAt ? this.getTimeAgo(new Date(properties.publishedAt)) : 'Unknown'

    contentEl.innerHTML = `
      <div class="detail-header">
        <span class="detail-icon">${icon}</span>
        <div class="detail-title">
          <h3>${properties.type}</h3>
          ${properties.subtype ? `<p class="detail-subtype">${properties.subtype}</p>` : ''}
        </div>
      </div>

      <div class="detail-location">
        ${properties.street ? `<p><strong>${properties.street}</strong></p>` : ''}
        ${properties.city ? `<p>${properties.city}</p>` : ''}
      </div>

      <div class="detail-info">
        ${properties.alert_id ? `<div><strong>ID:</strong> ${properties.alert_id}</div>` : ''}
        <div><strong>Reported:</strong> ${ageText}</div>
        ${properties.reliability ? `<div><strong>Reliability:</strong> ${properties.reliability}%</div>` : ''}
      </div>
    `

    // Hide results, show detail
    this.panelEl.querySelectorAll('.tab-content.active .dashboard-results').forEach((el) => {
      el.style.display = 'none'
    })
    detailEl.style.display = 'block'
  },

  showResults() {
    this.panelEl.querySelectorAll('.tab-content.active .dashboard-results').forEach((el) => {
      el.style.display = 'block'
    })
    document.getElementById('dashboard-detail').style.display = 'none'
  },

  updateTrafficStatus(count) {
    const now = new Date()
    document.getElementById('traffic-last-scan').textContent = now.toLocaleTimeString()
    document.getElementById('traffic-total').textContent = count.toString()
  },

  updateProgressUI(type, show) {
    const progressEl = document.getElementById(`${type}-progress`)
    const buttonEl = document.getElementById(`${type}-btn`)
    if (progressEl) progressEl.style.display = show ? 'flex' : 'none'
    if (buttonEl) buttonEl.disabled = show
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

  cleanup() {
    if (this.panelEl) this.panelEl.remove()
  },
}
