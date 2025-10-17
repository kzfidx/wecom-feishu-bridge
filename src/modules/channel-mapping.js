/**
 * 通道映射管理器
 * 负责管理企业微信通道与飞书通道之间的映射关系
 */

/**
 * 通道映射管理器类
 */
class ChannelMappingManager {
  /**
   * 构造函数
   * @param {Object} configStorage - 配置存储实例
   */
  constructor(configStorage) {
    if (!configStorage || typeof configStorage !== 'object') {
      throw new Error('配置存储实例必须有效');
    }
    if (typeof configStorage.get !== 'function' || 
        typeof configStorage.set !== 'function' || 
        typeof configStorage.delete !== 'function') {
      throw new Error('配置存储实例必须实现get、set和delete方法');
    }
    this.configStorage = configStorage;
  }

  /**
   * 添加或更新通道映射关系
   * @param {string} wecomChannelId - 企业微信通道ID
   * @param {string} feishuChannelId - 飞书通道ID
   * @param {Object} config - 映射配置
   * @returns {Promise<boolean>} - 是否成功
   */
  async addMapping(wecomChannelId, feishuChannelId, config = {}) {
    // 参数验证
    if (!wecomChannelId || typeof wecomChannelId !== 'string') {
      throw new Error('企业微信通道ID必须是非空字符串');
    }
    if (!feishuChannelId || typeof feishuChannelId !== 'string') {
      throw new Error('飞书通道ID必须是非空字符串');
    }
    if (typeof config !== 'object' || config === null) {
      config = {};
    }

    try {
      // 获取现有映射
      let mappings = await this.configStorage.get('channel_mappings');
      if (!mappings || typeof mappings !== 'object') {
        mappings = {};
      }

      // 添加或更新映射
      mappings[wecomChannelId] = {
        feishuChannelId,
        config
      };

      // 保存映射
      await this.configStorage.set('channel_mappings', mappings);
      return true;
    } catch (error) {
      console.error('添加通道映射失败:', error);
      throw error;
    }
  }

  /**
   * 获取通道映射关系
   * @param {string} wecomChannelId - 企业微信通道ID
   * @returns {Promise<Object|null>} - 映射关系对象，不存在时返回null
   */
  async getMapping(wecomChannelId) {
    // 参数验证
    if (!wecomChannelId || typeof wecomChannelId !== 'string') {
      throw new Error('企业微信通道ID必须是非空字符串');
    }

    try {
      // 获取现有映射
      const mappings = await this.configStorage.get('channel_mappings');
      if (!mappings || typeof mappings !== 'object') {
        return null;
      }

      // 返回指定映射
      return mappings[wecomChannelId] || null;
    } catch (error) {
      console.error('获取通道映射失败:', error);
      throw error;
    }
  }

  /**
   * 删除通道映射关系
   * @param {string} wecomChannelId - 企业微信通道ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async removeMapping(wecomChannelId) {
    // 参数验证
    if (!wecomChannelId || typeof wecomChannelId !== 'string') {
      throw new Error('企业微信通道ID必须是非空字符串');
    }

    try {
      // 获取现有映射
      const mappings = await this.configStorage.get('channel_mappings');
      if (!mappings || typeof mappings !== 'object') {
        return true;
      }

      // 删除映射
      if (mappings[wecomChannelId]) {
        delete mappings[wecomChannelId];
      }

      // 保存映射
      await this.configStorage.set('channel_mappings', mappings);
      return true;
    } catch (error) {
      console.error('删除通道映射失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有通道映射关系
   * @returns {Promise<Object>} - 所有映射关系
   */
  async getAllMappings() {
    try {
      // 获取所有映射
      const mappings = await this.configStorage.get('channel_mappings');
      if (!mappings || typeof mappings !== 'object') {
        return {};
      }
      return mappings;
    } catch (error) {
      console.error('获取所有通道映射失败:', error);
      throw error;
    }
  }

  /**
   * 获取对应的飞书通道ID
   * @param {string} wecomChannelId - 企业微信通道ID
   * @returns {Promise<string|null>} - 飞书通道ID，不存在时返回null
   */
  async getFeishuChannelId(wecomChannelId) {
    // 参数验证
    if (!wecomChannelId || typeof wecomChannelId !== 'string') {
      throw new Error('企业微信通道ID必须是非空字符串');
    }

    try {
      // 获取映射
      const mapping = await this.getMapping(wecomChannelId);
      if (!mapping) {
        return null;
      }
      return mapping.feishuChannelId;
    } catch (error) {
      console.error('获取飞书通道ID失败:', error);
      throw error;
    }
  }
}

module.exports = {
  ChannelMappingManager
};