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
        // Supabase SSR maneja el code en la URL automáticamente
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error('Error obteniendo sesión:', error?.message)
          router.replace('/login?error=no_session')
          return
        }

        const user = data.session.user
        
        // Buscar rol via API
        const res = await fetch(`/api/auth/role?uid=${user.id}`)
        const { role } = await res.json()

        const adminRoles = ['admin', 'jefe', 'especialista', 'terapeuta']
        router.replace(adminRoles.includes(role) ? '/admin' : '/padre')

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
      <p style={{ fontSize: 16, opacity: .8 }}>{t ? t('common.iniciandoGoogle') : 'Iniciando sesión con Google…'}</p>
    </div>
  )
}
