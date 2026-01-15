/**
 * 环境检查模块
 * 检查 Node.js、Bun、Git 等必要工具
 */

const { hasCommand, getCommandVersion, getPlatform } = require('./utils.js');
const { step, success, error, warn, indent } = require('./colors.js');

/**
 * 检查 Node.js 版本
 */
function checkNode() {
  try {
    const version = getCommandVersion('node', '--version');
    if (!version) return { ok: false, version: null };

    const match = version.match(/v(\d+)\.(\d+)/);
    if (!match) return { ok: false, version };

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);

    // Node.js >= 18.0.0
    const ok = major > 18 || (major === 18 && minor >= 0);
    return { ok, version, required: '>=18.0.0' };
  } catch (e) {
    return { ok: false, version: null };
  }
}

/**
 * 检查 Bun
 */
function checkBun() {
  try {
    const version = getCommandVersion('bun', '--version');
    if (!version) return { ok: false, version: null };

    // bun 版本格式如 "1.3.6"
    const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      return { ok: true, version };
    }
    return { ok: true, version };
  } catch (e) {
    return { ok: false, version: null };
  }
}

/**
 * 检查 Git
 */
function checkGit() {
  try {
    const version = getCommandVersion('git', '--version');
    return { ok: !!version, version };
  } catch (e) {
    return { ok: false, version: null };
  }
}

/**
 * 检查 npm
 */
function checkNpm() {
  try {
    const version = getCommandVersion('npm', '--version');
    return { ok: !!version, version };
  } catch (e) {
    return { ok: false, version: null };
  }
}

/**
 * 完整的环境检查
 */
async function checkEnvironment(options = {}) {
  const { silent = false, autoInstall = false } = options;

  if (!silent) {
    step('检查编译环境');
  }

  const results = {
    node: checkNode(),
    bun: checkBun(),
    git: checkGit(),
    npm: checkNpm(),
  };

  const missing = [];
  const warnings = [];

  // 检查结果
  if (!results.node.ok) {
    missing.push('Node.js (需要 >=18.0.0)');
  } else if (!silent) {
    success(`Node.js ${results.node.version}`);
    indent(`版本: ${results.node.version}`, 2);
  }

  if (!results.bun.ok) {
    missing.push('Bun');
  } else if (!silent) {
    success(`Bun ${results.bun.version}`);
    indent(`版本: ${results.bun.version}`, 2);
  }

  if (!results.git.ok) {
    missing.push('Git');
  } else if (!silent) {
    success(`Git ${results.git.version}`);
  }

  if (!results.npm.ok) {
    warnings.push('npm (用于全局安装)');
  } else if (!silent) {
    success(`npm ${results.npm.version}`);
  }

  // 平台信息
  const { isWindows, isLinux, isMacOS, platform } = getPlatform();
  if (!silent) {
    indent(`平台: ${platform}`, 2);
  }

  if (missing.length > 0) {
    if (!silent) {
      error(`缺少必要工具: ${missing.join(', ')}`);
      warn('请安装后重试:');
      if (results.node?.ok === false) {
        indent('Node.js: https://nodejs.org/', 2);
      }
      if (results.bun?.ok === false) {
        indent('Bun: npm install -g bun', 2);
      }
      if (results.git?.ok === false) {
        indent('Git: https://git-scm.com/', 2);
      }
    }
    return { ok: false, missing, warnings, results };
  }

  if (warnings.length > 0 && !silent) {
    warn(`建议安装: ${warnings.join(', ')}`);
  }

  return { ok: true, missing: [], warnings, results };
}

/**
 * 获取 Bun 的完整路径
 */
function getBunPath() {
  const { isWindows } = getPlatform();
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  const possiblePaths = [];

  if (isWindows) {
    // Windows 路径
    possiblePaths.push(
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'bun', 'bin', 'bun.exe'),
      path.join(process.env.USERPROFILE || '', '.bun', 'bin', 'bun.exe'),
      path.join(process.env.ProgramFiles || '', 'bun', 'bin', 'bun.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'bun', 'bin', 'bun.exe')
    );
  } else {
    // Unix 路径
    possiblePaths.push(
      path.join(os.homedir(), '.bun', 'bin', 'bun'),
      '/usr/local/bin/bun',
      path.join(os.homedir(), '.local', 'bin', 'bun')
    );
  }

  for (const bunPath of possiblePaths) {
    if (fs.existsSync(bunPath)) {
      return bunPath;
    }
  }

  // 尝试从 PATH 获取
  try {
    const whereCmd = isWindows ? 'where bun' : 'which bun';
    const result = require('child_process').execSync(whereCmd, { encoding: 'utf-8' }).trim();
    if (result) {
      return result.split('\n')[0].trim();
    }
  } catch (e) {
    // 忽略
  }

  return null;
}

module.exports = {
  checkNode,
  checkBun,
  checkGit,
  checkNpm,
  checkEnvironment,
  getBunPath,
};
