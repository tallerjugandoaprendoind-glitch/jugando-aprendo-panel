'use client'
import { useI18n } from '@/lib/i18n-context'
import Link from 'next/link'

export default function PrivacidadPage() {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  const s = {
    title: 'Privacy Policy',
    updated: 'Last updated: March 2025 · Pisco, Ica, Peru',
    s1: '1. Who we are',
    s1d: 'Jugando Aprendo is a center specialized in ABA, ASD and ADHD child intervention therapy, located in Pisco, Ica, Peru. We operate the Vanty digital platform for clinical management and family communication.',
    s2: '2. What information we collect',
    s2d: 'We collect only the information necessary to provide our services:',
    l1k: 'Account data:',
    l1v: 'full name, email address, phone number.',
    l2k: 'Patient data:',
    l2v: 'name, date of birth, clinical diagnosis, session history and therapeutic progress.',
    l3k: 'Usage data:',
    l3v: 'ABA session records, clinical forms, assessments and generated reports.',
    l4k: 'Google data (if using Google sign-in):',
    l4v: 'name, email address and profile photo provided by Google.',
    s3: '3. How we use the information',
    u1: 'Manage patient clinical history and therapeutic follow-up.',
    u2: 'Generate progress reports for families and professionals.',
    u3: 'Send appointment notifications and reminders.',
    u4: 'Improve our clinical services and the Vanty platform.',
    s4: '4. Who we share information with',
    s4d: 'We do not sell or share your data with third parties for commercial purposes. We only share information with healthcare professionals directly involved in the patient\'s treatment.',
    s5: '5. Data security',
    s5d: 'We use Supabase (infrastructure backed by AWS) with row-level security. All communications are encrypted with SSL/TLS.',
    s6: '6. User rights',
    s6d: 'You have the right to request at any time:',
    r1: 'Access to your personal data.',
    r2: 'Correction of incorrect or outdated data.',
    r3: 'Deletion of your account and associated data.',
    s8: '8. Data retention',
    s8d: 'We retain clinical data for the period legally required in Peru or as long as the patient is active. You may request deletion at any time.',
    contact: 'For any questions about this policy:',
    location: 'Pisco, Ica, Peru',
    seeTerms: 'View Terms of Service →',
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
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>{s.l1k}</strong> {s.l1v}</li>
          <li><strong>{s.l2k}</strong> {s.l2v}</li>
          <li><strong>{s.l3k}</strong> {s.l3v}</li>
          <li><strong>{s.l4k}</strong> {s.l4v}</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s3}</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>{s.u1}</li><li>{s.u2}</li><li>{s.u3}</li><li>{s.u4}</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s4}</h2>
        <p>{s.s4d}</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s5}</h2>
        <p>{s.s5d}</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s6}</h2>
        <p>{s.s6d}</p>
        <ul style={{ paddingLeft: 20 }}><li>{s.r1}</li><li>{s.r2}</li><li>{s.r3}</li></ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>{s.s8}</h2>
        <p>{s.s8d}</p>
      </section>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, color: '#6b7280', fontSize: 14 }}>
        <p>{s.contact}</p>
        <p style={{ marginTop: 4 }}>tallerjugandoaprendoind@gmail.com · {s.location}</p>
        <Link href="terminos" style={{ color: '#4f46e5', marginTop: 16, display: 'inline-block' }}>{s.seeTerms}</Link>
      </div>
    </div>
  )
}
