import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getVehicles as apiGetVehicles,
  createVehicle as apiCreateVehicle,
  updateVehicle as apiUpdateVehicle,
  deleteVehicle as apiDeleteVehicle,
  seedSampleData,
  clearAllLocalData,
  syncLocalDataToSupabase,
} from '../lib/storage'

const VehicleContext = createContext(null)

export function VehicleProvider({ children }) {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [activeVehicleId, setActiveVehicleId] = useState(() => {
    return localStorage.getItem('autocare_active_vehicle_id') || null
  })
  const [loading, setLoading] = useState(true)

  const loadVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([])
      setActiveVehicleId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await apiGetVehicles(user.id)
      setVehicles(data)

      // Ensure active vehicle is valid or pick first one
      if (data.length > 0) {
        const exists = data.some(v => v.id === activeVehicleId)
        if (!exists) {
          const firstId = data[0].id
          setActiveVehicleId(firstId)
          localStorage.setItem('autocare_active_vehicle_id', firstId)
        }
      } else {
        setActiveVehicleId(null)
        localStorage.removeItem('autocare_active_vehicle_id')
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeVehicleId])

  useEffect(() => {
    loadVehicles()
  }, [user])

  const selectVehicle = (id) => {
    setActiveVehicleId(id)
    localStorage.setItem('autocare_active_vehicle_id', id)
  }

  const createVehicle = async (vehicleData) => {
    if (!user) return null
    const newVehicle = await apiCreateVehicle(user.id, vehicleData)
    await loadVehicles()
    selectVehicle(newVehicle.id)
    return newVehicle
  }

  const updateVehicle = async (id, updates) => {
    const updated = await apiUpdateVehicle(id, updates)
    await loadVehicles()
    return updated
  }

  const deleteVehicle = async (id) => {
    await apiDeleteVehicle(id)
    await loadVehicles()
  }

  const handleSeedDemoData = async () => {
    if (!user) return
    setLoading(true)
    try {
      await seedSampleData(user.id)
      await loadVehicles()
    } finally {
      setLoading(false)
    }
  }

  const handleClearAllData = async () => {
    setLoading(true)
    try {
      await clearAllLocalData()
      await loadVehicles()
    } finally {
      setLoading(false)
    }
  }

  const handleSyncLocalData = async () => {
    if (!user) throw new Error('User not authenticated')
    setLoading(true)
    try {
      const result = await syncLocalDataToSupabase(user.id)
      await loadVehicles()
      return result
    } finally {
      setLoading(false)
    }
  }

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || (vehicles.length > 0 ? vehicles[0] : null)

  const value = {
    vehicles,
    activeVehicle,
    activeVehicleId,
    loading,
    selectVehicle,
    loadVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    seedDemoData: handleSeedDemoData,
    clearAllData: handleClearAllData,
    syncLocalData: handleSyncLocalData,
  }

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>
}

export function useVehicles() {
  const context = useContext(VehicleContext)
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider')
  }
  return context
}
