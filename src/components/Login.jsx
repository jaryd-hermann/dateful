import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { track } from '../lib/posthog'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter email and password')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) throw error

      track('user_logged_in')

      const { data: profile } = await supabase
        .from('users')
        .select('couple_id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      navigate(profile?.couple_id ? '/chat' : '/onboarding', { replace: true })
    } catch (err) {
      setStatus('error')
      const msg = err?.message || ''
      setErrorMessage(
        msg.includes('Invalid login') || msg.includes('invalid') || msg.includes('credentials')
          ? 'Invalid email or password'
          : msg || 'Something went wrong'
      )
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
          Log in
        </h1>
        <p className="signup-subtitle">
          Enter your email and password to continue.
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
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorMessage('')
              }}
              placeholder="Your password"
              disabled={status === 'loading'}
              autoComplete="current-password"
              className="signup-input"
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
            {status === 'loading' ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[var(--color-accent)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
