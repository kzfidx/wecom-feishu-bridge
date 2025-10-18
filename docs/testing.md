# 测试指南（Jest）

本项目使用 Jest 作为单元测试框架，配合 Babel 与 Node 兼容标志完成 Cloudflare Workers 代码的测试。

## 快速开始

```bash
# 安装依赖
npm install

# 运行全部测试
npm test

# 监听模式（TDD 体验）
npm test -- --watch

# 查看覆盖率
npm test -- --coverage
```

## 选择性执行

```bash
# 按名称（it/test 名称）过滤
npm test -- -t "RateLimiter"

# 仅运行特定文件
npx jest src/utils/rate-limiter.test.js

# 匹配模式运行
npx jest src/modules/.*\.test\.js
```

## 结构与约定

- 测试文件命名建议：`*.test.js`
- 单元测试优先覆盖以下模块：
  - message-transformer：不同消息类型转换
  - retry-service / rate-limiter：稳态与重试策略
  - wecom/feishu signature verifiers：签名校验边界条件
  - config-storage / channel-mapping：KV 持久化与映射解析

## 常见问题

- Node API 兼容：本项目启用了 `compatibility_flags = ["nodejs_compat"]`，确保在 Worker 环境下具备基本 Node API 支持。
- 异步/网络：对外部 API 调用请使用 `fetch` mock，或为重试逻辑设置较小的 backoff 以加快测试速度。
- 快照：如需引入快照测试，可在测试中使用 `expect(value).toMatchSnapshot()`，首次会生成快照文件。
