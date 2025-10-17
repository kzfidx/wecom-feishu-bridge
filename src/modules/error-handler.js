/**
 * 错误处理器模块
 * 集中管理各类错误处理逻辑，提供统一的错误处理机制
 */

class ErrorHandler {
  /**
   * 构造函数
   * @param {Logger} logger - 日志记录器实例
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * 处理消息转发错误
   * @param {Error} error - 错误对象
   * @param {Object} message - 原始消息对象
   */
  handleForwardError(error, message) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      eventType: message?.header?.event_type || 'unknown',
      messageId: message?.event_id || 'unknown'
    };
    
    this.logger.error('消息转发失败', errorInfo);
  }

  /**
   * 处理WebSocket错误
   * @param {Error} error - 错误对象
   */
  handleWebSocketError(error) {
    const errorInfo = {
      message: error.message,
      stack: error.stack
    };
    
    this.logger.error('WebSocket连接错误', errorInfo);
  }

  /**
   * 处理企业微信验证错误
   * @param {Error} error - 错误对象
   */
  handleVerificationError(error) {
    const errorInfo = {
      message: error.message,
      stack: error.stack
    };
    
    this.logger.error('企业微信验证失败', errorInfo);
  }

  /**
   * 处理企业微信消息处理错误
   * @param {Error} error - 错误对象
   */
  handleWecomMessageError(error) {
    const errorInfo = {
      message: error.message,
      stack: error.stack
    };
    
    this.logger.error('企业微信消息处理失败', errorInfo);
  }

  /**
   * 处理全局错误
   * @param {Error} error - 错误对象
   */
  handleGlobalError(error) {
    const errorInfo = {
      message: error.message,
      stack: error.stack
    };
    
    this.logger.error('全局未捕获错误', errorInfo);
  }

  /**
   * 处理API请求错误
   * @param {Error} error - 错误对象
   * @param {string} apiName - API名称
   * @param {Object} requestData - 请求数据
   */
  handleApiError(error, apiName, requestData = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      apiName,
      requestId: requestData.requestId || 'unknown'
    };
    
    this.logger.error(`API调用失败: ${apiName}`, errorInfo);
  }

  /**
   * 记录可重试的错误
   * @param {Error} error - 错误对象
   * @param {string} operation - 操作名称
   * @param {number} attempt - 当前尝试次数
   * @param {number} maxAttempts - 最大尝试次数
   */
  logRetryableError(error, operation, attempt, maxAttempts) {
    const errorInfo = {
      message: error.message,
      operation,
      attempt,
      maxAttempts,
      willRetry: attempt < maxAttempts
    };
    
    this.logger.warn('可重试操作失败', errorInfo);
  }
}

export { ErrorHandler };