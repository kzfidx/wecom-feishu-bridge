/**
 * 重试服务类
 * 提供可靠的重试机制，用于处理可能失败的操作如消息发送
 */
class RetryService {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {number} options.maxAttempts - 最大重试次数（默认3次）
   * @param {number} options.baseDelayMs - 基础延迟时间（毫秒，默认1000）
   * @param {number} options.maxDelayMs - 最大延迟时间（毫秒，默认10000）
   * @param {Function} options.shouldRetry - 判断是否应该重试的函数
   * @param {Object} options.logger - 日志记录器
   */
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 10000;
    this.shouldRetry = options.shouldRetry || this._defaultShouldRetry;
    this.logger = options.logger;
  }

  /**
   * 默认的重试判断函数
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否应该重试
   * @private
   */
  _defaultShouldRetry(error) {
    // 网络错误和特定的API错误应该重试
    const networkErrors = ['NetworkError', 'TimeoutError', 'fetch failed'];
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    
    // 检查是否是网络错误
    const isNetworkError = networkErrors.some(code => 
      error.message && error.message.includes(code)
    );
    
    // 检查是否有重试标志
    const hasRetryFlag = error.shouldRetry === true;
    
    // 检查HTTP状态码
    const hasRetryableStatusCode = retryableStatusCodes.includes(error.statusCode);
    
    // 企业微信特定的错误码
    const wecomRetryableCodes = [42001, 40014]; // token过期或无效
    const hasWecomRetryableCode = wecomRetryableCodes.includes(error.errcode);
    
    // 飞书特定的错误码
    const feishuRetryableCodes = [99991663, 99991664]; // token过期或无效
    const hasFeishuRetryableCode = feishuRetryableCodes.includes(error.code);
    
    return isNetworkError || 
           hasRetryFlag || 
           hasRetryableStatusCode || 
           hasWecomRetryableCode || 
           hasFeishuRetryableCode;
  }

  /**
   * 计算退避延迟时间
   * 使用指数退避算法，并添加随机抖动
   * @param {number} attempt - 当前尝试次数
   * @returns {number} 延迟时间（毫秒）
   * @private
   */
  _calculateDelay(attempt) {
    const exponentialDelay = Math.min(
      this.baseDelayMs * Math.pow(2, attempt - 1),
      this.maxDelayMs
    );
    
    // 添加随机抖动（±20%）
    const jitter = exponentialDelay * 0.2;
    const actualDelay = exponentialDelay + (Math.random() * 2 * jitter - jitter);
    
    return Math.max(actualDelay, 100); // 确保至少有100ms的延迟
  }

  /**
   * 延迟执行
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行带重试的操作
   * @param {Function} operation - 要执行的异步操作函数
   * @param {string} operationName - 操作名称（用于日志）
   * @param {Array} args - 传递给操作函数的参数
   * @returns {Promise<any>} 操作结果
   */
  async executeWithRetry(operation, operationName, ...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        this.logger?.info(`执行${operationName}，第${attempt}/${this.maxAttempts}次尝试`);
        const result = await operation(...args);
        return result;
      } catch (error) {
        lastError = error;
        
        // 判断是否应该重试
        const shouldRetry = this.shouldRetry(error);
        
        if (!shouldRetry || attempt === this.maxAttempts) {
          // 不应该重试或已达最大重试次数
          this.logger?.error(`执行${operationName}失败，不重试:`, {
            error: error.message,
            attempt,
            maxAttempts: this.maxAttempts
          });
          throw error;
        }
        
        // 计算延迟并等待
        const delay = this._calculateDelay(attempt);
        this.logger?.warn(`执行${operationName}失败，${delay}ms后重试:`, {
          error: error.message,
          attempt,
          maxAttempts: this.maxAttempts,
          delayMs: delay
        });
        
        await this._delay(delay);
      }
    }
    
    // 如果达到这里，说明所有重试都失败了
    throw lastError;
  }
}

module.exports = { RetryService };