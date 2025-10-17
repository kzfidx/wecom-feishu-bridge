/**
 * 文件下载器
 * 负责从企业微信和飞书平台下载文件
 */
class FileDownloader {
  /**
   * 构造函数
   * @param {Object} config 配置对象
   */
  constructor(config = {}) {
    this.config = config;
  }
  
  /**
   * 从企业微信下载文件
   * @param {string} fileUrl 文件URL
   * @returns {Promise<Object>} 文件数据对象
   * @throws {Error} 下载失败时抛出错误
   */
  async downloadFromWecom(fileUrl) {
    if (!this.isValidUrl(fileUrl)) {
      throw new Error('URL格式无效');
    }
    
    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`下载文件失败: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      const filename = this.parseFilenameFromContentDisposition(contentDisposition) || 'wecom_file';
      
      return {
        buffer,
        contentType,
        filename
      };
    } catch (error) {
      if (error.message.startsWith('下载文件失败')) {
        throw error;
      }
      throw new Error(`下载文件异常: ${error.message}`);
    }
  }
  
  /**
   * 从飞书下载文件
   * @param {string} fileUrl 文件URL
   * @returns {Promise<Object>} 文件数据对象
   * @throws {Error} 下载失败时抛出错误
   */
  async downloadFromFeishu(fileUrl) {
    if (!this.isValidUrl(fileUrl)) {
      throw new Error('URL格式无效');
    }
    
    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`下载文件失败: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      const filename = this.parseFilenameFromContentDisposition(contentDisposition) || 'feishu_file';
      
      return {
        buffer,
        contentType,
        filename
      };
    } catch (error) {
      if (error.message.startsWith('下载文件失败')) {
        throw error;
      }
      throw new Error(`下载文件异常: ${error.message}`);
    }
  }
  
  /**
   * 从Content-Disposition头中解析文件名
   * @param {string} contentDisposition Content-Disposition头值
   * @returns {string} 文件名
   */
  parseFilenameFromContentDisposition(contentDisposition) {
    if (!contentDisposition) {
      return 'downloaded_file';
    }
    
    // 尝试匹配不同格式的filename参数
    // 1. 带引号的格式: attachment; filename="filename.txt"
    // 2. 不带引号的格式: attachment; filename=filename.txt
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return 'downloaded_file';
  }
  
  /**
   * 验证URL是否有效
   * @param {string} url 要验证的URL
   * @returns {boolean} 是否为有效URL
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = {
  FileDownloader
};