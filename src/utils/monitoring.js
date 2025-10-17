/**
 * 监控和日志工具类
 * 用于收集和报告自定义监控指标，集成Cloudflare Analytics
 */

/**
 * 性能监控记录器类
 * 用于收集和报告自定义监控指标
 */
export class MetricsMonitor {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      reportInterval: 60000, // 默认每分钟报告一次
      debugMode: false,
      ...config
    };
    
    // 存储指标数据的Map
    this.metrics = new Map();
    
    // 启动定期报告
    if (this.config.enabled) {
      this._startPeriodicReporting();
    }
  }

  /**
   * 启动定期报告
   * @private
   */
  _startPeriodicReporting() {
    // 在Worker环境中，我们不使用setInterval，而是依赖Worker的执行周期
    // 这里只是为了提供一个统一的接口
    if (this.config.debugMode) {
      console.log('Metrics monitoring started');
    }
  }

  /**
   * 记录计数器类型的指标
   * @param {string} name - 指标名称
   * @param {number} value - 要增加的值，默认为1
   * @param {Object} tags - 可选的标签对象，用于分类统计
   */
  incrementCounter(name, value = 1, tags = {}) {
    if (!this.config.enabled) return;

    const metricKey = this._getMetricKey(name, tags);
    const currentValue = this.metrics.get(metricKey) || {
      type: 'counter',
      value: 0,
      tags,
      name,
      lastUpdated: Date.now()
    };

    currentValue.value += value;
    currentValue.lastUpdated = Date.now();
    this.metrics.set(metricKey, currentValue);

    if (this.config.debugMode) {
      console.log(`Counter ${name} incremented by ${value}, current value: ${currentValue.value}`);
    }
  }

  /**
   * 记录计时器类型的指标
   * @param {string} name - 指标名称
   * @param {number} startTime - 开始时间（毫秒时间戳）
   * @param {number} endTime - 结束时间（毫秒时间戳），默认为当前时间
   * @param {Object} tags - 可选的标签对象，用于分类统计
   */
  recordTiming(name, startTime, endTime = Date.now(), tags = {}) {
    if (!this.config.enabled) return;

    const duration = endTime - startTime;
    const metricKey = this._getMetricKey(name, tags);
    
    const currentValue = this.metrics.get(metricKey) || {
      type: 'timing',
      sum: 0,
      count: 0,
      min: Infinity,
      max: 0,
      tags,
      name,
      lastUpdated: Date.now()
    };

    currentValue.sum += duration;
    currentValue.count += 1;
    currentValue.min = Math.min(currentValue.min, duration);
    currentValue.max = Math.max(currentValue.max, duration);
    currentValue.lastUpdated = Date.now();
    
    this.metrics.set(metricKey, currentValue);

    if (this.config.debugMode) {
      console.log(`Timing ${name}: ${duration}ms`);
    }
  }

  /**
   * 记录成功率指标
   * @param {string} name - 指标名称
   * @param {boolean} success - 是否成功
   * @param {Object} tags - 可选的标签对象，用于分类统计
   */
  recordSuccessRate(name, success, tags = {}) {
    if (!this.config.enabled) return;

    const metricKey = this._getMetricKey(name, tags);
    
    const currentValue = this.metrics.get(metricKey) || {
      type: 'success_rate',
      successes: 0,
      failures: 0,
      tags,
      name,
      lastUpdated: Date.now()
    };

    if (success) {
      currentValue.successes += 1;
    } else {
      currentValue.failures += 1;
    }
    
    currentValue.lastUpdated = Date.now();
    this.metrics.set(metricKey, currentValue);

    if (this.config.debugMode) {
      const total = currentValue.successes + currentValue.failures;
      const rate = total > 0 ? (currentValue.successes / total * 100) : 0;
      console.log(`Success rate for ${name}: ${rate.toFixed(2)}%`);
    }
  }

  /**
   * 生成指标的唯一键
   * @param {string} name - 指标名称
   * @param {Object} tags - 标签对象
   * @returns {string} - 唯一的指标键
   * @private
   */
  _getMetricKey(name, tags) {
    // 将标签转换为排序后的字符串，以确保相同标签集生成相同的键
    const tagsStr = Object.keys(tags)
      .sort()
      .map(key => `${key}:${tags[key]}`)
      .join(',');
    
    return `${name}::${tagsStr}`;
  }

  /**
   * 获取当前所有指标
   * @returns {Object} - 所有指标的对象
   */
  getMetrics() {
    const result = {};
    
    this.metrics.forEach((value, key) => {
      result[key] = { ...value };
      
      // 对于timing类型，计算平均值
      if (value.type === 'timing' && value.count > 0) {
        result[key].avg = value.sum / value.count;
      }
      
      // 对于success_rate类型，计算成功率
      if (value.type === 'success_rate') {
        const total = value.successes + value.failures;
        result[key].rate = total > 0 ? (value.successes / total) : 0;
      }
    });
    
    return result;
  }

  /**
   * 报告指标到Cloudflare Analytics
   * 在实际部署中，这里会调用Cloudflare Analytics API或使用自定义的方式上报
   */
  reportMetrics() {
    if (!this.config.enabled) return;

    const metrics = this.getMetrics();
    
    // 在Worker环境中，我们使用headers或Durable Objects来存储和上报指标
    // 这里我们只是记录到控制台
    if (this.config.debugMode) {
      console.log('Reporting metrics:', JSON.stringify(metrics, null, 2));
    }

    // 在Cloudflare Worker中，可以使用以下方式上报自定义指标：
    // 1. 使用自定义headers，然后在边缘收集
    // 2. 使用Durable Objects存储
    // 3. 使用Cloudflare Analytics Engine API
  }

  /**
   * 清除所有指标数据
   */
  clearMetrics() {
    this.metrics.clear();
    if (this.config.debugMode) {
      console.log('Metrics cleared');
    }
  }
}

/**
 * 日志记录器类
 * 提供结构化的日志记录功能，支持不同的日志级别和上下文信息
 */
export class Logger {
  constructor(config = {}) {
    this.config = {
      level: 'info', // 默认日志级别
      includeTimestamp: true,
      includeLevel: true,
      includeContext: true,
      ...config
    };

    // 日志级别优先级
    this.levelPriority = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
  }

  /**
   * 检查是否应该记录该级别的日志
   * @param {string} level - 日志级别
   * @returns {boolean} - 是否应该记录
   * @private
   */
  _shouldLog(level) {
    return this.levelPriority[level] <= this.levelPriority[this.config.level];
  }

  /**
   * 构建日志消息对象
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   * @returns {Object} - 日志消息对象
   * @private
   */
  _buildLogMessage(level, message, context = {}) {
    const logMessage = {};

    if (this.config.includeTimestamp) {
      logMessage.timestamp = new Date().toISOString();
    }

    if (this.config.includeLevel) {
      logMessage.level = level.toUpperCase();
    }

    logMessage.message = message;

    if (this.config.includeContext && Object.keys(context).length > 0) {
      logMessage.context = context;
    }

    return logMessage;
  }

  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  error(message, context = {}) {
    if (!this._shouldLog('error')) return;

    const logMessage = this._buildLogMessage('error', message, context);
    console.error(logMessage);
    
    // 在实际应用中，这里可以集成错误跟踪服务
  }

  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  warn(message, context = {}) {
    if (!this._shouldLog('warn')) return;

    const logMessage = this._buildLogMessage('warn', message, context);
    console.warn(logMessage);
  }

  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  info(message, context = {}) {
    if (!this._shouldLog('info')) return;

    const logMessage = this._buildLogMessage('info', message, context);
    console.log(logMessage);
  }

  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  debug(message, context = {}) {
    if (!this._shouldLog('debug')) return;

    const logMessage = this._buildLogMessage('debug', message, context);
    console.debug(logMessage);
  }

  /**
   * 记录跟踪级别日志
   * @param {string} message - 日志消息
   * @param {Object} context - 上下文信息
   */
  trace(message, context = {}) {
    if (!this._shouldLog('trace')) return;

    const logMessage = this._buildLogMessage('trace', message, context);
    console.debug(logMessage); // 在大多数环境中，trace级别会映射到debug
  }

  /**
   * 记录HTTP请求信息
   * @param {Request} request - HTTP请求对象
   * @param {Response} response - HTTP响应对象
   * @param {number} duration - 处理时间（毫秒）
   */
  logRequest(request, response, duration) {
    if (!this._shouldLog('info')) return;

    // 确保不记录敏感信息
    const sanitizedHeaders = {};
    for (const [key, value] of Object.entries(request.headers || {})) {
      if (!['authorization', 'cookie'].includes(key.toLowerCase())) {
        sanitizedHeaders[key] = value;
      }
    }

    this.info('HTTP Request', {
      method: request.method,
      url: request.url,
      status: response?.status || 'unknown',
      duration: duration,
      headers: sanitizedHeaders
    });
  }

  /**
   * 记录错误详情，包括堆栈跟踪
   * @param {Error} error - 错误对象
   * @param {string} contextMessage - 上下文消息
   * @param {Object} context - 额外的上下文信息
   */
  logError(error, contextMessage = 'An error occurred', context = {}) {
    if (!this._shouldLog('error')) return;

    const errorContext = {
      message: error.message,
      stack: error.stack,
      ...context
    };

    this.error(contextMessage, errorContext);
  }

  /**
   * 设置日志级别
   * @param {string} level - 新的日志级别
   */
  setLevel(level) {
    if (this.levelPriority[level] !== undefined) {
      this.config.level = level;
      this.info(`Log level set to ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}, using current level: ${this.config.level}`);
    }
  }
}

// 创建全局实例
export const metricsMonitor = new MetricsMonitor();
export const logger = new Logger();