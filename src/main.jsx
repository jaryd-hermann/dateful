import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initPostHog } from './lib/posthog'
import './index.css'
import App from './App.jsx'

initPostHog()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
