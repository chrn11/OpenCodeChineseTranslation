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
  barPrefix,
  info,
  blank,
  kv,
  colors,
  groupEnd,
  createSpinner,
  flushStream,
  nestedStep,
  nestedContent,
  nestedSuccess,
  nestedKv,
  nestedFinal,
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
    nested = false, // 从 full.js 调用时为 true，不输出独立步骤编号
  } = options;

  // nested 模式下使用 clack 风格嵌套输出
  const outputStep = nested
    ? (msg) => nestedStep(msg.replace(/^步骤 \d+\/\d+: /, ""))
    : step;
  const outputContent = nested ? nestedContent : indent;
  const outputSuccess = nested ? nestedSuccess : success;
  const outputKv = nested ? nestedKv : kv;
  const outputFinal = nested ? (text) => nestedFinal(text, "success") : success;

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
      outputStep("步骤 1/4: 增量扫描（仅变更文件）");

      const result = await translator.incrementalTranslate({
        since,
        uncommitted: true,
        dryRun,
      });

      if (result.files && result.files.length > 0) {
        newTranslations = result;
      }

      if (dryRun) {
        outputContent("(dry-run 模式，仅扫描不翻译)");
        return true;
      }

      blank();
    } else {
      // 全量扫描模式
      outputStep("步骤 1/4: 扫描源码");

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
            outputContent(`... 还有 ${untranslated.size - 5} 个文件`);
            break;
          }
          outputContent(`+ ${file} (${texts.length} 处)`);
          shown++;
        }
        blank();

        if (dryRun) {
          outputContent("(dry-run 模式，仅扫描不翻译)");
          return true;
        }

        // ========================================
        // 步骤 2: AI 翻译
        // ========================================
        let shouldTranslate = autoTranslate;

        if (!autoTranslate && !silent) {
          const p = require("@clack/prompts");
          const result = await p.confirm({
            message: "是否使用 AI 自动翻译？",
            initialValue: true,
          });
          shouldTranslate = p.isCancel(result) ? false : result;
        }

        if (shouldTranslate) {
          outputStep("步骤 2/4: AI 翻译");

          const result = await translator.scanAndTranslate({});

          if (result.files && result.files.length > 0) {
            newTranslations = result;
          }

          if (!result.success) {
            warn("部分翻译失败，继续处理已成功的翻译");
          }
          blank();
        } else {
          outputContent("跳过 AI 翻译");
          blank();
        }
      } else {
        outputSuccess("所有文本已有翻译");
        blank();

        // 步骤 2: 显示跳过信息
        outputStep("步骤 2/4: AI 翻译");
        outputContent("跳过（所有文本已有翻译）");
        blank();
      }
    }
  }

  // ========================================
  // 步骤 3: 验证语言包
  // ========================================
  if (!skipVerify && !silent) {
    outputStep("步骤 3/4: 验证语言包");

    const errors = i18n.validate();
    if (errors.length > 0) {
      error("发现配置错误:");
      errors.forEach((err) => outputContent(`- ${err}`));
      return false;
    }

    const stats = i18n.getStats();
    outputSuccess("配置验证通过");
    outputKv("配置文件", `${stats.totalConfigs} 个`);
    outputKv("翻译条目", `${stats.totalReplacements} 条`);
    blank();
  }

  // ========================================
  // 步骤 4: 应用翻译 + 质量检查
  // ========================================
  outputStep("步骤 4/4: 应用翻译到源码");

  // 4.1 应用替换
  const result = await i18n.apply({ silent: true, skipNewFileCheck: true });

  if (!silent) {
    outputSuccess(
      `汉化应用完成: ${result.files} 个文件, ${result.replacements} 处替换`,
    );
  }

  // 4.2 质量检查（可选）
  if (!skipQualityCheck && result.replacements > 0) {
    blank();
    qualityPassed = await runQualityCheck(i18n, translator, outputStep);
  }

  // 4.3 显示覆盖率报告
  if (!silent) {
    blank();
    await i18n.showCoverageReportWithAI(newTranslations);
  }

  return qualityPassed;
}

/**
 * 质量检查：验证替换后的代码是否有问题
 */
async function runQualityCheck(i18n, translator, outputStep) {
  const c = colors;

  await flushStream();

  // 主 spinner：显示质量检查正在进行
  const mainSpinner = createSpinner("质量检查");
  mainSpinner.start();

  let allPassed = true;
  const issues = [];

  const results = [];

  // 1. TypeScript 语法检查
  mainSpinner.update("质量检查: TypeScript 语法...");

  try {
    const tscPath = path.join(i18n.opencodeDir, "node_modules", ".bin", "tsc");
    const pkgPath = path.join(i18n.opencodeDir, "packages", "opencode");

    execSync(`${tscPath} --noEmit --skipLibCheck`, {
      cwd: pkgPath,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60000,
    });

    results.push({ ok: true, text: "TypeScript 语法正确" });
  } catch (e) {
    const stderr = e.stderr?.toString() || "";
    const errorLines = stderr.split("\n").filter((l) => l.includes("error TS"));

    if (errorLines.length > 0) {
      allPassed = false;
      results.push({
        ok: false,
        text: `发现 ${errorLines.length} 个 TypeScript 错误`,
      });

      const translationErrors = errorLines.filter(
        (l) => l.includes(".tsx") && (l.includes("tui") || l.includes("cli")),
      );

      if (translationErrors.length > 0) {
        translationErrors.slice(0, 3).forEach((err) => {
          const match = err.match(
            /([^/]+\.tsx)\((\d+),(\d+)\).*error TS\d+: (.+)/,
          );
          if (match) {
            issues.push({ file: match[1], line: match[2], message: match[4] });
          }
        });
      }
    } else {
      results.push({ ok: true, text: "TypeScript 语法正确" });
    }
  }

  // 2. 检查关键文件完整性
  mainSpinner.update("质量检查: 文件完整性...");

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
    }
  }

  if (missingFiles === 0) {
    results.push({ ok: true, text: "关键文件完整" });
  } else {
    results.push({ ok: false, text: `缺失 ${missingFiles} 个关键文件` });
    allPassed = false;
  }

  // 3. 检查替换后的中文是否正确闭合
  mainSpinner.update("质量检查: 字符串格式...");

  const configs = i18n.loadConfig();
  let unclosedCount = 0;

  for (const config of configs) {
    if (!config.replacements) continue;

    for (const [original, translated] of Object.entries(config.replacements)) {
      const originalTags = (original.match(/<[^>]+>/g) || []).length;
      const translatedTags = (translated.match(/<[^>]+>/g) || []).length;

      if (originalTags !== translatedTags) {
        unclosedCount++;
        if (unclosedCount <= 3) {
          issues.push({ type: "jsx", original, translated });
        }
      }

      const originalBraces = (original.match(/[{}]/g) || []).length;
      const translatedBraces = (translated.match(/[{}]/g) || []).length;

      if (originalBraces !== translatedBraces) {
        unclosedCount++;
        if (unclosedCount <= 3) {
          issues.push({ type: "brace", original, translated });
        }
      }
    }
  }

  if (unclosedCount === 0) {
    results.push({ ok: true, text: "字符串格式正确" });
  } else {
    results.push({ ok: "warn", text: `发现 ${unclosedCount} 个潜在问题` });
  }

  // 清除 spinner 并输出结果
  mainSpinner.clear();

  for (const r of results) {
    if (r.ok === true) {
      indent(`${c.green}✓${c.reset} ${r.text}`);
    } else if (r.ok === "warn") {
      indent(`${c.yellow}⚠${c.reset} ${r.text}`);
    } else {
      indent(`${c.red}✗${c.reset} ${r.text}`);
    }
  }

  // 总结
  log(barPrefix());

  if (allPassed && issues.length === 0) {
    indent(`${c.green}${c.bold}✓ 质量检查通过${c.reset}`);
  } else if (issues.length > 0 && allPassed) {
    indent(
      `${c.yellow}${c.bold}⚠ 发现 ${issues.length} 个潜在问题，但不影响编译${c.reset}`,
    );
  } else {
    indent(`${c.red}${c.bold}✗ 质量检查失败${c.reset}`);
    indent(`${c.dim}建议: 运行 'opencodenpm build' 查看详细错误${c.reset}`);
  }

  groupEnd();

  return allPassed;
}

module.exports = { run };
