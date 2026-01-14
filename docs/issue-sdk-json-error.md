# GitHub Issue: client.gen.ts JSON Error Handling

## 标题
`client.gen.ts`: Improve error handling for empty/invalid JSON responses

## 分类
Bug / Enhancement

## 描述 (Description)

When the API returns a 200 OK response with an empty body (not 204), `response.json()` throws `Unexpected end of JSON input`. This happens in edge cases where:
- Server returns 200 with empty body
- Server returns invalid JSON
- Network truncation during response

## 错误信息 (Error Message)

```
Error: Unexpected end of JSON input
  ┃  SyntaxError: Unexpected end of JSON input
  ┃  at json (unknown)
  ┃  at client.gen.ts:167:33
  ┃  at <anonymous> (..\\sdk\\js\\src\\v2\\gen\\client\\client.gen.ts:167:33)
```

## 当前代码 (Current Code)

文件: `packages/sdk/js/src/v2/gen/client/client.gen.ts` (第 167 行附近)

```typescript
case "json":
  data = await response[parseAs]()  // 可能抛错但没有 try-catch
  break
```

## 问题分析 (Problem Analysis)

代码已经正确处理了 204 响应（第 133 行）：
```typescript
if (response.status === 204 || response.headers.get("Content-Length") === "0") {
  // ... handles empty response
}
```

但以下情况仍会抛错：
- 服务器返回 **200 OK** 但响应体为空（不是 204）
- 服务器返回 **200 OK** 但 JSON 格式无效
- 网络传输过程中 JSON 被截断

## 建议修复 (Suggested Fix)

```typescript
case "json":
  try {
    data = await response[parseAs]()
  } catch (err) {
    // Handle empty or invalid JSON gracefully
    if (response.status === 200 && (!response.body || response.headers.get("Content-Length") === "0")) {
      data = null
    } else {
      throw new Error(`Failed to parse JSON response from ${url}: ${err.message}`)
    }
  }
  break
```

## 环境 (Environment)

| 项目 | 内容 |
|------|------|
| OpenCode version | 4347a77d8 (dev branch) |
| OS | Windows (MSYS_NT-10.0-26200) |
| Node version | v22.19.0 |
| 发生频率 | 间歇性 (API 通信时偶发) |

## 附加说明 (Additional Context)

此错误在会话导航期间间歇性出现，与后端服务通信时发生。添加更好的错误处理可以提供更清晰的调试信息。

---

**提交链接**: https://github.com/anomalyco/opencode/issues/new
