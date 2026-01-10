#!/bin/bash
# ========================================
# OpenCode 汉化版 - 一键安装脚本 v2.0
# Linux/macOS 完整安装
# 使用方式: curl -fsSL https://gitee.com/QtCodeCreators/OpenCodeChineseTranslation/raw/main/scripts/install.sh | bash
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# 项目配置
REPO_GITEE="QtCodeCreators/OpenCodeChineseTranslation"
REPO_NAME="OpenCodeChineseTranslation"
PROJECT_DIR="$HOME/$REPO_NAME"

# 打印函数
print_banner() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}${WHITE}     OpenCode 中文汉化版 - 一键安装脚本                    ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}${WHITE}     Linux/macOS                                           ${NC}${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${WHITE}  $1${NC}"
}

# 检测系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# 检查命令
has_cmd() {
    command -v "$1" &> /dev/null
}

# 智能 sudo
SUDO_CMD=""
if [ "$(id -u)" != "0" ]; then
    if has_cmd sudo; then
        SUDO_CMD="sudo"
    else
        print_error "需要 root 权限，但未找到 sudo"
        print_info "请运行: sudo bash $0"
        exit 1
    fi
fi

print_banner

# 1. 检查环境
print_step "1/7 检查系统环境..."
OS_TYPE=$(detect_os)
print_info "操作系统: $OS_TYPE"

# 检查 Node.js
if has_cmd node; then
    NODE_VER=$(node -v)
    print_success "Node.js: $NODE_VER"
else
    print_info "Node.js: 未安装 (将自动安装)"
fi

# 检查 Git
if has_cmd git; then
    GIT_VER=$(git --version | awk '{print $3}')
    print_success "Git: $GIT_VER"
else
    print_info "Git: 未安装 (将自动安装)"
fi

echo ""

# 2. 确定安装目录
print_step "2/7 确定安装目录..."

# 优先使用当前目录（如果在 git 仓库中）
if [ -d .git ] && [ -d opencode-i18n ]; then
    PROJECT_DIR="$(pwd)"
    print_info "使用当前目录: $PROJECT_DIR"
else
    # 检查是否已克隆
    if [ -d "$PROJECT_DIR" ]; then
        print_info "使用已存在目录: $PROJECT_DIR"
    else
        print_info "将克隆到: $PROJECT_DIR"
    fi
fi
echo ""

# 3. 克隆/更新仓库
print_step "3/7 获取项目文件..."

if [ -d "$PROJECT_DIR/.git" ]; then
    print_info "更新现有仓库..."
    cd "$PROJECT_DIR"
    git pull --rebase 2>/dev/null || true
else
    print_info "克隆仓库..."
    # 优先使用 Gitee
    if git clone --depth 1 "https://gitee.com/$REPO_GITEE.git" "$PROJECT_DIR" 2>/dev/null; then
        print_success "从 Gitee 克隆成功"
    elif git clone --depth 1 "https://github.com/1186258278/$REPO_NAME.git" "$PROJECT_DIR" 2>/dev/null; then
        print_success "从 GitHub 克隆成功"
    else
        print_error "克隆失败，请检查网络"
        exit 1
    fi
    cd "$PROJECT_DIR"
fi
echo ""

# 4. 安装依赖
print_step "4/7 安装依赖..."

# 安装 Codes 工具
if ! has_cmd codes; then
    print_info "安装 Codes 管理工具..."
    bash scripts/install.sh
    # 刷新环境
    export PATH="$HOME/.local/bin:$PATH"
    hash -r 2>/dev/null
    print_success "Codes 已安装"
else
    print_success "Codes 已安装"
fi

# 检查 Node.js
if ! has_cmd node; then
    print_info "安装 Node.js..."
    codes install 1
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    export PATH="$NVM_DIR/versions/node/*/bin:$PATH"
fi

echo ""

# 5. 安装汉化脚本
print_step "5/7 安装汉化管理工具..."

OS_TYPE=$(detect_os)
if [ "$OS_TYPE" = "linux" ] || [ "$OS_TYPE" = "macos" ]; then
    # Linux/macOS 版本
    I18N_DIR="$PROJECT_DIR/scripts/opencode-linux"

    if [ ! -d "$I18N_DIR" ]; then
        mkdir -p "$I18N_DIR"
    fi

    # 检查是否已有文件
    if [ -f "$I18N_DIR/opencode.js" ]; then
        print_info "汉化脚本已存在"
    else
        print_info "创建汉化脚本目录..."
        mkdir -p "$I18N_DIR/lib"
    fi

    # 安装 npm 依赖
    if [ ! -d "$I18N_DIR/node_modules" ]; then
        print_info "安装 npm 依赖..."
        cd "$I18N_DIR" && npm install > /dev/null 2>&1
        cd "$PROJECT_DIR"
    fi

    print_success "汉化管理工具已就绪"
else
    print_error "不支持的操作系统: $OS_TYPE"
    exit 1
fi
echo ""

# 6. 创建全局命令
print_step "6/7 创建全局命令..."

# 创建 opencodecmd
CMD_DIR="$HOME/.local/bin"
mkdir -p "$CMD_DIR" 2>/dev/null

cat > "$CMD_DIR/opencodecmd" << 'EOF'
#!/bin/bash
# OpenCode 中文汉化管理工具 - 全局命令
find_project() {
    local dir="$(pwd)"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/scripts/opencode-linux/opencode.js" ]; then
            echo "$dir"
            return 0
        fi
        if [ -f "$dir/scripts/opencode/opencode.ps1" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    # 检查 HOME 目录
    if [ -f "$HOME/OpenCodeChineseTranslation/scripts/opencode-linux/opencode.js" ]; then
        echo "$HOME/OpenCodeChineseTranslation"
        return 0
    fi
    return 1
}

PROJECT=$(find_project)
if [ -n "$PROJECT" ]; then
    if [ -f "$PROJECT/scripts/opencode-linux/opencode.js" ]; then
        cd "$PROJECT" && node "$PROJECT/scripts/opencode-linux/opencode.js" "$@"
    elif [ -f "$PROJECT/scripts/opencode/opencode.ps1" ]; then
        print_info "请在 PowerShell 中运行汉化脚本"
        print_info "或运行: pwsh \"$PROJECT/scripts/opencode/opencode.ps1\""
    fi
else
    print_error "未找到 OpenCode 项目目录"
    print_info "请先进入项目目录或运行: codes i18n"
    exit 1
fi
EOF

chmod +x "$CMD_DIR/opencodecmd"

# 添加到 PATH
if [[ ":$PATH:" != *":$CMD_DIR:"* ]]; then
    export PATH="$CMD_DIR:$PATH"
    # 添加到 .bashrc
    if ! grep -q "$CMD_DIR" ~/.bashrc 2>/dev/null; then
        echo '' >> ~/.bashrc
        echo '# OpenCode 汉化工具' >> ~/.bashrc
        echo "export PATH=\"$CMD_DIR:\$PATH\"" >> ~/.bashrc
    fi
    print_success "已将 $CMD_DIR 添加到 PATH"
else
    print_success "全局命令已就绪"
fi
echo ""

# 7. 完成
print_step "7/7 安装完成！"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}${WHITE}              安装成功！现在可以开始使用了              ${NC}${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}快速开始:${NC}"
echo -e "  ${WHITE}1. 进入项目目录:${NC}"
echo -e "     ${YELLOW}cd $PROJECT_DIR${NC}"
echo ""
echo -e "  ${WHITE}2. 运行汉化脚本:${NC}"
echo -e "     ${YELLOW}opencodecmd${NC}           # 交互菜单"
echo -e "     ${YELLOW}opencodecmd full${NC}       # 一键全流程"
echo ""
echo -e "  ${WHITE}3. 或使用 Codes 工具:${NC}"
echo -e "     ${YELLOW}codes run${NC}             # 启动汉化脚本"
echo -e "     ${YELLOW}codes i18n${NC}            # 重新安装汉化工具"
echo ""
echo -e "${CYAN}全局命令 (任意位置):${NC}"
echo -e "  ${YELLOW}opencodecmd${NC}              # 启动菜单"
echo -e "  ${YELLOW}opencodecmd update${NC}       # 拉取源码"
echo -e "  ${YELLOW}opencodecmd apply${NC}        # 应用汉化"
echo -e "  ${YELLOW}opencodecmd build${NC}        # 编译构建"
echo -e "  ${YELLOW}opencodecmd full${NC}         # 一键全流程"
echo ""
echo -e "${MAGENTA}提示: 如果命令未生效，请运行: source ~/.bashrc${NC}"
echo ""
