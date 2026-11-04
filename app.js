import { scenarios } from './scenarios.js';
import { createGame, inspectEvidence, applyAction, getAvailableActions, getReport, validateGameState } from './simulation.js';

const SAVE_KEY = 'deadlock-manor:shift:v1';
const scenarioList = Object.values(scenarios);
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const pad = (value) => String(value).padStart(2, '0');
const metricDefinitions = [
  { key: 'availability', name: 'Service availability', unit: '%', target: 'Higher is healthier', direction: 1, healthy: (n) => n >= 99, critical: (n) => n < 92 },
  { key: 'errorRate', name: 'Request error rate', unit: '%', target: 'Lower is healthier', direction: -1, healthy: (n) => n <= 2, critical: (n) => n >= 10 },
  { key: 'latencyMs', name: 'Response latency', unit: 'ms', target: 'Lower is healthier', direction: -1, healthy: (n) => n <= 350, critical: (n) => n >= 1200 },
  { key: 'saturation', name: 'Resource saturation', unit: '%', target: 'Lower is healthier', direction: -1, healthy: (n) => n <= 70, critical: (n) => n >= 90 },
];
let state;
let pendingScenarioId = null;
let storageAvailable = true;
let restored = false;
let lastEvidenceId = null;

function loadSavedGame() {
  let raw;
  try { raw = localStorage.getItem(SAVE_KEY); }
  catch { storageAvailable = false; return null; }
  if (!raw) return null;
  let saved;
  try { saved = JSON.parse(raw); }
  catch { saved = null; }
  if (!saved || !validateGameState(saved)) {
    try { localStorage.removeItem(SAVE_KEY); }
    catch { storageAvailable = false; }
    return null;
  }
  restored = true;
  return saved;
}

function saveGame() {
  if (!storageAvailable) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch {
    storageAvailable = false;
    notice('This browser could not save your shift. The game still works; download your case report before leaving.');
  }
}

function notice(message = '', error = false) {
  const target = $('#live-notice');
  target.textContent = message;
  target.classList.toggle('error', error);
}

function currentScenario() { return scenarios[state.scenarioId]; }

function startGame(id) {
  state = createGame(id);
  $('#resume-message').hidden = true;
  notice();
  saveGame();
  render();
}

function requestNewGame(id) {
  if (state.history.length || state.turn > 0) {
    pendingScenarioId = id;
    $('#confirm-dialog').showModal();
  } else {
    startGame(id);
  }
}

function renderScenarios() {
  $('#scenario-options').innerHTML = scenarioList.map((scenario, index) => `
    <button type="button" class="scenario-option" data-scenario="${esc(scenario.id)}" aria-pressed="${scenario.id === state.scenarioId}">
      <span class="case-number">${pad(index + 1)}</span>
      <span><strong>${esc(scenario.title)}</strong><small>${esc(scenario.difficulty || 'INCIDENT SIMULATION')}</small></span>
    </button>`).join('');
  $('#scenario-options').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.scenario !== state.scenarioId) requestNewGame(button.dataset.scenario);
  }));
}

function metricTone(definition, value) {
  const threshold = currentScenario().successThresholds[definition.key];
  const healthy = definition.direction > 0 ? value >= threshold : value <= threshold;
  return healthy ? 'good' : definition.critical(value) ? 'bad' : 'warning';
}

function formatMetric(value, key) {
  if (key === 'latencyMs') return Math.round(value).toLocaleString('en-US');
  return Number(value).toFixed(1).replace(/\.0$/, '');
}

function metricHistory(key) {
  const actions = state.history.filter((entry) => entry.type === 'action');
  return [currentScenario().initialMetrics[key], ...actions.map((entry) => entry.metricsAfter[key])].slice(-8);
}

function sparkline(key, tone) {
  const values = metricHistory(key);
  if (values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 70 + 1},${24 - ((value - min) / range) * 21}`).join(' ');
  const color = tone === 'good' ? '#c3e785' : tone === 'bad' ? '#de8b74' : '#dcb16c';
  return `<svg class="sparkline" viewBox="0 0 72 27" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="1.5" points="${points}" /></svg>`;
}

function renderMetrics() {
  const lastAction = [...state.history].reverse().find((entry) => entry.type === 'action');
  $('#metrics-grid').innerHTML = metricDefinitions.map((definition) => {
    const value = state.metrics[definition.key];
    const previous = lastAction?.metricsBefore[definition.key];
    const delta = previous === undefined ? 0 : value - previous;
    const improved = delta * definition.direction > 0;
    const tone = metricTone(definition, value);
    const deltaText = previous === undefined ? 'BASELINE' : delta === 0 ? 'NO CHANGE' : `${delta > 0 ? '+' : '−'}${formatMetric(Math.abs(delta), definition.key)}${definition.unit === '%' ? ' pp' : ' ms'}`;
    return `<article class="metric-card ${tone}">
      <div class="metric-top"><span class="metric-label">${definition.name}</span><i class="metric-signal" aria-label="${tone === 'good' ? 'Healthy' : tone === 'bad' ? 'Critical' : 'Degraded'}"></i></div>
      <div class="metric-main"><span class="metric-value">${formatMetric(value, definition.key)}</span><span class="metric-unit">${definition.unit}</span></div>
      ${sparkline(definition.key, tone)}
      <div class="metric-bottom"><span class="metric-target">${definition.direction > 0 ? 'TARGET ≥' : 'TARGET ≤'} ${currentScenario().successThresholds[definition.key]}${definition.unit}</span><span class="metric-delta ${delta ? (improved ? 'improved' : 'worsened') : ''}">${deltaText}</span></div>
    </article>`;
  }).join('');
}

function renderMap() {
  const colors = { good: '#c3e785', warning: '#dcb16c', bad: '#de8b74' };
  const tones = metricDefinitions.map((definition) => metricTone(definition, state.metrics[definition.key]));
  const overall = state.phase === 'resolved' ? 'HEALTHY' : tones.includes('bad') ? 'CRITICAL' : 'DEGRADED';
  $('#map-health').textContent = overall;
  $('#map-health').parentElement.style.color = overall === 'HEALTHY' ? colors.good : overall === 'CRITICAL' ? colors.bad : colors.warning;
  const nodes = [
    { x: 80, y: 111, line: 'M146 111H211', label: 'GATEWAY', detail: 'Guest entrance', tone: tones[0], icon: '◇' },
    { x: 550, y: 111, line: 'M484 111H419', label: 'WORKERS', detail: 'East wing', tone: tones[1], icon: '⌘' },
    { x: 80, y: 218, line: 'M146 218H239V203', label: 'DATABASE', detail: 'The crypt', tone: tones[3], icon: '≡' },
    { x: 550, y: 218, line: 'M484 218H391V203', label: 'QUEUE', detail: 'The attic', tone: tones[2], icon: '↔' },
  ];
  const windows = [[257, 103], [303, 103], [349, 103], [257, 147], [303, 147], [349, 147]];
  $('#manor-map').innerHTML = `<svg viewBox="0 0 630 290" role="img" aria-labelledby="map-svg-title map-svg-description">
    <title id="map-svg-title">Deadlock Manor service topology</title><desc id="map-svg-description">Gateway is ${tones[0]}, workers are ${tones[1]}, database is ${tones[3]}, and queue is ${tones[2]}. This illustrative map follows service metrics rather than a diagnosis.</desc>
    <defs><pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#536647" opacity=".3"/></pattern><linearGradient id="house-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#293823"/><stop offset="1" stop-color="#16231a"/></linearGradient></defs>
    <rect width="630" height="290" fill="url(#map-grid)"/><circle cx="414" cy="52" r="23" fill="#c3e785" opacity=".035"/><circle cx="416" cy="50" r="17" fill="#c3e785" opacity=".055"/>
    ${nodes.map((node) => `<path d="${node.line}" fill="none" stroke="${colors[node.tone]}" stroke-opacity=".46" stroke-dasharray="3 5"/><circle cx="${node.x < 300 ? 188 : 442}" cy="${node.y}" r="2.3" fill="${colors[node.tone]}"/>`).join('')}
    <path d="M194 224H436M204 230H426" stroke="#3d5035" stroke-width="1"/><path d="M222 218V100L248 75H382L408 100V218Z" fill="url(#house-fill)" stroke="#6a8052" stroke-width="1.2"/><path d="M208 103L247 68H383L422 103Z" fill="#24321f" stroke="#6a8052" stroke-width="1.2"/><path d="M241 72L276 100M265 70L298 101M292 69L321 101M319 69L344 101M347 70L369 101M374 71L395 101" stroke="#415638" stroke-width=".7"/>
    <path d="M294 71V43L315 23L336 43V71" fill="#1a281c" stroke="#7a925e" stroke-width="1.2"/><path d="M288 45L315 19L342 45" fill="none" stroke="#7a925e" stroke-width="1.5"/><circle cx="315" cy="53" r="9" fill="#142018" stroke="#5d754b"/><path d="M315 47V53L320 56" fill="none" stroke="#c3e785" stroke-width="1"/><path d="M237 69V51H250V69M374 69V50H388V76" fill="#283823" stroke="#60774b"/>
    <path d="M222 133H408M222 177H408" stroke="#3c5034"/><path d="M237 105V216M393 105V216" stroke="#3c5034"/>
    ${windows.map(([x, y], index) => { const color = colors[tones[index % tones.length]]; return `<path d="M${x} ${y + 20}V${y + 5}Q${x + 8} ${y - 4} ${x + 16} ${y + 5}V${y + 20}Z" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-opacity=".6" stroke-width=".8"/><path d="M${x + 8} ${y}V${y + 20}M${x} ${y + 10}H${x + 16}" stroke="${color}" stroke-opacity=".35" stroke-width=".7"/>`; }).join('')}
    <path d="M300 218V194Q315 174 330 194V218" fill="#101a12" stroke="#78955b"/><path d="M315 185V217" stroke="#78955b" stroke-width=".7"/><circle cx="310" cy="205" r="1" fill="#c3e785"/><circle cx="320" cy="205" r="1" fill="#c3e785"/>
    <text x="315" y="251" text-anchor="middle" fill="#819773" font-family="monospace" font-size="7.5" letter-spacing="2.2">DEADLOCK MANOR</text><text x="315" y="266" text-anchor="middle" fill="#536b49" font-family="monospace" font-size="6">DEPENDENCIES CAN BE HAUNTING</text>
    ${nodes.map((node) => `<g><rect x="${node.x - 66}" y="${node.y - 27}" width="132" height="54" rx="3" fill="#152219" stroke="${colors[node.tone]}" stroke-opacity=".35"/><rect x="${node.x - 54}" y="${node.y - 12}" width="25" height="25" rx="3" fill="${colors[node.tone]}" fill-opacity=".055" stroke="${colors[node.tone]}" stroke-opacity=".25"/><text x="${node.x - 41.5}" y="${node.y + 5}" text-anchor="middle" font-size="17" fill="${colors[node.tone]}" font-family="monospace">${node.icon}</text><text x="${node.x - 20}" y="${node.y - 2}" fill="#c4ceba" font-family="monospace" font-size="7.5" letter-spacing=".5">${node.label}</text><text x="${node.x - 20}" y="${node.y + 11}" fill="#819377" font-family="sans-serif" font-size="7">${node.detail}</text><circle cx="${node.x + 55}" cy="${node.y - 16}" r="2" fill="${colors[node.tone]}"/></g>`).join('')}
    <path d="M436 37q5-5 9 0q5-5 9 0q-5-1-9 5q-4-6-9-5M181 59q4-4 7 0q4-4 7 0q-4-1-7 4q-3-5-7-4" fill="#506346" opacity=".6"/>
  </svg>`;
}

function renderEvidence() {
  const evidence = currentScenario().evidence;
  $('#evidence-count').textContent = `${state.evidenceRead.length} / ${evidence.length} clues read`;
  $('#evidence-list').innerHTML = evidence.map((item) => {
    const read = state.evidenceRead.includes(item.id);
    const icon = item.type?.toLowerCase().includes('metric') ? '⌁' : item.type?.toLowerCase().includes('log') ? '≡' : '⌑';
    return `<button class="evidence-card ${read ? 'is-read' : ''}" type="button" data-evidence="${esc(item.id)}" ${state.phase !== 'active' ? 'disabled' : ''}>
      <span class="evidence-icon" aria-hidden="true">${read ? '✓' : icon}</span><span class="evidence-card-copy"><strong>${esc(item.title)}</strong><small>${esc(item.summary)}</small></span><span class="evidence-state">${read ? 'READ' : 'OPEN'}<span class="evidence-arrow" aria-hidden="true">↗</span></span></button>`;
  }).join('');
  $('#evidence-list').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => openEvidence(button.dataset.evidence)));
}

function openEvidence(id) {
  lastEvidenceId = id;
  const item = currentScenario().evidence.find((evidence) => evidence.id === id);
  if (!item) return;
  try {
    state = inspectEvidence(state, id);
    saveGame();
    render();
    $('#evidence-dialog-type').textContent = `${item.type || 'EVIDENCE'} / CASE FILE`;
    $('#evidence-dialog-title').textContent = item.title;
    $('#evidence-dialog-summary').textContent = item.summary;
    $('#evidence-dialog-content').textContent = item.content;
    $('#evidence-dialog').showModal();
  } catch (error) { notice(error.message, true); }
}

function renderAgents() {
  const letters = { analyst: 'A', skeptic: 'S', commander: 'C' };
  $('#agent-list').innerHTML = state.agents.map((agent) => `<article class="agent-card ${esc(agent.role)}"><div class="agent-heading"><span class="agent-avatar" aria-hidden="true">${letters[agent.role] || '·'}</span><div><strong>${esc(agent.name)}</strong><small>${esc(agent.position || agent.role)}</small></div></div><p>${esc(agent.message)}</p></article>`).join('');
}

function renderActions() {
  const actions = getAvailableActions(state);
  if (state.phase !== 'active') {
    $('#action-list').innerHTML = `<p class="action-complete">${state.phase === 'resolved' ? 'The house is quiet again. Your shift is complete.' : 'This shift has ended. Review the case report, then try a new approach.'}</p><button class="button button-primary" id="view-report-button" type="button">View shift outcome ↓</button>`;
    $('#view-report-button').addEventListener('click', () => $('#outcome-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }));
    return;
  }
  $('#action-list').innerHTML = actions.map((action, index) => `<div class="action-card"><button class="action-button" type="button" data-action="${esc(action.id)}" ${action.available ? '' : 'disabled'} ${!action.available && action.reason ? `aria-describedby="reason-${esc(action.id)}"` : ''}>
    <span class="action-number">${pad(index + 1)}</span><span class="action-copy"><strong>${esc(action.label)}</strong><p>${esc(action.description)}</p><span class="action-meta"><span>−${esc(action.cost)} capacity</span><span class="risk-label ${esc(action.risk)}">${esc(action.risk).toUpperCase()} RISK</span></span></span><span class="action-arrow" aria-hidden="true">→</span></button>${!action.available && action.reason ? `<p class="action-disabled-reason" id="reason-${esc(action.id)}">${esc(action.reason)}</p>` : ''}</div>`).join('');
  $('#action-list').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => executeAction(button.dataset.action)));
}

function executeAction(id) {
  try {
    state = applyAction(state, id);
    saveGame();
    render();
    const action = [...state.history].reverse().find((entry) => entry.type === 'action');
    notice(`Turn ${state.turn}: ${action?.title || 'Intervention completed'}. ${action?.detail || ''}`);
    if (state.phase !== 'active') {
      $('#outcome-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#outcome-title').focus({ preventScroll: true });
    }
  } catch (error) { notice(error.message, true); }
}

function renderTimeline() {
  const actions = state.history.filter((entry) => entry.type === 'action');
  $('#timeline-count').textContent = `${actions.length} action${actions.length === 1 ? '' : 's'}`;
  $('#timeline-list').innerHTML = actions.length ? [...actions].reverse().map((entry) => `<li class="timeline-item"><span class="timeline-turn">TURN ${pad(entry.turn)} · ${esc(entry.assessment)} · −${entry.cost} CAPACITY</span><strong>${esc(entry.title)}</strong><p>${esc(entry.detail)}</p></li>`).join('') : '<li class="timeline-empty">The shift is yours. Read a clue, then make your first move.</li>';
}

function rootCauseText(report) {
  const cause = report.rootCause;
  if (typeof cause === 'string') return cause;
  if (cause && typeof cause === 'object') return cause.summary || cause.description || cause.title || JSON.stringify(cause);
  return '';
}

function renderOutcome() {
  const panel = $('#outcome-panel');
  panel.hidden = state.phase === 'active';
  if (panel.hidden) { panel.innerHTML = ''; return; }
  const report = getReport(state);
  const success = state.phase === 'resolved';
  panel.classList.toggle('failed', !success);
  const outcome = state.outcome || {};
  panel.innerHTML = `<div><p class="eyebrow">SHIFT CLOSED / ${success ? 'SERVICE RESTORED' : 'INCIDENT UNRESOLVED'}</p><h2 id="outcome-title" tabindex="-1">${esc(outcome.title || (success ? 'The manor lives another night.' : 'The house wins this round.'))}</h2><p class="outcome-description">${esc(outcome.summary || outcome.reason || '')}</p><p class="outcome-cause"><b>Root cause:</b> ${esc(rootCauseText(report))}</p><div class="outcome-actions"><button class="button button-primary" id="download-report" type="button">↓ Download case report</button><button class="button button-quiet" id="download-data" type="button">Export JSON</button><button class="button button-quiet" id="try-again" type="button">Try this case again →</button></div></div><div class="outcome-score"><strong>${esc(report.score)}</strong><span>${esc(report.grade || 'SHIFT SCORE')} / 100</span></div>`;
  $('#download-report').addEventListener('click', () => downloadReport('markdown'));
  $('#download-data').addEventListener('click', () => downloadReport('json'));
  $('#try-again').addEventListener('click', () => requestNewGame(state.scenarioId));
}

function render() {
  const focused = document.activeElement;
  const focusKey = ['evidence', 'action', 'scenario'].find((key) => focused?.dataset?.[key]);
  const focusId = focusKey ? focused.dataset[focusKey] : null;
  const scenario = currentScenario();
  const index = scenarioList.findIndex((item) => item.id === state.scenarioId);
  $('#incident-reference').textContent = `INCIDENT / ${pad(index + 1)} · ${scenario.subtitle || 'NIGHT SHIFT'}`;
  $('#mission-title').textContent = scenario.title;
  $('#mission-summary').textContent = typeof scenario.briefing === 'string' ? scenario.briefing : scenario.summary;
  $('#turn-value').textContent = pad(state.turn);
  $('#budget-value').textContent = `${state.budgetRemaining} / ${scenario.actionBudget}`;
  const status = $('#status-pill');
  status.classList.toggle('failed', state.phase === 'failed');
  status.innerHTML = `<i></i> ${state.phase === 'active' ? 'INVESTIGATING' : state.phase === 'resolved' ? 'SERVICE RESTORED' : 'SHIFT ENDED'}`;
  renderScenarios();
  renderMetrics();
  renderMap();
  renderEvidence();
  renderAgents();
  renderActions();
  renderTimeline();
  renderOutcome();
  if (focusKey && focusId) {
    const candidates = [...document.querySelectorAll(`[data-${focusKey}]`)];
    const replacement = candidates.find((element) => element.dataset[focusKey] === focusId && !element.disabled) || candidates.find((element) => !element.disabled);
    replacement?.focus({ preventScroll: true });
  }
}

function readable(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function reportMarkdown(report) {
  const lines = [
    '# Deadlock Manor — Incident Case Report', '', `**Case:** ${report.title || currentScenario().title}`, `**Outcome:** ${state.outcome?.title || state.phase}`, `**Score:** ${report.score}/100 (${report.grade || 'ungraded'})`, `**Turns:** ${state.turn}`, `**Capacity remaining:** ${state.budgetRemaining}`, '',
    '> This is a deterministic, rule-based training simulation. The analyst, skeptic, and commander are scripted roles, not live AI agents.', '',
    '## Incident outcome', '', readable(state.outcome || 'Investigation in progress.'), '', '## Root cause', '', rootCauseText(report), '',
    '## Final metrics', '', ...metricDefinitions.map((definition) => `- ${definition.name}: ${formatMetric(state.metrics[definition.key], definition.key)}${definition.unit}`), '',
    '## Timeline', '', ...state.history.map((entry) => `- Turn ${entry.turn} · ${entry.type} · **${entry.title}**: ${entry.detail}`), '',
    '## Findings', '', ...(Array.isArray(report.findings) ? report.findings.map((finding) => `- ${readable(finding)}`) : [readable(report.findings || [])]), '',
    '## Lessons', '', ...(Array.isArray(report.lessons) ? report.lessons.map((lesson) => `- ${readable(lesson)}`) : [readable(report.lessons || [])]), '',
    '## Team assessment', '', ...state.agents.map((agent) => `- **${agent.name} (${agent.position || agent.role}):** ${agent.message}`), '',
  ];
  return lines.join('\n');
}

function downloadReport(format) {
  try {
    const report = getReport(state);
    const isJson = format === 'json';
    const content = isJson ? JSON.stringify(report, null, 2) : reportMarkdown(report);
    const blob = new Blob([content], { type: isJson ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deadlock-manor-${state.scenarioId}-turn-${state.turn}.${isJson ? 'json' : 'md'}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice('Case report downloaded. Keep it for your next shift.');
  } catch (error) { notice(error.message, true); }
}

$('#restart-button').addEventListener('click', () => requestNewGame(state.scenarioId));
$('#dismiss-resume').addEventListener('click', () => { $('#resume-message').hidden = true; });
$('#evidence-dialog').addEventListener('close', () => {
  const button = [...document.querySelectorAll('[data-evidence]')].find((item) => item.dataset.evidence === lastEvidenceId);
  button?.focus({ preventScroll: true });
});
$('#close-evidence').addEventListener('click', () => $('#evidence-dialog').close());
$('#evidence-done').addEventListener('click', () => $('#evidence-dialog').close());
$('#close-confirm').addEventListener('click', () => $('#confirm-dialog').close());
$('#confirm-cancel').addEventListener('click', () => $('#confirm-dialog').close());
$('#confirm-restart').addEventListener('click', () => {
  const next = pendingScenarioId || state.scenarioId;
  $('#confirm-dialog').close();
  pendingScenarioId = null;
  startGame(next);
  $('#mission').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

try {
  state = loadSavedGame() || createGame(scenarioList[0].id);
  render();
  $('#resume-message').hidden = !restored;
  if (!storageAvailable) notice('Local saving is unavailable in this browser. Keep this tab open to continue your shift.');
  else saveGame();
} catch (error) {
  $('#mission-title').textContent = 'The command desk could not start.';
  notice(`Unable to initialize the simulation: ${error.message}. Refresh this page to try again.`, true);
}
