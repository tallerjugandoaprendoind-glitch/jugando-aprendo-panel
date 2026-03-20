'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Copy, Check, ChevronDown, ChevronUp, AlertCircle, BookOpen, Filter, Star, Zap, ExternalLink, Tag } from 'lucide-react'

const DIAGNOSTICOS = [
  // NEURODESARROLLO
  { cie11:'6A02',    dsm5:'F84.0',  dsm5num:'299.00', nombre:'Trastorno del Espectro Autista (TEA)',                           area:'Neurodesarrollo', sinonimos:['autismo','tea','asd','espectro','asperger','kanner'], desc:'Déficits persistentes en comunicación e interacción social con patrones restrictivos y repetitivos de comportamiento, presentes desde el período de desarrollo temprano.', criterios:'A: Déficits en comunicación social en múltiples contextos. B: Patrones restrictivos/repetitivos. C: Síntomas en período de desarrollo temprano. D: Causan deterioro clínicamente significativo.', tratamiento:'ABA, EIBI, PECS, Social Stories, DIR/Floortime, terapia ocupacional, fonoaudiología.' },
  { cie11:'6A02.0',  dsm5:'F84.0',  dsm5num:'299.00', nombre:'TEA Nivel 1 — Requiere apoyo',                                  area:'Neurodesarrollo', sinonimos:['autismo nivel 1','asperger','alto funcionamiento','tea leve'], desc:'Sin discapacidad intelectual ni trastorno del lenguaje funcional. Requiere apoyo.', criterios:'Nivel 1: Sin DI. Sin trastorno lenguaje funcional. Requiere apoyo.', tratamiento:'Habilidades sociales, TCC, apoyo académico, coaching.' },
  { cie11:'6A02.1',  dsm5:'F84.0',  dsm5num:'299.00', nombre:'TEA Nivel 2 — Requiere apoyo sustancial',                      area:'Neurodesarrollo', sinonimos:['autismo nivel 2','tea moderado'], desc:'Con o sin discapacidad intelectual. Requiere apoyo sustancial.', criterios:'Nivel 2: Requiere apoyo sustancial. Deficiencias marcadas en comunicación social.', tratamiento:'ABA intensivo, EIBI, comunicación aumentativa (AAC), apoyo conductual.' },
  { cie11:'6A02.2',  dsm5:'F84.0',  dsm5num:'299.00', nombre:'TEA Nivel 3 — Requiere apoyo muy sustancial',                  area:'Neurodesarrollo', sinonimos:['autismo severo','autismo nivel 3','autismo grave','tea grave'], desc:'Requiere apoyo muy sustancial. Comunicación verbal mínima o nula.', criterios:'Nivel 3: Requiere apoyo muy sustancial. Déficits severos en comunicación.', tratamiento:'EIBI intensivo, AAC (PECS, dispositivos), manejo conductual.' },
  { cie11:'6A05',    dsm5:'F90',    dsm5num:'314.01', nombre:'TDAH — Trastorno por Déficit de Atención e Hiperactividad',    area:'Neurodesarrollo', sinonimos:['tdah','adhd','deficit atencion','hiperactividad','impulsividad','add'], desc:'Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere con el funcionamiento o desarrollo.', criterios:'≥6 síntomas durante ≥6 meses en ≥2 contextos. Inicio antes de los 12 años. Interfiere funcionamiento.', tratamiento:'Metilfenidato, anfetaminas, atomoxetina, TCC, entrenamiento parental, manejo conductual.' },
  { cie11:'6A05.0',  dsm5:'F90.0',  dsm5num:'314.00', nombre:'TDAH — Presentación predominantemente inatenta',               area:'Neurodesarrollo', sinonimos:['tdah inatento','add','inatención sin hiperactividad'], desc:'Inatención prominente sin hiperactividad significativa.', criterios:'≥6 síntomas inatención. <6 síntomas hiperactivo-impulsivos.', tratamiento:'Atomoxetina, metilfenidato dosis baja, estrategias organizacionales, TCC.' },
  { cie11:'6A05.1',  dsm5:'F90.1',  dsm5num:'314.01', nombre:'TDAH — Presentación hiperactiva/impulsiva',                   area:'Neurodesarrollo', sinonimos:['tdah hiperactivo','hiperactividad pura'], desc:'Hiperactividad e impulsividad predominantes sin inatención significativa.', criterios:'≥6 síntomas hiperactivo-impulsivos. <6 síntomas inatención.', tratamiento:'Metilfenidato, modificación conductual, técnicas de autorregulación.' },
  { cie11:'6A05.2',  dsm5:'F90.2',  dsm5num:'314.01', nombre:'TDAH — Presentación combinada',                                area:'Neurodesarrollo', sinonimos:['tdah combinado','tdah mixto'], desc:'Inatención y hiperactividad-impulsividad ambas presentes.', criterios:'≥6 síntomas de ambas categorías. Duración ≥6 meses.', tratamiento:'Metilfenidato, anfetaminas, TCC, entrenamiento parental.' },
  { cie11:'6A00',    dsm5:'F70-F79',dsm5num:'319',    nombre:'Discapacidad Intelectual (DI)',                                 area:'Neurodesarrollo', sinonimos:['di','retraso mental','discapacidad cognitiva','id','retardo mental'], desc:'Déficits en funcionamiento intelectual y conducta adaptativa en dominios conceptual, social y práctico.', criterios:'CI <70 + déficits conducta adaptativa + inicio en período de desarrollo.', tratamiento:'Intervención temprana, ABA, habilidades adaptativas, educación especial.' },
  { cie11:'6A00.0',  dsm5:'F70',    dsm5num:'317',    nombre:'Discapacidad Intelectual Leve',                                area:'Neurodesarrollo', sinonimos:['di leve','retraso leve','retardo leve'], desc:'CI aprox. 50-69. Habilidades académicas hasta 6° grado con apoyo.', criterios:'CI 50-69. Puede vivir semi-independientemente con apoyo.', tratamiento:'Apoyo académico, habilidades de vida diaria, integración laboral.' },
  { cie11:'6A00.1',  dsm5:'F71',    dsm5num:'318.0',  nombre:'Discapacidad Intelectual Moderada',                            area:'Neurodesarrollo', sinonimos:['di moderada','retraso moderado'], desc:'CI aprox. 35-49. Requiere apoyo sustancial en actividades de la vida diaria.', criterios:'CI 35-49. Comunica ideas básicas. AVD con supervisión.', tratamiento:'Habilidades funcionales, comunicación, AVD, programa ABA.' },
  { cie11:'6A00.2',  dsm5:'F72',    dsm5num:'318.1',  nombre:'Discapacidad Intelectual Grave',                               area:'Neurodesarrollo', sinonimos:['di grave','retraso grave','di severa'], desc:'CI aprox. 20-34. Requiere apoyo extenso en todas las áreas.', criterios:'CI 20-34. Lenguaje muy limitado. Supervisión constante.', tratamiento:'EIBI, comunicación AAC, habilidades básicas, manejo conductual.' },
  { cie11:'6A00.3',  dsm5:'F73',    dsm5num:'318.2',  nombre:'Discapacidad Intelectual Profunda',                            area:'Neurodesarrollo', sinonimos:['di profunda','retraso profundo'], desc:'CI por debajo de 20. Cuidado constante requerido.', criterios:'CI <20. Comunicación mínima. Dependencia total.', tratamiento:'Cuidado intensivo, estimulación sensorial, comunicación básica.' },
  { cie11:'6A01',    dsm5:'F80',    dsm5num:'315.39', nombre:'Trastorno del Desarrollo del Lenguaje (TDL)',                  area:'Neurodesarrollo', sinonimos:['tdl','trastorno lenguaje','retraso lenguaje','disfasia'], desc:'Dificultades persistentes en adquisición y uso del lenguaje.', criterios:'Déficits vocabulario, gramática o discurso. Inicio en período de desarrollo.', tratamiento:'Fonoaudiología, terapia de lenguaje, AAC si necesario.' },
  { cie11:'6A01.2',  dsm5:'F80.0',  dsm5num:'315.39', nombre:'Trastorno Fonológico — Dislalia',                             area:'Neurodesarrollo', sinonimos:['dislalia','fonologia','articulacion','pronunciacion'], desc:'Dificultades en producción fonológica que interfieren la comunicación.', criterios:'Errores articulación persistentes que afectan inteligibilidad.', tratamiento:'Fonoaudiología, terapia articulatoria, práctica fonemas.' },
  { cie11:'6A01.3',  dsm5:'F98.5',  dsm5num:'307.0',  nombre:'Tartamudeo — Disfluencia del habla',                          area:'Neurodesarrollo', sinonimos:['tartamudez','disfluencia','tartamudeo','stuttering','bloqueos habla'], desc:'Alteraciones en fluidez y tiempo del habla: repeticiones, prolongaciones, bloqueos.', criterios:'Disfluencia que impacta comunicación. Inicio en desarrollo temprano.', tratamiento:'Terapia fluidez, TCC, grupos apoyo.' },
  { cie11:'6A0Y',    dsm5:'F81.0',  dsm5num:'315.00', nombre:'Trastorno del Aprendizaje — Dislexia',                        area:'Neurodesarrollo', sinonimos:['dislexia','trastorno lectura','dificultad lectura'], desc:'Dificultades en exactitud, velocidad o comprensión lectora significativamente inferiores.', criterios:'Rendimiento lector ≥1.5 DE inferior al esperado.', tratamiento:'Orton-Gillingham, multisensorial, intervención fonológica.' },
  { cie11:'6A0Z',    dsm5:'F81.2',  dsm5num:'315.1',  nombre:'Trastorno del Aprendizaje — Discalculia',                     area:'Neurodesarrollo', sinonimos:['discalculia','trastorno matematicas','numeros','calculo'], desc:'Dificultades en procesamiento numérico, cálculo o razonamiento matemático.', criterios:'Rendimiento matemático ≥1.5 DE inferior al esperado.', tratamiento:'Intervención número sentido, manipulativos, software matemático.' },
  { cie11:'6A0X',    dsm5:'F81.8',  dsm5num:'315.2',  nombre:'Trastorno del Aprendizaje — Disgrafía',                       area:'Neurodesarrollo', sinonimos:['disgrafia','trastorno escritura','grafomotricidad'], desc:'Dificultades en ortografía, gramática escrita o claridad de escritura.', criterios:'Rendimiento escritura ≥1.5 DE inferior al esperado.', tratamiento:'Terapia ocupacional, escritura a máquina, adaptaciones académicas.' },
  { cie11:'6A04',    dsm5:'F82',    dsm5num:'315.4',  nombre:'Trastorno del Desarrollo de la Coordinación (Dispraxia)',     area:'Neurodesarrollo', sinonimos:['dispraxia','tdc','coordinacion motora','torpeza motriz','motricidad'], desc:'Adquisición y ejecución de habilidades motoras coordinadas por debajo de lo esperado.', criterios:'Motor inferior al esperado. Interfiere AVD. No neurológica.', tratamiento:'Terapia ocupacional, fisioterapia, práctica motriz.' },
  { cie11:'6A06',    dsm5:'F98.4',  dsm5num:'307.3',  nombre:'Trastorno de Movimientos Estereotipados (Estereotipias)',     area:'Neurodesarrollo', sinonimos:['estereotipias','movimientos repetitivos','balanceo','aleteo','flapping'], desc:'Movimientos repetitivos sin propósito aparente que interfieren con el funcionamiento.', criterios:'Duración ≥4 semanas. No atribuible a sustancias ni otra condición.', tratamiento:'ABA, análisis funcional, terapia ocupacional.' },
  { cie11:'6A0B',    dsm5:'F88',    dsm5num:'315.8',  nombre:'Trastorno Global del Desarrollo (TGD)',                       area:'Neurodesarrollo', sinonimos:['tgd','desarrollo atipico','retraso global del desarrollo'], desc:'Retrasos significativos en múltiples áreas del desarrollo sin diagnóstico específico.', criterios:'Retrasos en ≥2 áreas: motor, lenguaje, social, cognitivo.', tratamiento:'Intervención temprana multidisciplinaria, estimulación temprana.' },
  // TICS
  { cie11:'8A05.00', dsm5:'F95.0',  dsm5num:'307.21', nombre:'Trastorno de Tics Provisional',                               area:'Tics', sinonimos:['tic provisional','tic transitorio','tics temporales'], desc:'Tics motores y/o vocales presentes menos de 12 meses.', criterios:'Tics motores y/o vocales. Duración <12 meses. Inicio <18 años.', tratamiento:'Psicoeducación, CBIT, reversión de hábitos.' },
  { cie11:'8A05.01', dsm5:'F95.1',  dsm5num:'307.22', nombre:'Trastorno de Tics Motor o Vocal Crónico',                    area:'Tics', sinonimos:['tic motor cronico','tics motores','tic vocal cronico'], desc:'Tics motores O vocales múltiples, más de 12 meses.', criterios:'Solo tics motores O vocales. Duración ≥12 meses.', tratamiento:'CBIT, guanfacina, clonidina.' },
  { cie11:'8A05.02', dsm5:'F95.2',  dsm5num:'307.23', nombre:'Síndrome de Tourette',                                       area:'Tics', sinonimos:['tourette','tics vocales','coprolalia','tics multiples','gilles tourette'], desc:'Múltiples tics motores y al menos un tic vocal.', criterios:'≥2 tics motores + ≥1 tic vocal. Duración ≥12 meses. Inicio <18 años.', tratamiento:'CBIT primera línea, haloperidol, aripiprazol, clonidina.' },
  // ANSIEDAD
  { cie11:'6B00',    dsm5:'F41.1',  dsm5num:'300.02', nombre:'Trastorno de Ansiedad Generalizada (TAG)',                   area:'Ansiedad', sinonimos:['tag','ansiedad generalizada','preocupacion excesiva','gad','ansiedad cronica'], desc:'Ansiedad y preocupación excesivas sobre múltiples eventos o actividades durante ≥6 meses.', criterios:'≥3 síntomas (inquietud, fatiga, concentración, irritabilidad, tensión, sueño). ≥6 meses.', tratamiento:'TCC, ISRS (sertralina, escitalopram), venlafaxina, mindfulness.' },
  { cie11:'6B01',    dsm5:'F40.1',  dsm5num:'300.23', nombre:'Trastorno de Ansiedad Social (Fobia Social)',                area:'Ansiedad', sinonimos:['fobia social','ansiedad social','timidez extrema','miedo social'], desc:'Miedo o ansiedad intensos ante situaciones sociales de evaluación por otros.', criterios:'Miedo evaluación negativa. Evitación activa. ≥6 meses.', tratamiento:'TCC, exposición gradual, ISRS, beta-bloqueantes para situacional.' },
  { cie11:'6B02',    dsm5:'F41.0',  dsm5num:'300.01', nombre:'Trastorno de Pánico',                                        area:'Ansiedad', sinonimos:['panico','crisis panico','ataque panico','panic attack'], desc:'Ataques de pánico recurrentes inesperados seguidos de preocupación persistente.', criterios:'Ataques pánico recurrentes + ≥1 mes preocupación o cambio conductual.', tratamiento:'TCC con exposición interoceptiva, ISRS, ISRN.' },
  { cie11:'6B03',    dsm5:'F93.0',  dsm5num:'309.21', nombre:'Trastorno de Ansiedad por Separación',                      area:'Ansiedad', sinonimos:['ansiedad separacion','miedo separacion','apego ansioso','llanto separacion'], desc:'Miedo o ansiedad excesivos ante la separación de figuras de apego.', criterios:'≥3 síntomas. ≥4 semanas niños / ≥6 meses adultos.', tratamiento:'TCC, terapia de juego, entrenamiento parental, ISRS.' },
  { cie11:'6B04',    dsm5:'F40.2',  dsm5num:'300.29', nombre:'Fobia Específica',                                           area:'Ansiedad', sinonimos:['fobia','miedo especifico','fobia animales','fobia altura','fobia sangre','fobia oscuridad'], desc:'Miedo o ansiedad intensos y desproporcionados ante objeto o situación específica.', criterios:'Miedo desproporcionado. Evitación activa. ≥6 meses.', tratamiento:'Desensibilización sistemática, exposición gradual, TCC.' },
  { cie11:'6B05',    dsm5:'F40.00', dsm5num:'300.22', nombre:'Agorafobia',                                                 area:'Ansiedad', sinonimos:['agorafobia','miedo espacios abiertos','multitudes'], desc:'Miedo intenso ante espacios abiertos, multitudes, transporte público o estar fuera de casa.', criterios:'≥2 contextos agorafóbicos. Evitación activa. ≥6 meses.', tratamiento:'TCC, exposición in vivo, ISRS.' },
  { cie11:'6B0Y',    dsm5:'F94.0',  dsm5num:'313.23', nombre:'Mutismo Selectivo',                                          area:'Ansiedad', sinonimos:['mutismo selectivo','mutismo','no habla escuela','silencio selectivo'], desc:'Incapacidad consistente de hablar en contextos sociales específicos.', criterios:'Falla habla en contextos específicos. ≥1 mes. Interfiere logros.', tratamiento:'TCC, exposición gradual, ISRS (fluoxetina), coordinación escuela-familia.' },
  // TOC
  { cie11:'6B20',    dsm5:'F42',    dsm5num:'300.3',  nombre:'TOC — Trastorno Obsesivo Compulsivo',                        area:'TOC', sinonimos:['toc','ocd','obsesion','compulsion','rituales','lavado manos','verificacion'], desc:'Obsesiones (pensamientos intrusivos) y/o compulsiones (comportamientos repetitivos) que consumen tiempo.', criterios:'Obsesiones y/o compulsiones. >1 hora/día. Causa malestar/disfunción.', tratamiento:'TCC con EPR (exposición y prevención respuesta), ISRS dosis altas.' },
  { cie11:'6B21',    dsm5:'F45.22', dsm5num:'300.7',  nombre:'Trastorno Dismórfico Corporal (TDC)',                        area:'TOC', sinonimos:['dismorfia','tdc','bdd','obsesion cuerpo','apariencia fisica'], desc:'Preocupación persistente por defecto(s) percibido(s) en apariencia física.', criterios:'Preocupación excesiva apariencia. Comportamientos repetitivos. Malestar/disfunción.', tratamiento:'TCC-EPR, ISRS dosis altas.' },
  { cie11:'6B22',    dsm5:'F42.3',  dsm5num:'300.3',  nombre:'Trastorno de Acumulación — Hoarding',                       area:'TOC', sinonimos:['acumulacion','hoarding','coleccionismo patologico','silomanía'], desc:'Dificultad persistente para deshacerse de posesiones.', criterios:'Dificultad deshacerse. Angustia al eliminar. Compromete espacios vivibles.', tratamiento:'TCC especializada hoarding, exposición descarte, ISRS.' },
  { cie11:'6B25',    dsm5:'F63.3',  dsm5num:'312.39', nombre:'Tricotilomanía — Arrancarse el Cabello',                    area:'TOC', sinonimos:['tricotilomania','arrancarse cabello','alopecia tricotilomania'], desc:'Arrancarse el cabello de manera recurrente resultando en pérdida capilar.', criterios:'Intentos de disminuir. Malestar o deterioro funcional.', tratamiento:'TRH (reversión hábitos), TCC, NAC, clomipramina.' },
  { cie11:'6B24',    dsm5:'L98.1',  dsm5num:'698.4',  nombre:'Trastorno de Excoriación — Skin Picking',                   area:'TOC', sinonimos:['excoriacion','skin picking','pellizcarse','rascarse piel','dermatilomanía'], desc:'Arrancarse o rascar la piel recurrentemente resultando en lesiones cutáneas.', criterios:'Intentos repetidos de disminuir. Malestar significativo.', tratamiento:'TRH, TCC, ISRS.' },
  // TRAUMA
  { cie11:'6B40',    dsm5:'F43.1',  dsm5num:'309.81', nombre:'TEPT — Trastorno de Estrés Postraumático',                  area:'Trauma', sinonimos:['tept','ptsd','trauma','estres postraumatico','flashbacks'], desc:'Síntomas de reexperimentación, evitación, cognición negativa e hiperactivación tras trauma.', criterios:'Exposición a trauma. Síntomas reexperimentación + evitación + cognición negativa + hiperactivación. ≥1 mes.', tratamiento:'EMDR, TCC trauma, prolonged exposure, ISRS.' },
  { cie11:'6B41',    dsm5:'F43.0',  dsm5num:'308.3',  nombre:'Trastorno de Estrés Agudo',                                 area:'Trauma', sinonimos:['estres agudo','reaccion aguda trauma'], desc:'Síntomas similares a TEPT durante 3-30 días tras el trauma.', criterios:'Síntomas 3-30 días tras trauma. ≥9 síntomas en 5 categorías.', tratamiento:'Psicoeducación, intervención crisis, TCC breve.' },
  { cie11:'6B4Z',    dsm5:'F43.1',  dsm5num:'309.89', nombre:'TEPT Complejo (TEPTC)',                                     area:'Trauma', sinonimos:['teptc','cptsd','trauma complejo','trauma prolongado'], desc:'TEPT con alteraciones adicionales en regulación emocional, autoimagen y relaciones.', criterios:'Criterios TEPT + desregulación afectiva + autoimagen negativa + dificultades relacionales.', tratamiento:'Fase estabilización → procesamiento → integración. EMDR, IFS.' },
  { cie11:'6B43',    dsm5:'F94.2',  dsm5num:'313.89', nombre:'Trastorno de Relación Social Desinhibida (TRSD)',            area:'Trauma', sinonimos:['desinhibicion social','trsd','familiaridad excesiva extraños'], desc:'Comportamiento de acercamiento activos con extraños desconocidos.', criterios:'≥2 síntomas. Relacionado con cuidado inadecuado. Edad >9 meses.', tratamiento:'Terapia apego, intervención familiar.' },
  { cie11:'6B44',    dsm5:'F94.1',  dsm5num:'313.89', nombre:'Trastorno de Apego Reactivo (TAR)',                          area:'Trauma', sinonimos:['apego reactivo','tar','rad','inhibicion emocional'], desc:'Comportamiento emocionalmente retraído hacia cuidadores.', criterios:'≥2 síntomas. Relacionado con cuidado inadecuado.', tratamiento:'Terapia apego, Theraplay, Circle of Security.' },
  { cie11:'6B43.1',  dsm5:'F43.2',  dsm5num:'309.0',  nombre:'Trastorno de Adaptación',                                  area:'Trauma', sinonimos:['trastorno adaptacion','ajuste','reaccion estres'], desc:'Síntomas en respuesta a un factor estresante identificable.', criterios:'Síntomas dentro de 3 meses del estresor. Angustia excesiva.', tratamiento:'Psicoterapia breve, TCC, apoyo social.' },
  // ESTADO DE ÁNIMO
  { cie11:'6A70',    dsm5:'F32-F33',dsm5num:'296.xx', nombre:'Trastorno Depresivo Mayor (TDM)',                            area:'Estado de Ánimo', sinonimos:['depresion','tdm','mdd','depresion mayor','tristeza profunda'], desc:'Episodios depresivos mayores sin historia de episodios maníacos.', criterios:'≥5 síntomas ≥2 semanas (ánimo depresivo y/o anhedonia obligatorio).', tratamiento:'ISRS (fluoxetina, sertralina), TCC, activación conductual.' },
  { cie11:'6A71',    dsm5:'F34.1',  dsm5num:'300.4',  nombre:'Trastorno Depresivo Persistente — Distimia',               area:'Estado de Ánimo', sinonimos:['distimia','depresion cronica','depresion persistente'], desc:'Estado de ánimo depresivo crónico la mayor parte del día, casi todos los días.', criterios:'Ánimo depresivo ≥2 años (≥1 año niños). ≥2 síntomas adicionales.', tratamiento:'ISRS, TCC a largo plazo.' },
  { cie11:'6A72',    dsm5:'F34.8',  dsm5num:'296.99', nombre:'TDDEA — Desregulación Disruptiva del Estado de Ánimo',      area:'Estado de Ánimo', sinonimos:['tddea','dmdd','desregulacion emocional','rabietas severas','irritabilidad cronica'], desc:'Irritabilidad persistente severa y episodios recurrentes de descontrol conductual.', criterios:'6-18 años. ≥3 explosiones/semana ≥12 meses. Humor irritable entre episodios.', tratamiento:'TCC, entrenamiento regulación emocional, DBT adaptado.' },
  { cie11:'6A80',    dsm5:'F31.x',  dsm5num:'296.40', nombre:'Trastorno Bipolar I',                                       area:'Estado de Ánimo', sinonimos:['bipolar','trastorno bipolar','mania','episodio maniaco'], desc:'Al menos un episodio maníaco completo.', criterios:'≥1 episodio maníaco (≥7 días). Disfunción severa.', tratamiento:'Litio, valproato, quetiapina, psicoeducación bipolar.' },
  { cie11:'6A81',    dsm5:'F31.8',  dsm5num:'296.89', nombre:'Trastorno Bipolar II',                                      area:'Estado de Ánimo', sinonimos:['bipolar ii','hipomania','bipolar dos'], desc:'Al menos un episodio hipomaníaco y uno depresivo mayor. Sin episodios maníacos.', criterios:'≥1 episodio hipomaníaco (≥4 días) + ≥1 episodio depresivo mayor.', tratamiento:'Quetiapina, lamotrigina, litio, psicoeducación.' },
  { cie11:'6A82',    dsm5:'F34.0',  dsm5num:'301.13', nombre:'Ciclotimia',                                                area:'Estado de Ánimo', sinonimos:['ciclotimia','bipolar suave','fluctuaciones animo'], desc:'Fluctuaciones crónicas con períodos hipomaníacos y depresivos subumbrales.', criterios:'≥2 años. Sin período libre ≥2 meses. Sin episodios completos.', tratamiento:'Estabilizadores ánimo, psicoterapia, higiene sueño.' },
  // ALIMENTACIÓN
  { cie11:'6B80',    dsm5:'F50.0',  dsm5num:'307.1',  nombre:'Anorexia Nerviosa',                                         area:'Alimentación', sinonimos:['anorexia','restriccion alimentaria','bajo peso','dieta extrema'], desc:'Restricción de ingesta, miedo intenso a ganar peso, alteración percepción corporal.', criterios:'Restricción → bajo peso. Miedo engordar. Distorsión imagen corporal.', tratamiento:'Restauración peso, TCC, terapia familiar (Maudsley).' },
  { cie11:'6B81',    dsm5:'F50.2',  dsm5num:'307.51', nombre:'Bulimia Nerviosa',                                          area:'Alimentación', sinonimos:['bulimia','atracones','purgas','vomitos autoinducidos','laxantes'], desc:'Episodios recurrentes de atracones seguidos de conductas compensatorias.', criterios:'Atracones y purgas ≥1/semana durante ≥3 meses.', tratamiento:'TCC, IPT, ISRS (fluoxetina dosis alta).' },
  { cie11:'6B82',    dsm5:'F50.8',  dsm5num:'307.51', nombre:'Trastorno por Atracón (BED)',                               area:'Alimentación', sinonimos:['atracones','bed','binge eating','comedor compulsivo'], desc:'Episodios recurrentes de atracones sin conductas compensatorias.', criterios:'Atracones ≥1/semana durante ≥3 meses. Sin purgas.', tratamiento:'TCC, mindful eating, lisdexanfetamina, ISRS.' },
  { cie11:'6B83',    dsm5:'F50.8',  dsm5num:'307.59', nombre:'ARFID — Evitación/Restricción Ingesta',                    area:'Alimentación', sinonimos:['arfid','selectividad alimentaria','comedor selectivo','neofobia alimentaria','hiperselectividad'], desc:'Evitación/restricción por características sensoriales, miedo o falta de interés.', criterios:'Causa déficit nutricional o dependencia nutrición artificial.', tratamiento:'Desensibilización sensorial, TCC, exposición gradual.' },
  { cie11:'6B84',    dsm5:'F98.3',  dsm5num:'307.52', nombre:'Pica',                                                      area:'Alimentación', sinonimos:['pica','comer tierra','geofagia','comer objetos no comestibles'], desc:'Ingestión persistente de sustancias no nutritivas (tierra, papel, pintura).', criterios:'≥1 mes. Inapropiado para nivel de desarrollo.', tratamiento:'Análisis funcional, ABA, sustitución conductas.' },
  { cie11:'6B85',    dsm5:'F98.21', dsm5num:'307.53', nombre:'Trastorno de Rumiación',                                    area:'Alimentación', sinonimos:['rumiacion','regurgitacion','mericismo'], desc:'Regurgitación repetida de alimentos para masticar, tragar o escupir.', criterios:'≥1 mes. No por condición médica.', tratamiento:'Respiración diafragmática, biofeedback, TCC.' },
  // SUEÑO
  { cie11:'7A00',    dsm5:'F51.01', dsm5num:'307.42', nombre:'Insomnio Crónico',                                          area:'Sueño', sinonimos:['insomnio','dificultad dormir','despertar nocturno','no puedo dormir'], desc:'Dificultad para iniciar o mantener el sueño con impacto diurno.', criterios:'Dificultad sueño ≥3 noches/semana durante ≥3 meses.', tratamiento:'TCC-I (primera línea), higiene sueño, melatonina.' },
  { cie11:'7B00',    dsm5:'F51.3',  dsm5num:'307.46', nombre:'Sonambulismo',                                              area:'Sueño', sinonimos:['sonambulismo','caminar dormido','parasomnia'], desc:'Episodios repetidos de levantarse y deambular durante el sueño profundo (NREM).', criterios:'Episodios NREM. Difícil despertar. Sin recuerdo.', tratamiento:'Seguridad ambiente, higiene sueño, clonazepam si frecuente.' },
  { cie11:'7B01',    dsm5:'F51.4',  dsm5num:'307.46', nombre:'Terrores Nocturnos',                                        area:'Sueño', sinonimos:['terror nocturno','gritos noche','pavor nocturno','night terror'], desc:'Episodios de despertar abrupto con terror intenso, sin recuerdo del episodio.', criterios:'Episodios NREM. Terror intenso. Sin recuerdo matutino.', tratamiento:'Psicoeducación, higiene sueño, clonazepam si frecuente.' },
  { cie11:'7B02',    dsm5:'F51.5',  dsm5num:'307.47', nombre:'Trastorno de Pesadillas',                                   area:'Sueño', sinonimos:['pesadillas','pesadilla recurrente','mal sueno'], desc:'Pesadillas repetidas vívidas con recuerdo detallado que afectan funcionamiento.', criterios:'Pesadillas REM repetidas. Recuerdo detallado. Malestar significativo.', tratamiento:'IRT (terapia imágenes), prazosin, TCC.' },
  // ELIMINACIÓN
  { cie11:'6C00',    dsm5:'F98.0',  dsm5num:'307.6',  nombre:'Enuresis',                                                  area:'Eliminación', sinonimos:['enuresis','orinarse','hacerse pipi','mojar cama','pipi nocturno'], desc:'Evacuación repetida de orina en la cama o la ropa.', criterios:'≥2x/semana durante ≥3 meses. Edad mental ≥5 años.', tratamiento:'Alarma enuresis, entrenamiento vejiga, desmopresina.' },
  { cie11:'6C01',    dsm5:'F98.1',  dsm5num:'307.7',  nombre:'Encopresis',                                               area:'Eliminación', sinonimos:['encopresis','defecacion ropa','hacerse caca','ensuciarse'], desc:'Evacuación fecal repetida en lugares inapropiados.', criterios:'≥1x/mes durante ≥3 meses. Edad ≥4 años.', tratamiento:'Desimpactación, laxantes, entrenamiento intestinal, refuerzo positivo.' },
  // DISRUPTIVO
  { cie11:'6C90',    dsm5:'F91.3',  dsm5num:'313.81', nombre:'Trastorno Negativista Desafiante (TND)',                    area:'Disruptivo', sinonimos:['tnd','odd','oposicionismo','desafiante','negativista','rebelde','desobediente'], desc:'Patrón de humor enojado/irritable, conducta argumentativa/desafiante o vengativa.', criterios:'≥4 síntomas ≥6 meses. Con ≥1 persona que no sea hermano/a.', tratamiento:'Entrenamiento parental, TCC, PCIT, habilidades sociales.' },
  { cie11:'6C91',    dsm5:'F91.x',  dsm5num:'312.81', nombre:'Trastorno de Conducta (TC)',                               area:'Disruptivo', sinonimos:['tc','cd','trastorno conducta','conducta antisocial','agresion','robo'], desc:'Patrón repetitivo de conducta que viola derechos de otros o normas sociales.', criterios:'≥3 síntomas en 4 categorías en últimos 12 meses.', tratamiento:'Multisistemic Therapy, PCIT, TCC, habilidades sociales.' },
  { cie11:'6C92',    dsm5:'F63.81', dsm5num:'312.34', nombre:'Trastorno Explosivo Intermitente (TEI)',                   area:'Disruptivo', sinonimos:['tei','ied','explosividad','arrebatos rabia','ira descontrolada'], desc:'Arrebatos conductuales recurrentes de incapacidad de controlar impulsos agresivos.', criterios:'≥2 arrebatos/semana ≥3 meses O ≥3 episodios con daño en 12 meses.', tratamiento:'TCC, regulación emocional, ISRS, estabilizadores ánimo.' },
  // PSICOSIS
  { cie11:'6A20',    dsm5:'F20',    dsm5num:'295.90', nombre:'Esquizofrenia',                                             area:'Psicosis', sinonimos:['esquizofrenia','psicosis','delirios','alucinaciones','voces'], desc:'Síntomas psicóticos con deterioro funcional significativo durante ≥6 meses.', criterios:'≥2 síntomas psicóticos (≥1 positivo). ≥6 meses. Deterioro significativo.', tratamiento:'Antipsicóticos (risperidona, olanzapina, clozapina), rehabilitación psicosocial.' },
  { cie11:'6A21',    dsm5:'F25',    dsm5num:'295.70', nombre:'Trastorno Esquizoafectivo',                                area:'Psicosis', sinonimos:['esquizoafectivo','psicosis afectiva'], desc:'Episodio afectivo mayor concurrente con síntomas esquizofrénicos.', criterios:'Síntomas esquizofrenia + episodio afectivo mayor.', tratamiento:'Antipsicóticos + estabilizadores ánimo.' },
  { cie11:'6A22',    dsm5:'F23',    dsm5num:'298.8',  nombre:'Trastorno Psicótico Breve',                                area:'Psicosis', sinonimos:['psicosis breve','psicosis aguda','psicosis reactiva'], desc:'Síntomas psicóticos de inicio abrupto durante 1 día a 1 mes.', criterios:'≥1 síntoma positivo. Duración 1 día-1 mes.', tratamiento:'Antipsicóticos de corta duración, apoyo.' },
  { cie11:'6A23',    dsm5:'F22',    dsm5num:'297.1',  nombre:'Trastorno Delirante',                                     area:'Psicosis', sinonimos:['delirios','paranoia','trastorno paranoide','ideas delirantes'], desc:'Uno o más delirios durante ≥1 mes sin otros síntomas psicóticos prominentes.', criterios:'Delirios ≥1 mes. Funcionamiento no marcadamente afectado.', tratamiento:'Antipsicóticos, psicoterapia.' },
  // PERSONALIDAD
  { cie11:'6D10',    dsm5:'F60.3',  dsm5num:'301.83', nombre:'Trastorno Límite de la Personalidad (TLP)',                area:'Personalidad', sinonimos:['tlp','bpd','borderline','limite personalidad','inestabilidad emocional'], desc:'Inestabilidad en relaciones, autoimagen, afectos e impulsividad marcada.', criterios:'≥5 de 9 síntomas: miedo abandono, relaciones intensas, identidad inestable, impulsividad, autolesiones, inestabilidad afectiva, vacío, ira, ideación paranoide.', tratamiento:'DBT (primera línea), TCC, psicoterapia mentalización, schema therapy.' },
  { cie11:'6D11.0',  dsm5:'F60.0',  dsm5num:'301.0',  nombre:'Trastorno Paranoide de la Personalidad',                  area:'Personalidad', sinonimos:['personalidad paranoide','desconfianza extrema','suspicacia'], desc:'Desconfianza y suspicacia generalizadas hacia los demás.', criterios:'≥4 de 7 síntomas. Inicio adulto joven.', tratamiento:'TCC, manejo alianza terapéutica.' },
  { cie11:'6D11.5',  dsm5:'F60.81', dsm5num:'301.81', nombre:'Trastorno Narcisista de la Personalidad',                 area:'Personalidad', sinonimos:['narcisismo','narcisista','grandiosidad','falta empatia'], desc:'Grandiosidad, necesidad de admiración y falta de empatía.', criterios:'≥5 de 9 síntomas.', tratamiento:'TCC, schema therapy.' },
  { cie11:'6D11.6',  dsm5:'F60.6',  dsm5num:'301.82', nombre:'Trastorno Evitativo de la Personalidad',                  area:'Personalidad', sinonimos:['evitativo','personalidad evitativa','inhibicion social','timidez patologica'], desc:'Inhibición social, sentimientos de inadecuación e hipersensibilidad evaluación negativa.', criterios:'≥4 de 7 síntomas.', tratamiento:'TCC, exposición gradual, ISRS, habilidades sociales.' },
  { cie11:'6D11.7',  dsm5:'F60.7',  dsm5num:'301.6',  nombre:'Trastorno Dependiente de la Personalidad',                area:'Personalidad', sinonimos:['dependiente','personalidad dependiente','sumision','necesidad aprobacion'], desc:'Necesidad excesiva de ser cuidado con comportamiento sumiso y apego.', criterios:'≥5 de 8 síntomas dependencia/sumisión.', tratamiento:'TCC, autonomía gradual, assertividad.' },
  { cie11:'6D11.8',  dsm5:'F60.5',  dsm5num:'301.4',  nombre:'Trastorno Obsesivo-Compulsivo de la Personalidad (TOCP)', area:'Personalidad', sinonimos:['tocp','ocpd','perfeccionismo patologico','rigidez','control excesivo'], desc:'Preocupación por el orden, perfeccionismo y control interpersonal.', criterios:'≥4 de 8 síntomas. Diferente a TOC.', tratamiento:'TCC, flexibilidad cognitiva.' },
  // NEUROLÓGICO
  { cie11:'8A60',    dsm5:'G40',    dsm5num:'345.x',  nombre:'Epilepsia',                                                 area:'Neurológico', sinonimos:['epilepsia','convulsiones','crisis epileptica','seizure'], desc:'Predisposición del cerebro a generar crisis epilépticas recurrentes.', criterios:'≥2 crisis no provocadas >24h de separación.', tratamiento:'Valproato, lamotrigina, levetiracetam.' },
  { cie11:'8A60.0',  dsm5:'G40.3',  dsm5num:'345.3',  nombre:'Epilepsia de Ausencias Infantiles',                        area:'Neurológico', sinonimos:['ausencias','pequeño mal','ausencias infantiles','mirada fija epilepsia'], desc:'Miradas fijas breves con interrupción actividad. Inicio 4-10 años.', criterios:'Ausencias 4-10 años. EEG: descargas punta-onda 3Hz.', tratamiento:'Etosuxímida (primera línea), valproato.' },
  // DISOCIATIVO
  { cie11:'6B60',    dsm5:'F44.81', dsm5num:'300.14', nombre:'Trastorno de Identidad Disociativo (TID)',                 area:'Disociativo', sinonimos:['tid','did','personalidad multiple','disociacion identidad'], desc:'Dos o más estados de personalidad distintos con amnesia disociativa.', criterios:'≥2 estados identidad. Amnesia. Malestar/disfunción.', tratamiento:'Psicoterapia especializada disociación, EMDR.' },
  { cie11:'6B62',    dsm5:'F48.1',  dsm5num:'300.6',  nombre:'Trastorno de Despersonalización/Desrealización',           area:'Disociativo', sinonimos:['despersonalizacion','desrealizacion','dpdr','sentirse irreal'], desc:'Experiencias persistentes de sentirse separado de los propios pensamientos o cuerpo.', criterios:'Despersonalización y/o desrealización persistente. Sin psicosis.', tratamiento:'TCC, mindfulness, tratamiento condición subyacente.' },
  // SOMÁTICO
  { cie11:'6C20',    dsm5:'F45.1',  dsm5num:'300.82', nombre:'Trastorno de Síntomas Somáticos (TSS)',                    area:'Somático', sinonimos:['somatico','somatizacion','sintomas fisicos sin causa','hipocondria'], desc:'Síntomas somáticos angustiantes con pensamientos o conductas excesivas relacionadas.', criterios:'≥1 síntoma somático angustiante. Pensamientos excesivos ≥6 meses.', tratamiento:'TCC, ISRS, manejo médico coordinado.' },
  { cie11:'6C21',    dsm5:'F45.21', dsm5num:'300.7',  nombre:'Trastorno de Ansiedad por Enfermedad (Hipocondría)',       area:'Somático', sinonimos:['hipocondria','miedo enfermedad','ansiedad salud'], desc:'Preocupación absorbente de tener o adquirir una enfermedad grave.', criterios:'Preocupación enfermedad grave ≥6 meses. Sin síntomas somáticos marcados.', tratamiento:'TCC, ISRS, psicoeducación.' },
  // CRISIS
  { cie11:'MB26.A',  dsm5:'N/A',    dsm5num:'V62.84', nombre:'Conducta Suicida',                                         area:'Crisis y Riesgo', sinonimos:['suicidio','ideacion suicida','intento suicidio','autolesion letal'], desc:'Acto o plan con intención de causar la propia muerte.', criterios:'Ideación (pasiva/activa), plan, intento. Evaluar factores riesgo.', tratamiento:'Crisis intervention, hospitalización si riesgo alto, plan seguridad, DBT.' },
  { cie11:'MB23.E',  dsm5:'N/A',    dsm5num:'V62.84', nombre:'Autolesión No Suicida (ALNS)',                             area:'Crisis y Riesgo', sinonimos:['autolesion','cutting','cortarse','self harm','herirse'], desc:'Daño intencional al propio tejido corporal sin intención suicida.', criterios:'Daño directo a tejido. ≥5 veces/año. Sin intención suicida.', tratamiento:'DBT, TCC, regulación emocional, plan de seguridad.' },
]

const AREAS = ['Todos','Neurodesarrollo','Ansiedad','TOC','Trauma','Estado de Ánimo','Psicosis','Alimentación','Sueño','Eliminación','Disruptivo','Tics','Neurológico','Personalidad','Disociativo','Somático','Crisis y Riesgo']

const AREA_COLOR: Record<string,string> = {
  'Neurodesarrollo':  'bg-violet-100 text-violet-700',
  'Ansiedad':         'bg-amber-100  text-amber-700',
  'TOC':              'bg-orange-100 text-orange-700',
  'Trauma':           'bg-red-100    text-red-700',
  'Estado de Ánimo':  'bg-blue-100   text-blue-700',
  'Psicosis':         'bg-purple-100 text-purple-700',
  'Alimentación':     'bg-pink-100   text-pink-700',
  'Sueño':            'bg-indigo-100 text-indigo-700',
  'Eliminación':      'bg-teal-100   text-teal-700',
  'Disruptivo':       'bg-rose-100   text-rose-700',
  'Tics':             'bg-cyan-100   text-cyan-700',
  'Neurológico':      'bg-lime-100   text-lime-700',
  'Personalidad':     'bg-slate-100  text-slate-600',
  'Disociativo':      'bg-fuchsia-100 text-fuchsia-700',
  'Somático':         'bg-green-100  text-green-700',
  'Crisis y Riesgo':  'bg-red-200    text-red-800',
}

const CHIPS = ['TEA','TDAH','TEPT','TOC','Dislexia','Anorexia','Enuresis','TND','Depresión','Tics','ARFID','Bipolar','TLP','Dispraxia','Bulimia','Mutismo','6A02','F84']

type Diag = typeof DIAGNOSTICOS[0]

interface Props {
  onAsignar?: (diag: Diag) => void
  showAsignar?: boolean
}

export default function DiagnosticoBuscador({ onAsignar, showAsignar = false }: Props) {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('Todos')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [copied, setCopied] = useState<string|null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [soloConTratamiento, setSoloConTratamiento] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtrado = useMemo(() => {
    const query = q.trim().toLowerCase()
    return DIAGNOSTICOS.filter(d => {
      if (area !== 'Todos' && d.area !== area) return false
      if (soloConTratamiento && !d.tratamiento) return false
      if (query.length < 2) return true
      return [d.nombre, d.cie11, d.dsm5, d.dsm5num, d.desc, d.area, ...(d.sinonimos||[])].some(f => String(f).toLowerCase().includes(query))
    })
  }, [q, area, soloConTratamiento])

  useEffect(() => {
    if (filtrado.length === 1) setExpanded(filtrado[0].cie11)
    else if (q.length < 2) setExpanded(null)
  }, [filtrado.length, q])

  const copiar = (d: Diag) => {
    const txt = `${d.nombre}\nCIE-11: ${d.cie11}${d.dsm5num && d.dsm5num !== 'N/A' ? ` | DSM-5: ${d.dsm5num}` : ''}\n${d.desc}`
    navigator.clipboard.writeText(txt)
    setCopied(d.cie11)
    setTimeout(() => setCopied(null), 2000)
  }

  const copiarCodigo = (d: Diag, tipo: 'cie11' | 'dsm5') => {
    navigator.clipboard.writeText(tipo === 'cie11' ? d.cie11 : (d.dsm5num || d.dsm5))
    setCopied(`${d.cie11}-${tipo}`)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-4">

      {/* BUSCADOR */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, código CIE-11 (ej: 6A02), DSM-5, ICD-10 (ej: F84), sinónimo..."
          className="w-full pl-10 pr-20 py-3 rounded-xl text-sm font-medium border-2 outline-none focus:border-violet-400 transition-colors"
          style={{ background:'var(--input-bg)', borderColor:'var(--input-border)', color:'var(--text-primary)' }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {q && (
            <button onClick={() => { setQ(''); setExpanded(null); inputRef.current?.focus() }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X size={14}/>
            </button>
          )}
          <button onClick={() => setShowFilters(v => !v)}
            className={`p-1.5 rounded-lg transition-all ${showFilters ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Filtros avanzados">
            <Filter size={14}/>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      {showFilters && (
        <div className="p-3 rounded-xl border" style={{ background:'var(--muted-bg)', borderColor:'var(--card-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={soloConTratamiento} onChange={e => setSoloConTratamiento(e.target.checked)} className="rounded accent-violet-600"/>
            <span className="text-xs font-semibold" style={{ color:'var(--text-secondary)' }}>Solo diagnósticos con guía de tratamiento</span>
          </label>
        </div>
      )}

      {/* CHIPS RÁPIDOS */}
      {q.length === 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mr-1">Rápido:</span>
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => setQ(chip)}
              className="px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
              style={{ background:'var(--card)', borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* FILTRO ÁREA */}
      <div className="flex flex-wrap gap-1.5">
        {AREAS.map(a => (
          <button key={a} onClick={() => setArea(a)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
              area === a ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'text-slate-500 hover:border-violet-300 hover:text-violet-600'
            }`}
            style={area !== a ? { background:'var(--card)', borderColor:'var(--card-border)' } : {}}>
            {a}
            {a !== 'Todos' && <span className="ml-1 opacity-60 text-[9px]">({DIAGNOSTICOS.filter(d => d.area === a).length})</span>}
          </button>
        ))}
      </div>

      {/* CONTADOR */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold" style={{ color:'var(--text-muted)' }}>
          {filtrado.length === DIAGNOSTICOS.length
            ? `${DIAGNOSTICOS.length} diagnósticos · CIE-11 + DSM-5 + ICD-10`
            : `${filtrado.length} resultado${filtrado.length !== 1?'s':''}${q.length>=2?` para "${q}"`:''}`}
          {filtrado.length === 0 && q.length >= 2 && (
            <button onClick={() => { setQ(''); setArea('Todos') }} className="ml-2 text-violet-600 hover:underline">Limpiar</button>
          )}
        </p>
        {q.length >= 2 && filtrado.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            {filtrado.length} match{filtrado.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* RESULTADOS */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {filtrado.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={36} className="mx-auto mb-3 text-slate-200"/>
            <p className="text-sm font-semibold" style={{ color:'var(--text-muted)' }}>Sin resultados para "{q}"</p>
            <p className="text-xs mt-1 mb-3" style={{ color:'var(--text-muted)' }}>Probá con código CIE-11 (ej: 6A02), ICD-10 (ej: F84.0), o sinónimo</p>
            <button onClick={() => { setQ(''); setArea('Todos') }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              Ver todos los diagnósticos
            </button>
          </div>
        ) : filtrado.map(d => {
          const isExp = expanded === d.cie11
          return (
            <div key={d.cie11} className="rounded-xl border transition-all hover:shadow-md" style={{ background:'var(--card)', borderColor:'var(--card-border)' }}>
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight mb-1.5" style={{ color:'var(--text-primary)' }}>{d.nombre}</p>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {/* CIE-11 clickeable */}
                      <button onClick={() => copiarCodigo(d, 'cie11')}
                        className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors flex items-center gap-1"
                        title="Click para copiar código CIE-11">
                        {copied === `${d.cie11}-cie11` ? <Check size={9}/> : <Copy size={9}/>}
                        CIE-11: {d.cie11}
                      </button>
                      {/* DSM-5 clickeable */}
                      {d.dsm5num && d.dsm5num !== 'N/A' && (
                        <button onClick={() => copiarCodigo(d, 'dsm5')}
                          className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                          title="Click para copiar código DSM-5">
                          {copied === `${d.cie11}-dsm5` ? <Check size={9}/> : <Copy size={9}/>}
                          DSM-5: {d.dsm5num}
                        </button>
                      )}
                      {/* ICD-10 */}
                      {d.dsm5 && d.dsm5 !== 'N/A' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-100 text-sky-700">
                          ICD-10: {d.dsm5}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${AREA_COLOR[d.area] || 'bg-slate-100 text-slate-600'}`}>
                        {d.area}
                      </span>
                    </div>
                    {!isExp && <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color:'var(--text-muted)' }}>{d.desc}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => copiar(d)}
                        className="p-1.5 rounded-lg border transition-all hover:bg-violet-50 hover:border-violet-300"
                        style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }} title="Copiar completo">
                        {copied === d.cie11 ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
                      </button>
                      <button onClick={() => setExpanded(isExp ? null : d.cie11)}
                        className="p-1.5 rounded-lg border transition-all hover:bg-slate-100"
                        style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                        {isExp ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isExp && (
                <div className="border-t px-3 pb-3 space-y-3" style={{ borderColor:'var(--card-border)' }}>
                  <div className="pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                      <BookOpen size={10}/> Descripción clínica
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>{d.desc}</p>
                  </div>

                  {d.criterios && (
                    <div className="p-2.5 rounded-xl" style={{ background:'var(--muted-bg)' }}>
                      <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                        <Tag size={10}/> Criterios diagnósticos clave
                      </p>
                      <p className="text-xs leading-relaxed font-medium" style={{ color:'var(--text-secondary)' }}>{d.criterios}</p>
                    </div>
                  )}

                  {d.tratamiento && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 text-emerald-700 flex items-center gap-1">
                        <Zap size={10}/> Opciones de tratamiento
                      </p>
                      <p className="text-xs leading-relaxed text-emerald-800">{d.tratamiento}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => copiar(d)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                      {copied === d.cie11 ? <Check size={11}/> : <Copy size={11}/>}
                      {copied === d.cie11 ? 'Copiado ✓' : 'Copiar para ARIA'}
                    </button>

                    {showAsignar && onAsignar && (
                      <button onClick={() => onAsignar(d)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        <Star size={11}/> Asignar al paciente
                      </button>
                    )}

                    <a href={`https://icd.who.int/browse/2024-01/mms/es`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:bg-slate-50"
                      style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                      <ExternalLink size={11}/> Ver en OMS CIE-11
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-center" style={{ color:'var(--text-muted)' }}>
        {DIAGNOSTICOS.length} diagnósticos · CIE-11 (OMS 2022) + DSM-5-TR (APA 2022) + ICD-10 · Haz clic en los códigos para copiarlos
      </p>
    </div>
  )
}
