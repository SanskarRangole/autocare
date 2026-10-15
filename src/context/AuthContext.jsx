import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getCurrentUser,
  getSession,
  signIn as apiSignIn,
  signUp as apiSignUp,
  signInDemo as apiSignInDemo,
  signOut as apiSignOut,
  resetPassword as apiResetPassword,
  getProfile as apiGetProfile,
  updateProfile as apiUpdateProfile,
  isUsingLiveSupabase,
} from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiveDatabase, setIsLiveDatabase] = useState(false)

  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    async function initAuth() {
      try {
        setIsLiveDatabase(isUsingLiveSupabase())
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const userProfile = await apiGetProfile(currentUser.id)
          setProfile(userProfile)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleSignIn = async (credentials) => {
    setLoading(true)
    try {
      const { user: signedInUser } = await apiSignIn(credentials)
      setUser(signedInUser)
      const userProfile = await apiGetProfile(signedInUser.id)
      setProfile(userProfile)
      return signedInUser
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (credentials) => {
    setLoading(true)
    try {
      const res = await apiSignUp(credentials)
      const newUser = res.user
      const session = res.session
      if (newUser && session) {
        setUser(newUser)
        const userProfile = await apiGetProfile(newUser.id)
        setProfile(userProfile)
      }
      return res
    } finally {
      setLoading(false)
    }
  }

  const handleSignInDemo = async () => {
    setLoading(true)
    try {
      const { user: demoUser } = await apiSignInDemo()
      setUser(demoUser)
      const userProfile = await apiGetProfile(demoUser.id)
      setProfile(userProfile)
      return demoUser
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await apiSignOut()
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (email) => {
    return await apiResetPassword({ email })
  }

  const handleUpdateProfile = async (updates) => {
    if (!user) return
    const updated = await apiUpdateProfile(user.id, updates)
    setProfile(updated)
    return updated
  }

  const value = {
    user,
    profile,
    loading,
    isLiveDatabase,
    isConfigured,
    currency: profile?.currency || 'USD',
    distanceUnit: profile?.distance_unit || 'km',
    volumeUnit: profile?.volume_unit || 'litres',
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInDemo: handleSignInDemo,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
