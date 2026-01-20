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

  // 工具版本
  const nodeStatus = node.ok ? color.green("✓") : color.red("✗");
  const bunStatus = bun.ok
    ? bun.isCorrectVersion
      ? color.green("✓")
      : color.yellow("⚠")
    : color.red("✗");
  const gitStatus = git.ok ? color.green("✓") : color.red("✗");

  p.log.message(
    `${nodeStatus} Node ${color.dim(node.version || "未安装")}   ${bunStatus} Bun ${color.dim(bun.version || "未安装")}   ${gitStatus} Git`,
    { symbol: color.green("◇") },
  );

  // 硬件信息
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
  p.log.message(`设备信息  ${color.dim(hwInfo)}`, {
    symbol: color.magenta("◆"),
  });

  // OpenCode
  const running = isOpencodeRunning();
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

  if (ocPath && fs.existsSync(ocPath)) {
    const status = running ? color.green("运行中") : color.dim("已停止");
    const clickable = makeClickable(color.dim(ocPath), path.dirname(ocPath));
    p.log.success(`OpenCode ${status}  ${clickable}`);
  } else {
    p.log.warn(
      `OpenCode ${color.yellow("未安装")} ${color.dim("→ 运行 deploy")}`,
    );
  }

  // 构建产物
  const distPath = getDistPath();
  const distDir = getDistDir();
  if (exists(distPath)) {
    const clickable = makeClickable(
      color.dim(`dist/opencode-${getBuildPlatform()}`),
      distDir,
    );
    p.log.success(`构建产物 ${color.green("已生成")}  ${clickable}`);
  } else {
    p.log.warn(
      `构建产物 ${color.yellow("未生成")} ${color.dim("→ 运行 build")}`,
    );
  }
}

const MENU_OPTIONS = [
  { value: "full", label: "🚀 一键汉化", hint: "同步 → 汉化 → 编译 → 部署" },
  { value: "sync", label: "🔄 同步官方", hint: "拉取最新代码" },
  { value: "apply", label: "🌐 应用汉化", hint: "AI 翻译 + 替换源码" },
  { value: "incremental", label: "⚡ 增量翻译", hint: "只翻译 git 变更文件" },
  { value: "build", label: "🔨 编译构建", hint: "生成可执行文件" },
  { value: "deploy", label: "📦 部署系统", hint: "安装到 PATH" },
  { value: "quality", label: "🔍 质量检查", hint: "AI 审查翻译质量" },
  { value: "check", label: "📋 遗漏扫描", hint: "检查未翻译文本" },
  { value: "exit", label: "👋 退出" },
];

const NEXT_STEP_MAP = {
  sync: {
    recommended: "apply",
    options: [
      { value: "apply", label: "🌐 应用汉化" },
      { value: "incremental", label: "⚡ 增量翻译" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  apply: {
    recommended: "build",
    options: [
      { value: "build", label: "🔨 编译构建" },
      { value: "quality", label: "🔍 质量检查" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  incremental: {
    recommended: "build",
    options: [
      { value: "build", label: "🔨 编译构建" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  build: {
    recommended: "deploy",
    options: [
      { value: "deploy", label: "📦 部署系统" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  deploy: {
    recommended: "menu",
    options: [
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  full: {
    recommended: "exit",
    options: [
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  quality: {
    recommended: "menu",
    options: [
      { value: "apply", label: "🌐 应用汉化" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
  check: {
    recommended: "apply",
    options: [
      { value: "apply", label: "🌐 应用汉化" },
      { value: "menu", label: "📋 返回菜单" },
      { value: "exit", label: "👋 退出" },
    ],
  },
};

async function runCommand(cmd) {
  console.log("");

  try {
    switch (cmd) {
      case "full":
        await fullCmd.run({ auto: false });
        break;
      case "sync":
        await syncCmd.run({});
        break;
      case "apply":
        await applyCmd.run({});
        break;
      case "incremental":
        await applyCmd.run({ incremental: true });
        break;
      case "build":
        await buildCmd.run({});
        break;
      case "deploy":
        await deployCmd.run({});
        break;
      case "quality":
        const translator = new Translator();
        await translator.showQualityReport();
        break;
      case "check":
        await checkCmd.run({ verbose: false });
        break;
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

  console.log("");

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

  await runCommand(action);

  let nextAction = await askNextStep(action);

  while (nextAction !== "menu" && nextAction !== "exit") {
    await runCommand(nextAction);
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
