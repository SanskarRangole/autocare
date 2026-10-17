import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Mail, Lock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react'

export function AuthModal({ isOpen, onClose }) {
  const { signIn, signUp, signInDemo, resetPassword, isLiveDatabase } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        await signIn({ email, password })
        onClose()
      } else if (tab === 'register') {
        await signUp({ email, password, fullName })
        onClose()
      } else if (tab === 'forgot') {
        const res = await resetPassword(email)
        setSuccessMessage(res?.message || 'Password reset link sent to your email address.')
      }
    } catch (err) {
      const msg = err?.message || 'An error occurred during authentication.'
      if (msg.includes('already exists') || msg.includes('already registered')) {
        setTab('login')
        setError('This email is already registered in Supabase. We switched you to Sign In — please enter your password.')
      } else if (msg.includes('haven\'t registered yet') || msg.includes('switch to the "Create Account" tab')) {
        setTab('register')
        setError('No account found for this email. We switched you to Register — please enter your details.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInDemo()
      onClose()
    } catch (err) {
      setError(err?.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tab === 'login'
          ? 'Sign In to AutoCare'
          : tab === 'register'
          ? 'Create your AutoCare Account'
          : 'Reset Password'
      }
      description={
        tab === 'login'
          ? 'Access your vehicle records, service logs, and maintenance alerts.'
          : tab === 'register'
          ? 'Start managing your car and motorcycle ownership history.'
          : 'Enter your registered email to receive a password reset link.'
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-800 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="flex-1 font-medium">{error}</p>
            </div>
            {error.includes('Sign In') && tab === 'register' && (
              <button
                type="button"
                onClick={() => {
                  setTab('login')
                  setError(null)
                }}
                className="self-start text-[11px] font-bold text-[#2563EB] underline hover:text-[#1D4ED8]"
              >
                Switch to Sign In →
              </button>
            )}
            {error.includes('Create Account') && tab === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setTab('register')
                  setError(null)
                }}
                className="self-start text-[11px] font-bold text-[#2563EB] underline hover:text-[#1D4ED8]"
              >
                Switch to Register →
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
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

          {tab !== 'forgot' && (
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />
          )}

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" className="w-full font-semibold" loading={loading}>
              {tab === 'login' ? 'Sign In to Dashboard' : tab === 'register' ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </div>
        </form>

        {/* Quick Demo Sign In Button */}
        <div className="pt-3 border-t border-[#F1F5F9]">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full text-xs font-semibold text-[#17365D] bg-[#EFF6FF] border-[#BFDBFE] hover:bg-[#DBEAFE]"
            onClick={handleDemoSignIn}
            disabled={loading}
          >
            <Zap className="w-4 h-4 mr-1.5 text-[#2563EB] fill-[#2563EB]" />
            Quick Demo Login (Preloaded Vehicles & Data)
          </Button>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
          {tab === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setTab('login')
                setError(null)
                setSuccessMessage(null)
              }}
              className="text-[#2563EB] font-semibold hover:underline"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setTab('forgot')
                  setError(null)
                }}
                className="text-[#64748B] hover:text-[#0F172A] hover:underline"
              >
                Forgot password?
              </button>
              <span>
                {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
                <button
                  type="button"
                  onClick={() => {
                    setTab(tab === 'login' ? 'register' : 'login')
                    setError(null)
                  }}
                  className="text-[#2563EB] font-bold hover:underline"
                >
                  {tab === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </span>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
