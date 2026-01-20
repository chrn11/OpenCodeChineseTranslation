# TUI Output Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify opencodenpm CLI output to the clack-style TUI look by eliminating raw console output and standardizing prompts, spacing, and log formatting across our scripts.

**Architecture:** Centralize formatting in `scripts/core/colors.js` via a small set of helpers (blank lines, key/value rows, bar prefix) and refactor commands/core modules to use those helpers. Preserve streaming output but standardize its prefix and spacing to match the clack-style bar.

**Tech Stack:** Node.js (CommonJS), `@clack/prompts`, `picocolors`, custom `scripts/core/colors.js` helpers.

---

### Task 1: Add core output helpers + minimal tests

**Files:**
- Create: `scripts/test/colors-helpers.test.js`
- Modify: `scripts/core/colors.js`

**Step 1: Write the failing test**

```js
// scripts/test/colors-helpers.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  blank,
  kv,
  barPrefix,
  flushStream,
  colors,
  S,
} = require("../core/colors.js");

test("kv prefixes bar", async () => {
  const logs = [];
  const original = console.log;
  console.log = (msg) => logs.push(msg);

  kv("Label", "Value");
  await flushStream();

  console.log = original;
  assert.equal(logs.length, 1);
  assert.ok(logs[0].includes(`${colors.gray}${S.BAR}${colors.reset}  Label: Value`));
});

test("blank outputs empty lines", async () => {
  const logs = [];
  const original = console.log;
  console.log = (msg) => logs.push(msg);

  blank(2);
  await flushStream();

  console.log = original;
  assert.deepEqual(logs, ["", ""]);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test scripts/test/colors-helpers.test.js
```

Expected: FAIL (helpers not defined yet)

**Step 3: Write minimal implementation**

```js
// scripts/core/colors.js
function blank(lines = 1) {
  for (let i = 0; i < lines; i++) out("");
}

function barPrefix() {
  return `${colors.gray}${S.BAR}${colors.reset}  `;
}

function kv(label, value, level = 1, color = "reset") {
  const coloredLabel = colorize(label, color);
  indent(`${coloredLabel}: ${value}`, level);
}
```

Update non-TTY spinner output to use the queue:

```js
// inside Spinner.start
if (!process.stdout.isTTY) {
  out(`${colors.gray}${S.BAR}${colors.reset}  ${this.text}...`);
  return this;
}

// inside Spinner.stop
if (!process.stdout.isTTY) {
  const icon = isSuccess ? "✓" : "✗";
  const iconColor = isSuccess ? colors.green : colors.red;
  out(`${colors.gray}${S.BAR}${colors.reset}  ${iconColor}${icon}${colors.reset} ${finalText || this.text}`);
  return this;
}
```

Export new helpers:

```js
module.exports = {
  // ...
  blank,
  barPrefix,
  kv,
};
```

**Step 4: Run test to verify it passes**

```bash
node --test scripts/test/colors-helpers.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/core/colors.js scripts/test/colors-helpers.test.js
git commit -m "feat: add clack-style output helpers"
```

---

### Task 2: Normalize spacing in interactive flows (full/menu)

**Files:**
- Modify: `scripts/commands/full.js`
- Modify: `scripts/core/menu.js`

**Step 1: Capture baseline output (manual)**

Run:

```bash
node scripts/bin/opencodenpm
```

Note where extra blank lines appear.

**Step 2: Replace raw blank lines with helpers**

```js
// scripts/commands/full.js
const { step, success, error, warn, indent, blank } = require("../core/colors.js");

blank();
p.intro(...);
// ...
blank();
```

```js
// scripts/core/menu.js
const { blank } = require("./colors.js");

blank();
// replace console.log("") before/after menu actions
```

**Step 3: Manual verification**

```bash
node scripts/bin/opencodenpm
```

Expected: spacing uses consistent blank-line helper (no raw console.log).

**Step 4: Commit**

```bash
git add scripts/commands/full.js scripts/core/menu.js
git commit -m "refactor: normalize menu/full spacing"
```

---

### Task 3: Unify apply output + confirm prompt style

**Files:**
- Modify: `scripts/commands/apply.js`

**Step 1: Baseline output (manual)**

```bash
node scripts/bin/opencodenpm apply --dry-run
```

**Step 2: Replace inquirer with clack confirm**

```js
const p = require("@clack/prompts");

const translate = await p.confirm({
  message: "(use existing prompt text)",
  initialValue: true,
});
if (p.isCancel(translate)) {
  p.cancel("Cancelled");
  return false;
}
shouldTranslate = translate;
```

**Step 3: Replace raw bar/blank output with helpers**

```js
const { blank, kv } = require("../core/colors.js");

blank();
kv("Config files", `${stats.totalConfigs} items`);
kv("Translation entries", `${stats.totalReplacements} items`);
```

Replace manual summary lines:
- `console.log(`${c.gray}${S.BAR}...`)` -> `indent(...)` or `kv(...)`
- `console.log("" )` -> `blank()`
- `console.log(`${c.gray}└${c.reset}`)` -> `groupEnd()` or `indent("")`

**Step 4: Manual verification**

```bash
node scripts/bin/opencodenpm apply --dry-run
node scripts/bin/opencodenpm apply --skip-translate --skip-quality-check
```

**Step 5: Commit**

```bash
git add scripts/commands/apply.js
git commit -m "refactor: unify apply output style"
```

---

### Task 4: Replace deploy prompts with clack confirm

**Files:**
- Modify: `scripts/commands/deploy.js`

**Step 1: Baseline output (manual)**

```bash
node scripts/bin/opencodenpm deploy --help
```

**Step 2: Implement clack confirm (TTY) with fallback**

```js
const p = require("@clack/prompts");

async function confirmAction(message) {
  if (!process.stdout.isTTY) {
    return await askQuestion(`${message} (y/n): `);
  }
  const answer = await p.confirm({ message, initialValue: false });
  if (p.isCancel(answer)) {
    p.cancel("Cancelled");
    return null;
  }
  return answer;
}
```

Use `confirmAction` for both prompts and replace `console.log("")` with `blank()`.

**Step 3: Manual verification**

```bash
node scripts/bin/opencodenpm deploy
```

Expected: prompts render in clack style (TTY).

**Step 4: Commit**

```bash
git add scripts/commands/deploy.js
git commit -m "refactor: clack-style deploy prompts"
```

---

### Task 5: Clean up check/verify/sync outputs

**Files:**
- Modify: `scripts/commands/check.js`
- Modify: `scripts/commands/verify.js`
- Modify: `scripts/commands/sync.js`

**Step 1: Baseline output (manual)**

```bash
node scripts/bin/opencodenpm sync --check-only
node scripts/bin/opencodenpm check
node scripts/bin/opencodenpm verify -d
```

**Step 2: Replace raw blanks and bar lines**

- Replace `console.log("")` with `blank()`.
- Replace ad-hoc bar lines with `indent(...)` or `kv(...)`.

Example:

```js
blank();
kv("Files scanned", `${files.length} files`);
indent("Tip: use -v for details", 2);
```

**Step 3: Manual verification**

Re-run the commands from Step 1 and confirm consistent spacing and prefixes.

**Step 4: Commit**

```bash
git add scripts/commands/check.js scripts/commands/verify.js scripts/commands/sync.js
git commit -m "refactor: unify check/verify/sync output"
```

---

### Task 6: Standardize translator output blocks + streaming prefix

**Files:**
- Modify: `scripts/core/translator.js`
- Modify: `scripts/core/i18n.js`

**Step 1: Baseline output (manual)**

```bash
node scripts/bin/opencodenpm apply --dry-run
node scripts/bin/opencodenpm check
```

**Step 2: Replace blank lines and boxed report output**

- Replace `console.log("")` with `blank()`.
- Use `groupStart(...)` / `groupEnd()` in place of manual box lines.
- Use `kv(...)` for report rows.

Example for quality report:

```js
groupStart("(use existing report title)");
kv("Checked", String(result.checked));
kv("Syntax errors", String(syntaxErrors));
kv("Syntax warnings", String(syntaxWarnings));
kv("AI issues", String(aiIssues));
kv("Score", `${score}/100`);
groupEnd();
```

**Step 3: Standardize streaming prefix**

Use `barPrefix()` for summary streaming:

```js
process.stdout.write(barPrefix());
// and on line wrap:
process.stdout.write(`\n${barPrefix()}`);
```

**Step 4: Manual verification**

Re-run Step 1 commands and confirm:
- No raw `console.log("")`
- Consistent bar prefix on streamed lines
- Report block uses clack-style group start/end

**Step 5: Commit**

```bash
git add scripts/core/translator.js scripts/core/i18n.js
git commit -m "refactor: unify translator/i18n output"
```

---

### Task 7: Final manual spot-check

**Files:**
- None (verification only)

**Steps:**

```bash
node scripts/bin/opencodenpm
node scripts/bin/opencodenpm apply --dry-run
node scripts/bin/opencodenpm sync --check-only
node scripts/bin/opencodenpm check
node scripts/bin/opencodenpm verify -d
```

Expected: All outputs share a consistent clack-style bar prefix, spacing, and prompt UI.

---

## Notes
- This plan focuses only on our `scripts/` CLI output, not upstream `opencode-zh-CN/`.
- If dependency cleanup is desired, optionally remove `inquirer` from `scripts/package.json` after Task 3 and update the lockfile.

---

Plan complete and saved to `docs/plans/2026-01-20-tui-output-unification.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch a fresh subagent per task, review between tasks.
2. Parallel Session (separate) - Open a new session with executing-plans, batch execution with checkpoints.

Which approach?