'use client'

import { useI18n } from '@/lib/i18n-context'

import {
  ChevronRight, HelpCircle, Lock, LogOut, Mail, Phone, Settings, User
} from 'lucide-react'
import { InfoRow, HelpItem } from './shared'

function ProfileView({ profile, onLogout, onChangePass, onEditProfile, onPrivacy, onHelp }: any) {
  const { t } = useI18n()
    const initial = profile?.full_name ? profile.full_name.charAt(0) : 'U';
    const name = profile?.full_name || 'Usuario';
    const email = profile?.email || 'Correo no disponible';
    const phone = profile?.phone || 'No registrado';

    return (
        <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
             <div className="text-center">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-blue-300/50 mb-6 ring-4 ring-blue-100 relative group cursor-pointer hover:scale-110 transition-transform">
                    {initial}
                    <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">{name}</h2>
                <p className="text-slate-400 font-semibold mb-1 flex items-center justify-center gap-2">
                    <Mail size={14}/> {email}
                </p>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                    <span>📱</span>
                    {phone !== 'No registrado'
                      ? <span className="text-green-600 font-semibold">{phone} <span className="text-[10px] text-green-400">{t('familias.whatsappActivo')}</span></span>
                      : <span className="text-amber-500 font-medium">{t('familias.agregaWsp')}</span>
                    }
                </p>
             </div>
             
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 overflow-hidden shadow-xl">
                <button onClick={onEditProfile} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors">
                            <User size={22} className="text-purple-600"/>
                        </div>
                        Editar Perfil
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>

                <button onClick={onChangePass} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors">
                            <Lock size={22} className="text-blue-600"/>
                        </div>
                        Cambiar Contraseña
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>
                
                <button onClick={onPrivacy} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors">
                            <Lock size={22} className="text-purple-600"/>
                        </div>
                        Privacidad y Seguridad
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>

                <button onClick={onHelp} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors">
                            <HelpCircle size={22} className="text-green-600"/>
                        </div>
                        Centro de Ayuda
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>
                
                <button onClick={onLogout} className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-all group">
                    <span className="font-bold text-red-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-red-100 rounded-2xl group-hover:bg-red-200 transition-colors">
                            <LogOut size={22}/>
                        </div>
                        Cerrar Sesión
                    </span>
                </button>
             </div>

             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">{t('familias.versionApp')}</p>
                <p className="text-2xl font-black text-slate-800">2.0.0</p>
                <p className="text-sm text-slate-500 mt-2">{t('familias.ultimaActualizacion')}</p>
             </div>
        </div>
    )
}

// ====================================================================================
// COMPONENTES AUXILIARES
// ====================================================================================

export default ProfileView
