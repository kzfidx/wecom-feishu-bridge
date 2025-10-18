# 消息流与模块交互

本文档描述企业微信（WeCom）与飞书（Feishu）之间的端到端消息流，以及各模块在消息流中的职责分工。

## 总览

- 回调入口：
  - 企业微信 -> Worker: GET/POST /wecom/callback
  - 飞书 -> Worker: POST /feishu/event
- 运维与调试：
  - 健康检查：GET /health
  - 配置查看：GET /config（敏感值已遮蔽）
  - 实时测试：GET /websocket（建立后可发送测试消息）

## 企业微信 -> 飞书

1. URL 校验（WeCom 平台配置时）
   - WeCom 向 /wecom/callback 发起 GET
   - 校验参数 msg_signature/timestamp/nonce/echostr
   - wecom-connector/wecom-signature-verifier 验签并解密，返回明文 echostr

2. 接收消息（生产流量）
   - WeCom 以 POST 推送加密 XML 至 /wecom/callback
   - wecom-connector 验签与解密，得到标准化的 WeCom 消息对象

3. 通道解析与过滤
   - channel-mapping 根据消息来源（群/用户）查找目标飞书通道
   - 可选 filter/includeTypes/excludeUsers 生效（见 channel-mapping-guide）

4. 转换与文件中转
   - message-transformer 将 WeCom 消息转换为 Feishu 消息体
   - 大文件经 file-downloader/file-uploader 中转，避免内存占用过大

5. 发送与稳态控制
   - rate-limiter 与 retry-service 控制速率与重试
   - feishu-connector 负责获取 token 并调用 Feishu API 发送

6. 应答
   - 返回 WeCom 要求的 XML 成功应答

## 飞书 -> 企业微信

1. URL 验证与事件回调
   - Feishu 向 /feishu/event 发送 url_verification 事件（首次验证）
   - 随后发送 event_callback（消息等事件）
   - feishu-signature-verifier 负责签名校验

2. 通道解析与转换
   - channel-mapping 根据事件中的 chatId/sender 解析目标企业微信通道
   - message-transformer 将 Feishu 消息转换为企业微信格式

3. 文件与媒体
   - 需要时使用文件下载/上传组件完成平台间文件迁移

4. 发送与应答
   - wecom-connector 获取企业微信 access_token 并发送消息
   - 返回 { code: 0, msg: 'success' }

## 模块职责速览

- app.js 路由分发与高层编排
- modules/
  - wecom-connector / feishu-connector：平台交互与 token 管理
  - wecom-signature-verifier / feishu-signature-verifier：签名校验
  - message-transformer：消息格式转换
  - channel-mapping + config-storage：通道映射加载与持久化（KV）
  - file-downloader / file-uploader / file-storage：文件中转
  - logger / error-handler / retry-service / rate-limiter：横切关注点
- utils/ 监控与通用工具

## 运行与运维建议

- 建议在 Cloudflare KV 中存储通道映射；变更先在预览环境验证
- 关注 /health 返回的各组件健康状态；必要时结合 wrangler tail 排查
- 对大文件场景设置适当的限流与重试参数
- 如需更强的管理能力，可在 /api/* 管理端点前增加鉴权层（后续计划）
