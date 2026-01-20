# TUI UI/UX 优化设计

**目标**
- 主菜单更有层级与可扫读性，保持 clack 风格。
- 功能命令输出排版统一，信息层级清晰。
- 修复一键汉化步骤编号乱序问题。

**范围**
- `scripts/core/menu.js`
- `scripts/core/colors.js`
- `scripts/commands/full.js`
- `scripts/commands/apply.js`
- `scripts/commands/verify.js`
- 其他命令输出（按需调整）：`scripts/commands/check.js`、`scripts/commands/sync.js`、`scripts/commands/deploy.js`

## 设计原则
- 保持 clack 的极简与轻量，不引入重 UI。
- 以“层级/对齐/留白”改善可读性，而非改文案。
- 只有主流程输出步骤编号，子流程只显示子层级提示。

## 主菜单布局
- 使用 `p.intro` 作为品牌条。
- 紧接两个分组：**系统环境** 与 **运行状态**，用 `groupStart/End` 包裹。
- 使用 `kv` 输出键值对，并引入 `padLabel()` 对齐标签。
- 状态使用徽标：`●/○/◆` 表示已安装/未运行/有产物。
- `p.select` 的 `message` 设为“选择操作”，减少空白断层。

## 功能输出排版
- 输出结构：**step 标题 → dim 过程 → 结果**。
- 统计块统一用 `groupStart/End` + `kv/indent`。
- 空行只出现在区块之间，区块内部避免无意义换行。

## 一键汉化步骤编号修复
- `full.js` 继续输出 1/7…7/7。
- `apply.js`、`verify.js` 增加 `nested` 参数：
  - `nested=false`（独立执行）仍输出自身步骤编号。
  - `nested=true`（从 full 调用）不输出编号，仅用 `indent` 提示子步骤。
- `full.js` 调用 `apply/verify` 时传 `nested: true`，避免插入子编号。

## 功能合理性调整
- 菜单提示与推荐路径更清晰：在菜单/状态区增加“推荐下一步”。
- 统一取消行为：确认框取消时返回 `false`，避免三态分支。
- 构建/部署流程保持一致性，跳过时明确提示“已跳过”。

## 兼容性与风险
- 标签对齐的宽度计算对中文字符可能存在误差，采用简化宽度算法（ASCII=1，非 ASCII=2）。
- 非 TTY 环境下只输出基础样式（保持现有 `colors.js` 逻辑）。

## 验证方式
- 手动运行：
  - `node scripts/bin/opencodenpm`
  - `node scripts/bin/opencodenpm full -y`
  - `node scripts/bin/opencodenpm apply --dry-run`
  - `node scripts/bin/opencodenpm verify -d`
  - `node scripts/bin/opencodenpm check`
