import { useState } from 'react'
import { track } from '../lib/posthog'
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase'

const WAITLIST_QUESTIONS = [
  { id: 'in_us', type: 'chips', question: 'Are you in the US?', options: ['Yes', 'No'], values: ['yes', 'no'] },
  {
    id: 'date_frequency',
    type: 'chips',
    question: 'How often do you like to go on dates?',
    options: ['Weekly', 'Every 2 weeks', 'Monthly', 'A few times a year'],
    values: ['weekly', 'biweekly', 'monthly', 'few_times_year'],
  },
  {
    id: 'would_pay_amount',
    type: 'chips',
    question: 'If Dateful helped you get reservations at hard to get into spots by watching availability for you, how much would you pay for that?',
    options: ['$5/mo', '$10/mo', '$15/mo', '$20/mo', '$25/mo', '$30/mo', '$50/mo', 'More than $50/mo'],
    values: ['5', '10', '15', '20', '25', '30', '50', '50_plus'],
  },
]

const LINKEDIN_POST_TEXT =
  "Check this project out... Jaryd's building a date night planning assistant that handles personalized date plans and bookings. Just joined the waitlist and following the details of how we're building it. Check it out here: https://www.dateful.chat"

const SHARE_URL = 'https://www.dateful.chat'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [modalStep, setModalStep] = useState(null)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [answers, setAnswers] = useState({ in_us: null, date_frequency: null, would_pay_amount: null })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  const handleJoinSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email')
      return
    }
    setError('')
    setStatus('loading')
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/waitlist-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Something went wrong')
      if (data?.error) throw new Error(data.error)
      track('waitlist_joined', { location: 'landing' })
      setWaitlistEmail(trimmed.toLowerCase())
      setModalStep('questions')
      setEmail('')
      setStatus('idle')
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

  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setSubmitError('')
  }

  const handleSurveySubmit = async () => {
    const inUs = answers.in_us === 'yes' ? true : answers.in_us === 'no' ? false : null
    if (inUs === null || !answers.date_frequency || !answers.would_pay_amount) {
      setSubmitError('Please answer all questions')
      return
    }
    setSubmitError('')
    setSubmitLoading(true)
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/waitlist-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({
          email: waitlistEmail,
          in_us: inUs,
          date_frequency: answers.date_frequency,
          would_pay_amount: answers.would_pay_amount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Something went wrong')
      if (data?.error) throw new Error(data.error)
      track('waitlist_survey_completed', { location: 'landing' })
      setModalStep('thankyou')
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      setSubmitError(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleShareLinkedIn = () => {
    navigator.clipboard.writeText(LINKEDIN_POST_TEXT)
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setCopyFeedback('Post copied! Paste it into LinkedIn.')
    setTimeout(() => setCopyFeedback(''), 3000)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL)
      setCopyFeedback('URL copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch {
      setCopyFeedback('Could not copy')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  const closeModal = () => {
    setModalStep(null)
    setWaitlistEmail('')
    setAnswers({ in_us: null, date_frequency: null, would_pay_amount: null })
    setSubmitError('')
  }

  return (
    <div className="landing-page">
      <main className="py-16 md:py-20">
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
          <h1
            className="text-4xl lowercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            dateful
          </h1>
        </div>

        {/* Headline */}
        <h2
          className="text-5xl md:text-6xl mb-8 leading-tight animate-fade-in-delay-1"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          Date nights, handled.
        </h2>

        {/* Subheadline */}
        <p className="text-[17px] md:text-[19px] text-[var(--color-text-secondary)] mb-28 leading-relaxed animate-fade-in-delay-2">
          For couples who love date nights but hate planning them, Dateful is your personal date night
          assistant that learns what you and your partner love, finds amazing things to do in your
          city, and plans everything for you — so you just show up.
        </p>

        {/* Waitlist CTA */}
        <div className="pt-16 sm:pt-28 mb-28 animate-fade-in-delay-4 mt-12 sm:mt-0">
          <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="waitlist-input flex-1"
              disabled={status === 'loading'}
              autoComplete="email"
            />
            <button type="submit" disabled={status === 'loading'} className="landing-cta whitespace-nowrap">
              {status === 'loading' ? 'Joining...' : 'Join waitlist'}
            </button>
          </form>
          {error && <p className="text-sm text-[var(--color-accent)] mt-2">{error}</p>}
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

      {/* Questions Modal */}
      {modalStep === 'questions' && (
        <div className="waitlist-modal-overlay" onClick={closeModal}>
          <div className="waitlist-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="waitlist-modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>
            <h2 className="waitlist-modal-title">A few quick questions</h2>
            <div className="waitlist-modal-questions">
              {WAITLIST_QUESTIONS.map((q) => (
                <div key={q.id} className="waitlist-modal-question">
                  <label className="waitlist-modal-label">{q.question}</label>
                  <div className="flex flex-wrap" style={{ gap: 'var(--spacing-md)' }}>
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswer(q.id, q.values[i])}
                        className={`onboarding-chip ${answers[q.id] === q.values[i] ? 'onboarding-chip-active' : ''}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {submitError && <p className="text-sm text-[var(--color-accent)] mb-4">{submitError}</p>}
            <button
              type="button"
              onClick={handleSurveySubmit}
              disabled={submitLoading}
              className="onboarding-cta w-full"
            >
              {submitLoading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {modalStep === 'thankyou' && (
        <div className="waitlist-modal-overlay" onClick={closeModal}>
          <div className="waitlist-modal waitlist-modal-thankyou" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="waitlist-modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>
            <h2 className="waitlist-modal-title">Thank you! This is super helpful.</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 pb-4">
              If you like the idea and want to help, feel free to share this on LinkedIn and tag me. —{' '}
              <a
                href="https://www.linkedin.com/in/jaryd-hermann/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Jaryd
              </a>
            </p>

            <div className="waitlist-linkedin-mock">
              <div className="waitlist-linkedin-header">
                <div className="waitlist-linkedin-avatar" />
                <div>
                  <div className="waitlist-linkedin-name">Your Name</div>
                  <div className="waitlist-linkedin-meta">Your headline · 1st</div>
                </div>
              </div>
              <p className="waitlist-linkedin-post">{LINKEDIN_POST_TEXT}</p>
              <div className="waitlist-linkedin-footer">
                <span className="waitlist-linkedin-like">👍 Like</span>
                <span>Comment</span>
                <span>Repost</span>
                <span>Send</span>
              </div>
            </div>

            <div className="waitlist-share-actions">
              <button type="button" onClick={handleShareLinkedIn} className="waitlist-share-btn linkedin">
                Share to LinkedIn
              </button>
              <button type="button" onClick={handleCopyUrl} className="waitlist-share-btn copy">
                Copy URL
              </button>
            </div>
            {copyFeedback && (
              <p className="text-sm text-[var(--color-accent)] mt-2">{copyFeedback}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
