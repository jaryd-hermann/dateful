import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function ChatBubble({ isAgent, children }) {
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={isAgent ? 'chat-bubble-agent' : 'chat-bubble-user'}>
        <p className="text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed text-[15px]">{children}</p>
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadConversation()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setInitialLoad(false)
      return
    }

    const { data: profile } = await supabase.from('users').select('couple_id').eq('auth_user_id', user.id).single()
    if (!profile?.couple_id) {
      setInitialLoad(false)
      return
    }

    const { data: convos } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('couple_id', profile.couple_id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (convos?.length) {
      setMessages(
        convos.map((c) => ({
          role: c.role === 'assistant' ? 'agent' : 'user',
          content: c.content,
        }))
      )
    } else {
      setMessages([
        {
          role: 'agent',
          content: "Hey! I'm Dateful, your date night assistant. I'll help plan amazing dates for you and your partner. What's on your mind?",
        },
      ])
    }
    setInitialLoad(false)
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      setMessages((prev) => [...prev, { role: 'agent', content: data.response }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: 'Sorry, I ran into an issue. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (initialLoad) {
    return (
      <div className="chat-page">
        <div className="chat-content flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/30" />
            <p className="text-sm text-[var(--color-text-secondary)]">Loading chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-content flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex-1 overflow-y-auto pb-2">
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Chat with Dateful
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginTop: 'var(--spacing-sm)' }}>
              Your date night assistant
            </p>
          </div>

          <div className="space-y-1">
            {messages.map((m, i) => (
              <ChatBubble key={i} isAgent={m.role === 'agent'}>
                {m.content}
              </ChatBubble>
            ))}
            {loading && (
              <ChatBubble isAgent={true}>
                <span className="inline-flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)]/70" style={{ animation: 'chat-typing-bounce 1.4s ease-in-out infinite' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)]/70" style={{ animation: 'chat-typing-bounce 1.4s ease-in-out 0.2s infinite' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)]/70" style={{ animation: 'chat-typing-bounce 1.4s ease-in-out 0.4s infinite' }} />
                </span>
              </ChatBubble>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-wrapper">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Dateful..."
              disabled={loading}
              className="chat-input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="chat-send-btn"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
