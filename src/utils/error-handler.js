/**
 * 错误处理和报告服务
 * 负责统一处理和记录应用中的各类错误
 */

/**
 * 错误类型枚举
 */
const ErrorType = {
  /** 认证错误 */
  AUTH: 'AUTH',
  /** 配置错误 */
  CONFIG: 'CONFIG',
  /** 网络错误 */
  NETWORK: 'NETWORK',
  /** 业务逻辑错误 */
  BUSINESS: 'BUSINESS',
  /** 参数错误 */
  PARAMS: 'PARAMS',
  /** 系统错误 */
  SYSTEM: 'SYSTEM',
  /** 超时错误 */
  TIMEOUT: 'TIMEOUT',
  /** 企业微信相关错误 */
  WECOM: 'WECOM',
  /** 飞书相关错误 */
  FEISHU: 'FEISHU'
};

/**
 * 自定义错误类
 */
class AppError extends Error {
  /** 错误类型 */
  type;
  /** 错误代码 */
  code;
  /** 原始错误信息 */
  originalError;
  /** 错误详情 */
  details;
  /** 时间戳 */
  timestamp;
  /** 请求ID */
  requestId;

  /**
   * 构造函数
   * @param message 错误消息
   * @param type 错误类型
   * @param code 错误代码
   * @param originalError 原始错误
   * @param details 错误详情
   * @param requestId 请求ID
   */
  constructor(
    message,
    type,
    code,
    originalError,
    details,
    requestId
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.originalError = originalError;
    this.details = details;
    this.timestamp = Date.now();
    this.requestId = requestId;

    // 确保错误堆栈正确设置
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      timestamp: this.timestamp,
      requestId: this.requestId,
      details: this.details,
      // 不在生产环境中返回堆栈信息
      ...(process.env.NODE_ENV !== 'production' && {
        stack: this.stack
      })
    };
  }
}

/**
 * 错误处理服务
 */
class ErrorHandler {
  /**
   * 处理错误并返回HTTP响应
   * @param error 错误对象
   * @param requestId 请求ID
   */
  handleError(error, requestId) {
    // 记录错误
    this.logError(error, requestId);

    // 转换通用错误为AppError
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error.message || '未知错误',
          ErrorType.SYSTEM,
          'UNKNOWN_ERROR',
          error,
          undefined,
          requestId
        );

    // 设置适当的HTTP状态码
    const statusCode = this.getStatusCode(appError);

    // 返回响应体
    return {
      statusCode,
      body: {
        success: false,
        error: appError.toJSON()
      }
    };
  }

  /**
   * 根据错误类型获取HTTP状态码
   * @param error 应用错误
   */
  getStatusCode(error) {
    switch (error.type) {
      case ErrorType.AUTH:
        return 401; // 未授权
      case ErrorType.PARAMS:
        return 400; // 请求错误
      case ErrorType.BUSINESS:
        return 409; // 冲突
      case ErrorType.NETWORK:
        return 502; // 坏网关
      case ErrorType.TIMEOUT:
        return 504; // 网关超时
      case ErrorType.CONFIG:
        return 500; // 服务器错误
      case ErrorType.WECOM:
      case ErrorType.FEISHU:
        return 503; // 服务不可用
      case ErrorType.SYSTEM:
      default:
        return 500; // 服务器错误
    }
  }

  /**
   * 记录错误信息
   * @param error 错误对象
   * @param requestId 请求ID
   */
  logError(error, requestId) {
    // 这里可以集成日志系统
    const errorInfo = error instanceof AppError 
      ? {
          type: error.type,
          code: error.code,
          message: error.message,
          requestId,
          details: error.details,
          stack: error.stack,
          originalError: error.originalError?.message
        }
      : {
          message: error.message,
          requestId,
          stack: error.stack
        };

    console.error('Application Error:', JSON.stringify(errorInfo));
  }

  /**
   * 创建特定类型的错误
   * @param message 错误消息
   * @param type 错误类型
   * @param code 错误代码
   * @param details 错误详情
   */
  createError(
    message,
    type,
    code,
    details
  ) {
    return new AppError(message, type, code, undefined, details);
  }

  /**
   * 包装异步函数，统一处理错误
   * @param fn 要执行的异步函数
   * @param options 错误处理选项
   */
  wrapAsync(fn, options) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        // 如果已经是AppError，则直接抛出
        if (error instanceof AppError) {
          throw error;
        }

        // 否则转换为AppError
        const appError = new AppError(
          error.message || options?.defaultErrorMessage || '操作失败',
          options?.defaultErrorType || ErrorType.SYSTEM,
          options?.defaultErrorCode || 'OPERATION_FAILED',
          error
        );
        
        throw appError;
      }
    };
  }

  /**
   * 格式化错误响应（用于API响应）
   * @param error 错误对象
   */
  formatErrorResponse(error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error.message || '未知错误',
          ErrorType.SYSTEM,
          'UNKNOWN_ERROR',
          error
        );

    return {
      success: false,
      error: {
        message: appError.message,
        code: appError.code,
        type: appError.type,
        // 在生产环境中不返回详情和堆栈
        ...(process.env.NODE_ENV !== 'production' && {
          details: appError.details,
          stack: appError.stack
        })
      }
    };
  }

  /**
   * 报告错误（可以集成错误监控服务）
   * @param error 错误对象
   * @param context 错误上下文
   */
  async reportError(error, context) {
    // 这里可以集成错误报告服务，如Sentry、LogRocket等
    // 目前只是记录到控制台
    console.error('Reporting error:', {
      error: {
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    });

    // 模拟异步报告过程
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

module.exports = { ErrorHandler, AppError, ErrorType };