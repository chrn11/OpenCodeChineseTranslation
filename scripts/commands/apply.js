/**
 * apply 命令
 * 完整流程：扫描源码 → AI翻译 → 验证 → 质量检查 → 应用替换
 */

const path = require("path");
const { execSync } = require("child_process");
const I18n = require("../core/i18n.js");
const Translator = require("../core/translator.js");
const {
  step,
  success,
  warn,
  error,
  indent,
  log,
  info,
  colors,
  S,
} = require("../core/colors.js");

async function run(options = {}) {
  const {
    silent = false,
    skipTranslate = false,
    autoTranslate = false,
    skipVerify = false,
    skipQualityCheck = false,
    dryRun = false,
    incremental = false,
    since = null,
  } = options;

  const i18n = new I18n();
  const translator = new Translator();
  const c = colors;

  let newTranslations = null;
  let qualityPassed = true;

  // ========================================
  // 步骤 1: 扫描源码
  // ========================================
  if (!skipTranslate && !silent) {
    if (incremental) {
      // 增量翻译模式
      step("步骤 1/4: 增量扫描（仅变更文件）");

      const result = await translator.incrementalTranslate({
        since,
        uncommitted: true,
        dryRun,
      });

      if (result.files && result.files.length > 0) {
        newTranslations = result;
      }

      if (dryRun) {
        log("(dry-run 模式，仅扫描不翻译)");
        return true;
      }

      console.log("");
    } else {
      // 全量扫描模式
      step("步骤 1/4: 扫描源码");

      // 1.1 检测新增 TSX 文件
      const newFiles = i18n.detectNewFiles();
      if (newFiles.length > 0) {
        info(`发现 ${newFiles.length} 个新文件，AI 分析中...`);
        await i18n.smartProcessNewFiles(newFiles);
      }

      // 1.2 扫描已配置文件中的未翻译文本
      const untranslated = translator.scanAllFiles();

      if (untranslated.size > 0) {
        let totalTexts = 0;
        for (const texts of untranslated.values()) {
          totalTexts += texts.length;
        }

        warn(`发现 ${untranslated.size} 个文件共 ${totalTexts} 处未翻译文本`);

        let shown = 0;
        for (const [file, texts] of untranslated) {
          if (shown >= 5) {
            indent(`... 还有 ${untranslated.size - 5} 个文件`, 2);
            break;
          }
          indent(`+ ${file} (${texts.length} 处)`, 2);
          shown++;
        }
        console.log("");

        if (dryRun) {
          log("(dry-run 模式，仅扫描不翻译)");
          return true;
        }

        // ========================================
        // 步骤 2: AI 翻译
        // ========================================
        let shouldTranslate = autoTranslate;

        if (!autoTranslate && !silent) {
          const inquirer = require("inquirer");
          const { translate } = await inquirer.prompt([
            {
              type: "confirm",
              name: "translate",
              message: "是否使用 AI 自动翻译？",
              default: true,
            },
          ]);
          shouldTranslate = translate;
        }

        if (shouldTranslate) {
          step("步骤 2/4: AI 翻译");

          const result = await translator.scanAndTranslate({});

          if (result.files && result.files.length > 0) {
            newTranslations = result;
          }

          if (!result.success) {
            warn("部分翻译失败，继续处理已成功的翻译");
          }
          console.log("");
        } else {
          log("跳过 AI 翻译");
          console.log("");
        }
      } else {
        success("所有文本已有翻译");
        console.log("");
      }
    }
  }

  // ========================================
  // 步骤 3: 验证语言包
  // ========================================
  if (!skipVerify && !silent) {
    step("步骤 3/4: 验证语言包");

    const errors = i18n.validate();
    if (errors.length > 0) {
      error("发现配置错误:");
      errors.forEach((err) => indent(`- ${err}`, 2));
      return false;
    }

    const stats = i18n.getStats();
    success("配置验证通过");
    console.log(
      `${c.gray}${S.BAR}${c.reset}  配置文件: ${stats.totalConfigs} 个`,
    );
    console.log(
      `${c.gray}${S.BAR}${c.reset}  翻译条目: ${stats.totalReplacements} 条`,
    );
    console.log("");
  }

  // ========================================
  // 步骤 4: 应用翻译 + 质量检查
  // ========================================
  step("步骤 4/4: 应用翻译到源码");

  // 4.1 应用替换
  const result = await i18n.apply({ silent: true, skipNewFileCheck: true });

  if (!silent) {
    success(
      `汉化应用完成: ${result.files} 个文件, ${result.replacements} 处替换`,
    );
  }

  // 4.2 质量检查（可选）
  if (!skipQualityCheck && result.replacements > 0) {
    console.log("");
    qualityPassed = await runQualityCheck(i18n, translator);
  }

  // 4.3 显示覆盖率报告
  if (!silent) {
    console.log("");
    await i18n.showCoverageReportWithAI(newTranslations);
  }

  return qualityPassed;
}

/**
 * 质量检查：验证替换后的代码是否有问题
 */
async function runQualityCheck(i18n, translator) {
  const c = colors;

  step("质量检查");

  let allPassed = true;
  const issues = [];

  // 1. TypeScript 语法检查
  console.log(`${c.gray}${S.BAR}${c.reset}  检查 TypeScript 语法...`);

  try {
    const tscPath = path.join(i18n.opencodeDir, "node_modules", ".bin", "tsc");
    const pkgPath = path.join(i18n.opencodeDir, "packages", "opencode");

    execSync(`${tscPath} --noEmit --skipLibCheck`, {
      cwd: pkgPath,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60000,
    });

    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.green}✓${c.reset} TypeScript 语法正确`,
    );
  } catch (e) {
    const stderr = e.stderr?.toString() || "";
    const errorLines = stderr.split("\n").filter((l) => l.includes("error TS"));

    if (errorLines.length > 0) {
      allPassed = false;
      console.log(
        `${c.gray}${S.BAR}${c.reset}  ${c.red}✗${c.reset} 发现 ${errorLines.length} 个 TypeScript 错误`,
      );

      // 分析错误是否与翻译相关
      const translationErrors = errorLines.filter(
        (l) => l.includes(".tsx") && (l.includes("tui") || l.includes("cli")),
      );

      if (translationErrors.length > 0) {
        console.log(
          `${c.gray}${S.BAR}${c.reset}    ${c.yellow}可能与翻译相关的错误:${c.reset}`,
        );
        translationErrors.slice(0, 3).forEach((err) => {
          const match = err.match(
            /([^/]+\.tsx)\((\d+),(\d+)\).*error TS\d+: (.+)/,
          );
          if (match) {
            console.log(
              `${c.gray}${S.BAR}${c.reset}    ${c.dim}→ ${match[1]}:${match[2]} - ${match[4].slice(0, 50)}${c.reset}`,
            );
            issues.push({ file: match[1], line: match[2], message: match[4] });
          }
        });
      }
    } else {
      console.log(
        `${c.gray}${S.BAR}${c.reset}  ${c.green}✓${c.reset} TypeScript 语法正确`,
      );
    }
  }

  // 2. 检查关键文件完整性
  console.log(`${c.gray}${S.BAR}${c.reset}  检查文件完整性...`);

  const criticalFiles = [
    "src/cli/cmd/tui/app.tsx",
    "src/cli/cmd/tui/routes/session/index.tsx",
    "src/cli/cmd/tui/routes/session/footer.tsx",
  ];

  const fs = require("fs");
  let missingFiles = 0;

  for (const file of criticalFiles) {
    const fullPath = path.join(i18n.sourceBase, file);
    if (!fs.existsSync(fullPath)) {
      missingFiles++;
      console.log(
        `${c.gray}${S.BAR}${c.reset}    ${c.red}✗${c.reset} 缺失: ${file}`,
      );
    }
  }

  if (missingFiles === 0) {
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.green}✓${c.reset} 关键文件完整`,
    );
  } else {
    allPassed = false;
  }

  // 3. 检查替换后的中文是否正确闭合
  console.log(`${c.gray}${S.BAR}${c.reset}  检查字符串闭合...`);

  const configs = i18n.loadConfig();
  let unclosedCount = 0;

  for (const config of configs) {
    if (!config.replacements) continue;

    for (const [original, translated] of Object.entries(config.replacements)) {
      // 检查 JSX 标签是否匹配（保留这个检查，比较有意义）
      const originalTags = (original.match(/<[^>]+>/g) || []).length;
      const translatedTags = (translated.match(/<[^>]+>/g) || []).length;

      if (originalTags !== translatedTags) {
        unclosedCount++;
        if (unclosedCount <= 3) {
          console.log(
            `${c.gray}${S.BAR}${c.reset}    ${c.yellow}⚠${c.reset} JSX 标签不匹配: "${original.slice(0, 30)}..."`,
          );
          issues.push({ type: "jsx", original, translated });
        }
      }

      // 检查花括号是否匹配（重要：{highlight} 等模板变量）
      const originalBraces = (original.match(/[{}]/g) || []).length;
      const translatedBraces = (translated.match(/[{}]/g) || []).length;

      if (originalBraces !== translatedBraces) {
        unclosedCount++;
        if (unclosedCount <= 3) {
          console.log(
            `${c.gray}${S.BAR}${c.reset}    ${c.yellow}⚠${c.reset} 花括号不匹配: "${original.slice(0, 30)}..."`,
          );
          issues.push({ type: "brace", original, translated });
        }
      }
    }
  }

  if (unclosedCount === 0) {
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.green}✓${c.reset} 字符串格式正确`,
    );
  } else if (unclosedCount > 3) {
    console.log(
      `${c.gray}${S.BAR}${c.reset}    ${c.dim}... 还有 ${unclosedCount - 3} 个问题${c.reset}`,
    );
  }

  // 总结
  console.log(`${c.gray}${S.BAR}${c.reset}`);

  if (allPassed && issues.length === 0) {
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.green}${c.bold}✓ 质量检查通过${c.reset}`,
    );
  } else if (issues.length > 0 && allPassed) {
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.yellow}${c.bold}⚠ 发现 ${issues.length} 个潜在问题，但不影响编译${c.reset}`,
    );
  } else {
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.red}${c.bold}✗ 质量检查失败${c.reset}`,
    );
    console.log(
      `${c.gray}${S.BAR}${c.reset}  ${c.dim}建议: 运行 'opencodenpm build' 查看详细错误${c.reset}`,
    );
  }

  console.log(`${c.gray}└${c.reset}`);

  return allPassed;
}

module.exports = { run };
