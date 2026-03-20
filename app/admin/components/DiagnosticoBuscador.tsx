'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useMemo, useRef } from 'react'
import { Search, X, Copy, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

const DIAGNOSTICOS = [
  // ── NEURODESARROLLO
  { cie11:'6A02',    dsm5:'299.00', nombre:'Trastorno del Espectro Autista (TEA)',                    area:'Neurodesarrollo', sinonimos:['autismo','tea','asd','espectro','asperger'], desc:'Déficits persistentes en comunicación e interacción social con patrones restrictivos y repetitivos de comportamiento.', criterios:'A: Déficits en comunicación social. B: Patrones restrictivos/repetitivos. C: Síntomas en período de desarrollo temprano.' },
  { cie11:'6A02.0',  dsm5:'299.00', nombre:'TEA Nivel 1 — Sin discapacidad intelectual',             area:'Neurodesarrollo', sinonimos:['autismo nivel 1','asperger','alto funcionamiento'], desc:'Sin discapacidad intelectual ni trastorno del lenguaje funcional. Requiere apoyo.', criterios:'Nivel 1: Requiere apoyo. Sin DI. Sin trastorno lenguaje funcional.' },
  { cie11:'6A02.1',  dsm5:'299.00', nombre:'TEA Nivel 2 — Con discapacidad intelectual',             area:'Neurodesarrollo', sinonimos:['autismo nivel 2','autismo con di'], desc:'Con discapacidad intelectual acompañante. Requiere apoyo sustancial.', criterios:'Nivel 2: Requiere apoyo sustancial. Con DI.' },
  { cie11:'6A02.2',  dsm5:'299.00', nombre:'TEA Nivel 3 — Apoyo muy sustancial',                     area:'Neurodesarrollo', sinonimos:['autismo severo','autismo nivel 3','autismo grave'], desc:'Requiere apoyo muy sustancial. Comunicación verbal mínima.', criterios:'Nivel 3: Requiere apoyo muy sustancial.' },
  { cie11:'6A05',    dsm5:'314.01', nombre:'TDAH — Trastorno por Déficit de Atención e Hiperactividad', area:'Neurodesarrollo', sinonimos:['tdah','adhd','deficit atencion','hiperactividad','impulsividad'], desc:'Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere el funcionamiento.', criterios:'≥6 síntomas durante ≥6 meses en ≥2 contextos. Inicio antes de los 12 años.' },
  { cie11:'6A05.0',  dsm5:'314.00', nombre:'TDAH — Presentación predominantemente inatenta',        area:'Neurodesarrollo', sinonimos:['tdah inatento','add','inatención sin hiperactividad'], desc:'Inatención prominente sin hiperactividad significativa.', criterios:'≥6 síntomas inatención. <6 síntomas hiperactivo-impulsivos.' },
  { cie11:'6A05.1',  dsm5:'314.01', nombre:'TDAH — Presentación hiperactiva/impulsiva',             area:'Neurodesarrollo', sinonimos:['tdah hiperactivo','hiperactividad pura'], desc:'Hiperactividad e impulsividad predominantes sin inatención significativa.', criterios:'≥6 síntomas hiperactivo-impulsivos. <6 síntomas inatención.' },
  { cie11:'6A05.2',  dsm5:'314.01', nombre:'TDAH — Presentación combinada',                         area:'Neurodesarrollo', sinonimos:['tdah combinado','tdah mixto'], desc:'Inatención y hiperactividad-impulsividad ambas presentes.', criterios:'≥6 síntomas de ambas categorías.' },
  { cie11:'6A00',    dsm5:'319',    nombre:'Discapacidad Intelectual (DI)',                          area:'Neurodesarrollo', sinonimos:['di','retraso mental','retardo','discapacidad cognitiva','id'], desc:'Déficits en funcionamiento intelectual y conducta adaptativa en dominios conceptual, social y práctico.', criterios:'CI <70 + déficits conducta adaptativa + inicio en período de desarrollo.' },
  { cie11:'6A00.0',  dsm5:'317',    nombre:'Discapacidad Intelectual Leve',                         area:'Neurodesarrollo', sinonimos:['di leve','retraso leve'], desc:'CI aprox. 50-69. Habilidades académicas hasta 6° grado con apoyo.', criterios:'CI 50-69. Puede vivir semi-independientemente.' },
  { cie11:'6A00.1',  dsm5:'318.0',  nombre:'Discapacidad Intelectual Moderada',                     area:'Neurodesarrollo', sinonimos:['di moderada','retraso moderado'], desc:'CI aprox. 35-49. Requiere apoyo sustancial en AVD.', criterios:'CI 35-49. Comunica ideas básicas.' },
  { cie11:'6A00.2',  dsm5:'318.1',  nombre:'Discapacidad Intelectual Grave',                        area:'Neurodesarrollo', sinonimos:['di grave','retraso grave','di severa'], desc:'CI aprox. 20-34. Requiere apoyo extenso.', criterios:'CI 20-34. Lenguaje muy limitado.' },
  { cie11:'6A00.3',  dsm5:'318.2',  nombre:'Discapacidad Intelectual Profunda',                     area:'Neurodesarrollo', sinonimos:['di profunda','retraso profundo'], desc:'CI por debajo de 20. Cuidado constante.', criterios:'CI <20. Comunicación mínima. Dependencia total.' },
  { cie11:'6A01',    dsm5:'315.39', nombre:'Trastorno del Desarrollo del Lenguaje (TDL)',            area:'Neurodesarrollo', sinonimos:['tdl','trastorno lenguaje','retraso lenguaje','disfasia'], desc:'Dificultades persistentes en adquisición y uso del lenguaje.', criterios:'Déficits vocabulario, gramática o discurso. Inicio en período de desarrollo.' },
  { cie11:'6A01.0',  dsm5:'315.32', nombre:'TDL — Trastorno Mixto Receptivo-Expresivo',             area:'Neurodesarrollo', sinonimos:['receptivo expresivo','comprension lenguaje'], desc:'Comprensión y expresión del lenguaje ambas afectadas.', criterios:'Déficits comprensión + expresión.' },
  { cie11:'6A01.1',  dsm5:'315.31', nombre:'TDL — Trastorno Expresivo del Lenguaje',                area:'Neurodesarrollo', sinonimos:['expresion lenguaje','trastorno expresivo'], desc:'Solo expresión afectada, comprensión preservada.', criterios:'Déficits expresión con comprensión normal.' },
  { cie11:'6A01.2',  dsm5:'315.35', nombre:'Trastorno Fonológico — Dislalia',                       area:'Neurodesarrollo', sinonimos:['dislalia','fonologia','articulacion','pronunciacion'], desc:'Dificultades en producción fonológica que interfieren la comunicación.', criterios:'Errores articulación persistentes que afectan inteligibilidad.' },
  { cie11:'6A01.3',  dsm5:'307.0',  nombre:'Tartamudeo — Disfluencia del habla infantil',           area:'Neurodesarrollo', sinonimos:['tartamudez','disfluencia','tartamudeo','stuttering','repeticiones'], desc:'Alteraciones en fluidez y tiempo del habla: repeticiones, prolongaciones, bloqueos.', criterios:'Disfluencia que impacta comunicación. Inicio en desarrollo temprano.' },
  { cie11:'6A0Y',    dsm5:'315.0',  nombre:'Trastorno del Aprendizaje — Dislexia (Lectura)',         area:'Neurodesarrollo', sinonimos:['dislexia','trastorno lectura','dificultad lectura','leer'], desc:'Dificultades en exactitud, velocidad o comprensión lectora.', criterios:'Rendimiento lector inferior al esperado por edad/CI.' },
  { cie11:'6A0Z',    dsm5:'315.1',  nombre:'Trastorno del Aprendizaje — Discalculia (Matemáticas)',  area:'Neurodesarrollo', sinonimos:['discalculia','trastorno matematicas','numeros'], desc:'Dificultades en procesamiento numérico, cálculo o razonamiento matemático.', criterios:'Rendimiento en matemáticas inferior al esperado.' },
  { cie11:'6A0X',    dsm5:'315.2',  nombre:'Trastorno del Aprendizaje — Disgrafía (Escritura)',      area:'Neurodesarrollo', sinonimos:['disgrafia','trastorno escritura','escritura letra'], desc:'Dificultades en ortografía, gramática escrita o claridad de escritura.', criterios:'Rendimiento escritura inferior al esperado.' },
  { cie11:'6A04',    dsm5:'315.4',  nombre:'Trastorno del Desarrollo de la Coordinación (TDC/Dispraxia)', area:'Neurodesarrollo', sinonimos:['dispraxia','tdc','coordinacion motora','torpeza','motricidad'], desc:'Adquisición y ejecución de habilidades motoras coordinadas significativamente por debajo de lo esperado.', criterios:'Motor inferior al esperado. Interfiere AVD. No atribuible a otra condición.' },
  { cie11:'6A06',    dsm5:'307.3',  nombre:'Trastorno de Movimientos Estereotipados (TME)',          area:'Neurodesarrollo', sinonimos:['estereotipias','movimientos repetitivos','tme','balanceo'], desc:'Movimientos repetitivos aparentemente impulsados sin propósito que interfieren el funcionamiento.', criterios:'Duración ≥4 semanas. No atribuible a sustancias ni otra condición.' },
  // ── TICS
  { cie11:'8A05.00', dsm5:'307.21', nombre:'Trastorno de Tics Provisional',                         area:'Tics', sinonimos:['tic provisional','tic transitorio'], desc:'Tics motores y/o vocales presentes menos de 12 meses.', criterios:'Duración <12 meses. Inicio antes de los 18 años.' },
  { cie11:'8A05.01', dsm5:'307.22', nombre:'Trastorno de Tics Motor Crónico',                       area:'Tics', sinonimos:['tic motor cronico','tics motores'], desc:'Tics motores múltiples, más de 12 meses, sin tics vocales.', criterios:'Solo tics motores. Duración ≥12 meses.' },
  { cie11:'8A05.02', dsm5:'307.23', nombre:'Síndrome de Tourette',                                  area:'Tics', sinonimos:['tourette','tics vocales','coprolalia','tics multiples'], desc:'Múltiples tics motores y al menos un tic vocal, no necesariamente concurrentes.', criterios:'Múltiples tics motores + ≥1 tic vocal. Duración ≥12 meses.' },
  { cie11:'8A05.03', dsm5:'307.20', nombre:'Trastorno de Tics Vocal Crónico',                       area:'Tics', sinonimos:['tic vocal cronico','tics vocales cronicos'], desc:'Tics vocales múltiples sin tics motores, más de 12 meses.', criterios:'Solo tics vocales. Duración ≥12 meses.' },
  // ── ANSIEDAD
  { cie11:'6B00',    dsm5:'300.02', nombre:'Trastorno de Ansiedad Generalizada (TAG)',               area:'Ansiedad', sinonimos:['tag','ansiedad generalizada','preocupacion excesiva','gad'], desc:'Ansiedad y preocupación excesivas sobre múltiples eventos, difíciles de controlar.', criterios:'≥3 síntomas (inquietud, fatiga, concentración, irritabilidad, tensión, sueño). ≥6 meses.' },
  { cie11:'6B01',    dsm5:'300.23', nombre:'Trastorno de Ansiedad Social (Fobia Social)',            area:'Ansiedad', sinonimos:['fobia social','ansiedad social','timidez extrema'], desc:'Miedo o ansiedad intensos ante situaciones sociales de evaluación por otros.', criterios:'Miedo evaluación negativa. Situaciones evitadas o soportadas con angustia.' },
  { cie11:'6B02',    dsm5:'300.01', nombre:'Trastorno de Pánico',                                   area:'Ansiedad', sinonimos:['panico','crisis panico','ataque panico'], desc:'Ataques de pánico recurrentes inesperados seguidos de preocupación por nuevos ataques.', criterios:'Ataques pánico recurrentes + ≥1 mes preocupación o cambio conductual.' },
  { cie11:'6B03',    dsm5:'309.21', nombre:'Trastorno de Ansiedad por Separación',                  area:'Ansiedad', sinonimos:['ansiedad separacion','miedo separacion','apego ansioso'], desc:'Miedo o ansiedad excesivos ante la separación de figuras de apego.', criterios:'≥3 síntomas. ≥4 semanas niños / ≥6 meses adultos.' },
  { cie11:'6B04',    dsm5:'300.29', nombre:'Fobia Específica',                                      area:'Ansiedad', sinonimos:['fobia','miedo especifico','fobia animales','fobia altura','fobia sangre'], desc:'Miedo o ansiedad intensos ante objeto o situación específica.', criterios:'Miedo desproporcionado. Evitación activa. ≥6 meses.' },
  { cie11:'6B05',    dsm5:'300.22', nombre:'Agorafobia',                                            area:'Ansiedad', sinonimos:['agorafobia','miedo espacios abiertos','multitudes'], desc:'Miedo intenso ante espacios abiertos, multitudes, fuera de casa, transporte público.', criterios:'≥2 contextos agorafóbicos. Evitación activa. ≥6 meses.' },
  { cie11:'6B0Y',    dsm5:'313.23', nombre:'Mutismo Selectivo',                                     area:'Ansiedad', sinonimos:['mutismo selectivo','mutismo','no habla escuela'], desc:'Incapacidad consistente de hablar en situaciones sociales específicas a pesar de hablar en otras.', criterios:'Falla habla en contextos específicos. ≥1 mes. Interfiere logros.' },
  // ── TOC
  { cie11:'6B20',    dsm5:'300.3',  nombre:'TOC — Trastorno Obsesivo Compulsivo',                   area:'TOC', sinonimos:['toc','ocd','obsesion','compulsion','rituales','lavado manos'], desc:'Obsesiones (pensamientos intrusivos) y/o compulsiones (comportamientos repetitivos) que consumen tiempo.', criterios:'Obsesiones y/o compulsiones. >1 hora/día. Causa malestar/disfunción.' },
  { cie11:'6B21',    dsm5:'300.7',  nombre:'Trastorno Dismórfico Corporal (TDC)',                   area:'TOC', sinonimos:['dismorfia','tdc','bdd','obsesion cuerpo','apariencia'], desc:'Preocupación por defecto(s) percibido(s) en apariencia física mínimos para otros.', criterios:'Preocupación excesiva apariencia. Comportamientos repetitivos. Malestar/disfunción.' },
  { cie11:'6B22',    dsm5:'300.3',  nombre:'Trastorno de Acumulación — Hoarding',                  area:'TOC', sinonimos:['acumulacion','hoarding','coleccionismo patologico'], desc:'Dificultad persistente para deshacerse de posesiones independientemente de su valor.', criterios:'Dificultad deshacerse. Angustia al eliminar. Compromete espacios.' },
  { cie11:'6B25',    dsm5:'312.39', nombre:'Tricotilomanía — Arrancarse el Cabello',                area:'TOC', sinonimos:['tricotilomania','arrancarse cabello','alopecia'], desc:'Arrancarse el cabello de manera recurrente resultando en pérdida capilar.', criterios:'Intentos reducir o detener. Malestar clínico significativo.' },
  { cie11:'6B24',    dsm5:'698.4',  nombre:'Trastorno de Excoriación — Skin Picking',               area:'TOC', sinonimos:['excoriacion','skin picking','pellizcarse','rascarse piel'], desc:'Arrancarse la piel recurrentemente resultando en lesiones cutáneas.', criterios:'Intentos repetidos de disminuir. Malestar o deterioro funcional.' },
  // ── TRAUMA
  { cie11:'6B40',    dsm5:'309.81', nombre:'TEPT — Trastorno de Estrés Postraumático',              area:'Trauma', sinonimos:['tept','ptsd','trauma','estres postraumatico','flashbacks'], desc:'Síntomas de reexperimentación, evitación, cognición negativa e hiperactivación tras evento traumático.', criterios:'Exposición a trauma. Síntomas ≥1 mes. Interfiere funcionamiento.' },
  { cie11:'6B41',    dsm5:'308.3',  nombre:'Trastorno de Estrés Agudo',                             area:'Trauma', sinonimos:['estres agudo','reaccion aguda trauma'], desc:'Síntomas TEPT durante 3-30 días inmediatamente después de evento traumático.', criterios:'Síntomas 3-30 días tras trauma.' },
  { cie11:'6B43',    dsm5:'313.89', nombre:'Trastorno de Relación Social Desinhibida (TRSD)',       area:'Trauma', sinonimos:['desinhibicion social','trsd','dsed','familiaridad excesiva extraños'], desc:'Comportamiento de acercamiento excesivo e indiscriminado a extraños.', criterios:'≥2 síntomas. Relacionado con cuidado inadecuado. >9 meses de edad.' },
  { cie11:'6B44',    dsm5:'313.89', nombre:'Trastorno de Apego Reactivo (TAR)',                     area:'Trauma', sinonimos:['apego reactivo','tar','rad','inhibicion emocional'], desc:'Comportamiento emocionalmente retraído hacia cuidadores. Escasa respuesta al consuelo.', criterios:'≥2 síntomas inhibición/retraimiento. Relacionado con cuidado inadecuado.' },
  { cie11:'6B43.1',  dsm5:'309.0',  nombre:'Trastorno de Adaptación',                              area:'Trauma', sinonimos:['trastorno adaptacion','ajuste','reaccion estres'], desc:'Síntomas emocionales/conductuales en respuesta a un factor estresante identificable.', criterios:'Síntomas dentro de 3 meses del estresor. Angustia excesiva o disfunción.' },
  // ── ESTADO DE ÁNIMO
  { cie11:'6A70',    dsm5:'296.xx', nombre:'Trastorno Depresivo Mayor (TDM)',                       area:'Estado de Ánimo', sinonimos:['depresion','tdm','mdd','estado animo depresivo','tristeza'], desc:'Episodio(s) depresivo(s) mayor(es) sin historia de episodios hipomaníacos o maníacos.', criterios:'≥5 síntomas ≥2 semanas (ánimo depresivo y/o anhedonia obligatorio).' },
  { cie11:'6A71',    dsm5:'300.4',  nombre:'Trastorno Depresivo Persistente — Distimia',           area:'Estado de Ánimo', sinonimos:['distimia','depresion cronica','distimico'], desc:'Estado de ánimo depresivo crónico la mayor parte del día ≥2 años.', criterios:'Ánimo depresivo crónico ≥2 años (≥1 año niños). ≥2 síntomas adicionales.' },
  { cie11:'6A72',    dsm5:'296.99', nombre:'TDDEA — Trastorno de Desregulación Disruptiva del Estado de Ánimo', area:'Estado de Ánimo', sinonimos:['tddea','dmdd','desregulacion emocional','rabietas severas','irritabilidad cronica'], desc:'Irritabilidad persistente severa y episodios de descontrol conductual ≥3 veces/semana.', criterios:'6-18 años. Humor irritable/enojado la mayor parte del día ≥12 meses.' },
  { cie11:'6A80',    dsm5:'296.40', nombre:'Trastorno Bipolar I',                                  area:'Estado de Ánimo', sinonimos:['bipolar','trastorno bipolar','mania','episodio maniaco'], desc:'Al menos un episodio maníaco, precedido o seguido de episodio hipomaníaco o depresivo mayor.', criterios:'≥1 episodio maníaco (≥7 días). Impacto severo.' },
  { cie11:'6A81',    dsm5:'296.89', nombre:'Trastorno Bipolar II',                                 area:'Estado de Ánimo', sinonimos:['bipolar ii','hipomania','trastorno bipolar ii'], desc:'Al menos un episodio hipomaníaco y depresivo mayor. Sin episodios maníacos completos.', criterios:'≥1 episodio hipomaníaco (≥4 días) + ≥1 episodio depresivo mayor.' },
  // ── ALIMENTACIÓN
  { cie11:'6B80',    dsm5:'307.1',  nombre:'Anorexia Nerviosa',                                    area:'Alimentación', sinonimos:['anorexia','restriccion alimentaria','bajo peso','dieta extrema'], desc:'Restricción de ingesta energética, miedo intenso a ganar peso, alteración percepción corporal.', criterios:'Restricción calórica → bajo peso. Miedo ganar peso. Distorsión imagen corporal.' },
  { cie11:'6B81',    dsm5:'307.51', nombre:'Bulimia Nerviosa',                                     area:'Alimentación', sinonimos:['bulimia','atracones','purgas','vomitos','laxantes'], desc:'Episodios recurrentes de atracones seguidos de conductas compensatorias.', criterios:'Atracones y purgas ≥1/semana durante ≥3 meses.' },
  { cie11:'6B82',    dsm5:'307.51', nombre:'Trastorno por Atracón (BED)',                          area:'Alimentación', sinonimos:['atracones','bed','binge eating','comedor compulsivo'], desc:'Episodios recurrentes de atracones sin conductas compensatorias.', criterios:'Atracones ≥1/semana durante ≥3 meses. Malestar significativo.' },
  { cie11:'6B83',    dsm5:'307.59', nombre:'ARFID — Trastorno de Evitación/Restricción Ingesta',  area:'Alimentación', sinonimos:['arfid','selectividad alimentaria','comedor selectivo','neofobia alimentaria'], desc:'Evitación/restricción por características sensoriales, miedo consecuencias o falta de interés.', criterios:'No por distorsión imagen. Causa déficit nutricional.' },
  { cie11:'6B84',    dsm5:'307.52', nombre:'Pica',                                                 area:'Alimentación', sinonimos:['pica','comer tierra','geofagia','comer objetos'], desc:'Ingestión persistente de sustancias no nutritivas y no alimenticias.', criterios:'≥1 mes. Inapropiado para nivel de desarrollo.' },
  { cie11:'6B85',    dsm5:'307.53', nombre:'Trastorno de Rumiación',                               area:'Alimentación', sinonimos:['rumiacion','regurgitacion','mericismo'], desc:'Regurgitación repetida de alimentos que luego se remastica, retraga o escupe.', criterios:'≥1 mes. No por condición médica.' },
  // ── SUEÑO
  { cie11:'7A00',    dsm5:'307.42', nombre:'Insomnio Crónico',                                     area:'Sueño', sinonimos:['insomnio','dificultad dormir','despertar nocturno'], desc:'Dificultad para iniciar o mantener el sueño ≥3 noches/semana durante ≥3 meses.', criterios:'Dificultad sueño ≥3x/semana. ≥3 meses. Malestar o disfunción diurna.' },
  { cie11:'7B00',    dsm5:'307.46', nombre:'Sonambulismo',                                         area:'Sueño', sinonimos:['sonambulismo','caminar dormido','parasomnia'], desc:'Episodios repetidos de levantarse y caminar durante el sueño profundo.', criterios:'Episodios NREM. Difícil despertar. Sin recuerdo.' },
  { cie11:'7B01',    dsm5:'307.46', nombre:'Terrores Nocturnos',                                   area:'Sueño', sinonimos:['terror nocturno','terror noche','gritos noche','pavor nocturno'], desc:'Episodios de despertar abrupto con terror intenso sin recuerdo.', criterios:'Episodios NREM. Terror intenso. Sin recuerdo al despertar.' },
  { cie11:'7B02',    dsm5:'307.47', nombre:'Trastorno de Pesadillas',                              area:'Sueño', sinonimos:['pesadillas','pesadilla recurrente','mal sueno'], desc:'Pesadillas repetidas vívidas y perturbadoras que provocan despertar.', criterios:'Pesadillas REM repetidas. Recuerdo detallado. Afectan funcionamiento.' },
  // ── ELIMINACIÓN
  { cie11:'6C00',    dsm5:'307.6',  nombre:'Enuresis',                                             area:'Eliminación', sinonimos:['enuresis','orinarse','hacerse pipi','mojar cama','pipi nocturno','pipí'], desc:'Evacuación repetida involuntaria o intencional de orina en cama o ropa en ≥5 años.', criterios:'≥2x/semana durante ≥3 meses. Edad mental ≥5 años.' },
  { cie11:'6C01',    dsm5:'307.7',  nombre:'Encopresis',                                           area:'Eliminación', sinonimos:['encopresis','defecacion ropa','hacerse caca','ensuciarse'], desc:'Evacuación fecal repetida involuntaria en lugares inapropiados en ≥4 años.', criterios:'≥1x/mes durante ≥3 meses. Edad ≥4 años.' },
  // ── DISRUPTIVO
  { cie11:'6C90',    dsm5:'313.81', nombre:'Trastorno Negativista Desafiante (TND)',                area:'Disruptivo', sinonimos:['tnd','odd','oposicionismo','desafiante','negativista','rebelde'], desc:'Patrón de humor enojado/irritable, conducta argumentativa/desafiante, o actitud vengativa.', criterios:'≥4 síntomas ≥6 meses. Con ≥1 persona que no sea hermano/a.' },
  { cie11:'6C91',    dsm5:'312.81', nombre:'Trastorno de Conducta (TC)',                            area:'Disruptivo', sinonimos:['tc','cd','trastorno conducta','conducta antisocial','agresion','robo'], desc:'Patrón repetitivo y persistente de conducta que viola derechos básicos de otros.', criterios:'≥3 síntomas en 4 categorías en últimos 12 meses. ≥1 en últimos 6 meses.' },
  { cie11:'6C92',    dsm5:'312.34', nombre:'Trastorno Explosivo Intermitente (TEI)',                area:'Disruptivo', sinonimos:['tei','explosividad','arrebatos de rabia','ira'], desc:'Arrebatos conductuales recurrentes de incapacidad de controlar impulsos agresivos.', criterios:'≥2 arrebatos/semana ≥3 meses O ≥3 episodios con daño en 12 meses.' },
  // ── NEUROLÓGICO
  { cie11:'8A60',    dsm5:'345.x',  nombre:'Epilepsia',                                            area:'Neurológico', sinonimos:['epilepsia','convulsiones','crisis epileptica','seizure'], desc:'Predisposición del cerebro a generar crisis epilépticas recurrentes.', criterios:'≥2 crisis no provocadas >24h de separación.' },
  { cie11:'8A60.0',  dsm5:'345.3',  nombre:'Epilepsia de Ausencias Infantiles',                    area:'Neurológico', sinonimos:['ausencias','pequeño mal','ausencias infantiles','mirada fija'], desc:'Miradas fijas breves con interrupción actividad, inicio 4-10 años.', criterios:'Ausencias 4-10 años. EEG: descargas punta-onda 3Hz.' },
  // ── PSICOSIS
  { cie11:'6A20',    dsm5:'295.90', nombre:'Esquizofrenia',                                         area:'Psicosis', sinonimos:['esquizofrenia','psicosis','delirios','alucinaciones','voces'], desc:'Síntomas psicóticos (delirios, alucinaciones, habla desorganizada) ≥6 meses.', criterios:'≥2 síntomas psicóticos. ≥6 meses.' },
  { cie11:'6A23',    dsm5:'297.1',  nombre:'Trastorno Delirante',                                  area:'Psicosis', sinonimos:['delirios','paranoia','trastorno paranoide'], desc:'Uno o más delirios ≥1 mes sin otros síntomas psicóticos prominentes.', criterios:'Delirios ≥1 mes. Funcionamiento no marcadamente afectado.' },
  // ── PERSONALIDAD
  { cie11:'6D10',    dsm5:'301.83', nombre:'Trastorno Límite de la Personalidad (TLP)',             area:'Personalidad', sinonimos:['tlp','bpd','borderline','limite personalidad'], desc:'Inestabilidad en relaciones, autoimagen, afectos e impulsividad marcada.', criterios:'≥5 de 9 síntomas. Patrón estable desde adulto joven.' },
  { cie11:'6D11.0',  dsm5:'301.0',  nombre:'Trastorno Paranoide de la Personalidad',               area:'Personalidad', sinonimos:['personalidad paranoide','desconfianza extrema'], desc:'Desconfianza y suspicacia generalizadas hacia los demás.', criterios:'≥4 de 7 síntomas. Sin esquizofrenia.' },
  { cie11:'6D11.5',  dsm5:'301.81', nombre:'Trastorno Narcisista de la Personalidad',              area:'Personalidad', sinonimos:['narcisismo','narcisista','grandiosidad'], desc:'Grandiosidad, necesidad de admiración y falta de empatía.', criterios:'≥5 de 9 síntomas.' },
]

const AREAS = ['Todos','Neurodesarrollo','Ansiedad','TOC','Trauma','Estado de Ánimo','Psicosis','Alimentación','Sueño','Eliminación','Disruptivo','Tics','Neurológico','Personalidad']

const AREA_COLOR: Record<string,string> = {
  'Neurodesarrollo':'bg-violet-100 text-violet-700','Ansiedad':'bg-amber-100 text-amber-700',
  'TOC':'bg-orange-100 text-orange-700','Trauma':'bg-red-100 text-red-700',
  'Estado de Ánimo':'bg-blue-100 text-blue-700','Psicosis':'bg-purple-100 text-purple-700',
  'Alimentación':'bg-pink-100 text-pink-700','Sueño':'bg-indigo-100 text-indigo-700',
  'Eliminación':'bg-teal-100 text-teal-700','Disruptivo':'bg-rose-100 text-rose-700',
  'Tics':'bg-cyan-100 text-cyan-700','Neurológico':'bg-lime-100 text-lime-700',
  'Personalidad':'bg-slate-100 text-slate-700',
}

export default function DiagnosticoBuscador() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('Todos')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [copied, setCopied] = useState<string|null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtrado = useMemo(() => {
    const query = q.trim().toLowerCase()
    return DIAGNOSTICOS.filter(d => {
      if (area !== 'Todos' && d.area !== area) return false
      if (query.length < 2) return true
      return [d.nombre, d.cie11, d.dsm5, d.desc, d.area, ...(d.sinonimos||[])].some(f => String(f).toLowerCase().includes(query))
    })
  }, [q, area])

  const copiar = (d: typeof DIAGNOSTICOS[0]) => {
    navigator.clipboard.writeText(`${d.nombre} | CIE-11: ${d.cie11}${d.dsm5 !== 'N/A' ? ` | DSM-5: ${d.dsm5}` : ''}`)
    setCopied(d.cie11); setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, código CIE-11, DSM-5, sinónimo... (ej: autismo, 6A02, TDAH, dislexia, enuresis)"
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium border-2 outline-none focus:border-violet-400 transition-colors"
          style={{ background:'var(--input-bg)', borderColor:'var(--input-border)', color:'var(--text-primary)' }} />
        {q && <button onClick={() => { setQ(''); inputRef.current?.focus() }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={15}/></button>}
      </div>

      {/* Quick chips */}
      {q.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide self-center mr-1">Búsquedas rápidas:</span>
          {['TEA','TDAH','Ansiedad','TOC','Dislexia','Enuresis','TND','Depresión','Tics','TEPT','Dislalia','ARFID'].map(chip => (
            <button key={chip} onClick={() => setQ(chip)}
              className="px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:bg-violet-50 hover:border-violet-300"
              style={{ background:'var(--muted-bg)', borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Area filter */}
      <div className="flex flex-wrap gap-1.5">
        {AREAS.map(a => (
          <button key={a} onClick={() => setArea(a)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${area === a ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}`}
            style={area !== a ? { background:'var(--card)' } : {}}>
            {a}
            {a !== 'Todos' && <span className="ml-1 opacity-60 text-[9px]">({DIAGNOSTICOS.filter(d => d.area === a).length})</span>}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs font-bold" style={{ color:'var(--text-muted)' }}>
        {filtrado.length === DIAGNOSTICOS.length ? `${DIAGNOSTICOS.length} diagnósticos disponibles` : `${filtrado.length} resultado${filtrado.length !== 1?'s':''}${q.length>=2?` para "${q}"`:''}`}
        {filtrado.length === 0 && q.length >= 2 && <button onClick={() => setQ('')} className="ml-2 text-violet-600 hover:underline">Limpiar</button>}
      </p>

      {/* Results */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {filtrado.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300"/>
            <p className="text-sm font-medium" style={{ color:'var(--text-muted)' }}>No se encontraron diagnósticos para "{q}"</p>
            <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>Intentá con código CIE-11, nombre completo o sinónimo</p>
          </div>
        ) : filtrado.map(d => {
          const isExp = expanded === d.cie11
          return (
            <div key={d.cie11} className="rounded-xl border transition-all hover:shadow-sm" style={{ background:'var(--card)', borderColor:'var(--card-border)' }}>
              <div className="flex items-start gap-2 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight" style={{ color:'var(--text-primary)' }}>{d.nombre}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => copiar(d)} className="p-1.5 rounded-lg border transition-all hover:bg-violet-50 hover:border-violet-300" style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }} title="Copiar para ARIA">
                        {copied === d.cie11 ? <Check size={11} className="text-emerald-500"/> : <Copy size={11}/>}
                      </button>
                      <button onClick={() => setExpanded(isExp ? null : d.cie11)} className="p-1.5 rounded-lg border transition-all hover:bg-slate-100" style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                        {isExp ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-100 text-violet-700">CIE-11: {d.cie11}</span>
                    {d.dsm5 && d.dsm5 !== 'N/A' && <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700">DSM-5: {d.dsm5}</span>}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${AREA_COLOR[d.area]||'bg-slate-100 text-slate-600'}`}>{d.area}</span>
                  </div>
                  {!isExp && <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color:'var(--text-muted)' }}>{d.desc}</p>}
                </div>
              </div>
              {isExp && (
                <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor:'var(--card-border)' }}>
                  <div className="pt-2">
                    <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>Descripción clínica</p>
                    <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>{d.desc}</p>
                  </div>
                  {d.criterios && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color:'var(--text-muted)' }}>Criterios diagnósticos clave</p>
                      <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>{d.criterios}</p>
                    </div>
                  )}
                  <button onClick={() => copiar(d)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors mt-1">
                    {copied === d.cie11 ? <Check size={12}/> : <Copy size={12}/>}
                    {copied === d.cie11 ? 'Copiado ✓' : 'Copiar para ARIA'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-center" style={{ color:'var(--text-muted)' }}>
        {filtrado.length} de {DIAGNOSTICOS.length} diagnósticos · CIE-11 (OMS 2022) + DSM-5-TR (APA 2022)
      </p>
    </div>
  )
}
