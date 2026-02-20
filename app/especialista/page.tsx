'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, LogOut, Calendar, FileText,
  User, Loader2, Menu, X, Stethoscope, ChevronRight, Shield,
  Activity, Home
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import EspecialistaHome from './components/EspecialistaHome'
import MisPacientes from './components/MisPacientes'
import MisEvaluaciones from './components/MisEvaluaciones'
import MiAgenda from './components/MiAgenda'
import MiPerfil from './components/MiPerfil'

const NAV_ITEMS = [
  { id: 'inicio',       icon: LayoutDashboard, label: 'Inicio',       color: '#06b6d4' },
  { id: 'pacientes',    icon: Users,           label: 'Pacientes',    color: '#8b5cf6' },
  { id: 'evaluaciones', icon: FileText,        label: 'Evaluaciones', color: '#f59e0b' },
  { id: 'agenda',       icon: Calendar,        label: 'Mi Agenda',    color: '#10b981' },
  { id: 'perfil',       icon: User,            label: 'Mi Perfil',    color: '#f472b6' },
]

export default function EspecialistaDashboard() {
  const router = useRouter()
  const toast = useToast()
  const [activeView, setActiveView] = useState('inicio')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof || (prof.role !== 'especialista' && prof.role !== 'admin')) {
        if (prof?.role === 'jefe') { router.push('/admin'); return }
        if (prof?.role === 'padre') { router.push('/padre'); return }
        router.push('/login'); return
      }
      setProfile(prof)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':       return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
      case 'pacientes':    return <MisPacientes />
      case 'evaluaciones': return <MisEvaluaciones userId={profile.id} />
      case 'agenda':       return <MiAgenda />
      case 'perfil':       return <MiPerfil profile={profile} onUpdate={loadProfile} />
      default:             return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
    }
  }

  if (loading) return (
    <div style={{ background: '#060d1a' }} className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl">
          <Stethoscope size={28} className="text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} style={{ animationDelay: `${i * 0.15}s`, background: '#06b6d4' }}
              className="w-2 h-2 rounded-full animate-bounce" />
          ))}
        </div>
        <p style={{ color: '#94a3b8' }} className="text-sm font-medium tracking-wide">Cargando tu espacio clínico...</p>
      </div>
    </div>
  )

  const activeItem = NAV_ITEMS.find(n => n.id === activeView)

  return (
    <div style={{ background: '#060d1a' }} className="min-h-screen flex">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside
        style={{
          background: 'linear-gradient(180deg, #0b1628 0%, #0d1f35 60%, #091525 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full z-30"
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontFamily: 'system-ui', letterSpacing: '-0.02em' }}
                className="font-black text-sm leading-tight">NeuroCare</p>
              <p style={{ color: '#475569' }} className="text-xs font-medium">Panel Clínico</p>
            </div>
          </div>
        </div>

        {/* Avatar section */}
        <div className="px-4 mb-6">
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            className="rounded-2xl p-4 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                {profile?.full_name?.[0]?.toUpperCase() || 'E'}
              </div>
              <div style={{ background: '#10b981', border: '2px solid #0b1628' }}
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full" />
            </div>
            <div className="min-w-0">
              <p style={{ color: '#e2e8f0' }} className="text-sm font-bold truncate">{profile?.full_name?.split(' ')[0]}</p>
              <p style={{ color: '#64748b' }} className="text-xs truncate">{profile?.specialty || 'Especialista Clínico'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                style={{
                  background: isActive ? `${item.color}18` : 'transparent',
                  border: isActive ? `1px solid ${item.color}35` : '1px solid transparent',
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left">
                <div style={{
                  background: isActive ? item.color : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fff' : '#64748b',
                }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:opacity-90">
                  <item.icon size={16} />
                </div>
                <span style={{ color: isActive ? '#f1f5f9' : '#94a3b8' }}
                  className="text-sm font-semibold transition-colors duration-200 group-hover:text-slate-200">
                  {item.label}
                </span>
                {isActive && (
                  <div style={{ background: item.color }} className="ml-auto w-1.5 h-1.5 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-6 pt-4 space-y-2">
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl">
            <Shield size={13} style={{ color: '#10b981' }} className="flex-shrink-0" />
            <div className="min-w-0">
              <p style={{ color: '#10b981' }} className="text-xs font-bold truncate">Sesión activa</p>
              <p style={{ color: '#059669' }} className="text-xs truncate">Rol: Especialista</p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ color: '#ef4444' }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-semibold group">
            <LogOut size={16} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div style={{ background: 'rgba(0,0,0,0.7)' }} className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)} />
          <div style={{ background: 'linear-gradient(180deg, #0b1628 0%, #0d1f35 60%, #091525 100%)', width: 280 }}
            className="absolute left-0 top-0 h-full flex flex-col shadow-2xl">
            <button onClick={() => setSidebarOpen(false)}
              style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}
              className="absolute top-4 right-4 p-2 rounded-lg">
              <X size={18} />
            </button>
            {/* Same sidebar content */}
            <div className="px-6 pt-8 pb-6">
              <div className="flex items-center gap-3">
                <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Stethoscope size={20} className="text-white" />
                </div>
                <p style={{ color: '#f1f5f9' }} className="font-black text-sm">NeuroCare</p>
              </div>
            </div>
            <div className="px-4 mb-5">
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                className="rounded-2xl p-4 flex items-center gap-3">
                <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black">
                  {profile?.full_name?.[0]?.toUpperCase() || 'E'}
                </div>
                <div>
                  <p style={{ color: '#e2e8f0' }} className="text-sm font-bold">{profile?.full_name?.split(' ')[0]}</p>
                  <p style={{ color: '#64748b' }} className="text-xs">{profile?.specialty || 'Especialista'}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map(item => {
                const isActive = activeView === item.id
                return (
                  <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false) }}
                    style={{ background: isActive ? `${item.color}18` : 'transparent', border: isActive ? `1px solid ${item.color}35` : '1px solid transparent' }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all">
                    <div style={{ background: isActive ? item.color : 'rgba(255,255,255,0.06)', color: isActive ? '#fff' : '#64748b' }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <item.icon size={16} />
                    </div>
                    <span style={{ color: isActive ? '#f1f5f9' : '#94a3b8' }} className="text-sm font-semibold">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="px-3 pb-8 pt-3">
              <button onClick={handleLogout} style={{ color: '#ef4444' }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-semibold">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header style={{
          background: 'rgba(6,13,26,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }} className="sticky top-0 z-20 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}
            className="lg:hidden p-2 rounded-xl transition-colors hover:bg-white/10">
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {activeItem && (
                <div style={{ background: `${activeItem.color}20`, color: activeItem.color }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center">
                  <activeItem.icon size={14} />
                </div>
              )}
              <h1 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}
                className="font-black text-lg">{activeItem?.label || 'Panel'}</h1>
            </div>
            <p style={{ color: '#334155' }} className="text-xs font-medium hidden sm:block">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Avatar */}
          <button onClick={() => setActiveView('perfil')}
            className="flex items-center gap-2.5 group">
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl">
              <p style={{ color: '#94a3b8' }} className="text-xs font-medium">{profile?.full_name?.split(' ')[0]}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-105 transition-transform">
              {profile?.full_name?.[0]?.toUpperCase() || 'E'}
            </div>
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav style={{
        background: 'rgba(11,22,40,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }} className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map(item => {
          const isActive = activeView === item.id
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1">
              <div style={{ color: isActive ? item.color : '#475569' }} className="transition-colors">
                <item.icon size={20} />
              </div>
              <span style={{ color: isActive ? item.color : '#475569', fontSize: 10 }}
                className="font-bold transition-colors">{item.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
