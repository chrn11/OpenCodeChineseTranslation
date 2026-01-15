/**
 * 交互式菜单模块
 * 使用 Inquirer.js 实现跨平台交互界面
 */

const inquirer = require('inquirer');
const { existsSync } = require('node:fs');
const { execSync } = require('node:child_process');
const { getProjectDir, getOpencodeDir, getI18nDir } = require('./utils.js');
const { step, success, warn, error, log } = require('./colors.js');

// 导入功能模块
const updateCmd = require('../commands/update.js');
const applyCmd = require('../commands/apply.js');
const buildCmd = require('../commands/build.js');
const verifyCmd = require('../commands/verify.js');
const launchCmd = require('../commands/launch.js');
const helperCmd = require('../commands/helper.js');
const packageCmd = require('../commands/package.js');
const deployCmd = require('../commands/deploy.js');
const { cleanRepo } = require('../core/git.js');

/**
 * 检查脚本是否有更新
 * git rev-list --left-right main...@{u} 返回: "领先数\t落后数"
 * 例如: "3\t0" = 本地领先3个提交, "0\t1" = 远程有1个新提交
 */
async function checkScriptUpdate() {
  try {
    const result = execSync('git rev-list --count --left-right main...@{u}', {
      cwd: getProjectDir(),
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    const [ahead, behind] = result.trim().split('\t').map(Number);
    return { ahead, behind, hasUpdate: behind > 0 };
  } catch (e) {
    return { ahead: 0, behind: 0, hasUpdate: false };
  }
}

/**
 * 检查 OpenCode 源码是否有更新
 */
async function checkSourceUpdate() {
  const opencodeDir = getOpencodeDir();

  if (!existsSync(opencodeDir)) {
    return { hasUpdate: false, localCommit: null, remoteCommit: null };
  }

  try {
    // 获取本地最新提交
    const localCommit = execSync('git rev-parse HEAD', {
      cwd: opencodeDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    // 获取远程最新提交
    const remoteCommit = execSync('git rev-parse @{u}', {
      cwd: opencodeDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    const hasUpdate = localCommit !== remoteCommit;
    return { hasUpdate, localCommit, remoteCommit };
  } catch (e) {
    return { hasUpdate: false, localCommit: null, remoteCommit: null };
  }
}

/**
 * 获取项目状态信息
 */
async function getProjectStatus() {
  const opencodeDir = getOpencodeDir();
  const i18nDir = getI18nDir();

  const status = {
    opencodeExists: existsSync(opencodeDir),
    i18nExists: existsSync(i18nDir),
    scriptUpdate: await checkScriptUpdate(),
    sourceUpdate: await checkSourceUpdate(),
  };

  return status;
}

/**
 * 显示主菜单
 */
async function showMainMenu() {
  const status = await getProjectStatus();

  // 构建状态提示
  const statusLines = [];
  statusLines.push(`=== OpenCode 汉化管理工具 ===`);

  if (status.scriptUpdate.hasUpdate) {
    statusLines.push(`[!] 脚本有更新可用 (落后 ${status.scriptUpdate.behind} 个提交)`);
  } else if (status.scriptUpdate.ahead > 0) {
    statusLines.push(`[i] 本地有 ${status.scriptUpdate.ahead} 个未推送提交`);
  }
  if (status.sourceUpdate.hasUpdate) {
    statusLines.push(`[!] 源码有更新可用`);
  }

  statusLines.push(`源码目录: ${status.opencodeExists ? '[OK]' : '[--]'}`);
  statusLines.push(`汉化目录: ${status.i18nExists ? '[OK]' : '[--]'}`);
  statusLines.push('');

  const choices = [
    { name: '[>>] 一键汉化全流程', value: 'full' },
    { name: '[DL] 更新源码', value: 'update' },
    { name: '[RS] 恢复源码', value: 'restore' },
    { name: '[AP] 应用汉化', value: 'apply' },
    { name: '[CK] 验证汉化', value: 'verify' },
    { name: '[BD] 编译', value: 'build' },
    { name: '[DP] 部署 opencode 命令', value: 'deploy' },
    new inquirer.Separator(),
    { name: '[PK] 打包三端', value: 'package-all' },
    { name: '[GO] 启动 OpenCode', value: 'launch' },
    { name: '[ZH] 智谱助手', value: 'helper' },
    new inquirer.Separator(),
    { name: '[UP] 更新脚本', value: 'update-script' },
    { name: '[ENV] 检查环境', value: 'env' },
    { name: '[CFG] 显示配置', value: 'config' },
    new inquirer.Separator(),
    { name: '[XX] 退出', value: 'exit' },
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: statusLines.join('\n'),
      choices,
    },
  ]);

  return action;
}

/**
 * 执行完整工作流
 */
async function runFullWorkflow() {
  step('开始完整工作流...');

  // 1. 更新源码
  step('[1/4] 更新 OpenCode 源码');
  await updateCmd.run({});

  // 2. 应用汉化
  step('[2/4] 应用汉化配置');
  await applyCmd.run({});

  // 3. 验证
  step('[3/4] 验证汉化配置');
  await verifyCmd.run({});

  // 4. 编译
  step('[4/4] 编译构建');
  await buildCmd.run({});

  success('完整工作流执行完成!');
}

/**
 * 更新脚本
 */
async function updateScript() {
  step('更新脚本到最新版本...');
  try {
    execSync('git pull --ff-only', {
      cwd: getProjectDir(),
      stdio: 'inherit',
    });
    success('脚本已更新，请重新运行命令');
    process.exit(0);
  } catch (e) {
    error('更新失败，可能存在本地修改');
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '是否强制覆盖本地修改?',
        default: false,
      },
    ]);

    if (confirm) {
      execSync('git reset --hard @{u}', {
        cwd: getProjectDir(),
        stdio: 'inherit',
      });
      success('脚本已强制更新，请重新运行命令');
      process.exit(0);
    }
  }
}

/**
 * 运行菜单循环
 */
async function run() {
  log('\n欢迎使用 OpenCode 汉化管理工具\n', 'cyan');

  while (true) {
    try {
      const action = await showMainMenu();

      switch (action) {
        case 'full':
          await runFullWorkflow();
          break;
        case 'update':
          await updateCmd.run({});
          break;
        case 'restore':
          await cleanRepo(getOpencodeDir());
          break;
        case 'apply':
          await applyCmd.run({});
          break;
        case 'build':
          await buildCmd.run({});
          break;
        case 'verify':
          await verifyCmd.run({ detailed: true });
          break;
        case 'launch':
          await launchCmd.run({});
          break;
        case 'deploy':
          await deployCmd.run({});
          break;
        case 'package-all':
          await packageCmd.run({ all: true });
          break;
        case 'helper':
          const { helperAction } = await inquirer.prompt([
            {
              type: 'list',
              name: 'helperAction',
              message: '智谱助手操作:',
              choices: [
                { name: '[1] 安装/更新 智谱助手', value: 'install' },
                { name: '[2] 启动 智谱助手', value: 'launch' },
              ],
            },
          ]);
          if (helperAction === 'install') {
            await helperCmd.install({});
          } else {
            await helperCmd.launch([]);
          }
          break;
        case 'update-script':
          await updateScript();
          return; // 更新后退出
        case 'env':
          await require('./env.js').checkEnvironment();
          break;
        case 'config':
          const { getProjectDir, getOpencodeDir, getI18nDir, getBinDir } = require('./utils.js');
          log('\n项目配置:', 'cyan');
          log(`  项目目录: ${getProjectDir()}`);
          log(`  源码目录: ${getOpencodeDir()}`);
          log(`  汉化目录: ${getI18nDir()}`);
          log(`  输出目录: ${getBinDir()}`);
          break;
        case 'exit':
          log('\n再见!\n');
          return;
      }

      // 操作后暂停，让用户看到结果
      const { cont } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'cont',
          message: '按 Enter 继续...',
          default: true,
        },
      ]);
    } catch (e) {
      error(e.message);
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: '是否返回主菜单?',
          default: true,
        },
      ]);
      if (!retry) return;
    }
  }
}

module.exports = { run };
