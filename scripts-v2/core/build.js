/**
 * 构建工具模块
 * 调用 Bun 进行编译构建
 */

const path = require('path');
const fs = require('fs');
const { execLive, getOpencodeDir, exists, formatSize } = require('./utils.js');
const { getBunPath } = require('./env.js');
const { step, success, error, warn, indent } = require('./colors.js');

class Builder {
  constructor() {
    this.opencodeDir = getOpencodeDir();
    this.buildDir = path.join(this.opencodeDir, 'packages', 'opencode');
    this.bunPath = getBunPath();
  }

  /**
   * 检查构建环境
   */
  checkEnvironment() {
    if (!this.bunPath) {
      throw new Error('未找到 Bun，请先安装: npm install -g bun');
    }

    if (!exists(this.buildDir)) {
      throw new Error(`构建目录不存在: ${this.buildDir}`);
    }
  }

  /**
   * 安装依赖
   */
  async installDependencies(options = {}) {
    const { silent = false } = options;

    if (!silent) {
      step('安装依赖');
    }

    const nodeModulesPath = path.join(this.buildDir, 'node_modules');

    if (exists(nodeModulesPath)) {
      if (!silent) {
        warn('依赖已存在，跳过安装');
      }
      return true;
    }

    try {
      await execLive(this.bunPath, ['install'], {
        cwd: this.buildDir,
      });
      if (!silent) success('依赖安装完成');
      return true;
    } catch (e) {
      error(`依赖安装失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 执行编译
   */
  async build(options = {}) {
    const { silent = false, platform = null } = options;

    if (!silent) {
      step('编译构建');
    }

    this.checkEnvironment();

    // 确保依赖已安装
    await this.installDependencies({ silent });

    try {
      // 构建命令参数
      const args = ['run', 'script/build.ts'];

      // 如果指定平台，添加 --single 参数
      if (platform) {
        args.push('--single');
      }

      indent(`执行: ${this.bunPath} ${args.join(' ')}`, 2);

      await execLive(this.bunPath, args, {
        cwd: this.buildDir,
      });

      if (!silent) success('编译成功');
      return true;
    } catch (e) {
      error(`编译失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 获取编译产物路径
   */
  getDistPath(platform = 'windows-x64') {
    return path.join(
      this.buildDir,
      'dist',
      `opencode-${platform}`,
      'bin',
      `opencode${platform === 'windows-x64' ? '.exe' : ''}`
    );
  }

  /**
   * 检查编译产物是否存在
   */
  hasOutput(platform = 'windows-x64') {
    return exists(this.getDistPath(platform));
  }

  /**
   * 获取编译产物信息
   */
  getOutputInfo(platform = 'windows-x64') {
    const distPath = this.getDistPath(platform);

    if (!exists(distPath)) {
      return null;
    }

    const stats = fs.statSync(distPath);
    return {
      path: distPath,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
    };
  }

  /**
   * 部署到本地 bin 目录
   */
  async deployToLocal(options = {}) {
    const { silent = false, platform = 'windows-x64' } = options;

    if (!silent) {
      step('部署到本地环境');
    }

    const { getBinDir } = require('./utils');
    const binDir = getBinDir();

    // 确保 bin 目录存在
    if (!exists(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const sourcePath = this.getDistPath(platform);
    const destPath = path.join(binDir, `opencode${platform === 'windows-x64' ? '.exe' : ''}`);

    if (!exists(sourcePath)) {
      if (!silent) {
        warn('编译产物不存在，请先运行 build');
      }
      return false;
    }

    try {
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);

      if (!silent) {
        success(`已部署到: ${destPath}`);
        indent(`大小: ${formatSize(stats.size)}`, 2);
      }
      return true;
    } catch (e) {
      error(`部署失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 清理构建产物
   */
  clean(options = {}) {
    const { silent = false } = options;

    const distDir = path.join(this.buildDir, 'dist');

    if (exists(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
      if (!silent) success('构建产物已清理');
    }
  }
}

module.exports = Builder;
