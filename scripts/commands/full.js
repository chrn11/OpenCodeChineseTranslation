/**
 * full 命令
 * 完整工作流：检查源码 → 更新 → 恢复纯净 → 汉化 → 验证 → 编译 → 部署
 */

const p = require("@clack/prompts");
const color = require("picocolors");
const {
  step,
  success,
  error,
  warn,
  indent,
  blank,
} = require("../core/colors.js");
const { existsSync } = require("fs");
const { execSync } = require("child_process");
const { cleanRepo, isGitRepo } = require("../core/git.js");
const { getOpencodeDir } = require("../core/utils.js");
const updateCmd = require("./update.js");
const applyCmd = require("./apply.js");
const verifyCmd = require("./verify.js");
const buildCmd = require("./build.js");
const deployCmd = require("./deploy.js");

function checkSourceUpdate() {
  const opencodeDir = getOpencodeDir();

  if (!existsSync(opencodeDir) || !isGitRepo(opencodeDir)) {
    return { hasUpdate: false, exists: false };
  }

  try {
    const localCommit = execSync("git rev-parse HEAD", {
      cwd: opencodeDir,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();

    const remoteCommit = execSync("git rev-parse @{u}", {
      cwd: opencodeDir,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();

    return {
      exists: true,
      hasUpdate: localCommit !== remoteCommit,
      localCommit: localCommit.slice(0, 8),
      remoteCommit: remoteCommit.slice(0, 8),
    };
  } catch {
    return { exists: true, hasUpdate: false };
  }
}

function hasLocalChanges() {
  const opencodeDir = getOpencodeDir();

  if (!existsSync(opencodeDir) || !isGitRepo(opencodeDir)) {
    return false;
  }

  try {
    const result = execSync("git status --porcelain", {
      cwd: opencodeDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

async function run(options = {}) {
  const { auto = false } = options;

  blank();
  p.intro(color.bgCyan(color.black(" 🚀 一键汉化全流程 ")));

  // 步骤 1: 检查源码状态
  step("步骤 1/7: 检查源码状态");
  const sourceStatus = checkSourceUpdate();

  if (!sourceStatus.exists) {
    warn("源码不存在，需要克隆");

    let confirm = true;
    if (!auto) {
      const result = await p.confirm({
        message: "是否克隆 OpenCode 源码?",
        initialValue: true,
      });
      if (p.isCancel(result)) {
        p.cancel("已取消");
        return false;
      }
      confirm = result;
    }

    if (!confirm) {
      error("已取消");
      return false;
    }

    await updateCmd.run({ nested: true });
  } else {
    indent(`源码目录: ${getOpencodeDir()}`);

    if (sourceStatus.hasUpdate) {
      indent(`本地版本: ${sourceStatus.localCommit}`);
      indent(`远程版本: ${sourceStatus.remoteCommit}`);
      warn("源码有更新可用");

      let shouldUpdate = true;
      if (!auto) {
        const result = await p.confirm({
          message: "是否更新到最新版本?",
          initialValue: true,
        });
        if (p.isCancel(result)) {
          p.cancel("已取消");
          return false;
        }
        shouldUpdate = result;
      }

      if (shouldUpdate) {
        await updateCmd.run({ nested: true });
      }
    } else {
      success("源码已是最新");
    }
  }
  blank();

  // 步骤 2: 检查本地修改
  step("步骤 2/7: 检查本地修改");
  if (hasLocalChanges()) {
    warn("检测到本地修改，将恢复到纯净状态");
  } else {
    success("源码纯净，无修改");
  }
  blank();

  // 步骤 3: 恢复纯净
  step("步骤 3/7: 恢复源码到纯净状态");
  await cleanRepo(getOpencodeDir());
  blank();

  // 步骤 4: 应用汉化
  step("步骤 4/7: 应用汉化");
  await applyCmd.run({ silent: false, nested: true });
  blank();

  // 步骤 5: 验证汉化
  step("步骤 5/7: 验证汉化结果");
  await verifyCmd.run({ nested: true });
  blank();

  // 步骤 6: 编译构建
  step("步骤 6/7: 编译构建");

  let shouldBuild = true;
  if (!auto) {
    const result = await p.confirm({
      message: "是否编译 OpenCode?",
      initialValue: true,
    });
    if (p.isCancel(result)) {
      p.cancel("已取消");
      return false;
    }
    shouldBuild = result;
  }

  if (shouldBuild) {
    await buildCmd.run({});
    blank();

    // 步骤 7: 部署全局命令
    step("步骤 7/7: 部署全局命令");

    let shouldDeploy = true;
    if (!auto) {
      const result = await p.confirm({
        message: "是否部署 opencode 全局命令?",
        initialValue: true,
      });
      if (p.isCancel(result)) {
        p.cancel("已取消");
        return false;
      }
      shouldDeploy = result;
    }

    if (shouldDeploy) {
      await deployCmd.run({});
    } else {
      indent("跳过部署");
    }
  } else {
    indent("跳过编译");
    blank();

    // 步骤 7: 显示跳过
    step("步骤 7/7: 部署全局命令");
    indent("跳过（未编译）");
  }

  blank();
  p.outro(color.green("✓ 汉化流程完成！"));

  return true;
}

module.exports = { run };
