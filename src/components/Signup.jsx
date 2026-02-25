import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { track } from '../lib/posthog'
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const COUNTRY_CODES = [
    { code: '+1', label: 'US', dialLen: 10 },
    { code: '+44', label: 'UK', dialLen: 10 },
    { code: '+61', label: 'AU', dialLen: 9 },
    { code: '+49', label: 'DE', dialLen: 10 },
    { code: '+33', label: 'FR', dialLen: 9 },
  ]

  const formatPhone = (value, maxLen = 10) => {
    const digits = value.replace(/\D/g, '').slice(0, maxLen)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const currentConfig = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0]
  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value, currentConfig.dialLen))
    setErrorMessage('')
  }

  const toE164 = (phone, code = countryCode) => {
    const digits = phone.replace(/\D/g, '')
    const config = COUNTRY_CODES.find((c) => c.code === code) || COUNTRY_CODES[0]
    if (digits.length >= config.dialLen) {
      return `${code}${digits.slice(0, config.dialLen)}`
    }
    return null
  }

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validatePassword = (p) => p.length >= 6

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
      const e164Phone = toE164(phone, countryCode)

    if (!trimmedEmail || !e164Phone || !password) {
      setErrorMessage('Please fill in all fields')
      setStatus('error')
      return
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email')
      setStatus('error')
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage('Password must be at least 6 characters')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const isDev = import.meta.env.DEV
      const res = await fetch(`${supabaseUrl}/functions/v1/auth-send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          ...(isDev && { 'X-Dev-Mode': 'true' }),
        },
        body: JSON.stringify({ phone: e164Phone, email: trimmedEmail, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code')
      }

      track('otp_sent', { source: 'signup' })
      navigate('/verify', {
        state: {
          phone: e164Phone,
          email: trimmedEmail,
          password,
          countryCode,
          devCode: data.devCode,
        },
      })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-content">
        <Link
          to="/"
          className="signup-back text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-sm"
        >
          ← Back
        </Link>
        <h1 className="signup-title" style={{ fontFamily: 'var(--font-display)' }}>
          Create your account
        </h1>
        <p className="signup-subtitle">
          We'll text you a code to verify your phone number.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="signup-field">
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMessage('')
              }}
              placeholder="you@example.com"
              disabled={status === 'loading'}
              autoComplete="email"
              className="signup-input"
            />
          </div>

          <div className="signup-field">
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Phone number
            </label>
            <div className="signup-phone-row">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="signup-country-select"
                disabled={status === 'loading'}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
              disabled={status === 'loading'}
              autoComplete="tel"
                className="signup-phone-input"
              />
            </div>
          </div>

          <div className="signup-field">
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorMessage('')
              }}
              placeholder="At least 6 characters"
              disabled={status === 'loading'}
              autoComplete="new-password"
              className="signup-input"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-[var(--color-accent)] mb-6">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="signup-cta"
          >
            {status === 'loading' ? 'Sending code...' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-accent)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
