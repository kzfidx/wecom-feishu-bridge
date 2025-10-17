/**
 * 文件临时存储
 * 负责在消息传输过程中临时存储文件数据
 * 利用Cloudflare KV存储API实现
 */
class FileStorage {
  /**
   * 构造函数
   * @param {Object} env 环境对象，包含KV存储
   * @throws {Error} 缺少必要环境变量时抛出错误
   */
  constructor(env) {
    if (!env || !env.FILE_KV) {
      throw new Error('缺少必要的环境变量');
    }
    this.env = env;
    this.kvStore = env.FILE_KV;
    // 默认文件过期时间：1小时（毫秒）
    this.defaultExpiration = 60 * 60 * 1000;
  }
  
  /**
   * 存储文件数据
   * @param {Object} fileData 文件数据对象
   * @param {ArrayBuffer} fileData.buffer 文件二进制数据
   * @param {string} fileData.contentType 文件MIME类型
   * @param {string} fileData.filename 文件名
   * @returns {Promise<string>} 文件ID
   * @throws {Error} 存储失败时抛出错误
   */
  async storeFile(fileData) {
    try {
      // 验证文件数据
      if (!fileData || !fileData.buffer || !fileData.contentType) {
        throw new Error('文件数据不完整');
      }
      
      // 生成文件ID
      const fileId = this.generateFileId();
      
      // 将ArrayBuffer转换为base64字符串以存储
      const base64Buffer = this.arrayBufferToBase64(fileData.buffer);
      
      // 构建存储的数据对象
      const storedData = {
        buffer: base64Buffer,
        contentType: fileData.contentType,
        filename: fileData.filename || 'unknown',
        timestamp: Date.now()
      };
      
      // 计算过期时间（当前时间 + 过期时长）
      const expiration = Date.now() + this.defaultExpiration;
      
      // 存储到KV
      const result = await this.kvStore.put(
        fileId, 
        JSON.stringify(storedData),
        { expiration }
      );
      
      if (!result.ok) {
        throw new Error('KV存储失败');
      }
      
      return fileId;
    } catch (error) {
      if (error.message === 'KV存储失败') {
        throw error;
      }
      throw new Error(`存储文件失败: ${error.message}`);
    }
  }
  
  /**
   * 获取已存储的文件
   * @param {string} fileId 文件ID
   * @returns {Promise<Object|null>} 文件数据对象，不存在时返回null
   * @throws {Error} 获取失败时抛出错误
   */
  async getFile(fileId) {
    try {
      // 从KV获取数据
      const data = await this.kvStore.get(fileId);
      
      if (!data) {
        return null;
      }
      
      // 解析存储的数据
      const storedData = JSON.parse(data);
      
      // 将base64字符串转回ArrayBuffer
      const buffer = this.base64ToArrayBuffer(storedData.buffer);
      
      // 返回文件数据对象
      return {
        buffer,
        contentType: storedData.contentType,
        filename: storedData.filename
      };
    } catch (error) {
      throw new Error(`获取文件失败: ${error.message}`);
    }
  }
  
  /**
   * 删除已存储的文件
   * @param {string} fileId 文件ID
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {Error} 删除失败时抛出错误
   */
  async deleteFile(fileId) {
    try {
      // 执行删除操作
      const result = await this.kvStore.delete(fileId);
      
      if (!result.ok) {
        throw new Error('KV删除失败');
      }
      
      // 返回是否实际删除了文件
      return result.deleted !== false; // deleted可能是undefined（删除成功但无法确认是否存在）
    } catch (error) {
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }
  
  /**
   * 生成唯一的文件ID
   * @returns {string} 文件ID
   */
  generateFileId() {
    // 生成格式：file_时间戳_随机字符串
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `file_${timestamp}_${randomString}`;
  }
  
  /**
   * 将ArrayBuffer转换为base64字符串
   * @param {ArrayBuffer} buffer ArrayBuffer数据
   * @returns {string} base64编码字符串
   */
  arrayBufferToBase64(buffer) {
    // 处理浏览器和Node.js环境的兼容性
    // 这里使用通用的实现方式
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // 在Cloudflare Worker环境中，使用btoa
    return btoa(binary);
  }
  
  /**
   * 将base64字符串转换为ArrayBuffer
   * @param {string} base64 base64编码字符串
   * @returns {ArrayBuffer} ArrayBuffer数据
   */
  base64ToArrayBuffer(base64) {
    // 在Cloudflare Worker环境中，使用atob
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }
}

module.exports = {
  FileStorage
};