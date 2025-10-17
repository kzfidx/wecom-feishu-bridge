const crypto = require('crypto');

/**
 * 消息加密解密服务类
 * 实现AES-256-CBC加密解密算法，用于企业微信和飞书消息的加密解密
 */
class EncryptionService {
  /**
   * 构造函数
   * @param {string} encodingAESKey - 企业微信或飞书配置的encodingAESKey
   * @throws {Error} 当encodingAESKey无效时抛出错误
   */
  constructor(encodingAESKey) {
    // 验证encodingAESKey
    if (!encodingAESKey || typeof encodingAESKey !== 'string') {
      throw new Error('EncodingAESKey必须是有效的字符串');
    }
    
    try {
      // 保存原始密钥
      this.encodingAESKey = encodingAESKey;
      
      // 使用简化的密钥处理方式
      // 直接使用指定长度的Buffer作为密钥和IV
      this.aesKey = Buffer.alloc(32);
      const keyBuffer = Buffer.from(encodingAESKey);
      keyBuffer.copy(this.aesKey, 0, 0, Math.min(keyBuffer.length, 32));
      
      this.iv = Buffer.alloc(16);
      const ivBuffer = Buffer.from(encodingAESKey);
      ivBuffer.copy(this.iv, 0, 0, Math.min(ivBuffer.length, 16));
    } catch (error) {
      throw new Error('初始化加密密钥失败');
    }
  }
  
  /**
   * 加密消息
   * @param {string} plaintext - 要加密的明文消息
   * @param {string} corpId - 企业ID或应用ID
   * @returns {string} 加密后的Base64编码字符串
   * @throws {Error} 当参数无效时抛出错误
   */
  encrypt(plaintext, corpId) {
    // 验证参数
    if (!plaintext || typeof plaintext !== 'string' || 
        !corpId || typeof corpId !== 'string') {
      throw new Error('明文和企业ID必须是有效的字符串');
    }
    
    try {
      // 生成16字节的随机数
      const randomBytes = crypto.randomBytes(16);
      // 生成4字节的消息长度
      const msgLen = Buffer.alloc(4);
      msgLen.writeUInt32BE(Buffer.byteLength(plaintext), 0);
      // 构造消息：随机数 + 消息长度 + 明文 + CorpId
      const msgBuffer = Buffer.concat([
        randomBytes,
        msgLen,
        Buffer.from(plaintext, 'utf8'),
        Buffer.from(corpId, 'utf8')
      ]);
      
      // 进行PKCS#7填充
      const paddedMsg = this._pad(msgBuffer);
      
      // 创建AES-256-CBC加密器
      const cipher = crypto.createCipheriv('aes-256-cbc', this.aesKey, this.iv);
      cipher.setAutoPadding(false); // 关闭自动填充，使用我们自己的填充
      
      // 加密数据
      let encrypted = cipher.update(paddedMsg, '', 'base64');
      encrypted += cipher.final('base64');
      
      return encrypted;
    } catch (error) {
      console.error('加密过程出错:', error);
      throw error;
    }
  }
  
  /**
   * 解密消息
   * @param {string} encrypted - 加密后的Base64编码字符串
   * @param {string} corpId - 企业ID或应用ID
   * @returns {string} 解密后的明文消息
   * @throws {Error} 当解密失败时抛出错误
   */
  decrypt(encrypted, corpId) {
    // 验证参数
    if (!encrypted || typeof encrypted !== 'string' || 
        !corpId || typeof corpId !== 'string') {
      throw new Error('密文和企业ID必须是有效的字符串');
    }
    
    try {
      // 解码Base64密文
      const encryptedBuffer = Buffer.from(encrypted, 'base64');
      
      // 创建AES-256-CBC解密器
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.aesKey, this.iv);
      decipher.setAutoPadding(false); // 关闭自动填充，使用我们自己的填充
      
      // 解密数据
      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // 去除PKCS#7填充
      const unpadded = this._unpad(decrypted);
      
      // 提取消息内容
      // 前16字节是随机数，接下来4字节是消息长度，然后是明文，最后是CorpId
      if (unpadded.length < 20) {
        throw new Error('解密后的数据格式错误');
      }
      
      // 读取消息长度
      const msgLen = unpadded.readUInt32BE(16);
      
      // 提取明文
      const plaintext = unpadded.slice(20, 20 + msgLen).toString('utf8');
      
      // 提取CorpId并验证
      const extractedCorpId = unpadded.slice(20 + msgLen).toString('utf8');
      if (extractedCorpId !== corpId) {
        throw new Error('CorpID不匹配');
      }
      
      return plaintext;
    } catch (error) {
      console.error('解密过程出错:', error);
      throw error;
    }
  }
  
  /**
   * 对数据进行PKCS#7填充
   * @param {Buffer} buffer - 要填充的数据
   * @returns {Buffer} 填充后的数据
   * @private
   */
  _pad(buffer) {
    const blockSize = 32; // AES-256-CBC的块大小是32字节
    const paddingSize = blockSize - (buffer.length % blockSize);
    const padding = Buffer.alloc(paddingSize, paddingSize);
    return Buffer.concat([buffer, padding]);
  }
  
  /**
   * 去除PKCS#7填充
   * @param {Buffer} buffer - 要去填充的数据
   * @returns {Buffer} 去填充后的数据
   * @private
   */
  _unpad(buffer) {
    const paddingSize = buffer[buffer.length - 1];
    return buffer.slice(0, buffer.length - paddingSize);
  }
}

module.exports = EncryptionService;