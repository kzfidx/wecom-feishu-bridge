/**
 * 消息格式转换器
 * 负责在企业微信和飞书消息格式之间进行转换
 */

/**
 * 企业微信到飞书的消息转换类
 */
class MessageTransformer {
  /**
   * 将企业微信消息转换为飞书消息
   * @param {Object} wecomMessage - 企业微信消息对象
   * @returns {Object} 转换后的飞书消息对象
   */
  wecomToFeishu(wecomMessage) {
    if (!wecomMessage) {
      throw new Error('企业微信消息不能为空');
    }

    // 根据企业微信消息类型进行转换
    const msgType = wecomMessage.msgtype || '';
    
    switch (msgType) {
      case 'text':
        return this._convertTextToFeishu(wecomMessage);
      case 'image':
        return this._convertImageToFeishu(wecomMessage);
      case 'file':
        return this._convertFileToFeishu(wecomMessage);
      case 'voice':
        return this._convertVoiceToFeishu(wecomMessage);
      case 'video':
        return this._convertVideoToFeishu(wecomMessage);
      case 'news':
        return this._convertNewsToFeishu(wecomMessage);
      case 'link':
        return this._convertLinkToFeishu(wecomMessage);
      default:
        return this._convertUnsupportedToFeishu(wecomMessage);
    }
  }

  /**
   * 将飞书消息转换为企业微信消息
   * @param {Object} feishuMessage - 飞书消息对象
   * @returns {Object} 转换后的企业微信消息对象
   */
  feishuToWecom(feishuMessage) {
    if (!feishuMessage) {
      throw new Error('飞书消息不能为空');
    }

    // 飞书消息通常包含schema和msg_type
    const msgType = feishuMessage.msg_type || '';
    const content = feishuMessage.content ? JSON.parse(feishuMessage.content) : {};
    
    switch (msgType) {
      case 'text':
        return this._convertTextToWecom(content);
      case 'image':
        return this._convertImageToWecom(content);
      case 'file':
        return this._convertFileToWecom(content);
      case 'audio':
        return this._convertAudioToWecom(content);
      case 'video':
        return this._convertVideoToWecom(content);
      case 'post':
        return this._convertPostToWecom(content);
      case 'share_chat':
        return this._convertShareChatToWecom(content);
      default:
        return this._convertUnsupportedToWecom(feishuMessage);
    }
  }

  /**
   * 转换文本消息到飞书
   * @private
   * @param {Object} message - 企业微信文本消息
   * @returns {Object} 飞书文本消息
   */
  _convertTextToFeishu(message) {
    const text = message.text?.content || '';
    const mentioned = message.text?.mentioned_list || [];
    
    return {
      msg_type: 'text',
      content: JSON.stringify({
        text: this._formatMentionedText(text, mentioned)
      })
    };
  }

  /**
   * 转换文本消息到企业微信
   * @private
   * @param {Object} content - 飞书文本消息内容
   * @returns {Object} 企业微信文本消息
   */
  _convertTextToWecom(content) {
    return {
      msgtype: 'text',
      text: {
        content: content.text || ''
      }
    };
  }

  /**
   * 转换图片消息到飞书
   * @private
   * @param {Object} message - 企业微信图片消息
   * @returns {Object} 飞书图片消息
   */
  _convertImageToFeishu(message) {
    return {
      msg_type: 'image',
      content: JSON.stringify({
        image_key: message.image?.media_id || '',
        // 飞书需要图片密钥，这里使用media_id作为占位符，实际需要上传到飞书
        image_type: 'message'
      })
    };
  }

  /**
   * 转换图片消息到企业微信
   * @private
   * @param {Object} content - 飞书图片消息内容
   * @returns {Object} 企业微信图片消息
   */
  _convertImageToWecom(content) {
    return {
      msgtype: 'image',
      image: {
        media_id: content.image_key || ''
        // 实际需要上传到企业微信获取media_id
      }
    };
  }

  /**
   * 转换文件消息到飞书
   * @private
   * @param {Object} message - 企业微信文件消息
   * @returns {Object} 飞书文件消息
   */
  _convertFileToFeishu(message) {
    return {
      msg_type: 'file',
      content: JSON.stringify({
        file_key: message.file?.media_id || '',
        // 飞书需要文件密钥，这里使用media_id作为占位符，实际需要上传到飞书
        file_name: message.file?.filename || 'unknown_file'
      })
    };
  }

  /**
   * 转换文件消息到企业微信
   * @private
   * @param {Object} content - 飞书文件消息内容
   * @returns {Object} 企业微信文件消息
   */
  _convertFileToWecom(content) {
    return {
      msgtype: 'file',
      file: {
        media_id: content.file_key || '',
        // 实际需要上传到企业微信获取media_id
        filename: content.file_name || 'unknown_file'
      }
    };
  }

  /**
   * 转换语音消息到飞书
   * @private
   * @param {Object} message - 企业微信语音消息
   * @returns {Object} 飞书语音消息
   */
  _convertVoiceToFeishu(message) {
    return {
      msg_type: 'audio',
      content: JSON.stringify({
        file_key: message.voice?.media_id || '',
        // 飞书使用file_key，这里使用media_id作为占位符
        duration: message.voice?.format || 0
      })
    };
  }

  /**
   * 转换音频消息到企业微信
   * @private
   * @param {Object} content - 飞书音频消息内容
   * @returns {Object} 企业微信语音消息
   */
  _convertAudioToWecom(content) {
    return {
      msgtype: 'voice',
      voice: {
        media_id: content.file_key || '',
        // 实际需要上传到企业微信获取media_id
        format: content.duration || 0
      }
    };
  }

  /**
   * 转换视频消息到飞书
   * @private
   * @param {Object} message - 企业微信视频消息
   * @returns {Object} 飞书视频消息
   */
  _convertVideoToFeishu(message) {
    return {
      msg_type: 'video',
      content: JSON.stringify({
        file_key: message.video?.media_id || '',
        // 飞书使用file_key，这里使用media_id作为占位符
        video_type: 'message'
      })
    };
  }

  /**
   * 转换视频消息到企业微信
   * @private
   * @param {Object} content - 飞书视频消息内容
   * @returns {Object} 企业微信视频消息
   */
  _convertVideoToWecom(content) {
    return {
      msgtype: 'video',
      video: {
        media_id: content.file_key || '',
        // 实际需要上传到企业微信获取media_id
        title: content.video_name || '',
        description: content.video_desc || ''
      }
    };
  }

  /**
   * 转换新闻消息到飞书
   * @private
   * @param {Object} message - 企业微信新闻消息
   * @returns {Object} 飞书富文本消息
   */
  _convertNewsToFeishu(message) {
    const articles = message.news?.articles || [];
    
    if (articles.length === 0) {
      return this._convertUnsupportedToFeishu(message);
    }

    // 转换为飞书的富文本格式
    const elements = [];
    
    articles.forEach(article => {
      elements.push({
        tag: 'h2',
        text: article.title || ''
      });
      
      if (article.description) {
        elements.push({
          tag: 'p',
          text: article.description
        });
      }
      
      if (article.url) {
        elements.push({
          tag: 'a',
          href: article.url,
          text: '查看详情'
        });
      }
    });

    return {
      msg_type: 'post',
      content: JSON.stringify({
        post: {
          zh_cn: {
            title: '新闻消息',
            content: [elements]
          }
        }
      })
    };
  }

  /**
   * 转换链接消息到飞书
   * @private
   * @param {Object} message - 企业微信链接消息
   * @returns {Object} 飞书富文本消息
   */
  _convertLinkToFeishu(message) {
    const link = message.link || {};
    
    return {
      msg_type: 'post',
      content: JSON.stringify({
        post: {
          zh_cn: {
            title: link.title || '链接消息',
            content: [
              [
                {
                  tag: 'p',
                  text: link.description || ''
                },
                {
                  tag: 'a',
                  href: link.url || '',
                  text: '点击访问'
                }
              ]
            ]
          }
        }
      })
    };
  }

  /**
   * 转换飞书富文本消息到企业微信
   * @private
   * @param {Object} content - 飞书富文本消息内容
   * @returns {Object} 企业微信新闻消息
   */
  _convertPostToWecom(content) {
    // 获取富文本内容（优先使用中文）
    const postContent = content.post?.zh_cn || content.post?.en_us || {};
    const sections = postContent.content || [];
    
    // 简单转换为企业微信的新闻格式
    const articles = sections.map((section, index) => {
      const title = postContent.title || `富文本消息 #${index + 1}`;
      let description = '';
      let url = '';
      
      // 从内容中提取文本和链接
      section.forEach(element => {
        if (element.tag === 'p' || element.tag === 'h2' || element.tag === 'h3') {
          description += (element.text || '') + '\n';
        } else if (element.tag === 'a') {
          url = element.href || url;
          description += `[${element.text || '链接'}](${element.href || ''})\n`;
        }
      });

      return {
        title,
        description: description.trim(),
        url: url || 'https://example.com',
        picurl: '' // 暂时不处理图片
      };
    });

    // 如果只有一篇文章，直接返回news类型
    if (articles.length === 1) {
      return {
        msgtype: 'news',
        news: {
          articles: [articles[0]]
        }
      };
    }

    // 多篇文章时，转换为图文消息
    return {
      msgtype: 'news',
      news: {
        articles
      }
    };
  }

  /**
   * 转换分享会话消息
   * @private
   * @param {Object} content - 飞书分享会话消息内容
   * @returns {Object} 企业微信文本消息
   */
  _convertShareChatToWecom(content) {
    return {
      msgtype: 'text',
      text: {
        content: `收到了一个会话分享: ${content.chat_name || '未知会话'}`
      }
    };
  }

  /**
   * 处理不支持的消息类型（企业微信到飞书）
   * @private
   * @param {Object} message - 企业微信消息
   * @returns {Object} 提示文本消息
   */
  _convertUnsupportedToFeishu(message) {
    return {
      msg_type: 'text',
      content: JSON.stringify({
        text: `收到不支持的消息类型: ${message.msgtype || 'unknown'}`
      })
    };
  }

  /**
   * 处理不支持的消息类型（飞书到企业微信）
   * @private
   * @param {Object} message - 飞书消息
   * @returns {Object} 提示文本消息
   */
  _convertUnsupportedToWecom(message) {
    return {
      msgtype: 'text',
      text: {
        content: `收到不支持的消息类型: ${message.msg_type || 'unknown'}`
      }
    };
  }

  /**
   * 格式化包含@提及的文本
   * @private
   * @param {string} text - 原始文本
   * @param {Array} mentionedList - 提及的用户列表
   * @returns {string} 格式化后的文本
   */
  _formatMentionedText(text, mentionedList) {
    if (!mentionedList || mentionedList.length === 0) {
      return text;
    }

    // 在飞书中，@用户通常使用特定格式，但这里为了简化，仅保留原始文本
    return text;
  }

  /**
   * 转换用户ID
   * @param {string} sourceId - 源平台用户ID
   * @param {Object} userMapping - 用户映射关系
   * @returns {string} 目标平台用户ID
   */
  mapUserId(sourceId, userMapping) {
    if (!userMapping || typeof userMapping !== 'object') {
      return sourceId;
    }
    return userMapping[sourceId] || sourceId;
  }

  /**
   * 转换群组ID
   * @param {string} sourceChatId - 源平台群组ID
   * @param {Object} chatMapping - 群组映射关系
   * @returns {string} 目标平台群组ID
   */
  mapChatId(sourceChatId, chatMapping) {
    if (!chatMapping || typeof chatMapping !== 'object') {
      return sourceChatId;
    }
    return chatMapping[sourceChatId] || sourceChatId;
  }
}

// 创建并导出消息转换器实例
const messageTransformer = new MessageTransformer();

module.exports = { MessageTransformer, messageTransformer };