/**
 * 批量转换翻译文件为双语格式
 * 将 "English": "中文" 转换为 "English": "中文 (English)"
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const i18nDir = path.resolve(__dirname, '../opencode-i18n');

// 需要保持纯中文的 key（动态内容，避免嵌套）
const PURE_CHINESE_KEYS = [
  'Fix a TODO in the codebase',
  'What is the tech stack of this project?',
  'Fix broken tests',
];

// 检查是否已经是双语格式
function isBilingual(original, translated) {
  // 已经包含英文原文在括号中
  if (translated.includes(`(${original})`)) return true;
  // 已经包含类似 (English text) 的格式
  if (/\([A-Z][^)]+\)\s*$/.test(translated)) return true;
  return false;
}

// 转换为双语格式
function toBilingual(original, translated) {
  // 动态内容保持纯中文（避免嵌套）
  if (PURE_CHINESE_KEYS.includes(original)) {
    // 如果已经是双语，去掉英文后缀
    const match = translated.match(/^(.+?)\s*\([^)]+\)\s*$/);
    if (match) {
      return match[1].trim();
    }
    return translated;
  }
  
  if (isBilingual(original, translated)) {
    return translated;
  }
  
  // 特殊情况：翻译结果和原文相同（不需要翻译的内容）
  if (original === translated) {
    return translated;
  }
  
  // 特殊情况：包含变量占位符的复杂文本，不添加后缀
  if (original.length > 80) {
    return translated;
  }
  
  return `${translated} (${original})`;
}

// 处理单个文件
function processFile(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (!content.replacements) {
      return { changed: false };
    }
    
    let changed = false;
    const newReplacements = {};
    
    for (const [original, translated] of Object.entries(content.replacements)) {
      const newTranslated = toBilingual(original, translated);
      newReplacements[original] = newTranslated;
      
      if (newTranslated !== translated) {
        changed = true;
      }
    }
    
    if (changed) {
      content.replacements = newReplacements;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    }
    
    return { changed, count: Object.keys(newReplacements).length };
  } catch (e) {
    console.error(`处理失败: ${filePath} - ${e.message}`);
    return { changed: false, error: e.message };
  }
}

// 主函数
async function main() {
  console.log('🔄 批量转换翻译文件为双语格式...\n');
  
  const jsonFiles = glob.sync('**/*.json', {
    cwd: i18nDir,
    ignore: ['skip-files.json', 'config.json']
  });
  
  let totalChanged = 0;
  let totalFiles = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(i18nDir, file);
    const result = processFile(filePath);
    totalFiles++;
    
    if (result.changed) {
      totalChanged++;
      console.log(`✓ ${file} (${result.count} 条)`);
    }
  }
  
  console.log(`\n✅ 完成！共处理 ${totalFiles} 个文件，转换 ${totalChanged} 个`);
}

main().catch(console.error);
