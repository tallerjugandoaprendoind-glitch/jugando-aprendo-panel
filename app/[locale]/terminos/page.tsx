'use client'
import { useI18n } from '@/lib/i18n-context'
import Link from 'next/link'

export default function TerminosPage() {
  const { locale } = useI18n()
  const isEN = locale === 'en'

  const s = {
    title: isEN ? 'Terms of Service' : 'Términos de Servicio',
    updated: isEN ? 'Last updated: March 2025 · Pisco, Ica, Peru' : 'Última actualización: marzo 2025 · Pisco, Ica, Perú',
    s1: isEN ? '1. Acceptance of terms' : '1. Aceptación de los términos',
    s1d: isEN ? 'By using the Vanty platform, you agree to these terms. If you do not agree, please do not use the service.' : 'Al utilizar la plataforma Vanty, aceptás estos términos. Si no estás de acuerdo, por favor no utilices el servicio.',
    s2: isEN ? '2. Service description' : '2. Descripción del servicio',
    s2d: isEN ? 'Vanty is a digital clinical management platform for the Jugando Aprendo center. It allows managing ABA sessions, clinical records, reports and family communication.' : 'Vanty es una plataforma digital de gestión clínica para el centro Jugando Aprendo. Permite gestionar sesiones ABA, historiales clínicos, reportes y comunicación con familias.',
    s2d2: isEN ? 'The platform is for exclusive use by:' : 'La plataforma es de uso exclusivo para:',
    l1: isEN ? 'Families and active patients of the Jugando Aprendo center.' : 'Familias y pacientes activos del centro Jugando Aprendo.',
    l2: isEN ? 'Professionals and therapists from the clinical team.' : 'Profesionales y terapeutas del equipo clínico.',
    s4: isEN ? '4. Clinical nature of the service' : '4. Naturaleza clínica del servicio',
    s4d: isEN ? 'The AI tools (ARIA) are clinical support tools and do not replace the judgment of the certified therapist. All reports and suggestions must be reviewed by the responsible professional before sharing with families.' : 'Las herramientas de IA (ARIA) son herramientas de apoyo clínico y no reemplazan el criterio del terapeuta certificado. Todos los reportes y sugerencias deben ser revisados por el profesional responsable antes de compartirse con las familias.',
    s6: isEN ? '6. User accounts' : '6. Cuentas de usuario',
    s6d: isEN ? 'You are responsible for maintaining the security of your password and all activities under your account. Notify us immediately of any unauthorized use.' : 'Sos responsable de mantener la seguridad de tu contraseña y de todas las actividades bajo tu cuenta. Notificanos inmediatamente cualquier uso no autorizado.',
    s7: isEN ? '7. Service availability' : '7. Disponibilidad del servicio',
    s7d: isEN ? 'We strive to maintain 99% uptime, but we do not guarantee uninterrupted service. We are not liable for losses due to temporary outages.' : 'Nos esforzamos por mantener un 99% de disponibilidad, pero no garantizamos un servicio ininterrumpido. No somos responsables por pérdidas debidas a interrupciones temporales.',
    location: isEN ? 'Pisco, Ica, Peru' : 'Pisco, Ica, Perú',
    copyright: isEN ? '© 2025 Jugando Aprendo · All rights reserved' : '© 2025 Jugando Aprendo · Todos los derechos reservados',
    seePrivacy: isEN ? 'View Privacy Policy →' : 'Ver Política de Privacidad →',
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
