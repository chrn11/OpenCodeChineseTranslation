const p = require("@clack/prompts");
const color = require("picocolors");
const { loadUserConfig, saveUserConfig, getUserConfigPath } = require("../core/user-config.js");
const { step, success, warn, error, indent, blank, isPlainMode } = require("../core/colors.js");

function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function run(options = {}) {
  const { interactive = true, show = false, clear = false } = options;
  const current = loadUserConfig();

  if (show) {
    step("AI 配置");
    indent(`配置文件: ${getUserConfigPath()}`);
    indent(`OPENAI_API_KEY: ${current.openaiApiKey ? maskKey(current.openaiApiKey) : "(未设置)"}`);
    indent(`OPENAI_API_BASE: ${current.openaiApiBase || "(未设置)"}`);
    indent(`OPENAI_MODEL: ${current.openaiModel || "(未设置)"}`);
    indent(`NPM 镜像源: ${current.npmRegistry || "(默认)"}`);
    return true;
  }

  if (clear) {
    const next = { ...current };
    delete next.openaiApiKey;
    delete next.openaiApiBase;
    delete next.openaiModel;
    delete next.npmRegistry;
    const saved = saveUserConfig(next);
    success(`已清空 AI 配置: ${saved}`);
    return true;
  }

  if (!interactive) return true;

  blank();
  p.intro(color.bgCyan(color.black(isPlainMode() ? " AI 配置向导 " : " ⚙ AI 配置向导 ")));
  indent(`配置将保存到: ${getUserConfigPath()}`, 2);
  blank();

  const apiKey = await p.password({
    message: "请输入 OPENAI_API_KEY",
    placeholder: current.openaiApiKey ? maskKey(current.openaiApiKey) : "sk-...",
  });
  if (p.isCancel(apiKey)) {
    p.cancel("已取消");
    return false;
  }

  const apiBase = await p.text({
    message: "请输入 OPENAI_API_BASE（可空）",
    placeholder: current.openaiApiBase || "http://127.0.0.1:8045/v1",
  });
  if (p.isCancel(apiBase)) {
    p.cancel("已取消");
    return false;
  }

  const model = await p.text({
    message: "请输入 OPENAI_MODEL（可空）",
    placeholder: current.openaiModel || "",
  });
  if (p.isCancel(model)) {
    p.cancel("已取消");
    return false;
  }

  const next = {
    ...current,
    openaiApiKey: apiKey || current.openaiApiKey || "",
    openaiApiBase: apiBase || "",
    openaiModel: model || "",
  };

  const useMirror = await p.confirm({
    message: "是否使用国内镜像源加速构建 (Bun)?",
    initialValue: !!current.npmRegistry || false,
  });
  if (p.isCancel(useMirror)) {
    p.cancel("已取消");
    return false;
  }

  if (useMirror) {
    next.npmRegistry = "https://registry.npmmirror.com";
  } else {
    delete next.npmRegistry;
  }

  if (!next.openaiApiKey) {
    warn("未设置 OPENAI_API_KEY，AI 功能将不可用");
  }

  try {
    const saved = saveUserConfig(next);
    success(`已保存 AI 配置: ${saved}`);
    return true;
  } catch (e) {
    error(`保存失败: ${e.message}`);
    return false;
  }
}

module.exports = { run };

