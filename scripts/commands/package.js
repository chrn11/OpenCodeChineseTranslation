/**
 * package 命令
 * 将编译产物打包到 releases 目录，方便分发
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('../core/utils.js');
const { getOpencodeDir, getProjectDir, getPlatform } = require('../core/utils.js');
const { step, success, error, indent, log } = require('../core/colors.js');

/**
 * 获取 releases 目录
 */
function getReleasesDir() {
  return path.join(getProjectDir(), 'releases');
}

/**
 * 获取版本号
 */
function getVersion() {
  try {
    // 优先从 scripts 自己的 package.json 读取版本
    const projectDir = getProjectDir();
    const packageJson = path.join(projectDir, 'scripts', 'package.json');
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      return pkg.version || 'unknown';
    }
    // 备用：从 opencode 源码读取
    const opencodeDir = getOpencodeDir();
    const opencodePkg = path.join(opencodeDir, 'package.json');
    if (fs.existsSync(opencodePkg)) {
      const pkg = JSON.parse(fs.readFileSync(opencodePkg, 'utf-8'));
      return pkg.version || 'unknown';
    }
  } catch {
    // 忽略
  }
  return 'unknown';
}

/**
 * 打包单个平台
 */
async function packagePlatform(platform) {
  const { platform: osPlatform } = getPlatform();
  // 移除重复导入，使用顶部导入的函数

  step(`打包 ${platform}`);

  // 确保目录存在
  const releasesDir = getReleasesDir();
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }

  // 获取编译产物
  const opencodeDir = getOpencodeDir();
  const distDir = path.join(
    opencodeDir,
    'packages',
    'opencode',
    'dist',
    `opencode-${platform}`
  );

  if (!fs.existsSync(distDir)) {
    error(`编译产物不存在: ${distDir}`);
    return false;
  }

  // 读取版本号
  const version = getVersion();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const baseName = `opencode-zh-CN-v${version}-${platform}`;

  // 创建临时打包目录
  const tempDir = path.join(releasesDir, 'temp', baseName);
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 复制文件
  const binExt = platform === 'windows-x64' ? '.exe' : '';
  const binSource = path.join(distDir, 'bin', `opencode${binExt}`);
  const binDest = path.join(tempDir, `opencode${binExt}`);

  fs.copyFileSync(binSource, binDest);

  // 设置可执行权限 (Unix)
  if (osPlatform !== 'win32') {
    fs.chmodSync(binDest, 0o755);
  }

  // 创建 README
  let readme = `OpenCode 中文汉化版 ${version}

平台: ${platform}
构建日期: ${dateStr}

安装说明:
`;

  if (platform === 'windows-x64') {
    readme += `1. 将 opencode.exe 解压到任意目录
2. 双击运行即可使用
3. 建议创建快捷方式到桌面`;
  } else if (platform === 'darwin-arm64') {
    readme += `1. 将 opencode 解压到 Applications 目录或任意位置
2. 在终端中运行: chmod +x opencode
3. 运行: ./opencode`;
  } else {
    readme += `1. 将 opencode 解压到 /usr/local/bin 或其他 PATH 目录
2. 添加执行权限: chmod +x opencode
3. 运行: opencode`;
  }

  fs.writeFileSync(path.join(tempDir, 'README.txt'), readme);

  // 压缩
  const outputPath = path.join(releasesDir, `${baseName}.zip`);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  if (osPlatform === 'win32') {
    // Windows: 使用 PowerShell Compress-Archive
    try {
      exec(
        `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${outputPath}' -Force"`,
        { stdio: 'pipe' }
      );
    } catch (e) {
      error(`压缩失败: ${e.message}`);
      return false;
    }
  } else {
    // Unix: 使用 zip 命令
    try {
      exec(`cd "${tempDir}" && zip -r "${outputPath}" .`, { stdio: 'pipe' });
    } catch (e) {
      error(`压缩失败: ${e.message}`);
      return false;
    }
  }

  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });

  // 获取文件大小
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  success(`打包完成: ${path.basename(outputPath)} (${sizeMB} MB)`);
  indent(`路径: ${outputPath}`, 2);

  return true;
}

/**
 * 打包所有平台
 */
async function packageAll(options = {}) {
  let platforms = ['windows-x64', 'darwin-arm64', 'linux-x64'];

  step('打包所有平台');

  const results = [];
  const releaseDir = getReleasesDir();

  for (const targetPlatform of platforms) {
    const result = await packagePlatform(targetPlatform);
    results.push({ platform: targetPlatform, success: result });
  }

  // 显示汇总
  const successCount = results.filter((r) => r.success).length;
  console.log('');

  log(`=== 打包完成: ${successCount}/${results.length} ===`, 'cyan');
  log(`输出目录: ${releaseDir}`, 'dim');

  // 列出所有生成的文件
  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir).filter((f) => f.endsWith('.zip'));
    files.forEach((file) => {
      const filePath = path.join(releaseDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`  ${file} (${sizeMB} MB)`, 'dim');
    });
  }
  console.log('');

  return results.every((r) => r.success);
}

/**
 * 主运行函数
 */
async function run(options = {}) {
  const { platform = null, all = false } = options;

  if (all) {
    return await packageAll(options);
  }

  if (platform) {
    return await packagePlatform(platform);
  }

  // 默认打包当前平台
  const { getBuildArgs } = require('../core/utils.js');
  const { platform: currentPlatform } = getBuildArgs();
  return await packagePlatform(currentPlatform);
}

module.exports = {
  run,
  packagePlatform,
  packageAll,
  getReleasesDir,
};
