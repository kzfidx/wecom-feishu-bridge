# Cloudflare Workers 部署指南

## 前置条件

1. 安装 Node.js 和 npm
2. 安装 Cloudflare Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```
3. 登录到 Cloudflare：
   ```bash
   wrangler login
   ```

## 配置 KV 命名空间

1. 创建 KV 命名空间用于存储 token 缓存：
   ```bash
   wrangler kv:namespace create "KV_STORAGE"
   ```
2. 创建开发环境的 KV 命名空间：
   ```bash
   wrangler kv:namespace create "KV_STORAGE" --preview
   ```
3. 将返回的 KV 命名空间 ID 更新到 `wrangler.toml` 文件中

## 环境变量配置

编辑 `wrangler.toml` 文件，填入相应的环境变量值：

- 企业微信配置：
  - `WECOM_CORPID`: 企业微信 CorpID
  - `WECOM_AGENTID`: 企业微信应用 AgentID
  - `WECOM_SECRET`: 企业微信应用密钥
  - `WECOM_ENCODING_AESKEY`: 消息加密密钥
  - `WECOM_TOKEN`: 消息校验 Token

- 飞书配置：
  - `FEISHU_APP_ID`: 飞书应用 ID
  - `FEISHU_APP_SECRET`: 飞书应用密钥
  - `FEISHU_ENCRYPT_KEY`: 消息加密密钥
  - `FEISHU_VERIFICATION_TOKEN`: 事件订阅校验 Token

## 本地开发

1. 启动本地开发服务器：
   ```bash
   wrangler dev
   ```
2. 访问 `http://localhost:8787` 测试 API

## 部署到开发环境

```bash
wrangler publish --env dev
```

## 部署到生产环境

```bash
wrangler publish --env production
```

## 验证部署

部署完成后，可以通过以下方式验证：

1. 访问 `https://wecom-feishu-bridge-dev.workers.dev/health` (开发环境)
2. 访问 `https://wecom-feishu-bridge-production.workers.dev/health` (生产环境)

## 监控

1. 通过 Cloudflare Dashboard 监控 Workers 运行状态
2. 查看日志：
   ```bash
   wrangler tail --env production
   ```

## 常见问题

1. **部署失败**: 检查 `wrangler.toml` 配置是否正确，特别是 KV 命名空间 ID
2. **权限问题**: 确保 Cloudflare 账号有 Workers 部署权限
3. **环境变量错误**: 检查环境变量值是否正确，特别是加密密钥和 Token