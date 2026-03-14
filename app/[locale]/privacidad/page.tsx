'use client'
import { useI18n } from '@/lib/i18n-context'
import Link from 'next/link'

export default function PrivacidadPage() {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  const s = {
    title: isEN ? 'Privacy Policy' : 'Política de Privacidad',
    updated: isEN ? 'Last updated: March 2025 · Pisco, Ica, Peru' : 'Última actualización: marzo 2025 · Pisco, Ica, Perú',
    s1: isEN ? '1. Who we are' : '1. Quiénes somos',
    s1d: isEN ? 'Jugando Aprendo is a center specialized in ABA, ASD and ADHD child intervention therapy, located in Pisco, Ica, Peru. We operate the Vanty digital platform for clinical management and family communication.' : 'Jugando Aprendo es un centro de terapia especializada en intervención infantil ABA, TEA y TDAH ubicado en Pisco, Ica, Perú. Operamos la plataforma digital Vanty para la gestión clínica y comunicación con familias.',
    s2: isEN ? '2. What information we collect' : '2. Qué información recopilamos',
    s2d: isEN ? 'We collect only the information necessary to provide our services:' : 'Recopilamos únicamente la información necesaria para brindar nuestros servicios:',
    l1k: isEN ? 'Account data:' : 'Datos de cuenta:',
    l1v: isEN ? 'full name, email address, phone number.' : 'nombre completo, correo electrónico, número de teléfono.',
    l2k: isEN ? 'Patient data:' : 'Datos del paciente:',
    l2v: isEN ? 'name, date of birth, clinical diagnosis, session history and therapeutic progress.' : 'nombre, fecha de nacimiento, diagnóstico clínico, historial de sesiones y progreso terapéutico.',
    l3k: isEN ? 'Usage data:' : 'Datos de uso:',
    l3v: isEN ? 'ABA session records, clinical forms, assessments and generated reports.' : 'registros de sesiones ABA, formularios clínicos, evaluaciones y reportes generados.',
    l4k: isEN ? 'Google data (if using Google sign-in):' : 'Datos de Google (si usás inicio de sesión con Google):',
    l4v: isEN ? 'name, email address and profile photo provided by Google.' : 'nombre, correo electrónico y foto de perfil proporcionados por Google.',
    s3: isEN ? '3. How we use the information' : '3. Cómo usamos la información',
    u1: isEN ? 'Manage patient clinical history and therapeutic follow-up.' : 'Gestionar el historial clínico y seguimiento terapéutico del paciente.',
    u2: isEN ? 'Generate progress reports for families and professionals.' : 'Generar reportes de progreso para familias y profesionales.',
    u3: isEN ? 'Send appointment notifications and reminders.' : 'Enviar notificaciones de citas y recordatorios.',
    u4: isEN ? 'Improve our clinical services and the Vanty platform.' : 'Mejorar nuestros servicios clínicos y la plataforma Vanty.',
    s4: isEN ? '4. Who we share information with' : '4. Con quién compartimos la información',
    s4d: isEN ? 'We do not sell or share your data with third parties for commercial purposes. We only share information with healthcare professionals directly involved in the patient\'s treatment.' : 'No vendemos ni compartimos sus datos con terceros con fines comerciales. Solo compartimos información con los profesionales de salud directamente involucrados en el tratamiento del paciente.',
    s5: isEN ? '5. Data security' : '5. Seguridad de los datos',
    s5d: isEN ? 'We use Supabase (infrastructure backed by AWS) with row-level security. All communications are encrypted with SSL/TLS.' : 'Utilizamos Supabase (infraestructura respaldada por AWS) con seguridad a nivel de fila. Todas las comunicaciones están cifradas con SSL/TLS.',
    s6: isEN ? '6. User rights' : '6. Derechos del usuario',
    s6d: isEN ? 'You have the right to request at any time:' : 'Tenés derecho a solicitar en cualquier momento:',
    r1: isEN ? 'Access to your personal data.' : 'Acceso a tus datos personales.',
    r2: isEN ? 'Correction of incorrect or outdated data.' : 'Corrección de datos incorrectos o desactualizados.',
    r3: isEN ? 'Deletion of your account and associated data.' : 'Eliminación de tu cuenta y datos asociados.',
    s8: isEN ? '8. Data retention' : '8. Retención de datos',
    s8d: isEN ? 'We retain clinical data for the period legally required in Peru or as long as the patient is active. You may request deletion at any time.' : 'Conservamos los datos clínicos durante el período legalmente requerido en Perú o mientras el paciente sea activo. Podés solicitar la eliminación en cualquier momento.',
    contact: isEN ? 'For any questions about this policy:' : 'Para cualquier consulta sobre esta política:',
    location: isEN ? 'Pisco, Ica, Peru' : 'Pisco, Ica, Perú',
    seeTerms: isEN ? 'View Terms of Service →' : 'Ver Términos de Servicio →',
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
