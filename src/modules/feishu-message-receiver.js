/**
 * 飞书消息接收器
 * 负责处理飞书平台发送的消息回调请求，验证签名，并将消息转发到企业微信
 */
class FeishuMessageReceiver {
  /**
   * 构造函数
   * @param {Object} dependencies 依赖对象
   * @param {Object} dependencies.signatureVerifier 飞书签名验证器
   * @param {Object} dependencies.channelMappingManager 通道映射管理器
   * @param {Object} dependencies.messageTransformer 消息转换器
   * @param {Object} dependencies.wecomConnector 企业微信连接器
   */
  constructor(dependencies) {
    const { signatureVerifier, channelMappingManager, messageTransformer, wecomConnector } = dependencies;
    
    if (!signatureVerifier || !channelMappingManager || !messageTransformer || !wecomConnector) {
      throw new Error('缺少必要的依赖组件');
    }
    
    this.signatureVerifier = signatureVerifier;
    this.channelMappingManager = channelMappingManager;
    this.messageTransformer = messageTransformer;
    this.wecomConnector = wecomConnector;
  }
  
  /**
   * 验证飞书签名
   * @param {string} timestamp 时间戳
   * @param {string} nonce 随机字符串
   * @param {string} signature 签名
   * @param {string} body 请求体
   * @returns {boolean} 验证结果
   * @throws {Error} 当参数无效时抛出错误
   */
  verifySignature(timestamp, nonce, signature, body) {
    if (!timestamp || !nonce || !signature || !body) {
      throw new Error('签名验证参数不完整');
    }
    
    return this.signatureVerifier.verify(timestamp, nonce, signature, body);
  }
  
  /**
   * 处理飞书消息
   * @param {Object} request HTTP请求对象
   * @param {Object} env 环境变量
   * @returns {Promise<Object>} 处理结果
   * @throws {Error} 处理失败时抛出错误
   */
  async processMessage(request, env) {
    if (!request || !env) {
      throw new Error('请求参数不完整');
    }
    
    // 检查必要的环境配置
    if (!env.FEISHU_APP_ID) {
      throw new Error('缺少必要的环境配置：FEISHU_APP_ID');
    }
    
    // 获取请求头中的签名信息
    const { 
      'x-lark-signature': signature,
      'x-lark-timestamp': timestamp,
      'x-lark-nonce': nonce
    } = request.headers || {};
    
    if (!signature || !timestamp || !nonce) {
      throw new Error('缺少签名验证所需的请求头');
    }
    
    // 读取请求体
    const body = await request.text();
    if (!body) {
      throw new Error('请求体为空');
    }
    
    // 验证签名
    const isVerified = this.verifySignature(timestamp, nonce, signature, body);
    if (!isVerified) {
      throw new Error('签名验证失败');
    }
    
    // 解析请求体
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      throw new Error('请求体解析失败');
    }
    
    // 检查app_id是否匹配
    if (requestData.header?.app_id !== env.FEISHU_APP_ID) {
      throw new Error('应用ID不匹配');
    }
    
    // 处理不同类型的事件
    switch (requestData.header?.event_type) {
      case 'im.message.receive_v1':
        await this._processChatMessage(requestData.event);
        break;
      default:
        // 忽略其他类型的事件
        break;
    }
    
    // 返回成功响应（飞书要求返回此格式）
    return {
      code: 0,
      message: '消息处理成功'
    };
  }
  
  /**
   * 处理聊天消息事件
   * @param {Object} event 事件数据
   * @private
   */
  async _processChatMessage(event) {
    // 只处理用户发送的消息
    if (event.sender?.sender_type !== 'user') {
      return;
    }
    
    // 解析消息内容
    const { message } = event;
    if (!message || !message.content) {
      return;
    }
    
    let content;
    try {
      content = JSON.parse(message.content);
    } catch (error) {
      throw new Error('消息内容解析失败');
    }
    
    // 获取飞书聊天ID
    const feishuChannelId = message.chat_id;
    
    // 查找对应的企业微信通道ID
    const wecomChannelId = await this.findWecomChannelByFeishuId(feishuChannelId);
    if (!wecomChannelId) {
      throw new Error(`未找到与飞书通道 ${feishuChannelId} 对应的企业微信通道`);
    }
    
    // 构造原始消息对象
    const originalMessage = {
      messageId: message.message_id,
      channelId: feishuChannelId,
      senderId: event.sender.sender_id?.open_id || event.sender.sender_id?.user_id || '',
      messageType: message.message_type,
      content: content.text || '',
      timestamp: parseInt(message.create_time || Date.now() / 1000)
    };
    
    // 转换消息格式为企业微信格式
    const wecomMessage = this.messageTransformer.transformToWecom(originalMessage);
    
    // 发送消息到企业微信
    const sendResult = await this.wecomConnector.sendMessage(wecomChannelId, wecomMessage);
    
    if (sendResult.errcode !== 0) {
      throw new Error(`发送消息到企业微信失败: ${sendResult.errmsg}`);
    }
  }
  
  /**
   * 通过飞书通道ID查找对应的企业微信通道ID
   * @param {string} feishuChannelId 飞书通道ID
   * @returns {Promise<string|null>} 企业微信通道ID或null
   */
  async findWecomChannelByFeishuId(feishuChannelId) {
    const allMappings = await this.channelMappingManager.getAllMappings();
    
    // 遍历所有映射，查找匹配的飞书通道ID
    for (const [wecomChannelId, mapping] of Object.entries(allMappings)) {
      if (mapping.feishuChannelId === feishuChannelId) {
        return wecomChannelId;
      }
    }
    
    return null;
  }
}

module.exports = {
  FeishuMessageReceiver
};