# DNS 配置错误修复指南

## ❌ 错误：Content for CNAME record is invalid

## ✅ 快速修复

### 方法 1：在 Cloudflare Pages 中添加域名（推荐）

1. **进入 Cloudflare Pages 项目**
   ```
   https://dash.cloudflare.com/c5e7ee5591bfeeaee016c9a14616498e/pages/view/hair-style-ai-main
   ```

2. **点击 Custom domains**

3. **点击 Set up a custom domain**

4. **输入域名**
   - 输入：`hair-style.ai` 或 `www.hair-style.ai`
   - 点击 **Continue**

5. **自动配置 DNS**
   - Cloudflare 会自动添加 CNAME 记录
   - 点击 **Activate domain**

✅ **完成！** 无需手动配置 DNS

---

### 方法 2：手动配置 DNS（如果方法1失败）

#### Step 1：删除现有的错误记录

1. 进入 Cloudflare DNS 设置
2. 找到配置错误的记录
3. 点击 **Delete**

#### Step 2：重新添加正确的记录

**配置 www 子域名：**
```
类型：CNAME
名称：www
目标：hair-style-ai-main.pages.dev
代理：✅ Proxied
TTL：Auto
```

**配置根域名（@）：**
```
类型：CNAME
名称：@
目标：hair-style-ai-main.pages.dev
代理：✅ Proxied (必须开启！)
TTL：Auto
```

---

## 🚫 **常见错误示例**

### 错误 1：包含协议
❌ `https://hair-style-ai-main.pages.dev`
✅ `hair-style-ai-main.pages.dev`

### 错误 2：包含路径
❌ `hair-style-ai-main.pages.dev/`
✅ `hair-style-ai-main.pages.dev`

### 错误 3：根域名未开启 Proxy
❌ CNAME @ → target (DNS only - 灰色云朵)
✅ CNAME @ → target (Proxied - 橙色云朵)

### 错误 4：错误的目标值
❌ `hair-style-ai-main` (缺少 .pages.dev)
❌ `www.hair-style-ai-main.pages.dev` (多了 www)
✅ `hair-style-ai-main.pages.dev`

---

## 🔍 **验证 DNS 配置**

### 在线工具验证
```
https://dnschecker.org/
```
输入域名查看 CNAME 记录是否正确。

### 命令行验证
```bash
# 检查 www 子域名
dig www.hair-style.ai CNAME

# 检查根域名
dig hair-style.ai A

# 或使用 nslookup
nslookup www.hair-style.ai
```

预期结果应该显示指向 `hair-style-ai-main.pages.dev`

---

## 📞 **还是不行？**

请提供以下信息：

1. **您想配置的域名**：
   - [ ] 根域名（hair-style.ai）
   - [ ] www 子域名（www.hair-style.ai）
   - [ ] 其他子域名（_______）

2. **DNS 服务商**：
   - [ ] Cloudflare
   - [ ] 其他（请说明）

3. **您填写的具体内容**：
   ```
   类型：_______
   名称：_______
   值/目标：_______
   ```

4. **错误截图**（如果可能）

---

## ✅ **推荐配置（最终状态）**

```
域名：hair-style.ai
DNS 记录：

1. CNAME @ → hair-style-ai-main.pages.dev (Proxied ✅)
2. CNAME www → hair-style-ai-main.pages.dev (Proxied ✅)
```

访问测试：
- https://hair-style.ai ✅
- https://www.hair-style.ai ✅
