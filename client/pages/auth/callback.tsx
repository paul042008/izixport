// src/pages/auth/callback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const roleFromUrl = urlParams.get('role')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          navigate('/login?error=exchange_failed', { replace: true })
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login', { replace: true })
        return
      }

      const finalRole =
        roleFromUrl ||
        localStorage.getItem('pendingRole') ||
        session.user.user_metadata?.role ||
        'buyer'

      localStorage.removeItem('pendingRole')

      // ✅ FIX: Update the user's metadata in auth to match the final role
      if (finalRole !== session.user.user_metadata?.role) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: finalRole }
        })
        if (updateError) console.warn('Failed to update auth metadata role:', updateError)
      }

      const userId = session.user.id
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!existingProfile) {
        await supabase.from('users').insert({
          id: userId,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          role: finalRole,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
        })
      } else {
        // ✅ FIX: Also update the users table role if it's different
        const { data: current } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()
        if (current && current.role !== finalRole) {
          await supabase.from('users').update({ role: finalRole }).eq('id', userId)
        }
      }

      if (cancelled) return
      if (finalRole === 'exporter') {
        navigate('/onboarding/exporter', { replace: true })
      } else {
        navigate('/onboarding/buyer', { replace: true })
      }
    }

    handleCallback()
    return () => { cancelled = true }
  }, [navigate])

  return <LoadingSpinner />
}