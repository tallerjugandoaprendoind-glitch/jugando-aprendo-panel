'use client'

import { useI18n } from '@/lib/i18n-context'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle OAuth code in URL (Google, Microsoft, etc.)
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        const code = params.get('code')

        if (code) {
          // Exchange OAuth code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Code exchange error:', error.message)
            router.replace('/login?error=no_session')
            return
          }
        }

        // Small delay to let Supabase set the session cookie
        await new Promise(r => setTimeout(r, 500))

        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error('No session after callback:', error?.message)
          router.replace('/login?error=no_session')
          return
        }

        const user = data.session.user

        // Check if profile exists, create if not (for new OAuth users)
        // Extract name from OAuth metadata (Google, Microsoft, GitHub all use different fields)
        const oauthName = 
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.user_metadata?.preferred_username ||
          user.user_metadata?.given_name ||
          null

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // New user via OAuth — create profile as padre by default
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: oauthName || user.email?.split('@')[0] || 'Usuario',
            role: 'padre',
          })
          router.replace('/padre')
          return
        }

        // Existing user — update name if it was empty or missing
        if (!profile.full_name && oauthName) {
          await supabase
            .from('profiles')
            .update({ full_name: oauthName })
            .eq('id', user.id)
        }

        // Redirect based on role
        const adminRoles = ['admin', 'jefe', 'especialista', 'terapeuta']
        if (adminRoles.includes(profile.role)) router.replace('/admin')
        else if (profile.role === 'secretaria') router.replace('/secretaria')
        else router.replace('/padre')

      } catch (e: any) {
        console.error('Callback error:', e.message)
        router.replace('/login?error=callback')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
      color: '#fff', fontFamily: 'system-ui, sans-serif', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid rgba(255,255,255,.2)',
        borderTop: '4px solid #fff', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: 16, opacity: .8 }}>
        {t ? t('common.iniciandoGoogle') : 'Iniciando sesión…'}
      </p>
    </div>
  )
}
