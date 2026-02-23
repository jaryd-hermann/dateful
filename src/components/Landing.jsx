import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error' | 'duplicate'
  const [errorMessage, setErrorMessage] = useState('')

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email')
      setStatus('error')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmedEmail })

    if (error) {
      if (error.code === '23505') {
        // Unique violation — duplicate email
        setStatus('duplicate')
      } else {
        setStatus('error')
        setErrorMessage('Something went wrong. Please try again.')
      }
    } else {
      setStatus('success')
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <main className="w-full max-w-[520px] px-6 py-16 md:py-20">
        {/* Logo / Wordmark */}
        <div className="mb-16 animate-fade-in">
          <h1 className="text-4xl lowercase tracking-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            dateful
          </h1>
        </div>

        {/* Headline */}
        <h2 className="text-5xl md:text-6xl mb-8 leading-tight animate-fade-in-delay-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Date nights, handled.
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mb-16 leading-relaxed animate-fade-in-delay-2">
          Dateful is your personal date night assistant. It learns what you and your partner love, finds amazing things to do in your city, and plans everything for you — so you just show up.
        </p>

        {/* How It Works */}
        <div className="mb-20 space-y-10 animate-fade-in-delay-3">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tell us what you're into</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              You answer a few quick questions about what you enjoy, your budget, and when you like to go out.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">We plan, you approve</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              A few days before date night, we text you a personalized plan. Love it? Confirm. Want changes? Just tell us.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Show up and enjoy</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              We handle the details — booking links, calendar invites, and all the logistics. You just have a great night.
            </p>
          </div>
        </div>

        {/* Email Capture */}
        <div className="pt-16 mb-28 animate-fade-in-delay-4">
          {status === 'success' ? (
            <div className="text-center py-4">
              <p className="text-lg text-[var(--color-accent)]">You're in! We'll be in touch soon.</p>
            </div>
          ) : status === 'duplicate' ? (
            <div className="text-center py-4">
              <p className="text-lg text-[var(--color-accent)]">Looks like you're already on the list!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setStatus('idle')
                    setErrorMessage('')
                  }}
                  placeholder="Enter your email"
                  disabled={status === 'loading'}
                  autoFocus
                  className="flex-1 px-6 py-5 text-lg bg-transparent border border-[var(--color-text-secondary)]/20 rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)]/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-10 py-5 text-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold rounded-md hover:bg-[var(--color-accent-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                >
                  {status === 'loading' ? 'Joining...' : 'Join the Waitlist'}
                </button>
              </div>
              {errorMessage && (
                <p className="text-sm text-[var(--color-accent)]">{errorMessage}</p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-12 text-center space-y-4 animate-fade-in-delay-5">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Made in NYC, for couples who love date nights but hate planning them.
          </p>
          <a 
            href="https://www.the-diff.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-4"
          >
            follow along as I build this
          </a>
        </footer>
      </main>
    </div>
  )
}
