## 对你流程的确认（结合当前仓库现状）
- 整体流程方向是对的，但需要按本项目特点做两点落地化：
  - 这是 **CLI/TUI** 工具链，所谓“开发/测试/生产环境”更适合映射为 **develop/main/tag** 三类流水线与产物渠道，而不是 Web 服务部署。
  - 仓库已经有 tag 触发的 [release.yml](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/.github/workflows/release.yml)，但缺少：PR/分支上的质量门禁、SemVer 与发布规则统一、以及可追溯的多版本产物管理。

## 目标交付物（与你要求对齐）
- 可运行的多版本构建产物：
  - develop 分支：每次提交产出“测试构建”工件（artifact，带 commit sha/run id）。
  - main 分支：每次提交产出“生产构建”工件（artifact，带 commit sha）。
  - tag（v*）：产出正式 Release（与现有 release.yml 兼容）。
- 完整 Git 历史：按 feature 分支 + PR 合并 + 约定式提交。
- 自动化日志与报告：CI 输出测试结果、verify 报告、构建日志。

## SemVer 与版本来源统一
- 现状存在多处版本源：根 [package.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/package.json)、[scripts/package.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/package.json)、[opencode-i18n/config.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/opencode-i18n/config.json)、[CHANGELOG.md](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/CHANGELOG.md)。
- 计划统一规则（建议）：
  - **Release Tag**：`v{opencodeVersion}-zh.{n}`（例：v1.1.27-zh.1）或 `v{toolVersion}`（二选一，按你更看重“跟随上游版本”还是“工具自身版本”）。
  - **单一权威源**：以 [opencode-i18n/config.json](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/opencode-i18n/config.json) 的 `opencodeVersion + version` 为权威，脚本包与根包从其同步。
  - 用 [scripts/core/version.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/core/version.js) 做版本读取/写入入口，并补齐 CI 校验“版本一致性”。

## Git 分支与提交规范（约定式提交 + 特性分支）
- 分支模型：
  - `main`：生产构建源（受保护分支）。
  - `develop`：测试构建源。
  - `feat/*`、`fix/*`、`chore/*`：特性分支，PR 合并回 develop；定期把 develop 合并回 main。
- 提交规范：Conventional Commits（feat/fix/chore/docs/refactor/test/ci/build）。
- 自动化约束：引入 commitlint +（可选）husky，在本地与 CI 双重校验。

## 自动化构建（CI）新增与改造
### 1) 新增 CI 门禁工作流（PR + 分支）
- 新增 `.github/workflows/ci.yml`：
  - 触发：`pull_request`（目标 main/develop）与 `push`（develop/main）。
  - Job：
    - 安装 scripts 依赖（Node 20）。
    - 运行单测：`node --test`（当前测试位于 [scripts/test](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/test)）。
    - 运行配置校验：`opencodenpm verify`（[verify.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/commands/verify.js)）。
    - 运行静态检查（可选）：例如简单的 JSON 格式校验/重复键检测。

### 2) 分支构建工件（dev/test/prod 映射）
- 新增 `.github/workflows/build-branch.yml`：
  - develop push：生成“测试构建”artifact。
  - main push：生成“生产构建”artifact。
  - 产物命名包含：`branch + sha + run_number`，并保留构建日志。
  - 构建方式对齐 release：使用 Bun + `opencodenpm apply --skip-translate --skip-quality-check` 后构建。

### 3) 正式发布（tag）对齐版本与渠道
- 改造现有 [release.yml](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/.github/workflows/release.yml)：
  - 保持 tag 触发与多平台矩阵。
  - 增加“版本/渠道一致性”步骤：确保 Release 名称/版本号与 `opencode-i18n/config.json` 一致。
  -（可选）把构建从“直接 bun run build”改为复用 scripts/build 的版本注入逻辑（见 [scripts/core/build.js](file:///Users/xiaolajiao/999/888/hanhua/OpenCodeChineseTranslation/scripts/core/build.js)），避免出现 dev channel 产物混入正式 Release。

## 部署与发布策略
- 分支构建：只上传 artifact（用于测试/回归/验收），不写入 Release。
- tag 发布：创建 GitHub Release 并上传产物（现有流程基础上增强可追溯信息）。
- 回滚：通过 tag/Release 管理实现“拿旧版本产物直接替换”的回滚；并补充文档说明。

## 多环境配置（开发/测试/生产）
- 以流水线级别区分：
  - develop：测试构建（可选开启更多校验，如 `check --quality` 抽样）。
  - main：生产构建（必须跑完测试 + verify，构建通过才产出）。
  - tag：发布构建（必须全量门禁，且版本一致性校验通过）。

## 执行顺序（实现步骤）
1. 统一版本规范与版本源：补齐一致性校验与版本同步脚本。
2. 引入约定式提交校验：commitlint（+ 可选 husky）。
3. 新增 CI 工作流（PR/分支门禁）：测试 + verify + 基础质量检查。
4. 新增分支构建工作流：main/develop push 产出可追溯工件。
5. 改造 release 工作流：tag 发布时版本/渠道一致性、产物命名与追溯信息完善。
6. 文档补齐：贡献指南（分支/提交/发布）、回滚与多版本产物使用说明。

确认后我会开始落地上述改动：新增/调整 GitHub Actions、补充版本与提交规范工具，并给出一份“如何从 develop→main→tag 发布”的完整操作手册。