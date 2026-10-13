/**
 * Motor de reglas EXCLUSIVE 360. Sin dependencias de interfaz.
 * Fuente: documentos EXCLUSIVE 360 (guía de necesidades, semáforo, radar).
 * Lo marcado [PROPUESTA] no figura en los documentos y está pendiente de validación institucional.
 */

export const PRE_DATA = ['Objetivo', 'Liquidez', 'Horizonte', 'Prioridad / riesgo'];

export const YELLOW_SITUATIONS = [
  'El cliente tiene patrimonio significativo o necesidades complejas',
  'Desea revisar diferentes alternativas con mayor profundidad',
  'Muestra interés concreto en movilizar recursos',
  'Existen necesidades familiares o empresariales relacionadas',
  'Requiere una revisión patrimonial más compleja',
  'Existen dudas técnicas que exceden la conversación general',
];

export const RED_SITUATIONS = [
  'Solicita una recomendación personalizada',
  'Pregunta directamente «¿Qué me conviene a mí?»',
  'Requiere selección o composición específica de inversiones',
  'Necesita estrategia personalizada de portafolio',
  'La conversación implica evaluación detallada de tolerancia al riesgo',
  'Se requiere ejecutar una actividad reservada al servicio de asesoría correspondiente',
];

/**
 * [PROPUESTA] Peso = capacidad (0-2) + intención (0-2).
 * Solo ordena prioridad dentro de un nivel; no altera la regla documentada de "2 o más señales".
 */
export const DEVELOPMENT_SIGNALS = [
  { label: 'Proyectos próximos', capacity: 1, intent: 1 },
  { label: 'Recursos que podrían tener mayor horizonte', capacity: 2, intent: 1 },
  { label: 'Inversiones en otras instituciones', capacity: 2, intent: 0 },
  { label: 'Necesidades personales + empresariales', capacity: 2, intent: 1 },
  { label: 'Interés en revisar alternativas', capacity: 1, intent: 2 },
  { label: 'Necesidad de atención más especializada', capacity: 1, intent: 1 },
].map((s) => ({ ...s, weight: s.capacity + s.intent }));

export const HIGH_VALUE_SIGNALS = [
  'Condición Valor / potencial en el sistema (OMNI, captura manual)',
  'Existe una relación patrimonial relevante',
  'Hay empresario / socio / accionista',
  'Existe interés real en movilizar o revisar recursos',
  'Requiere acompañamiento patrimonial especializado',
];

/** [PROPUESTA] Señales de alto valor requeridas junto con el nivel Desarrollo. */
export const HIGH_VALUE_MIN = 2;
export const DEVELOPMENT_MIN = 2;
export const MAX_DEV_SCORE = DEVELOPMENT_SIGNALS.reduce((s, x) => s + x.weight, 0);

export const ESCALATION = {
  red: {
    key: 'red',
    name: 'Rojo',
    title: 'ROJO · Escalar',
    rule: 'Escalar a personal con facultades / certificación correspondiente',
    action: 'DETENER LA RECOMENDACIÓN PERSONAL → CANALIZAR + DOCUMENTAR',
    rank: 3,
  },
  yellow: {
    key: 'yellow',
    name: 'Amarillo',
    title: 'AMARILLO · Canalizar',
    rule: 'Involucra a Banca de Relación / especialista',
    action: 'CANALIZAR + REGISTRAR EN ARIA + CONFIRMAR CONTACTO',
    rank: 2,
  },
  green: {
    key: 'green',
    name: 'Verde',
    title: 'VERDE · Continuar',
    rule: 'El funcionario puede continuar con orientación general',
    action: 'CONOCER + INFORMAR + DEFINIR SIGUIENTE PASO',
    rank: 1,
  },
};

export const RADAR = {
  high: {
    key: 'high',
    name: 'Alto valor / Exclusive',
    title: 'ALTO VALOR / EXCLUSIVE',
    rule: 'Canalizar a Banca de Relación / Ejecutivo Exclusive',
    action: 'CANALIZAR → REGISTRAR EN ARIA → CONFIRMAR CONTACTO',
    rank: 3,
  },
  development: {
    key: 'development',
    name: 'Oportunidad de desarrollo',
    title: 'OPORTUNIDAD DE DESARROLLO',
    rule: 'Aparecen 2 o más señales relevantes',
    action: 'REVISAR INFORMACIÓN OMNI → REGISTRAR OPORTUNIDAD → DEFINIR SIGUIENTE CONTACTO',
    rank: 2,
  },
  normal: {
    key: 'normal',
    name: 'Prioridad normal',
    title: 'PRIORIDAD NORMAL',
    rule: 'Necesidad operativa / transaccional, sin interés actual en profundizar',
    action: 'ATENDER NECESIDAD + REGISTRAR INFORMACIÓN RELEVANTE',
    rank: 1,
  },
};

const pickTrue = (flags = [], list, labelOf = (x) => x) =>
  list.map((x, i) => (flags[i] ? labelOf(x) : null)).filter(Boolean);

/**
 * Semáforo de escalamiento. Prevalece el nivel más restrictivo (rojo > amarillo > verde).
 * @param {{red?: boolean[], yellow?: boolean[]}} input
 */
export function evaluateEscalation({ red = [], yellow = [] } = {}) {
  const redHits = pickTrue(red, RED_SITUATIONS);
  const yellowHits = pickTrue(yellow, YELLOW_SITUATIONS);
  if (redHits.length) {
    return { ...ESCALATION.red, reasons: redHits, note: 'Prevalece el nivel más restrictivo.' };
  }
  if (yellowHits.length) return { ...ESCALATION.yellow, reasons: yellowHits, note: '' };
  return { ...ESCALATION.green, reasons: [], note: 'Sin situaciones de escalamiento marcadas.' };
}

/**
 * Radar de relación (independiente del semáforo de escalamiento).
 * @param {{development?: boolean[], highValue?: boolean[]}} input
 */
export function evaluateRadar({ development = [], highValue = [] } = {}) {
  const devHits = pickTrue(development, DEVELOPMENT_SIGNALS, (s) => s.label);
  const devScore = development.reduce(
    (sum, on, i) => sum + (on && DEVELOPMENT_SIGNALS[i] ? DEVELOPMENT_SIGNALS[i].weight : 0),
    0,
  );
  const hvHits = pickTrue(highValue, HIGH_VALUE_SIGNALS);
  const base = { devCount: devHits.length, devScore, hvCount: hvHits.length };

  if (devHits.length >= DEVELOPMENT_MIN && hvHits.length >= HIGH_VALUE_MIN) {
    return { ...RADAR.high, ...base, reasons: [...devHits, ...hvHits], note: '' };
  }
  if (devHits.length >= DEVELOPMENT_MIN) {
    return { ...RADAR.development, ...base, reasons: devHits, note: '' };
  }
  const note =
    devHits.length === 1
      ? 'Se detectó una sola señal de desarrollo: caso no definido en la guía; se mantiene Prioridad normal (por confirmar).'
      : '';
  return { ...RADAR.normal, ...base, reasons: devHits, note };
}

/** Datos previos completos (4 de 4). */
export const preDataComplete = (pre = []) => PRE_DATA.every((_, i) => Boolean(pre[i]));

/** Evaluación conjunta; los dos semáforos nunca se combinan. */
export function evaluate(conv = {}) {
  return {
    escalation: evaluateEscalation(conv),
    radar: evaluateRadar(conv),
    preComplete: preDataComplete(conv.pre),
  };
}

export const emptyConversation = () => ({
  pre: PRE_DATA.map(() => false),
  yellow: YELLOW_SITUATIONS.map(() => false),
  red: RED_SITUATIONS.map(() => false),
  development: DEVELOPMENT_SIGNALS.map(() => false),
  highValue: HIGH_VALUE_SIGNALS.map(() => false),
  notes: '',
});
