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

        {/* Email Capture */}
        <div className="pt-24 mb-28 animate-fade-in-delay-4">
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
                  className="flex-1 px-8 py-3.5 text-lg bg-transparent border border-[var(--color-text-secondary)]/20 rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)]/50 transition-all disabled:opacity-50"
                  style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '14px', paddingBottom: '14px' }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-12 py-3 text-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold rounded-md hover:bg-[var(--color-accent-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                  style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                >
                  {status === 'loading' ? 'Joining...' : 'I want this'}
                </button>
              </div>
              {errorMessage && (
                <p className="text-sm text-[var(--color-accent)]">{errorMessage}</p>
              )}
            </form>
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
