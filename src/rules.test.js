import { describe, it, expect } from 'vitest';
import {
  evaluate,
  evaluateEscalation,
  evaluateRadar,
  emptyConversation,
  DEVELOPMENT_SIGNALS,
  MAX_DEV_SCORE,
  preDataComplete,
} from './rules.js';

const on = (len, ...idx) => Array.from({ length: len }, (_, i) => idx.includes(i));

describe('Semáforo de escalamiento', () => {
  it('sin casillas: verde', () => {
    expect(evaluateEscalation(emptyConversation()).key).toBe('green');
  });
  it('una amarilla: amarillo', () => {
    expect(evaluateEscalation({ yellow: on(6, 2) }).key).toBe('yellow');
  });
  it('una roja: rojo', () => {
    expect(evaluateEscalation({ red: on(6, 1) }).key).toBe('red');
  });
  it('roja + amarilla: prevalece el rojo', () => {
    const r = evaluateEscalation({ red: on(6, 0), yellow: on(6, 0, 1) });
    expect(r.key).toBe('red');
    expect(r.reasons).toHaveLength(1);
  });
  it('entradas ausentes o vacías no fallan', () => {
    expect(evaluateEscalation().key).toBe('green');
    expect(evaluateEscalation({ red: [], yellow: [] }).key).toBe('green');
  });
});

describe('Radar de relación', () => {
  it('sin señales: prioridad normal', () => {
    expect(evaluateRadar(emptyConversation()).key).toBe('normal');
  });
  it('una señal: normal con aviso', () => {
    const r = evaluateRadar({ development: on(6, 0) });
    expect(r.key).toBe('normal');
    expect(r.note).toMatch(/una sola señal/i);
  });
  it('dos señales: desarrollo', () => {
    expect(evaluateRadar({ development: on(6, 0, 1) }).key).toBe('development');
  });
  it('dos de desarrollo + dos de alto valor: alto valor', () => {
    expect(evaluateRadar({ development: on(6, 0, 1), highValue: on(5, 0, 2) }).key).toBe('high');
  });
  it('dos de desarrollo + una de alto valor: sigue en desarrollo', () => {
    expect(evaluateRadar({ development: on(6, 0, 1), highValue: on(5, 2) }).key).toBe('development');
  });
  it('alto valor sin desarrollo suficiente: no sube de nivel', () => {
    expect(evaluateRadar({ development: on(6, 0), highValue: on(5, 0, 1, 2) }).key).toBe('normal');
  });
  it('el puntaje suma los pesos y no cambia el nivel', () => {
    const r = evaluateRadar({ development: on(6, 1, 4) });
    expect(r.devScore).toBe(DEVELOPMENT_SIGNALS[1].weight + DEVELOPMENT_SIGNALS[4].weight);
    expect(r.key).toBe('development');
  });
  it('máximo teórico de puntaje', () => {
    expect(MAX_DEV_SCORE).toBe(15);
    expect(evaluateRadar({ development: on(6, 0, 1, 2, 3, 4, 5) }).devScore).toBe(15);
  });
});

describe('Independencia de los semáforos y datos previos', () => {
  it('rojo en escalamiento con alto valor en radar a la vez', () => {
    const e = evaluate({
      red: on(6, 0),
      development: on(6, 0, 1),
      highValue: on(5, 1, 2),
    });
    expect(e.escalation.key).toBe('red');
    expect(e.radar.key).toBe('high');
  });
  it('datos previos completos solo con 4 de 4', () => {
    expect(preDataComplete([true, true, true, false])).toBe(false);
    expect(preDataComplete([true, true, true, true])).toBe(true);
    expect(evaluate({}).preComplete).toBe(false);
  });
});
