# OpenCode Chinese Translation Project

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v7.0-green.svg)](scripts/package.json)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](#)

[中文](#chinese-documentation) | [English](#english-documentation)

---

## Project Overview

**OpenCode Chinese Translation** is a localized and enhanced distribution of the open-source AI coding agent [OpenCode](https://github.com/anomalyco/opencode). This project aims to lower the barrier for developers by providing full Chinese localization, automated build workflows, and optimizations for the domestic network environment.

With the built-in `opencodenpm` management tool, you can easily update source code, apply translation patches, build binaries, and package releases for multiple platforms.

### Key Features

*   **Complete Localization**: Covers TUI, dialogs, messages, and core workflows.
*   **Automated Workflow**: One-click script for updating, localizing, verifying, and building.
*   **Multi-Platform Support**: Fully supports Windows, macOS, and Linux.
*   **Plugin Integration**: Built-in setup wizards for Oh-My-OpenCode and Antigravity, unlocking multi-agent collaboration and local model support.
*   **Professional CLI**: Provides an intuitive TUI interactive menu.

---

## Quick Start

### 1. Prerequisites

Before starting, ensure your environment meets the following requirements:

*   **Node.js**: >= 18.0.0
*   **Bun**: >= 1.3.0 (for fast building)
*   **Git**: Latest version

### 2. Install Management Tool

It is recommended to install `opencodenpm` globally.

```bash
# Go to scripts directory
cd scripts

# Install dependencies and link command
npm install
npm link
```

### 3. Run Interactive Menu

After installation, run the following command in your terminal:

```bash
opencodenpm
```

You will see a grid-based interactive menu. Use arrow keys or number keys to select functions.

---

## Feature Guide

The `opencodenpm` tool integrates all necessary maintenance functions. Here are the common commands:

### Basic Operations

*   **Full Workflow (`full`)**: Automatically executes source update, cleanup, translation application, verification, and building. Recommended for first-time installation or upgrades.
*   **Update Source (`update`)**: Pulls the latest code from the official repository. Detects local changes and prompts for handling.
*   **Apply Translation (`apply`)**: Injects translation configs from `opencode-i18n` into the source code. Includes variable protection to prevent breaking code.
*   **Build (`build`)**: Compiles OpenCode using Bun. The binary is automatically deployed to the `bin` directory.

### Advanced Features

*   **Deploy (`deploy`)**: Registers `opencode` and `opencodenpm` commands to the system PATH for global access.
*   **Oh-My-OpenCode (`ohmyopencode`)**: Installs the enhancement plugin, enabling Sisyphus, Oracle agents, and UI customization (fonts, background).
*   **Antigravity (`antigravity`)**: Configures the local AI gateway to support Claude 3.5, GPT-4o, DeepSeek, etc.
*   **Package (`package`)**: Generates release ZIP packages for Windows, macOS, and Linux, with auto-generated checksums and release notes.

### Maintenance

*   **Restore Source (`restore`)**: Cleans all uncommitted changes in the source directory, restoring it to a clean Git state.
*   **Rollback (`rollback`)**: One-click rollback to the previous state if issues occur after translation.
*   **Check Environment (`env`)**: Checks if the local development environment meets build requirements.

---

## FAQ

**Q: Build failed with "bun command not found"?**
A: This project depends on Bun for fast builds. Please install it from [bun.sh](https://bun.sh) or run `npm install -g bun`.

**Q: Some interface text is still in English after localization?**
A: OpenCode updates frequently, and some new features may not yet be covered by our translation config. Please submit an Issue to report missing translations.

**Q: How to use custom models?**
A: We recommend using the `opencodenpm antigravity` command for one-click configuration, or manually editing the `provider` section in `~/.config/opencode/opencode.json`.

---

## License

This project is open-sourced under the [MIT License](LICENSE).
The original OpenCode project is copyright [Anomaly Company](https://anomaly.company/).
