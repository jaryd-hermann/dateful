import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import Signup from './components/Signup'
import Login from './components/Login'
import Verify from './components/Verify'
import Onboarding from './components/Onboarding'
import Chat from './components/Chat'
import Layout from './components/Layout'
import { supabase } from './lib/supabase'
import { useState, useEffect } from 'react'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscriber } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscriber?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route
          path="/onboarding/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Onboarding />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/dates" element={<div className="p-6">Dates (coming soon)</div>} />
        <Route path="/date/:id" element={<div className="p-6">Date card (coming soon)</div>} />
        <Route path="/subscribe" element={<div className="p-6">Subscribe (coming soon)</div>} />
        <Route path="/settings" element={<div className="p-6">Settings (coming soon)</div>} />
        <Route path="/cards" element={<div className="p-6">Swipe cards (coming soon)</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
