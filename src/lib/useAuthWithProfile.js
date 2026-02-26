import { useState, useEffect } from 'react'
import { supabase } from './supabase'

/**
 * Returns { session, coupleId, loading }.
 * - session: Supabase session or null
 * - coupleId: uuid if user has completed onboarding, null otherwise
 * - loading: true while fetching
 */
export function useAuthWithProfile() {
  const [session, setSession] = useState(null)
  const [coupleId, setCoupleId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    async function init() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(s)

        if (!s?.user) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('couple_id')
          .eq('auth_user_id', s.user.id)
          .maybeSingle()

        if (mounted) {
          setCoupleId(profile?.couple_id ?? null)
        }
      } catch (e) {
        if (mounted) setCoupleId(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscriber } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (!s?.user) {
        setCoupleId(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('couple_id')
          .eq('auth_user_id', s.user.id)
          .maybeSingle()
        if (mounted) setCoupleId(profile?.couple_id ?? null)
      } catch {
        if (mounted) setCoupleId(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscriber?.unsubscribe()
    }
  }, [])

  return { session, coupleId, loading }
}
