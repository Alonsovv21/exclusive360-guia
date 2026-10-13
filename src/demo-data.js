// Datos 100 % sintéticos y deterministas. No corresponden a clientes reales.
import { emptyConversation, DEVELOPMENT_SIGNALS, HIGH_VALUE_SIGNALS, YELLOW_SITUATIONS, RED_SITUATIONS } from './rules.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTES = [
  'Cliente interesado en conocer opciones a mediano plazo.',
  'Consulta operativa; sin interés en profundizar por ahora.',
  'Menciona proyecto familiar en los próximos dos años.',
  'Pide revisar alternativas con más detalle.',
  'Tiene inversiones en otra institución.',
  '',
];

export function buildDemo(count = 24) {
  const rand = rng(360);
  const day = (i) => new Date(Date.UTC(2026, 8, 1 + Math.floor(i * 1.2), 10 + (i % 7))).toISOString();
  const flags = (n, p) => Array.from({ length: n }, () => rand() < p);
  return Array.from({ length: count }, (_, i) => {
    const profile = rand();
    const conv = emptyConversation();
    conv.pre = flags(4, 0.7);
    conv.development = flags(DEVELOPMENT_SIGNALS.length, profile < 0.35 ? 0.1 : profile < 0.7 ? 0.5 : 0.8);
    conv.highValue = flags(HIGH_VALUE_SIGNALS.length, profile > 0.7 ? 0.65 : 0.12);
    conv.yellow = flags(YELLOW_SITUATIONS.length, profile > 0.5 ? 0.3 : 0.05);
    conv.red = flags(RED_SITUATIONS.length, 0.07);
    conv.notes = NOTES[Math.floor(rand() * NOTES.length)];
    return { id: `demo-${i + 1}`, code: `DEMO-${String(i + 1).padStart(3, '0')}`, createdAt: day(i), demo: true, conv };
  });
}
