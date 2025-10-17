/**
 * 限流管理器 - 使用令牌桶算法实现API请求限流
 */
class RateLimiter {
  /**
   * 构造函数
   * @param {Object} options - 限流配置选项
   * @param {number} options.rate - 每秒生成的令牌数
   * @param {number} options.capacity - 令牌桶最大容量
   * @param {string} options.key - 限流键名，用于区分不同的限流场景
   */
  constructor(options = {}) {
    this.rate = options.rate || 10; // 默认每秒10个令牌
    this.capacity = options.capacity || 20; // 默认桶容量20个令牌
    this.key = options.key || 'default'; // 默认键名
    
    this.tokens = this.capacity; // 初始令牌数为最大容量
    this.lastRefillTime = Date.now(); // 上次填充令牌的时间
  }

  /**
   * 填充令牌
   */
  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    
    // 计算应该生成的新令牌数
    const newTokens = (elapsed / 1000) * this.rate;
    
    if (newTokens > 0) {
      // 更新令牌数，不超过最大容量
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastRefillTime = now;
    }
  }

  /**
   * 尝试获取令牌
   * @param {number} tokens - 需要获取的令牌数，默认为1
   * @returns {Object} 包含是否允许请求和等待时间的对象
   */
  tryAcquire(tokens = 1) {
    // 先填充令牌
    this.refillTokens();
    
    // 检查是否有足够的令牌
    if (this.tokens >= tokens) {
      // 消耗令牌
      this.tokens -= tokens;
      return {
        allowed: true,
        waitTime: 0,
        remainingTokens: this.tokens
      };
    } else {
      // 计算需要等待的时间（毫秒）
      const waitTime = Math.ceil(((tokens - this.tokens) / this.rate) * 1000);
      return {
        allowed: false,
        waitTime,
        remainingTokens: this.tokens
      };
    }
  }

  /**
   * 获取当前令牌桶状态
   * @returns {Object} 令牌桶状态信息
   */
  getStatus() {
    // 先填充令牌以获取最新状态
    this.refillTokens();
    
    return {
      key: this.key,
      rate: this.rate,
      capacity: this.capacity,
      availableTokens: this.tokens,
      utilization: (this.capacity - this.tokens) / this.capacity
    };
  }

  /**
   * 重置令牌桶
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * 更新限流配置
   * @param {Object} options - 新的限流配置
   */
  updateConfig(options = {}) {
    if (options.rate !== undefined) {
      this.rate = options.rate;
    }
    if (options.capacity !== undefined) {
      this.capacity = options.capacity;
      // 确保当前令牌数不超过新的容量
      if (this.tokens > this.capacity) {
        this.tokens = this.capacity;
      }
    }
    if (options.key !== undefined) {
      this.key = options.key;
    }
  }
}

// 直接导出RateLimiter类
module.exports = RateLimiter;