/* CIPS Exam Hub — vanilla JS single-page app. Progress lives in localStorage. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DAY = 864e5;
const INTERVALS = [0, 1, 3, 7, 16, 35];
const KEY = 'cips.v1', SKEY = 'cips.session';
const DOMS = ['A', 'B', 'C', 'D', 'E'];
const DOM_SHORT = { A: 'Physics & safety', B: 'Chronic pain', C: 'Spine', D: 'Peripheral & autonomic', E: 'Musculoskeletal' };
const MOCK_SPLIT = { A: 15, B: 15, C: 20, D: 25, E: 25 };
const DRAW_NAMES = { spine: 'Spine', nerve: 'Peripheral nerve', joint: 'MSK joint', soft: 'MSK soft tissue' };
const REGION_NAMES = { spine: 'Spine', nerve: 'Peripheral & autonomic nerves', msk: 'Musculoskeletal' };
const CHECK8 = [
  'Used the ultrasound machine appropriately (mode, depth, gain, focus, frequency)',
  'Chose the proper equipment (transducer, needle gauge/length, sterile supplies)',
  'Used the probe correctly (orientation, handling, cable management, stability)',
  'Identified the anatomic target(s) correctly',
  'Used ultrasound as a real-time guide rather than a blind technique',
  'Showed an acceptable skin entry for the needle',
  'Visualized the needle tip before every advance',
  'Placed the needle correctly at the end position',
];
const US12 = ['Machine placed ergonomically', 'Patient/physician information entered', 'Correct settings chosen and adapted', 'Correct transducer', 'Transducer cleaned before/after', 'Gloves used', 'Regional overview first', 'Focused examination of the target', 'Measurements compared with the contralateral side', 'Color or power Doppler used', 'Dynamic examination performed', 'Named the structures the examiner points to'];
const ORAL_Q = ['Differential diagnosis', 'Physical examination', 'Diagnostic tests', 'Ultrasound examination', 'Conservative treatment', 'Interventional technique', 'Procedure description', 'Complications', 'Post-procedure evaluation'];

// ---------- state ----------
const defaults = () => ({ mcq: {}, flags: {}, sessions: [], procs: {}, sims: [], cases: {}, plan: {}, theme: null });
let S;
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = defaults(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Progress could not be saved: browser storage is full or blocked.'); } };
let SESSION = null;
try { SESSION = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { SESSION = null; }
const saveSession = () => { try { SESSION ? localStorage.setItem(SKEY, JSON.stringify(SESSION)) : localStorage.removeItem(SKEY); } catch (e) {} };

let Q = [], QI = {}, G = null, PROC = {};
let timerHandle = null;

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

// ---------- theme ----------
function applyTheme() {
  const dark = (S.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#themeBtn').textContent = dark ? 'Switch to light' : 'Switch to dark';
}
$('#themeBtn').addEventListener('click', () => {
  S.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme();
});

// ---------- MCQ stats ----------
function record(id, correct) {
  const r = S.mcq[id] || { n: 0, c: 0, box: 0 };
  r.n++; if (correct) r.c++;
  r.last = correct ? 1 : 0; r.t = Date.now();
  r.box = correct ? Math.min((r.box || 0) + 1, 5) : 1;
  r.due = correct ? Date.now() + INTERVALS[r.box] * DAY : Date.now() + 10 * 60 * 1000;
  S.mcq[id] = r;
}
function domStats(pool = Q) {
  const d = {};
  DOMS.forEach(k => d[k] = { total: 0, seen: 0, right: 0, att: 0, attC: 0 });
  pool.forEach(q => {
    const s = d[q.dom]; s.total++;
    const r = S.mcq[q.id];
    if (r) { s.seen++; s.right += r.last; s.att += r.n; s.attC += r.c; }
  });
  DOMS.forEach(k => { const s = d[k]; s.mastery = s.seen ? s.right / s.seen : 0; s.cover = s.total ? s.seen / s.total : 0; });
  return d;
}
function part1Score() {
  const d = domStats(); let sum = 0;
  DOMS.forEach(k => { const s = d[k]; const coverFactor = Math.min(1, s.cover / 0.3); sum += MOCK_SPLIT[k] / 100 * s.mastery * coverFactor; });
  return sum;
}
const wrongIds = () => Q.filter(q => S.mcq[q.id] && S.mcq[q.id].last === 0).map(q => q.id);
const dueIds = () => { const now = Date.now(); return Q.filter(q => { const r = S.mcq[q.id]; return r && r.due <= now; }).map(q => q.id); };
const flaggedIds = () => Q.filter(q => S.flags[q.id]).map(q => q.id);
function weakestDomain() {
  const d = domStats();
  const seen = DOMS.filter(k => d[k].seen >= 5);
  if (!seen.length) return DOMS.slice().sort((a, b) => d[a].cover - d[b].cover)[0];
  return seen.sort((a, b) => d[a].mastery - d[b].mastery)[0];
}
function keywordStats() {
  const m = {};
  Q.forEach(q => {
    const r = S.mcq[q.id]; if (!r) return;
    q.kw.forEach(k => { const key = k.toLowerCase(); const e = m[key] || (m[key] = { k, seen: 0, right: 0, ids: [] }); e.seen++; e.right += r.last; e.ids.push(q.id); });
  });
  return Object.values(m).filter(e => e.seen >= 2).map(e => ({ ...e, mastery: e.right / e.seen }))
    .sort((a, b) => a.mastery - b.mastery || b.seen - a.seen);
}
function readingList() {
  const m = {};
  wrongIds().forEach(id => {
    const q = QI[id];
    (q.ref || '').split(/;\s*/).map(s => s.trim().replace(/\bCh\.?\s*/i, '')).filter(Boolean).forEach(ref => { (m[ref] = m[ref] || { ref, ids: [] }).ids.push(id); });
  });
  return Object.values(m).sort((a, b) => b.ids.length - a.ids.length);
}

// ---------- other part scores ----------
function part2aScore() {
  const drawable = G.procedures.filter(p => p.draw);
  return drawable.reduce((s, p) => s + (S.procs[p.id]?.conf ? (S.procs[p.id].conf - 1) / 3 : 0), 0) / drawable.length;
}
function caseBest(n) {
  const c = S.cases[n]; if (!c || !c.runs?.length) return null;
  return Math.max(...c.runs.map(r => avg(r.scores.filter(Boolean))));
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function part2bScore() {
  let s = 0; G.cases.forEach(c => { const b = caseBest(c.n); if (b) s += (b - 1) / 3; });
  return s / G.cases.length;
}
function oralAreaAverages() {
  const sums = ORAL_Q.map(() => []);
  Object.values(S.cases).forEach(c => { const last = c.runs?.[c.runs.length - 1]; if (last) last.scores.forEach((v, i) => v && sums[i].push(v)); });
  return sums.map((a, i) => ({ i, name: ORAL_Q[i], avg: a.length ? avg(a) : null, n: a.length }));
}

// ---------- router ----------
function route() {
  clearInterval(timerHandle);
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [a = '', b = '', c = ''] = parts;
  $$('.rail a[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === (a || 'hub')));
  const main = $('#main');
  main.className = a === 'part1' ? 'part-1' : a === 'part2a' ? 'part-2a' : a === 'part2b' ? 'part-2b' : '';
  let html;
  if (a === 'part1') html = viewPart1(b, c);
  else if (a === 'part2a') html = viewPart2A(b, c);
  else if (a === 'part2b') html = viewPart2B(b, c);
  else if (a === 'plan') html = viewPlan();
  else if (a === 'data') html = viewData();
  else html = viewHub();
  if (typeof html === 'string') main.innerHTML = html;
  bind(main);
  if (!route.keepScroll) window.scrollTo(0, 0);
  route.keepScroll = false;
  if (route.focus) { main.focus({ preventScroll: true }); }
  route.focus = true;
  document.title = ({ part1: 'Part 1 · MCQ', part2a: 'Part 2A · Practical', part2b: 'Part 2B · Oral', plan: '12-week plan', data: 'Backup' }[a] || 'Overview') + ' — CIPS Exam Hub';
}
const go = h => { if (location.hash === h) route(); else location.hash = h; };
function rerender() { route.keepScroll = true; route.focus = false; route(); }

// ---------- generic blocks ----------
function blocksHTML(blocks) {
  return (blocks || []).map(b => {
    if (b.t === 'p') return `<p>${esc(b.text)}</p>`;
    if (b.t === 'ul') return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    if (b.t === 'ol') return `<ol>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
    if (b.t === 'table') return `<div style="overflow-x:auto"><table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return '';
  }).join('');
}
const section = t => G.sections.find(s => s.title === t);
const sub = (t, st) => section(t).subs.find(s => s.title === st);
function sectionHTML(t, level = 2) {
  const s = section(t);
  return `<h${level}>${esc(s.title)}</h${level}>${blocksHTML(s.intro)}${s.subs.map(x => `<h${level + 1}>${esc(x.title)}</h${level + 1}>${blocksHTML(x.blocks)}`).join('')}`;
}
const bar = (v, cls = '') => `<div class="bar ${cls}" role="img" aria-label="${Math.round(v * 100)}%"><i style="width:${Math.max(0, Math.min(100, v * 100)).toFixed(1)}%"></i></div>`;
const tabs = (base, cur, items) => `<nav class="tabs" aria-label="Sections">${items.map(([k, label]) => `<a href="#/${base}${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${label}</a>`).join('')}</nav>`;

// ---------- HUB ----------
function scanSVG() {
  return `<div class="scan" aria-hidden="true">
  <div class="scan-meta"><span>L12-5 · MSK · 4.0 cm</span><span>In-plane, lateral → medial</span></div>
  <svg viewBox="0 0 400 290">
    <defs>
      <clipPath id="fan"><path d="M200 6 L28 236 A215 215 0 0 0 372 236 Z"/></clipPath>
      <filter id="speckle" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85 1.6" numOctaves="2" seed="7"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.62"/>
      </filter>
      <radialGradient id="tgc" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <linearGradient id="shadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".95"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>
    </defs>
    <g clip-path="url(#fan)">
      <rect width="400" height="290" fill="#15191c"/>
      <rect width="400" height="290" filter="url(#speckle)" opacity=".5"/>
      <path d="M0 62 Q200 48 400 66" stroke="#cfd6da" stroke-width="2.5" fill="none" opacity=".55"/>
      <path d="M0 118 Q200 100 400 124" stroke="#9aa5ab" stroke-width="1.6" fill="none" opacity=".5"/>
      <path d="M40 212 Q200 176 360 214 L360 300 L40 300 Z" fill="url(#shadow)"/>
      <path d="M40 212 Q200 176 360 214" stroke="#f2f5f6" stroke-width="4.5" fill="none" opacity=".92"/>
      <ellipse cx="236" cy="152" rx="24" ry="15" fill="#0b0e10" stroke="#e8edef" stroke-width="2" opacity=".95"/>
      <g fill="#c3cbd0" opacity=".75"><circle cx="227" cy="148" r="2.6"/><circle cx="236" cy="145" r="2.6"/><circle cx="245" cy="150" r="2.6"/><circle cx="231" cy="157" r="2.6"/><circle cx="242" cy="158" r="2.6"/></g>
      <circle class="spread-in go" cx="236" cy="152" r="34" fill="#0b0e10" opacity=".55" style="transform-origin:236px 152px"/>
      <line class="needle go" x1="20" y1="44" x2="208" y2="148" stroke="#ffffff" stroke-width="2.6" opacity=".95"/>
      <circle class="tip go" cx="208" cy="148" r="4" fill="#fff"/>
      <rect width="400" height="290" fill="url(#tgc)"/>
    </g>
    <path d="M200 6 L28 236 A215 215 0 0 0 372 236 Z" fill="none" stroke="#2c363d"/>
    <g fill="#6f8593" font-size="10" font-family="IBM Plex Sans, sans-serif">
      ${[0, 1, 2, 3, 4].map(i => `<line x1="384" x2="392" y1="${12 + i * 55}" y2="${12 + i * 55}" stroke="#6f8593"/><text x="370" y="${16 + i * 55}" text-anchor="end">${i}</text>`).join('')}
    </g>
  </svg></div>`;
}
function viewHub() {
  const p1 = part1Score(), p2a = part2aScore(), p2b = part2bScore();
  const overall = 0.2 * p1 + 0.6 * p2a + 0.2 * p2b;
  const seen = Object.keys(S.mcq).length;
  const d = domStats();
  const wd = weakestDomain();
  const lowProcs = G.procedures.filter(p => p.draw).map(p => ({ p, c: S.procs[p.id]?.conf || 0 })).sort((a, b) => a.c - b.c).slice(0, 3);
  const areas = oralAreaAverages().filter(a => a.avg !== null).sort((a, b) => a.avg - b.avg);
  const due = dueIds().length, wrong = wrongIds().length;
  const nextWeek = G.weeks.find(w => !S.plan[w.n]);
  const casesDone = G.cases.filter(c => caseBest(c.n)).length;
  const sims = S.sims.length;
  return `
  <section class="hero">
    <div>
      <h1>Scan with intention.</h1>
      <p class="lede">One place to prepare for all three parts of the Certified Interventional Pain Sonologist exam: ${Q.length.toLocaleString()} explained MCQs, ${G.procedures.length} procedure guides with a timed station simulator, and ${G.cases.length} mock oral cases in the examiner's nine-question format.</p>
      <div class="readiness"><b>${Math.round(overall * 100)}%</b><span class="muted">self-tracked readiness, weighted like the exam:<br>written 20% · practical 60% · oral 20%</span></div>
      ${bar(overall)}
    </div>
    ${scanSVG()}
  </section>

  <div class="parts">
    <a class="partcard part-1" href="#/part1">
      <div class="spread"><h2>Part 1 · Theoretical</h2><span class="weight">20%</span></div>
      <p class="muted">100 four-option MCQs in 2 hours across five domains.</p>
      <div class="spread"><span>${seen.toLocaleString()} of ${Q.length.toLocaleString()} answered</span><span>${pct(Object.values(S.mcq).reduce((s, r) => s + r.last, 0), seen)}% currently right</span></div>
      ${bar(p1)}
      <small>${due ? `${due} questions due for review` : 'Start a practice set or a timed mock'}</small>
    </a>
    <a class="partcard part-2a" href="#/part2a">
      <div class="spread"><h2>Part 2A · Practical</h2><span class="weight">60%</span></div>
      <p class="muted">Four cadaver procedures, 15 minutes each, one per region.</p>
      <div class="spread"><span>${G.procedures.filter(p => p.draw && S.procs[p.id]?.conf >= 3).length} of 20 drawable procedures rated 3+</span><span>${sims} sims</span></div>
      ${bar(p2a)}
      <small>Rate each procedure on the examiner's 1–4 scale as you rehearse</small>
    </a>
    <a class="partcard part-2b" href="#/part2b">
      <div class="spread"><h2>Part 2B · Oral</h2><span class="weight">20%</span></div>
      <p class="muted">One vignette, nine question areas, live-model exam.</p>
      <div class="spread"><span>${casesDone} of ${G.cases.length} cases rehearsed</span></div>
      ${bar(p2b)}
      <small>Self-score each answer 1–4 against the model answer</small>
    </a>
  </div>

  <div class="grid g2" style="margin-top:28px">
    <section class="panel">
      <h3>Where to focus next</h3>
      <ul class="focus-list">
        <li><span>Weakest MCQ domain: <b>${esc(DOM_SHORT[wd])}</b><br><small>${d[wd].seen ? `${Math.round(d[wd].mastery * 100)}% right on ${d[wd].seen} seen` : 'not started yet'}</small></span><button class="btn ghost part-1" data-act="drillDomain" data-dom="${wd}">Drill 20</button></li>
        <li><span>Mistakes to retry<br><small>${wrong} questions answered wrong last time</small></span><button class="btn ghost part-1" data-act="drillWrong" ${wrong ? '' : 'disabled'}>Retry</button></li>
        <li><span>Lowest-confidence procedures<br><small>${lowProcs.map(x => esc(x.p.title)).join('; ')}</small></span><a class="btn ghost part-2a" href="#/part2a">Review</a></li>
        <li><span>Weakest oral area<br><small>${areas.length ? `${esc(areas[0].name)} · average ${areas[0].avg.toFixed(1)} / 4` : 'no cases scored yet'}</small></span><a class="btn ghost part-2b" href="#/part2b">Practise</a></li>
      </ul>
    </section>
    <section class="panel">
      <h3>${nextWeek ? `This week: week ${nextWeek.n}, ${esc(nextWeek.title)}` : 'All 12 weeks complete'}</h3>
      ${nextWeek ? `<p><b>Read</b> ${esc(nextWeek.read)}</p><p><b>Scan</b> ${esc(nextWeek.scan)}</p><p><b>Test</b> ${esc(nextWeek.test)}</p>` : '<p>Use the final 48 hours for checklists and your complication list, not new material.</p>'}
      <a href="#/plan">Open the 12-week plan</a>
    </section>
  </div>

  <section class="prose" style="margin-top:12px">
    ${(() => { const s = sub('The CIPS Examination at a Glance', 'Exam Structure and Scoring'); return `<h2>The exam at a glance</h2>${blocksHTML(s.blocks)}`; })()}
    <details class="proc" style="margin-top:10px"><summary><span class="t">Eligibility, application and exam-day rules</span></summary><div class="proc-body">${blocksHTML(sub('The CIPS Examination at a Glance', 'Eligibility, Application and Exam-Day Rules').blocks)}</div></details>
  </section>`;
}

// ---------- PART 1 ----------
let P1CFG = { src: 'all', doms: DOMS.slice(), filter: 'all', count: 20, order: 'random', fb: 'instant' };
function poolFor(cfg) {
  let pool = Q;
  if (cfg.src === 'B' || cfg.src === 'P') pool = pool.filter(q => q.src === cfg.src);
  else if (cfg.src !== 'all') pool = pool.filter(q => q.set === cfg.src);
  pool = pool.filter(q => cfg.doms.includes(q.dom));
  const now = Date.now();
  if (cfg.filter === 'unseen') pool = pool.filter(q => !S.mcq[q.id]);
  if (cfg.filter === 'wrong') pool = pool.filter(q => S.mcq[q.id]?.last === 0);
  if (cfg.filter === 'flagged') pool = pool.filter(q => S.flags[q.id]);
  if (cfg.filter === 'due') pool = pool.filter(q => S.mcq[q.id] && S.mcq[q.id].due <= now);
  return pool;
}
function viewPart1(tab, sub2) {
  if (tab === 'quiz') return viewQuiz();
  if (tab === 'result') return viewResult();
  const head = `<h1>Part 1 · Theoretical exam</h1><p class="lede">100 four-option questions in 2 hours, worth 20% of the final score. Every answer here comes with an explanation, revision keywords and a book-and-chapter reference.</p>
  ${SESSION ? `<div class="panel" style="margin:16px 0"><div class="spread"><span>You have an unfinished ${SESSION.mode === 'mock' ? 'mock exam' : 'practice set'}: question ${SESSION.i + 1} of ${SESSION.ids.length}.</span><span class="row"><a class="btn" href="#/part1/quiz">Resume</a><button class="btn quiet" data-act="discardSession">Discard</button></span></div></div>` : ''}
  ${tabs('part1', tab || '', [['', 'Practice'], ['stats', 'Progress & weak areas'], ['review', 'Mistakes, flags & search'], ['notes', 'Theory notes']])}`;
  if (tab === 'stats') return head + viewStats();
  if (tab === 'review') return head + viewReview();
  if (tab === 'notes') return head + `<div class="prose">${sectionHTML('Ultrasound Physics, Equipment and Safety')}${sectionHTML('Chronic Pain Foundations')}${sectionHTML('References and Study Strategy')}<h2>Book codes used in references</h2><table><tbody>${Object.entries(G.books).map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div>`;
  return head + viewPractice();
}
function viewPractice() {
  const c = P1CFG, n = poolFor(c).length;
  const wrong = wrongIds().length, due = dueIds().length, fl = flaggedIds().length;
  const sets = [...new Set(Q.map(q => q.set))];
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" class="${String(c[key]) === String(v) ? 'on' : ''}" aria-pressed="${String(c[key]) === String(v)}" data-cfg="${key}" data-val="${v}">${l}</button>`).join('')}</div>`;
  return `
  <div class="grid g3">
    <div class="panel"><h3>Timed mock exam</h3><p class="muted">100 questions drawn like the real paper (15 physics, 15 chronic pain, 20 spine, 25 peripheral, 25 MSK), 2-hour clock, answers revealed at the end.</p><button class="btn" data-act="mock">Start mock exam</button></div>
    <div class="panel"><h3>Smart review</h3><p class="muted">${due} due by spaced repetition, ${wrong} wrong last time. Fills up with your weakest domain: ${esc(DOM_SHORT[weakestDomain()])}.</p><button class="btn ghost" data-act="smart">Start 20 questions</button></div>
    <div class="panel"><h3>Flagged</h3><p class="muted">${fl} questions you marked to come back to.</p><button class="btn ghost" data-act="drillFlagged" ${fl ? '' : 'disabled'}>Practise flagged</button></div>
  </div>
  <section class="panel" style="margin-top:20px">
    <h2 style="margin-top:0">Build a practice set</h2>
    <div class="grid g2">
      <label class="field"><span>Question source</span>
        <select data-cfgsel="src">
          <option value="all" ${c.src === 'all' ? 'selected' : ''}>Everything (${Q.length})</option>
          <option value="B" ${c.src === 'B' ? 'selected' : ''}>MCQ Bank 1000</option>
          <option value="P" ${c.src === 'P' ? 'selected' : ''}>Practice bank, volumes 1–2 (120)</option>
          ${sets.map(s => `<option value="${esc(s)}" ${c.src === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select></label>
      <div class="field"><span>Domains</span>
        ${DOMS.map(k => `<label class="chk"><input type="checkbox" data-dom="${k}" ${c.doms.includes(k) ? 'checked' : ''}> ${esc(G_DOM(k))}</label>`).join('')}
      </div>
      <div class="field"><span>Which questions</span>${seg('filter', [['all', 'All'], ['unseen', 'Not seen yet'], ['wrong', 'Wrong last time'], ['due', 'Due for review'], ['flagged', 'Flagged']])}</div>
      <div class="field"><span>How many</span>${seg('count', [[10, '10'], [20, '20'], [50, '50'], [100, '100'], [0, 'All']])}</div>
      <div class="field"><span>Order</span>${seg('order', [['random', 'Shuffled'], ['seq', 'In bank order']])}</div>
      <div class="field"><span>Feedback</span>${seg('fb', [['instant', 'After each question'], ['end', 'At the end']])}</div>
    </div>
    <div class="spread" style="margin-top:18px"><span class="muted">${n} questions match these settings.</span><button class="btn" data-act="startPractice" ${n ? '' : 'disabled'}>Start practice</button></div>
  </section>`;
}
const G_DOM = k => DATA_DOMAINS[k] || DOM_SHORT[k];
let DATA_DOMAINS = {};

function startSession(ids, mode, label, opts = {}) {
  if (!ids.length) { toast('No questions match.'); return; }
  SESSION = { mode, label, ids, i: 0, ans: {}, checked: {}, start: Date.now(), limit: opts.limit || null, instant: opts.instant !== false && mode !== 'mock' };
  saveSession(); go('#/part1/quiz');
}
function startPractice() {
  let pool = poolFor(P1CFG);
  if (P1CFG.order === 'random') pool = shuffle(pool);
  if (P1CFG.count) pool = pool.slice(0, P1CFG.count);
  const srcName = P1CFG.src === 'all' ? 'All questions' : P1CFG.src === 'B' ? 'Bank 1000' : P1CFG.src === 'P' ? 'Practice bank' : P1CFG.src;
  startSession(pool.map(q => q.id), 'practice', `Practice · ${srcName}`, { instant: P1CFG.fb === 'instant' });
}
function startMock() {
  const ids = [];
  DOMS.forEach(k => ids.push(...shuffle(Q.filter(q => q.dom === k && q.src === 'B')).slice(0, MOCK_SPLIT[k]).map(q => q.id)));
  startSession(ids, 'mock', 'Mock exam', { limit: 120 * 60, instant: false });
}
function startSmart() {
  const set = new Set([...shuffle(dueIds()), ...shuffle(wrongIds())]);
  const wd = weakestDomain();
  shuffle(Q.filter(q => q.dom === wd && !S.mcq[q.id])).forEach(q => set.add(q.id));
  shuffle(Q.filter(q => q.dom === wd)).forEach(q => set.add(q.id));
  startSession([...set].slice(0, 20), 'practice', 'Smart review');
}

function viewQuiz() {
  if (!SESSION) return `<div class="empty"><p>No active question set.</p><a class="btn" href="#/part1">Choose a practice set</a></div>`;
  const s = SESSION, id = s.ids[s.i], q = QI[id];
  if (!q) { SESSION = null; saveSession(); return viewQuiz(); }
  const chosen = s.ans[id];
  const checked = s.instant && s.checked[id];
  const L = 'ABCD';
  const opts = q.o.map((o, i) => {
    let cls = '';
    if (checked) { if (i === q.a) cls = 'right'; else if (i === chosen) cls = 'wrong'; }
    else if (i === chosen) cls = 'sel';
    return `<button type="button" class="opt ${cls}" data-opt="${i}" ${checked ? 'disabled' : ''} aria-pressed="${i === chosen}"><span class="L">${L[i]}</span><span>${esc(o)}</span></button>`;
  }).join('');
  const last = s.i === s.ids.length - 1;
  const answered = Object.keys(s.ans).length;
  return `<div class="quiz">
    <div class="qhead"><div><b>${esc(s.label)}</b> <span class="muted">· question ${s.i + 1} of ${s.ids.length}</span></div>
      <div class="row">${s.limit ? `<span class="timer" id="timer"></span>` : ''}<button type="button" class="flag ${S.flags[id] ? 'on' : ''}" data-act="flag" aria-pressed="${!!S.flags[id]}">${S.flags[id] ? 'Flagged' : 'Flag'}</button></div></div>
    <div class="progress"><i style="width:${(100 * answered / s.ids.length).toFixed(1)}%"></i></div>
    <div class="row" style="margin-top:12px"><span class="tag acc">${esc(G_DOM(q.dom))}</span><span class="tag">${esc(q.set)} · Q${q.n}</span>${S.mcq[id] ? `<span class="tag">seen ${S.mcq[id].n}×, ${S.mcq[id].last ? 'right' : 'wrong'} last time</span>` : ''}</div>
    <p class="qstem">${esc(q.q)}</p>
    <div class="opts">${opts}</div>
    ${checked ? explainHTML(q, chosen) : ''}
    <div class="qnav">
      <div class="row">${s.i > 0 ? `<button class="btn quiet" data-act="prev">Previous</button>` : ''}<button class="btn quiet" data-act="finish">${s.mode === 'mock' ? 'Submit exam' : 'End set'}</button></div>
      <div class="row">${s.instant && !checked ? `<button class="btn" data-act="check" ${chosen === undefined ? 'disabled' : ''}>Check answer</button>` : last ? `<button class="btn" data-act="finish">${s.mode === 'mock' ? 'Submit exam' : 'See results'}</button>` : `<button class="btn" data-act="next">Next question</button>`}</div>
    </div>
    <p class="kbd">Keys: 1–4 or A–D to choose, Enter to ${s.instant ? 'check / continue' : 'continue'}, F to flag, ← → to move.</p>
    ${s.mode === 'mock' ? `<div class="grid-nav" aria-label="Question map">${s.ids.map((x, i) => `<button type="button" data-goto="${i}" class="${s.ans[x] !== undefined ? 'ans' : ''} ${i === s.i ? 'cur' : ''} ${S.flags[x] ? 'fl' : ''}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</div>` : ''}
  </div>`;
}
function explainHTML(q, chosen) {
  const ok = chosen === q.a, neutral = chosen === null;
  return `<div class="explain ${ok || neutral ? '' : 'wrongx'}" role="status"><h3>${neutral ? `Answer: ${'ABCD'[q.a]}` : ok ? 'Correct' : chosen === undefined ? `Unanswered: the answer is ${'ABCD'[q.a]}` : `Not quite: the answer is ${'ABCD'[q.a]}`}</h3><p>${esc(q.x)}</p>
  ${q.kw.length ? `<div class="kw">${q.kw.map(k => `<span class="tag">${esc(k)}</span>`).join('')}</div>` : ''}
  ${q.ref ? `<p style="margin:10px 0 0" class="muted">Read: ${esc(q.ref)}</p>` : ''}</div>`;
}
function quizTick() {
  const el = $('#timer'); if (!el || !SESSION?.limit) return;
  const left = SESSION.limit - Math.floor((Date.now() - SESSION.start) / 1000);
  if (left <= 0) { clearInterval(timerHandle); toast('Time is up. Your exam has been submitted.'); finishSession(); return; }
  const h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), sec = left % 60;
  el.textContent = `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')} left`;
  el.classList.toggle('low', left < 600);
}
function finishSession() {
  const s = SESSION; if (!s) return;
  const answered = s.ids.filter(id => s.ans[id] !== undefined);
  if (s.mode === 'practice' && !answered.length) { SESSION = null; saveSession(); go('#/part1'); return; }
  const dom = {}; let c = 0;
  s.ids.forEach(id => {
    const q = QI[id], a = s.ans[id];
    if (a === undefined && s.mode !== 'mock') return;
    const ok = a === q.a;
    if (!s.instant) record(id, ok);
    if (ok) c++;
    (dom[q.dom] = dom[q.dom] || [0, 0]); dom[q.dom][1]++; if (ok) dom[q.dom][0]++;
  });
  const n = s.mode === 'mock' ? s.ids.length : answered.length;
  S.sessions.push({ ts: Date.now(), mode: s.mode, label: s.label, n, c, dom, dur: Math.round((Date.now() - s.start) / 1000) });
  if (S.sessions.length > 300) S.sessions = S.sessions.slice(-300);
  save();
  LAST_RESULT = { ...s, n, c, dom };
  SESSION = null; saveSession();
  go('#/part1/result');
}
let LAST_RESULT = null;
function viewResult() {
  const r = LAST_RESULT;
  if (!r) return `<div class="empty"><p>Finish a practice set to see results here.</p><a class="btn" href="#/part1">Back to Part 1</a></div>`;
  const items = r.ids.filter(id => r.mode === 'mock' || r.ans[id] !== undefined);
  const wrong = items.filter(id => r.ans[id] !== QI[id].a);
  const mins = Math.round((Date.now() - r.start) / 60000);
  return `<h1>${esc(r.label)}: ${pct(r.c, r.n)}%</h1>
  <p class="lede">${r.c} of ${r.n} correct in ${mins} minute${mins === 1 ? '' : 's'}. ${r.mode === 'mock' ? 'Unanswered questions count as wrong, as they would on the day.' : ''}</p>
  <div class="dombars panel" style="margin:18px 0">${DOMS.filter(k => r.dom[k]).map(k => `<div class="dombar"><div class="spread"><span>${esc(G_DOM(k))}</span><span>${r.dom[k][0]} / ${r.dom[k][1]} · ${pct(...r.dom[k])}%</span></div>${bar(r.dom[k][0] / r.dom[k][1], r.dom[k][0] / r.dom[k][1] < .6 ? 'bad' : r.dom[k][0] / r.dom[k][1] < .75 ? 'warn' : 'ok')}</div>`).join('')}</div>
  <div class="row"><button class="btn" data-act="retryWrongResult" ${wrong.length ? '' : 'disabled'}>Retry the ${wrong.length} I got wrong</button><a class="btn quiet" href="#/part1/stats">See all progress</a><a class="btn quiet" href="#/part1">New set</a></div>
  <h2>Review answers</h2>
  <div class="proc-list">${items.map((id, i) => { const q = QI[id], a = r.ans[id], ok = a === q.a; return `<details class="proc"><summary><span class="t">${i + 1}. ${esc(q.q)}</span><span class="tag" style="color:var(${ok ? '--ok' : '--bad'})">${ok ? 'Right' : a === undefined ? 'Unanswered' : 'Wrong'}</span></summary><div class="proc-body">${qReviewHTML(q, a)}</div></details>`; }).join('')}</div>`;
}
function qReviewHTML(q, a) {
  return `<ol type="A" style="padding-left:20px">${q.o.map((o, i) => `<li style="${i === q.a ? 'color:var(--ok);font-weight:600' : i === a ? 'color:var(--bad);text-decoration:line-through' : ''}">${esc(o)}</li>`).join('')}</ol>${explainHTML(q, a)}
  <div class="row" style="margin-top:8px"><button class="flag ${S.flags[q.id] ? 'on' : ''}" data-flagid="${q.id}">${S.flags[q.id] ? 'Flagged' : 'Flag'}</button><span class="muted">${esc(q.set)} · Q${q.n}</span></div>`;
}
function viewStats() {
  const d = domStats();
  const recs = Object.values(S.mcq);
  const seen = recs.length, right = recs.reduce((s, r) => s + r.last, 0);
  const att = recs.reduce((s, r) => s + r.n, 0), attC = recs.reduce((s, r) => s + r.c, 0);
  const mocks = S.sessions.filter(x => x.mode === 'mock');
  const kws = keywordStats().slice(0, 15);
  const reads = readingList().slice(0, 12);
  if (!seen) return `<div class="empty"><p>No answers yet. Your accuracy by domain, weak keywords and a reading list built from your mistakes will appear here.</p><a class="btn" href="#/part1">Start practising</a></div>`;
  return `
  <div class="kpis">
    <div class="kpi"><b>${seen}</b><span>of ${Q.length} questions seen (${pct(seen, Q.length)}%)</span></div>
    <div class="kpi"><b>${pct(right, seen)}%</b><span>right on the latest attempt</span></div>
    <div class="kpi"><b>${pct(attC, att)}%</b><span>accuracy over all ${att} attempts</span></div>
    <div class="kpi"><b>${dueIds().length}</b><span>due for spaced review today</span></div>
    <div class="kpi"><b>${mocks.length ? Math.max(...mocks.map(m => pct(m.c, m.n))) + '%' : '–'}</b><span>best mock exam score (${mocks.length} taken)</span></div>
  </div>
  <div class="grid g2">
    <section class="panel"><h3>Mastery by domain</h3>
      <div class="legend" style="margin-bottom:12px"><span><i style="background:var(--ok)"></i>right last time</span><span><i style="background:var(--bad)"></i>wrong last time</span><span><i style="background:var(--sunk)"></i>not seen</span></div>
      <div class="dombars">${DOMS.map(k => { const s = d[k]; return `<div class="dombar"><div class="spread"><span>${esc(G_DOM(k))}</span><span class="muted">${s.seen ? Math.round(s.mastery * 100) + '% right' : 'not started'} · ${s.seen}/${s.total}</span></div>
        <div class="stack" role="img" aria-label="${s.right} right, ${s.seen - s.right} wrong, ${s.total - s.seen} unseen"><i class="s-ok" style="width:${100 * s.right / s.total}%"></i><i class="s-bad" style="width:${100 * (s.seen - s.right) / s.total}%"></i></div>
        <div class="row" style="margin-top:6px"><button class="linkish" data-act="drillDomain" data-dom="${k}">Drill 20 from this domain</button></div></div>`; }).join('')}</div>
    </section>
    <section class="panel chart"><h3>Score per session</h3>${trendSVG(S.sessions.slice(-25))}<p class="muted" style="margin-top:8px">Last ${Math.min(25, S.sessions.length)} sets. Mock exams are the larger dots.</p></section>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <section class="panel"><h3>Weakest topics</h3><p class="muted">Revision keywords you have seen at least twice, lowest score first.</p>
      ${kws.length ? `<table><thead><tr><th>Keyword</th><th>Right</th><th></th></tr></thead><tbody>${kws.map(k => `<tr><td>${esc(k.k)}</td><td>${k.right}/${k.seen}</td><td><button class="linkish" data-act="drillIds" data-ids="${k.ids.join(',')}" data-label="Topic · ${esc(k.k)}">Drill</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">Answer a few more questions to see topic-level weak spots.</p>'}
    </section>
    <section class="panel"><h3>Your reading list</h3><p class="muted">Chapters referenced by questions you got wrong last time. Read the top ones, then retry.</p>
      ${reads.length ? `<table><thead><tr><th>Reference</th><th>Misses</th><th></th></tr></thead><tbody>${reads.map(r => `<tr><td>${esc(r.ref)}</td><td>${r.ids.length}</td><td><button class="linkish" data-act="drillIds" data-ids="${r.ids.join(',')}" data-label="Retry · ${esc(r.ref)}">Retry</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">No misses yet.</p>'}
    </section>
  </div>
  ${mocks.length ? `<section class="panel" style="margin-top:16px"><h3>Mock exam history</h3><table><thead><tr><th>Date</th><th>Score</th>${DOMS.map(k => `<th>${esc(DOM_SHORT[k])}</th>`).join('')}<th>Time</th></tr></thead><tbody>${mocks.slice().reverse().map(m => `<tr><td>${new Date(m.ts).toLocaleDateString()}</td><td><b>${pct(m.c, m.n)}%</b></td>${DOMS.map(k => `<td>${m.dom[k] ? pct(...m.dom[k]) + '%' : '–'}</td>`).join('')}<td>${Math.round(m.dur / 60)} min</td></tr>`).join('')}</tbody></table></section>` : ''}`;
}
function trendSVG(ss) {
  if (ss.length < 2) return '<p class="muted">Complete two or more sets to see a trend.</p>';
  const W = 520, H = 200, px = 34, py = 16;
  const x = i => px + (W - px - 10) * i / (ss.length - 1);
  const y = v => py + (H - py - 24) * (1 - v);
  const pts = ss.map((s, i) => [x(i), y(s.n ? s.c / s.n : 0)]);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Session scores over time">
    ${[0, .5, 1].map(v => `<line class="axis" x1="${px}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}"/><text class="lbl" x="${px - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`).join('')}
    <polyline class="ln" points="${pts.map(p => p.join(',')).join(' ')}"/>
    ${pts.map((p, i) => `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="${ss[i].mode === 'mock' ? 6 : 3.5}"><title>${esc(ss[i].label)}: ${pct(ss[i].c, ss[i].n)}% (${ss[i].c}/${ss[i].n})</title></circle>`).join('')}
  </svg>`;
}
let REVIEW_TAB = 'wrong', SEARCH = '';
function viewReview() {
  const lists = { wrong: wrongIds(), flagged: flaggedIds() };
  let ids, title;
  if (REVIEW_TAB === 'search') {
    const t = SEARCH.trim().toLowerCase();
    ids = t.length < 3 ? [] : Q.filter(q => (q.q + ' ' + q.o.join(' ') + ' ' + q.kw.join(' ') + ' ' + q.x).toLowerCase().includes(t)).map(q => q.id);
  } else ids = lists[REVIEW_TAB];
  const shown = ids.slice(0, 60);
  return `<div class="row" style="margin-bottom:16px">
    <div class="seg" role="group">${[['wrong', `Wrong last time (${lists.wrong.length})`], ['flagged', `Flagged (${lists.flagged.length})`], ['search', 'Search the bank']].map(([k, l]) => `<button type="button" class="${REVIEW_TAB === k ? 'on' : ''}" data-rtab="${k}">${l}</button>`).join('')}</div>
    ${REVIEW_TAB !== 'search' && ids.length ? `<button class="btn" data-act="drillIds" data-ids="${ids.slice(0, 100).join(',')}" data-label="${REVIEW_TAB === 'wrong' ? 'Retry mistakes' : 'Flagged questions'}">Practise ${Math.min(100, ids.length)} of these</button>` : ''}
  </div>
  ${REVIEW_TAB === 'search' ? `<label class="field" style="margin-bottom:14px"><span>Search questions, options, explanations and keywords</span><input type="search" id="qsearch" value="${esc(SEARCH)}" placeholder="for example: stellate, anisotropy, CSA" autocomplete="off"></label>${SEARCH.trim().length >= 3 ? `<p class="muted">${ids.length} matches${ids.length > 60 ? ', showing the first 60' : ''}. ${ids.length ? `<button class="linkish" data-act="drillIds" data-ids="${ids.slice(0, 100).join(',')}" data-label="Search · ${esc(SEARCH)}">Practise these</button>` : ''}</p>` : ''}` : ''}
  ${shown.length ? `<div class="proc-list">${shown.map(id => { const q = QI[id]; return `<details class="proc"><summary><span class="t">${esc(q.q)}</span><span class="tag">${esc(DOM_SHORT[q.dom])}</span></summary><div class="proc-body">${qReviewHTML(q, null)}</div></details>`; }).join('')}</div>`
    : REVIEW_TAB === 'search' ? '' : `<div class="empty">${REVIEW_TAB === 'wrong' ? 'Nothing here. Questions you get wrong land in this list until you get them right.' : 'Nothing flagged. Use Flag during a set to save a question for later.'}</div>`}`;
}

// ---------- PART 2A ----------
let P2A = { region: 'all', drawOnly: false, recall: false };
let SIM = null;
function viewPart2A(tab) {
  const head = `<h1>Part 2A · Cadaver practical</h1><p class="lede">Four ultrasound-guided procedures on a fresh cadaver, one from each draw group, 15 minutes each, scored by two examiners. Worth 60% of the final score.</p>
  ${tabs('part2a', tab || '', [['', 'Procedure guides'], ['sim', 'Station simulator'], ['scoring', 'How you are scored']])}`;
  if (tab === 'sim') return head + viewSim();
  if (tab === 'scoring') {
    return head + `<div class="prose">${blocksHTML(section('How the Examiners Score You').intro)}<h2>Part 2A practical rating criteria</h2>${blocksHTML(sub('How the Examiners Score You', 'Part 2A Practical Rating Criteria').blocks)}<h2>Exam-day strategy and common pitfalls</h2>${blocksHTML(sub('How the Examiners Score You', 'Exam-Day Strategy and Common Pitfalls').blocks)}<h2>General principles for spinal sonography</h2>${blocksHTML(section('Spine Procedures').intro)}</div>`;
  }
  const rated = G.procedures.filter(p => S.procs[p.id]?.conf);
  let list = G.procedures;
  if (P2A.region !== 'all') list = list.filter(p => p.region === P2A.region);
  if (P2A.drawOnly) list = list.filter(p => p.draw);
  const groups = ['spine', 'nerve', 'msk'].map(r => [r, list.filter(p => p.region === r)]).filter(g => g[1].length);
  const conf = [1, 2, 3, 4].map(c => G.procedures.filter(p => S.procs[p.id]?.conf === c).length);
  return head + `
  <div class="kpis">
    <div class="kpi"><b>${rated.length}/${G.procedures.length}</b><span>procedures self-rated</span></div>
    <div class="kpi"><b>${conf[3]}</b><span>rated 4: exceeds basic competence</span></div>
    <div class="kpi"><b>${conf[0] + conf[1]}</b><span>rated 1–2: needs work</span></div>
    <div class="kpi"><b>${S.sims.length}</b><span>station simulations run</span></div>
  </div>
  <div class="row" style="margin:6px 0 18px">
    <div class="seg" role="group">${[['all', 'All regions'], ['spine', 'Spine'], ['nerve', 'Nerves'], ['msk', 'MSK']].map(([k, l]) => `<button type="button" class="${P2A.region === k ? 'on' : ''}" data-p2a="region" data-val="${k}">${l}</button>`).join('')}</div>
    <label class="chk"><input type="checkbox" data-p2acheck="drawOnly" ${P2A.drawOnly ? 'checked' : ''}> Only the 20 procedures in the practical draw</label>
    <label class="chk"><input type="checkbox" data-p2acheck="recall" ${P2A.recall ? 'checked' : ''}> Recall mode: blur details until tapped</label>
  </div>
  ${groups.map(([r, ps]) => `<h2>${REGION_NAMES[r]} <small class="muted" style="font-family:var(--sans);font-size:.9rem;font-weight:400">${ps.length} procedures</small></h2><div class="proc-list">${ps.map(procHTML).join('')}</div>`).join('')}`;
}
function procHTML(p) {
  const c = S.procs[p.id]?.conf || 0;
  const F = [['target', 'Target / indication'], ['position', 'Position and transducer'], ['sonoanatomy', 'Key sonoanatomy'], ['technique', 'Technique'], ['injectate', 'Typical injectate'], ['pearls', 'Pearls and pitfalls']];
  return `<details class="proc" data-pid="${p.id}"><summary><span class="cdot c${c}" title="${c ? 'Confidence ' + c : 'Not rated'}"></span><span class="t">${esc(p.title)}</span>${p.draw ? `<span class="tag acc">Draw: ${DRAW_NAMES[p.draw]}</span>` : '<span class="tag">Written & oral outline</span>'}</summary>
    <div class="proc-body"><dl class="fields ${P2A.recall ? 'recall' : ''}">${F.map(([k, l]) => `<div><dt>${l}</dt><dd class="${P2A.recall ? 'hid' : ''}" ${P2A.recall ? 'tabindex="0" role="button" aria-label="Reveal ' + l + '"' : ''}>${esc(p[k])}</dd></div>`).join('')}
      <div><dt>Read</dt><dd>Primary: ${esc(p.primary)}. Supporting: ${esc(p.support)}.</dd></div></dl>
      <div class="row" style="margin-top:16px"><span>Your confidence on the examiner's scale:</span><span class="conf" role="group">${[1, 2, 3, 4].map(n => `<button type="button" class="c${n} ${c === n ? 'on' : ''}" data-conf="${n}" data-pid="${p.id}" aria-pressed="${c === n}" title="${['Unacceptable, potentially dangerous', 'Unacceptable but not harmful', 'Acceptable, basic competence', 'Exceeds basic competence'][n - 1]}">${n}</button>`).join('')}</span></div>
    </div></details>`;
}
function viewSim() {
  if (!SIM) {
    return `<div class="grid g2"><section class="panel"><h3>Run a full practical</h3><p>The simulator draws one procedure from each of the four groups, gives you a 5-minute planning period, then a 15-minute clock per station. Rehearse on a volunteer or model while narrating, then tick the eight checklist items you actually did and give yourself an overall 1–4.</p><button class="btn" data-act="simStart">Draw four stations</button></section>
    <section class="panel"><h3>Draw groups</h3>${Object.entries(DRAW_NAMES).map(([k, n]) => `<p><b>${n}</b><br><small>${G.procedures.filter(p => p.draw === k).map(p => esc(p.title)).join('; ')}</small></p>`).join('')}</section></div>
    ${S.sims.length ? `<h2>Past simulations</h2><table><thead><tr><th>Date</th>${Object.values(DRAW_NAMES).map(n => `<th>${n}</th>`).join('')}</tr></thead><tbody>${S.sims.slice().reverse().slice(0, 20).map(s => `<tr><td>${new Date(s.ts).toLocaleDateString()}</td>${s.stations.map(st => `<td>${esc(PROC[st.pid].title)}<br><small>${st.checks.filter(Boolean).length}/8 checklist · rated ${st.rating || '–'}</small></td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}`;
  }
  if (SIM.phase === 'plan') {
    return `<section class="panel station"><div class="spread"><h2 style="margin:0">Planning period</h2><span class="timer" id="simtimer"></span></div>
    <p>Plan the order of your four procedures so the cadaver is turned as little as possible.</p>
    <ol>${SIM.stations.map(s => `<li><b>${esc(PROC[s.pid].title)}</b> <span class="muted">(${DRAW_NAMES[PROC[s.pid].draw]})</span></li>`).join('')}</ol>
    <div class="row"><button class="btn" data-act="simNext">Start station 1</button><button class="btn quiet" data-act="simQuit">Cancel</button></div></section>`;
  }
  const st = SIM.stations[SIM.i], p = PROC[st.pid];
  return `<section class="panel station">
    <div class="spread"><div><small class="muted">Station ${SIM.i + 1} of 4 · ${DRAW_NAMES[p.draw]}</small><h2 style="margin:4px 0 0">${esc(p.title)}</h2></div><span class="timer" id="simtimer"></span></div>
    <details class="proc" style="margin:14px 0"><summary><span class="t">Show the procedure guide (try without it first)</span></summary><div class="proc-body"><dl class="fields">${[['target', 'Target / indication'], ['position', 'Position and transducer'], ['sonoanatomy', 'Key sonoanatomy'], ['technique', 'Technique'], ['injectate', 'Typical injectate'], ['pearls', 'Pearls and pitfalls']].map(([k, l]) => `<div><dt>${l}</dt><dd>${esc(p[k])}</dd></div>`).join('')}</dl></div></details>
    <h3>Examiner checklist: tick what you actually did</h3>
    ${CHECK8.map((c, i) => `<label class="chk"><input type="checkbox" data-simck="${i}" ${st.checks[i] ? 'checked' : ''}> ${i + 1}. ${esc(c)}</label>`).join('')}
    <div class="row" style="margin-top:14px"><span>Overall rating:</span><span class="conf" role="group">${[1, 2, 3, 4].map(n => `<button type="button" class="c${n} ${st.rating === n ? 'on' : ''}" data-simrate="${n}" aria-pressed="${st.rating === n}">${n}</button>`).join('')}</span></div>
    <p class="muted" style="margin-top:8px">4 flawless · 3 minor errors only · 2 major errors, not harmful · 1 dangerous errors</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="simNext">${SIM.i === 3 ? 'Finish and save' : 'Next station'}</button><button class="btn quiet" data-act="simQuit">Abandon</button></div>
  </section>`;
}
function simTick() {
  const el = $('#simtimer'); if (!el || !SIM) return;
  const lim = SIM.phase === 'plan' ? 300 : 900;
  const left = lim - Math.floor((Date.now() - SIM.t0) / 1000);
  const a = Math.abs(left);
  el.textContent = `${left < 0 ? 'Over by ' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}${left >= 0 ? ' left' : ''}`;
  el.classList.toggle('low', left < 120);
}

// ---------- PART 2B ----------
let RUN = null; // {n, step, answers[], scores[], show[], t0}
function viewPart2B(tab, arg) {
  if (tab === 'case') return viewCase(+arg);
  const head = `<h1>Part 2B · Modified oral</h1><p class="lede">One extended vignette: 5 minutes to read, then up to 30 minutes of questions in a fixed nine-area sequence, with a physical and ultrasound exam on a live model. Worth 20% of the final score.</p>
  ${tabs('part2b', tab || '', [['', 'Mock cases'], ['scoring', 'How you are scored']])}`;
  if (tab === 'scoring') {
    return head + `<div class="prose"><h2>Part 2B oral rating criteria</h2>${blocksHTML(sub('How the Examiners Score You', 'Part 2B Oral Rating Criteria').blocks)}
    <h2>Ultrasound examination checklist</h2><p class="muted">The 12 items the examiners tick. Use it as a drill: say each one aloud as you scan.</p><ol class="ckl">${US12.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
  }
  const areas = oralAreaAverages();
  const scored = areas.filter(a => a.avg !== null);
  return head + `
  <div class="grid g3">${G.cases.map(c => { const b = caseBest(c.n); const runs = S.cases[c.n]?.runs?.length || 0; return `<a class="casecard" href="#/part2b/case/${c.n}"><span class="n">Case ${c.n}</span><b>${esc(c.title)}</b><small class="muted">${runs ? `Best ${b.toFixed(1)} / 4 · ${runs} run${runs > 1 ? 's' : ''}` : 'Not rehearsed yet'}</small>${runs ? bar((b - 1) / 3, b < 2.5 ? 'bad' : b < 3 ? 'warn' : 'ok') : ''}</a>`; }).join('')}</div>
  <div class="grid g2" style="margin-top:24px">
    <section class="panel"><h3>Score by question area</h3><p class="muted">Average of your self-scores on the latest run of each case.</p>
      ${scored.length ? `<div class="dombars">${areas.map(a => `<div class="dombar"><div class="spread"><span>Q${a.i + 1} ${esc(a.name)}</span><span class="muted">${a.avg === null ? '–' : a.avg.toFixed(1) + ' / 4'}</span></div>${bar(a.avg === null ? 0 : (a.avg - 1) / 3, a.avg !== null && a.avg < 2.5 ? 'bad' : a.avg !== null && a.avg < 3 ? 'warn' : 'ok')}</div>`).join('')}</div>` : '<p class="muted">Run a case to see which of the nine areas costs you marks.</p>'}
    </section>
    <section class="panel"><h3>The 16 official oral topics</h3><table><thead><tr><th>Topic</th><th>Rehearse with</th></tr></thead><tbody>${G.oralTopics.map(([t, n, fw, read]) => `<tr><td>${esc(t)}<br><small class="muted">${esc(read)}</small></td><td><a href="#/part2b/case/${n}">Case ${n}</a>${fw ? '<br><small class="muted">as a framework</small>' : ''}</td></tr>`).join('')}</tbody></table></section>
  </div>`;
}
function viewCase(n) {
  const c = G.cases.find(x => x.n === n);
  if (!c) return `<div class="empty">Case not found. <a href="#/part2b">All cases</a></div>`;
  if (!RUN || RUN.n !== n) {
    const prev = S.cases[n]?.notes || [];
    RUN = { n, step: -1, answers: prev.slice(), scores: Array(9).fill(0), show: Array(9).fill(false), t0: Date.now() };
  }
  const total = c.qs.length;
  const steps = `<div class="steps" aria-hidden="true">${[-1, ...c.qs.map((_, i) => i)].map(i => `<span class="${i < RUN.step ? 'done' : i === RUN.step ? 'cur' : ''}"></span>`).join('')}</div>`;
  const head = `<p><a href="#/part2b">All cases</a></p><div class="spread"><h1>Case ${c.n} · ${esc(c.title)}</h1>${RUN.step === -1 ? '<span class="timer" id="casetimer"></span>' : ''}</div>${steps}`;
  if (RUN.step === -1) {
    return head + `<p class="muted">Candidate case study: review for up to 5 minutes, as on the day.</p><div class="vignette">${esc(c.vignette)}</div>
      <div class="row" style="margin-top:18px"><button class="btn" data-act="caseNext">Start the examiner questions</button><button class="btn quiet" data-act="caseAll">Show all model answers</button></div>`;
  }
  if (RUN.step === 'all') {
    return head + `<div class="vignette">${esc(c.vignette)}</div>${c.qs.map((q, i) => `<div class="oq"><h3>Q${i + 1}. ${esc(q.q)}</h3><div class="model">${esc(q.a)}</div></div>`).join('')}<a class="btn" href="#/part2b" data-act="caseReset">Back to cases</a>`;
  }
  if (RUN.step >= total) {
    const sc = RUN.scores, a = avg(sc.filter(Boolean));
    return head + `<h2>Case summary: ${a ? a.toFixed(1) : '–'} / 4</h2>
      <table><thead><tr><th>Question area</th><th>Your score</th></tr></thead><tbody>${c.qs.map((q, i) => `<tr><td>Q${i + 1}. ${esc(ORAL_Q[i] || q.q)}</td><td style="color:var(${sc[i] >= 3 ? '--ok' : sc[i] ? '--bad' : '--muted'})">${sc[i] || 'not scored'}</td></tr>`).join('')}</tbody></table>
      <div class="row" style="margin-top:16px"><a class="btn" href="#/part2b" data-act="caseReset">Back to all cases</a><button class="btn quiet" data-act="caseRestart">Run this case again</button></div>`;
  }
  const i = RUN.step, q = c.qs[i];
  return head + `
    <details class="proc"><summary><span class="t">Vignette</span></summary><div class="proc-body"><p>${esc(c.vignette)}</p></div></details>
    <div class="oq"><small class="muted">Question ${i + 1} of ${total} · ${esc(ORAL_Q[i] || '')}</small><h3>${esc(q.q)}</h3>
      <label class="field"><span>Your answer, out loud or typed (notes stay on this device)</span><textarea data-ans="${i}" rows="5">${esc(RUN.answers[i] || '')}</textarea></label>
      ${RUN.show[i] ? `<div class="model"><b>Model answer</b><p style="margin:6px 0 0">${esc(q.a)}</p></div>
        <div class="row" style="margin-top:14px"><span>Score yourself:</span><span class="conf" role="group">${[1, 2, 3, 4].map(n2 => `<button type="button" class="c${n2} ${RUN.scores[i] === n2 ? 'on' : ''}" data-oscore="${n2}" aria-pressed="${RUN.scores[i] === n2}" title="${['Gaps that could lead to dangerous care', 'Incomplete, not harmful', 'Acceptable, basic competence', 'Accurate, complete, current practice'][n2 - 1]}">${n2}</button>`).join('')}</span></div>`
        : `<button class="btn ghost" data-act="caseShow" style="margin-top:12px">Show model answer</button>`}
    </div>
    <div class="qnav"><div>${i > 0 ? '<button class="btn quiet" data-act="casePrev">Previous</button>' : ''}</div><button class="btn" data-act="caseNext" ${RUN.show[i] && !RUN.scores[i] ? 'disabled title="Score yourself first"' : ''}>${i === total - 1 ? 'Finish case' : 'Next question'}</button></div>`;
}
function caseTick() {
  const el = $('#casetimer'); if (!el || !RUN) return;
  const left = 300 - Math.floor((Date.now() - RUN.t0) / 1000), a = Math.abs(left);
  el.textContent = left >= 0 ? `${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')} reading time` : 'Reading time is over';
  el.classList.toggle('low', left < 60);
}

// ---------- PLAN & DATA ----------
function viewPlan() {
  const done = G.weeks.filter(w => S.plan[w.n]).length;
  return `<h1>12-week reading plan</h1><p class="lede">Each week pairs book chapters with a scanning drill and a self-test. Tick a week when it is done. Book codes are listed under Part 1 → Theory notes.</p>
  <div class="spread" style="margin:14px 0 4px"><span>${done} of 12 weeks done</span></div>${bar(done / 12)}
  <div style="margin-top:12px">${G.weeks.map(w => `<div class="week ${S.plan[w.n] ? 'done' : ''}"><input type="checkbox" data-week="${w.n}" ${S.plan[w.n] ? 'checked' : ''} aria-label="Mark week ${w.n} done"><div><h3>Week ${w.n}: ${esc(w.title)}</h3><p><b>Read</b> ${esc(w.read)}</p><p><b>Scan</b> ${esc(w.scan)}</p><p><b>Test</b> ${esc(w.test)}</p></div></div>`).join('')}</div>`;
}
function viewData() {
  const size = (localStorage.getItem(KEY) || '').length;
  return `<h1>Backup &amp; reset</h1><p class="lede">Your progress is stored in this browser only (${(size / 1024).toFixed(1)} KB). Export a backup to move it to another device or browser.</p>
  <div class="grid g3">
    <section class="panel"><h3>Export</h3><p class="muted">Download all answers, flags, ratings and case scores as a JSON file.</p><button class="btn" data-act="export">Download backup</button></section>
    <section class="panel"><h3>Import</h3><p class="muted">Load a backup file. This replaces the progress in this browser.</p><input type="file" accept="application/json,.json" id="importFile"></section>
    <section class="panel"><h3>Reset</h3><p class="muted">Erase all progress in this browser. This cannot be undone.</p><button class="btn quiet" data-act="reset" style="color:var(--bad);border-color:var(--bad)">Erase progress</button></section>
  </div>`;
}

// ---------- events ----------
function bind(root) {
  clearInterval(timerHandle);
  if ($('#timer')) { quizTick(); timerHandle = setInterval(quizTick, 1000); }
  if ($('#simtimer')) { simTick(); timerHandle = setInterval(simTick, 1000); }
  if ($('#casetimer')) { caseTick(); timerHandle = setInterval(caseTick, 1000); }
  const qs = $('#qsearch', root);
  if (qs) {
    qs.focus(); qs.setSelectionRange(qs.value.length, qs.value.length);
    let t; qs.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { SEARCH = qs.value; rerender(); }, 250); });
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-act], dd.hid');
  if (!t) return;
  const d = t.dataset;
  if (t.matches('dd.hid')) { t.classList.remove('hid'); return; }
  // quiz options
  if (d.opt !== undefined && SESSION) {
    const id = SESSION.ids[SESSION.i];
    if (SESSION.instant && SESSION.checked[id]) return;
    SESSION.ans[id] = +d.opt; saveSession(); rerender(); return;
  }
  if (d.goto !== undefined && SESSION) { SESSION.i = +d.goto; saveSession(); rerender(); return; }
  if (d.cfg) { P1CFG[d.cfg] = d.cfg === 'count' ? +d.val : d.val; rerender(); return; }
  if (d.rtab) { REVIEW_TAB = d.rtab; rerender(); return; }
  if (d.flagid) { S.flags[d.flagid] ? delete S.flags[d.flagid] : S.flags[d.flagid] = 1; save(); t.classList.toggle('on'); t.textContent = S.flags[d.flagid] ? 'Flagged' : 'Flag'; return; }
  if (d.conf) { (S.procs[d.pid] = S.procs[d.pid] || {}).conf = +d.conf; S.procs[d.pid].t = Date.now(); save(); const open = t.closest('details'); rerender(); const el = $(`details[data-pid="${d.pid}"]`); if (el && open) el.open = true; return; }
  if (d.p2a) { P2A[d.p2a] = d.val; rerender(); return; }
  if (d.simrate) { SIM.stations[SIM.i].rating = +d.simrate; rerender(); return; }
  if (d.oscore) { RUN.scores[RUN.step] = +d.oscore; rerender(); return; }
  const act = d.act; if (!act) return;
  const A = {
    startPractice, mock: () => { if (!SESSION || confirm('Replace your unfinished set with a new mock exam?')) startMock(); }, smart: startSmart,
    drillWrong: () => startSession(shuffle(wrongIds()).slice(0, 30), 'practice', 'Retry mistakes'),
    drillFlagged: () => startSession(shuffle(flaggedIds()), 'practice', 'Flagged questions'),
    drillDomain: () => { const k = d.dom; const unseen = shuffle(Q.filter(q => q.dom === k && !S.mcq[q.id])); const wr = shuffle(Q.filter(q => q.dom === k && S.mcq[q.id]?.last === 0)); const rest = shuffle(Q.filter(q => q.dom === k)); startSession([...new Set([...wr.slice(0, 8), ...unseen, ...rest].map(q => q.id))].slice(0, 20), 'practice', `Drill · ${DOM_SHORT[k]}`); },
    drillIds: () => startSession(shuffle(d.ids.split(',').filter(x => QI[x])), 'practice', d.label || 'Practice'),
    retryWrongResult: () => { const r = LAST_RESULT; startSession(r.ids.filter(id => r.ans[id] !== QI[id].a), 'practice', 'Retry wrong answers'); },
    discardSession: () => { SESSION = null; saveSession(); rerender(); },
    flag: () => { const id = SESSION.ids[SESSION.i]; S.flags[id] ? delete S.flags[id] : S.flags[id] = 1; save(); rerender(); },
    check: () => { const s = SESSION, id = s.ids[s.i]; if (s.ans[id] === undefined) return; s.checked[id] = true; record(id, s.ans[id] === QI[id].a); save(); saveSession(); rerender(); },
    next: () => { if (SESSION.i < SESSION.ids.length - 1) { SESSION.i++; saveSession(); rerender(); window.scrollTo(0, 0); } },
    prev: () => { if (SESSION.i > 0) { SESSION.i--; saveSession(); rerender(); } },
    finish: () => {
      const s = SESSION; const left = s.ids.length - Object.keys(s.ans).length;
      if (s.mode === 'mock' && left && !confirm(`${left} questions are unanswered and will count as wrong. Submit anyway?`)) return;
      finishSession();
    },
    simStart: () => { SIM = { phase: 'plan', i: 0, t0: Date.now(), stations: Object.keys(DRAW_NAMES).map(k => { const ps = G.procedures.filter(p => p.draw === k); return { pid: ps[Math.floor(Math.random() * ps.length)].id, checks: Array(8).fill(false), rating: 0 }; }) }; rerender(); },
    simNext: () => {
      if (SIM.phase === 'plan') { SIM.phase = 'run'; SIM.i = 0; SIM.t0 = Date.now(); rerender(); return; }
      SIM.stations[SIM.i].secs = Math.round((Date.now() - SIM.t0) / 1000);
      if (SIM.i < 3) { SIM.i++; SIM.t0 = Date.now(); rerender(); window.scrollTo(0, 0); return; }
      S.sims.push({ ts: Date.now(), stations: SIM.stations });
      SIM.stations.forEach(st => { if (st.rating) { (S.procs[st.pid] = S.procs[st.pid] || {}).conf = st.rating; S.procs[st.pid].t = Date.now(); } });
      save(); SIM = null; toast('Simulation saved. Station ratings updated your procedure confidence.'); rerender();
    },
    simQuit: () => { if (confirm('Abandon this simulation? Nothing will be saved.')) { SIM = null; rerender(); } },
    caseNext: () => { RUN.step = RUN.step === -1 ? 0 : RUN.step + 1; if (RUN.step >= G.cases.find(c => c.n === RUN.n).qs.length) saveCase(); rerender(); window.scrollTo(0, 0); },
    casePrev: () => { RUN.step--; rerender(); },
    caseShow: () => { RUN.show[RUN.step] = true; rerender(); },
    caseAll: () => { RUN.step = 'all'; rerender(); },
    caseRestart: () => { RUN = null; rerender(); },
    caseReset: () => { RUN = null; },
    export: () => { const blob = new Blob([JSON.stringify({ app: 'cips-exam-hub', v: 1, exported: new Date().toISOString(), data: S }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cips-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); },
    reset: () => { if (confirm('Erase all progress in this browser?')) { S = defaults(); save(); SESSION = null; saveSession(); toast('Progress erased.'); applyTheme(); rerender(); } },
  };
  if (A[act]) { if (act !== 'caseReset') e.preventDefault(); A[act](); }
});
function saveCase() {
  const c = S.cases[RUN.n] || (S.cases[RUN.n] = { runs: [] });
  c.runs.push({ ts: Date.now(), scores: RUN.scores.slice() });
  c.notes = RUN.answers.slice();
  save();
}
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  if (d.dom && t.type === 'checkbox') { P1CFG.doms = t.checked ? [...new Set([...P1CFG.doms, d.dom])] : P1CFG.doms.filter(x => x !== d.dom); rerender(); }
  else if (d.cfgsel) { P1CFG[d.cfgsel] = t.value; rerender(); }
  else if (d.p2acheck) { P2A[d.p2acheck] = t.checked; rerender(); }
  else if (d.simck !== undefined) { SIM.stations[SIM.i].checks[+d.simck] = t.checked; }
  else if (d.week) { S.plan[d.week] = t.checked; if (!t.checked) delete S.plan[d.week]; save(); rerender(); }
  else if (t.id === 'importFile' && t.files[0]) {
    t.files[0].text().then(txt => { const j = JSON.parse(txt); const data = j.data || j; if (!data.mcq) throw new Error('bad'); S = Object.assign(defaults(), data); save(); applyTheme(); toast('Backup imported.'); rerender(); })
      .catch(() => toast('That file is not a CIPS Exam Hub backup.'));
  }
});
document.addEventListener('input', e => { const d = e.target.dataset; if (d.ans !== undefined && RUN) { RUN.answers[+d.ans] = e.target.value; const c = S.cases[RUN.n] || (S.cases[RUN.n] = { runs: [] }); c.notes = RUN.answers.slice(); save(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('dd.hid')) { e.target.classList.remove('hid'); return; }
  if (!location.hash.startsWith('#/part1/quiz') || !SESSION) return;
  if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const id = SESSION.ids[SESSION.i];
  const locked = SESSION.instant && SESSION.checked[id];
  const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if (idx >= 0 && !locked) { SESSION.ans[id] = idx; saveSession(); rerender(); e.preventDefault(); }
  else if (k === 'f') { $('[data-act="flag"]')?.click(); }
  else if (k === 'arrowright') { $('[data-act="next"]')?.click(); }
  else if (k === 'arrowleft') { $('[data-act="prev"]')?.click(); }
  else if (k === 'enter' && !e.target.matches('button, a')) { const b = $('.qnav [data-act="check"]:not([disabled])') || $('.qnav [data-act="next"]') || $('.qnav .row:last-child [data-act="finish"]'); b?.click(); e.preventDefault(); }
});

// ---------- boot ----------
applyTheme();
Promise.all([fetch('data/mcq.json').then(r => r.json()), fetch('data/guide.json').then(r => r.json())])
  .then(([m, g]) => {
    Q = m.questions; DATA_DOMAINS = m.domains; G = g;
    Q.forEach(q => QI[q.id] = q);
    G.procedures.forEach(p => PROC[p.id] = p);
    route.focus = false;
    window.addEventListener('hashchange', route);
    route();
  })
  .catch(err => { $('#main').innerHTML = `<div class="empty"><p>The question bank could not be loaded (${esc(err.message)}). If you opened index.html straight from disk, serve the folder over http instead, for example with <code>python3 -m http.server</code>.</p></div>`; });
})();
