/**
 * deploy 命令
 * 部署 opencode 到全局（跨平台）
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const readline = require("readline");
const p = require("@clack/prompts");
const {
  getBinDir,
  getOpencodeDir,
  getPlatform,
  getOpencodeConfigPath,
  ensureDir,
} = require("../core/utils.js");
const {
  step,
  success,
  error,
  warn,
  indent,
  blank,
} = require("../core/colors.js");
const { isOpencodeRunning } = require("../core/env.js");

function getBuildPlatform() {
  const { platform, arch } = getPlatform();
  const platformMap = {
    darwin: `darwin-${arch}`,
    linux: "linux-x64",
    win32: "windows-x64",
  };
  return platformMap[platform] || "linux-x64";
}

function getCompiledBinary() {
  const platform = getBuildPlatform();
  const ext = platform.startsWith("windows") ? ".exe" : "";
  const binaryName = `opencode${ext}`;

  const binDir = getBinDir();
  const localBinary = path.join(binDir, binaryName);
  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  const opencodeDir = getOpencodeDir();
  const distBinary = path.join(
    opencodeDir,
    "packages",
    "opencode",
    "dist",
    `opencode-${platform}`,
    "bin",
    binaryName,
  );
  if (fs.existsSync(distBinary)) {
    return distBinary;
  }

  warn(`未找到平台 ${platform} 的构建产物`);
  indent(`期望路径: ${distBinary}`);
  return null;
}

function findExistingOpencode() {
  const { isWindows } = getPlatform();
  try {
    const cmd = isWindows ? "where opencode" : "which opencode";
    const result = execSync(cmd, { encoding: "utf8" }).trim().split("\n")[0];
    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch (e) {
    // 忽略
  }
  return null;
}

function getDefaultInstallPath() {
  const { isWindows, isMac } = getPlatform();
  const ext = isWindows ? ".exe" : "";

  if (isWindows) {
    return path.join(process.env.APPDATA || "", "npm", `opencode${ext}`);
  }
  if (isMac) {
    if (fs.existsSync("/opt/homebrew/bin")) {
      return path.join("/opt/homebrew/bin", "opencode");
    }
    return path.join("/usr/local/bin", "opencode");
  }
  return path.join(os.homedir(), ".local", "bin", "opencode");
}

function deploy(binaryPath) {
  const { isWindows } = getPlatform();
  const existingPath = findExistingOpencode();
  let targetPath;

  if (existingPath) {
    targetPath = existingPath;
    indent(`检测到已安装: ${existingPath}`);
  } else {
    targetPath = getDefaultInstallPath();
    ensureDir(path.dirname(targetPath));
  }

  try {
    fs.copyFileSync(binaryPath, targetPath);
    if (!isWindows) {
      fs.chmodSync(targetPath, 0o755);
    }
    success(`已部署到: ${targetPath}`);
    return targetPath;
  } catch (e) {
    if (e.code === "EACCES" || e.code === "EPERM") {
      if (isWindows) {
        error("部署失败，请以管理员身份运行");
        return null;
      }
      indent(`需要管理员权限...`);
      try {
        execSync(
          `sudo cp "${binaryPath}" "${targetPath}" && sudo chmod 755 "${targetPath}"`,
          { stdio: "inherit" },
        );
        success(`已部署到: ${targetPath}`);
        return targetPath;
      } catch (sudoError) {
        error("部署失败，请手动执行:");
        indent(`  sudo cp "${binaryPath}" "${targetPath}"`);
        return null;
      }
    }
    throw e;
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function confirmAction(message) {
  if (!process.stdout.isTTY) {
    const answer = await askQuestion(message);
    return answer === "y" || answer === "yes";
  }
  const answer = await p.confirm({ message, initialValue: false });
  if (p.isCancel(answer)) {
    p.cancel("Cancelled");
    return null;
  }
  return answer;
}

function checkAutoupdateConfig() {
  const configPath = getOpencodeConfigPath();
  if (!fs.existsSync(configPath)) {
    return { exists: false, hasAutoupdate: false };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { exists: true, hasAutoupdate: config.autoupdate === false };
  } catch (e) {
    return { exists: true, hasAutoupdate: false };
  }
}

function setAutoupdateConfig() {
  const configPath = getOpencodeConfigPath();
  let config = {};

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      config = {};
    }
  }

  config.autoupdate = false;
  ensureDir(path.dirname(configPath));
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  return configPath;
}

async function promptAutoupdateConfig() {
  const { hasAutoupdate } = checkAutoupdateConfig();
  if (hasAutoupdate) {
    return;
  }

  const configPath = getOpencodeConfigPath();
  blank();
  warn("💡 提示: 如需禁用版本更新提示");
  indent(`配置文件: ${configPath}`);
  indent(`添加配置: "autoupdate": false`);
  blank();

  const shouldWrite = await confirmAction("   是否自动添加此配置? (y/n): ");
  if (shouldWrite) {
    const savedPath = setAutoupdateConfig();
    success(`已添加配置: ${savedPath}`);
  }
}

async function run(options = {}) {
  step("部署 opencode");

  const runningInfo = isOpencodeRunning();
  if (runningInfo.running) {
    const { processes } = runningInfo;
    const { isWindows } = getPlatform();
    warn("⚠️  检测到 OpenCode 正在运行！");
    indent("以下进程可能阻止部署:");
    for (const proc of processes) {
      indent(`  PID ${proc.pid}: ${proc.command}`, 2);
    }
    blank();
    const shouldKill = await confirmAction("   是否终止进程并继续部署? (y/n): ");
    if (!shouldKill) {
      indent("已取消部署", 2);
      return false;
    }
    // 强制终止进程
    const pids = processes.map((p) => p.pid).join(" ");
    try {
      if (isWindows) {
        execSync(`taskkill /F /PID ${pids.split(" ").join(" /PID ")}`, { stdio: "pipe" });
      } else {
        execSync(`kill -9 ${pids}`, { stdio: "pipe" });
      }
      success("已终止相关进程");
    } catch (e) {
      warn("部分进程可能已退出，继续部署...");
    }
  }

  const binaryPath = getCompiledBinary();
  if (!binaryPath) {
    error("未找到编译产物，请先运行: opencodenpm build");
    return false;
  }

  indent(`源文件: ${binaryPath}`);

  try {
    const result = deploy(binaryPath);
    if (result) {
      blank();
      indent("运行 opencode 启动");

      await promptAutoupdateConfig();
    }
    return !!result;
  } catch (e) {
    error(`部署失败: ${e.message}`);
    return false;
  }
}

module.exports = { run, getCompiledBinary };
