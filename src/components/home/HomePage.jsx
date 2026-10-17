import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../ui/Logo'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  Car,
  Bike,
  Wrench,
  Fuel,
  BellRing,
  PieChart,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Gauge,
  Clock,
  Layers,
} from 'lucide-react'

export function HomePage() {
  const { signIn, signUp, signInDemo } = useAuth()
  const [authTab, setAuthTab] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // On home page mount, ensure any stale offline demo session flag is removed
  React.useEffect(() => {
    try {
      localStorage.removeItem('autocare_auth_mode')
    } catch {
      // ignore
    }
  }, [])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (authTab === 'login') {
        await signIn({ email, password })
      } else {
        await signUp({ email, password, fullName })
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed. Please verify your credentials.'
      if (msg.includes('already exists') || msg.includes('already registered')) {
        setAuthTab('login')
        setError('This email is already registered in Supabase. We switched you to Sign In — please enter your password to continue.')
      } else if (msg.includes('haven\'t registered yet') || msg.includes('switch to the "Create Account" tab')) {
        setAuthTab('register')
        setError('No account found for this email. We switched you to Create Account — please complete registration.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInDemo()
    } catch (err) {
      setError(err?.message || 'Failed to start demo session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#EFF6FF] selection:text-[#17365D]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[76px] flex items-center justify-between">
          <Logo size="md" showTagline={true} />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-[#0F172A] transition-colors">
              Fleet Overview
            </a>
            <a href="#security" className="hover:text-[#0F172A] transition-colors">
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDemoAccess}
              loading={loading}
              className="hidden sm:inline-flex text-xs font-semibold border-[#CBD5E1] text-[#17365D] hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-[#2563EB] fill-[#2563EB]" />
              Instant Demo
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAuthTab('login')
                const el = document.getElementById('auth-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-xs font-semibold px-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#E2E8F0] bg-gradient-to-b from-white via-white to-[#F8FAFC]">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-[#EFF6FF] via-[#F1F5F9] to-amber-50/30 rounded-full blur-3xl -z-10 pointer-events-none opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#17365D]">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Next-Gen Vehicle Ownership & Maintenance</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                Complete Command Over Every{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#17365D] via-[#2563EB] to-[#3B82F6]">
                  Vehicle You Own.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
                Never miss an oil change or insurance renewal again. AutoCare gives car and motorcycle
                owners an ultra-clean, intelligent light-theme command center to track service logs, fuel
                efficiency, documents, and expenses.
              </p>

              {/* Key Highlights List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  'Comprehensive service history & garage records',
                  'Automated km/L economy & full-tank logging',
                  'Proactive insurance, PUC & service alerts',
                  'Zero double-counting expense intelligence',
                  'Secure document vault with signed URLs',
                  'Multi-vehicle support for cars & motorcycles',
                ].map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#334155]">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Trust Badge */}
              <div className="pt-4 flex items-center gap-4 text-xs text-[#64748B]">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Supabase PostgreSQL RLS Protected</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Instant 1-Click Demo Available</span>
                </div>
              </div>
            </div>

            {/* Hero Right Auth Card */}
            <div id="auth-section" className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8 space-y-6 relative">
                {/* Brand Logo Header inside card */}
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/autocare-logo.jpg"
                      alt="AutoCare Logo"
                      className="w-10 h-10 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs"
                    />
                    <div>
                      <div className="text-base font-extrabold text-[#0F172A] leading-tight">
                        AutoCare Portal
                      </div>
                      <div className="text-[10px] font-bold text-[#2563EB] tracking-wider uppercase">
                        AI-Powered Maintenance
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569]">
                    {authTab === 'login' ? 'Sign In' : 'Sign Up'}
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login')
                      setError(null)
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authTab === 'login'
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register')
                      setError(null)
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authTab === 'register'
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-800 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="flex-1 font-medium">{error}</span>
                    </div>
                    {error.includes('Sign In') && authTab === 'register' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login')
                          setError(null)
                        }}
                        className="self-start text-[11px] font-bold text-[#2563EB] underline hover:text-[#1D4ED8]"
                      >
                        Switch to Sign In →
                      </button>
                    )}
                    {error.includes('Create Account') && authTab === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('register')
                          setError(null)
                        }}
                        className="self-start text-[11px] font-bold text-[#2563EB] underline hover:text-[#1D4ED8]"
                      >
                        Switch to Create Account →
                      </button>
                    )}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium">{successMsg}</span>
                  </div>
                )}

                {/* Main Auth Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authTab === 'register' && (
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      icon={User}
                      required
                    />
                  )}

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                    required
                  />

                  <div className="pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full font-semibold shadow-xs"
                      loading={loading}
                    >
                      {authTab === 'login' ? 'Sign In to Dashboard' : 'Create AutoCare Account'}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </form>

                {/* 1-Click Instant Demo Button */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <div className="text-[11px] text-center text-[#64748B] mb-2 font-medium">
                    Want to test without registering?
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full text-xs font-semibold text-[#17365D] bg-[#EFF6FF] border-[#BFDBFE] hover:bg-[#DBEAFE]"
                    onClick={handleDemoAccess}
                    disabled={loading}
                  >
                    <Zap className="w-4 h-4 mr-1.5 text-[#2563EB] fill-[#2563EB]" />
                    Explore Live Demo (Preloaded Vehicles & Data)
                  </Button>
                </div>

                <div className="text-[11px] text-center text-[#94A3B8]">
                  By signing in, you agree to AutoCare's secure data privacy guidelines.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Purpose-Built for Vehicle Enthusiasts & Daily Drivers
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Every feature in AutoCare is designed to replace chaotic spreadsheets, forgotten receipts,
              and glovebox stacks with a unified digital garage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Car,
                title: 'Multi-Vehicle Garage',
                desc: 'Manage your entire personal fleet—cars, motorcycles, scooters, or commercial vehicles—with individual specs and odometers.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Wrench,
                title: 'Service & Maintenance Records',
                desc: 'Log major services, oil changes, tire rotations, and garage notes. Automatically syncs with your expense ledger.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Fuel,
                title: 'Fuel Economy & Mileage',
                desc: 'Track consecutive full-tank refills to calculate accurate km/L and cost-per-kilometer. Never wonder about efficiency drops.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: BellRing,
                title: 'Smart Compliance Reminders',
                desc: 'Proactive countdowns for insurance renewals, PUC emissions, and mileage checkpoints. Stay compliant and penalty-free.',
                color: 'bg-rose-50 text-rose-600',
              },
              {
                icon: FileText,
                title: 'Encrypted Document Vault',
                desc: 'Store vehicle registrations, title cards, insurance certificates, and invoices with secure signed URLs and expiry flags.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: PieChart,
                title: 'Zero Double-Counting Finance',
                desc: 'Visual monthly expenditure charts and category distribution donuts powered by Recharts. Complete ownership transparency.',
                color: 'bg-cyan-50 text-cyan-600',
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#BFDBFE] hover:shadow-md transition-all duration-200 space-y-3"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interactive Fleet Showcase Preview */}
      <section id="preview" className="py-16 sm:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Live Preview</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Sample Fleet Pre-Configured
            </h2>
            <p className="text-xs sm:text-sm text-[#475569]">
              Instant demo comes preloaded with realistic vehicles, maintenance logs, and financial charts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Vehicle 1 Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#0F172A] text-base">2022 Honda Civic Touring</h4>
                    <p className="text-xs text-[#64748B]">Sedan • 1.5L Turbo Petrol</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F8FAFC] rounded-xl text-center">
                <div>
                  <div className="text-[11px] text-[#64748B]">Odometer</div>
                  <div className="text-sm font-bold text-[#0F172A]">28,450 km</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Avg Economy</div>
                  <div className="text-sm font-bold text-[#2563EB]">14.8 km/L</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Next Service</div>
                  <div className="text-sm font-bold text-amber-600">30,000 km</div>
                </div>
              </div>

              <div className="text-xs text-[#475569] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Insurance and emissions active through December 2026</span>
              </div>
            </div>

            {/* Vehicle 2 Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#0F172A] text-base">2023 Yamaha MT-07</h4>
                    <p className="text-xs text-[#64748B]">Motorcycle • 689cc CP2 Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F8FAFC] rounded-xl text-center">
                <div>
                  <div className="text-[11px] text-[#64748B]">Odometer</div>
                  <div className="text-sm font-bold text-[#0F172A]">8,120 km</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Avg Economy</div>
                  <div className="text-sm font-bold text-[#2563EB]">22.4 km/L</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#64748B]">Chain Lube</div>
                  <div className="text-sm font-bold text-emerald-600">Due in 380 km</div>
                </div>
              </div>

              <div className="text-xs text-[#475569] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Castrol Power1 Racing 10W-40 synth verified</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleDemoAccess}
              className="font-semibold shadow-xs px-6"
            >
              <Zap className="w-4 h-4 mr-1.5 fill-white" />
              Launch Interactive Demo Fleet
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section id="security" className="py-12 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#0F172A]">Enterprise-Grade Row Level Security (RLS)</h3>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-2xl mx-auto">
            Your vehicle records, documents, and expense receipts are completely isolated in Supabase
            PostgreSQL using strict RLS policies. No unauthorized tenant or external driver can ever
            access your vehicle telemetry.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <Logo size="sm" showTagline={false} />
          <div className="flex items-center gap-6">
            <span>© {new Date().getFullYear()} AutoCare Inc. All rights reserved.</span>
            <span>•</span>
            <span className="font-semibold text-[#17365D]">AI-Powered Vehicle Maintenance</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
