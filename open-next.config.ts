import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 基础配置，暂不使用 R2 缓存
  // 可以后续根据需要添加 incrementalCache 等配置
});
