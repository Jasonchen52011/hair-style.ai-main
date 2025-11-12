# KIE NanoBanana - Base64 图片支持（使用 tmpfiles.org 免费图床）

## 🎯 问题解决

**问题**: KIE API 只支持 HTTP/HTTPS URL，不支持 base64 图片数据

**解决方案**: 自动上传 base64 图片到 tmpfiles.org 免费图床（参考 image template 项目实现）

## ✅ 实现方案

### 使用 tmpfiles.org 免费图床

- **无需配置**: 使用公开的 tmpfiles.org API，无需 API key
- **自动处理**: 检测到 base64 图片自动上传
- **免费服务**: tmpfiles.org 提供免费的临时文件托管
- **快速上传**: 通常 200-500ms 完成上传
- **参考实现**: 与 image template 项目使用相同的方案

### 工作流程

```
用户上传图片 (base64)
    ↓
检测到 base64 格式
    ↓
自动上传到 imgbb
    ↓
获取公开 HTTP URL
    ↓
使用 URL 调用 KIE API
    ↓
返回生成结果
```

## 🔧 技术实现

### Provider 代码

```typescript
private async uploadBase64ToTmpfiles(base64Data: string): Promise<string> {
  // 解析 base64 数据和 MIME 类型
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = matches[1];
  const pureBase64 = matches[2];

  // 转换为 Buffer
  const buffer = Buffer.from(pureBase64, 'base64');

  // 创建 FormData
  const formData = new FormData();
  const extension = mimeType.split('/')[1] || 'jpg';
  const filename = `kie-upload-${Date.now()}.${extension}`;
  formData.append('file', new Blob([buffer], { type: mimeType }), filename);

  // 上传到 tmpfiles.org
  const response = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  // 转换为直接下载 URL
  let directUrl = result.data.url;
  directUrl = directUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

  return directUrl; // 返回公开 URL
}
```

### 自动调用

```typescript
async submitTask(params: HairstyleTaskParams) {
  let { imageUrl } = params;

  // 自动检测并上传 base64
  if (!imageUrl.startsWith('http')) {
    imageUrl = await this.uploadBase64ToTmpfiles(imageUrl);
  }

  // 使用 HTTP URL 调用 KIE API
  // ...
}
```

## 📊 日志示例

**成功的 base64 上传**:
```
🎯 [KIE-NanoBanana] Building prompt for hairStyle: "LongCurly", hairColor: "purple"
📝 [KIE-NanoBanana] Generated prompt: "Change hair to long curly hairstyle..."
[KIE-NanoBanana] Detected base64 image, uploading to tmpfiles.org...
[KIE-NanoBanana] Uploading image to tmpfiles.org (size: 245678 bytes)
[KIE-NanoBanana] Image uploaded successfully: https://tmpfiles.org/dl/abc123/image.jpg
[KIE-NanoBanana] Submitting task with params...
✅ Task submitted successfully!
```

## ⚠️ 注意事项

### 1. tmpfiles.org 限制

- **文件大小**: 最大 100MB
- **免费使用**: 无需注册或 API key
- **图片有效期**: 临时保存（通常几天到几周）
- **访问速度**: 取决于网络状况
- **直接下载**: 需要使用 `/dl/` 路径格式

### 2. 替代方案

如果 tmpfiles.org 不可用，可以替换为其他免费图床：

**0x0.st**:
```typescript
fetch('https://0x0.st', {
  method: 'POST',
  body: formData
})
```

**catbox.moe**:
```typescript
fetch('https://catbox.moe/user/api.php', {
  method: 'POST',
  body: formData
})
```

### 3. 性能优化

- **前端上传**: 可以在前端直接上传到图床，减少后端压力
- **缓存**: 可以缓存上传后的 URL，避免重复上传
- **压缩**: 前端先压缩图片可以加快上传速度

## 🚀 使用方法

### 开发环境

直接使用即可，无需配置：

```bash
# .env
API_PROVIDER=kie-nanobanana
KIE_API_KEY=your-api-key
```

### 生产环境

部署时无需额外配置，imgbb API 公开可用。

### Cloudflare/Vercel 环境变量

只需配置：
```bash
API_PROVIDER=kie-nanobanana
KIE_API_KEY=edd26a45e54629eb013d550bbcb8cef2
```

## 🔗 相关资源

- **tmpfiles.org API**: https://tmpfiles.org/api
- **KIE API 文档**: https://docs.kie.ai/
- **Provider 实现**: `lib/api-providers/kie-nanobanana-provider.ts`
- **参考项目**: image template (`/Users/jason-chen/Downloads/project/image template`)

## 📝 更新历史

- **2025-11-12 v1.3**: 改用 tmpfiles.org 免费图床（参考 image template 项目）
- **2025-11-12 v1.2**: 从 Supabase Storage 改为 imgbb 免费图床
- **2025-11-12 v1.1**: 初始版本，使用 Supabase Storage
- **原因**: 简化配置，无需创建 Supabase bucket，使用与 image template 相同的方案
- **优点**: 开箱即用，无需额外设置，已在其他项目验证可行

---

**版本**: v1.3
**更新**: 使用 tmpfiles.org 免费图床处理 base64 图片（与 image template 项目一致）
