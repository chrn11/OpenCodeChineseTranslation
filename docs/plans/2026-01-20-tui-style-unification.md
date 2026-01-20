# TUI Output Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一构建/安装依赖阶段的 TUI 输出风格，避免 raw 输出与 spinner 混杂，并保证错误时有可读日志。

**Architecture:** 为 `execLive` 增加静默/输出捕获能力；构建流程在 spinner 期间静默运行，失败时将输出尾部日志用 `indent` 统一格式化展示。保持现有 `colors.js` 的 TUI 帮助函数。

**Tech Stack:** Node.js child_process, node:test, custom TUI helpers (`scripts/core/colors.js`)

---

### Task 1: 添加失败用例（execLive 输出捕获 + tailLines）

**Files:**
- Create: `tests/exec-live.test.js`
- Modify: `package.json`（若需要新增 `test` 脚本）

**Step 1: Write the failing test**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { execLive, tailLines } = require('../scripts/core/utils');

test('execLive returns stdout/stderr when capture enabled', async () => {
  const result = await execLive(
    process.execPath,
    ['-e', 'console.log("ok"); console.error("err")'],
    { silent: true, capture: true }
  );

  assert.match(result.stdout, /ok/);
  assert.match(result.stderr, /err/);
});

test('tailLines returns last N lines', () => {
  const text = ['a', 'b', 'c', 'd'].join('\n');
  assert.strictEqual(tailLines(text, 2), 'c\nd');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/exec-live.test.js`
Expected: FAIL（`execLive` 不返回输出 / `tailLines` 不存在）

**Step 3: Commit**

> 暂不提交（除非爹爹要求）

---

### Task 2: 实现 execLive 捕获输出 + tailLines（最小实现）

**Files:**
- Modify: `scripts/core/utils.js`

**Step 1: Write minimal implementation**

```js
function tailLines(text, maxLines) {
  if (!text) return '';
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

function execLive(command, args, options = {}) {
  const { silent = false, capture = false, ...spawnOptions } = options;
  const usePipe = silent || capture;

  const child = spawn(command, args, {
    stdio: usePipe ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...spawnOptions,
  });

  let stdout = '';
  let stderr = '';

  if (usePipe) {
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
  }

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`进程退出，代码: ${code}`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    child.on('error', reject);
  });
}
```

- 保留原有简短函数注释（去掉多余 JSDoc 参数说明）
- 导出 `tailLines`

**Step 2: Run test to verify it passes**

Run: `node --test tests/exec-live.test.js`
Expected: PASS

**Step 3: Commit**

> 暂不提交（除非爹爹要求）

---

### Task 3: 构建/安装依赖阶段使用静默捕获输出

**Files:**
- Modify: `scripts/core/build.js`

**Step 1: Write the failing test**

> 这里以 Task 1/2 的单测覆盖核心逻辑（execLive 输出捕获 + tailLines）为主，构建流程为接线改动，后续用命令验证。

**Step 2: Write minimal implementation**

- `installDependencies()` 与 `build()` 调用 `execLive(..., { silent: true, capture: true })`
- 成功：保持 spinner 成功提示
- 失败：`spinner.fail()` 后用 `indent` 打印 `tailLines(stdout+stderr, 12)`

示意代码片段：

```js
try {
  const { stdout, stderr } = await execLive('bun', ['install'], {
    cwd: this.opencodePath,
    silent: true,
    capture: true,
  });
  spinner.succeed('依赖安装完成');
} catch (error) {
  spinner.fail('依赖安装失败');
  const output = [error.stdout, error.stderr].filter(Boolean).join('\n');
  const tail = tailLines(output, 12);
  if (tail) {
    indent('命令输出（末尾 12 行）:', 2);
    tail.split('\n').forEach((line) => indent(line, 3));
  }
  throw error;
}
```

**Step 3: Manual verification**

Run: `opencodenpm build`
Expected:
- 安装依赖与构建阶段不再混入 raw 输出
- 失败时只显示尾部日志，且带 `│` 前缀

**Step 4: Commit**

> 暂不提交（除非爹爹要求）

---

### Task 4: 详细扫描非 TUI 输出并统一

**Files:**
- Modify: 发现的相关文件（预计 `scripts/core/build.js`, `scripts/commands/*.js`）

**Step 1: Scan**

- 重点搜索 `console.log("非空文本")`、`stdio: "inherit"`
- 保留空行 `console.log("")`

**Step 2: Fix**

- 非空文本统一改用 `indent/warn/success`
- `sudo` 密码提示必须保留 `stdio: "inherit"`（交互限制，无法完全 TUI 化）

**Step 3: Verify**

Run: `opencodenpm full`（如耗时，可运行 `opencodenpm build`）
Expected:
- 绝大多数输出符合 TUI 样式
- 仅交互式 `sudo` 保留原始提示

**Step 4: Commit**

> 暂不提交（除非爹爹要求）

---

## 执行前确认

- 是否允许添加最小单测（node:test）？
- 构建命令输出是否允许“仅失败时展示尾部日志”？

---

Plan complete and saved to `docs/plans/2026-01-20-tui-style-unification.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?