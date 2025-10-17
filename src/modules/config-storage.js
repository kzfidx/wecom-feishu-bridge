/**
 * 配置存储接口
 * 定义配置存储的基本操作
 */
class ConfigStorage {
  /**
   * 获取配置值
   * @param {string} key - 配置键
   * @returns {Promise<any>} 配置值，不存在时返回null
   * @throws {Error} 当参数无效时抛出错误
   */
  async get(key) {
    throw new Error('方法必须由子类实现');
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @returns {Promise<boolean>} 是否成功设置
   * @throws {Error} 当参数无效或无法序列化时抛出错误
   */
  async set(key, value) {
    throw new Error('方法必须由子类实现');
  }

  /**
   * 删除配置值
   * @param {string} key - 配置键
   * @returns {Promise<boolean>} 是否成功删除
   * @throws {Error} 当参数无效时抛出错误
   */
  async delete(key) {
    throw new Error('方法必须由子类实现');
  }

  /**
   * 验证键是否有效
   * @param {string} key - 配置键
   * @throws {Error} 当键无效时抛出错误
   * @protected
   */
  _validateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('键必须是非空字符串');
    }
  }
}

/**
 * 基于KV存储的配置存储实现
 * 使用KV存储接口来存储和管理配置
 */
class KVConfigStorage extends ConfigStorage {
  /**
   * 构造函数
   * @param {object} kvStorage - KV存储实例，必须实现get、set和delete方法
   * @throws {Error} 当KV存储无效时抛出错误
   */
  constructor(kvStorage) {
    super();
    
    // 验证KV存储实例
    if (!kvStorage) {
      throw new Error('KV存储实例必须有效');
    }

    // 验证KV存储实例是否实现了必要的方法
    if (typeof kvStorage.get !== 'function' || 
        typeof kvStorage.set !== 'function' || 
        typeof kvStorage.delete !== 'function') {
      throw new Error('KV存储实例必须实现get、set和delete方法');
    }

    this.kvStorage = kvStorage;
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键
   * @returns {Promise<any>} 配置值，不存在时返回null
   * @throws {Error} 当参数无效或无法解析时抛出错误
   */
  async get(key) {
    this._validateKey(key);

    try {
      const value = await this.kvStorage.get(key);
      if (value === undefined || value === null) {
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('无法解析配置值');
      }
      throw error;
    }
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @returns {Promise<boolean>} 是否成功设置
   * @throws {Error} 当参数无效或无法序列化时抛出错误
   */
  async set(key, value) {
    this._validateKey(key);

    try {
      const jsonValue = JSON.stringify(value);
      return await this.kvStorage.set(key, jsonValue);
    } catch (error) {
      throw new Error('无法序列化配置值');
    }
  }

  /**
   * 删除配置值
   * @param {string} key - 配置键
   * @returns {Promise<boolean>} 是否成功删除
   * @throws {Error} 当参数无效时抛出错误
   */
  async delete(key) {
    this._validateKey(key);
    return await this.kvStorage.delete(key);
  }
}

module.exports = {
  ConfigStorage,
  KVConfigStorage
};