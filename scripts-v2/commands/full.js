/**
 * full 命令
 * 完整工作流：更新 → 恢复 → 汉化 → 编译 → 部署
 */

const { step, success, error } = require('../core/colors.js');
const { cleanRepo } = require('../core/git.js');
const { getOpencodeDir } = require('../core/utils.js');
const updateCmd = require('./update.js');
const applyCmd = require('./apply.js');
const buildCmd = require('./build.js');

async function run(options = {}) {
  const { skipUpdate = false, skipBuild = false } = options;

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   OpenCode 中文版 - 完整工作流        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    // 步骤 1: 更新源码
    if (!skipUpdate) {
      await updateCmd.run(options);
    } else {
      step('更新源码');
      success('跳过（已指定）');
    }

    // 步骤 2: 恢复纯净
    step('恢复源码到纯净状态');
    const opencodeDir = getOpencodeDir();
    await cleanRepo(opencodeDir);

    // 步骤 3: 应用汉化
    await applyCmd.run(options);

    // 步骤 4: 编译构建
    if (!skipBuild) {
      await buildCmd.run({ deploy: true, ...options });
    } else {
      step('编译构建');
      success('跳过（已指定）');
    }

    // 完成
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║            工作流完成！ ✓             ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

    return true;
  } catch (e) {
    error(`工作流失败: ${e.message}`);
    return false;
  }
}

module.exports = { run };
