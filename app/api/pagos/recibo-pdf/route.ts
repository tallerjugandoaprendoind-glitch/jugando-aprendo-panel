// app/api/pagos/recibo-pdf/route.ts
// Genera un recibo de pago en PDF profesional usando jsPDF

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function padRecibo(n: number) { return String(n).padStart(4, '0') }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtCurrency(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Fetch center config ───────────────────────────────────────────────────────
async function getCenterInfo() {
  // Try to get from centro_instrucciones table first, fallback to env
  try {
    const { data } = await supabase.from('centro_instrucciones').select('*').limit(1).single()
    if (data) return {
      nombre: data.nombre_centro || process.env.NEXT_PUBLIC_APP_NAME || 'Jugando Aprendo',
      ruc:    data.ruc || '',
      direccion: data.direccion || '',
      telefono:  data.telefono || '',
      email:     data.email || '',
    }
  } catch {}
  return {
    nombre:    process.env.NEXT_PUBLIC_APP_NAME || 'Jugando Aprendo',
    ruc:       process.env.CENTER_RUC || '',
    direccion: process.env.CENTER_ADDRESS || '',
    telefono:  process.env.CENTER_PHONE || '',
    email:     process.env.CENTER_EMAIL || '',
  }
}

// ── PDF generation (pure JS, no jsPDF import needed server-side) ──────────────
// We generate an HTML template and return it as a self-printing page.
// The client will open this in a new tab and the browser handles PDF via print.
function generateReceiptHTML(payment: any, center: any, child: any, parentProfile: any, reciboNum: string) {
  const statusLabels: Record<string, string> = {
    paid: 'PAGADO', pending: 'PENDIENTE', partial: 'PARCIAL',
    cancelled: 'CANCELADO', refunded: 'DEVUELTO',
  }
  const statusColors: Record<string, string> = {
    paid: '#059669', pending: '#d97706', partial: '#2563eb',
    cancelled: '#dc2626', refunded: '#7c3aed',
  }
  const statusBg: Record<string, string> = {
    paid: '#d1fae5', pending: '#fef3c7', partial: '#dbeafe',
    cancelled: '#fee2e2', refunded: '#ede9fe',
  }

  const isPaid    = payment.status === 'paid'
  const statusLbl = statusLabels[payment.status] || payment.status.toUpperCase()
  const statusClr = statusColors[payment.status] || '#374151'
  const statusBgC = statusBg[payment.status]   || '#f3f4f6'

  const payDate = payment.paid_at || payment.created_at
  const createdDate = fmtDate(payment.created_at)
  const paidDate    = payDate ? fmtDate(payDate) : '—'

  const methodLabel: Record<string, string> = {
    efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin',
    transferencia: 'Transferencia Bancaria', tarjeta: 'Tarjeta', otro: 'Otro',
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo ${reciboNum} — ${center.nombre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; padding: 24px 16px; }
    .page { background: white; width: 100%; max-width: 680px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.10); }

    /* Header */
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 36px 28px; color: white; }
    .header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .logo-area h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-area p  { font-size: 12px; opacity: 0.75; margin-top: 2px; }
    .recibo-badge { text-align: right; }
    .recibo-badge .tipo { font-size: 10px; font-weight: 700; letter-spacing: 2px; opacity: 0.7; text-transform: uppercase; }
    .recibo-badge .num  { font-size: 26px; font-weight: 900; line-height: 1; }
    .center-info { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
    .center-info span { font-size: 11px; opacity: 0.8; }
    .center-info span b { opacity: 1; font-weight: 700; }

    /* Status bar */
    .status-bar { padding: 10px 36px; display: flex; align-items: center; justify-content: space-between; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .date-issued { font-size: 11px; color: #6b7280; }

    /* Body */
    .body { padding: 28px 36px; }

    /* Section */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .info-item p { font-size: 13px; font-weight: 600; color: #1f2937; }

    /* Items table */
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table thead th { font-size: 9px; font-weight: 800; color: #9ca3af; letter-spacing: 1.5px; text-transform: uppercase; padding: 0 0 8px; text-align: left; }
    .items-table thead th:last-child { text-align: right; }
    .items-table tbody tr { border-top: 1px solid #f1f5f9; }
    .items-table tbody td { padding: 12px 0; font-size: 13px; color: #374151; vertical-align: top; }
    .items-table tbody td:last-child { text-align: right; font-weight: 700; color: #059669; }
    .items-table tfoot tr { border-top: 2px solid #e5e7eb; }
    .items-table tfoot td { padding: 12px 0 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 12px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 1px; }
    .total-value { font-size: 28px; font-weight: 900; color: #059669; line-height: 1; }

    /* Payment method */
    .method-pill { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; color: #374151; margin-top: 4px; }

    /* Notes */
    .notes-box { background: #fafafa; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #6b7280; margin-top: 8px; border: 1px solid #f0f0f0; }

    /* Footer */
    .footer { background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 20px 36px; display: flex; align-items: center; justify-content: space-between; }
    .footer-left { font-size: 11px; color: #9ca3af; line-height: 1.7; }
    .footer-right { font-size: 10px; color: #d1d5db; text-align: right; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 80px; font-weight: 900; color: rgba(16,185,129,0.04); pointer-events: none; white-space: nowrap; z-index: 0; }

    /* Divider */
    .divider { border: none; border-top: 1px dashed #e5e7eb; margin: 20px 0; }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page" style="position:relative;">
    <div class="watermark">${isPaid ? '✓ PAGADO' : statusLbl}</div>

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="logo-area">
          <h1>🎯 ${center.nombre}</h1>
          <p>Centro de Terapias ABA Especializado</p>
        </div>
        <div class="recibo-badge">
          <p class="tipo">Recibo de Pago</p>
          <p class="num">#${reciboNum}</p>
        </div>
      </div>
      <div class="center-info">
        ${center.ruc ? `<span><b>RUC:</b> ${center.ruc}</span>` : ''}
        ${center.direccion ? `<span><b>📍</b> ${center.direccion}</span>` : ''}
        ${center.telefono ? `<span><b>📞</b> ${center.telefono}</span>` : ''}
        ${center.email ? `<span><b>✉️</b> ${center.email}</span>` : ''}
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar" style="background:${statusBgC}20; border-bottom: 1px solid ${statusBgC};">
      <span class="status-badge" style="background:${statusBgC}; color:${statusClr};">${statusLbl}</span>
      <span class="date-issued">Emitido: ${createdDate}</span>
    </div>

    <!-- Body -->
    <div class="body">

      <!-- Datos del paciente / familia -->
      <div class="section">
        <p class="section-title">Datos del Paciente y Familia</p>
        <div class="info-grid">
          <div class="info-item">
            <label>Paciente</label>
            <p>${child?.name || '—'}</p>
          </div>
          <div class="info-item">
            <label>Padre / Tutor</label>
            <p>${parentProfile?.full_name || '—'}</p>
          </div>
          ${parentProfile?.email ? `
          <div class="info-item">
            <label>Email</label>
            <p>${parentProfile.email}</p>
          </div>` : ''}
          ${parentProfile?.phone ? `
          <div class="info-item">
            <label>Teléfono</label>
            <p>${parentProfile.phone}</p>
          </div>` : ''}
        </div>
      </div>

      <hr class="divider" />

      <!-- Detalle del pago -->
      <div class="section">
        <p class="section-title">Detalle del Servicio</p>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width:60%">Descripción</th>
              <th style="width:20%; text-align:center">Cant.</th>
              <th style="width:20%">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${payment.concept}</strong>
                ${payment.notes ? `<br/><span style="font-size:11px;color:#9ca3af;margin-top:2px;display:block">${payment.notes}</span>` : ''}
              </td>
              <td style="text-align:center;">1</td>
              <td>${fmtCurrency(Number(payment.amount))}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">
                <div class="total-row">
                  <span class="total-label">Total a pagar</span>
                  <span class="total-value">${fmtCurrency(Number(payment.amount))}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <hr class="divider" />

      <!-- Método y fecha -->
      <div class="section">
        <p class="section-title">Información de Pago</p>
        <div class="info-grid">
          <div class="info-item">
            <label>Método de pago</label>
            <div class="method-pill">
              ${payment.payment_method === 'yape' ? '💜 Yape' :
                payment.payment_method === 'plin' ? '🟢 Plin' :
                payment.payment_method === 'efectivo' ? '💵 Efectivo' :
                payment.payment_method === 'transferencia' ? '🏦 Transferencia' :
                payment.payment_method === 'tarjeta' ? '💳 Tarjeta' : '💰 Otro'}
            </div>
          </div>
          <div class="info-item">
            <label>Fecha de pago</label>
            <p>${paidDate}</p>
          </div>
        </div>
      </div>

      ${isPaid ? `
      <div style="background:#d1fae520;border:1px solid #a7f3d0;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-top:8px;">
        <span style="font-size:20px;">✅</span>
        <p style="font-size:12px;color:#065f46;font-weight:600;">Pago recibido y confirmado. Gracias por confiar en ${center.nombre}.</p>
      </div>` : ''}

    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <strong style="color:#374151;">${center.nombre}</strong><br/>
        ${center.ruc ? `RUC ${center.ruc} · ` : ''}${center.direccion || 'Centro de Terapias ABA'}<br/>
        Este documento es un recibo de pago interno.
      </div>
      <div class="footer-right">
        Recibo #${reciboNum}<br/>
        ${new Date().toLocaleDateString('es-PE')}
      </div>
    </div>

    <!-- Print button (no imprime) -->
    <div class="no-print" style="text-align:center;padding:16px;background:#f8fafc;border-top:1px solid #e5e7eb;">
      <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:10px 28px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;">🖨️ Imprimir / Guardar PDF</button>
      <button onclick="window.close()" style="background:#f1f5f9;color:#374151;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Cerrar</button>
    </div>
  </div>

  <script>
    // Auto-focus for keyboard shortcut Ctrl+P
    window.onload = () => { document.title = 'Recibo ${reciboNum} — ${center.nombre}' }
  </script>
</body>
</html>`
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('id')

  if (!paymentId) {
    return NextResponse.json({ error: 'Falta el ID del pago' }, { status: 400 })
  }

  try {
    // 1. Fetch payment with child and parent profile
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        children (
          id, name, parent_id,
          profiles:parent_id ( full_name, email, phone )
        )
      `)
      .eq('id', paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // 2. Count prior payments for this child to generate sequential receipt number
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', payment.child_id)
      .lte('created_at', payment.created_at)

    const reciboNum = `${new Date(payment.created_at).getFullYear()}-${padRecibo(count || 1)}`

    // 3. Get center info
    const center = await getCenterInfo()

    // 4. Get child and parent info
    const child         = payment.children
    const parentProfile = (child as any)?.profiles

    // 5. Generate HTML receipt
    const html = generateReceiptHTML(payment, center, child, parentProfile, reciboNum)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e: any) {
    console.error('Error generando recibo:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
