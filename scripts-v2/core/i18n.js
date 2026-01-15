/**
 * 汉化处理模块
 * 读取 opencode-i18n 配置并应用到源码
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { getI18nDir, getOpencodeDir } = require('./utils.js');
const { step, success, error, indent } = require('./colors.js');

class I18n {
  constructor() {
    this.i18nDir = getI18nDir();
    this.opencodeDir = getOpencodeDir();
  }

  /**
   * 读取所有汉化配置文件
   */
  loadConfig() {
    if (!fs.existsSync(this.i18nDir)) {
      throw new Error(`汉化配置目录不存在: ${this.i18nDir}`);
    }

    const configs = [];

    // 遍历 opencode-i18n 目录
    const entries = fs.readdirSync(this.i18nDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryDir = path.join(this.i18nDir, entry.name);
        const jsonFiles = glob.sync('*.json', { cwd: categoryDir });

        for (const file of jsonFiles) {
          const filePath = path.join(categoryDir, file);
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            configs.push({
              category: entry.name,
              fileName: file,
              ...content
            });
          } catch (err) {
            console.warn(`警告: 跳过无效配置 ${filePath}: ${err.message}`);
          }
        }
      }
    }

    return configs;
  }

  /**
   * 应用单个配置文件的替换规则
   */
  applyConfig(config) {
    // 使用 'file' 字段（不是 'targetFile'）
    if (!config.file || !config.replacements) {
      return { files: 0, replacements: 0 };
    }

    // OpenCode 源码在 packages/opencode/ 目录
    // 如果路径不是以 packages/ 开头，自动添加前缀
    let relativePath = config.file;
    if (!relativePath.startsWith('packages/')) {
      relativePath = path.join('packages/opencode', relativePath);
    }

    const targetPath = path.join(this.opencodeDir, relativePath);

    if (!fs.existsSync(targetPath)) {
      // 静默跳过不存在的文件
      return { files: 0, replacements: 0 };
    }

    let content = fs.readFileSync(targetPath, 'utf-8');
    // 规范化换行符：统一使用 LF
    content = content.replace(/\r\n/g, '\n');
    let replaceCount = 0;
    const originalContent = content;

    // replacements 是键值对对象
    for (const [find, replace] of Object.entries(config.replacements)) {
      // 也规范化查找字符串中的换行符
      const normalizedFind = find.replace(/\r\n/g, '\n');

      // 判断是否为简单单词（只包含字母和数字）
      const isSimpleWord = /^[a-zA-Z0-9]+$/.test(normalizedFind);

      if (isSimpleWord) {
        // 简单单词使用单词边界，避免误翻译代码标识符
        // 例如: "Status" 不会匹配 "DialogStatus" 中的 "Status"
        const wordBoundaryPattern = new RegExp(`\\b${normalizedFind}\\b`, 'g');
        if (wordBoundaryPattern.test(content)) {
          content = content.replace(wordBoundaryPattern, replace);
          replaceCount++;
        }
      } else {
        // 复杂模式（含特殊字符）使用普通替换
        if (content.includes(normalizedFind)) {
          content = content.replaceAll(normalizedFind, replace);
          replaceCount++;
        }
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log(`  ✓ ${config.file} (${replaceCount} 处替换)`);
    }

    return { files: 1, replacements: replaceCount };
  }

  /**
   * 应用所有汉化配置
   */
  async apply(options = {}) {
    const { silent = false } = options;

    if (!silent) {
      step('应用汉化配置');
    }

    const configs = this.loadConfig();

    if (configs.length === 0) {
      throw new Error('未找到任何汉化配置文件');
    }

    if (!silent) {
      console.log(`找到 ${configs.length} 个配置文件`);
    }

    let totalFiles = 0;
    let totalReplacements = 0;

    for (const config of configs) {
      const result = this.applyConfig(config);
      totalFiles += result.files;
      totalReplacements += result.replacements;
    }

    if (!silent) {
      success(`汉化应用完成: ${totalFiles} 个文件, ${totalReplacements} 处替换`);
    }

    return { files: totalFiles, replacements: totalReplacements };
  }

  /**
   * 验证配置完整性
   */
  validate() {
    const configs = this.loadConfig();
    const errors = [];

    for (const config of configs) {
      if (!config.file) {
        errors.push(`${config.category}/${config.fileName}: 缺少 file 字段`);
      }
      if (!config.replacements || Object.keys(config.replacements).length === 0) {
        errors.push(`${config.category}/${config.fileName}: 缺少 replacements`);
      }
    }

    return errors;
  }

  /**
   * 获取汉化统计信息
   */
  getStats() {
    const configs = this.loadConfig();
    const stats = {
      totalConfigs: configs.length,
      categories: {},
      totalReplacements: 0,
    };

    for (const config of configs) {
      const category = config.category;
      if (!stats.categories[category]) {
        stats.categories[category] = { count: 0, replacements: 0 };
      }
      stats.categories[category].count++;
      if (config.replacements) {
        const count = Object.keys(config.replacements).length;
        stats.categories[category].replacements += count;
        stats.totalReplacements += count;
      }
    }

    return stats;
  }
}

module.exports = I18n;
