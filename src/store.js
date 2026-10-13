// Persistencia local (localStorage). Ningún dato sale del navegador.
const KEY = 'e360-historial-v1';
const DRAFT = 'e360-borrador-v1';

const read = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

export const loadHistory = () => {
  const h = read(KEY, []);
  return Array.isArray(h) ? h : [];
};
export const saveHistory = (h) => write(KEY, h);

export const loadDraft = () => read(DRAFT, null);
export const saveDraft = (d) => write(DRAFT, d);
export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT);
  } catch {
    /* sin almacenamiento disponible */
  }
};

export function nextCode(history) {
  const max = history.reduce((m, h) => {
    const n = /^CL-(\d+)$/.exec(h.code || '');
    return n ? Math.max(m, Number(n[1])) : m;
  }, 0);
  return `CL-${String(max + 1).padStart(4, '0')}`;
}

/** Evita inyección de fórmulas al abrir el CSV en Excel. */
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export function toCsv(rows) {
  const head = [
    'Identificador', 'Fecha', 'Origen', 'Datos previos completos',
    'Semáforo de escalamiento', 'Situaciones de escalamiento',
    'Radar de relación', 'Señales', 'Puntaje desarrollo', 'Notas',
  ];
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      r.code, r.createdAt, r.demo ? 'Demostración' : 'Capturada', r.preComplete ? 'Sí' : 'No',
      r.escalation.name, r.escalation.reasons.join(' | '),
      r.radar.name, r.radar.reasons.join(' | '), r.radar.devScore, r.conv.notes,
    ].map(csvCell).join(','));
  }
  return '﻿' + lines.join('\r\n');
}
