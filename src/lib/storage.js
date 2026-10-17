import { supabase, isSupabaseConfigured, isOfflineDemoForced } from './supabase'

const LOCAL_STORAGE_KEY_PREFIX = 'autocare_'

function getActiveMode() {
  if (isOfflineDemoForced()) return 'local'
  const explicitMode = getStorage().getItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  if (explicitMode === 'demo') return 'local'
  if (isSupabaseConfigured()) return 'supabase'
  return 'local'
}

export function isUsingLiveSupabase() {
  return getActiveMode() === 'supabase'
}

// -------------------------------------------------------------
// LOCAL REPOSITORY (Persistent in browser localStorage or in-memory)
// -------------------------------------------------------------
const memoryStore = {}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage
  }
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null),
    setItem: (key, val) => {
      memoryStore[key] = String(val)
    },
    removeItem: (key) => {
      delete memoryStore[key]
    },
    clear: () => {
      Object.keys(memoryStore).forEach((k) => delete memoryStore[k])
    },
  }
}

function getLocalItem(key, defaultValue = []) {
  try {
    const raw = getStorage().getItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`)
    return raw ? JSON.parse(raw) : defaultValue
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e)
    return defaultValue
  }
}

function setLocalItem(key, value) {
  try {
    getStorage().setItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value))
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e)
  }
}

// Demo initial user
const DEFAULT_DEMO_USER = {
  id: 'usr_demo_8829',
  email: 'driver@autocare.app',
  user_metadata: {
    full_name: 'Alex Mercer',
  },
}

// -------------------------------------------------------------
// AUTH OPERATIONS
// -------------------------------------------------------------
export async function getSession() {
  const explicitMode = getStorage().getItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  if (explicitMode === 'demo') {
    return getLocalItem('session', null)
  }
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session) return data.session
    } catch {
      // fallback
    }
  }
  const session = getLocalItem('session', null)
  return session
}

export async function getCurrentUser() {
  const explicitMode = getStorage().getItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  if (explicitMode === 'demo') {
    const session = getLocalItem('session', null)
    return session?.user || DEFAULT_DEMO_USER
  }
  if (isUsingLiveSupabase()) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) return user
    } catch {
      // fallback
    }
    // When connected to live Supabase, do NOT return mock local users if unauthenticated
    return null
  }
  const session = getLocalItem('session', null)
  return session?.user || null
}

export async function signInDemo() {
  getStorage().setItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`, 'demo')
  const session = {
    access_token: `demo_tok_${Date.now()}`,
    user: DEFAULT_DEMO_USER,
  }
  setLocalItem('session', session)
  return { user: DEFAULT_DEMO_USER, session }
}

export async function signIn({ email, password }) {
  // Clear offline demo mode so live Supabase is used
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}session`)

  if (isUsingLiveSupabase()) {
    const cleanEmail = (email || '').trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        throw new Error(
          'Your account exists in Supabase, but email is not confirmed. In your Supabase Dashboard > Authentication > Providers > Email, toggle OFF "Confirm email" to allow instant login.'
        )
      }
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error(
          'Invalid email or password. If you haven\'t registered yet, please switch to the "Create Account" tab.'
        )
      }
      throw error
    }

    // Automatically sync email & profile to public.profiles table
    if (data?.user) {
      try {
        const userEmail = data.user.email || cleanEmail
        const fullName = data.user.user_metadata?.full_name || userEmail.split('@')[0]
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: userEmail,
            full_name: fullName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      } catch (syncErr) {
        console.warn('Profile sync on sign in error:', syncErr)
      }
    }

    return data
  }
  // Local/Offline mock auth
  const users = getLocalItem('registered_users', [DEFAULT_DEMO_USER])
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      email,
      user_metadata: { full_name: email.split('@')[0] },
    }
    users.push(user)
    setLocalItem('registered_users', users)
  }
  const session = {
    access_token: `mock_tok_${Date.now()}`,
    user,
  }
  setLocalItem('session', session)
  return { user, session }
}

export async function signUp({ email, password, fullName }) {
  // Clear demo session state before creating real user
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}session`)

  if (isUsingLiveSupabase()) {
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.')
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName || cleanEmail.split('@')[0] },
      },
    })
    if (error) {
      if (error.message?.includes('User already registered') || error.code === 'user_already_exists') {
        throw new Error(
          'An account with this email already exists in Supabase. Switch to the "Sign In" tab to log in.'
        )
      }
      if (error.message?.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
        throw new Error(
          'Supabase email confirmation rate limit reached (free tier: 3 emails/hr). In your Supabase Dashboard, go to Authentication > Providers > Email and turn OFF "Confirm email" to enable instant unlimited signups, or click "Instant Demo" to enter immediately.'
        )
      }
      throw error
    }

    // Handle Supabase case where existing user returns obfuscated user with 0 identities
    if (data?.user?.identities && data.user.identities.length === 0) {
      throw new Error(
        'An account with this email already exists in Supabase. Switch to the "Sign In" tab to log in.'
      )
    }

    let finalSession = data?.session
    // If Supabase created user but session is null (e.g. project setting), attempt instant login
    if (data?.user && !finalSession) {
      try {
        const loginRes = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (loginRes.data?.session) {
          finalSession = loginRes.data.session
        } else if (loginRes.error?.message?.includes('Email not confirmed')) {
          throw new Error(
            'Your account was created in Supabase! However, "Confirm email" is currently ON in your Supabase project. Check your inbox or turn OFF "Confirm email" in Supabase Dashboard > Authentication > Providers > Email to log in instantly.'
          )
        }
      } catch (loginErr) {
        if (loginErr.message?.includes('Supabase Dashboard')) {
          throw loginErr
        }
        console.warn('Instant login after signup attempt:', loginErr)
      }
    }

    // Immediately sync to public.profiles
    if (data?.user) {
      try {
        const userEmail = data.user.email || cleanEmail
        const name = fullName || data.user.user_metadata?.full_name || userEmail.split('@')[0]
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: userEmail,
            full_name: name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      } catch (syncErr) {
        console.warn('Failed to upsert profile on signUp:', syncErr)
      }
    }

    return { user: data.user, session: finalSession || data.session }
  }

  const users = getLocalItem('registered_users', [DEFAULT_DEMO_USER])
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    throw new Error('User already exists with this email address.')
  }
  const user = {
    id: `usr_${Date.now()}`,
    email,
    user_metadata: { full_name: fullName || email.split('@')[0] },
  }
  users.push(user)
  setLocalItem('registered_users', users)

  const session = {
    access_token: `mock_tok_${Date.now()}`,
    user,
  }
  setLocalItem('session', session)
  return { user, session }
}

export async function signOut() {
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}auth_mode`)
  getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}session`)
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Supabase sign out error:', e)
    }
  }
}

export async function resetPassword({ email }) {
  if (isUsingLiveSupabase()) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    })
    if (error) throw error
    return { success: true }
  }
  // Local mode simulation
  return { success: true, message: `Password reset instructions sent to ${email} (Demo mode simulated)` }
}

export async function getProfile(userId, userEmail = null, userFullName = null) {
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        // If email was null in database but we know userEmail, persist it
        if (!data.email && userEmail) {
          await supabase.from('profiles').update({ email: userEmail }).eq('id', userId)
          data.email = userEmail
        }
        return data
      }

      // If profile row doesn't exist yet, automatically create it!
      const defaultProfile = {
        id: userId,
        email: userEmail,
        full_name: userFullName || (userEmail ? userEmail.split('@')[0] : 'Vehicle Owner'),
        currency: 'USD',
        distance_unit: 'km',
        volume_unit: 'litres',
        theme: 'light',
        updated_at: new Date().toISOString(),
      }

      const { data: created } = await supabase
        .from('profiles')
        .upsert(defaultProfile, { onConflict: 'id' })
        .select()
        .single()

      return created || defaultProfile
    } catch (err) {
      console.warn('getProfile error:', err)
      return {
        id: userId,
        email: userEmail,
        full_name: userFullName || (userEmail ? userEmail.split('@')[0] : 'Vehicle Owner'),
        currency: 'USD',
        distance_unit: 'km',
        volume_unit: 'litres',
        theme: 'light',
      }
    }
  }
  const profiles = getLocalItem('profiles', {})
  return profiles[userId] || {
    id: userId,
    email: userEmail,
    full_name: userFullName || 'Alex Mercer',
    currency: 'USD',
    distance_unit: 'km',
    volume_unit: 'litres',
    theme: 'light',
  }
}

export async function updateProfile(userId, profileData) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const profiles = getLocalItem('profiles', {})
  const updated = { ...(profiles[userId] || {}), ...profileData, id: userId, updated_at: new Date().toISOString() }
  profiles[userId] = updated
  setLocalItem('profiles', profiles)
  return updated
}

// -------------------------------------------------------------
// VEHICLES
// -------------------------------------------------------------
export async function getVehicles(userId) {
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (!error && data) {
        const localVehicles = getLocalItem('vehicles', []).filter(v => v.user_id === userId)
        const liveIds = new Set(data.map(v => v.id))
        return [...data, ...localVehicles.filter(v => !liveIds.has(v.id))]
      }
    } catch (e) {
      console.warn('Supabase getVehicles failed, falling back to local:', e)
    }
  }
  const allVehicles = getLocalItem('vehicles', [])
  return allVehicles.filter(v => v.user_id === userId)
}

function createLocalVehicle(userId, vehicleData) {
  const allVehicles = getLocalItem('vehicles', [])
  const newVehicle = {
    id: `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    ...vehicleData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  allVehicles.unshift(newVehicle)
  setLocalItem('vehicles', allVehicles)
  return newVehicle
}

function sanitizeVehiclePayload(vehicleData = {}) {
  const allowed = [
    'name', 'type', 'make', 'model', 'year', 'license_plate',
    'vin', 'fuel_type', 'current_odometer', 'photo_url',
    'insurance_provider', 'insurance_policy_no', 'insurance_expiry',
    'puc_number', 'puc_expiry', 'notes'
  ]
  const data = vehicleData || {}
  const sanitized = {}
  allowed.forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key]
    }
  })
  if (sanitized.year !== undefined) {
    sanitized.year = parseInt(sanitized.year, 10) || new Date().getFullYear()
  }
  if (sanitized.current_odometer !== undefined) {
    sanitized.current_odometer = sanitized.current_odometer === '' || sanitized.current_odometer == null ? 0 : Number(sanitized.current_odometer)
  }
  if (sanitized.insurance_expiry === '') sanitized.insurance_expiry = null
  if (sanitized.puc_expiry === '') sanitized.puc_expiry = null
  return sanitized
}

function sanitizeServicePayload(serviceData) {
  const allowed = [
    'date', 'odometer', 'service_type', 'garage', 'cost',
    'notes', 'next_due_date', 'next_due_odometer'
  ]
  const sanitized = {}
  allowed.forEach(key => {
    if (serviceData[key] !== undefined) {
      sanitized[key] = serviceData[key]
    }
  })
  if (sanitized.cost !== undefined) {
    sanitized.cost = Number(sanitized.cost) || 0
  }
  if (sanitized.odometer !== undefined) {
    sanitized.odometer = sanitized.odometer === '' || sanitized.odometer == null ? null : Number(sanitized.odometer)
  }
  if (sanitized.next_due_odometer !== undefined) {
    sanitized.next_due_odometer = sanitized.next_due_odometer === '' || sanitized.next_due_odometer == null ? null : Number(sanitized.next_due_odometer)
  }
  if (sanitized.next_due_date === '') sanitized.next_due_date = null
  return sanitized
}

function sanitizeFuelLogPayload(logData) {
  const allowed = [
    'date', 'odometer', 'litres', 'total_cost',
    'is_full_tank', 'missed_previous_fill', 'fuel_brand', 'notes'
  ]
  const sanitized = {}
  allowed.forEach(key => {
    if (logData[key] !== undefined) {
      sanitized[key] = logData[key]
    }
  })
  if (sanitized.odometer !== undefined) {
    sanitized.odometer = sanitized.odometer === '' || sanitized.odometer == null ? 0 : Number(sanitized.odometer)
  }
  if (sanitized.litres !== undefined) {
    sanitized.litres = sanitized.litres === '' || sanitized.litres == null ? 0 : Number(sanitized.litres)
  }
  if (sanitized.total_cost !== undefined) {
    sanitized.total_cost = sanitized.total_cost === '' || sanitized.total_cost == null ? 0 : Number(sanitized.total_cost)
  }
  if (sanitized.is_full_tank !== undefined) {
    sanitized.is_full_tank = Boolean(sanitized.is_full_tank)
  }
  if (sanitized.missed_previous_fill !== undefined) {
    sanitized.missed_previous_fill = Boolean(sanitized.missed_previous_fill)
  }
  return sanitized
}

function sanitizeExpensePayload(expenseData) {
  const allowed = [
    'category', 'amount', 'date', 'description', 'reference_type', 'reference_id'
  ]
  const sanitized = {}
  allowed.forEach(key => {
    if (expenseData[key] !== undefined) {
      sanitized[key] = expenseData[key]
    }
  })
  if (sanitized.amount !== undefined) {
    sanitized.amount = Number(sanitized.amount) || 0
  }
  if (sanitized.reference_type === undefined) {
    sanitized.reference_type = 'standalone'
  }
  if (sanitized.reference_id === '') sanitized.reference_id = null
  return sanitized
}

function sanitizeReminderPayload(reminderData) {
  const allowed = [
    'title', 'category', 'due_date', 'due_odometer',
    'is_completed', 'completed_date', 'notes'
  ]
  const sanitized = {}
  allowed.forEach(key => {
    if (reminderData[key] !== undefined) {
      sanitized[key] = reminderData[key]
    }
  })
  if (sanitized.due_date === '') sanitized.due_date = null
  if (sanitized.due_odometer !== undefined) {
    sanitized.due_odometer = sanitized.due_odometer === '' || sanitized.due_odometer == null ? null : Number(sanitized.due_odometer)
  }
  if (sanitized.is_completed !== undefined) {
    sanitized.is_completed = Boolean(sanitized.is_completed)
  }
  if (sanitized.completed_date === '') sanitized.completed_date = null
  return sanitized
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveAuthUserId(providedId) {
  if (providedId && UUID_PATTERN.test(providedId)) {
    return providedId
  }
  if (isUsingLiveSupabase() && supabase?.auth?.getUser) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && UUID_PATTERN.test(user.id)) {
        return user.id
      }
    } catch {
      // ignore
    }
  }
  return providedId
}

export async function createVehicle(userIdOrData, maybeData) {
  let userId
  let vehicleData
  if (maybeData !== undefined) {
    userId = userIdOrData
    vehicleData = maybeData || {}
  } else if (typeof userIdOrData === 'object' && userIdOrData !== null) {
    vehicleData = userIdOrData
    userId = vehicleData.user_id || 'usr_default'
  } else {
    userId = userIdOrData
    vehicleData = {}
  }
  const payload = sanitizeVehiclePayload(vehicleData)
  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...payload, user_id: effectiveUserId })
        .select()
        .single()
      if (!error && data) return data
      if (error) {
        if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('violates row-level security')) {
          console.warn('RLS restriction detected. Preserving vehicle locally.', error.message)
          return createLocalVehicle(effectiveUserId, payload)
        }
        throw error
      }
    } catch (err) {
      if (err.code === '42501' || err.message?.includes('row-level security') || err.message?.includes('violates row-level security')) {
        console.warn('RLS restriction detected. Preserving vehicle locally.', err.message)
        return createLocalVehicle(effectiveUserId, payload)
      }
      throw err
    }
  }
  return createLocalVehicle(userId, payload)
}

export async function updateVehicle(vehicleId, updates) {
  const payload = sanitizeVehiclePayload(updates)
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const allVehicles = getLocalItem('vehicles', [])
  const index = allVehicles.findIndex(v => v.id === vehicleId)
  if (index === -1) throw new Error('Vehicle not found')
  allVehicles[index] = { ...allVehicles[index], ...payload, updated_at: new Date().toISOString() }
  setLocalItem('vehicles', allVehicles)
  return allVehicles[index]
}

export async function deleteVehicle(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
    if (error) throw error
    return true
  }
  // Local cascade delete
  let vehicles = getLocalItem('vehicles', [])
  vehicles = vehicles.filter(v => v.id !== vehicleId)
  setLocalItem('vehicles', vehicles)

  let services = getLocalItem('services', []).filter(s => s.vehicle_id !== vehicleId)
  setLocalItem('services', services)

  let fuelLogs = getLocalItem('fuel_logs', []).filter(f => f.vehicle_id !== vehicleId)
  setLocalItem('fuel_logs', fuelLogs)

  let expenses = getLocalItem('expenses', []).filter(e => e.vehicle_id !== vehicleId)
  setLocalItem('expenses', expenses)

  let reminders = getLocalItem('reminders', []).filter(r => r.vehicle_id !== vehicleId)
  setLocalItem('reminders', reminders)

  let documents = getLocalItem('documents', []).filter(d => d.vehicle_id !== vehicleId)
  setLocalItem('documents', documents)

  return true
}

// -------------------------------------------------------------
// SERVICES & EXPENSE SYNCHRONIZATION
// -------------------------------------------------------------
export async function getServices(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })
    if (error) throw error
    return data || []
  }
  const services = getLocalItem('services', [])
  return services.filter(s => s.vehicle_id === vehicleId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function createService(userId, vehicleId, serviceData) {
  const payload = sanitizeServicePayload(serviceData)
  const cost = payload.cost || 0

  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    const { data: service, error: sErr } = await supabase
      .from('services')
      .insert({ ...payload, user_id: effectiveUserId, vehicle_id: vehicleId })
      .select()
      .single()
    if (sErr) throw sErr

    // Automatically create corresponding expense to prevent duplicates
    if (cost > 0) {
      await supabase.from('expenses').insert({
        user_id: effectiveUserId,
        vehicle_id: vehicleId,
        category: 'Service',
        amount: cost,
        date: payload.date,
        description: `${payload.service_type}${payload.garage ? ` @ ${payload.garage}` : ''}`,
        reference_type: 'service',
        reference_id: service.id,
      })
    }

    // Auto-update vehicle odometer if higher
    if (payload.odometer) {
      await autoUpdateVehicleOdometer(vehicleId, payload.odometer)
    }

    return service
  }

  // Local storage mode
  const services = getLocalItem('services', [])
  const newService = {
    id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    vehicle_id: vehicleId,
    ...payload,
    cost,
    created_at: new Date().toISOString(),
  }
  services.unshift(newService)
  setLocalItem('services', services)

  // Automatically record linked expense
  if (cost > 0) {
    const expenses = getLocalItem('expenses', [])
    expenses.unshift({
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      vehicle_id: vehicleId,
      category: 'Service',
      amount: cost,
      date: payload.date,
      description: `${payload.service_type}${payload.garage ? ` @ ${payload.garage}` : ''}`,
      reference_type: 'service',
      reference_id: newService.id,
      created_at: new Date().toISOString(),
    })
    setLocalItem('expenses', expenses)
  }

  if (payload.odometer) {
    await autoUpdateVehicleOdometer(vehicleId, payload.odometer)
  }

  return newService
}

export async function updateService(serviceId, updates) {
  const payload = sanitizeServicePayload(updates)
  const cost = payload.cost || 0

  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('services')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .select()
      .single()
    if (error) throw error

    // Sync linked expense
    await supabase
      .from('expenses')
      .update({
        amount: cost,
        date: payload.date,
        description: `${payload.service_type || 'Service'}${payload.garage ? ` @ ${payload.garage}` : ''}`,
      })
      .eq('reference_type', 'service')
      .eq('reference_id', serviceId)

    return data
  }

  const services = getLocalItem('services', [])
  const index = services.findIndex(s => s.id === serviceId)
  if (index === -1) throw new Error('Service record not found')

  services[index] = { ...services[index], ...payload, cost, updated_at: new Date().toISOString() }
  setLocalItem('services', services)

  // Sync linked expense
  const expenses = getLocalItem('expenses', [])
  const expIdx = expenses.findIndex(e => e.reference_type === 'service' && e.reference_id === serviceId)
  if (expIdx !== -1) {
    expenses[expIdx] = {
      ...expenses[expIdx],
      amount: cost,
      date: payload.date || expenses[expIdx].date,
      description: `${payload.service_type || 'Service'}${payload.garage ? ` @ ${payload.garage}` : ''}`,
    }
    setLocalItem('expenses', expenses)
  }

  return services[index]
}

export async function deleteService(serviceId) {
  if (isUsingLiveSupabase()) {
    // Delete linked expense first or via cascade
    await supabase.from('expenses').delete().eq('reference_type', 'service').eq('reference_id', serviceId)
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (error) throw error
    return true
  }
  const services = getLocalItem('services', []).filter(s => s.id !== serviceId)
  setLocalItem('services', services)

  const expenses = getLocalItem('expenses', []).filter(e => !(e.reference_type === 'service' && e.reference_id === serviceId))
  setLocalItem('expenses', expenses)
  return true
}

// -------------------------------------------------------------
// FUEL LOGS & EXPENSE SYNCHRONIZATION
// -------------------------------------------------------------
export async function getFuelLogs(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('odometer', { ascending: false })
    if (error) throw error
    return data || []
  }
  const fuelLogs = getLocalItem('fuel_logs', [])
  return fuelLogs.filter(f => f.vehicle_id === vehicleId).sort((a, b) => Number(b.odometer) - Number(a.odometer))
}

export async function createFuelLog(userId, vehicleId, logData) {
  const payload = sanitizeFuelLogPayload(logData)
  const totalCost = payload.total_cost || 0
  const litres = payload.litres || 0
  const pricePerLitre = litres > 0 ? Number((totalCost / litres).toFixed(3)) : 0
  const isSpendingOnly = Boolean(logData.is_spending_only || litres <= 0)

  const expenseDesc = litres > 0
    ? `Fuel Fill: ${litres} L${payload.odometer ? ` (${Number(payload.odometer).toLocaleString()} km)` : ''}`
    : `Fuel Expense${payload.fuel_brand ? ` @ ${payload.fuel_brand}` : ''}`

  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    const { data: fuelLog, error: fErr } = await supabase
      .from('fuel_logs')
      .insert({
        ...payload,
        user_id: effectiveUserId,
        vehicle_id: vehicleId,
      })
      .select()
      .single()
    if (fErr) throw fErr

    // Automatically create corresponding expense to prevent duplicates
    if (totalCost > 0) {
      await supabase.from('expenses').insert({
        user_id: effectiveUserId,
        vehicle_id: vehicleId,
        category: 'Fuel',
        amount: totalCost,
        date: payload.date,
        description: expenseDesc,
        reference_type: 'fuel',
        reference_id: fuelLog.id,
      })
    }

    if (!isSpendingOnly && payload.odometer && Number(payload.odometer) > 0) {
      await autoUpdateVehicleOdometer(vehicleId, payload.odometer)
    }

    return fuelLog
  }

  const fuelLogs = getLocalItem('fuel_logs', [])
  const newFuelLog = {
    id: `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    vehicle_id: vehicleId,
    ...payload,
    is_spending_only: isSpendingOnly,
    price_per_litre: pricePerLitre,
    created_at: new Date().toISOString(),
  }
  fuelLogs.unshift(newFuelLog)
  setLocalItem('fuel_logs', fuelLogs)

  // Record linked expense
  if (totalCost > 0) {
    const expenses = getLocalItem('expenses', [])
    expenses.unshift({
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      vehicle_id: vehicleId,
      category: 'Fuel',
      amount: totalCost,
      date: payload.date,
      description: expenseDesc,
      reference_type: 'fuel',
      reference_id: newFuelLog.id,
      created_at: new Date().toISOString(),
    })
    setLocalItem('expenses', expenses)
  }

  if (!isSpendingOnly && payload.odometer && Number(payload.odometer) > 0) {
    await autoUpdateVehicleOdometer(vehicleId, payload.odometer)
  }

  return newFuelLog
}

export async function updateFuelLog(fuelLogId, updates) {
  const payload = sanitizeFuelLogPayload(updates)
  const totalCost = payload.total_cost || 0
  const litres = payload.litres || 0
  const pricePerLitre = litres > 0 ? Number((totalCost / litres).toFixed(3)) : 0

  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('fuel_logs')
      .update({
        ...payload,
      })
      .eq('id', fuelLogId)
      .select()
      .single()
    if (error) throw error

    // Sync linked expense
    await supabase
      .from('expenses')
      .update({
        amount: totalCost,
        date: payload.date,
        description: `Fuel Fill: ${litres} L (${Number(payload.odometer).toLocaleString()} km)`,
      })
      .eq('reference_type', 'fuel')
      .eq('reference_id', fuelLogId)

    return data
  }

  const fuelLogs = getLocalItem('fuel_logs', [])
  const index = fuelLogs.findIndex(f => f.id === fuelLogId)
  if (index === -1) throw new Error('Fuel log not found')

  fuelLogs[index] = {
    ...fuelLogs[index],
    ...payload,
    price_per_litre: pricePerLitre,
  }
  setLocalItem('fuel_logs', fuelLogs)

  const expenses = getLocalItem('expenses', [])
  const expIdx = expenses.findIndex(e => e.reference_type === 'fuel' && e.reference_id === fuelLogId)
  if (expIdx !== -1) {
    expenses[expIdx] = {
      ...expenses[expIdx],
      amount: totalCost,
      date: payload.date || expenses[expIdx].date,
      description: `Fuel Fill: ${litres} L (${Number(payload.odometer).toLocaleString()} km)`,
    }
    setLocalItem('expenses', expenses)
  }

  return fuelLogs[index]
}

export async function deleteFuelLog(fuelLogId) {
  if (isUsingLiveSupabase()) {
    await supabase.from('expenses').delete().eq('reference_type', 'fuel').eq('reference_id', fuelLogId)
    const { error } = await supabase.from('fuel_logs').delete().eq('id', fuelLogId)
    if (error) throw error
    return true
  }
  const fuelLogs = getLocalItem('fuel_logs', []).filter(f => f.id !== fuelLogId)
  setLocalItem('fuel_logs', fuelLogs)

  const expenses = getLocalItem('expenses', []).filter(e => !(e.reference_type === 'fuel' && e.reference_id === fuelLogId))
  setLocalItem('expenses', expenses)
  return true
}

// -------------------------------------------------------------
// EXPENSES (Standalone & Unified)
// -------------------------------------------------------------
export async function getExpenses(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })
    if (error) throw error
    return data || []
  }
  const expenses = getLocalItem('expenses', [])
  return expenses.filter(e => e.vehicle_id === vehicleId).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getAllExpenses(userId) {
  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('date', { ascending: false })
    if (error) throw error
    return data || []
  }
  const expenses = getLocalItem('expenses', [])
  return expenses
    .filter(e => !userId || e.user_id === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function createExpense(userId, vehicleId, expenseData) {
  const payload = sanitizeExpensePayload(expenseData)

  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...payload,
        user_id: effectiveUserId,
        vehicle_id: vehicleId,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const expenses = getLocalItem('expenses', [])
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    vehicle_id: vehicleId,
    ...payload,
    created_at: new Date().toISOString(),
  }
  expenses.unshift(newExpense)
  setLocalItem('expenses', expenses)
  return newExpense
}

export async function updateExpense(expenseId, updates) {
  const payload = sanitizeExpensePayload(updates)

  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', expenseId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const expenses = getLocalItem('expenses', [])
  const index = expenses.findIndex(e => e.id === expenseId)
  if (index === -1) throw new Error('Expense not found')

  expenses[index] = { ...expenses[index], ...payload }
  setLocalItem('expenses', expenses)
  return expenses[index]
}

export async function deleteExpense(expenseId) {
  if (isUsingLiveSupabase()) {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) throw error
    return true
  }
  const expenses = getLocalItem('expenses', []).filter(e => e.id !== expenseId)
  setLocalItem('expenses', expenses)
  return true
}

// -------------------------------------------------------------
// REMINDERS & MAINTENANCE SCHEDULES
// -------------------------------------------------------------
export async function getReminders(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('is_completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data || []
  }
  const reminders = getLocalItem('reminders', [])
  return reminders.filter(r => r.vehicle_id === vehicleId).sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
    return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31')
  })
}

export async function createReminder(userId, vehicleId, reminderData) {
  const payload = sanitizeReminderPayload(reminderData)

  if (isUsingLiveSupabase()) {
    const effectiveUserId = await resolveAuthUserId(userId)
    const { data, error } = await supabase
      .from('reminders')
      .insert({ ...payload, user_id: effectiveUserId, vehicle_id: vehicleId })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const reminders = getLocalItem('reminders', [])
  const newReminder = {
    id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    vehicle_id: vehicleId,
    ...payload,
    is_completed: false,
    created_at: new Date().toISOString(),
  }
  reminders.unshift(newReminder)
  setLocalItem('reminders', reminders)
  return newReminder
}

export async function toggleReminderStatus(reminderId, isCompleted) {
  const completedDate = isCompleted ? new Date().toISOString().split('T')[0] : null
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        is_completed: isCompleted,
        completed_date: completedDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const reminders = getLocalItem('reminders', [])
  const index = reminders.findIndex(r => r.id === reminderId)
  if (index === -1) throw new Error('Reminder not found')
  reminders[index] = {
    ...reminders[index],
    is_completed: isCompleted,
    completed_date: completedDate,
    updated_at: new Date().toISOString(),
  }
  setLocalItem('reminders', reminders)
  return reminders[index]
}

export async function updateReminder(reminderId, updates) {
  const payload = sanitizeReminderPayload(updates)

  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('reminders')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', reminderId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const reminders = getLocalItem('reminders', [])
  const index = reminders.findIndex(r => r.id === reminderId)
  if (index === -1) throw new Error('Reminder not found')
  reminders[index] = { ...reminders[index], ...payload, updated_at: new Date().toISOString() }
  setLocalItem('reminders', reminders)
  return reminders[index]
}

export async function deleteReminder(reminderId) {
  if (isUsingLiveSupabase()) {
    const { error } = await supabase.from('reminders').delete().eq('id', reminderId)
    if (error) throw error
    return true
  }
  const reminders = getLocalItem('reminders', []).filter(r => r.id !== reminderId)
  setLocalItem('reminders', reminders)
  return true
}

// -------------------------------------------------------------
// DOCUMENTS (Storage + Signed URLs)
// -------------------------------------------------------------
export async function getDocuments(vehicleId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  const docs = getLocalItem('documents', [])
  return docs.filter(d => d.vehicle_id === vehicleId)
}

export async function uploadDocument(userId, vehicleId, file, meta = {}) {
  const fileExt = file.name ? file.name.split('.').pop() : 'pdf'
  const cleanFileName = `${Date.now()}_${(file.name || 'document').replace(/\s+/g, '_')}`
  const effectiveUserId = await resolveAuthUserId(userId)
  const filePath = `${effectiveUserId}/${vehicleId}/${cleanFileName}`
  const expiryDate = meta.expiry_date && meta.expiry_date !== '' ? meta.expiry_date : null

  if (isUsingLiveSupabase()) {
    // 1. Upload to Supabase Storage private bucket
    const { error: uploadError } = await supabase.storage
      .from('vehicle-documents')
      .upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError

    // 2. Insert record in documents table
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: effectiveUserId,
        vehicle_id: vehicleId,
        name: meta.name || file.name || 'Vehicle Document',
        type: meta.type || 'Other',
        file_path: filePath,
        file_name: file.name || cleanFileName,
        file_size: file.size || 0,
        file_type: file.type || fileExt,
        expiry_date: expiryDate,
        notes: meta.notes || null,
      })
      .select()
      .single()
    if (dbError) throw dbError
    return data
  }

  // Local storage mock: convert to Base64 data URI so user can view & download in demo mode
  const base64Data = await fileToBase64(file)
  const docs = getLocalItem('documents', [])
  const newDoc = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    vehicle_id: vehicleId,
    name: meta.name || file.name || 'Vehicle Document',
    type: meta.type || 'Other',
    file_path: filePath,
    file_name: file.name || cleanFileName,
    file_size: file.size || 0,
    file_type: file.type || fileExt,
    expiry_date: expiryDate,
    notes: meta.notes || null,
    mock_url: base64Data,
    created_at: new Date().toISOString(),
  }
  docs.unshift(newDoc)
  setLocalItem('documents', docs)
  return newDoc
}

export async function getDocumentSignedUrl(document) {
  if (isUsingLiveSupabase()) {
    // Generate secure 1-hour signed URL from private bucket
    const { data, error } = await supabase.storage
      .from('vehicle-documents')
      .createSignedUrl(document.file_path, 3600)
    if (error) throw error
    return data.signedUrl
  }
  // Local mode returns the stored mock data URL
  return document.mock_url || '#'
}

export async function updateDocument(documentId, updates) {
  const payload = { ...updates }
  if (payload.expiry_date === '') payload.expiry_date = null

  if (isUsingLiveSupabase()) {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const docs = getLocalItem('documents', [])
  const index = docs.findIndex(d => d.id === documentId)
  if (index === -1) throw new Error('Document not found')
  docs[index] = {
    ...docs[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  setLocalItem('documents', docs)
  return docs[index]
}

export async function deleteDocument(documentId, filePath) {
  if (isUsingLiveSupabase()) {
    if (filePath) {
      await supabase.storage.from('vehicle-documents').remove([filePath])
    }
    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) throw error
    return true
  }
  const docs = getLocalItem('documents', []).filter(d => d.id !== documentId)
  setLocalItem('documents', docs)
  return true
}

// -------------------------------------------------------------
// TIMELINE COMPILER
// Combines vehicle events chronologically
// -------------------------------------------------------------
export async function getVehicleTimeline(vehicleId) {
  const [services, fuelLogs, expenses, reminders, documents] = await Promise.all([
    getServices(vehicleId),
    getFuelLogs(vehicleId),
    getExpenses(vehicleId),
    getReminders(vehicleId),
    getDocuments(vehicleId),
  ])

  const events = []

  // Add services
  services.forEach(s => {
    events.push({
      id: `timeline-srv-${s.id}`,
      type: 'service',
      date: s.date,
      title: s.service_type,
      subtitle: s.garage ? `At ${s.garage}` : 'Service completed',
      cost: s.cost,
      odometer: s.odometer,
      notes: s.notes,
      raw: s,
    })
  })

  // Add fuel logs
  fuelLogs.forEach(f => {
    events.push({
      id: `timeline-fuel-${f.id}`,
      type: 'fuel',
      date: f.date,
      title: `Fuel Refill (${f.litres} L)`,
      subtitle: f.price_per_litre ? `@ $${f.price_per_litre}/L` : 'Full tank fill',
      cost: f.total_cost,
      odometer: f.odometer,
      notes: f.notes,
      raw: f,
    })
  })

  // Add standalone expenses (non-fuel and non-service)
  expenses.filter(e => e.reference_type === 'standalone').forEach(e => {
    events.push({
      id: `timeline-exp-${e.id}`,
      type: 'expense',
      date: e.date,
      title: `${e.category}: ${e.description || 'General expense'}`,
      subtitle: e.category,
      cost: e.amount,
      raw: e,
    })
  })

  // Add completed reminders
  reminders.filter(r => r.is_completed && r.completed_date).forEach(r => {
    events.push({
      id: `timeline-rem-${r.id}`,
      type: 'reminder',
      date: r.completed_date,
      title: `Completed: ${r.title}`,
      subtitle: `Scheduled maintenance fulfilled`,
      notes: r.notes,
      raw: r,
    })
  })

  // Add documents uploaded
  documents.forEach(d => {
    events.push({
      id: `timeline-doc-${d.id}`,
      type: 'document',
      date: d.created_at ? d.created_at.split('T')[0] : '2026-01-01',
      title: `Document Uploaded: ${d.name}`,
      subtitle: d.type,
      notes: d.expiry_date ? `Valid until ${d.expiry_date}` : null,
      raw: d,
    })
  })

  // Sort descending by date
  events.sort((a, b) => new Date(b.date) - new Date(a.date))
  return events
}

// -------------------------------------------------------------
// HELPERS & SAMPLE SEED DATA
// -------------------------------------------------------------
async function autoUpdateVehicleOdometer(vehicleId, newOdometer) {
  const odo = Number(newOdometer)
  if (!odo || isNaN(odo)) return

  if (isUsingLiveSupabase()) {
    const { data: v } = await supabase.from('vehicles').select('current_odometer').eq('id', vehicleId).single()
    if (v && odo > Number(v.current_odometer || 0)) {
      await supabase.from('vehicles').update({ current_odometer: odo }).eq('id', vehicleId)
    }
    return
  }

  const vehicles = getLocalItem('vehicles', [])
  const idx = vehicles.findIndex(v => v.id === vehicleId)
  if (idx !== -1 && odo > Number(vehicles[idx].current_odometer || 0)) {
    vehicles[idx].current_odometer = odo
    setLocalItem('vehicles', vehicles)
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

/**
 * Seed realistic demonstration data for Car & Motorcycle
 */
export async function seedSampleData(userId) {
  // 1. Create a Car
  const car = await createVehicle(userId, {
    name: 'Honda Civic Touring',
    type: 'car',
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    license_plate: 'CA-792-KT',
    vin: '1HGCR2F83HA019284',
    fuel_type: 'Petrol',
    current_odometer: 28450,
    insurance_provider: 'Geico Direct',
    insurance_policy_no: 'POL-99201-US',
    insurance_expiry: '2026-11-20', // Due in ~1 month
    puc_number: 'EM-882910',
    puc_expiry: '2026-10-25', // Due in 10 days
    notes: 'Primary daily commuter. Synthetic oil 0W-20.',
  })

  // 2. Create a Motorcycle
  const bike = await createVehicle(userId, {
    name: 'Yamaha MT-07 Dark Stealth',
    type: 'motorcycle',
    make: 'Yamaha',
    model: 'MT-07',
    year: 2023,
    license_plate: 'MOTO-449',
    vin: 'JYARN37E5LA001249',
    fuel_type: 'Petrol',
    current_odometer: 11200,
    insurance_provider: 'Progressive Moto',
    insurance_policy_no: 'MC-55910',
    insurance_expiry: '2027-04-15',
    puc_number: 'EM-992144',
    puc_expiry: '2027-03-30',
    notes: 'Weekend canyon cruiser. Chain cleaned every 800 km.',
  })

  // Add Service Records for Car
  await createService(userId, car.id, {
    date: '2026-06-15',
    odometer: 22000,
    service_type: 'Major 20k Scheduled Service',
    garage: 'Honda Authorized Center',
    cost: 320,
    notes: 'Replaced engine oil, oil filter, cabin air filter, and brake inspection.',
    next_due_odometer: 32000,
    next_due_date: '2027-06-15',
  })

  await createService(userId, car.id, {
    date: '2026-09-02',
    odometer: 26500,
    service_type: 'Front Brake Pads & Rotor Resurfacing',
    garage: 'Precision Auto Tech',
    cost: 185,
    notes: 'Ceramic brake pads installed. Excellent bite.',
  })

  // Add Fuel Logs for Car (Generates consecutive fuel efficiency)
  await createFuelLog(userId, car.id, {
    date: '2026-08-14',
    odometer: 27100,
    litres: 42.5,
    total_cost: 65.8,
    is_full_tank: true,
  })

  await createFuelLog(userId, car.id, {
    date: '2026-08-28',
    odometer: 27720, // 620 km on 40 L = 15.5 km/L
    litres: 40.0,
    total_cost: 62.0,
    is_full_tank: true,
  })

  await createFuelLog(userId, car.id, {
    date: '2026-09-18',
    odometer: 28350, // 630 km on 41.2 L = 15.29 km/L
    litres: 41.2,
    total_cost: 63.9,
    is_full_tank: true,
  })

  // Add Standalone Expenses for Car
  await createExpense(userId, car.id, {
    category: 'Insurance',
    amount: 580,
    date: '2025-11-20',
    description: 'Annual Comprehensive Policy Renewal',
  })

  await createExpense(userId, car.id, {
    category: 'Wash & Detailing',
    amount: 45,
    date: '2026-09-25',
    description: 'Interior steam clean and ceramic foam wash',
  })

  await createExpense(userId, car.id, {
    category: 'Tolls & Parking',
    amount: 30,
    date: '2026-10-02',
    description: 'Express highway monthly toll pass',
  })

  // Add Reminders for Car
  await createReminder(userId, car.id, {
    title: 'PUC / Emission Renewal Test',
    category: 'puc',
    due_date: '2026-10-25',
    notes: 'Mandatory annual emission inspection at nearby authorized station.',
  })

  await createReminder(userId, car.id, {
    title: '30,000 km Tire Rotation & Wheel Alignment',
    category: 'service',
    due_odometer: 30000,
    due_date: '2026-12-15',
    notes: 'Rotate tires front-to-back cross pattern.',
  })

  await createReminder(userId, car.id, {
    title: 'Comprehensive Insurance Renewal',
    category: 'insurance',
    due_date: '2026-11-20',
    notes: 'Compare no-claim bonus quotes before renewal.',
  })

  // Add Records for Motorcycle
  await createService(userId, bike.id, {
    date: '2026-07-10',
    odometer: 9500,
    service_type: 'Motul 7100 10W-40 Synthetic Oil & Filter',
    garage: 'Apex Moto Workshop',
    cost: 110,
    notes: 'Drive chain adjusted and lubricated with Motul chain paste.',
  })

  await createFuelLog(userId, bike.id, {
    date: '2026-09-10',
    odometer: 10800,
    litres: 12.5,
    total_cost: 21.5,
    is_full_tank: true,
  })

  await createFuelLog(userId, bike.id, {
    date: '2026-09-28',
    odometer: 11150, // 350 km on 13.0 L = 26.92 km/L
    litres: 13.0,
    total_cost: 22.3,
    is_full_tank: true,
  })

  await createReminder(userId, bike.id, {
    title: 'Spark Plugs & Valve Clearance Inspection',
    category: 'service',
    due_odometer: 15000,
    due_date: '2027-02-15',
    notes: 'Yamaha factory service schedule checkpoint.',
  })

  return { car, bike }
}

/**
 * Synchronize all local fleet records (vehicles, services, fuel logs, expenses, reminders)
 * to live Supabase PostgreSQL for the current authenticated user.
 */
export async function syncLocalDataToSupabase(userId) {
  if (!isUsingLiveSupabase() || !userId) {
    throw new Error('Supabase live mode and authenticated user session required to sync.')
  }

  const localVehicles = getLocalItem('vehicles', [])
  if (!localVehicles || localVehicles.length === 0) {
    return { syncedVehicles: 0, syncedRecords: 0, message: 'No local vehicles found to sync.' }
  }

  let syncedVehicles = 0
  let syncedRecords = 0

  for (const localVeh of localVehicles) {
    // 1. Create vehicle in Supabase
    const newVeh = await createVehicle(userId, localVeh)
    if (!newVeh || !newVeh.id) continue
    syncedVehicles++

    const oldVehId = localVeh.id

    // 2. Sync services for this vehicle
    const localServices = getLocalItem('services', []).filter(s => s.vehicle_id === oldVehId)
    for (const s of localServices) {
      await createService(userId, newVeh.id, s)
      syncedRecords++
    }

    // 3. Sync fuel logs
    const localFuel = getLocalItem('fuel_logs', []).filter(f => f.vehicle_id === oldVehId)
    for (const f of localFuel) {
      await createFuelLog(userId, newVeh.id, f)
      syncedRecords++
    }

    // 4. Sync standalone expenses
    const localExpenses = getLocalItem('expenses', []).filter(
      e => e.vehicle_id === oldVehId && e.reference_type === 'standalone'
    )
    for (const exp of localExpenses) {
      await createExpense(userId, newVeh.id, exp)
      syncedRecords++
    }

    // 5. Sync reminders
    const localReminders = getLocalItem('reminders', []).filter(r => r.vehicle_id === oldVehId)
    for (const rem of localReminders) {
      await createReminder(userId, newVeh.id, rem)
      syncedRecords++
    }
  }

  return {
    syncedVehicles,
    syncedRecords,
    message: `Successfully synchronized ${syncedVehicles} vehicles and ${syncedRecords} records to Supabase!`,
  }
}

/**
 * Clear all local user records (allows testing clean empty states)
 */
export async function clearAllLocalData() {
  const keys = ['vehicles', 'services', 'fuel_logs', 'expenses', 'reminders', 'documents']
  keys.forEach(k => getStorage().removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${k}`))
}
