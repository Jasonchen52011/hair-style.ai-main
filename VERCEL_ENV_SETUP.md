# Vercel 环境变量配置指南

## 📝 **必需的环境变量**

访问：https://vercel.com → 项目 → Settings → Environment Variables

### ✅ **核心配置（必需）**

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://tnolrawxpimpxcplyvwt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODgyNzMsImV4cCI6MjA2ODY2NDI3M30.hv8LSkps1NgS6zZBI0iNrKiFiDV6UakCRBc37GBKXc0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20

# API Provider 配置（重要！）
API_PROVIDER=jimeng

# Volc/Jimeng 4.0 API 配置（重要！）
VOLC_ACCESS_KEY=your-volc-access-key
VOLC_SECRET_KEY=your-volc-secret-key
VOLC_I2I_API_URL=https://visual.volcengineapi.com
VOLC_I2I_REQ_KEY=jimeng_t2i_v40
VOLC_I2I_REGION=cn-north-1
VOLC_I2I_SERVICE=cv

# Google API
GOOGLE_API_KEY=AIzaSyDMtTu8WN1WiHiGj7H2mqjhuqrBG9O9RuM
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDMtTu8WN1WiHiGj7H2mqjhuqrBG9O9RuM
```

### 💳 **Stripe 配置（如果使用支付）**

```bash
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_PRIVATE_KEY=your-stripe-private-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### 🔐 **Next Auth 配置（如果使用 Google 登录）**

```bash
AUTH_SECRET=e5K3n5FnzVsnQNVSu9nu41Liq/M47PgzF1VIGeQXfoQ=
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_AUTH_GOOGLE_ID=your-google-client-id
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=true
```

### 🌐 **其他配置**

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_PAY_SUCCESS_URL=https://your-domain.vercel.app/my-orders
NEXT_PUBLIC_PAY_CANCEL_URL=https://your-domain.vercel.app/pricing
SECRET=cdb4705416365d35cb4b9d60a973b7872e411b72e6dac3982a5df934937c26cd
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=137767f133dca34af6fba21e57149c059cdc7f256f53ae11dcbcdeb103de8ea7
```

---

## 📝 **配置步骤**

### 1. 逐个添加环境变量

在 Vercel Dashboard：

1. 点击 **Add New**
2. 输入 **Name**（变量名）
3. 输入 **Value**（变量值）
4. 选择环境：
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. 点击 **Save**

### 2. 重新部署

添加完所有环境变量后：

1. 进入 **Deployments** 页面
2. 找到最新的部署
3. 点击 **⋯** → **Redeploy**

或者等待 GitHub 推送自动触发部署（已完成推送 b024122a）

---

## ⚠️ **常见错误修复**

### 错误 1：Supabase client error
```
Error: Your project's URL and API key are required
```
**解决**：添加这3个变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 错误 2：API application not exists
```
error_code: 401
message: 'The application does not exist.'
```
**解决**：确保配置了：
- `VOLC_I2I_REQ_KEY=jimeng_t2i_v40`
- `VOLC_ACCESS_KEY`
- `VOLC_SECRET_KEY`

### 错误 3：Build failed
**解决**：在 Vercel 项目设置中：
- Build Command: `pnpm run build` 或 `npm run build`
- Output Directory: `.next`
- Install Command: `pnpm install` 或 `npm install`

---

## 🔗 **快速链接**

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub 仓库**: https://github.com/Jasonchen52011/hair-style.ai-main
- **最新提交**: b024122a - "Trigger Vercel deployment with Jimeng 4.0 config"

---

## ✅ **验证部署**

部署完成后，访问您的 Vercel 域名测试功能是否正常。

如果还有错误，检查：
1. Vercel Deployments 页面的构建日志
2. Runtime Logs 查看运行时错误
3. 确认所有环境变量都已正确添加
