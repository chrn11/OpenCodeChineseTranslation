# TUI UI/UX Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 按 clack 风格优化 TUI 主菜单与功能输出排版，修复一键汉化步骤编号乱序，并调整功能流程合理性。

**Architecture:** 在 `colors.js` 增加对齐与状态徽标助手；主菜单用分组块输出状态与环境；功能输出统一块结构与缩进；`full` 作为主步骤输出，子命令通过 `nested` 抑制步骤编号。

**Tech Stack:** Node.js (CommonJS), `@clack/prompts`, `picocolors`, `scripts/core/colors.js` 帮助函数。

---

### Task 1: 增加对齐与徽标助手

**Files:**
- Modify: `scripts/core/colors.js`

**Step 1: Write the failing test（跳过，用户要求不做 TDD）**

```js
// 跳过：用户要求所有任务跳过 TDD
```

**Step 2: Run test to verify it fails（跳过）**

```bash
# 跳过
```

**Step 3: Write minimal implementation**

```js
function displayWidth(text) {
  const stripped = stripAnsi ? stripAnsi(text) : text;
  let width = 0;
  for (const ch of stripped) {
    width += /[\x00-\x7F]/.test(ch) ? 1 : 2;
  }
  return width;
}

function padLabel(label, width = 8) {
  const pad = Math.max(0, width - displayWidth(label));
  return `${label}${" ".repeat(pad)}`;
}

function statusBadge(type) {
  if (type === "ok") return `${colors.green}●${colors.reset}`;
  if (type === "warn") return `${colors.yellow}○${colors.reset}`;
  return `${colors.cyan}◆${colors.reset}`;
}
```

Export new helpers:

```js
module.exports = {
  // ...
  padLabel,
  statusBadge,
};
```

**Step 4: Run test to verify it passes（跳过）**

```bash
# 跳过
```

**Step 5: Commit（仅用户要求时）**

```bash
git add scripts/core/colors.js
git commit -m "feat: add tui alignment helpers"
```

---

### Task 2: 主菜单布局优化（clack 风格）

**Files:**
- Modify: `scripts/core/menu.js`

**Step 1: Write the failing test（跳过）**

```js
// 跳过：用户要求所有任务跳过 TDD
```

**Step 2: Run test to verify it fails（跳过）**

```bash
# 跳过
```

**Step 3: Write minimal implementation**

```js
// showEnvInfo() 内
blank();
groupStart("系统环境");
kv(padLabel("Node"), nodeVersion);
kv(padLabel("Bun"), bunVersion || "未安装");
kv(padLabel("Git"), gitInfo);
groupEnd();

blank();
groupStart("运行状态");
indent(`${statusBadge(installed ? "ok" : "warn")} OpenCode ${status}`);
indent(`${statusBadge(dist ? "ok" : "warn")} 构建产物 ${distStatus}`);
indent(`${colors.dim}推荐: ${nextAction}${colors.reset}`);
groupEnd();
```

```js
// showMenu() 内
const action = await p.select({
  message: "选择操作",
  options: MENU_OPTIONS,
  initialValue: "full",
});
```

**Step 4: Run test to verify it passes（跳过）**

```bash
# 跳过
```

**Step 5: Commit（仅用户要求时）**

```bash
git add scripts/core/menu.js
git commit -m "refactor: refine menu layout"
```

---

### Task 3: 功能流程合理性微调

**Files:**
- Modify: `scripts/core/menu.js`

**Step 1: Write the failing test（跳过）**

```js
// 跳过：用户要求所有任务跳过 TDD
```

**Step 2: Run test to verify it fails（跳过）**

```bash
# 跳过
```

**Step 3: Write minimal implementation**

- 调整 `MENU_OPTIONS` 的 `hint` 文案，补充“推荐路径”。
- 更新 `NEXT_STEP_MAP` 的默认推荐项，使提示与流程一致。

**Step 4: Run test to verify it passes（跳过）**

```bash
# 跳过
```

**Step 5: Commit（仅用户要求时）**

```bash
git add scripts/core/menu.js
git commit -m "refactor: align menu flow hints"
```

---

### Task 4: 修复一键汉化步骤编号乱序

**Files:**
- Modify: `scripts/commands/full.js`
- Modify: `scripts/commands/apply.js`
- Modify: `scripts/commands/verify.js`

**Step 1: Write the failing test（跳过）**

```js
// 跳过：用户要求所有任务跳过 TDD
```

**Step 2: Run test to verify it fails（跳过）**

```bash
# 跳过
```

**Step 3: Write minimal implementation**

```js
// apply.js / verify.js
async function run(options = {}) {
  const { nested = false } = options;
  const stepLine = (text) => {
    if (nested) {
      indent(`↳ ${text}`, 2);
      return;
    }
    step(text);
  };

  stepLine("步骤 1/4: ...");
  // 其余 step 调用同样替换
}
```

```js
// full.js
await applyCmd.run({ silent: false, nested: true });
await verifyCmd.run({ nested: true });
```

**Step 4: Run test to verify it passes（跳过）**

```bash
# 跳过
```

**Step 5: Commit（仅用户要求时）**

```bash
git add scripts/commands/full.js scripts/commands/apply.js scripts/commands/verify.js
git commit -m "fix: prevent nested step numbering"
```

---

### Task 5: 功能输出排版优化（统计块/提示层级）

**Files:**
- Modify: `scripts/commands/apply.js`
- Modify: `scripts/commands/verify.js`
- Modify: `scripts/commands/check.js`
- Modify: `scripts/commands/sync.js`

**Step 1: Write the failing test（跳过）**

```js
// 跳过：用户要求所有任务跳过 TDD
```

**Step 2: Run test to verify it fails（跳过）**

```bash
# 跳过
```

**Step 3: Write minimal implementation**

- 质量/覆盖率/统计摘要用 `groupStart/End` 包裹。
- `kv(padLabel(label), value)` 对齐关键字段。
- 仅在区块之间使用 `blank()`。

**Step 4: Run test to verify it passes（跳过）**

```bash
# 跳过
```

**Step 5: Commit（仅用户要求时）**

```bash
git add scripts/commands/apply.js scripts/commands/verify.js scripts/commands/check.js scripts/commands/sync.js
git commit -m "refactor: improve output layout"
```

---

### Task 6: 手动验证（不执行自动测试）

**Files:**
- None

**Step 1: Run CLI flows**

```bash
node scripts/bin/opencodenpm
node scripts/bin/opencodenpm full -y
node scripts/bin/opencodenpm apply --dry-run
node scripts/bin/opencodenpm verify -d
node scripts/bin/opencodenpm check
```

Expected: 主菜单与输出排版统一，步骤编号按 1→7 顺序显示。

---

Plan complete and saved to `docs/plans/2026-01-21-tui-ui-ux-optimization.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks.
2. Parallel Session (separate) - Open a new session with executing-plans, batch execution with checkpoints.

Which approach?
