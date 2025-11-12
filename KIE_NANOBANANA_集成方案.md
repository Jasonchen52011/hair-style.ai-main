# KIE NanoBanana API 集成方案

## 📋 概述

已成功集成 KIE.AI 的 NanoBanana 图生图模型（基于 Google Gemini 2.5 Flash），作为新的 API Provider。

## ✅ 已完成的工作

### 1. 创建 Provider 实现

**文件**: `lib/api-providers/kie-nanobanana-provider.ts`

**功能**:
- 实现 `HairstyleProvider` 接口
- 支持异步任务提交和状态查询
- 自动将 hairStyle 和 hairColor 转换为 prompt
- 支持 HTTP/HTTPS 图片 URL（不支持 base64）

**关键方法**:
```typescript
class KieNanoBananaProvider implements HairstyleProvider {
  readonly name = 'KIE-NanoBanana';

  // 提交图生图任务
  async submitTask(params: HairstyleTaskParams): Promise<SubmitTaskResponse>

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse>
}
```

### 2. 更新 Provider 工厂

**文件**: `lib/api-providers/index.ts`

**修改**:
- 导入 `KieNanoBananaProvider`
- 添加 `'kie-nanobanana'` 到 `ProviderType`
- 在 `createHairstyleProvider` 中添加 case 分支

### 3. 环境变量配置

**文件**: `.env`

**配置项**:
```bash
# API Provider 选择
API_PROVIDER=kie-nanobanana

# KIE API Key
KIE_API_KEY=edd26a45e54629eb013d550bbcb8cef2
```

### 4. 测试脚本

创建了多个测试脚本：

**test-kie-direct.mjs** (推荐)
- 不依赖额外的包
- 直接测试 API 调用
- 自动轮询任务状态
- 显示详细的日志输出

**test-kie-nanobanana-simple.mjs**
- 依赖 dotenv 包
- 直接 API 测试

**test-kie-nanobanana.mjs**
- 依赖 TypeScript provider
- 完整的集成测试

## 🔌 API 集成详情

### API Endpoint

**Base URL**: `https://api.kie.ai`

**创建任务**: `POST /api/v1/jobs/createTask`
**查询任务**: `GET /api/v1/jobs/recordInfo?taskId={taskId}`

### API 认证

使用 Bearer Token 认证:
```
Authorization: Bearer edd26a45e54629eb013d550bbcb8cef2
```

### 请求示例

```json
{
  "model": "google/nano-banana-edit",
  "input": {
    "prompt": "Transform the person in this photo to have a dark brown short crew cut hairstyle...",
    "image_urls": ["https://example.com/image.jpg"],
    "output_format": "png",
    "image_size": "1:1"
  }
}
```

### 响应示例

**提交任务成功**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "844a6f7756bbc8c2603d395d4f276120"
  }
}
```

**查询任务状态**:
```json
{
  "code": 200,
  "data": {
    "taskId": "844a6f7756bbc8c2603d395d4f276120",
    "model": "google/nano-banana-edit",
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://example.com/result.jpg\"]}",
    "completeTime": 1755599644000,
    "costTime": 8,
    "consumeCredits": 100,
    "remainedCredits": 2510330
  }
}
```

### 任务状态

| 状态 | 说明 | task_status |
|------|------|-------------|
| `waiting` | 等待中 | 1 (PROCESSING) |
| `queuing` | 排队中 | 1 (PROCESSING) |
| `generating` | 生成中 | 1 (PROCESSING) |
| `success` | 成功 | 2 (SUCCESS) |
| `fail` | 失败 | 3 (FAILED) |

## 🚀 使用方法

### 1. 启用 KIE NanoBanana Provider

在 `.env` 文件中设置:
```bash
API_PROVIDER=kie-nanobanana
```

### 2. 运行测试

```bash
# 直接测试 API（推荐）
node test-kie-direct.mjs

# 或使用其他测试脚本
node test-kie-nanobanana-simple.mjs
```

### 3. 在应用中使用

应用会自动根据 `API_PROVIDER` 环境变量选择对应的 provider：

```typescript
import { getHairstyleProvider } from '@/lib/api-providers';

// 自动使用 KIE NanoBanana Provider
const provider = getHairstyleProvider();

// 提交任务
const result = await provider.submitTask({
  imageUrl: 'https://example.com/photo.jpg',
  hairStyle: 'short crew cut',
  hairColor: 'dark brown'
});

// 查询状态
const status = await provider.getTaskStatus(result.taskId);
```

## ⚠️ 注意事项

### 1. 图片 URL 要求

- ✅ 支持：HTTP/HTTPS 图片 URL
- ✅ 支持：Base64 数据 URL（自动上传到免费图床）

**自动处理**: Provider 会自动检测 base64 图片并上传到 tmpfiles.org 免费图床获取公开 URL

**无需额外配置**: 使用免费的 tmpfiles.org API，无需配置额外的存储服务（与 image template 项目相同方案）

### 2. 异步处理

KIE API 是异步的，需要：
1. 提交任务获取 taskId
2. 轮询查询任务状态
3. 等待状态变为 `success` 后获取结果图片 URL

### 3. 状态码映射

Provider 将 KIE 的状态映射为标准的 task_status：
- `1` = PROCESSING (waiting, queuing, generating)
- `2` = SUCCESS (success)
- `3` = FAILED (fail)

### 4. 错误处理

- API 返回 `code !== 200` 表示请求失败
- `state === 'fail'` 表示任务失败
- 查看 `failCode` 和 `failMsg` 获取错误详情

## 📊 测试结果

**测试命令**: `node test-kie-direct.mjs`

**当前状态**: 测试正在运行中...

**测试参数**:
- Hair Style: short crew cut
- Hair Color: dark brown
- Test Image: https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png
- Task ID: 844a6f7756bbc8c2603d395d4f276120

## 🔧 故障排查

### 问题 1: API Key 无效

**错误**: `code: 401`

**解决**: 检查 `.env` 中 `KIE_API_KEY` 是否正确

### 问题 2: 图片 URL 无法访问

**错误**: `code: 400` 或任务失败

**解决**: 确保图片 URL 可公开访问，支持 HTTPS

### 问题 3: 任务一直处于 waiting 状态

**可能原因**:
- API 服务繁忙
- 账户余额不足

**解决**: 检查 `remainedCredits` 余额

## 🔗 相关链接

- **KIE API 文档**: https://docs.kie.ai/
- **测试图片**: https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png
- **API Base URL**: https://api.kie.ai

## 📝 下一步

1. ✅ 等待测试完成，验证 API 功能
2. 🔄 根据测试结果优化 provider 实现
3. 🚀 部署到生产环境（更新 Cloudflare/Vercel 环境变量）
4. 📊 监控 API 调用成功率和响应时间

---

**创建时间**: 2025-11-12
**API 版本**: v1
**模型**: google/nano-banana-edit (Gemini 2.5 Flash)
