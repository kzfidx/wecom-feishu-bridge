# 企业微信与飞书消息桥接服务 API文档

本文档详细介绍了企业微信与飞书消息桥接服务提供的所有API接口，包括接口地址、请求方法、参数说明、返回格式及使用示例。

## 1. 接口概览

| API路径 | 方法 | 功能描述 | 权限要求 |
|--------|------|---------|----------|
| `/health` | GET | 服务健康检查 | 公开 |
| `/websocket` | GET | 建立WebSocket实时连接 | 公开 |
| `/wecom/callback` | GET/POST | 企业微信回调接口 | 企业微信服务端 |
| `/feishu/event` | POST | 飞书事件回调接口 | 飞书服务端 |
| `/api/mappings` | GET | 获取通道映射配置 | 管理员 |
| `/api/mappings` | POST | 添加通道映射关系 | 管理员 |
| `/api/mappings/:id` | PUT | 更新通道映射关系 | 管理员 |
| `/api/mappings/:id` | DELETE | 删除通道映射关系 | 管理员 |
| `/api/stats` | GET | 获取服务统计数据 | 管理员 |

## 2. 详细接口说明

### 2.1 健康检查接口

```
GET /health
```

**功能**：检查服务是否正常运行

**请求参数**：无

**响应示例**：
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "1d 2h 30m",
  "timestamp": "2023-07-26T12:34:56Z",
  "services": {
    "feishu": "connected",
    "wecom": "connected"
  }
}
```

**响应字段说明**：
- `status`: 服务状态，"ok"表示正常运行
- `version`: 当前服务版本号
- `uptime`: 服务运行时长
- `timestamp`: 响应时间戳
- `services`: 各平台连接状态

### 2.2 WebSocket连接接口

```
GET /websocket
```

**功能**：建立实时通信连接，用于接收消息转发状态通知

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `token` | string | 查询参数 | 否 | 可选的认证令牌，用于私有部署场景 |

**使用示例**：
```javascript
// 浏览器端示例
const socket = new WebSocket('wss://your-worker.workers.dev/websocket');

socket.onopen = function(e) {
  console.log('WebSocket连接已建立');
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
  // 处理消息转发状态通知
};

socket.onclose = function(event) {
  console.log('WebSocket连接已关闭');
};

socket.onerror = function(error) {
  console.error('WebSocket错误:', error);
};
```

**消息格式示例**：
```json
{
  "type": "message_forwarded",
  "from": "wecom",
  "to": "feishu",
  "messageId": "msg_123456789",
  "channel": "group_1",
  "timestamp": "2023-07-26T12:34:56Z"
}
```

### 2.3 企业微信回调接口

```
GET/POST /wecom/callback
```

**功能**：处理企业微信的验证请求和消息回调

**GET请求**：
用于URL验证，企业微信会在配置回调URL时发起GET请求验证

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `msg_signature` | string | 查询参数 | 是 | 企业微信加密签名 |
| `timestamp` | string | 查询参数 | 是 | 时间戳 |
| `nonce` | string | 查询参数 | 是 | 随机数 |
| `echostr` | string | 查询参数 | 是 | 加密的随机字符串 |

**响应**：解密后的echostr字符串

**POST请求**：
用于接收企业微信消息推送

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `msg_signature` | string | 查询参数 | 是 | 企业微信加密签名 |
| `timestamp` | string | 查询参数 | 是 | 时间戳 |
| `nonce` | string | 查询参数 | 是 | 随机数 |

**请求体**：XML格式的加密消息

**响应**：
```xml
<xml>
  <Encrypt><![CDATA[encrypted_content]]></Encrypt>
  <MsgSignature><![CDATA[signature]]></MsgSignature>
  <TimeStamp>timestamp</TimeStamp>
  <Nonce><![CDATA[nonce]]></Nonce>
</xml>
```

### 2.4 飞书事件回调接口

```
POST /feishu/event
```

**功能**：处理飞书的事件回调通知

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `X-Lark-Signature` | string | 头信息 | 是 | 飞书签名 |
| `X-Lark-Request-Timestamp` | string | 头信息 | 是 | 请求时间戳 |
| `X-Lark-Request-Nonce` | string | 头信息 | 是 | 请求随机数 |

**请求体**：JSON格式的事件数据

**响应示例**：
```json
{
  "challenge": "challenge_value",
  "msg": "success"
}
```

### 2.5 获取通道映射配置

```
GET /api/mappings
```

**功能**：获取当前的通道映射配置列表

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `Authorization` | string | 头信息 | 是 | Bearer认证令牌 |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "mappings": [
      {
        "id": "mapping_1",
        "wecom": {
          "chatId": "wecom_chat_id_1",
          "name": "企业微信群名"
        },
        "feishu": {
          "chatId": "feishu_chat_id_1",
          "name": "飞书群名"
        },
        "direction": "bidirectional",
        "createdAt": "2023-07-25T10:15:30Z",
        "updatedAt": "2023-07-25T10:15:30Z"
      },
      {
        "id": "mapping_2",
        "wecom": {
          "chatId": "wecom_chat_id_2",
          "name": "另一个企业微信群"
        },
        "feishu": {
          "chatId": "feishu_chat_id_2",
          "name": "另一个飞书群"
        },
        "direction": "wecom_to_feishu",
        "createdAt": "2023-07-25T14:20:45Z",
        "updatedAt": "2023-07-25T14:20:45Z"
      }
    ],
    "total": 2
  },
  "error": null
}
```

### 2.6 添加通道映射关系

```
POST /api/mappings
```

**功能**：添加新的企业微信与飞书之间的通道映射关系

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `Authorization` | string | 头信息 | 是 | Bearer认证令牌 |

**请求体**：
```json
{
  "wecom": {
    "chatId": "wecom_chat_id_3",
    "name": "新的企业微信群"
  },
  "feishu": {
    "chatId": "feishu_chat_id_3",
    "name": "新的飞书群"
  },
  "direction": "bidirectional"
}
```

**direction取值**：
- `bidirectional`: 双向转发
- `wecom_to_feishu`: 仅企业微信到飞书
- `feishu_to_wecom`: 仅飞书到企业微信

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mapping_3",
    "wecom": {
      "chatId": "wecom_chat_id_3",
      "name": "新的企业微信群"
    },
    "feishu": {
      "chatId": "feishu_chat_id_3",
      "name": "新的飞书群"
    },
    "direction": "bidirectional",
    "createdAt": "2023-07-26T15:30:45Z",
    "updatedAt": "2023-07-26T15:30:45Z"
  },
  "error": null
}
```

### 2.7 更新通道映射关系

```
PUT /api/mappings/:id
```

**功能**：更新指定ID的通道映射配置

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `id` | string | 路径参数 | 是 | 映射关系ID |
| `Authorization` | string | 头信息 | 是 | Bearer认证令牌 |

**请求体**：
```json
{
  "wecom": {
    "chatId": "wecom_chat_id_3",
    "name": "更新后的企业微信群名"
  },
  "feishu": {
    "chatId": "feishu_chat_id_3",
    "name": "更新后的飞书群名"
  },
  "direction": "feishu_to_wecom"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mapping_3",
    "wecom": {
      "chatId": "wecom_chat_id_3",
      "name": "更新后的企业微信群名"
    },
    "feishu": {
      "chatId": "feishu_chat_id_3",
      "name": "更新后的飞书群名"
    },
    "direction": "feishu_to_wecom",
    "createdAt": "2023-07-26T15:30:45Z",
    "updatedAt": "2023-07-26T16:45:30Z"
  },
  "error": null
}
```

### 2.8 删除通道映射关系

```
DELETE /api/mappings/:id
```

**功能**：删除指定ID的通道映射配置

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `id` | string | 路径参数 | 是 | 映射关系ID |
| `Authorization` | string | 头信息 | 是 | Bearer认证令牌 |

**响应示例**：
```json
{
  "success": true,
  "data": null,
  "error": null
}
```

### 2.9 获取服务统计数据

```
GET /api/stats
```

**功能**：获取服务运行统计数据，包括消息数量、成功率等

**请求参数**：
| 参数名 | 类型 | 位置 | 必选 | 说明 |
|-------|------|------|------|------|
| `Authorization` | string | 头信息 | 是 | Bearer认证令牌 |
| `timeRange` | string | 查询参数 | 否 | 时间范围，支持：day, week, month，默认为day |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalMessages": 1532,
    "successRate": 0.992,
    "messageTypes": {
      "text": 987,
      "image": 345,
      "file": 156,
      "link": 44
    },
    "sourceDistribution": {
      "wecom": 876,
      "feishu": 656
    },
    "errorDistribution": {
      "rateLimit": 2,
      "networkError": 5,
      "authError": 3,
      "invalidFormat": 2
    },
    "averageLatency": 345,
    "timeRange": "day",
    "date": "2023-07-26"
  },
  "error": null
}
```

## 3. 接口使用示例

### 3.1 健康检查示例（cURL）

```bash
curl -X GET "https://your-worker.workers.dev/health"
```

### 3.2 获取通道映射配置示例（cURL）

```bash
curl -X GET "https://your-worker.workers.dev/api/mappings" \
  -H "Authorization: Bearer your_token_here"
```

### 3.3 添加通道映射关系示例（Node.js）

```javascript
const axios = require('axios');

async function addMapping() {
  try {
    const response = await axios.post(
      'https://your-worker.workers.dev/api/mappings',
      {
        wecom: {
          chatId: 'wecom_chat_id',
          name: '企业微信群名'
        },
        feishu: {
          chatId: 'feishu_chat_id',
          name: '飞书群名'
        },
        direction: 'bidirectional'
      },
      {
        headers: {
          'Authorization': 'Bearer your_token_here',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('映射添加成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('添加映射失败:', error.response?.data || error.message);
    throw error;
  }
}

addMapping();
```

### 3.4 获取服务统计数据示例（Python）

```python
import requests

def get_service_stats():
    url = "https://your-worker.workers.dev/api/stats"
    headers = {
        "Authorization": "Bearer your_token_here"
    }
    params = {
        "timeRange": "week"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        print("服务统计数据:", response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"获取统计数据失败: {e}")
        raise

get_service_stats()
```

## 4. 错误码说明

| 错误码 | 含义 | 解决方案 |
|-------|------|----------|
| 400 | 请求参数错误 | 检查请求参数是否符合要求 |
| 401 | 未授权访问 | 确保携带有效的认证令牌 |
| 403 | 权限不足 | 确认用户是否有足够权限执行操作 |
| 404 | 资源不存在 | 检查请求的资源ID是否正确 |
| 429 | 请求频率过高 | 减少请求频率，实现请求限流 |
| 500 | 服务器内部错误 | 查看服务日志，联系管理员 |
| 502 | 上游服务错误 | 检查企业微信或飞书API状态 |
| 504 | 请求超时 | 检查网络连接和上游服务响应时间 |

## 5. 安全最佳实践

1. **API认证**：管理接口必须使用Bearer Token进行认证
2. **请求限流**：客户端应实现适当的请求限流，避免频繁调用
3. **HTTPS加密**：所有API调用必须使用HTTPS加密传输
4. **错误处理**：妥善处理API返回的错误信息，避免敏感信息泄露
5. **日志记录**：记录关键操作日志，但避免记录敏感信息
6. **参数验证**：客户端应验证输入参数，确保符合API要求

## 6. 更新日志

| 版本 | 更新日期 | 更新内容 |
|------|---------|----------|
| 1.0.0 | 2023-07-26 | 初始版本，包含基础API接口 |
| 1.1.0 | 即将发布 | 添加高级监控和分析功能 |

## 7. 联系支持

如果您在使用API过程中遇到问题，请通过以下方式联系支持团队：

- 电子邮件：support@example.com
- 技术论坛：https://forum.example.com
- 紧急支持：400-123-4567