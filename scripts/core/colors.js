/**
 * 统一的颜色输出模块
 * 使用 clack 风格的视觉设计
 */

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

const S = {
  BAR: "│",
  BAR_START: "┌",
  BAR_END: "└",
  BAR_H: "─",
  STEP: "◇",
  SUCCESS: "◆",
  ERROR: "■",
  WARN: "▲",
  INFO: "●",
  SKIP: "○",
};

function colorize(text, color) {
  const code = colors[color] || colors.reset;
  return `${code}${text}${colors.reset}`;
}

function log(message, color = "reset") {
  console.log(colorize(message, color));
}

function step(title) {
  console.log("");
  console.log(
    `${colors.cyan}${S.STEP}${colors.reset} ${colors.bold}${title}${colors.reset}`,
  );
}

function success(message) {
  console.log(`${colors.green}${S.SUCCESS}${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}${S.ERROR}${colors.reset} ${message}`);
}

function warn(message) {
  console.log(`${colors.yellow}${S.WARN}${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}${S.INFO}${colors.reset} ${message}`);
}

function skip(message) {
  console.log(
    `${colors.gray}${S.SKIP}${colors.reset} ${colors.gray}${message}${colors.reset}`,
  );
}

function indent(message, level = 1) {
  if (message == null) return;
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  const prefix = level > 0 ? `${bar}  ` : "";
  console.log(`${prefix}${message}`);
}

function separator(char = "─", length = 40) {
  console.log(colors.gray + char.repeat(length) + colors.reset);
}

function groupStart(title) {
  console.log("");
  console.log(
    `${colors.gray}${S.BAR_START}${colors.reset} ${colors.bold}${title}${colors.reset}`,
  );
}

function groupEnd() {
  console.log(`${colors.gray}${S.BAR_END}${colors.reset}`);
}

const coloredLog = {
  reset: (msg) => log(msg, "reset"),
  black: (msg) => log(msg, "black"),
  red: (msg) => log(msg, "red"),
  green: (msg) => log(msg, "green"),
  yellow: (msg) => log(msg, "yellow"),
  blue: (msg) => log(msg, "blue"),
  magenta: (msg) => log(msg, "magenta"),
  cyan: (msg) => log(msg, "cyan"),
  white: (msg) => log(msg, "white"),
  gray: (msg) => log(msg, "gray"),
};

const spinnerThemes = {
  cat: {
    frames: [
      "🐱      ",
      " 🐱     ",
      "  🐱    ",
      "   🐱   ",
      "    🐱  ",
      "     🐱 ",
      "      🐱",
      "     🐱 ",
      "    🐱  ",
      "   🐱   ",
      "  🐱    ",
      " 🐱     ",
    ],
    success: "🐱✨ 喜喵~",
    fail: "😿 喔喔...",
  },
  rocket: {
    frames: [
      "🚀      ",
      " 🚀     ",
      "  🚀    ",
      "   🚀   ",
      "    🚀  ",
      "     🚀 ",
      "      🚀",
    ],
    success: "🌟 发射成功!",
    fail: "💥 发射失败",
  },
  stars: {
    frames: [
      "✨      ",
      "✨✨     ",
      "✨✨✨    ",
      "✨✨✨✨   ",
      "✨✨✨✨✨  ",
      "✨✨✨✨✨✨ ",
      "✨✨✨✨✨✨✨",
    ],
    success: "🌟 完美!",
    fail: "💫 失败了",
  },
  loading: {
    frames: [
      "░░░░░░░",
      "▓░░░░░░",
      "▓▓░░░░░",
      "▓▓▓░░░░",
      "▓▓▓▓░░░",
      "▓▓▓▓▓░░",
      "▓▓▓▓▓▓░",
      "▓▓▓▓▓▓▓",
    ],
    success: "███████ 完成!",
    fail: "░░░░░░░ 失败",
  },
  bunny: {
    frames: [
      "🐰      🥕",
      " 🐰     🥕",
      "  🐰    🥕",
      "   🐰   🥕",
      "    🐰  🥕",
      "     🐰 🥕",
      "      🐰🥕",
    ],
    success: "🐰🥕 吃到萝卜啦~",
    fail: "🐰💨 萝卜跑了...",
  },
};

class Spinner {
  constructor(text = "加载中", theme = "bunny") {
    this.text = text;
    this.theme = spinnerThemes[theme] || spinnerThemes.bunny;
    this.current = 0;
    this.timer = null;
  }

  start(text) {
    if (text) this.text = text;
    this.current = 0;
    this.timer = setInterval(() => {
      const frame = this.theme.frames[this.current];
      process.stdout.write(
        `\r${colors.gray}${S.BAR}${colors.reset}  ${colors.cyan}${frame}${colors.reset} ${this.text}   `,
      );
      this.current = (this.current + 1) % this.theme.frames.length;
    }, 120);
    return this;
  }

  update(text) {
    this.text = text;
    return this;
  }

  stop(finalText, isSuccess = true) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const msg = isSuccess ? this.theme.success : this.theme.fail;
    const color = isSuccess ? colors.green : colors.red;
    process.stdout.write(
      `\r${colors.gray}${S.BAR}${colors.reset}  ${color}${msg}${colors.reset} ${finalText || this.text}        \n`,
    );
    return this;
  }

  fail(text) {
    return this.stop(text, false);
  }
}

function createSpinner(text, theme = "bunny") {
  return new Spinner(text, theme);
}

module.exports = {
  colors,
  colorize,
  log,
  separator,
  step,
  success,
  error,
  warn,
  info,
  skip,
  indent,
  groupStart,
  groupEnd,
  createSpinner,
  Spinner,
  S,
  ...coloredLog,
};
