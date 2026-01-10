#!/bin/bash
# 创建全局 opencodecmd 命令

set -e

INSTALL_DIR="$PWD/scripts/opencode-linux"
CMD_NAME="opencodecmd"

# 检查脚本是否存在
if [ ! -f "$INSTALL_DIR/opencode.js" ]; then
    echo "错误: 找不到 opencode.js"
    echo "请先运行: cd $INSTALL_DIR && npm install"
    exit 1
fi

# 检查依赖
if [ ! -d "$INSTALL_DIR/node_modules" ]; then
    echo "正在安装依赖..."
    (cd "$INSTALL_DIR" && npm install)
fi

# 目标位置
TARGET_DIR="$HOME/.local/bin"
TARGET_FILE="$TARGET_DIR/$CMD_NAME"

# 创建目录
mkdir -p "$TARGET_DIR"

# 创建命令脚本
cat > "$TARGET_FILE" << 'EOF'
#!/bin/bash
# OpenCode 中文汉化管理工具 - 全局命令

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 尝试多个可能的安装位置
if [ -f "$SCRIPT_DIR/opencode-linux/opencode.js" ]; then
    # 从项目根目录调用
    node "$SCRIPT_DIR/opencode-linux/opencode.js" "$@"
elif [ -f "$HOME/opencode-linux/opencode.js" ]; then
    # 从用户目录调用
    node "$HOME/opencode-linux/opencode.js" "$@"
else
    # 查找当前目录
    SEARCH_DIR="$(pwd)"
    while [ "$SEARCH_DIR" != "/" ]; do
        if [ -f "$SEARCH_DIR/scripts/opencode-linux/opencode.js" ]; then
            node "$SEARCH_DIR/scripts/opencode-linux/opencode.js" "$@"
            exit 0
        fi
        SEARCH_DIR="$(dirname "$SEARCH_DIR")"
    done
    echo "错误: 找不到 opencode.js"
    echo "请确保已安装 OpenCode 汉化脚本"
    exit 1
fi
EOF

chmod +x "$TARGET_FILE"

# 检查 ~/.local/bin 是否在 PATH 中
if [[ ":$PATH:" != *":$TARGET_DIR:"* ]]; then
    echo "======================================"
    echo "✓ 全局命令已创建: $TARGET_FILE"
    echo ""
    echo "⚠ 需要将 ~/.local/bin 添加到 PATH"
    echo ""
    echo "运行以下命令:"
    echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo ""
    echo "或在当前会话中:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo "======================================"
else
    echo "======================================"
    echo "✓ 全局命令已安装!"
    echo ""
    echo "现在可以在任何位置运行:"
    echo "  $CMD_NAME"
    echo "  $CMD_NAME update"
    echo "  $CMD_NAME full"
    echo "======================================"
fi
