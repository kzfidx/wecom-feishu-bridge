/**
 * 企业微信与飞书消息桥接服务 - 主入口文件
 * 基于Cloudflare Workers实现的双向通信桥接器
 */

import { App } from './app.js';

/**
 * Cloudflare Workers主入口函数
 * @param {Request} request - 传入的HTTP请求
 * @param {Object} env - 环境变量
 * @param {Object} ctx - 上下文对象
 * @returns {Promise<Response>} HTTP响应
 */
export default {
  async fetch(request, env, ctx) {
    // 创建应用实例
    const app = new App(env);
    
    // 处理请求
    const response = await app.handleRequest(request);
    
    // 返回响应
    return response;
  }
};