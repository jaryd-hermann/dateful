import { useState } from 'react'
import { track } from '../lib/posthog'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email')
      return
    }
    setError('')
    setStatus('loading')
    try {
      const { data, error } = await supabase.functions.invoke('waitlist-join', {
        body: { email: trimmed },
      })
      if (error) throw new Error(error.message || 'Something went wrong')
      if (data?.error) throw new Error(data.error)
      track('waitlist_joined', { location: 'landing' })
      setStatus('success')
      setEmail('')
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      const isNetwork = msg === 'Failed to fetch' || msg.includes('NetworkError')
      const is401 = msg.includes('401') || msg.toLowerCase().includes('unauthorized')
      const display = isNetwork
        ? 'Connection failed. Please try again.'
        : is401
          ? 'Configuration error. Please try again later.'
          : msg
      setError(display)
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-6">
      <main className="w-full max-w-[520px] py-16 md:py-20">
        {/* Header Image */}
        <div className="mb-28 animate-fade-in">
          <img 
            src="/toast-header.png" 
            alt="Couple toasting" 
            className="max-w-[92px] md:max-w-[115px]"
            style={{ mixBlendMode: 'normal' }}
          />
        </div>

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
        <p className="text-[17px] md:text-[19px] text-[var(--color-text-secondary)] mb-28 leading-relaxed animate-fade-in-delay-2">
          For couples who love date nights but hate planning them, Dateful is your personal date night assistant that learns what you and your partner love, finds amazing things to do in your city, and plans everything for you — so you just show up.
        </p>

        {/* Waitlist CTA */}
        <div className="pt-24 mb-28 animate-fade-in-delay-4">
          {status === 'success' ? (
            <p className="text-lg text-[var(--color-accent)] font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              You&apos;re on the list! We&apos;ll be in touch soon.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="waitlist-input flex-1"
                disabled={status === 'loading'}
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="landing-cta whitespace-nowrap"
              >
                {status === 'loading' ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>
          )}
          {error && (
            <p className="text-sm text-[var(--color-accent)] mt-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-12 text-center animate-fade-in-delay-5">
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
