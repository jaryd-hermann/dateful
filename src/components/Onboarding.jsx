import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { track } from '../lib/posthog'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const PREFERRED_WEEKDAYS_Q = { id: 'preferred_weeknights', type: 'chips', multi: true, question: 'Which weeknights are usually best?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], values: ['monday', 'tuesday', 'wednesday', 'thursday'] }

const QUESTIONS = [
  { id: 'primary_name', type: 'text', question: "What's your first name?", placeholder: 'e.g. Jordan' },
  { id: 'partner_name', type: 'text', question: "What's your partner's first name?", placeholder: "e.g. Alex" },
  { id: 'partner_phone', type: 'phone', optional: true, helperText: 'So we can text you both the plans', placeholder: '(555) 123-4567' },
  { id: 'city', type: 'text', question: 'What city and neighborhood do you live in?', placeholder: 'e.g. Brooklyn, Williamsburg' },
  { id: 'travel_radius', type: 'chips', question: 'How far are you willing to travel for a date?', options: ['Neighborhood only', 'Borough', '30 min', '1 hour'], values: ['neighborhood', 'borough', '30min', '1hour'] },
  { id: 'budget', type: 'chips', question: "What's your typical date night budget?", options: ['$', '$$', '$$$', '$$$$'], values: ['$', '$$', '$$$', '$$$$'] },
  { id: 'frequency', type: 'chips', question: 'How often do you want date nights?', options: ['Weekly', 'Every 2 weeks', 'Monthly'], values: ['weekly', 'biweekly', 'monthly'] },
  { id: 'preferred_days', type: 'chips', multi: true, question: 'What days/times work best?', options: ['Fri evening', 'Sat evening', 'Sat afternoon', 'Sun afternoon', 'Sun evening', 'Weeknight'], values: ['friday_evening', 'saturday_evening', 'saturday_afternoon', 'sunday_afternoon', 'sunday_evening', 'weeknight'], inlineFollowUp: PREFERRED_WEEKDAYS_Q },
  { id: 'preferred_weeknights', type: 'chips', multi: true, question: 'Which weeknights are usually best?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], values: ['monday', 'tuesday', 'wednesday', 'thursday'], conditionalOn: { question: 'preferred_days', hasValue: 'weeknight' } },
  { id: 'interests', type: 'chips', multi: true, question: 'What do you enjoy?', options: ['Trying new restaurants', 'Live music', 'Comedy', 'Outdoors', 'Cooking together', 'Museums & art', 'Cocktail bars', 'Sports', 'Theater', 'Wellness & spa', 'Activities', 'Classes', 'Exploring areas', 'Movies'], values: ['restaurants', 'live_music', 'comedy', 'outdoors', 'cooking', 'museums_art', 'cocktail_bars', 'sports', 'theater', 'wellness_spa', 'activities', 'classes', 'exploring_areas', 'movies'] },
  { id: 'food_dislikes', type: 'text', optional: true, question: 'Any types of food you don\'t like?', placeholder: 'e.g. no seafood, no spicy', conditionalOn: { question: 'interests', hasValue: 'restaurants' } },
  { id: 'dietary_restrictions', type: 'text', question: 'Any dietary restrictions or dealbreakers?', placeholder: 'e.g. vegetarian, no shellfish, or leave blank' },
  { id: 'anything_else', type: 'textarea', optional: true, question: 'Anything else we should know?', placeholder: 'e.g. "We love doing a bite and an activity."', helperText: "Don't worry, we'll figure out what you're into pretty fast too" },
  { id: 'surprise_preference', type: 'chips', question: 'Do you prefer surprises or want to approve every plan?', options: ['Surprise me', 'I want to approve first'], values: ['surprise_me', 'approve_first'] },
  { id: 'preferred_channel', type: 'chips', question: 'Preferred communication?', options: ['SMS', 'WhatsApp'], values: ['sms', 'whatsapp'] },
]

function formatAnswerForDisplay(q, answer) {
  try {
    if (answer == null || answer === '') return '—'
    // Handle JSON-stringified arrays (e.g. from DB or persistence)
    let arr = answer
    if (typeof answer === 'string') {
      if (answer.startsWith('[')) {
        try {
          arr = JSON.parse(answer)
        } catch {
          return answer === '[object Object]' ? '—' : answer
        }
      } else {
        return answer === '[object Object]' ? '—' : answer
      }
    }
    if (Array.isArray(arr)) {
    const question = QUESTIONS.find((x) => x.id === q?.id) || q
    const values = question?.values ?? []
    const options = question?.options ?? []
    const labels = arr
      .map((v) => {
        const strVal = typeof v === 'object' && v !== null ? (v?.label ?? v?.value ?? '') : (v != null ? String(v) : '')
        if (!strVal || strVal === '[object Object]') return null
        let idx = values.indexOf(strVal)
        if (idx < 0 && strVal.length > 0) {
          idx = options.findIndex((opt) => String(opt).toLowerCase() === strVal.toLowerCase())
        }
        return idx >= 0 && options[idx] != null ? options[idx] : strVal
      })
      .filter(Boolean)
    if (labels.length > 0) return labels.join(', ')
    // Fallback: show raw values if option lookup failed
    const raw = arr
      .map((v) => (typeof v === 'object' && v != null ? (v?.label ?? v?.value ?? '') : v != null ? String(v) : ''))
      .filter((s) => s && s !== '[object Object]')
    return raw.length > 0 ? raw.join(', ') : '—'
  }
  const s = String(answer ?? '')
  return s === '[object Object]' ? '—' : s || '—'
  } catch {
    return '—'
  }
}

function renderHistoryAnswer(q, answer) {
  const formatted = formatAnswerForDisplay(q, answer)
  if (formatted !== '—') return formatted
  if (Array.isArray(answer) && answer.length > 0) {
    const question = QUESTIONS.find((x) => x.id === q?.id) || q
    const values = question?.values ?? []
    const options = question?.options ?? []
    return answer
      .map((v) => {
        const strVal = typeof v === 'object' && v != null ? (v?.label ?? v?.value ?? '') : (v != null ? String(v) : '')
        if (!strVal) return null
        const idx = values.indexOf(strVal)
        return idx >= 0 && options[idx] != null ? options[idx] : strVal
      })
      .filter(Boolean)
      .join(', ') || '—'
  }
  return '—'
}

function getEffectiveQuestions(answers) {
  const result = []
  for (const q of QUESTIONS) {
    if (q.conditionalOn) {
      const answered = answers[q.conditionalOn.question]
      const hasValue = Array.isArray(answered) ? answered.includes(q.conditionalOn.hasValue) : answered === q.conditionalOn.hasValue
      if (hasValue) result.push(q)
    } else {
      result.push(q)
    }
  }
  return result
}

export default function Onboarding() {
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [selectedChips, setSelectedChips] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [editingNames, setEditingNames] = useState(false)
  const [namesEditPrimary, setNamesEditPrimary] = useState('')
  const [namesEditPartner, setNamesEditPartner] = useState('')
  const [selectedWeeknights, setSelectedWeeknights] = useState([])
  const selectedChipsRef = useRef([])
  const selectedWeeknightsRef = useRef([])
  const pendingAnswersRef = useRef({})
  selectedChipsRef.current = selectedChips
  selectedWeeknightsRef.current = selectedWeeknights

  const effectiveQuestions = getEffectiveQuestions(answers)
  const clampedIndex = Math.min(Math.max(0, currentIndex), Math.max(0, effectiveQuestions.length - 1))
  const currentQuestion = effectiveQuestions[clampedIndex]
  const isLastQuestion = clampedIndex === effectiveQuestions.length - 1
  const progress = effectiveQuestions.length > 0 ? ((clampedIndex + 1) / effectiveQuestions.length) * 100 : 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentIndex, answers])

  useEffect(() => {
    if (effectiveQuestions.length > 0 && currentIndex >= effectiveQuestions.length) {
      setCurrentIndex(effectiveQuestions.length - 1)
    }
  }, [effectiveQuestions.length, currentIndex])

  useEffect(() => {
    if (!currentQuestion) return
    if (currentQuestion.type === 'chips') {
      const ans = answers[currentQuestion.id]
      const chips = Array.isArray(ans) ? ans.filter((x) => typeof x === 'string') : ans != null && ans !== '' ? [String(ans)] : []
      selectedChipsRef.current = chips
      setSelectedChips(chips)
      if (currentQuestion.id === 'preferred_days') {
        const wn = answers.preferred_weeknights
        const weeknights = Array.isArray(wn) ? wn.filter((x) => typeof x === 'string') : []
        selectedWeeknightsRef.current = weeknights
        setSelectedWeeknights(weeknights)
      }
    } else {
      const ans = answers[currentQuestion.id]
      if (currentQuestion.id === 'partner_phone' && ans) {
        const digits = String(ans).replace(/\D/g, '').replace(/^1/, '').slice(-10)
        setInputValue(digits)
      } else {
        setInputValue(ans != null && ans !== '' ? String(ans) : '')
      }
    }
  }, [currentIndex, currentQuestion?.id])

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const toE164 = (phone) => {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 10 ? `+1${digits}` : null
  }

  const handleSubmit = async (overrideValue) => {
    let value
    if (overrideValue !== undefined) {
      value = overrideValue
    } else if (currentQuestion.type === 'chips') {
      const fromRef = selectedChipsRef.current
      const fromState = selectedChips
      const chips = (Array.isArray(fromRef) ? fromRef : []).length >= (Array.isArray(fromState) ? fromState : []).length ? fromRef : fromState
      const raw = currentQuestion.multi ? chips : chips[0]
      value = Array.isArray(raw)
        ? raw.map((v) => (typeof v === 'string' ? v : (v && (v.value ?? v.label) ? String(v.value ?? v.label) : null))).filter(Boolean)
        : typeof raw === 'string' ? raw : null
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setErrorMessage('Please select at least one option')
        return
      }
    } else if (currentQuestion.type === 'textarea') {
      value = inputValue.trim() || null
      if (!value && !currentQuestion.optional) {
        setErrorMessage('Please enter a response')
        return
      }
    } else {
      value = inputValue.trim()
      if (!value && !currentQuestion.optional) {
        setErrorMessage('Please enter a response')
        return
      }
      if (currentQuestion.id === 'partner_phone' && value) {
        const e164 = toE164(value)
        if (!e164) {
          setErrorMessage('Please enter a valid 10-digit phone number')
          return
        }
        value = e164
      }
      if (currentQuestion.optional && !value) {
        value = null
      }
    }

    let newAnswers = { ...answers, [currentQuestion.id]: value }
    if (currentQuestion.id === 'preferred_days' && currentQuestion.inlineFollowUp && Array.isArray(value) && value.includes('weeknight')) {
      newAnswers = { ...newAnswers, preferred_weeknights: selectedWeeknightsRef.current }
    }
    pendingAnswersRef.current = newAnswers
    setAnswers(newAnswers)
    setInputValue('')
    setSelectedChips([])
    setSelectedWeeknights([])
    setErrorMessage('')

    if (isLastQuestion) {
      setStatus('loading')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/signup', { replace: true })
          return
        }
        const res = await fetch(`${SUPABASE_URL}/functions/v1/onboarding-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ answers: newAnswers }),
        })
        let data
        try {
          data = await res.json()
        } catch {
          throw new Error(res.status === 401 ? 'Session expired — please log in again' : `Request failed (${res.status})`)
        }
        if (!res.ok) throw new Error(data?.error || data?.message || data?.details || `Failed to save (${res.status})`)
        track('onboarding_completed')
        navigate('/chat', { replace: true })
      } catch (err) {
        setStatus('error')
        setErrorMessage(err.message || 'Something went wrong')
      }
    } else {
      const nextEffective = getEffectiveQuestions(newAnswers)
      const skipPreferredWeeknights = currentQuestion.id === 'preferred_days' && newAnswers.preferred_weeknights != null && nextEffective[currentIndex + 1]?.id === 'preferred_weeknights'
      const nextIndex = skipPreferredWeeknights ? currentIndex + 2 : currentIndex + 1
      setCurrentIndex(Math.min(nextIndex, nextEffective.length - 1))
    }
  }

  const toggleChip = (val) => {
    if (currentQuestion.multi) {
      const next = selectedChipsRef.current.includes(val)
        ? selectedChipsRef.current.filter((x) => x !== val)
        : [...selectedChipsRef.current, val]
      selectedChipsRef.current = next
      setSelectedChips(next)
    } else {
      setSelectedChips([val])
    }
  }

  const handleSaveNames = () => {
    const primary = namesEditPrimary.trim()
    const partner = namesEditPartner.trim()
    if (!primary || !partner) {
      setErrorMessage('Both names are required')
      return
    }
    const newAnswers = { ...answers, primary_name: primary, partner_name: partner }
    pendingAnswersRef.current = newAnswers
    setAnswers(newAnswers)
    setEditingNames(false)
    setErrorMessage('')
  }

  const handleCancelNamesEdit = () => {
    setEditingNames(false)
    setNamesEditPrimary(answers.primary_name || '')
    setNamesEditPartner(answers.partner_name || '')
    setErrorMessage('')
  }

  const handleGoToQuestion = (idx) => {
    setEditingNames(false)
    const q = effectiveQuestions[idx]
    if (!q) return
    const newAnswers = { ...answers }
    for (let i = idx + 1; i < effectiveQuestions.length; i++) {
      delete newAnswers[effectiveQuestions[i].id]
    }
    pendingAnswersRef.current = newAnswers
    setAnswers(newAnswers)
    setCurrentIndex(idx)
    setErrorMessage('')
  }

  if (!currentQuestion) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-content">
          <div className="text-[var(--color-text-secondary)]">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        {/* Header */}
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-lg)' }}>
          Let's get to know you
        </h1>

        {/* Progress bar */}
        <div style={{ marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)' }}>
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]" style={{ marginBottom: 'var(--spacing-sm)' }}>
            <span>Step {clampedIndex + 1} of {effectiveQuestions.length}</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--color-text-secondary)]/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Answered history */}
        {currentIndex > 0 && (
          <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {editingNames ? (
              <div className="onboarding-history-item">
                <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginBottom: 'var(--spacing-md)' }}>Edit names</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <input
                    type="text"
                    value={namesEditPrimary}
                    onChange={(e) => { setNamesEditPrimary(e.target.value); setErrorMessage('') }}
                    placeholder="Your name"
                    className="onboarding-input"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={namesEditPartner}
                    onChange={(e) => { setNamesEditPartner(e.target.value); setErrorMessage('') }}
                    placeholder="Partner's name"
                    className="onboarding-input"
                  />
                  {errorMessage && (
                    <p className="text-sm text-[var(--color-accent)]">{errorMessage}</p>
                  )}
                  <div className="flex" style={{ gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <button
                      type="button"
                      onClick={handleSaveNames}
                      className="flex-1 py-2.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelNamesEdit}
                      className="flex-1 py-2.5 bg-transparent border border-[var(--color-text-secondary)]/30 text-[var(--color-text-primary)] font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : answers.primary_name && answers.partner_name && currentIndex >= 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNames(true)
                    setNamesEditPrimary(answers.primary_name)
                    setNamesEditPartner(answers.partner_name)
                  }}
                  className="onboarding-names-chip w-full text-left"
                >
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {answers.primary_name} & {answers.partner_name} ❤️
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] block" style={{ marginTop: 'var(--spacing-xs)' }}>Tap to edit</span>
                </button>
                {effectiveQuestions.slice(2, currentIndex).map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleGoToQuestion(2 + i)}
                    className="onboarding-history-item onboarding-history-item-tappable"
                  >
                    <p className="text-sm text-[var(--color-text-secondary)]">{q.id === 'partner_phone' ? `What's ${answers.partner_name || 'your partner'}'s phone number?` : q.question}</p>
                    <p className="text-[var(--color-text-primary)] font-medium" style={{ marginTop: 'var(--spacing-xs)' }}>
                      {renderHistoryAnswer(q, answers[q.id] ?? pendingAnswersRef.current[q.id])}
                    </p>
                    <span className="text-xs text-[var(--color-text-secondary)] block" style={{ marginTop: 'var(--spacing-xs)' }}>Tap to edit</span>
                  </button>
                ))}
              </>
            ) : (
              effectiveQuestions.slice(0, currentIndex).map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleGoToQuestion(i)}
                  className="onboarding-history-item onboarding-history-item-tappable"
                >
                  <p className="text-sm text-[var(--color-text-secondary)]">{q.id === 'partner_phone' ? `What's ${answers.partner_name || 'your partner'}'s phone number?` : q.question}</p>
                  <p className="text-[var(--color-text-primary)] font-medium" style={{ marginTop: 'var(--spacing-xs)' }}>
                    {renderHistoryAnswer(q, answers[q.id] ?? pendingAnswersRef.current[q.id])}
                  </p>
                  <span className="text-xs text-[var(--color-text-secondary)] block" style={{ marginTop: 'var(--spacing-xs)' }}>Tap to edit</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Current question */}
        <div className="onboarding-current" style={{ paddingTop: 'var(--spacing-lg)' }}>
          <label className="block text-lg font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-md)' }}>
            {currentQuestion.id === 'partner_phone'
              ? `What's ${answers.partner_name || 'your partner'}'s phone number?`
              : currentQuestion.question}
          </label>

          {currentQuestion.type === 'chips' ? (
            <>
              <div className="flex flex-wrap" style={{ gap: 'var(--spacing-md)' }}>
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      currentQuestion.multi
                        ? toggleChip(currentQuestion.values[i])
                        : handleSubmit(currentQuestion.values[i])
                    }
                    className={`onboarding-chip ${selectedChips.includes(currentQuestion.values[i]) ? 'onboarding-chip-active' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {currentQuestion.multi && (
                <p className="text-xs text-[var(--color-text-secondary)]" style={{ marginTop: 'var(--spacing-sm)' }}>
                  {selectedChips.length} selected — tap Next when ready
                </p>
              )}
              {currentQuestion.inlineFollowUp && selectedChips.includes('weeknight') && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginBottom: 'var(--spacing-sm)' }}>{currentQuestion.inlineFollowUp.question}</p>
                  <div className="flex flex-wrap" style={{ gap: 'var(--spacing-md)' }}>
                    {currentQuestion.inlineFollowUp.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const val = currentQuestion.inlineFollowUp.values[i]
                          const next = selectedWeeknightsRef.current.includes(val)
                            ? selectedWeeknightsRef.current.filter((x) => x !== val)
                            : [...selectedWeeknightsRef.current, val]
                          selectedWeeknightsRef.current = next
                          setSelectedWeeknights(next)
                        }}
                        className={`onboarding-chip ${selectedWeeknights.includes(currentQuestion.inlineFollowUp.values[i]) ? 'onboarding-chip-active' : ''}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : currentQuestion.type === 'textarea' ? (
            <>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentQuestion.placeholder || 'e.g. "We love doing a bite and an activity."'}
                className="onboarding-input"
                rows={4}
                style={{ resize: 'vertical', minHeight: '6rem' }}
                autoFocus
              />
              {currentQuestion.helperText && (
                <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginTop: 'var(--spacing-xs)' }}>
                  {currentQuestion.helperText}
                </p>
              )}
            </>
          ) : (
            <>
              <input
                type={currentQuestion.type === 'phone' ? 'tel' : 'text'}
                value={currentQuestion.id === 'partner_phone' ? formatPhone(inputValue) : inputValue}
                onChange={(e) =>
                  setInputValue(
                    currentQuestion.id === 'partner_phone' ? e.target.value.replace(/\D/g, '') : e.target.value
                  )
                }
                placeholder={currentQuestion.placeholder}
                className="onboarding-input"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
              {currentQuestion.helperText && (
                <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginTop: 'var(--spacing-xs)' }}>
                  {currentQuestion.helperText}
                </p>
              )}
            </>
          )}

          {errorMessage && (
            <p className="text-sm text-[var(--color-accent)]" style={{ marginTop: 'var(--spacing-md)' }}>{errorMessage}</p>
          )}
        </div>

        <div ref={bottomRef} style={{ height: 'var(--spacing-md)' }} />
      </div>

      {/* Fixed bottom CTA */}
      <div className="onboarding-footer">
        <button
          onClick={() => handleSubmit()}
          disabled={status === 'loading'}
          className="onboarding-cta"
        >
          {status === 'loading' ? 'Setting up...' : isLastQuestion ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
