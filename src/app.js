/**
 * 主应用程序类 - 企业微信与飞书消息桥接器
 * 负责整合所有模块，配置路由，并处理消息流转
 */

const { Logger } = require('./modules/logger.js');
const { ConfigManager } = require('./modules/config-manager.js');
const { FeishuConnector } = require('./modules/feishu-connector.js');
const { WecomConnector } = require('./modules/wecom-connector.js');
const { MessageTransformer } = require('./modules/message-transformer.js');
const { ErrorHandler } = require('./modules/error-handler.js');

/**
 * 主应用程序类
 */
class App {
  /**
   * 创建应用程序实例
   * @param {Object} env - Cloudflare Workers环境变量
   */
  constructor(env) {
    // 初始化日志记录器
    this.logger = new Logger(env.LOG_LEVEL || 'info');
    
    // 初始化错误处理器
    this.errorHandler = new ErrorHandler(this.logger);
    
    // 初始化配置管理器
    this.configManager = new ConfigManager(env, this.logger);
    
    // 初始化连接器
    this.feishuConnector = new FeishuConnector(env, this.logger, this.errorHandler);
    this.wecomConnector = new WecomConnector(env, this.logger, this.errorHandler);
    
    // 初始化消息转换器
    this.messageTransformer = new MessageTransformer(this.logger);
    
    // 初始化路由表
    this.routes = {
      '/': this.handleRoot.bind(this),
      '/health': this.handleHealth.bind(this),
      '/websocket': this.handleWebSocket.bind(this),
      '/wecom/callback': this.handleWecomCallback.bind(this),
      '/feishu/event': this.handleFeishuEvent.bind(this),
      '/config': this.handleConfig.bind(this)
    };
    
    this.logger.info('应用程序初始化完成', { routes: Object.keys(this.routes) });
  }

  /**
   * 处理HTTP请求
   * @param {Request} request - 传入的HTTP请求
   * @returns {Promise<Response>} HTTP响应
   */
  async handleRequest(request) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // 查找匹配的路由处理函数
      const handler = this.routes[path];
      
      if (handler) {
        this.logger.info(`处理请求: ${path}`, { method: request.method });
        return await handler(request);
      } else {
        this.logger.warn(`未找到路由: ${path}`);
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      this.errorHandler.handleApiError(error, '主请求处理');
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * 处理根路径请求
   * @param {Request} request - HTTP请求
   * @returns {Response} HTTP响应
   */
  handleRoot(request) {
    return new Response('企业微信与飞书消息桥接器\n版本: 1.0.0\n状态: 运行中', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  /**
   * 处理健康检查请求
   * @param {Request} request - HTTP请求
   * @returns {Promise<Response>} HTTP响应
   */
  async handleHealth(request) {
    try {
      // 检查各组件状态
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        components: {
          feishuConnector: await this.feishuConnector.checkHealth(),
          wecomConnector: await this.wecomConnector.checkHealth(),
          configManager: this.configManager.checkHealth()
        }
      };
      
      return new Response(JSON.stringify(healthStatus), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.errorHandler.handleApiError(error, '健康检查');
      return new Response(JSON.stringify({ status: 'error', message: error.message }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * 处理WebSocket连接
   * @param {Request} request - HTTP请求
   * @returns {WebSocketPair} WebSocket连接对
   */
  handleWebSocket(request) {
    this.logger.info('收到WebSocket连接请求');
    
    const [client, server] = Object.values(new WebSocketPair());
    
    server.onopen = () => {
      this.logger.info('WebSocket连接已建立');
      server.send(JSON.stringify({ type: 'connected', message: '连接成功' }));
    };
    
    server.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        this.logger.info('收到WebSocket消息', { type: data.type });
        
        // 根据消息类型处理
        switch (data.type) {
          case 'test_message':
            // 处理测试消息
            await this.handleTestMessage(server, data);
            break;
          default:
            this.logger.warn('未知的WebSocket消息类型', { type: data.type });
            server.send(JSON.stringify({ type: 'error', message: '未知的消息类型' }));
        }
      } catch (error) {
        this.errorHandler.handleWebSocketError(error);
        server.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    };
    
    server.onclose = () => {
      this.logger.info('WebSocket连接已关闭');
    };
    
    server.onerror = (error) => {
      this.errorHandler.handleWebSocketError(error);
    };
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  /**
   * 处理企业微信回调
   * @param {Request} request - HTTP请求
   * @returns {Promise<Response>} HTTP响应
   */
  async handleWecomCallback(request) {
    const url = new URL(request.url);
    
    // 处理验证请求
    if (request.method === 'GET') {
      this.logger.info('收到企业微信验证请求');
      
      // 获取URL参数
      const msgSignature = url.searchParams.get('msg_signature');
      const timestamp = url.searchParams.get('timestamp');
      const nonce = url.searchParams.get('nonce');
      const echostr = url.searchParams.get('echostr');
      
      try {
        // 验证签名
        if (this.wecomConnector.verifySignature(msgSignature, timestamp, nonce, echostr)) {
          return new Response(this.wecomConnector.decryptEchoStr(echostr));
        } else {
          this.logger.warn('企业微信签名验证失败');
          return new Response('Invalid signature', { status: 401 });
        }
      } catch (error) {
        this.errorHandler.handleApiError(error, '企业微信验证');
        return new Response('Verification failed', { status: 401 });
      }
    }
    
    // 处理消息回调
    if (request.method === 'POST') {
      try {
        this.logger.info('收到企业微信消息回调');
        
        // 获取消息内容
        const body = await request.text();
        const msgSignature = url.searchParams.get('msg_signature');
        const timestamp = url.searchParams.get('timestamp');
        const nonce = url.searchParams.get('nonce');
        
        // 验证并解密消息
        const message = await this.wecomConnector.processMessage(body, msgSignature, timestamp, nonce);
        
        // 转换消息格式
        const feishuMessage = this.messageTransformer.transformToFeishu(message);
        
        // 转发到飞书
        await this.feishuConnector.sendMessage(feishuMessage);
        
        // 返回成功响应
        return new Response('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>', {
          headers: { 'Content-Type': 'application/xml' }
        });
      } catch (error) {
        this.errorHandler.handleForwardError(error, '企业微信到飞书');
        return new Response('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Error processing message]]></return_msg></xml>', {
          status: 500,
          headers: { 'Content-Type': 'application/xml' }
        });
      }
    }
    
    return new Response('Method not allowed', { status: 405 });
  }

  /**
   * 处理飞书事件回调
   * @param {Request} request - HTTP请求
   * @returns {Promise<Response>} HTTP响应
   */
  async handleFeishuEvent(request) {
    try {
      this.logger.info('收到飞书事件回调');
      
      // 读取请求体
      const body = await request.json();
      
      // 处理挑战请求
      if (body.type === 'url_verification') {
        this.logger.info('收到飞书URL验证请求');
        return new Response(JSON.stringify({
          challenge: body.challenge
        }));
      }
      
      // 处理事件
      if (body.type === 'event_callback' && body.event) {
        this.logger.info('处理飞书事件', { event_type: body.event.type });
        
        // 处理消息事件
        if (body.event.type === 'message' && body.event.message) {
          // 转换消息格式
          const wecomMessage = this.messageTransformer.transformToWecom(body.event);
          
          // 转发到企业微信
          await this.wecomConnector.sendMessage(wecomMessage);
        }
      }
      
      // 返回成功响应
      return new Response(JSON.stringify({
        code: 0,
        msg: 'success'
      }));
    } catch (error) {
      this.errorHandler.handleForwardError(error, '飞书到企业微信');
      return new Response(JSON.stringify({
        code: 1,
        msg: 'error processing event'
      }), { status: 500 });
    }
  }

  /**
   * 处理测试消息
   * @param {WebSocket} server - WebSocket服务器连接
   * @param {Object} data - 测试消息数据
   * @returns {Promise<void>}
   */
  async handleTestMessage(server, data) {
    try {
      this.logger.info('处理测试消息', { target: data.target });
      
      // 发送测试消息到指定平台
      if (data.target === 'feishu') {
        const result = await this.feishuConnector.sendTestMessage(data.content);
        server.send(JSON.stringify({ type: 'test_response', success: true, result }));
      } else if (data.target === 'wecom') {
        const result = await this.wecomConnector.sendTestMessage(data.content);
        server.send(JSON.stringify({ type: 'test_response', success: true, result }));
      } else {
        server.send(JSON.stringify({ type: 'error', message: '无效的目标平台' }));
      }
    } catch (error) {
      this.errorHandler.handleApiError(error, '测试消息');
      server.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  }

  /**
   * 启动应用程序
   * @returns {Promise<void>}
   */
  async start() {
    this.logger.info('应用程序启动中...');
    // 在实际环境中，这里会初始化服务器、数据库连接等
    // 对于Cloudflare Workers，主要是设置事件监听器
    this.logger.info('应用程序启动完成');
    return Promise.resolve();
  }

  /**
   * 处理配置管理请求
   * @param {Request} request - HTTP请求
   * @returns {Promise<Response>} HTTP响应
   */
  async handleConfig(request) {
    try {
      this.logger.info('收到配置管理请求', { method: request.method });
      
      // 只支持GET请求获取配置
      if (request.method === 'GET') {
        // 获取当前配置信息
        const config = {
          wecom: this.configManager.getWecomConfig(),
          feishu: this.configManager.getFeishuConfig(),
          logLevel: this.configManager.getLogLevel()
        };
        
        // 出于安全考虑，不返回密钥等敏感信息
        const safeConfig = {
          wecom: {
            corpId: config.wecom.corpId ? '已配置' : '未配置',
            corpSecret: config.wecom.corpSecret ? '已配置' : '未配置',
            token: config.wecom.token ? '已配置' : '未配置',
            encodingAesKey: config.wecom.encodingAesKey ? '已配置' : '未配置'
          },
          feishu: {
            appId: config.feishu.appId ? '已配置' : '未配置',
            appSecret: config.feishu.appSecret ? '已配置' : '未配置'
          },
          logLevel: config.logLevel
        };
        
        return new Response(JSON.stringify(safeConfig), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      this.errorHandler.handleApiError(error, '配置管理');
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * 停止应用程序
   * @returns {Promise<void>}
   */
  async stop() {
    this.logger.info('应用程序停止中...');
    // 在实际环境中，这里会关闭连接、释放资源等
    this.logger.info('应用程序已停止');
    return Promise.resolve();
  }
}

module.exports = { App };