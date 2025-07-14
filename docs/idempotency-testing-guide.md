# 幂等性测试指南

## 概述

本文档描述了如何对Hair Style AI项目中的三种产品进行幂等性测试。我们提供了两种测试方式：

1. **可视化网页测试工具** - 适合手动测试和演示
2. **命令行自动化测试脚本** - 适合CI/CD和批量测试

## 产品概述

项目中有三种主要产品需要测试幂等性：

| 产品类型 | 产品ID | 价格 | 积分 | 特点 |
|---------|--------|------|------|------|
| 按次购买 | `prod_7kbzeBzBsEnWbRA0iTh7wf` | $6.9 | 500 | 需要有月度/年度订阅 |
| 月度订阅 | `prod_6OoADdBXIm16LRR6TN6sFw` | $7.9 | 500 | 每月循环 |
| 年度订阅 | `prod_6N9SkBhig3ofomadscbGr7` | $5.8 | 1000 | 每年循环 |

## 测试工具

### 1. 网页测试工具

#### 访问方式
```
http://localhost:3000/idempotency-test.html
```

#### 功能特点
- ✅ 可视化界面，实时显示测试日志
- ✅ 支持配置重复次数、并发数量、请求间隔
- ✅ 支持单独测试每个产品或批量测试
- ✅ 支持测试Purchase API和Webhook API
- ✅ 实时统计测试结果和幂等性评分
- ✅ 提供详细的测试建议

#### 使用方法

1. **基础配置**
   - 输入测试用户ID（可选，不填会自动生成）
   - 设置重复次数（建议5-10次）
   - 选择是否并发请求
   - 设置请求间隔（毫秒）

2. **Purchase API测试**
   - 点击对应产品的测试按钮
   - 观察日志输出和结果统计
   - 查看幂等性评分和建议

3. **Webhook测试**
   - 输入订单ID（可选）
   - 选择要测试的产品
   - 点击"测试 Webhook 幂等性"
   - 观察重复webhook的处理情况

### 2. 命令行测试脚本

#### 安装依赖
```bash
npm install axios
# 或者确保项目已安装axios依赖
```

#### 基本用法
```bash
# 基础测试
node test-idempotency.js

# 自定义参数
node test-idempotency.js --repeat 10 --concurrent 5 --delay 500

# 测试生产环境
TEST_BASE_URL=https://hair-style.ai node test-idempotency.js

# 查看帮助
node test-idempotency.js --help
```

#### 命令行参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `--base-url <url>` | 测试基础URL | `http://localhost:3000` |
| `--repeat <count>` | 重复请求次数 | `5` |
| `--concurrent <count>` | 并发请求数量 | `3` |
| `--delay <ms>` | 请求间隔时间 | `1000` |
| `--timeout <ms>` | 请求超时时间 | `30000` |
| `--help, -h` | 显示帮助信息 | - |

#### 环境变量

| 变量名 | 描述 | 示例 |
|-------|------|------|
| `TEST_BASE_URL` | 测试基础URL | `https://hair-style.ai` |

## 测试场景

### 1. Purchase API幂等性

**测试目标**: 验证重复的购买请求是否被正确处理

**测试方法**:
- 使用相同用户ID和产品ID发送多次购买请求
- 检查是否只有第一次请求成功，后续请求被拒绝
- 验证错误消息是否正确

**预期结果**:
- 第一次请求：成功创建checkout
- 后续请求：被拒绝，返回适当的错误消息
- 不应该创建重复的订单或积分

### 2. Webhook幂等性

**测试目标**: 验证重复的webhook是否被正确处理

**测试方法**:
- 使用相同的订单ID发送多次webhook请求
- 检查第一次webhook是否正常处理
- 验证后续webhook是否被识别为重复并跳过

**预期结果**:
- 第一次webhook：正常处理，创建订阅和积分记录
- 后续webhook：返回`alreadyProcessed: true`，不重复处理
- 数据库中不应该有重复记录

### 3. 并发测试

**测试目标**: 验证同时发送的多个请求的处理情况

**测试方法**:
- 同时发送多个相同的请求
- 检查是否只有一个请求成功处理

**预期结果**:
- 只有一个请求成功
- 其他请求应该被拒绝或识别为重复

## 结果分析

### 幂等性评分标准

| 评分 | 描述 | 标准 |
|------|------|------|
| 100分 | 完美幂等性 | 只有1个成功请求 |
| 80分 | 良好幂等性 | 2个成功请求 |
| 60分 | 一般幂等性 | 3个成功请求 |
| 40分 | 较差幂等性 | 4个成功请求 |
| 20分 | 差幂等性 | 5个成功请求 |
| 0分 | 无幂等性 | 6+个成功请求 |

### 常见问题和解决方案

#### 1. 所有请求都成功
**问题**: 幂等性检查失效
**可能原因**:
- 缺少幂等性检查逻辑
- 唯一约束未生效
- 事务隔离级别问题

**解决方案**:
- 检查订单ID/用户ID的唯一性约束
- 添加幂等性检查中间件
- 优化数据库事务处理

#### 2. 所有请求都失败
**问题**: 服务不可用或配置错误
**可能原因**:
- 服务未启动
- 数据库连接问题
- API密钥配置错误

**解决方案**:
- 检查服务状态
- 验证环境变量配置
- 查看服务日志

#### 3. 并发请求多个成功
**问题**: 竞态条件
**可能原因**:
- 缺少分布式锁
- 数据库事务未正确处理
- 缓存一致性问题

**解决方案**:
- 实现分布式锁机制
- 优化数据库索引和约束
- 使用Redis等缓存层

## 最佳实践

### 1. 测试环境准备
- 使用独立的测试数据库
- 确保测试用户有适当的权限
- 清理测试数据

### 2. 测试频率
- 每次代码变更后运行
- 定期进行压力测试
- 生产部署前必须测试

### 3. 监控和报警
- 设置幂等性失败报警
- 监控重复请求数量
- 记录异常模式

### 4. 文档维护
- 及时更新产品ID
- 记录测试结果
- 分享最佳实践

## 集成到CI/CD

### GitHub Actions示例

```yaml
name: Idempotency Tests

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  idempotency-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 30  # Wait for app to start
        
    - name: Run idempotency tests
      run: node test-idempotency.js --repeat 10 --concurrent 5
      env:
        TEST_BASE_URL: http://localhost:3000
        
    - name: Upload test results
      uses: actions/upload-artifact@v2
      if: always()
      with:
        name: idempotency-test-results
        path: idempotency-test-report-*.json
```

### Package.json脚本

```json
{
  "scripts": {
    "test:idempotency": "node test-idempotency.js",
    "test:idempotency:quick": "node test-idempotency.js --repeat 3 --concurrent 2",
    "test:idempotency:stress": "node test-idempotency.js --repeat 20 --concurrent 10",
    "test:idempotency:prod": "TEST_BASE_URL=https://hair-style.ai node test-idempotency.js"
  }
}
```

## 故障排除

### 常见错误

#### 1. 连接被拒绝
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**解决方案**: 确保应用服务器正在运行

#### 2. 认证失败
```
Error: User not authenticated
```
**解决方案**: 检查测试用户设置和认证逻辑

#### 3. 产品ID不存在
```
Error: Invalid product_id
```
**解决方案**: 验证配置文件中的产品ID是否正确

### 调试技巧

1. **启用详细日志**
   ```bash
   DEBUG=* node test-idempotency.js
   ```

2. **检查数据库状态**
   ```sql
   SELECT * FROM orders WHERE user_id = 'test-user-xxx';
   SELECT * FROM subscriptions WHERE user_id = 'test-user-xxx';
   ```

3. **使用网页工具单步调试**
   - 设置重复次数为1
   - 逐步观察每个请求的响应

## 总结

幂等性是支付系统的关键特性，通过这些测试工具可以有效验证系统的幂等性表现。建议：

1. **定期测试**: 每次代码变更都应该运行幂等性测试
2. **多场景覆盖**: 测试正常流程、异常情况和边界条件
3. **持续监控**: 在生产环境中监控重复请求的处理情况
4. **文档更新**: 保持测试文档和工具的时效性

通过系统的幂等性测试，可以确保用户不会被重复收费，系统数据保持一致性，提供可靠的支付体验。 