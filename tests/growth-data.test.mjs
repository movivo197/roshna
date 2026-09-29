import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as growthDataExports from "../lib/growth-data.ts";
import {
  dayKey, emptyData, faNumber, focusMinutes, habitStreak, lastDays,
  makeBackup, parseBackup, shiftDay, taskCompletion, uid,
} from "../lib/growth-data.ts";

const task = (overrides = {}) => ({ id: "task-1", title: "مطالعه", date: "2026-09-27", time: "09:00", priority: "medium", done: false, ...overrides });

test("new account contains no invented history and backups round-trip Persian text", () => {
  const data = emptyData();
  assert.equal(data.tasks.length + data.goals.length + data.habits.length + data.journal.length + data.focus.length, 0);
  assert.deepEqual(data.wheel, {}, "unassessed domains must remain unset");
  data.profile = { name: "مؤید", intention: "روزهای روشن‌تر" };
  data.tasks.push(task());
  data.journal.push({ id: "j-1", date: "2026-09-27", mood: 4, text: "امروز خوب بود.", gratitude: "سلامتی" });
  assert.deepEqual(parseBackup(makeBackup(data)), data);
});

test("malformed, oversized and future-version backups are rejected", () => {
  assert.throws(() => parseBackup("{ incomplete"));
  assert.throws(() => parseBackup(" ".repeat(20_000_001)));
  assert.throws(() => parseBackup(JSON.stringify({ ...emptyData(), version: 3 })));
  assert.throws(() => parseBackup(JSON.stringify({ ...emptyData(), unknown: "field" })));
  assert.throws(() => parseBackup("null"));
});

test("backup validation rejects invalid dates, values, ids and array shapes", () => {
  const original = emptyData();
  const serializedOriginal = JSON.stringify(original);
  const invalid = [
    { tasks: [task({ date: "2025-02-29" })] },
    { tasks: [task({ date: "2026-13-01" })] },
    { tasks: [task({ time: "24:30" })] },
    { tasks: [task({ title: "   " })] },
    { tasks: [task(), task()] },
    { tasks: {} },
    { habits: [{ id: "habit", title: "ورزش", color: "#aabbcc", days: ["2026-09-27", "2026-09-27"] }] },
    { wheel: { سلامت: 11 } },
    { journal: [{ id: "journal", date: "2026-09-27", mood: 0, text: "", gratitude: "" }] },
    { goals: [{ id: "goal", title: "خواندن", why: "", deadline: "", target: 0, current: 0, unit: "کتاب" }] },
    { focus: [{ id: "focus", date: "2026-09-27", minutes: -1 }] },
  ];
  for (const patch of invalid) assert.throws(() => parseBackup(JSON.stringify({ ...original, ...patch })));
  assert.equal(JSON.stringify(original), serializedOriginal, "validation must never mutate current data");
  assert.equal(parseBackup(JSON.stringify({ ...original, tasks: [task({ date: "2024-02-29", time: "" })] })).tasks.length, 1);
});

test("day helpers use calendar arithmetic across leap years, months and DST", () => {
  assert.equal(dayKey(new Date(2026, 8, 27, 0, 1)), "2026-09-27");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
  assert.equal(shiftDay("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDay("2026-03-08", 1), "2026-03-09");
  assert.equal(shiftDay("2026-11-01", 1), "2026-11-02");
  assert.deepEqual(lastDays(3, "2026-01-02"), ["2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.deepEqual(lastDays(0), []);
  assert.throws(() => shiftDay("2026-02-30", 1));
  assert.throws(() => lastDays(-1));
  assert.throws(() => dayKey(new Date(NaN)));
});

test("streak includes yesterday while today's completion remains open", () => {
  assert.equal(habitStreak([], "2026-09-27"), 0);
  assert.equal(habitStreak(["2026-09-24", "2026-09-25", "2026-09-26"], "2026-09-27"), 3);
  assert.equal(habitStreak(["2026-09-25", "2026-09-26", "2026-09-27", "2026-09-27"], "2026-09-27"), 3);
  assert.equal(habitStreak(["2026-09-25", "2026-09-28"], "2026-09-27"), 0);
  assert.equal(habitStreak(["invalid", "2026-09-27"], "2026-09-27"), 1);
});

test("dashboard statistics derive only from recorded data", () => {
  assert.equal(taskCompletion([]), 0);
  assert.equal(taskCompletion([task(), task({ id: "task-2", done: true })]), 50);
  assert.equal(taskCompletion([task({ done: true })], "2026-09-28"), 0);
  const sessions = [{ id: "a", date: "2026-09-27", minutes: 25 }, { id: "b", date: "2026-09-26", minutes: 50 }];
  assert.equal(focusMinutes(sessions), 75);
  assert.equal(focusMinutes(sessions, ["2026-09-27"]), 25);
  assert.equal(faNumber(123), "۱۲۳");
  assert.notEqual(uid(), uid());
});

// Exercise the real hook through its public API with deterministic hook lifecycle
// and browser-storage adapters. Native IndexedDB needs separate browser UI QA.
const hookSource = ts.transpileModule(
  readFileSync(new URL("../hooks/use-growth-data.ts", import.meta.url), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;
const settle = () => new Promise((resolve) => setImmediate(resolve));

function browserStorageEnvironment(options = {}) {
  const values = options.values ?? new Map();
  const descriptors = new Map();
  let failWrites = false;
  let lockQueue = Promise.resolve();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrites && key === "roshan:personal:v1") throw new DOMException("Storage full", "QuotaExceededError");
      values.set(key, String(value));
    },
  };
  const browserWindow = Object.assign(new EventTarget(), { localStorage, setTimeout });
  const browserDocument = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const locks = options.noLocks ? undefined : {
    request: (_name, _options, callback) => {
      const operation = lockQueue.then(callback);
      lockQueue = operation.catch(() => {});
      return operation;
    },
  };
  const globals = {
    window: browserWindow,
    document: browserDocument,
    navigator: { locks },
    BroadcastChannel: class { postMessage() {} close() {} },
  };
  for (const [key, value] of Object.entries(globals)) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  return {
    values,
    failWrites: (fail) => { failWrites = fail; },
    restore: () => {
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

function createHookHarness() {
  const slots = [];
  let cursor = 0;
  const effects = [];
  const cleanups = [];
  const dependenciesChanged = (before, after) => !before || before.length !== after.length || before.some((value, index) => !Object.is(value, after[index]));
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { value: typeof initial === "function" ? initial() : initial };
        slots[index].setter = (value) => { slots[index].value = typeof value === "function" ? value(slots[index].value) : value; };
      }
      return [slots[index].value, slots[index].setter];
    },
    useRef: (initial) => {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback: (callback, dependencies) => {
      const index = cursor++;
      if (dependenciesChanged(slots[index]?.dependencies, dependencies)) slots[index] = { callback, dependencies };
      return slots[index].callback;
    },
    useEffect: (effect, dependencies) => {
      const index = cursor++;
      if (dependenciesChanged(slots[index]?.dependencies, dependencies)) {
        slots[index] = { dependencies };
        effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
      }
    },
  };
  const moduleExports = {};
  new Function("require", "exports", hookSource)((name) => {
    if (name === "react") return react;
    if (name === "@/lib/growth-data") return growthDataExports;
    throw new Error(`Unexpected module: ${name}`);
  }, moduleExports);
  const render = () => {
    cursor = 0;
    const result = moduleExports.useGrowthData();
    effects.splice(0).forEach((effect) => effect());
    return result;
  };
  render();
  return { current: render, unmount: () => cleanups.forEach((cleanup) => cleanup?.()) };
}

test("hook confirms durable saves, serializes rapid edits and reloads persisted data", async () => {
  const environment = browserStorageEnvironment();
  const first = createHookHarness();
  let second;
  try {
    await settle();
    assert.equal(first.current().ready, true);
    const update = first.current().update;
    const saves = [
      update((data) => ({ ...data, tasks: [...data.tasks, task()] })),
      update((data) => ({ ...data, tasks: [...data.tasks, task({ id: "task-2", title: "ورزش" })] })),
      update((data) => ({ ...data, profile: { ...data.profile, name: "مؤید" } })),
    ];
    assert.deepEqual(await Promise.all(saves), [true, true, true]);
    assert.equal(first.current().update, update, "update callback must remain stable");
    first.unmount();
    second = createHookHarness();
    await settle();
    assert.equal(second.current().data.tasks.length, 2);
    assert.equal(second.current().data.profile.name, "مؤید");
  } finally { first.unmount(); second?.unmount(); await settle(); environment.restore(); }
});

test("invalid imports and invalid updates never overwrite persisted information", async () => {
  const environment = browserStorageEnvironment();
  const harness = createHookHarness();
  try {
    await settle();
    await harness.current().update((data) => ({ ...data, tasks: [task()] }));
    const before = environment.values.get("roshan:personal:v1");
    await assert.rejects(harness.current().importData('{"version":1}'));
    assert.equal(environment.values.get("roshan:personal:v1"), before);
    assert.equal(harness.current().data.tasks[0].title, "مطالعه");
    assert.equal(await harness.current().update((data) => ({ ...data, tasks: [task({ date: "2026-02-30" })] })), false);
    assert.equal(environment.values.get("roshan:personal:v1"), before);
    const replacement = emptyData();
    replacement.profile.name = "بازیابی";
    await harness.current().importData(makeBackup(replacement));
    assert.deepEqual(JSON.parse(environment.values.get("roshan:personal:v1")).data, replacement);
  } finally { harness.unmount(); await settle(); environment.restore(); }
});

test("quota failure returns false, retains exportable edits and cannot be dismissed as success", async () => {
  const environment = browserStorageEnvironment();
  const harness = createHookHarness();
  try {
    await settle();
    await harness.current().update((data) => ({ ...data, tasks: [task()] }));
    const before = environment.values.get("roshan:personal:v1");
    environment.failWrites(true);
    assert.equal(await harness.current().update((data) => ({ ...data, profile: { ...data.profile, name: "ذخیره نشده" } })), false);
    assert.equal(environment.values.get("roshan:personal:v1"), before);
    assert.equal(harness.current().data.profile.name, "ذخیره نشده");
    assert.match(harness.current().error, /فضای ذخیره/);
    harness.current().clearError();
    assert.match(harness.current().error, /فضای ذخیره/);
    environment.failWrites(false);
    assert.equal(await harness.current().update((data) => data), true);
    assert.equal(JSON.parse(environment.values.get("roshan:personal:v1")).data.profile.name, "ذخیره نشده");
  } finally { harness.unmount(); await settle(); environment.restore(); }
});

test("cross-tab stale writes are rejected while unsaved local edits remain exportable", async () => {
  const environment = browserStorageEnvironment();
  const first = createHookHarness();
  const second = createHookHarness();
  try {
    await settle();
    assert.equal(await first.current().update((data) => ({ ...data, profile: { ...data.profile, name: "زبانه اول" } })), true);
    assert.equal(await second.current().update((data) => ({ ...data, profile: { ...data.profile, name: "زبانه دوم" } })), false);
    assert.equal(JSON.parse(environment.values.get("roshan:personal:v1")).data.profile.name, "زبانه اول");
    assert.equal(second.current().data.profile.name, "زبانه دوم");
    assert.match(second.current().error, /زبانهٔ دیگری/);
    assert.equal(await second.current().update((data) => data), false, "conflicted editing must remain blocked");
  } finally { first.unmount(); second.unmount(); await settle(); environment.restore(); }
});

test("corrupt stored data and lockless fallback remain protected from writes", async () => {
  for (const options of [
    { values: new Map([["roshan:personal:v1", "{corrupt"]]) },
    { noLocks: true },
  ]) {
    const environment = browserStorageEnvironment(options);
    const harness = createHookHarness();
    try {
      await settle();
      const before = environment.values.get("roshan:personal:v1");
      assert.equal(harness.current().ready, true);
      assert.ok(harness.current().error.length > 0);
      assert.equal(await harness.current().update((data) => ({ ...data, tasks: [task()] })), false);
      assert.equal(environment.values.get("roshan:personal:v1"), before);
    } finally { harness.unmount(); await settle(); environment.restore(); }
  }
});
