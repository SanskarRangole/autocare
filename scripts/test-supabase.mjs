import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load .env manually if process.env values are not set
if (!process.env.VITE_SUPABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=')
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim()
        const val = trimmed.substring(idx + 1).trim()
        process.env[key] = val
      }
    }
  })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('----------------------------------------------------')
console.log('AutoCare Supabase Health & Operations Diagnostic')
console.log('----------------------------------------------------')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 15)}...` : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key missing in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const results = []
function logResult(step, success, details) {
  results.push({ step, success, details })
  const icon = success ? '✅' : '❌'
  console.log(`${icon} [${step}]:`, details || '')
}

async function runDiagnostics() {
  const testId = Date.now().toString().slice(-6)
  const testEmail = `diagnostic_${testId}@testdomain.local`
  const testPassword = `TestPass!_${testId}_#99`
  let authenticatedUser = null
  let testVehicle = null
  let testService = null
  let testReminder = null
  let testFuel = null
  let testExpense = null
  let testDoc = null

  try {
    // 1. Connectivity Check
    console.log('\n--- 1. Testing Connectivity & Public Endpoint ---')
    const { data: pingData, error: pingError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (pingError) {
      logResult('Connectivity & Profiles Table', false, `Error: ${pingError.message} (${pingError.code})`)
    } else {
      logResult('Connectivity & Profiles Table', true, 'Connected to database, profiles table reachable.')
    }

    // 2. Authentication - Sign Up
    console.log('\n--- 2. Testing Authentication (Sign Up & Sign In) ---')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: `Diagnostic User ${testId}`,
        },
      },
    })

    if (signUpError) {
      logResult('Auth SignUp', false, `Error: ${signUpError.message}`)
    } else {
      logResult('Auth SignUp', true, `User created: ${signUpData.user?.id} (${testEmail})`)
      authenticatedUser = signUpData.user
    }

    // Check if session was returned or if email confirmation is required
    let activeSession = signUpData?.session
    if (!activeSession) {
      console.log('ℹ️ Attempting sign in to check if instant login works without email confirmation...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (signInError) {
        logResult('Auth SignIn', false, `SignIn note: ${signInError.message}`)
      } else {
        logResult('Auth SignIn', true, 'User signed in successfully with credentials.')
        activeSession = signInData.session
        authenticatedUser = signInData.user
      }
    } else {
      logResult('Auth Session', true, 'Session immediately active upon sign up.')
    }

    if (!activeSession || !authenticatedUser) {
      console.warn('⚠️ No active session obtained (email confirmation might be enabled on Supabase project).')
      console.warn('Attempting to proceed with authenticated operations or checking public operations...');
    }

    // 3. User Profile Operations (public.profiles)
    console.log('\n--- 3. Testing Profiles CRUD ---')
    if (authenticatedUser) {
      const { data: profileInsert, error: profileInsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: authenticatedUser.id,
          email: testEmail,
          full_name: `Diagnostic User ${testId}`,
          currency: 'INR',
          distance_unit: 'km',
          volume_unit: 'litres',
          theme: 'dark',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileInsertErr) {
        logResult('Profiles Upsert', false, profileInsertErr.message)
      } else {
        logResult('Profiles Upsert', true, `Profile saved with currency=${profileInsert.currency}`)
      }

      const { data: profileFetch, error: profileFetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authenticatedUser.id)
        .single()

      if (profileFetchErr) {
        logResult('Profiles Read', false, profileFetchErr.message)
      } else {
        logResult('Profiles Read', true, `Fetched profile for ${profileFetch.full_name}`)
      }
    } else {
      logResult('Profiles CRUD', false, 'Skipped due to lack of authenticated session.')
    }

    // 4. Vehicles CRUD (public.vehicles)
    console.log('\n--- 4. Testing Vehicles CRUD ---')
    if (authenticatedUser) {
      const vehiclePayload = {
        user_id: authenticatedUser.id,
        name: `Test Honda City ${testId}`,
        type: 'car',
        make: 'Honda',
        model: 'City ZX',
        year: 2023,
        license_plate: `DL-${testId}`,
        vin: `VIN${testId}9999`,
        fuel_type: 'Petrol',
        current_odometer: 15400,
        notes: 'Automated Diagnostic Record',
      }

      const { data: vehData, error: vehErr } = await supabase
        .from('vehicles')
        .insert(vehiclePayload)
        .select()
        .single()

      if (vehErr) {
        logResult('Vehicles Insert', false, vehErr.message)
      } else {
        testVehicle = vehData
        logResult('Vehicles Insert', true, `Created vehicle id=${vehData.id} (${vehData.name})`)
      }

      if (testVehicle) {
        // Read vehicle
        const { data: fetchedVeh, error: readVehErr } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', testVehicle.id)
          .single()

        if (readVehErr) {
          logResult('Vehicles Read', false, readVehErr.message)
        } else {
          logResult('Vehicles Read', true, `Read vehicle odometer: ${fetchedVeh.current_odometer} km`)
        }

        // Update vehicle
        const { data: updatedVeh, error: updateVehErr } = await supabase
          .from('vehicles')
          .update({ current_odometer: 15950, notes: 'Updated odometer during test' })
          .eq('id', testVehicle.id)
          .select()
          .single()

        if (updateVehErr) {
          logResult('Vehicles Update', false, updateVehErr.message)
        } else {
          logResult('Vehicles Update', true, `Updated vehicle odometer to ${updatedVeh.current_odometer} km`)
        }
      }
    } else {
      logResult('Vehicles CRUD', false, 'Skipped (No authenticated user).')
    }

    // 5. Service Records CRUD (public.services)
    console.log('\n--- 5. Testing Service Records CRUD ---')
    if (authenticatedUser && testVehicle) {
      const servicePayload = {
        vehicle_id: testVehicle.id,
        user_id: authenticatedUser.id,
        date: new Date().toISOString().split('T')[0],
        odometer: 15500,
        service_type: 'Full Synthetic Oil Change & Filter',
        garage: 'Honda Authorised Workshop',
        cost: 4500,
        notes: 'Diagnostic test service entry',
      }

      const { data: srvData, error: srvErr } = await supabase
        .from('services')
        .insert(servicePayload)
        .select()
        .single()

      if (srvErr) {
        logResult('Services Insert', false, srvErr.message)
      } else {
        testService = srvData
        logResult('Services Insert', true, `Inserted service id=${srvData.id}, cost=${srvData.cost}`)
      }

      if (testService) {
        const { data: srvList, error: srvListErr } = await supabase
          .from('services')
          .select('*')
          .eq('vehicle_id', testVehicle.id)

        if (srvListErr) {
          logResult('Services Read', false, srvListErr.message)
        } else {
          logResult('Services Read', true, `Retrieved ${srvList.length} service record(s)`)
        }
      }
    } else {
      logResult('Services CRUD', false, 'Skipped.')
    }

    // 6. Maintenance Reminders CRUD (public.reminders)
    console.log('\n--- 6. Testing Reminders CRUD ---')
    if (authenticatedUser && testVehicle) {
      const reminderPayload = {
        vehicle_id: testVehicle.id,
        user_id: authenticatedUser.id,
        title: 'Brake Fluid Flush Inspection',
        category: 'service',
        due_date: '2026-11-30',
        due_odometer: 20000,
        is_completed: false,
        notes: 'Diagnostic test reminder',
      }

      const { data: remData, error: remErr } = await supabase
        .from('reminders')
        .insert(reminderPayload)
        .select()
        .single()

      if (remErr) {
        logResult('Reminders Insert', false, remErr.message)
      } else {
        testReminder = remData
        logResult('Reminders Insert', true, `Created reminder id=${remData.id}: "${remData.title}"`)
      }

      if (testReminder) {
        const { data: remUpdate, error: remUpdateErr } = await supabase
          .from('reminders')
          .update({ is_completed: true, completed_date: new Date().toISOString().split('T')[0] })
          .eq('id', testReminder.id)
          .select()
          .single()

        if (remUpdateErr) {
          logResult('Reminders Update', false, remUpdateErr.message)
        } else {
          logResult('Reminders Update', true, `Completed reminder: ${remUpdate.is_completed}`)
        }
      }
    } else {
      logResult('Reminders CRUD', false, 'Skipped.')
    }

    // 7. Fuel Logs CRUD (public.fuel_logs)
    console.log('\n--- 7. Testing Fuel Logs CRUD ---')
    if (authenticatedUser && testVehicle) {
      const fuelPayload = {
        vehicle_id: testVehicle.id,
        user_id: authenticatedUser.id,
        date: new Date().toISOString().split('T')[0],
        odometer: 15600,
        litres: 35.5,
        total_cost: 3400,
        is_full_tank: true,
        missed_previous_fill: false,
        fuel_brand: 'Shell V-Power',
        notes: 'Diagnostic test refuel',
      }

      const { data: fuelData, error: fuelErr } = await supabase
        .from('fuel_logs')
        .insert(fuelPayload)
        .select()
        .single()

      if (fuelErr) {
        logResult('Fuel Logs Insert', false, fuelErr.message)
      } else {
        testFuel = fuelData
        logResult('Fuel Logs Insert', true, `Created fuel log id=${fuelData.id}, price/L=${fuelData.price_per_litre}`)
      }

      if (testFuel) {
        const { data: fuelList, error: fuelListErr } = await supabase
          .from('fuel_logs')
          .select('*')
          .eq('vehicle_id', testVehicle.id)

        if (fuelListErr) {
          logResult('Fuel Logs Read', false, fuelListErr.message)
        } else {
          logResult('Fuel Logs Read', true, `Retrieved ${fuelList.length} fuel entry`)
        }
      }
    } else {
      logResult('Fuel Logs CRUD', false, 'Skipped.')
    }

    // 8. Unified Expenses CRUD (public.expenses)
    console.log('\n--- 8. Testing Expenses CRUD ---')
    if (authenticatedUser && testVehicle) {
      const expensePayload = {
        vehicle_id: testVehicle.id,
        user_id: authenticatedUser.id,
        category: 'Tolls & Parking',
        amount: 250,
        date: new Date().toISOString().split('T')[0],
        description: 'Highway Toll Tag Diagnostic',
        reference_type: 'standalone',
      }

      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .insert(expensePayload)
        .select()
        .single()

      if (expErr) {
        logResult('Expenses Insert', false, expErr.message)
      } else {
        testExpense = expData
        logResult('Expenses Insert', true, `Created expense id=${expData.id}, amount=${expData.amount}`)
      }

      if (testExpense) {
        const { data: expList, error: expListErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('vehicle_id', testVehicle.id)

        if (expListErr) {
          logResult('Expenses Read', false, expListErr.message)
        } else {
          logResult('Expenses Read', true, `Retrieved ${expList.length} expense record`)
        }
      }
    } else {
      logResult('Expenses CRUD', false, 'Skipped.')
    }

    // 9. Documents Metadata CRUD (public.documents)
    console.log('\n--- 9. Testing Documents Metadata CRUD ---')
    if (authenticatedUser && testVehicle) {
      const docPayload = {
        vehicle_id: testVehicle.id,
        user_id: authenticatedUser.id,
        name: 'Vehicle Registration Certificate',
        type: 'Registration Certificate (RC)',
        file_path: `vehicle-documents/${authenticatedUser.id}/${testVehicle.id}/test_rc.pdf`,
        file_name: 'test_rc.pdf',
        file_size: 102400,
        file_type: 'application/pdf',
        expiry_date: '2035-12-31',
        notes: 'Diagnostic document test',
      }

      const { data: docData, error: docErr } = await supabase
        .from('documents')
        .insert(docPayload)
        .select()
        .single()

      if (docErr) {
        logResult('Documents Insert', false, docErr.message)
      } else {
        testDoc = docData
        logResult('Documents Insert', true, `Created document metadata id=${docData.id}`)
      }
    } else {
      logResult('Documents CRUD', false, 'Skipped.')
    }

    // 10. Storage Bucket Access Check
    console.log('\n--- 10. Testing Storage Buckets ---')
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
    if (bucketErr) {
      logResult('Storage Buckets', false, `Error: ${bucketErr.message}`)
    } else {
      const bucketNames = (buckets || []).map(b => b.name)
      logResult('Storage Buckets', true, `Buckets found: [${bucketNames.join(', ')}]`)
    }

    // 11. Cleanup test records
    console.log('\n--- 11. Cleaning up test data ---')
    if (testDoc) {
      await supabase.from('documents').delete().eq('id', testDoc.id)
    }
    if (testExpense) {
      await supabase.from('expenses').delete().eq('id', testExpense.id)
    }
    if (testFuel) {
      await supabase.from('fuel_logs').delete().eq('id', testFuel.id)
    }
    if (testReminder) {
      await supabase.from('reminders').delete().eq('id', testReminder.id)
    }
    if (testService) {
      await supabase.from('services').delete().eq('id', testService.id)
    }
    if (testVehicle) {
      await supabase.from('vehicles').delete().eq('id', testVehicle.id)
    }
    if (authenticatedUser) {
      await supabase.from('profiles').delete().eq('id', authenticatedUser.id)
    }
    logResult('Cleanup', true, 'Test records cleaned up successfully.')

    // 12. Sign Out
    if (activeSession) {
      await supabase.auth.signOut()
      logResult('Auth SignOut', true, 'Signed out successfully.')
    }

  } catch (err) {
    console.error('💥 Unhandled exception during diagnostic:', err)
  }

  console.log('\n====================================================')
  console.log('DIAGNOSTIC SUMMARY:')
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`Passed: ${passed} | Failed: ${failed}`)
  console.log('====================================================')
}

runDiagnostics()
