/**
 * 交互式菜单 - 使用 @clack/prompts
 */

const p = require("@clack/prompts");
const fs = require("fs");
const path = require("path");
const color = require("picocolors");
const {
  getOpencodeDir,
  getI18nDir,
  exists,
  getPlatform,
} = require("./utils.js");
const { isOpencodeRunning } = require("./env.js");
const {
  blank,
  padLabel,
  statusBadge,
  groupStart,
  groupEnd,
  kv,
  indent,
} = require("./colors.js");

const updateCmd = require("../commands/update.js");
const applyCmd = require("../commands/apply.js");
const buildCmd = require("../commands/build.js");
const verifyCmd = require("../commands/verify.js");
const fullCmd = require("../commands/full.js");
const deployCmd = require("../commands/deploy.js");
const syncCmd = require("../commands/sync.js");
const checkCmd = require("../commands/check.js");
const Translator = require("./translator.js");

function getVersionInfo() {
  try {
    const configPath = path.join(getI18nDir(), "config.json");
    if (exists(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.opencodeVersion) {
        return {
          official: config.opencodeVersion,
          zh: config.version || `${config.opencodeVersion}-zh`,
        };
      }
    }
  } catch (e) {}

  try {
    const pkgPath = path.join(
      getOpencodeDir(),
      "packages",
      "opencode",
      "package.json",
    );
    if (exists(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      return { official: pkg.version, zh: `${pkg.version}-zh` };
    }
  } catch (e) {}

  return { official: null, zh: "未知版本" };
}

function getBuildPlatform() {
  const { platform, arch } = getPlatform();
  const map = {
    darwin: `darwin-${arch}`,
    linux: "linux-x64",
    win32: "windows-x64",
  };
  return map[platform] || "linux-x64";
}

function getDistPath() {
  const plt = getBuildPlatform();
  const ext = plt.startsWith("windows") ? ".exe" : "";
  return path.join(
    getOpencodeDir(),
    "packages",
    "opencode",
    "dist",
    `opencode-${plt}`,
    "bin",
    `opencode${ext}`,
  );
}

function getDistDir() {
  return path.join(
    getOpencodeDir(),
    "packages",
    "opencode",
    "dist",
    `opencode-${getBuildPlatform()}`,
  );
}

function makeClickable(text, filePath) {
  return `\x1b]8;;file://${filePath}\x07${text}\x1b]8;;\x07`;
}

function showEnvInfo() {
  const { checkNode, checkBun, checkGit } = require("./env.js");
  const { execSync } = require("child_process");

  const node = checkNode();
  const bun = checkBun();
  const git = checkGit();
  const { platform, arch, isMac, isWindows } = getPlatform();
  const platformNames = { darwin: "macOS", linux: "Linux", win32: "Windows" };

  groupStart("系统环境");

  const nodeStatus = node.ok ? "success" : "error";
  kv(
    padLabel("Node", 10),
    `${statusBadge(nodeStatus)}  ${node.version ? color.dim(node.version) : color.red("未安装")}`,
  );

  const bunStatus = bun.ok
    ? bun.isCorrectVersion
      ? "success"
      : "warn"
    : "error";
  kv(
    padLabel("Bun", 10),
    `${statusBadge(bunStatus)}  ${bun.version ? color.dim(bun.version) : color.red("未安装")}`,
  );

  const gitStatus = git.ok ? "success" : "error";
  kv(
    padLabel("Git", 10),
    `${statusBadge(gitStatus)}  ${git.ok ? color.dim("已安装") : color.red("未安装")}`,
  );

  let hwInfo = `${platformNames[platform] || platform} ${arch}`;
  try {
    if (isMac) {
      const model = execSync("sysctl -n hw.model", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      const chip = execSync("sysctl -n machdep.cpu.brand_string", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      hwInfo = `${model} · ${chip}`;
    }
  } catch (e) {}
  kv(padLabel("设备信息", 10), `${statusBadge("info")}  ${color.dim(hwInfo)}`);

  groupEnd();

  groupStart("运行状态");

  const runningInfo = isOpencodeRunning();
  let ocPath = null;
  try {
    const cmd = isWindows ? "where opencode" : "which opencode";
    ocPath = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim()
      .split("\n")[0];
  } catch (e) {}

  let recommend = null;

  if (ocPath && fs.existsSync(ocPath)) {
    const status = runningInfo.running ? color.green("运行中") : color.dim("已停止");
    const clickable = makeClickable(color.dim(ocPath), path.dirname(ocPath));
    kv(padLabel("OpenCode", 10), `${status}  ${clickable}`);
  } else {
    kv(
      padLabel("OpenCode", 10),
      `${color.yellow("未安装")} ${color.dim("→ 运行 deploy")}`,
    );
    recommend = "运行 deploy";
  }

  const distPath = getDistPath();
  const distDir = getDistDir();
  if (exists(distPath)) {
    const clickable = makeClickable(
      color.dim(`dist/opencode-${getBuildPlatform()}`),
      distDir,
    );
    kv(padLabel("构建产物", 10), `${color.green("已生成")}  ${clickable}`);
  } else {
    kv(
      padLabel("构建产物", 10),
      `${color.yellow("未生成")} ${color.dim("→ 运行 build")}`,
    );
    if (!recommend) recommend = "运行 build";
  }

  if (!recommend) recommend = "无需操作";

  kv(padLabel("推荐", 10), color.cyan(recommend));

  groupEnd();

  groupStart("项目信息");

  kv(padLabel("作者", 10), color.dim("xiaolajiao"));
  kv(
    padLabel("GitHub", 10),
    color.dim("https://github.com/xiaolajiao/OpenCodeChineseTranslation"),
  );
  kv(padLabel("汉化版本", 10), color.green(getVersionInfo().zh));

  groupEnd();
}

const MENU_OPTIONS = [
  { value: "full", label: "🚀 一键汉化", hint: "自动化执行所有步骤" },
  { value: "sync", label: "🔄 同步官方", hint: "获取最新上游代码" },
  { value: "apply", label: "🌐 应用汉化", hint: "执行翻译 (支持增量)" },
  { value: "build", label: "🔨 编译部署", hint: "编译并安装到系统" },
  { value: "check", label: "🔍 检查翻译", hint: "诊断翻译遗漏与质量" },
  { value: "exit", label: "👋 退出程序" },
];

const NEXT_STEP_MAP = {
  sync: {
    recommended: "apply",
    options: [
      { value: "apply", label: "🌐 立即应用汉化" },
      { value: "menu", label: "📋 返回主菜单" },
      { value: "exit", label: "👋 退出程序" },
    ],
  },
  apply: {
    recommended: "build",
    options: [
      { value: "build", label: "🔨 立即编译部署" },
      { value: "check", label: "🔍 检查翻译质量" },
      { value: "menu", label: "📋 返回主菜单" },
      { value: "exit", label: "👋 退出程序" },
    ],
  },
  build: {
    recommended: "exit",
    options: [
      { value: "exit", label: "👋 退出 (试用新版)" },
      { value: "menu", label: "📋 返回主菜单" },
    ],
  },
  full: {
    recommended: "exit",
    options: [
      { value: "exit", label: "👋 退出程序" },
      { value: "menu", label: "📋 返回主菜单" },
    ],
  },
  check: {
    recommended: "apply",
    options: [
      { value: "apply", label: "🌐 修复/应用汉化" },
      { value: "menu", label: "📋 返回主菜单" },
      { value: "exit", label: "👋 退出程序" },
    ],
  },
};

async function showApplySubMenu() {
  const mode = await p.select({
    message: "选择翻译模式",
    options: [
      { value: "full", label: "🌐 全量翻译", hint: "扫描所有文件" },
      { value: "incremental", label: "⚡ 增量翻译", hint: "仅 git 变更文件" },
      { value: "back", label: "← 返回" },
    ],
    initialValue: "full",
  });

  if (p.isCancel(mode) || mode === "back") {
    return "back";
  }

  blank();

  if (mode === "full") {
    await applyCmd.run({});
  } else {
    await applyCmd.run({ incremental: true });
  }

  return "success";
}

async function showBuildSubMenu() {
  const action = await p.select({
    message: "选择操作",
    options: [
      { value: "both", label: "🔨 编译 + 部署", hint: "推荐" },
      { value: "build", label: "📦 仅编译", hint: "生成可执行文件" },
      { value: "deploy", label: "🚀 仅部署", hint: "安装到系统 PATH" },
      { value: "back", label: "← 返回" },
    ],
    initialValue: "both",
  });

  if (p.isCancel(action) || action === "back") {
    return "back";
  }

  blank();

  if (action === "both" || action === "build") {
    await buildCmd.run({});
  }

  if (action === "both" || action === "deploy") {
    if (action === "both") blank();
    await deployCmd.run({});
  }

  return "success";
}

async function showCheckSubMenu() {
  const action = await p.select({
    message: "选择检查类型",
    options: [
      { value: "quality", label: "🔍 质量检查", hint: "AI 审查翻译质量" },
      { value: "missing", label: "📋 遗漏扫描", hint: "检查未翻译文本" },
      { value: "back", label: "← 返回" },
    ],
    initialValue: "quality",
  });

  if (p.isCancel(action) || action === "back") {
    return "back";
  }

  blank();

  if (action === "quality") {
    const translator = new Translator();
    await translator.showQualityReport();
  } else {
    await checkCmd.run({ verbose: false });
  }

  return "success";
}

async function runCommand(cmd) {
  blank();

  try {
    switch (cmd) {
      case "full":
        await fullCmd.run({ auto: false });
        break;
      case "sync":
        await syncCmd.run({});
        break;
      case "apply": {
        const result = await showApplySubMenu();
        if (result === "back") return "menu";
        break;
      }
      case "build": {
        const result = await showBuildSubMenu();
        if (result === "back") return "menu";
        break;
      }
      case "check": {
        const result = await showCheckSubMenu();
        if (result === "back") return "menu";
        break;
      }
      case "exit":
        p.outro(color.cyan("🐰 再见~ 下次见！"));
        process.exit(0);
      case "menu":
        return "menu";
    }
    return "success";
  } catch (e) {
    p.log.error(`执行失败: ${e.message}`);
    return "error";
  }
}

async function askNextStep(currentCmd) {
  const config = NEXT_STEP_MAP[currentCmd] || {
    recommended: "menu",
    options: [
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  };

  blank();

  const next = await p.select({
    message: "下一步",
    options: config.options,
    initialValue: config.recommended,
  });

  if (p.isCancel(next)) {
    p.cancel("已取消");
    process.exit(0);
  }

  return next;
}

async function showMenu() {
  console.clear();

  const versionInfo = getVersionInfo();
  const officialVersion = versionInfo.official || "未同步";

  p.intro(
    color.bgCyan(color.black(` 🐰 OpenCode 汉化工具 v${officialVersion} `)),
  );

  showEnvInfo();

  const action = await p.select({
    message: "",
    options: MENU_OPTIONS,
    initialValue: "full",
  });

  if (p.isCancel(action)) {
    p.cancel("已取消");
    process.exit(0);
  }

  if (action === "exit") {
    p.outro(color.cyan("🐰 再见~ 下次见！"));
    process.exit(0);
  }

  const result = await runCommand(action);

  if (result === "menu") {
    await showMenu();
    return;
  }

  let nextAction = await askNextStep(action);

  while (nextAction !== "menu" && nextAction !== "exit") {
    const cmdResult = await runCommand(nextAction);
    if (cmdResult === "menu") {
      await showMenu();
      return;
    }
    nextAction = await askNextStep(nextAction);
  }

  if (nextAction === "menu") {
    await showMenu();
  } else {
    p.outro(color.cyan("🐰 再见~ 下次见！"));
  }
}

async function run() {
  await showMenu();
}

module.exports = { run };
