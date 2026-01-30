/**
 * 应用"本次用量"功能补丁
 * 在每条消息的模型名称后显示 token 用量
 */

const fs = require('fs');
const path = require('path');

const OPENCODE_DIR = path.resolve(__dirname, '../../opencode-zh-CN');
const INDEX_FILE = path.join(OPENCODE_DIR, 'packages/opencode/src/cli/cmd/tui/routes/session/index.tsx');

function applyPatch() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.log('⚠️ index.tsx 不存在，跳过补丁');
    return false;
  }

  let content = fs.readFileSync(INDEX_FILE, 'utf-8');

  // 检查是否已应用
  if (content.includes('toLocaleString()}↓')) {
    console.log('✓ 补丁已应用');
    return true;
  }

  const findPattern = `<span style={{ fg: theme.textMuted }}> · {props.message.modelID}</span>`;
  
  const replacePattern = `<span style={{ fg: theme.textMuted }}> · {props.message.modelID}</span>
              {(() => {
                const t = props.message.tokens
                const input = t.input
                const output = t.output
                const total = input + output + t.reasoning
                if (total === 0) return null
                return (
                  <span style={{ fg: theme.textMuted }}>
                    {" "}· {input.toLocaleString()}↓ {output.toLocaleString()}↑ = {total.toLocaleString()}
                  </span>
                )
              })()}`;

  if (content.includes(findPattern)) {
    content = content.replace(findPattern, replacePattern);
    fs.writeFileSync(INDEX_FILE, content, 'utf-8');
    console.log('✓ 本次用量补丁已应用');
    return true;
  }

  console.log('⚠️ 未找到匹配的代码');
  return false;
}

if (require.main === module) {
  applyPatch();
}

module.exports = { applyPatch };
