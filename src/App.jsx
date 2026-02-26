import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import Signup from './components/Signup'
import Login from './components/Login'
import Verify from './components/Verify'
import Onboarding from './components/Onboarding'
import Chat from './components/Chat'
import Layout from './components/Layout'
import { useAuthWithProfile } from './lib/useAuthWithProfile'

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
    <div className="animate-pulse text-[var(--color-text-secondary)]">Loading...</div>
  </div>
)

/** Logged-out only: redirects to /onboarding or /chat if already logged in. Shows page immediately to avoid loading screen. */
function GuestOnlyRoute({ children }) {
  const { session, coupleId, loading } = useAuthWithProfile()
  if (!loading && session) return <Navigate to={coupleId ? '/chat' : '/onboarding'} replace />
  return children
}

/** Requires auth. If onboarding complete, redirect to /chat */
function OnboardingRoute({ children }) {
  const { session, coupleId, loading } = useAuthWithProfile()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (coupleId) return <Navigate to="/chat" replace />
  return children
}

/** Requires auth. If onboarding incomplete, redirect to /onboarding */
function ChatRoute({ children }) {
  const { session, coupleId, loading } = useAuthWithProfile()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!coupleId) return <Navigate to="/onboarding" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestOnlyRoute><Landing /></GuestOnlyRoute>} />
        <Route path="/signup" element={<GuestOnlyRoute><Signup /></GuestOnlyRoute>} />
        <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/verify" element={<GuestOnlyRoute><Verify /></GuestOnlyRoute>} />
        <Route
          path="/onboarding/*"
          element={
            <OnboardingRoute>
              <Layout>
                <Onboarding />
              </Layout>
            </OnboardingRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ChatRoute>
              <Layout>
                <Chat />
              </Layout>
            </ChatRoute>
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
