# 通道映射配置指南

## 概述

通道映射是企业微信与飞书消息互通的核心配置，用于定义消息如何在两个平台之间流转。本指南将详细说明如何配置企业微信与飞书的通道映射关系。

## 映射配置结构

通道映射采用JSON格式存储，主要包含以下字段：

```json
{
  "mappings": [
    {
      "id": "mapping_1",
      "name": "技术部群组映射",
      "wecom": {
        "chatType": "group",
        "chatId": "wecom_group_id",
        "agentId": "wecom_agent_id"
      },
      "feishu": {
        "chatType": "group",
        "chatId": "feishu_chat_id"
      },
      "direction": "bidirectional",
      "enable": true,
      "filter": {
        "includeTypes": ["text", "image", "file"],
        "excludeUsers": []
      }
    }
  ],
  "userMappings": [
    {
      "wecomUserId": "wecom_user_id",
      "feishuUserId": "feishu_user_id",
      "name": "用户姓名"
    }
  ]
}
```

## 配置参数说明

### 群组映射（mappings）

- **id**: 映射关系的唯一标识符
- **name**: 映射关系的名称（便于管理）
- **wecom**:
  - **chatType**: 聊天类型，支持 "group"（群组）或 "user"（用户）
  - **chatId**: 企业微信的群聊ID或用户ID
  - **agentId**: 企业微信应用的AgentId
- **feishu**:
  - **chatType**: 聊天类型，支持 "group"（群组）或 "user"（用户）
  - **chatId**: 飞书的群聊ID或用户ID
- **direction**: 消息流向，支持 "bidirectional"（双向）、"wecom_to_feishu"（企业微信到飞书）或 "feishu_to_wecom"（飞书到企业微信）
- **enable**: 是否启用该映射
- **filter**:
  - **includeTypes**: 允许通过的消息类型列表
  - **excludeUsers**: 排除的用户ID列表

### 用户映射（userMappings）

- **wecomUserId**: 企业微信用户ID
- **feishuUserId**: 飞书用户ID
- **name**: 用户姓名（便于管理）

## 配置步骤

### 步骤一：收集必要信息

1. **企业微信群组信息**：
   - 群聊ID：可以通过企业微信API获取或从企业微信管理后台查看
   - 应用AgentId：从企业微信应用详情页获取

2. **飞书群组信息**：
   - 群聊ID：可以通过飞书API获取或从飞书管理后台查看

3. **用户映射信息**：
   - 企业微信用户ID列表
   - 对应的飞书用户ID列表

### 步骤二：创建映射配置文件

1. 在项目根目录创建 `config/mappings.json` 文件
2. 根据上述结构填写映射关系
3. 保存配置文件

### 步骤三：部署配置

#### 方式一：通过KV存储部署（推荐）

1. 登录Cloudflare Dashboard
2. 进入Workers & Pages -> KV
3. 选择与桥接服务关联的KV命名空间
4. 创建一个新的键值对：
   - Key: `mappings_config`
   - Value: 完整的映射配置JSON字符串

#### 方式二：通过环境变量部署

1. 在Cloudflare Workers配置页面
2. 添加环境变量：
   - 变量名: `MAPPINGS_CONFIG`
   - 变量值: 压缩后的映射配置JSON字符串
   - 选择 "Encrypt" 选项保护敏感信息

### 步骤四：测试消息流转

1. 确保桥接服务已正常运行
2. 在企业微信群组发送一条测试消息
3. 检查飞书对应的群组是否收到消息
4. 在飞书群组发送一条测试消息
5. 检查企业微信对应的群组是否收到消息

## 高级配置

### 消息过滤

可以通过 `filter` 参数控制哪些消息可以通过桥接：

```json
"filter": {
  "includeTypes": ["text", "image", "file", "card"],
  "excludeUsers": ["user1", "user2"],
  "keywordFilter": {
    "include": ["关键词1", "关键词2"],
    "exclude": ["敏感词1", "敏感词2"]
  }
}
```

### 单向映射

如果只需要单向消息流转，可以设置 `direction` 参数：

```json
"direction": "wecom_to_feishu"  // 仅企业微信消息转发到飞书
```

或者：

```json
"direction": "feishu_to_wecom"  // 仅飞书消息转发到企业微信
```

### 优先级设置

当多个映射规则可能匹配同一个消息时，可以设置优先级：

```json
"priority": 10  // 数字越小，优先级越高
```

## 示例配置

### 示例1：基本的双向群组映射

```json
{
  "mappings": [
    {
      "id": "tech_group_mapping",
      "name": "技术部群组映射",
      "wecom": {
        "chatType": "group",
        "chatId": "wrk08f7hTAAE4HcD12345678",
        "agentId": "1000001"
      },
      "feishu": {
        "chatType": "group",
        "chatId": "oc_1234567890abcdef"
      },
      "direction": "bidirectional",
      "enable": true,
      "filter": {
        "includeTypes": ["text", "image", "file"]
      }
    }
  ]
}
```

### 示例2：包含用户映射的复杂配置

```json
{
  "mappings": [
    {
      "id": "tech_group_mapping",
      "name": "技术部群组映射",
      "wecom": {
        "chatType": "group",
        "chatId": "wrk08f7hTAAE4HcD12345678",
        "agentId": "1000001"
      },
      "feishu": {
        "chatType": "group",
        "chatId": "oc_1234567890abcdef"
      },
      "direction": "bidirectional",
      "enable": true
    },
    {
      "id": "manager_mapping",
      "name": "管理层映射",
      "wecom": {
        "chatType": "user",
        "chatId": "ZhangSan",
        "agentId": "1000001"
      },
      "feishu": {
        "chatType": "user",
        "chatId": "ou_1234567890abcdef"
      },
      "direction": "bidirectional",
      "enable": true
    }
  ],
  "userMappings": [
    {"wecomUserId": "ZhangSan", "feishuUserId": "ou_1234567890abcdef", "name": "张三"},
    {"wecomUserId": "LiSi", "feishuUserId": "ou_abcdef1234567890", "name": "李四"}
  ]
}
```

## 常见问题

1. **消息未转发**：
   - 检查映射配置是否正确启用
   - 验证聊天ID是否准确
   - 确认消息类型是否在允许列表中

2. **用户名称显示不正确**：
   - 检查用户映射配置是否完整
   - 确认用户ID是否匹配

3. **映射优先级问题**：
   - 为重要的映射规则设置较低的优先级数字
   - 避免设置冲突的映射规则

## 注意事项

- 定期备份映射配置文件
- 新增群组或用户时，及时更新映射配置
- 对敏感信息使用Cloudflare KV的加密功能
- 在修改生产环境配置前，先在测试环境验证配置的有效性