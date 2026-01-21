## 目标（你说的“把所有功能都整合起来”）
- 把“下载/更新、扫描新增需汉化、AI 写入语言包、质量检查/修复、验证、应用到源码、构建、部署”收敛成**同一套统一流水线**。
- TUI 只需要点击：
  - **一键汉化**：跑完整流水线（从更新到部署）
  - **一键修复**：跑“语言包修复 + 应用 + 构建 + 部署”（可选是否更新官方）
- 现有命令（sync/apply/check/verify/build/deploy/full/fix）仍保留，但内部全部调用同一流水线模块，避免逻辑分叉与重复维护。

## 现状问题（为什么需要“整合到一套流水线”）
- 目前不同命令各自实现部分流程，导致：
  - 菜单“下一步”分支多，用户心智不稳定。
  - 同样的步骤（新增文件判定、质量检查）在多个地方出现，口径容易不一致。

## 整合方案（代码层面的统一）
### 1) 新增统一流水线模块（核心）
- 新建 `scripts/core/pipeline.js`（或 workflow.js），定义标准步骤：
  1. ensureSource（下载/更新官方源码）
  2. cleanSource（恢复纯净）
  3. scanNewFiles（检测新增文件，判定“需要/不需要汉化”）
  4. translateToPack（需要则 AI 翻译并写入语言包；不需要写 skip）
  5. qualityPack（语言包质量检查：语法+AI 语义；按阈值自动修复写回）
  6. verifyPack（验证配置/目标文件/弃用标记）
  7. applyToSource（仅替换到源码）
  8. qualitySource（替换后代码质量检查：tsc/关键文件/闭合）
  9. build（构建）
  10. deploy（部署）
- 每一步统一返回结构：{ ok, changed, summary, details, errorHint }，便于 TUI 汇总展示。
- 支持全局开关：dry-run、skipUpdate、skipDeploy、只检查/只修复等（保持后向兼容）。

### 2) 重构现有命令为“流水线预设”
- full → 直接调用 pipeline preset：all（1→10）
- fix → 调用 pipeline preset：repair（3→10，默认跳过 1，但可选开启 1）
- sync → 只跑 ensureSource + scanNewFiles + 版本同步；可提供 `--auto-fix`=继续跑 repair preset
- verify/check/apply/build/deploy → 变为调用 pipeline 的子集步骤（不再各自维护重复逻辑）

### 3) TUI 界面整合（你要的“只有两个入口”）
- 菜单保留：一键汉化 / 一键修复 / 退出。
- 不再出现复杂 NEXT_STEP_MAP 分支；每次运行结束都输出：
  - 哪些步骤做了什么（新增了哪些语言包配置、修复了多少条、替换了多少处、是否构建/部署成功）
  - 如果失败：明确失败步骤 + 建议操作（例如缺少 OPENAI_API_KEY、构建依赖缺失等）
  - 然后回到菜单。

### 4) 质量检查“全量按钮”不再需要单独入口
- 因为在 pipeline 里默认就会跑全量/抽样策略：
  - 语言包质量：支持全量或抽样，默认抽样，发现高风险则自动切全量（可配置阈值）。
  - 替换后质量：保持现有 tsc/关键文件/闭合检查。
- 一键修复/一键汉化都会覆盖质量检查与修复。

## 兼容性与迁移
- CLI 老命令继续存在；只是内部调用统一 pipeline，行为更一致。
- 输出文案保持现有风格，新增的是“统一汇总段落”。

## 测试与交付
- 新增 pipeline 单测：验证步骤顺序、开关生效（skipUpdate/skipDeploy/dry-run）。
- 关键命令映射测试：full/fix/sync 是否调用对应 preset。
- 跑 `node --test` 回归。

确认后我会按“1)新增 pipeline → 2)改 full/fix/sync → 3)改 TUI 菜单 → 4)改其余命令映射 → 5)补测试”完成整合。