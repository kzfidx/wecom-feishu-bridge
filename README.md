# 企业微信与飞书消息桥接服务

一个基于Cloudflare Workers实现的企业微信与飞书消息双向桥接器，支持消息格式转换和实时转发。该服务能够无缝连接企业微信和飞书两个平台，实现消息的实时互通，帮助企业在混合办公环境中保持高效沟通。

## 功能特性

- ✅ **双向消息转发**：企业微信与飞书之间的消息实时互转
- ✅ **智能消息格式转换**：自动转换不同平台的消息格式（文本、图片、文件、链接等）
- ✅ **安全认证机制**：支持企业微信和飞书的签名验证和消息加密
- ✅ **通道映射配置**：灵活配置不同聊天通道之间的映射关系
- ✅ **请求限流保护**：实现令牌桶算法，防止API请求过载
- ✅ **文件处理优化**：流式处理大文件，优化内存使用
- ✅ **监控和日志**：结构化日志记录和性能指标监控
- ✅ **错误处理**：完善的错误捕获和重试机制
- ✅ **WebSocket支持**：提供实时通信能力
- ✅ **配置管理**：环境变量驱动的灵活配置

## 项目架构

项目采用模块化架构设计，主要包含以下核心模块：

```
src/
├── index.js           # 主入口文件
├── app.js             # 应用主类
├── modules/           # 功能模块
│   ├── feishu-connector.js      # 飞书API连接器
│   ├── wecom-connector.js       # 企业微信API连接器
│   ├── message-transformer.js   # 消息格式转换器
│   ├── config-manager.js        # 配置管理器
│   └── error-handler.js         # 错误处理器
└── utils/             # 工具类
    ├── crypto.js                # 加密工具
    ├── validator.js             # 验证工具
    ├── rate-limiter.js          # 限流工具
    ├── file-optimizer.js        # 文件优化工具
    └── monitoring.js            # 监控和日志工具
```

## 技术栈

- **运行环境**：Cloudflare Workers
- **编程语言**：JavaScript (ES Modules)
- **HTTP客户端**：Fetch API
- **WebSocket支持**：Cloudflare WebSocket API
- **测试框架**：Vitest
- **部署工具**：Wrangler CLI

## 快速开始

### 1. 环境准备

- 注册Cloudflare账号
- 创建Worker项目
- 准备企业微信和飞书的开发者账号和应用
- 安装Node.js (v16+)和npm

### 2. 安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-username/wecom-feishu-bridge.git
cd wecom-feishu-bridge

# 安装依赖
npm install
```

### 3. 配置环境变量

在Cloudflare Workers控制台中设置以下环境变量：

| 环境变量 | 说明 | 必需 |
|---------|------|------|
| WECOM_CORP_ID | 企业微信企业ID | 是 |
| WECOM_CORP_SECRET | 企业微信应用密钥 | 是 |
| WECOM_TOKEN | 企业微信消息接收Token | 是 |
| WECOM_ENCODING_AES_KEY | 企业微信消息加密密钥 | 是 |
| FEISHU_APP_ID | 飞书应用ID | 是 |
| FEISHU_APP_SECRET | 飞书应用密钥 | 是 |
| FEISHU_VERIFICATION_TOKEN | 飞书事件订阅验证Token | 是 |
| FEISHU_ENCRYPT_KEY | 飞书消息加密密钥 | 否 |
| CHANNEL_MAPPING | JSON格式的通道映射配置 | 是 |
| LOG_LEVEL | 日志级别 (debug/info/warn/error) | 否 |
| RATE_LIMIT_MAX_TOKENS | 令牌桶最大容量 | 否 |
| RATE_LIMIT_REFILL_RATE | 令牌补充速率(每秒) | 否 |

### 4. 配置通道映射

创建`CHANNEL_MAPPING`环境变量，配置企业微信与飞书之间的通道映射关系。格式如下：

```json
{
  "mappings": [
    {
      "wecom": {
        "chatId": "wecom_chat_id_1",
        "name": "企业微信群名"
      },
      "feishu": {
        "chatId": "feishu_chat_id_1",
        "name": "飞书群名"
      },
      "direction": "bidirectional"
    }
  ]
}
```

### 5. 部署

```bash
# 本地开发
npm run dev

# 部署到Cloudflare Workers
npm run deploy
```

### 6. 配置回调URL

- **企业微信**：设置回调URL为 `https://your-worker.your-account.workers.dev/wecom/callback`
- **飞书**：设置回调URL为 `https://your-worker.your-account.workers.dev/feishu/event`

## API接口

### 1. 健康检查

```
GET /health
```

返回服务健康状态信息。

**响应示例：**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "1d 2h 30m"
}
```

### 2. WebSocket连接

```
GET /websocket
```

用于建立实时通信连接，接收消息转发状态通知。

### 3. 企业微信回调

```
GET/POST /wecom/callback
```

处理企业微信的验证请求和消息回调。

### 4. 飞书事件回调

```
POST /feishu/event
```

处理飞书的事件回调。

## 使用示例

### 基本消息转发示例

当用户在企业微信群中发送消息：

```
@所有人 今天下午3点有团队会议，请准时参加！
```

系统会自动将其转换并转发到对应的飞书群，格式如下：

```
@所有人 今天下午3点有团队会议，请准时参加！
```

### 文件转发示例

当用户在飞书群中分享文档：

```
[飞书文档] 项目规划方案.docx
```

系统会自动将其下载并上传到企业微信群，同时保留原始文件名和文档内容。

## 性能优化与监控

- **请求限流**：系统实现了令牌桶算法，限制API调用频率，防止过载
- **文件处理**：大文件采用流式处理，减少内存占用
- **监控指标**：通过Cloudflare Analytics监控请求量和错误率
- **自定义指标**：记录消息处理延迟、成功率等关键指标

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test utils/rate-limiter.test.js

# 运行特定测试套件
npm test -- -t "RateLimiter类测试"
```

## 错误排查

1. **查看日志**：检查Cloudflare Workers的日志输出
2. **验证配置**：确保所有环境变量正确设置
3. **检查网络**：确认回调URL可正常访问
4. **查看API状态**：检查企业微信和飞书API的状态
5. **检查通道映射**：确保通道映射配置正确无误

## 文档资源

### 配置指南
- [部署指南](https://github.com/kzifdx/wecom-feishu-bridge/blob/main/docs/deployment-guide.md)
- [企业微信配置指南](https://github.com/kzifdx/wecom-feishu-bridge/blob/main/docs/wecom-config-guide.md)
- [飞书配置指南](https://github.com/kzifdx/wecom-feishu-bridge/blob/main/docs/feishu-config-guide.md)
- [通道映射配置指南](https://github.com/kzifdx/wecom-feishu-bridge/blob/main/docs/channel-mapping-guide.md)
- [API文档](https://github.com/kzifdx/wecom-feishu-bridge/blob/main/docs/api-documentation.md)

### 官方文档
- [企业微信开发文档](https://developer.work.weixin.qq.com/document/path/90600)
- [飞书开发文档](https://open.feishu.cn/document/)
- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)

## 许可证

MIT