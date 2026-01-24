package main

import (
	"opencode-cli/cmd"
)

func main() {
	// 启用虚拟终端处理 (仅 Windows 生效，具体实现在 console_windows.go)
	enableVirtualTerminal()

	cmd.Execute()
}
