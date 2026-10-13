import './style.css';
import {
  PRE_DATA, YELLOW_SITUATIONS, RED_SITUATIONS, DEVELOPMENT_SIGNALS, HIGH_VALUE_SIGNALS,
  HIGH_VALUE_MIN, MAX_DEV_SCORE, ESCALATION, RADAR, emptyConversation, evaluate,
} from './rules.js';
import {
  loadHistory, saveHistory, loadDraft, saveDraft, clearDraft, nextCode, toCsv,
} from './store.js';
import { buildDemo } from './demo-data.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const fmtDate = (iso) =>
  new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

const ICON = { green: '✔', yellow: '▲', red: '■', normal: '●', development: '◆', high: '★' };
const LIGHT = { normal: 'grey', development: 'blue', high: 'violet' };

const state = {
  view: 'conv',
  conv: loadDraft() || emptyConversation(),
  editingId: null,
  history: loadHistory(),
  filters: { q: '', esc: '', radar: '', origin: '' },
  sort: { key: 'createdAt', dir: 'desc' },
};
// Compatibilidad con borradores antiguos
const base = emptyConversation();
for (const k of Object.keys(base)) if (!(k in state.conv) || (Array.isArray(base[k]) && state.conv[k].length !== base[k].length)) state.conv[k] = base[k];

/* ---------- utilidades ---------- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
const persist = () => saveHistory(state.history) || toast('No se pudo guardar en este navegador.');
const enrich = (r) => {
  const e = evaluate(r.conv);
  return { ...r, escalation: e.escalation, radar: e.radar, preComplete: e.preComplete };
};

/* ---------- esqueleto ---------- */
function shell() {
  $('#app').innerHTML = `
  <header class="top"><div class="top-in">
    <img src="./logo-provisional.png" alt="BanBajío (logotipo provisional)" />
    <div><h1>EXCLUSIVE 360 · Guía de conversación</h1><small>Semáforo de escalamiento y radar de relación</small></div>
    <div class="badges"><span class="badge">PROTOTIPO · datos ficticios</span><span class="badge warn">Logotipo provisional</span></div>
  </div>
  <nav class="tabs" role="tablist" aria-label="Vistas">
    <button role="tab" id="tab-conv" aria-selected="true" aria-controls="view">Conversación</button>
    <button role="tab" id="tab-panel" aria-selected="false" aria-controls="view">Panel e historial</button>
  </nav></header>
  <main id="view" role="tabpanel" tabindex="-1"></main>
  <p class="footer">Material de apoyo sujeto a validación de Fondos de Inversión, Producto y las áreas normativas correspondientes. No sustituye el perfilamiento formal ni las disposiciones aplicables a servicios de inversión. Los dos semáforos son independientes y significan cosas distintas. Esta herramienta no determina por sí misma que un cliente pertenece a Exclusive.</p>
  <dialog id="dlg" aria-labelledby="dlg-t"></dialog>`;
  $('#tab-conv').onclick = () => setView('conv');
  $('#tab-panel').onclick = () => setView('panel');
}
function setView(v) {
  state.view = v;
  $('#tab-conv').setAttribute('aria-selected', v === 'conv');
  $('#tab-panel').setAttribute('aria-selected', v === 'panel');
  v === 'conv' ? renderConversation() : renderPanel();
  window.scrollTo({ top: 0 });
}

/* ---------- vista: conversación ---------- */
const opt = (cls, i, text, checked, extra = '') =>
  `<label class="opt"><input type="checkbox" data-g="${cls}" data-i="${i}" ${checked ? 'checked' : ''}><span>${esc(text)}</span>${extra}</label>`;

function renderConversation() {
  const c = state.conv;
  const editing = state.editingId && state.history.find((h) => h.id === state.editingId);
  $('#view').innerHTML = `
  <div class="layout"><div>
    <section class="card"><h2><span class="n">1</span>Antes de hablar de producto, confirme cuatro cosas</h2><div class="body">
      <div class="four">${PRE_DATA.map((t, i) => `<label class="chip"><input type="checkbox" data-g="pre" data-i="${i}" ${c.pre[i] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>
    </div></section>

    <section class="card"><h2><span class="n">2</span>Semáforo de escalamiento · ¿qué plantea el cliente?</h2><div class="body">
      <p class="hint">Marque las situaciones presentes. Si no hay ninguna de las dos listas, el ejecutivo continúa con orientación general.</p>
      <h3 class="sub"><i style="background:var(--warn)"></i>Involucrar a Banca de Relación / especialista</h3>
      ${YELLOW_SITUATIONS.map((t, i) => opt('yellow', i, t, c.yellow[i])).join('')}
      <h3 class="sub"><i style="background:var(--stop)"></i>Escalar a personal con facultades / certificación</h3>
      ${RED_SITUATIONS.map((t, i) => opt('red', i, t, c.red[i])).join('')}
    </div></section>

    <section class="card"><h2><span class="n">3</span>Radar de relación · ¿qué escucha?</h2><div class="body">
      <h3 class="sub"><i style="background:var(--blue)"></i>Señales de desarrollo</h3>
      ${DEVELOPMENT_SIGNALS.map((s, i) => opt('development', i, s.label, c.development[i], `<span class="w" title="Capacidad ${s.capacity} + intención ${s.intent}">peso ${s.weight}</span>`)).join('')}
      <h3 class="sub"><i style="background:var(--purple)"></i>Señales adicionales de alto valor</h3>
      ${HIGH_VALUE_SIGNALS.map((t, i) => opt('highValue', i, t, c.highValue[i])).join('')}
      <div class="rule"><b>Reglas por confirmar:</b> se exigen ${HIGH_VALUE_MIN} señales de alto valor junto con el nivel Desarrollo, y una sola señal de desarrollo se trata como Prioridad normal con aviso. Los pesos son internos y no alteran el nivel.</div>
    </div></section>

    <section class="card"><h2><span class="n">4</span>Notas y registro</h2><div class="body">
      <label class="field" for="notes">Notas de la conversación</label>
      <textarea id="notes" placeholder="Escriba solo información de la conversación. No incluya nombres, cuentas ni datos personales reales.">${esc(c.notes)}</textarea>
      <div class="row" style="margin-top:12px">
        <label class="field" style="flex:1;min-width:200px">Identificador ficticio (opcional)<input type="text" id="code" maxlength="24" placeholder="${esc(editing ? editing.code : nextCode(state.history))}" value="${esc(editing ? editing.code : '')}"></label>
        <button class="btn" id="save">${editing ? 'Actualizar registro' : 'Guardar en historial'}</button>
        <button class="btn ghost" id="reset">Nueva conversación</button>
      </div>
      <p class="hint" style="margin-top:10px">Se guarda únicamente en este navegador (localStorage). Nada se envía a ningún servidor.</p>
    </div></section>
  </div>
  <aside class="sticky" aria-label="Resultados">
    <section class="card"><h2>Resultado · Semáforo de escalamiento</h2><div id="res-esc" aria-live="polite"></div></section>
    <section class="card"><h2>Resultado · Radar de relación</h2><div id="res-radar" aria-live="polite"></div></section>
    <section class="card"><div class="body" id="res-pre"></div></section>
  </aside></div>
  <div class="minibar" id="mini" role="status" aria-label="Resumen de resultados"></div>`;

  const view = $('#view');
  view.onchange = (e) => {
    const t = e.target;
    if (t.type !== 'checkbox') return;
    state.conv[t.dataset.g][Number(t.dataset.i)] = t.checked;
    saveDraft(state.conv);
    updateResults();
  };
  $('#notes').oninput = (e) => { state.conv.notes = e.target.value; saveDraft(state.conv); };
  $('#save').onclick = saveConversation;
  $('#reset').onclick = () => { resetConversation(); toast('Nueva conversación iniciada.'); };
  updateResults();
}

function lightHtml(title, r, kind) {
  const cls = kind === 'esc' ? r.key : LIGHT[r.key];
  const extra = kind === 'radar' ? `<li>${r.devCount} señales de desarrollo · puntaje interno ${r.devScore} de ${MAX_DEV_SCORE}</li>${r.devCount >= 2 ? `<li>${r.hvCount} señales de alto valor (mínimo ${HIGH_VALUE_MIN})</li>` : ''}` : '';
  const reasons = r.reasons.map((x) => `<li>${esc(x)}</li>`).join('');
  const note = r.note ? `<li><em>${esc(r.note)}</em></li>` : '';
  return `<div class="light ${cls}"><div class="lamp" aria-hidden="true">${ICON[r.key]}</div>
    <div><h4>${title}</h4><b>${esc(r.title)}</b><p>${esc(r.rule)}</p></div></div>
    <p class="act">${esc(r.action)}</p><ul class="why">${extra}${reasons}${note}</ul>`;
}
function updateResults() {
  const e = evaluate(state.conv);
  $('#res-esc').innerHTML = lightHtml('Quién puede atender', e.escalation, 'esc');
  $('#res-radar').innerHTML = lightHtml('Prioridad comercial', e.radar, 'radar');
  const mini = $('#mini');
  if (mini) mini.innerHTML = `<span class="pill ${e.escalation.key}">${ICON[e.escalation.key]} ${esc(e.escalation.title)}</span><span class="pill ${e.radar.key}">${ICON[e.radar.key]} ${esc(e.radar.title)}</span><a href="#res-esc">Ver detalle</a>`;
  const done = state.conv.pre.filter(Boolean).length;
  $('#res-pre').innerHTML = `<b>Datos previos: ${done} de ${PRE_DATA.length}</b><p class="hint" style="margin:4px 0 0">${e.preComplete ? 'Objetivo, liquidez, horizonte y prioridad/riesgo confirmados.' : 'Antes de hablar de producto, confirme los cuatro datos pendientes.'}</p>`;
}
function resetConversation() {
  state.conv = emptyConversation();
  state.editingId = null;
  clearDraft();
  renderConversation();
}
function saveConversation() {
  const typed = $('#code').value.trim();
  const code = typed || (state.editingId ? state.history.find((h) => h.id === state.editingId)?.code : nextCode(state.history));
  const conv = JSON.parse(JSON.stringify(state.conv));
  if (state.editingId) {
    const r = state.history.find((h) => h.id === state.editingId);
    if (r) Object.assign(r, { code, conv });
  } else {
    state.history.unshift({ id: uid(), code, createdAt: new Date().toISOString(), demo: false, conv });
  }
  persist();
  toast(`Conversación ${code} guardada en el historial.`);
  resetConversation();
}

/* ---------- vista: panel ---------- */
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

function filtered() {
  const f = state.filters;
  const q = f.q.trim().toLowerCase();
  let rows = state.history.map(enrich).filter((r) => {
    if (f.esc && r.escalation.key !== f.esc) return false;
    if (f.radar && r.radar.key !== f.radar) return false;
    if (f.origin === 'demo' && !r.demo) return false;
    if (f.origin === 'real' && r.demo) return false;
    if (q) {
      const hay = [r.code, r.conv.notes, ...r.escalation.reasons, ...r.radar.reasons].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const { key, dir } = state.sort;
  const val = (r) => ({
    code: r.code, createdAt: r.createdAt, esc: r.escalation.rank, radar: r.radar.rank, score: r.radar.devScore,
  }[key]);
  rows.sort((a, b) => {
    const x = val(a), y = val(b);
    const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true });
    return dir === 'asc' ? c : -c;
  });
  return rows;
}

function renderPanel() {
  $('#view').innerHTML = `
  <div class="row" style="justify-content:space-between;margin-bottom:16px">
    <div><h2 style="margin:0;color:var(--navy)">Panel e historial</h2><p class="hint" style="margin:0">Indicadores calculados sobre las conversaciones guardadas en este navegador y sobre los filtros activos.</p></div>
    <div class="row">
      <button class="btn ghost" id="demo-on">Cargar datos de demostración</button>
      <button class="btn ghost" id="demo-off">Quitar demostración</button>
      <button class="btn" id="csv">Exportar CSV</button>
    </div>
  </div>
  <section class="card"><div class="body"><div class="filters" role="search">
    <label class="field">Buscar<input type="search" id="f-q" placeholder="Identificador, nota o señal" value="${esc(state.filters.q)}"></label>
    <label class="field">Semáforo de escalamiento<select id="f-esc"><option value="">Todos</option>${Object.values(ESCALATION).map((e) => `<option value="${e.key}" ${state.filters.esc === e.key ? 'selected' : ''}>${e.name}</option>`).join('')}</select></label>
    <label class="field">Radar de relación<select id="f-radar"><option value="">Todos</option>${Object.values(RADAR).map((e) => `<option value="${e.key}" ${state.filters.radar === e.key ? 'selected' : ''}>${e.name}</option>`).join('')}</select></label>
    <label class="field">Origen<select id="f-origin"><option value="">Todos</option><option value="real" ${state.filters.origin === 'real' ? 'selected' : ''}>Capturadas</option><option value="demo" ${state.filters.origin === 'demo' ? 'selected' : ''}>Demostración</option></select></label>
    <button class="btn ghost" id="f-clear">Restablecer filtros</button>
  </div></div></section>
  <div id="dash"></div>`;
  const bind = (id, key, ev = 'input') => { $(id).addEventListener(ev, (e) => { state.filters[key] = e.target.value; renderDash(); }); };
  bind('#f-q', 'q'); bind('#f-esc', 'esc', 'change'); bind('#f-radar', 'radar', 'change'); bind('#f-origin', 'origin', 'change');
  $('#f-clear').onclick = () => { state.filters = { q: '', esc: '', radar: '', origin: '' }; renderPanel(); };
  $('#demo-on').onclick = () => {
    const have = new Set(state.history.map((h) => h.id));
    const add = buildDemo().filter((d) => !have.has(d.id));
    state.history.push(...add);
    persist(); toast(add.length ? `${add.length} conversaciones ficticias cargadas.` : 'Los datos de demostración ya estaban cargados.'); renderDash();
  };
  $('#demo-off').onclick = () => {
    state.history = state.history.filter((h) => !h.demo);
    persist(); toast('Datos de demostración eliminados.'); renderDash();
  };
  $('#csv').onclick = () => {
    const rows = filtered();
    if (!rows.length) return toast('No hay registros para exportar.');
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'exclusive360-historial.csv' });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  renderDash();
}

function bars(items, total) {
  return items.map((i) => `<div class="bar"><span>${esc(i.label)}</span><div class="track" role="img" aria-label="${esc(i.label)}: ${i.n} (${pct(i.n, total)} %)"><div class="fill" style="width:${pct(i.n, total)}%;background:${i.color}"></div></div><span class="val">${i.n} · ${pct(i.n, total)} %</span></div>`).join('');
}

function renderDash() {
  const rows = filtered();
  const total = rows.length;
  const cnt = (fn) => rows.filter(fn).length;
  const E = { green: cnt((r) => r.escalation.key === 'green'), yellow: cnt((r) => r.escalation.key === 'yellow'), red: cnt((r) => r.escalation.key === 'red') };
  const R = { high: cnt((r) => r.radar.key === 'high'), development: cnt((r) => r.radar.key === 'development'), normal: cnt((r) => r.radar.key === 'normal') };
  const pre = cnt((r) => r.preComplete);
  const kpi = (cls, label, n, sub) => `<div class="kpi ${cls}"><small>${label}</small><strong>${n}</strong><span>${sub}</span></div>`;

  const cell = (e, r) => cnt((x) => x.escalation.key === e && x.radar.key === r);
  const th = (k, label) => `<th scope="col" aria-sort="${state.sort.key === k ? (state.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button data-sort="${k}">${label}${state.sort.key === k ? (state.sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`;

  $('#dash').innerHTML = `
  <div class="kpis">
    ${kpi('', 'Conversaciones', total, total === state.history.length ? 'en el historial' : `de ${state.history.length} en el historial`)}
    ${kpi('k-green', 'Verde', E.green, `${pct(E.green, total)} % · continuar`)}
    ${kpi('k-yellow', 'Amarillo', E.yellow, `${pct(E.yellow, total)} % · canalizar`)}
    ${kpi('k-red', 'Rojo', E.red, `${pct(E.red, total)} % · escalar`)}
    ${kpi('k-violet', 'Alto valor', R.high, `${pct(R.high, total)} % del radar`)}
    ${kpi('k-blue', 'Desarrollo', R.development, `${pct(R.development, total)} % del radar`)}
    ${kpi('', 'Datos previos completos', `${pct(pre, total)} %`, `${pre} de ${total}`)}
  </div>
  <div class="charts">
    <section class="card"><h2>Semáforo de escalamiento</h2><div class="body">${bars([
      { label: 'Verde · continuar', n: E.green, color: 'var(--ok)' },
      { label: 'Amarillo · canalizar', n: E.yellow, color: 'var(--warn)' },
      { label: 'Rojo · escalar', n: E.red, color: 'var(--stop)' }], total)}</div></section>
    <section class="card"><h2>Radar de relación</h2><div class="body">${bars([
      { label: 'Alto valor', n: R.high, color: 'var(--purple)' },
      { label: 'Desarrollo', n: R.development, color: 'var(--blue)' },
      { label: 'Normal', n: R.normal, color: 'var(--g2)' }], total)}</div></section>
    <section class="card"><h2>Cruce de ambos semáforos</h2><div class="body"><table class="matrix"><caption class="hint">Número de conversaciones. Los semáforos se muestran por separado y se cruzan solo aquí.</caption>
      <thead><tr><th scope="col"></th><th scope="col">Normal</th><th scope="col">Desarrollo</th><th scope="col">Alto valor</th></tr></thead><tbody>
      ${['green', 'yellow', 'red'].map((e) => `<tr><th scope="row">${ESCALATION[e].name}</th>${['normal', 'development', 'high'].map((r) => `<td class="cell">${cell(e, r)}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div></section>
  </div>
  <section class="card"><h2>Historial de conversaciones</h2><div class="body">
  ${rows.length ? `<div class="tablewrap"><table class="list"><thead><tr>${th('code', 'Identificador')}${th('createdAt', 'Fecha')}${th('esc', 'Escalamiento')}${th('radar', 'Radar')}${th('score', 'Puntaje')}<th scope="col">Origen</th></tr></thead><tbody>
    ${rows.map((r) => `<tr class="clickable" data-id="${esc(r.id)}"><td><button class="btn ghost" style="padding:4px 10px" data-open="${esc(r.id)}">${esc(r.code)}</button></td><td>${fmtDate(r.createdAt)}</td>
    <td><span class="pill ${r.escalation.key}">${ICON[r.escalation.key]} ${esc(r.escalation.name)}</span></td>
    <td><span class="pill ${r.radar.key}">${ICON[r.radar.key]} ${esc(r.radar.name)}</span></td><td>${r.radar.devScore}</td><td>${r.demo ? 'Demostración' : 'Capturada'}</td></tr>`).join('')}
    </tbody></table></div>`
    : `<p class="empty">${state.history.length ? 'Ningún registro coincide con los filtros.' : 'Aún no hay conversaciones guardadas. Guarde una desde la pestaña Conversación o cargue los datos de demostración.'}</p>`}
  </div></section>`;

  $('#dash').onclick = (e) => {
    const s = e.target.closest('[data-sort]');
    if (s) {
      const k = s.dataset.sort;
      state.sort = { key: k, dir: state.sort.key === k && state.sort.dir === 'desc' ? 'asc' : 'desc' };
      return renderDash();
    }
    const o = e.target.closest('[data-open],[data-id]');
    if (o) openDetail(o.dataset.open || o.dataset.id);
  };
}

/* ---------- ficha individual ---------- */
function openDetail(id) {
  const rec = state.history.find((h) => h.id === id);
  if (!rec) return;
  const r = enrich(rec);
  const dlg = $('#dlg');
  const pillE = `<span class="pill ${r.escalation.key}">${ICON[r.escalation.key]} ${esc(r.escalation.title)}</span>`;
  const pillR = `<span class="pill ${r.radar.key}">${ICON[r.radar.key]} ${esc(r.radar.title)}</span>`;
  const ul = (a) => (a.length ? `<ul class="why" style="padding:0">${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="hint">Ninguna.</p>');
  dlg.innerHTML = `
  <header><h2 id="dlg-t">Ficha ${esc(r.code)}</h2><button class="btn ghost" style="padding:4px 12px" id="d-close" aria-label="Cerrar">Cerrar</button></header>
  <div class="dbody">
    <p class="hint">${fmtDate(r.createdAt)} · ${r.demo ? 'Datos de demostración' : 'Capturada en este navegador'}</p>
    ${r.preComplete ? '' : '<div class="rule"><b>Advertencia de calidad:</b> los cuatro datos previos no se confirmaron completos.</div>'}
    <div class="two">
      <div><h3 class="sub">Semáforo de escalamiento</h3>${pillE}<p>${esc(r.escalation.rule)}</p><p class="act" style="padding:8px 10px;border-radius:8px">${esc(r.escalation.action)}</p>
        <h4>Situaciones que lo originan</h4>${ul(r.escalation.reasons)}${r.escalation.note ? `<p class="hint">${esc(r.escalation.note)}</p>` : ''}</div>
      <div><h3 class="sub">Radar de relación</h3>${pillR}<p>${esc(r.radar.rule)}</p><p class="act" style="padding:8px 10px;border-radius:8px">${esc(r.radar.action)}</p>
        <h4>Señales (puntaje ${r.radar.devScore} de ${MAX_DEV_SCORE})</h4>${ul(r.radar.reasons)}${r.radar.note ? `<p class="hint">${esc(r.radar.note)}</p>` : ''}</div>
    </div>
    <h3 class="sub">Datos previos</h3>
    <p>${PRE_DATA.map((t, i) => `${r.conv.pre[i] ? '✔' : '✖'} ${esc(t)}`).join(' &nbsp;·&nbsp; ')}</p>
    <h3 class="sub">Notas</h3><p>${r.conv.notes ? esc(r.conv.notes) : '<span class="hint">Sin notas.</span>'}</p>
    <div class="row" style="margin-top:16px">
      <button class="btn" id="d-edit">Editar en conversación</button>
      <button class="btn danger" id="d-del">Eliminar registro</button>
    </div>
  </div>`;
  $('#d-close').onclick = () => dlg.close();
  $('#d-edit').onclick = () => {
    state.conv = JSON.parse(JSON.stringify(rec.conv));
    state.editingId = rec.id;
    saveDraft(state.conv);
    dlg.close();
    setView('conv');
  };
  $('#d-del').onclick = () => {
    if (!confirm(`¿Eliminar el registro ${r.code}? Esta acción no se puede deshacer.`)) return;
    state.history = state.history.filter((h) => h.id !== id);
    persist(); dlg.close(); toast('Registro eliminado.'); renderDash();
  };
  dlg.showModal();
}

shell();
renderConversation();
