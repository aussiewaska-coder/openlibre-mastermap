/**
 * State Manager - Centralized state management for the application
 * Manages all global state variables and provides getter/setter methods
 */

class StateManager {
  constructor() {
    this.state = {
      satelliteEnabled: true,
      hillshadeVisible: true,
      terrainExaggeration: 1.0
    }
    
    this.listeners = new Map()
  }

  /**
   * Get a state value
   */
  get(key) {
    return this.state[key]
  }

  /**
   * Set a state value and notify listeners
   */
  set(key, value) {
    const oldValue = this.state[key]
    if (oldValue === value) return // No change
    
    this.state[key] = value
    this._notifyListeners(key, value, oldValue)
  }

  /**
   * Get all state
   */
  getAll() {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes for a specific key
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key).push(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners of state change
   */
  _notifyListeners(key, newValue, oldValue) {
    if (!this.listeners.has(key)) return
    
    for (const callback of this.listeners.get(key)) {
      try {
        callback(newValue, oldValue)
      } catch (error) {
        console.error(`Error in state listener for ${key}:`, error)
      }
    }
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.state = {
      satelliteEnabled: true,
      hillshadeVisible: true,
      terrainExaggeration: 1.0
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear listeners
    this.listeners.clear()
  }
}

export default new StateManager()
