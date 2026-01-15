/**
 * apply 命令
 * 应用汉化配置到源码
 */

const I18n = require('../core/i18n.js');

async function run(options = {}) {
  const i18n = new I18n();
  const result = await i18n.apply(options);
  return result;
}

module.exports = { run };
