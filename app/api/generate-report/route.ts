// ==============================================================================
// API: GENERAR REPORTE WORD PROFESIONAL
// Ruta: /app/api/generate-report/route.ts
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { generateReport } from '@/lib/report-generator'

interface ReportRequest {
  reportType: string;
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  evaluationId: string;
  formTitle?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json()
    const { reportType, childName, childAge, evaluatorName, reportData, evaluationId, formTitle } = body

    if (!reportType || !childName || !reportData) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (reportType, childName, reportData)' },
        { status: 400 }
      )
    }

    console.log('📝 Generando reporte:', { reportType, childName, childAge })

    const result = await generateReport({
      reportType,
      childName,
      childAge,
      evaluatorName,
      reportData,
      evaluationId,
      formTitle,
    })

    console.log('✅ Reporte generado:', result.fileName)

    return NextResponse.json({
      success: true,
      fileName: result.fileName,
      fileData: result.fileData,
      mimeType: result.mimeType,
    })

  } catch (error: any) {
    console.error('❌ Error generando reporte:', error)
    return NextResponse.json(
      { error: 'Error interno al generar el reporte.', details: error.message },
      { status: 500 }
    )
  }
}
