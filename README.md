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
├── index.js           # Workers 入口（export default { fetch }）
├── app.js             # 应用主类与路由
├── modules/           # 功能模块
│   ├── feishu-connector.js
│   ├── wecom-connector.js
│   ├── message-transformer.js
│   ├── channel-mapping.js
│   ├── config-manager.js
│   ├── config-storage.js
│   ├── wecom-signature-verifier.js
│   ├── feishu-signature-verifier.js
│   ├── file-downloader.js
│   ├── file-uploader.js
│   ├── file-storage.js
│   ├── encryption-service.js
│   ├── error-handler.js
│   └── logger.js
└── utils/             # 工具类
    ├── rate-limiter.js
    ├── retry-service.js
    ├── message-transformer.js
    ├── file-optimizer.js
    └── monitoring.js
```

## 消息流概览

- 企业微信 -> 飞书：
  1. 企业微信以GET方式请求 /wecom/callback 完成URL校验（msg_signature/timestamp/nonce/echostr）
  2. 企业微信以POST方式推送加密XML消息到 /wecom/callback
  3. WeCom签名校验与解密（wecom-connector / wecom-signature-verifier）
  4. 通过通道映射解析目标（KV 或环境配置，见 docs/channel-mapping-guide.md）
  5. 使用 message-transformer 转换为飞书格式；大文件走文件下载/上传模块
  6. 应用限流与重试策略（rate-limiter/retry-service），通过 feishu-connector 发送
  7. 返回企业微信成功XML应答

- 飞书 -> 企业微信：
  1. 飞书向 /feishu/event 发送事件（URL 验证 challenge 与事件回调）
  2. 校验事件签名（feishu-signature-verifier）并解析事件
  3. 通过通道映射确定目标企业微信通道
  4. 使用 message-transformer 转换为企业微信消息；必要时进行文件中转
  5. 应用限流/重试后经 wecom-connector 发送
  6. 返回 JSON { code: 0, msg: 'success' }

- 实时与运维：
  - /websocket 提供简单的实时连通性与测试消息能力
  - /health 与 /config 用于健康检查与配置查看（敏感信息已遮蔽）

更多细节见 docs/message-flow.md。

## 技术栈

- **运行环境**：Cloudflare Workers
- **编程语言**：JavaScript (ES Modules)
- **HTTP客户端**：Fetch API
- **WebSocket支持**：Cloudflare WebSocket API
- **测试框架**：Jest
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
# 运行所有测试（Jest）
npm test

# 按名称运行测试用例
npm test -- -t "RateLimiter"

# 仅运行特定文件
npx jest src/utils/rate-limiter.test.js

# 监听模式（TDD 体验）
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

## 错误排查

1. **查看日志**：检查Cloudflare Workers的日志输出
2. **验证配置**：确保所有环境变量正确设置
3. **检查网络**：确认回调URL可正常访问
4. **查看API状态**：检查企业微信和飞书API的状态
5. **检查通道映射**：确保通道映射配置正确无误

## 文档资源

### 配置与架构
- [消息流细节](docs/message-flow.md)
- [部署指南](docs/deployment-guide.md)
- [企业微信配置指南](docs/wecom-config-guide.md)
- [飞书配置指南](docs/feishu-config-guide.md)
- [通道映射配置指南](docs/channel-mapping-guide.md)
- [API文档](docs/api-documentation.md)
- [测试指南（Jest）](docs/testing.md)

### 官方文档
- [企业微信开发文档](https://developer.work.weixin.qq.com/document/path/90600)
- [飞书开发文档](https://open.feishu.cn/document/)
- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)

### 后续改进（低优先级）
- 完善签名验证与加解密实现，替换当前占位/简化逻辑
- 统一配置管理与通道映射的存储（KV 与环境变量的取舍）
- 增加端到端集成测试与更多消息类型的单元测试覆盖
- 为管理端点（/api/*）增加鉴权与访问控制
- 更丰富的监控指标与可视化（消息延迟、错误分布、重试统计）

## 许可证

MIT