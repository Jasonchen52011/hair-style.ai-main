# TODO

## 部署相关

### Cloudflare Pages 要求
- **所有 API 路由都必须使用 Edge Runtime**
  - 在每个 API 路由文件中添加: `export const runtime = 'edge'`
  - 这是 Cloudflare Pages 部署的必要配置
  - 不使用 Edge Runtime 的 API 路由在 Cloudflare Pages 上会无法正常工作

## 已完成
- ✅ 移除 navbar 上的 "Other Tools" 下拉菜单