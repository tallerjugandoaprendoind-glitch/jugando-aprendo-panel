'use client'

import { useI18n } from '@/lib/i18n-context'
import React from 'react'
import { Loader2 } from 'lucide-react'

export function StatCard({icon, label, value, color, trend}: any) {
  return (
    <div className={`${color} p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/30 rounded-full blur-xl -translate-y-4 translate-x-4" />
      <div className="flex items-start justify-between mb-3 relative">
        <div className="text-2xl">{icon}</div>
        {trend && <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <p className="text-2xl font-black text-slate-800 mb-1 relative">{value}</p>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider relative">{label}</p>
    </div>
  )
}

export function ObjectiveBar({ label, progress, color, icon }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-lg flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-slate-700 truncate">{label}</p>
          <p className="text-xs font-black text-slate-500 ml-2">{progress}%</p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{width: `${progress}%`}} />
        </div>
      </div>
    </div>
  )
}

export function TimeSlotBtn({ time, isTaken, loading, onClick, isPast }: any) {
  const isDisabled = isTaken || isPast
  return (
    <button
      onClick={onClick}
      disabled={isDisabled || loading}
      className={`
        p-3 rounded-xl text-sm font-bold transition-all
        ${isTaken ? 'bg-red-50 text-red-400 border border-red-100 cursor-not-allowed' :
          isPast  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' :
                    'bg-white border-2 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200/50 active:scale-95'}
        ${loading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : time}
    </button>
  )
}

export function NavBtnDesktop({icon, label, active, onClick, badge}: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 relative group
        ${active
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>
        {icon}
      </span>
      <span className={`font-semibold text-sm truncate flex-1 ${active ? 'text-white' : ''}`}>{label}</span>
      {badge > 0 && (
        <span className={`min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full flex items-center justify-center
          ${active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function NavBtnMobile({icon, label, active, onClick, badge}: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-all relative active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}
      style={{ minWidth: 0 }}
    >
      <div className={`relative p-1.5 rounded-xl transition-all ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
        <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] font-black flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[9px] font-bold leading-tight truncate w-full text-center ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  )
}

export function NotificationItem({icon, title, message, time, isNew}: any) {
  return (
    <div className={`flex gap-3 p-3 rounded-xl transition-all ${isNew ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'}`}>
      <div className="text-xl flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
          <span className="text-[10px] text-slate-400 flex-shrink-0">{time}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{message}</p>
      </div>
    </div>
  )
}

export function HelpItem({icon, title, description}: any) {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer group">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      {icon && <div className="mt-0.5 text-slate-400 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
      </div>
    </div>
  )
}
