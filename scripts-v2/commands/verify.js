/**
 * verify 命令
 * 验证汉化配置和覆盖率
 */

const I18n = require('../core/i18n.js');
const { step, success, error, indent } = require('../core/colors.js');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function run(options = {}) {
  const { detailed = false } = options;

  step('验证汉化配置');

  const i18n = new I18n();

  // 1. 验证配置完整性
  const errors = i18n.validate().filter((err) => {
    // 忽略空 replacements 的错误（可能是废弃文件的占位配置）
    if (err.includes('缺少 replacements')) {
      return false;
    }
    return true;
  });

  if (errors.length > 0) {
    error('发现配置错误:');
    errors.forEach((err) => indent(`- ${err}`, 2));
    return false;
  }
  success('配置验证通过');

  // 2. 获取统计信息
  const stats = i18n.getStats();
  success(`配置文件: ${stats.totalConfigs} 个`);
  success(`翻译条目: ${stats.totalReplacements} 条`);

  if (detailed) {
    indent('分类统计:', 2);
    for (const [category, data] of Object.entries(stats.categories)) {
      indent(`  ${category}: ${data.count} 个文件, ${data.replacements} 条翻译`, 2);
    }
  }

  // 3. 检查覆盖率（检查是否有遗漏的文件）
  step('检查汉化覆盖率');

  const opencodeDir = i18n.opencodeDir;
  const sourceDir = path.join(opencodeDir, 'packages', 'opencode', 'src');

  if (fs.existsSync(sourceDir)) {
    // 统计源码文件数量
    const tsFiles = glob.sync('**/*.tsx', { cwd: sourceDir });
    const jsFiles = glob.sync('**/*.jsx', { cwd: sourceDir });
    const totalFiles = tsFiles.length + jsFiles.length;

    // 统计已配置的文件
    const configs = i18n.loadConfig();
    const configuredFiles = new Set();
    for (const config of configs) {
      if (config.file) {
        configuredFiles.add(config.file.replace(/^packages\/opencode\//, ''));
      }
    }

    const coverage = (configuredFiles.size / totalFiles * 100).toFixed(1);
    success(`源码文件: ${totalFiles} 个`);
    success(`已汉化: ${configuredFiles.size} 个`);
    success(`覆盖率: ${coverage}%`);

    if (detailed && configuredFiles.size < totalFiles) {
      indent('未汉化的文件（部分）:', 2);
      let count = 0;
      for (const file of [...tsFiles, ...jsFiles]) {
        if (!configuredFiles.has(file) && count < 10) {
          indent(`  - ${file}`, 2);
          count++;
        }
      }
      if (totalFiles - configuredFiles.size > 10) {
        indent(`  ... 还有 ${totalFiles - configuredFiles.size - 10} 个文件`, 2);
      }
    }
  }

  return true;
}

module.exports = { run };
