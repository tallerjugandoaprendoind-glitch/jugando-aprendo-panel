/**
 * formsIndex.ts
 * Locale-aware form exports.
 * Usage: import { getFormsForLocale } from './formsIndex'
 *        const { ALL_FORMS, FORM_CATEGORIES, PARENT_FORMS, ADMIN_FORMS, FORMS_BY_CATEGORY } = getFormsForLocale(locale)
 */

// Spanish (default)
import * as ES from './neurodivergentForms'

// English
import * as EN_NEURO from './neurodivergentForms.en'
import * as EN_COMP from './competitiveForms.en'
import { COMPETITIVE_FORMS as COMPETITIVE_FORMS_ES } from './competitiveForms'
import { FormDefinition } from './neurodivergentForms'

export function getFormsForLocale(locale: string) {
  if (locale === 'en') {
    const ALL_FORMS: FormDefinition[] = [
      EN_NEURO.SCREENING_TDAH,
      EN_NEURO.CONDUCTA_CASA_TDAH,
      EN_NEURO.SCREENING_TEA,
      EN_NEURO.CONDUCTA_CASA_TEA,
      EN_NEURO.PERFIL_SENSORIAL,
      EN_NEURO.HABILIDADES_SOCIALES,
      EN_NEURO.INFORME_PADRES_GENERAL,
      EN_NEURO.HISTORIA_FAMILIAR,
      EN_COMP.EVALUACION_FUNCIONAL_CONDUCTA,
      EN_COMP.PLAN_INTERVENCION_CONDUCTUAL,
      EN_COMP.OBJETIVOS_IEP,
      EN_COMP.EVALUACION_LENGUAJE_VERBAL,
      EN_COMP.INFORME_PROGRESO_MENSUAL,
      EN_COMP.HABILIDADES_ADAPTATIVAS,
      EN_COMP.PERFIL_SENSORIAL_AVANZADO,
      EN_COMP.REGISTRO_ABC_AVANZADO,
    ]
    return {
      ALL_FORMS,
      FORM_CATEGORIES: EN_NEURO.FORM_CATEGORIES,
      PARENT_FORMS: ALL_FORMS.filter(f => f.targetRole === 'parent' || f.targetRole === 'both'),
      ADMIN_FORMS: ALL_FORMS.filter(f => f.targetRole === 'admin' || f.targetRole === 'both'),
      FORMS_BY_CATEGORY: {
        tdah: ALL_FORMS.filter(f => f.category === 'tdah'),
        tea: ALL_FORMS.filter(f => f.category === 'tea'),
        conductual: ALL_FORMS.filter(f => f.category === 'conductual'),
        sensorial: ALL_FORMS.filter(f => f.category === 'sensorial'),
        habilidades: ALL_FORMS.filter(f => f.category === 'habilidades'),
        familia: ALL_FORMS.filter(f => f.category === 'familia'),
        seguimiento: ALL_FORMS.filter(f => f.category === 'seguimiento'),
      },
    }
  }

  // Default: Spanish
  return {
    ALL_FORMS: ES.ALL_FORMS,
    FORM_CATEGORIES: ES.FORM_CATEGORIES,
    PARENT_FORMS: ES.PARENT_FORMS,
    ADMIN_FORMS: ES.ADMIN_FORMS,
    FORMS_BY_CATEGORY: ES.FORMS_BY_CATEGORY,
  }
}
