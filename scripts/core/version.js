/**
 * 版本管理模块
 */

const fs = require('fs');
const path = require('path');
const { getProjectDir, readJSON } = require('./utils.js');

/**
 * 版本配置文件路径
 */
const VERSION_FILE = path.join(getProjectDir(), 'opencode-i18n', 'config.json');

/**
 * 读取版本配置
 */
function getVersionConfig() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return readJSON(VERSION_FILE);
    }
  } catch (e) {
    // 忽略错误
  }

  // 默认配置
  return {
    version: '1.0.0',
    opencodeVersion: 'main',
    supportedCommit: null,
  };
}

/**
 * 获取当前版本号
 */
function getVersion() {
  const config = getVersionConfig();
  return config.version;
}

/**
 * 获取 OpenCode 目标版本/提交
 */
function getOpencodeVersion() {
  const config = getVersionConfig();
  return config.opencodeVersion || 'main';
}

/**
 * 获取支持的提交哈希
 */
function getSupportedCommit() {
  const config = getVersionConfig();
  return config.supportedCommit || null;
}

/**
 * 格式化版本号（带 v 前缀）
 */
function formatVersion(version) {
  return version.startsWith('v') ? version : `v${version}`;
}

/**
 * 从 Git 提交数生成版本号
 */
function generateVersionFromCount(count, baseVersion = '5.6') {
  return `${baseVersion}.${count}`;
}

/**
 * 解析版本号
 */
function parseVersion(version) {
  // 移除 v 前缀
  const cleanVersion = version.replace(/^v/, '');

  // 匹配 semver 格式
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null,
      formatted: cleanVersion,
    };
  }

  // 匹配简化格式 (如 5.6.123)
  const simpleMatch = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (simpleMatch) {
    return {
      major: parseInt(simpleMatch[1], 10),
      minor: parseInt(simpleMatch[2], 10),
      patch: parseInt(simpleMatch[3], 10),
      prerelease: null,
      formatted: cleanVersion,
    };
  }

  return null;
}

/**
 * 比较版本号
 * @returns {number} -1: v1 < v2, 0: v1 == v2, 1: v1 > v2
 */
function compareVersions(v1, v2) {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (!parsed1 || !parsed2) return 0;

  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }

  // 预发布版本比较
  if (parsed1.prerelease && parsed2.prerelease) {
    return parsed1.prerelease.localeCompare(parsed2.prerelease);
  }
  if (parsed1.prerelease) return -1;
  if (parsed2.prerelease) return 1;

  return 0;
}

module.exports = {
  getVersionConfig,
  getVersion,
  getOpencodeVersion,
  getSupportedCommit,
  formatVersion,
  generateVersionFromCount,
  parseVersion,
  compareVersions,
};
