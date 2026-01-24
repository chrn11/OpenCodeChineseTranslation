package cmd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

const DefaultAntigravityEndpoint = "http://127.0.0.1:8045"

var antigravityCmd = &cobra.Command{
	Use:   "antigravity",
	Short: "Configure Antigravity Tools endpoint",
	Long:  "Configure Antigravity Tools AI proxy endpoint for OpenCode",
	Run: func(cmd *cobra.Command, args []string) {
		runAntigravity()
	},
}

func init() {
	rootCmd.AddCommand(antigravityCmd)
}

// OpencodeConfig OpenCode 配置结构
type OpencodeConfig struct {
	Schema     string                            `json:"$schema,omitempty"`
	Provider   map[string]interface{}            `json:"provider,omitempty"`
	Model      string                            `json:"model,omitempty"`
	McpServers map[string]map[string]interface{} `json:"mcpServers,omitempty"`
}

func runAntigravity() {
	fmt.Println("")
	fmt.Println("══════════════════════════════════════════════════")
	fmt.Println("  Antigravity Tools 配置向导")
	fmt.Println("══════════════════════════════════════════════════")
	fmt.Println("")
	fmt.Println("  Antigravity Tools 是本地 AI 模型代理服务")
	fmt.Println("  支持 Claude / GPT / Gemini / DeepSeek 等模型")
	fmt.Printf("  默认端点: %s\n", DefaultAntigravityEndpoint)
	fmt.Println("")

	reader := bufio.NewReader(os.Stdin)

	// 1. 输入端点地址
	fmt.Println("▶ 步骤 1/3: 配置端点地址")
	fmt.Println("  直接回车使用默认端点，或输入自定义地址")
	fmt.Printf("  端点地址 [%s]: ", DefaultAntigravityEndpoint)

	endpoint, _ := reader.ReadString('\n')
	endpoint = strings.TrimSpace(endpoint)
	if endpoint == "" {
		endpoint = DefaultAntigravityEndpoint
	}

	fmt.Printf("✓ 端点地址: %s\n", endpoint)
	fmt.Println("")

	// 2. 测试连接
	fmt.Println("▶ 步骤 2/3: 测试端点连接")
	fmt.Printf("  正在连接 %s...\n", endpoint)

	isOnline := testAntigravityEndpoint(endpoint)
	if !isOnline {
		fmt.Println("✗ 端点无法连接!")
		fmt.Println("")
		fmt.Println("  可能的原因:")
		fmt.Println("    1. Antigravity Tools 服务未启动")
		fmt.Println("    2. 端点地址不正确")
		fmt.Println("    3. 防火墙阻止了连接")
		fmt.Println("")
		fmt.Print("  是否仍要保存配置? [y/N]: ")
		answer, _ := reader.ReadString('\n')
		answer = strings.TrimSpace(strings.ToLower(answer))
		if answer != "y" && answer != "yes" {
			fmt.Println("配置已取消")
			return
		}
	} else {
		fmt.Println("✓ 端点连接成功!")
	}
	fmt.Println("")

	// 3. 可选 API Key
	fmt.Println("▶ 步骤 3/3: 配置 API Key (可选)")
	fmt.Println("  本地服务通常无需 API Key，直接回车跳过")
	fmt.Print("  API Key: ")

	apiKey, _ := reader.ReadString('\n')
	apiKey = strings.TrimSpace(apiKey)

	// 确认配置
	fmt.Println("")
	fmt.Println("──────────────────────────────────────────────────")
	fmt.Println("  配置预览:")
	fmt.Printf("    端点: %s\n", endpoint)
	if apiKey != "" {
		fmt.Println("    API Key: 已设置 (*****)")
	} else {
		fmt.Println("    API Key: 未设置 (无需认证)")
	}
	fmt.Println("──────────────────────────────────────────────────")
	fmt.Println("")

	fmt.Print("确认保存配置? [Y/n]: ")
	confirm, _ := reader.ReadString('\n')
	confirm = strings.TrimSpace(strings.ToLower(confirm))
	if confirm == "n" || confirm == "no" {
		fmt.Println("配置已取消")
		return
	}

	// 写入配置
	fmt.Println("")
	fmt.Println("▶ 保存配置")

	configPath := getOpencodeConfigPath()
	config := readOpencodeConfig(configPath)

	if config.Provider == nil {
		config.Provider = make(map[string]interface{})
	}

	// 配置 Antigravity Tools (Gemini)
	// 使用 v1beta 接口
	geminiBaseURL := fmt.Sprintf("%s/v1beta", endpoint)

	geminiOptions := map[string]interface{}{
		"baseURL": geminiBaseURL,
		"apiKey":  "1", // 本地网关通常不需要真实 Key，但 SDK 可能校验非空
	}
	if apiKey != "" {
		geminiOptions["apiKey"] = apiKey
	}

	config.Provider["AntigravityToolsGemini"] = map[string]interface{}{
		"npm":     "@ai-sdk/google",
		"name":    "Antigravity (Gemini)",
		"options": geminiOptions,
		"models": map[string]interface{}{
			"gemini-3-pro-high": map[string]interface{}{
				"id":   "gemini-3-pro-high",
				"name": "Gemini 3 Pro High",
				"limit": map[string]int{
					"context": 1000000,
					"output":  20000,
				},
			},
			"gemini-3-pro-low": map[string]interface{}{
				"id":   "gemini-3-pro-low",
				"name": "Gemini 3 Pro Low",
				"limit": map[string]int{
					"context": 1000000,
					"output":  20000,
				},
			},
		},
	}

	// 配置 Antigravity Tools (Claude)
	// 假设 Antigravity 提供了标准 Anthropic 兼容接口
	claudeOptions := map[string]interface{}{
		"baseURL": fmt.Sprintf("%s/v1", endpoint), // 通常映射到 /v1
		"apiKey":  "1",
	}
	if apiKey != "" {
		claudeOptions["apiKey"] = apiKey
	}

	config.Provider["AntigravityToolsClaude"] = map[string]interface{}{
		"npm":     "@ai-sdk/anthropic",
		"name":    "Antigravity (Claude)",
		"options": claudeOptions,
		"models": map[string]interface{}{
			"claude-opus-4-5-thinking": map[string]interface{}{
				"id":   "claude-opus-4-5-thinking",
				"name": "Claude Opus 4.5 (Thinking)",
				"limit": map[string]int{
					"context": 200000,
					"output":  20000,
				},
			},
		},
	}

	// 设置默认模型
	// 如果用户没有设置过模型，或者原模型是旧的 antigravity 配置，则更新
	if config.Model == "" || strings.HasPrefix(config.Model, "antigravity/") {
		config.Model = "AntigravityToolsGemini/gemini-3-pro-high"
	}

	if err := writeOpencodeConfig(configPath, config); err != nil {
		fmt.Printf("✗ 保存配置失败: %v\n", err)
		return
	}

	fmt.Println("✓ 配置保存成功!")
	fmt.Println("")
	fmt.Println("══════════════════════════════════════════════════")
	fmt.Println("  ✓ Antigravity Tools 配置完成!")
	fmt.Println("══════════════════════════════════════════════════")
	fmt.Println("")
	fmt.Printf("  配置文件: %s\n", configPath)
	fmt.Println("")
	fmt.Println("  已添加 Provider:")
	fmt.Println("    1. AntigravityToolsGemini (推荐)")
	fmt.Println("    2. AntigravityToolsClaude")
	fmt.Println("")
	fmt.Printf("  当前默认模型: %s\n", config.Model)
	fmt.Println("")
	fmt.Println("  下一步操作:")
	fmt.Println("    1. 启动 OpenCode: opencode")
	fmt.Println("    2. 运行 /models 确认模型列表")
	fmt.Println("    3. 开始使用!")
}

func testAntigravityEndpoint(endpoint string) bool {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/v1/models", endpoint))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func getOpencodeConfigPath() string {
	var configDir string
	homeDir, _ := os.UserHomeDir()

	switch runtime.GOOS {
	case "windows":
		configDir = filepath.Join(homeDir, ".config", "opencode")
	default:
		configDir = filepath.Join(homeDir, ".config", "opencode")
	}

	jsonc := filepath.Join(configDir, "opencode.jsonc")
	if _, err := os.Stat(jsonc); err == nil {
		return jsonc
	}

	return filepath.Join(configDir, "opencode.json")
}

func readOpencodeConfig(path string) OpencodeConfig {
	config := OpencodeConfig{}

	data, err := os.ReadFile(path)
	if err != nil {
		return config
	}

	// 简单移除注释
	content := string(data)
	lines := strings.Split(content, "\n")
	var cleaned []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "//") {
			cleaned = append(cleaned, line)
		}
	}

	json.Unmarshal([]byte(strings.Join(cleaned, "\n")), &config)
	return config
}

func writeOpencodeConfig(path string, config OpencodeConfig) error {
	configDir := filepath.Dir(path)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	config.Schema = "https://opencode.ai/config.json"
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
