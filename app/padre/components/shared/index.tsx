'use client'

import { useI18n } from '@/lib/i18n-context'

import React from 'react'
import { Loader2 } from 'lucide-react'

export function StatCard({icon, label, value, color, trend}: any) {
    return (
        <div className={`${color} p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group cursor-default`}>
            <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{icon}</div>
                {trend && <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
            </div>
            <p className="text-2xl font-black text-slate-800 mb-1">{value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
    )
}

export function ObjectiveBar({ label, progress, color, icon }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-lg">{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{label}</p>
                    <p className="text-xs font-black text-slate-500 ml-2">{progress}%</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{width: `${progress}%`}}></div>
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
                  isPast ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' :
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
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all relative ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
            {icon}
            <span className="font-bold text-sm">{label}</span>
            {badge > 0 && <span className="absolute right-3 top-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">{badge}</span>}
        </button>
    )
}

export function NavBtnMobile({icon, label, active, onClick, badge}: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all relative ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <div className="relative">
                {icon}
                {badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] font-black flex items-center justify-center">{badge}</span>}
            </div>
            <span className="text-[10px] font-bold">{label}</span>
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
                    <span className="text-xs text-slate-400 flex-shrink-0">{time}</span>
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
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
            </div>
        </div>
    )
}
