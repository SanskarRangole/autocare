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
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiveDatabase, setIsLiveDatabase] = useState(false)

  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    let authListener = null

    async function initAuth() {
      try {
        const live = isUsingLiveSupabase()
        setIsLiveDatabase(live)

        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const userProfile = await apiGetProfile(
            currentUser.id,
            currentUser.email,
            currentUser.user_metadata?.full_name
          )
          setProfile(userProfile)
        }

        // Subscribe to live Supabase Auth state changes (sign in, sign out, token refresh)
        if (supabase?.auth?.onAuthStateChange) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (session?.user) {
                setIsLiveDatabase(true)
                setUser(session.user)
                const userProfile = await apiGetProfile(
                  session.user.id,
                  session.user.email,
                  session.user.user_metadata?.full_name
                )
                setProfile(userProfile)
              } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
              }
            }
          )
          authListener = subscription
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe()
      }
    }
  }, [])

  const handleSignIn = async (credentials) => {
    setLoading(true)
    try {
      const { user: signedInUser } = await apiSignIn(credentials)
      setIsLiveDatabase(isUsingLiveSupabase())
      setUser(signedInUser)
      const userProfile = await apiGetProfile(
        signedInUser.id,
        signedInUser.email || credentials.email,
        signedInUser.user_metadata?.full_name
      )
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
      setIsLiveDatabase(isUsingLiveSupabase())
      const newUser = res.user
      if (newUser) {
        setUser(newUser)
        const userProfile = await apiGetProfile(
          newUser.id,
          newUser.email || credentials.email,
          credentials.fullName || newUser.user_metadata?.full_name
        )
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
      setIsLiveDatabase(isUsingLiveSupabase())
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
      setIsLiveDatabase(isUsingLiveSupabase())
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
