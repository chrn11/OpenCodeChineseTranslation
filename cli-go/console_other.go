//go:build !windows
// +build !windows

package main

func enableVirtualTerminal() {
	// 非 Windows 系统（Linux/macOS）通常默认支持 ANSI，无需特殊处理
}
