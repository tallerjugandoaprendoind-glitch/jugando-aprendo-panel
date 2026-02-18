'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, X,
  Download, FileDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function ExcelImportView() {
  const [listaNinos, setListaNinos] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    supabase.from('children').select('id, name').then(({ data }) => data && setListaNinos(data)) 
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChild) return alert("Selecciona paciente y archivo");
    setImporting(true);
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'array', codepage: 65001 });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);
        const recordsToInsert = rawData.map((row: any) => {
            const c: any = {}; 
            Object.keys(row).forEach(k => c[k.trim()] = row[k]);
            return {
              child_id: selectedChild,
              fecha_sesion: c['date'] ? new Date((c['date'] - 25569) * 86400 * 1000).toISOString() : new Date().toISOString(),
              datos: { 
                legacy_observations: c['legacy_observations'] || '',
                legacy_abc_analysis: c['legacy_abc_analysis'] || '',
                mentoring_notes: c['mentoring_notes'] || '',
                legacy_behavior_text: c['legacy_behavior_text'] || '',
                legacy_barriers: c['legacy_barriers'] || '',
                legacy_red_flags: c['legacy_red_flags'] || '',
                legacy_activity: c['legacy_activity'] || '',
                legacy_justification: c['legacy_justification'] || '',
                legacy_home_task: c['legacy_home_task'] || '',
                legacy_whatsapp: c['legacy_whatsapp'] || '',
                conducta: c['legacy_behavior_text'] || ''
              }
            }
        });
        const { error } = await supabase.from('registro_aba').insert(recordsToInsert);
        if (error) throw error;
        alert("✅ ¡Carga exitosa!");
      } catch (err: any) { 
        alert("Error: " + err.message);
      } finally { 
        setImporting(false); 
      }
    };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-6 md:py-10 px-4 animate-fade-in-up">
      <div className="bg-white p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-slate-200 text-center max-w-2xl w-full">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl shadow-green-200">
          <FileSpreadsheet size={40} className="md:w-[60px] md:h-[60px]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 md:mb-3 tracking-tight">Importación Masiva</h2>
        <p className="text-slate-400 text-xs md:text-sm mb-8 md:mb-12 font-medium">Sincroniza historial desde CSV/Excel</p>

        <div className="space-y-6 text-left">
          <div className="space-y-2">
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Paciente</label>
             <select 
               className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-base text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
               value={selectedChild} 
               onChange={(e) => setSelectedChild(e.target.value)}
             >
                <option value="">Seleccionar...</option>
                {listaNinos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
             </select>
          </div>

          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept=".csv, .xlsx" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
              disabled={!selectedChild}
            />
            <div className={`w-full p-12 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
              importing 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-white border-blue-100 group-hover:bg-blue-50 group-hover:border-blue-400'
            }`}>
               {importing ? (
                 <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
               ) : (
                 <Upload className="text-blue-500 mb-4" size={48}/>
               )}
               <span className="text-lg font-black text-slate-600">
                 {importing ? 'Sincronizando...' : 'Seleccionar Archivo'}
               </span>
               <span className="text-xs text-slate-400 mt-2 font-bold uppercase">
                 CSV (UTF-8) o XLSX
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExcelImportView
