import posthog from 'posthog-js'

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST
  if (key && host) {
    posthog.init(key, { api_host: host })
  }
}

export function track(event, properties = {}) {
  if (typeof posthog?.capture === 'function') {
    posthog.capture(event, properties)
  }
}
