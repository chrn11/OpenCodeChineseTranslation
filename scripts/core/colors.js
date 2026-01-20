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

const printQueue = [];
let isPrinting = false;
const PRINT_DELAY = 100;

async function processQueue() {
  if (isPrinting || printQueue.length === 0) return;
  isPrinting = true;
  while (printQueue.length > 0) {
    const msg = printQueue.shift();
    console.log(msg);
    if (printQueue.length > 0) {
      await new Promise((r) => setTimeout(r, PRINT_DELAY));
    }
  }
  isPrinting = false;
}

function out(message) {
  printQueue.push(message);
  processQueue();
}

function flushStream() {
  return new Promise((resolve) => {
    const check = () => {
      if (printQueue.length === 0 && !isPrinting) resolve();
      else setTimeout(check, 10);
    };
    check();
  });
}

function log(message, color = "reset") {
  out(colorize(message, color));
}

function step(title) {
  out("");
  out(`${colors.cyan}${S.STEP}${colors.reset} ${colors.bold}${title}${colors.reset}`);
}

function success(message) {
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  out(`${bar} ${colors.green}${S.SUCCESS}${colors.reset} ${message}`);
}

function error(message) {
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  out(`${bar} ${colors.red}${S.ERROR}${colors.reset} ${message}`);
}

function warn(message) {
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  out(`${bar} ${colors.yellow}${S.WARN}${colors.reset} ${message}`);
}

function info(message) {
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  out(`${bar} ${colors.blue}${S.INFO}${colors.reset} ${message}`);
}

function skip(message) {
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  out(`${bar} ${colors.gray}${S.SKIP}${colors.reset} ${colors.gray}${message}${colors.reset}`);
}

function indent(message, level = 1) {
  if (message == null) return;
  const bar = `${colors.gray}${S.BAR}${colors.reset}`;
  const prefix = level > 0 ? `${bar}  ` : "";
  out(`${prefix}${message}`);
}

function separator(char = "─", length = 40) {
  out(colors.gray + char.repeat(length) + colors.reset);
}

function groupStart(title) {
  out("");
  out(`${colors.gray}${S.BAR_START}${colors.reset} ${colors.bold}${title}${colors.reset}`);
}

function groupEnd() {
  out(`${colors.gray}${S.BAR_END}${colors.reset}`);
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

// ============================================
// Knight Rider 扫描动画算法（移植自 OpenCode）
// ============================================

/**
 * 解析 HEX 颜色为 RGB
 * @param {string} hex - HEX 颜色值，如 "#ff4fd8"
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/**
 * 生成 ANSI 24-bit 前景色转义序列
 * @param {number} r - 红色分量 (0-255)
 * @param {number} g - 绿色分量 (0-255)
 * @param {number} b - 蓝色分量 (0-255)
 * @returns {string}
 */
function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * 从亮色派生渐变尾巴颜色（Alpha 衰减模拟）
 * @param {string} brightColor - HEX 亮色
 * @param {number} steps - 尾巴级数（默认 6）
 * @returns {Array<{r: number, g: number, b: number, a: number}>}
 */
function deriveTrailColors(brightColor, steps = 6) {
  const base = hexToRgb(brightColor);
  const trailColors = [];

  for (let i = 0; i < steps; i++) {
    let alpha, brightnessFactor;

    if (i === 0) {
      // 头部：全亮度
      alpha = 1.0;
      brightnessFactor = 1.0;
    } else if (i === 1) {
      // 轻微泛光效果
      alpha = 0.9;
      brightnessFactor = 1.15;
    } else {
      // 指数衰减
      alpha = Math.pow(0.65, i - 1);
      brightnessFactor = 1.0;
    }

    trailColors.push({
      r: Math.min(255, Math.round(base.r * brightnessFactor)),
      g: Math.min(255, Math.round(base.g * brightnessFactor)),
      b: Math.min(255, Math.round(base.b * brightnessFactor)),
      a: alpha,
    });
  }

  return trailColors;
}

/**
 * 从亮色派生非活动块颜色
 * @param {string} brightColor - HEX 亮色
 * @param {number} factor - 暗度因子（默认 0.6）
 * @returns {{r: number, g: number, b: number, a: number}}
 */
function deriveInactiveColor(brightColor, factor = 0.6) {
  const base = hexToRgb(brightColor);
  return {
    r: base.r,
    g: base.g,
    b: base.b,
    a: factor,
  };
}

/**
 * 计算扫描器状态（位置、方向、停留）
 * @param {number} frameIndex - 当前帧索引
 * @param {number} totalChars - 总宽度
 * @param {object} options - 配置选项
 * @returns {object} 扫描器状态
 */
function getScannerState(frameIndex, totalChars, options) {
  const { holdStart = 30, holdEnd = 9 } = options;

  const forwardFrames = totalChars;
  const holdEndFrames = holdEnd;
  const backwardFrames = totalChars - 1;

  if (frameIndex < forwardFrames) {
    // 向右移动
    return {
      activePosition: frameIndex,
      isHolding: false,
      holdProgress: 0,
      holdTotal: 0,
      movementProgress: frameIndex,
      movementTotal: forwardFrames,
      isMovingForward: true,
    };
  } else if (frameIndex < forwardFrames + holdEndFrames) {
    // 右端停留
    return {
      activePosition: totalChars - 1,
      isHolding: true,
      holdProgress: frameIndex - forwardFrames,
      holdTotal: holdEndFrames,
      movementProgress: 0,
      movementTotal: 0,
      isMovingForward: true,
    };
  } else if (frameIndex < forwardFrames + holdEndFrames + backwardFrames) {
    // 向左移动
    const backwardIndex = frameIndex - forwardFrames - holdEndFrames;
    return {
      activePosition: totalChars - 2 - backwardIndex,
      isHolding: false,
      holdProgress: 0,
      holdTotal: 0,
      movementProgress: backwardIndex,
      movementTotal: backwardFrames,
      isMovingForward: false,
    };
  } else {
    // 左端停留
    return {
      activePosition: 0,
      isHolding: true,
      holdProgress: frameIndex - forwardFrames - holdEndFrames - backwardFrames,
      holdTotal: holdStart,
      movementProgress: 0,
      movementTotal: 0,
      isMovingForward: false,
    };
  }
}

/**
 * 计算某位置的颜色索引（尾巴等级）
 * @param {number} charIndex - 字符位置
 * @param {number} trailLength - 尾巴长度
 * @param {object} state - 扫描器状态
 * @returns {number} 颜色索引（-1 表示非活动）
 */
function calculateColorIndex(charIndex, trailLength, state) {
  const { activePosition, isHolding, holdProgress, isMovingForward } = state;

  // 计算方向性距离（正值表示在尾巴后面）
  const directionalDistance = isMovingForward
    ? activePosition - charIndex
    : charIndex - activePosition;

  // 停留时尾巴逐渐消失
  if (isHolding) {
    return directionalDistance + holdProgress;
  }

  // 正常移动时显示渐变尾巴
  if (directionalDistance > 0 && directionalDistance < trailLength) {
    return directionalDistance;
  }

  // 活动位置显示最亮颜色
  if (directionalDistance === 0) {
    return 0;
  }

  return -1;
}

/**
 * 将颜色应用 Alpha 混合（与黑色背景混合）
 * @param {{r: number, g: number, b: number, a: number}} color
 * @returns {{r: number, g: number, b: number}}
 */
function applyAlpha(color) {
  return {
    r: Math.round(color.r * color.a),
    g: Math.round(color.g * color.a),
    b: Math.round(color.b * color.a),
  };
}

/**
 * Knight Rider 扫描动画配置
 */
const knightRiderConfig = {
  width: 14,
  holdStart: 30,
  holdEnd: 9,
  trailSteps: 6,
  color: "#ff4fd8",
  inactiveFactor: 0.6,
  minAlpha: 0.3,
  enableFading: true,
  activeChar: "■",
  inactiveChar: "⬝",
};

// ============================================
// Spinner 主题定义
// ============================================

const spinnerThemes = {
  // OpenCode Knight Rider 扫描动画（默认主题）
  opencode: {
    frames: null, // 动态生成
    success: "██████████████",
    fail: "░░░░░░░░░░░░░░",
  },
  gradient: {
    frames: null,
    success: "████",
    fail: "░░░░",
  },
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
  constructor(text = "加载中", theme = "opencode") {
    this.text = text;
    this.themeName = theme;
    this.theme = spinnerThemes[theme] || spinnerThemes.opencode;
    this.current = 0;
    this.timer = null;
    this.barLength = 4;

    this.kr = knightRiderConfig;
    this.krTrailColors = deriveTrailColors(this.kr.color, this.kr.trailSteps);
    this.krInactiveColor = deriveInactiveColor(
      this.kr.color,
      this.kr.inactiveFactor,
    );
    this.krTotalFrames =
      this.kr.width + this.kr.holdEnd + (this.kr.width - 1) + this.kr.holdStart;
  }

  _renderKnightRiderBar(frameIndex) {
    const state = getScannerState(frameIndex, this.kr.width, {
      holdStart: this.kr.holdStart,
      holdEnd: this.kr.holdEnd,
    });

    let fadeFactor = 1.0;
    if (this.kr.enableFading) {
      if (state.isHolding && state.holdTotal > 0) {
        const progress = state.holdProgress / state.holdTotal;
        fadeFactor = Math.max(
          this.kr.minAlpha,
          1 - progress * (1 - this.kr.minAlpha),
        );
      } else if (!state.isHolding && state.movementTotal > 0) {
        const progress = state.movementProgress / state.movementTotal;
        fadeFactor = this.kr.minAlpha + progress * (1 - this.kr.minAlpha);
      }
    }

    let bar = "";
    for (let i = 0; i < this.kr.width; i++) {
      const colorIdx = calculateColorIndex(i, this.kr.trailSteps, state);

      let charColor;
      let char;

      if (colorIdx >= 0 && colorIdx < this.krTrailColors.length) {
        const trailColor = applyAlpha(this.krTrailColors[colorIdx]);
        charColor = rgb(trailColor.r, trailColor.g, trailColor.b);
        char = this.kr.activeChar;
      } else {
        const baseAlpha = this.kr.inactiveFactor * fadeFactor;
        const inactiveColor = {
          r: this.krInactiveColor.r,
          g: this.krInactiveColor.g,
          b: this.krInactiveColor.b,
          a: baseAlpha,
        };
        const inactiveApplied = applyAlpha(inactiveColor);
        charColor = rgb(
          inactiveApplied.r,
          inactiveApplied.g,
          inactiveApplied.b,
        );
        char = this.kr.inactiveChar;
      }

      bar += `${charColor}${char}${colors.reset}`;
    }
    return bar;
  }

  _renderGradientBar(position) {
    const gradientColors = [
      "\x1b[38;5;205m",
      "\x1b[38;5;206m",
      "\x1b[38;5;207m",
      "\x1b[38;5;177m",
    ];
    const empty = `${colors.gray}·${colors.reset}`;
    const filled = gradientColors.map((c) => `${c}█${colors.reset}`);

    let bar = "";
    for (let i = 0; i < this.barLength; i++) {
      if (i < position) {
        bar += filled[i % filled.length];
      } else {
        bar += empty;
      }
    }
    return bar;
  }

  start(text) {
    if (text) this.text = text;
    this.current = 0;

    if (!process.stdout.isTTY) {
      console.log(`${colors.gray}${S.BAR}${colors.reset}  ${this.text}...`);
      return this;
    }

    if (this.themeName === "opencode") {
      this.timer = setInterval(() => {
        const bar = this._renderKnightRiderBar(this.current);
        process.stdout.write(
          `\r${colors.gray}${S.BAR}${colors.reset}  ${colors.dim}${this.text}${colors.reset} ${bar}   `,
        );
        this.current = (this.current + 1) % this.krTotalFrames;
      }, 40);
    } else if (this.themeName === "gradient") {
      this.timer = setInterval(() => {
        const bar = this._renderGradientBar(this.current + 1);
        process.stdout.write(
          `\r${colors.gray}${S.BAR}${colors.reset}  ${colors.dim}${this.text}${colors.reset} ${bar}   `,
        );
        this.current = (this.current + 1) % (this.barLength + 1);
      }, 150);
    } else {
      this.timer = setInterval(() => {
        const frame = this.theme.frames[this.current];
        process.stdout.write(
          `\r${colors.gray}${S.BAR}${colors.reset}  ${colors.dim}${this.text}${colors.reset} ${colors.cyan}${frame}${colors.reset}   `,
        );
        this.current = (this.current + 1) % this.theme.frames.length;
      }, 120);
    }
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

    if (!process.stdout.isTTY) {
      const icon = isSuccess ? "✓" : "✗";
      const iconColor = isSuccess ? colors.green : colors.red;
      console.log(
        `${colors.gray}${S.BAR}${colors.reset}  ${iconColor}${icon}${colors.reset} ${finalText || this.text}`,
      );
      return this;
    }

    if (this.themeName === "opencode") {
      const brightBase = hexToRgb(this.kr.color);
      const successBar = Array(this.kr.width)
        .fill(
          `${rgb(brightBase.r, brightBase.g, brightBase.b)}${this.kr.activeChar}${colors.reset}`,
        )
        .join("");
      const failBar = Array(this.kr.width)
        .fill(`${colors.red}░${colors.reset}`)
        .join("");
      const bar = isSuccess ? successBar : failBar;
      const icon = isSuccess
        ? `${colors.green}✓${colors.reset}`
        : `${colors.red}✗${colors.reset}`;
      const textColor = isSuccess ? colors.reset : colors.red;
      process.stdout.write(
        `\r${colors.gray}${S.BAR}${colors.reset}  ${icon} ${textColor}${finalText || this.text}${colors.reset} ${bar}        \n`,
      );
    } else if (this.themeName === "gradient") {
      const successBar =
        "\x1b[38;5;205m█\x1b[38;5;206m█\x1b[38;5;207m█\x1b[38;5;177m█\x1b[0m";
      const failBar = `${colors.red}░░░░${colors.reset}`;
      const bar = isSuccess ? successBar : failBar;
      const textColor = isSuccess ? colors.reset : colors.red;
      process.stdout.write(
        `\r${colors.gray}${S.BAR}${colors.reset}  ${colors.green}✓${colors.reset} ${textColor}${finalText || this.text}${colors.reset} ${bar}        \n`,
      );
    } else {
      const msg = isSuccess ? this.theme.success : this.theme.fail;
      const color = isSuccess ? colors.green : colors.red;
      process.stdout.write(
        `\r${colors.gray}${S.BAR}${colors.reset}  ${finalText || this.text} ${color}${msg}${colors.reset}        \n`,
      );
    }
    return this;
  }

  fail(text) {
    return this.stop(text, false);
  }

  success(text) {
    return this.stop(text, true);
  }

  warn(text) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const bar = `${colors.gray}${S.BAR}${colors.reset}`;
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${bar}${colors.yellow}${S.WARN}${colors.reset} ${text}        \n`);
    } else {
      console.log(`${bar}${colors.yellow}${S.WARN}${colors.reset} ${text}`);
    }
    return this;
  }

  error(text) {
    return this.stop(text, false);
  }

  clear() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (process.stdout.isTTY) {
      process.stdout.write("\r\x1b[K");
    }
    return this;
  }
}

function createSpinner(text, theme = "opencode") {
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
  out,
  flushStream,
  ...coloredLog,
};
