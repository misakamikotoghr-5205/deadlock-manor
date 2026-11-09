import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { scenarios } from '../scenarios.js';
import * as simulation from '../simulation.js';
import * as replay from '../replay.js';

const SAVE_KEY = 'deadlock-manor:shift:v1';
const ORIGINAL_KEY = 'deadlock-manor:branch-origin:v1';
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8')
  .replace(/^import \{[\s\S]*?\} from "[^"]+";\n/gm, '');

// Execute the actual application, including its registered click handler and
// startup logic. The DOM stub only supplies rendering/focus sinks; no app state
// transitions, save operations, or notice behavior are reimplemented here.
function mount(saved, { original = null, failOriginalRead = false } = {}) {
  const values = new Map([[SAVE_KEY, JSON.stringify(saved)]]);
  if (original !== null) values.set(ORIGINAL_KEY, original);
  const failWrites = new Set();
  let originalReadFailed = false;
  const nodes = new Map();
  const document = { activeElement: null };
  function element(selector) {
    if (nodes.has(selector)) return nodes.get(selector);
    const classes = new Set();
    const node = {
      dataset: {}, style: {}, parentElement: { style: {} },
      textContent: '', innerHTML: '', hidden: false,
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle(name, force) {
          const present = force === undefined ? !classes.has(name) : force;
          if (present) classes.add(name); else classes.delete(name);
          return present;
        },
      },
      addEventListener() {}, querySelectorAll: () => [],
      setAttribute() {}, append() {}, remove() {},
      focus() { document.activeElement = node; },
      showModal() {}, close() {}, scrollIntoView() {},
    };
    nodes.set(selector, node);
    return node;
  }
  Object.assign(document, {
    querySelector: element, querySelectorAll: () => [],
    createElement: tag => element(`new:${tag}`), body: element('body'),
  });
  const storage = {
    getItem(key) {
      if (key === ORIGINAL_KEY && failOriginalRead && !originalReadFailed) {
        originalReadFailed = true;
        throw new Error('Injected original-backup read failure');
      }
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failWrites.has(key)) throw new Error('Injected quota failure');
      values.set(key, value);
    },
    removeItem: key => values.delete(key),
  };
  const context = vm.createContext({
    ...simulation, ...replay, scenarios, document,
    localStorage: storage, console, Blob, URL, setTimeout,
  });
  vm.runInContext(`${source}\n;globalThis.testAccess = {
    snapshot: () => ({ state, originalShift, originalPersisted, storageAvailable }),
    setPreview: preview => { replayPreview = preview; },
    restoreOriginal,
  };`, context, { filename: 'app.js' });
  return { access: context.testAccess, element, values, failWrites };
}

function finishedShift() {
  let game = simulation.createGame('bad-release');
  for (const action of ['pause-rollout', 'rollback-release', 'verify-recovery'])
    game = simulation.applyAction(game, action);
  assert.equal(game.phase, 'resolved');
  return game;
}

for (const backupFails of [false, true]) {
  test(`branch current-save failure stays visible when backup ${backupFails ? 'also fails' : 'succeeds'}`, () => {
    const original = finishedShift();
    const app = mount(original);
    app.failWrites.add(SAVE_KEY);
    if (backupFails) app.failWrites.add(ORIGINAL_KEY);
    const preview = replay.previewAlternative(original, 0, 'add-capacity');
    app.access.setPreview(preview);
    app.element('#confirm-branch').onclick();

    assert.equal(app.access.snapshot().state, preview.alternativeAfter);
    assert.equal(app.access.snapshot().storageAvailable, false);
    assert.deepEqual(JSON.parse(app.values.get(SAVE_KEY)), original,
      'failed branch autosave must not be mistaken for loss of the prior saved shift');
    assert.equal(app.values.has(ORIGINAL_KEY), !backupFails);
    const notice = app.element('#live-notice');
    assert.equal(notice.classList.contains('error'), true,
      'the final handler notice must retain the current-save failure');
    assert.match(notice.textContent, /could not be saved|could not save|not saved/i);
    assert.match(notice.textContent, backupFails ? /backup.*(?:this tab|tab only)/i : /backup.*(?:device|saved)/i);
  });
}

test('an unreadable original backup warns immediately while preserving the loaded branch and stored backup', () => {
  const original = finishedShift();
  const branch = replay.previewAlternative(original, 0, 'add-capacity').alternativeAfter;
  const backup = JSON.stringify(original);
  const app = mount(branch, { original: backup, failOriginalRead: true });
  assert.equal(app.access.snapshot().storageAvailable, false);
  assert.equal(app.access.snapshot().originalShift, null);
  assert.equal(app.access.snapshot().state.scenarioId, branch.scenarioId);
  assert.deepEqual(JSON.parse(JSON.stringify(app.access.snapshot().state)), branch);
  assert.equal(app.values.get(ORIGINAL_KEY), backup, 'a read failure does not delete the stored backup');
  assert.match(app.element('#live-notice').textContent, /saving is unavailable/i);
});

test('a malformed backup does not disable otherwise working current-shift saving', () => {
  const original = finishedShift();
  const app = mount(original, { original: '{bad json' });
  assert.equal(app.access.snapshot().storageAvailable, true);
  assert.equal(app.access.snapshot().originalShift, null);
  assert.equal(app.element('#live-notice').textContent, '');
});

test('successful branching and return still persist the actual states', () => {
  const original = finishedShift();
  const app = mount(original);
  const preview = replay.previewAlternative(original, 0, 'add-capacity');
  app.access.setPreview(preview);
  app.element('#confirm-branch').onclick();
  assert.deepEqual(JSON.parse(app.values.get(SAVE_KEY)), preview.alternativeAfter);
  assert.deepEqual(JSON.parse(app.values.get(ORIGINAL_KEY)), original);
  assert.equal(app.element('#live-notice').classList.contains('error'), false);
  app.access.restoreOriginal();
  assert.equal(app.values.has(ORIGINAL_KEY), false);
  assert.deepEqual(JSON.parse(app.values.get(SAVE_KEY)), original);
  assert.deepEqual(JSON.parse(JSON.stringify(app.access.snapshot().state)), original);
});

test('a failed return save keeps the durable original backup available after reload', () => {
  const original = finishedShift();
  const branch = replay.previewAlternative(original, 0, 'add-capacity').alternativeAfter;
  const backup = JSON.stringify(original);
  const app = mount(branch, { original: backup });
  app.failWrites.add(SAVE_KEY);
  app.access.restoreOriginal();
  assert.deepEqual(JSON.parse(JSON.stringify(app.access.snapshot().state)), original);
  assert.equal(app.values.get(ORIGINAL_KEY), backup,
    'do not delete the only durable original before its replacement save succeeds');
  assert.deepEqual(JSON.parse(app.values.get(SAVE_KEY)), branch);
  assert.equal(app.element('#live-notice').classList.contains('error'), true);
  assert.match(app.element('#live-notice').textContent, /could not.*save|could not be saved/i);
  const reloaded = mount(JSON.parse(app.values.get(SAVE_KEY)), {
    original: app.values.get(ORIGINAL_KEY),
  });
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.access.snapshot().originalShift)), original);
});
