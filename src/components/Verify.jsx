import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase'
import { track } from '../lib/posthog'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, email, password, devCode: initialDevCode } = location.state || {}

  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendStatus, setResendStatus] = useState('idle')
  const [resendError, setResendError] = useState('')
  const [devCode, setDevCode] = useState(initialDevCode || '')

  useEffect(() => {
    if (!phone || !email || !password) {
      navigate('/signup', { replace: true })
    }
  }, [phone, email, password, navigate])

  useEffect(() => {
    if (initialDevCode) setDevCode(initialDevCode)
  }, [initialDevCode])

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setErrorMessage('Please enter the 6-digit code')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/auth-verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          phone,
          email,
          password,
          code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Invalid or expired code')
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        track('user_signed_up', { source: 'signup' })
      }

      navigate('/onboarding', { replace: true })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message || 'Invalid code. Please try again.')
    }
  }

  if (!phone) return null

  return (
    <div className="verify-page">
      <div className="verify-content">
        <Link
          to="/signup"
          className="verify-back text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-sm"
        >
          ← Back
        </Link>

        <h1 className="verify-title" style={{ fontFamily: 'var(--font-display)' }}>
          Enter verification code
        </h1>
        <p className="verify-subtitle">
          We sent a 6-digit code to {phone}. Enter it below.
        </p>

        {devCode && (
          <div
            className="p-4 rounded-lg border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
            style={{ marginBottom: '1.5rem' }}
          >
            <p className="text-sm font-medium text-[var(--color-accent)] mb-1">
              Dev mode: Your code is
            </p>
            <p className="text-2xl font-mono tracking-widest">{devCode}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              disabled={status === 'loading'}
              autoFocus
              maxLength={6}
              className="verify-code-input"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-[var(--color-accent)]" style={{ marginBottom: '1.5rem' }}>
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="signup-cta"
          >
            {status === 'loading' ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Didn't get the code?{' '}
          <button
            type="button"
            disabled={resendStatus === 'loading'}
            onClick={async () => {
              setResendError('')
              setResendStatus('loading')
              const isDev = import.meta.env.DEV
              try {
                const res = await fetch(`${supabaseUrl}/functions/v1/auth-send-otp`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    ...(isDev && { 'X-Dev-Mode': 'true' }),
                  },
                  body: JSON.stringify({ phone, email, password }),
                })
                const data = await res.json()
                if (res.ok) {
                  setResendStatus('success')
                  if (data.devCode) setDevCode(data.devCode)
                  setTimeout(() => setResendStatus('idle'), 3000)
                } else {
                  setResendStatus('error')
                  setResendError(data.error || 'Failed to resend code')
                }
              } catch (err) {
                setResendStatus('error')
                setResendError('Failed to resend. Please try again.')
              }
            }}
            className="text-[var(--color-accent)] hover:underline disabled:opacity-50"
          >
            {resendStatus === 'loading' ? 'Sending...' : resendStatus === 'success' ? 'Sent!' : 'Resend'}
          </button>
        </p>
        {resendError && (
          <p className="mt-3 text-sm text-[var(--color-accent)]">{resendError}</p>
        )}
      </div>
    </div>
  )
}
