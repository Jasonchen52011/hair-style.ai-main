export const IP_CONFIG = {
  // 每日请求限制
  DAILY_LIMIT: 5,
  
  // 白名单 IP 列表
  WHITELIST_IPS: [
    '127.0.0.1'  // 替换成你的实际 IP
  ],
  
  // Redis 键前缀
  REDIS_KEY_PREFIX: 'ip-limit:'
} 