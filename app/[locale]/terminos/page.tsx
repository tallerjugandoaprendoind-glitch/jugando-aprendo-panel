'use client'
import { useI18n } from '@/lib/i18n-context'
import Link from 'next/link'

export default function TerminosPage() {
  const { locale } = useI18n()
  const isEN = locale === 'en'

  const s = {
    title: 'Terms of Service',
    updated: 'Last updated: March 2025 · Pisco, Ica, Peru',
    s1: '1. Acceptance of terms',
    s1d: 'By using the Vanty platform, you agree to these terms. If you do not agree, please do not use the service.',
    s2: '2. Service description',
    s2d: 'Vanty is a digital clinical management platform for the Jugando Aprendo center. It allows managing ABA sessions, clinical records, reports and family communication.',
    s2d2: 'The platform is for exclusive use by:',
    l1: 'Families and active patients of the Jugando Aprendo center.',
    l2: 'Professionals and therapists from the clinical team.',
    s4: '4. Clinical nature of the service',
    s4d: 'The AI tools (ARIA) are clinical support tools and do not replace the judgment of the certified therapist. All reports and suggestions must be reviewed by the responsible professional before sharing with families.',
    s6: '6. User accounts',
    s6d: 'You are responsible for maintaining the security of your password and all activities under your account. Notify us immediately of any unauthorized use.',
    s7: '7. Service availability',
    s7d: 'We strive to maintain 99% uptime, but we do not guarantee uninterrupted service. We are not liable for losses due to temporary outages.',
    location: 'Pisco, Ica, Peru',
    copyright: '© 2025 Jugando Aprendo · All rights reserved',
    seePrivacy: 'View Privacy Policy →',
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '48px 24px', color: '#1f2937', lineHeight: 1.7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 18 }}>🧩</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#1e1b4b' }}>Jugando Aprendo</span>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e1b4b', marginBottom: 8 }}>{s.title}</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>{s.updated}</p>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s1}</h2>
        <p>{s.s1d}</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s2}</h2>
        <p>{s.s2d}</p>
        <p style={{ marginTop: 8 }}>{s.s2d2}</p>
        <ul style={{ paddingLeft: 20 }}><li>{s.l1}</li><li>{s.l2}</li></ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s4}</h2>
        <p>{s.s4d}</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s6}</h2>
        <p>{s.s6d}</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s7}</h2>
        <p>{s.s7d}</p>
      </section>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, color: '#6b7280', fontSize: 14 }}>
        <p>{s.location} · {s.copyright}</p>
        <Link href="privacidad" style={{ color: '#4f46e5', marginTop: 16, display: 'inline-block' }}>{s.seePrivacy}</Link>
      </div>
    </div>
  )
}
