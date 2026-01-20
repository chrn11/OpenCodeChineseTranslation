/**
 * 环境检查模块（跨平台）
 */

const { hasCommand, getCommandVersion, getPlatform, getOpencodeDir, getBinDir } = require("./utils.js");
const { step, success, error, warn, indent } = require("./colors.js");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const REQUIRED_BUN_VERSION = "1.3.5";

function checkNode() {
  try {
    const version = getCommandVersion("node", "--version");
    if (!version) return { ok: false, version: null };

    const match = version.match(/v(\d+)\.(\d+)/);
    if (!match) return { ok: false, version };

    const major = parseInt(match[1], 10);
    const ok = major >= 18;
    return { ok, version, required: ">=18.0.0" };
  } catch (e) {
    return { ok: false, version: null };
  }
}

function checkBun() {
  try {
    const version = getCommandVersion("bun", "--version");
    if (!version) return { ok: false, version: null };

    const isCorrectVersion = version === REQUIRED_BUN_VERSION;
    return {
      ok: true,
      version,
      isCorrectVersion,
      required: REQUIRED_BUN_VERSION,
    };
  } catch (e) {
    return { ok: false, version: null };
  }
}

function checkGit() {
  try {
    const raw = getCommandVersion("git", "--version");
    if (!raw) return { ok: false, version: null };
    // 从 "git version 2.50.1 (Apple Git-155)" 提取 "2.50.1"
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    const version = match ? match[1] : raw;
    return { ok: true, version };
  } catch (e) {
    return { ok: false, version: null };
  }
}

function findInstalledOpencode() {
  const { isWindows } = getPlatform();
  try {
    const cmd = isWindows ? "where opencode" : "which opencode";
    const result = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim()
      .split("\n")[0];
    if (result && fs.existsSync(result)) {
      return { installed: true, path: result };
    }
  } catch (e) {}
  return { installed: false, path: null };
}

/**
 * 检测 opencode 是否正在运行
 * @returns {{ running: boolean, processes: Array<{ pid: string, command: string }> }}
 */
function isOpencodeRunning() {
  const { isWindows } = getPlatform();
  try {
    if (isWindows) {
      const result = execSync('tasklist /FI "IMAGENAME eq opencode.exe" /FO CSV 2>nul', {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const lines = result.trim().split("\n").slice(1); // 跳过标题行
      const processes = lines
        .filter((line) => line.includes("opencode.exe"))
        .map((line) => {
          const parts = line.split(",");
          return { pid: parts[1]?.replace(/"/g, ""), command: "opencode.exe" };
        });
      return { running: processes.length > 0, processes };
    } else {
      // 使用 ps 获取更详细的进程信息
      const result = execSync("ps -eo pid,command | grep -E '^\\s*[0-9]+\\s+opencode' | grep -v grep", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const lines = result.trim().split("\n").filter(Boolean);
      const processes = lines.map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (match) {
          return { pid: match[1], command: match[2] };
        }
        return null;
      }).filter(Boolean);
      return { running: processes.length > 0, processes };
    }
  } catch (e) {
    return { running: false, processes: [] };
  }
}

function getHardwareModel() {
  const { isMac, isLinux, isWindows } = getPlatform();
  try {
    if (isMac) {
      const model = execSync("sysctl -n hw.model", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
      const chip = execSync("sysctl -n machdep.cpu.brand_string", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
      return { model, chip };
    }
    if (isLinux) {
      let model = "Linux";
      try {
        model = fs.readFileSync("/sys/devices/virtual/dmi/id/product_name", "utf8").trim();
      } catch (e) {
        try {
          const osRelease = fs.readFileSync("/etc/os-release", "utf8");
          const match = osRelease.match(/PRETTY_NAME="([^"]+)"/);
          if (match) model = match[1];
        } catch (e2) {}
      }
      return { model, chip: os.cpus()[0]?.model || "" };
    }
    if (isWindows) {
      const model = execSync("wmic computersystem get model", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
        .split("\n")[1]?.trim() || "Windows PC";
      return { model, chip: os.cpus()[0]?.model || "" };
    }
  } catch (e) {}
  return { model: null, chip: null };
}

async function checkEnvironment(options = {}) {
  const { silent = false } = options;

  if (!silent) {
    step("检查编译环境");
  }

  const results = {
    node: checkNode(),
    bun: checkBun(),
    git: checkGit(),
  };

  const missing = [];

  if (!results.node.ok) {
    missing.push("Node.js (需要 >=18.0.0)");
  } else if (!silent) {
    success(`Node.js ${results.node.version}`);
  }

  if (!results.bun.ok) {
    missing.push("Bun");
  } else if (!silent) {
    if (results.bun.isCorrectVersion) {
      success(`Bun ${results.bun.version}`);
    } else {
      warn(
        `Bun ${results.bun.version} (需要 ${results.bun.required}，当前版本可能导致构建失败)`,
      );
      indent(
        `安装指定版本: curl -fsSL https://bun.sh/install | bash -s "bun-v${results.bun.required}"`,
        2,
      );
    }
  }

  if (!results.git.ok) {
    missing.push("Git");
  } else if (!silent) {
    success(`Git ${results.git.version}`);
  }

  if (!silent) {
    const { platform, arch } = getPlatform();
    const platformNames = { darwin: "macOS", linux: "Linux", win32: "Windows" };
    const hw = getHardwareModel();
    const platformStr = `${platformNames[platform] || platform} ${arch}`;
    const modelStr = hw.model ? ` (${hw.model})` : "";
    indent(`平台: ${platformStr}${modelStr}`, 2);
    if (hw.chip) {
      indent(`芯片: ${hw.chip}`, 2);
    }

    const opencode = findInstalledOpencode();
    const runningInfo = isOpencodeRunning();
    if (opencode.installed) {
      success(`OpenCode 已安装${runningInfo.running ? ' (🟢 运行中)' : ''}`);
      indent(`安装路径: ${opencode.path}`, 2);
    } else {
      warn("OpenCode 未安装");
      indent("完成构建后运行: opencodenpm deploy", 2);
    }
  }

  if (missing.length > 0) {
    if (!silent) {
      error(`缺少必要工具: ${missing.join(", ")}`);
      if (!results.bun?.ok) {
        indent("安装 Bun: curl -fsSL https://bun.sh/install | bash", 2);
      }
    }
    return { ok: false, missing, results };
  }

  return { ok: true, missing: [], results };
}

function getBunPath() {
  const possiblePaths = [
    path.join(os.homedir(), ".bun", "bin", "bun"),
    "/usr/local/bin/bun",
    "/opt/homebrew/bin/bun",
    path.join(os.homedir(), ".local", "bin", "bun"),
  ];

  for (const bunPath of possiblePaths) {
    if (fs.existsSync(bunPath)) {
      return bunPath;
    }
  }

  // 从 PATH 获取
  try {
    const result = require("child_process")
      .execSync("which bun", { encoding: "utf-8" })
      .trim();
    if (result) return result;
  } catch (e) {}

  return null;
}

module.exports = {
  checkNode,
  checkBun,
  checkGit,
  checkEnvironment,
  getBunPath,
  isOpencodeRunning,
};
