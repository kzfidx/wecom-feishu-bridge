/**
 * 消息转换器模块
 * 负责在企业微信和飞书消息格式之间进行转换
 */

class MessageTransformer {
  /**
   * 构造函数
   * @param {Object} logger - 日志记录器实例
   */
  constructor(logger) {
    this.logger = logger || console;
    this.supportedMessageTypes = {
      text: true,
      markdown: true,
      image: true,
      file: true,
      card: true,
      audio: true,
      video: true,
      location: true,
      rich_text: true
    };
  }

  /**
   * 将企业微信消息转换为飞书消息
   * @param {Object} wecomMessage - 企业微信消息对象
   * @returns {Object} 转换后的飞书消息对象
   */
  wecomToFeishu(wecomMessage) {
    if (!wecomMessage || !wecomMessage.msgtype) {
      throw new Error('无效的企业微信消息格式');
    }

    const msgType = wecomMessage.msgtype;
    
    // 根据消息类型调用对应的转换方法
    switch (msgType) {
      case 'text':
        return this._convertWecomTextToFeishu(wecomMessage.text);
      case 'markdown':
        return this._convertWecomMarkdownToFeishu(wecomMessage.markdown);
      case 'image':
        return this._convertWecomImageToFeishu(wecomMessage.image);
      case 'file':
        return this._convertWecomFileToFeishu(wecomMessage.file);
      case 'news':
        return this._convertWecomNewsToFeishu(wecomMessage.news);
      case 'miniprogram_notice':
        return this._convertWecomMiniprogramToFeishu(wecomMessage.miniprogram_notice);
      default:
        this.logger.warn(`不支持的企业微信消息类型: ${msgType}`);
        return this._convertToUnsupportedFormat(wecomMessage);
    }
  }

  /**
   * 将飞书消息转换为企业微信消息
   * @param {Object} feishuMessage - 飞书消息对象
   * @returns {Object} 转换后的企业微信消息对象
   */
  feishuToWecom(feishuMessage) {
    if (!feishuMessage || !feishuMessage.msg_type) {
      throw new Error('无效的飞书消息格式');
    }

    const msgType = feishuMessage.msg_type;
    
    // 根据消息类型调用对应的转换方法
    switch (msgType) {
      case 'text':
        return this._convertFeishuTextToWecom(feishuMessage.text);
      case 'image':
        return this._convertFeishuImageToWecom(feishuMessage.image);
      case 'file':
        return this._convertFeishuFileToWecom(feishuMessage.file);
      case 'card':
        return this._convertFeishuCardToWecom(feishuMessage.card);
      case 'share_chat':
        return this._convertFeishuShareChatToWecom(feishuMessage.share_chat);
      case 'interactive':
        return this._convertFeishuInteractiveToWecom(feishuMessage.interactive);
      case 'markdown':
        return this._convertFeishuMarkdownToWecom(feishuMessage.markdown);
      default:
        this.logger.warn(`不支持的飞书消息类型: ${msgType}`);
        return this._convertToUnsupportedFormat(feishuMessage);
    }
  }
  
  /**
   * 测试用方法：转换飞书消息为企业微信消息
   * @param {Object} feishuMessage - 飞书消息对象
   * @returns {Object|null} 转换后的企业微信消息对象
   */
  transformToWecom(feishuMessage) {
    try {
      // 检查消息结构是否有效
      if (!feishuMessage || !feishuMessage.event || !feishuMessage.event.message) {
        return null;
      }
      
      const message = feishuMessage.event.message;
      
      // 只处理text类型的消息
      if (message.message_type !== 'text') {
        return null;
      }
      
      // 解析文本内容
      try {
        const parsedContent = JSON.parse(message.content);
        return {
          msgtype: 'text',
          text: {
            content: parsedContent.text || ''
          },
          msg_id: message.message_id
        };
      } catch (parseError) {
        return null;
      }
    } catch (error) {
      this.logger.error('转换飞书消息到企业微信失败:', error);
      return null;
    }
  }
  
  /**
   * 测试用方法：转换文本消息内容
   * @param {string} content - 消息内容字符串
   * @returns {Object} 转换后的消息对象
   */
  transformTextMessage(content) {
    try {
      const parsedContent = JSON.parse(content);
      return {
        msgtype: 'text',
        text: { content: parsedContent.text || '' }
      };
    } catch (error) {
      this.logger.error('解析文本消息失败:', error);
      return {
        msgtype: 'text',
        text: { content: '' }
      };
    }
  }

  /**
   * 转换企业微信文本消息到飞书
   * @param {Object} textMessage - 文本消息
   * @returns {Object} 飞书文本消息
   */
  _convertWecomTextToFeishu(textMessage) {
    return {
      msg_type: 'text',
      content: {
        text: textMessage.content || ''
      }
    };
  }

  /**
   * 转换企业微信Markdown消息到飞书
   * @param {Object} markdownMessage - Markdown消息
   * @returns {Object} 飞书Markdown消息
   */
  _convertWecomMarkdownToFeishu(markdownMessage) {
    return {
      msg_type: 'markdown',
      content: {
        markdown: markdownMessage.content || ''
      }
    };
  }

  /**
   * 转换企业微信图片消息到飞书
   * @param {Object} imageMessage - 图片消息
   * @returns {Object} 飞书图片消息
   */
  _convertWecomImageToFeishu(imageMessage) {
    // 注意：这里需要先上传图片到飞书，获取image_key
    // 这里简化处理，实际需要调用飞书的上传接口
    return {
      msg_type: 'image',
      content: {
        image_key: imageMessage.mediaid || ''
      }
    };
  }

  /**
   * 转换企业微信文件消息到飞书
   * @param {Object} fileMessage - 文件消息
   * @returns {Object} 飞书文件消息
   */
  _convertWecomFileToFeishu(fileMessage) {
    // 注意：这里需要先上传文件到飞书，获取file_key
    return {
      msg_type: 'file',
      content: {
        file_key: fileMessage.mediaid || '',
        file_name: fileMessage.filename || 'unknown_file'
      }
    };
  }

  /**
   * 转换企业微信图文消息到飞书
   * @param {Object} newsMessage - 图文消息
   * @returns {Object} 飞书卡片消息
   */
  _convertWecomNewsToFeishu(newsMessage) {
    // 转换为飞书的卡片消息
    const articles = newsMessage.articles || [];
    const firstArticle = articles[0] || {};
    
    return {
      msg_type: 'card',
      content: {
        card: {
          config: {
            wide_screen_mode: true
          },
          elements: [
            {
              tag: 'div',
              text: {
                content: firstArticle.title || '',
                tag: 'plain_text'
              }
            },
            {
              tag: 'div',
              text: {
                content: firstArticle.description || '',
                tag: 'plain_text'
              }
            },
            {
              tag: 'img',
              img_key: firstArticle.picurl || '',
              alt: {
                tag: 'plain_text',
                content: '图片'
              }
            },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: {
                    tag: 'plain_text',
                    content: '查看详情'
                  },
                  url: firstArticle.url || '',
                  type: 'default'
                }
              ]
            }
          ]
        }
      }
    };
  }

  /**
   * 转换企业微信小程序消息到飞书
   * @param {Object} miniprogramMessage - 小程序消息
   * @returns {Object} 飞书卡片消息
   */
  _convertWecomMiniprogramToFeishu(miniprogramMessage) {
    return {
      msg_type: 'card',
      content: {
        card: {
          config: {
            wide_screen_mode: true
          },
          elements: [
            {
              tag: 'div',
              text: {
                content: miniprogramMessage.title || '',
                tag: 'plain_text'
              }
            },
            {
              tag: 'div',
              text: {
                content: miniprogramMessage.description || '',
                tag: 'plain_text'
              }
            },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: {
                    tag: 'plain_text',
                    content: '打开应用'
                  },
                  url: miniprogramMessage.page || '',
                  type: 'default'
                }
              ]
            }
          ]
        }
      }
    };
  }

  /**
   * 转换飞书文本消息到企业微信
   * @param {Object} textMessage - 飞书文本消息
   * @returns {Object} 企业微信文本消息
   */
  _convertFeishuTextToWecom(textMessage) {
    return {
      msgtype: 'text',
      text: {
        content: textMessage.text || ''
      }
    };
  }

  /**
   * 转换飞书Markdown消息到企业微信
   * @param {Object} markdownMessage - 飞书Markdown消息
   * @returns {Object} 企业微信Markdown消息
   */
  _convertFeishuMarkdownToWecom(markdownMessage) {
    return {
      msgtype: 'markdown',
      markdown: {
        content: markdownMessage.content || ''
      }
    };
  }

  /**
   * 转换飞书图片消息到企业微信
   * @param {Object} imageMessage - 飞书图片消息
   * @returns {Object} 企业微信图片消息
   */
  _convertFeishuImageToWecom(imageMessage) {
    // 注意：这里需要先上传图片到企业微信，获取media_id
    return {
      msgtype: 'image',
      image: {
        mediaid: imageMessage.image_key || ''
      }
    };
  }

  /**
   * 转换飞书文件消息到企业微信
   * @param {Object} fileMessage - 飞书文件消息
   * @returns {Object} 企业微信文件消息
   */
  _convertFeishuFileToWecom(fileMessage) {
    // 注意：这里需要先上传文件到企业微信，获取media_id
    return {
      msgtype: 'file',
      file: {
        mediaid: fileMessage.file_key || '',
        filename: fileMessage.file_name || 'unknown_file'
      }
    };
  }

  /**
   * 转换飞书卡片消息到企业微信
   * @param {Object} cardMessage - 飞书卡片消息
   * @returns {Object} 企业微信图文消息
   */
  _convertFeishuCardToWecom(cardMessage) {
    // 简化转换，提取卡片中的主要信息
    const card = cardMessage.card || {};
    const elements = card.elements || [];
    
    let title = '';
    let description = '';
    let picurl = '';
    let url = '';
    
    // 从卡片元素中提取信息
    for (const element of elements) {
      if (element.tag === 'div' && element.text && element.text.tag === 'plain_text') {
        if (!title) {
          title = element.text.content;
        } else if (!description) {
          description = element.text.content;
        }
      } else if (element.tag === 'img') {
        picurl = element.img_key || '';
      } else if (element.tag === 'action' && element.actions) {
        const firstAction = element.actions[0];
        if (firstAction && firstAction.url) {
          url = firstAction.url;
        }
      }
    }
    
    return {
      msgtype: 'news',
      news: {
        articles: [{
          title,
          description,
          url,
          picurl
        }]
      }
    };
  }

  /**
   * 转换飞书群分享消息到企业微信
   * @param {Object} shareChatMessage - 飞书群分享消息
   * @returns {Object} 企业微信文本消息
   */
  _convertFeishuShareChatToWecom(shareChatMessage) {
    return {
      msgtype: 'text',
      text: {
        content: `分享了一个群聊: ${shareChatMessage.chat_name || '未知群组'}`
      }
    };
  }

  /**
   * 转换飞书交互消息到企业微信
   * @param {Object} interactiveMessage - 飞书交互消息
   * @returns {Object} 企业微信图文消息
   */
  _convertFeishuInteractiveToWecom(interactiveMessage) {
    // 简化转换，提取主要信息
    return {
      msgtype: 'news',
      news: {
        articles: [{
          title: '飞书交互卡片',
          description: '收到一个飞书交互卡片消息',
          url: '',
          picurl: ''
        }]
      }
    };
  }

  /**
   * 转换不支持的消息格式
   * @param {Object} originalMessage - 原始消息
   * @returns {Object} 转换后的通用文本消息
   */
  _convertToUnsupportedFormat(originalMessage) {
    const msgType = originalMessage.msgtype || originalMessage.msg_type || 'unknown';
    
    return {
      msg_type: 'text',
      content: {
        text: `收到不支持的消息类型: ${msgType}`
      }
    };
  }

  /**
   * 检查消息类型是否支持
   * @param {string} messageType - 消息类型
   * @returns {boolean} 是否支持
   */
  isMessageTypeSupported(messageType) {
    return !!this.supportedMessageTypes[messageType];
  }

  /**
   * 获取支持的消息类型列表
   * @returns {string[]} 支持的消息类型数组
   */
  getSupportedMessageTypes() {
    return Object.keys(this.supportedMessageTypes);
  }
}

// CommonJS导出
module.exports = { MessageTransformer };