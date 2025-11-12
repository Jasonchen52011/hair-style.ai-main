# SSL Error 526 修复指南

## ❌ 错误：Invalid SSL certificate (Error code 526)

**错误含义**：Cloudflare 无法验证源服务器的 SSL 证书

---

## ✅ 解决方案 1：修改 SSL 加密模式（推荐，立即生效）

### Step 1：进入 SSL 设置

1. 登录：https://dash.cloudflare.com
2. 选择域名：`hair-style.ai`
3. 左侧菜单点击：**SSL/TLS**
4. 点击顶部的 **Overview** 标签

### Step 2：修改加密模式

找到 "SSL/TLS encryption mode"，选择：

#### 选项对比：

| 模式 | 说明 | 适用场景 | 推荐 |
|------|------|---------|------|
| **Off** | 不使用 HTTPS | 不安全，不推荐 | ❌ |
| **Flexible** | 浏览器到 CF 加密，CF 到源不加密 | 源服务器无 SSL | ⚠️ |
| **Full** | 全程加密，接受自签名证书 | **Cloudflare Pages** | ✅ 推荐 |
| **Full (strict)** | 全程加密，要求有效证书 | 源有权威 SSL 证书 | ⚠️ 慎用 |

#### 正确设置：

```
SSL/TLS encryption mode: Full
```

**为什么选 Full？**
- Cloudflare Pages 自动提供 SSL 证书
- "Full" 模式接受 Cloudflare 自签名证书
- "Full (strict)" 要求证书必须由权威 CA 签发，可能导致 526 错误

### Step 3：保存并等待

- 点击 **Save** 或自动保存
- 等待 2-5 分钟让设置生效
- 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
- 重新访问：https://hair-style.ai

---

## ✅ 解决方案 2：等待 SSL 证书生成

如果您刚配置 DNS，SSL 证书可能还在生成中。

### 检查 SSL 状态

1. **进入 Cloudflare Pages**
   ```
   https://dash.cloudflare.com/c5e7ee5591bfeeaee016c9a14616498e/pages/view/hair-style-ai-main/domains
   ```

2. **查看域名状态**

   ✅ 正常状态：
   ```
   hair-style.ai - ✅ Active (SSL: ✓)
   www.hair-style.ai - ✅ Active (SSL: ✓)
   ```

   ⏳ 等待中：
   ```
   hair-style.ai - ⏳ Awaiting certificate
   ```

   ❌ 错误状态：
   ```
   hair-style.ai - ❌ Failed
   ```

3. **等待时间**
   - 通常：5-15 分钟
   - 最长：24 小时

---

## ✅ 解决方案 3：重新配置域名

如果 SSL 一直显示错误：

### Step 1：删除现有域名

1. 进入 Cloudflare Pages → Custom domains
2. 找到 `hair-style.ai`
3. 点击 **⋯** → **Remove domain**

### Step 2：重新添加域名

1. 点击 **Set up a custom domain**
2. 输入：`hair-style.ai`
3. 点击 **Continue**
4. Cloudflare 自动配置 DNS
5. 点击 **Activate domain**

### Step 3：等待 SSL 激活

- 通常 5-15 分钟
- 检查域名旁边是否显示 ✅ Active

---

## 🔍 **验证 SSL 是否正常**

### 方法 1：在线检查

访问：https://www.ssllabs.com/ssltest/analyze.html?d=hair-style.ai

### 方法 2：浏览器检查

1. 访问：https://hair-style.ai
2. 点击地址栏的 🔒 锁图标
3. 查看证书信息
4. 应该显示：
   ```
   颁发者：Cloudflare Inc ECC CA-3
   有效期：未来日期
   ```

### 方法 3：命令行检查

```bash
curl -I https://hair-style.ai
```

应该返回：
```
HTTP/2 200
```

---

## ⚠️ **常见问题**

### Q1：修改 SSL 设置后还是 526 错误？

**A**：清除浏览器缓存和 Cloudflare 缓存

1. **清除浏览器缓存**：
   - Chrome/Edge: Ctrl+Shift+Delete
   - 或强制刷新：Ctrl+Shift+R (Mac: Cmd+Shift+R)

2. **清除 Cloudflare 缓存**：
   ```
   Cloudflare Dashboard → Caching → Configuration → Purge Everything
   ```

### Q2：SSL 设置是 "Full" 但还是报错？

**A**：检查 DNS 配置是否正确

1. 确认 DNS 记录指向 Cloudflare Pages：
   ```
   CNAME @ → hair-style-ai-main.pages.dev
   ```

2. 确认代理状态：
   ```
   ✅ Proxied (橙色云朵)
   ```

### Q3：等了很久 SSL 还是不行？

**A**：联系 Cloudflare 支持

或者尝试使用 Cloudflare Pages 的预览域名：
```
https://hair-style-ai-main.pages.dev
```

---

## 📋 **快速检查清单**

- [ ] SSL 加密模式设置为 "Full"（不是 Full (strict)）
- [ ] DNS CNAME 记录正确指向 `hair-style-ai-main.pages.dev`
- [ ] DNS 代理状态为 Proxied（橙色云朵）
- [ ] Cloudflare Pages 自定义域名显示 ✅ Active
- [ ] 已等待至少 15 分钟
- [ ] 已清除浏览器缓存

---

## 🔗 **相关链接**

- **Cloudflare SSL 设置**: https://dash.cloudflare.com → 域名 → SSL/TLS
- **Cloudflare Pages 域名**: https://dash.cloudflare.com/c5e7ee5591bfeeaee016c9a14616498e/pages/view/hair-style-ai-main/domains
- **SSL Labs 测试**: https://www.ssllabs.com/ssltest/
- **Cloudflare 526 错误文档**: https://developers.cloudflare.com/ssl/troubleshooting/version-cipher-mismatch/

---

## ✅ **最终确认**

修复后，访问 https://hair-style.ai 应该：
- ✅ 显示网站内容（不是错误页面）
- ✅ 地址栏显示 🔒 锁图标
- ✅ SSL 证书有效
- ✅ 无警告信息
