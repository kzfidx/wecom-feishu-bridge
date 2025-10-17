/**
 * 企业微信消息接收器
 * 负责接收和处理企业微信的回调消息
 */

/**
 * 企业微信消息接收器类
 */
class WecomMessageReceiver {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.signatureVerifier - 企业微信签名验证器
   * @param {Object} options.encryptionService - 加密服务
   * @param {Object} options.channelMappingManager - 通道映射管理器
   * @param {Object} options.messageTransformer - 消息转换器
   * @param {Object} options.feishuConnector - 飞书连接器
   */
  constructor(options) {
    // 验证必要的依赖项
    if (!options || typeof options !== 'object') {
      throw new Error('配置选项必须是有效的对象');
    }

    this.signatureVerifier = options.signatureVerifier;
    this.encryptionService = options.encryptionService;
    this.channelMappingManager = options.channelMappingManager;
    this.messageTransformer = options.messageTransformer;
    this.feishuConnector = options.feishuConnector;

    // 验证所有必要的依赖项都已提供
    const requiredDependencies = [
      'signatureVerifier',
      'encryptionService',
      'channelMappingManager',
      'messageTransformer',
      'feishuConnector'
    ];

    for (const dep of requiredDependencies) {
      if (!this[dep]) {
        throw new Error(`缺少必要的依赖项: ${dep}`);
      }
    }
  }

  /**
   * 处理企业微信验证请求
   * @param {string} signature - 签名
   * @param {string} timestamp - 时间戳
   * @param {string} nonce - 随机数
   * @param {string} echostr - 随机字符串
   * @returns {string} - 验证通过返回echostr
   */
  handleVerification(signature, timestamp, nonce, echostr) {
    // 参数验证
    if (!signature || typeof signature !== 'string') {
      throw new Error('签名必须是非空字符串');
    }
    if (!timestamp || typeof timestamp !== 'string') {
      throw new Error('时间戳必须是非空字符串');
    }
    if (!nonce || typeof nonce !== 'string') {
      throw new Error('随机数必须是非空字符串');
    }
    if (!echostr || typeof echostr !== 'string') {
      throw new Error('随机字符串必须是非空字符串');
    }

    try {
      // 使用签名验证器验证请求
      const result = this.signatureVerifier.verify(signature, timestamp, nonce, echostr);
      return result;
    } catch (error) {
      console.error('企业微信验证请求处理失败:', error);
      throw error;
    }
  }

  /**
   * 处理企业微信消息
   * @param {Object} request - HTTP请求对象
   * @param {Object} env - 环境配置对象
   * @returns {Promise<Object>} - 处理结果
   */
  async processMessage(request, env) {
    // 参数验证
    if (!request || typeof request !== 'object') {
      throw new Error('请求对象必须有效');
    }
    if (!env || typeof env !== 'object' || !env.WECOM_CHANNEL_ID) {
      throw new Error('环境配置必须包含企业微信通道ID');
    }

    try {
      // 解析请求体
      const requestBody = await request.json();
      let messageData;

      // 判断是否为加密消息
      if (requestBody.Encrypt && requestBody.MsgSignature) {
        // 处理加密消息
        messageData = this._processEncryptedMessage(requestBody);
      } else {
        // 处理明文消息
        messageData = requestBody;
      }

      // 获取企业微信通道ID
      const wecomChannelId = env.WECOM_CHANNEL_ID;

      // 转换消息格式
      const transformedMessage = this.messageTransformer.transformToFeishu({
        ...messageData,
        wecomChannelId
      });

      // 获取对应的飞书通道ID
      const feishuChannelId = await this.channelMappingManager.getFeishuChannelId(wecomChannelId);
      
      if (!feishuChannelId) {
        throw new Error(`未找到企业微信通道 ${wecomChannelId} 对应的飞书通道`);
      }

      // 发送消息到飞书
      const sendResult = await this.feishuConnector.sendMessage(feishuChannelId, transformedMessage);
      
      if (sendResult.code !== 0) {
        throw new Error(`消息发送到飞书失败: ${sendResult.msg || '未知错误'}`);
      }

      // 构造响应
      return {
        code: 0,
        message: '消息处理成功'
      };
    } catch (error) {
      console.error('企业微信消息处理失败:', error);
      throw error;
    }
  }

  /**
   * 处理加密消息
   * @private
   * @param {Object} encryptedData - 加密的消息数据
   * @returns {Object} - 解密后的消息对象
   */
  _processEncryptedMessage(encryptedData) {
    try {
      // 使用加密服务解密消息
      const decryptedStr = this.encryptionService.decrypt(encryptedData.Encrypt);
      
      // 解析解密后的JSON字符串
      const messageData = JSON.parse(decryptedStr);
      
      return messageData;
    } catch (error) {
      console.error('处理加密消息失败:', error);
      throw new Error('解密企业微信消息失败');
    }
  }
}

module.exports = {
  WecomMessageReceiver
};