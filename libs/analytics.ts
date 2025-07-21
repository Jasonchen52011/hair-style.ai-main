import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';

// 获取或创建session ID
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// 获取设备信息
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { device_type: 'unknown', browser: 'unknown' };
  
  const userAgent = navigator.userAgent;
  let device_type = 'desktop';
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    device_type = 'tablet';
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device_type = 'mobile';
  }
  
  let browser = 'unknown';
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
  }
  
  return { device_type, browser };
};

// 日志记录主类
export class Analytics {
  private supabase;
  private userId: string | null = null;
  private sessionId: string;
  
  constructor() {
    this.supabase = createClientComponentClient();
    this.sessionId = getSessionId();
    this.initUser();
  }
  
  private async initUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.userId = user?.id || null;
  }
  
  // 记录用户活动
  async logActivity(
    actionType: string,
    actionName: string,
    metadata?: Record<string, any>
  ) {
    try {
      const { device_type, browser } = getDeviceInfo();
      
      const { data, error } = await this.supabase
        .from('user_activity_logs')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          action_type: actionType,
          action_name: actionName,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          device_type,
          browser,
          metadata: metadata || {}
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to log activity:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }
  
  // 记录API调用
  async logApiCall(
    activityLogId: string | null,
    endpoint: string,
    method: string,
    requestBody: any,
    responseStatus: number,
    responseBody: any,
    responseTimeMs: number,
    taskId?: string,
    errorType?: string,
    errorMessage?: string
  ) {
    try {
      const { error } = await this.supabase
        .from('api_call_logs')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          activity_log_id: activityLogId,
          endpoint,
          method,
          request_body: requestBody,
          response_status: responseStatus,
          response_body: responseBody,
          response_time_ms: responseTimeMs,
          task_id: taskId,
          error_type: errorType,
          error_message: errorMessage
        });
        
      if (error) {
        console.error('Failed to log API call:', error);
      }
    } catch (error) {
      console.error('Analytics API log error:', error);
    }
  }
  
  // 创建或更新发型生成任务
  async logHairstyleTask(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    options: {
      selectedStyle?: string;
      selectedColor?: string;
      selectedGender?: string;
      imageUrl?: string;
      failureReason?: string;
      failureDetails?: any;
      creditsUsed?: number;
      processingTimeMs?: number;
      pollCount?: number;
    } = {}
  ) {
    try {
      // 先检查任务是否已存在
      const { data: existing } = await this.supabase
        .from('hairstyle_generation_tasks')
        .select('id')
        .eq('task_id', taskId)
        .single();
      
      if (existing) {
        // 更新现有任务
        const { error } = await this.supabase
          .from('hairstyle_generation_tasks')
          .update({
            status,
            failure_reason: options.failureReason,
            failure_details: options.failureDetails,
            processing_time_ms: options.processingTimeMs,
            poll_count: options.pollCount,
            updated_at: new Date().toISOString()
          })
          .eq('task_id', taskId);
          
        if (error) {
          console.error('Failed to update hairstyle task:', error);
        }
      } else {
        // 创建新任务
        const { error } = await this.supabase
          .from('hairstyle_generation_tasks')
          .insert({
            task_id: taskId,
            user_id: this.userId,
            session_id: this.sessionId,
            status,
            selected_style: options.selectedStyle,
            selected_color: options.selectedColor,
            selected_gender: options.selectedGender,
            image_url: options.imageUrl,
            failure_reason: options.failureReason,
            failure_details: options.failureDetails,
            credits_used: options.creditsUsed || 0,
            processing_time_ms: options.processingTimeMs,
            poll_count: options.pollCount || 0
          });
          
        if (error) {
          console.error('Failed to create hairstyle task:', error);
        }
      }
    } catch (error) {
      console.error('Analytics task log error:', error);
    }
  }
  
  // 记录错误
  async logError(
    activityLogId: string | null,
    errorType: string,
    errorCode: string | null,
    errorMessage: string,
    context?: any
  ) {
    try {
      const { error } = await this.supabase
        .from('user_error_logs')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          activity_log_id: activityLogId,
          error_type: errorType,
          error_code: errorCode,
          error_message: errorMessage,
          context: context || {}
        });
        
      if (error) {
        console.error('Failed to log error:', error);
      }
    } catch (error) {
      console.error('Analytics error log error:', error);
    }
  }
  
  // 封装的API请求函数，自动记录日志
  async trackedFetch(
    url: string,
    options: RequestInit,
    metadata?: {
      actionName: string;
      taskId?: string;
      additionalData?: any;
    }
  ) {
    const startTime = Date.now();
    let activityLog = null;
    
    // 记录API调用开始
    if (metadata?.actionName) {
      activityLog = await this.logActivity(
        'api_call',
        metadata.actionName,
        metadata.additionalData
      );
    }
    
    try {
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      
      // 克隆响应以便读取body
      const responseClone = response.clone();
      let responseBody = null;
      
      try {
        responseBody = await responseClone.json();
      } catch {
        responseBody = { text: await responseClone.text() };
      }
      
      // 确定错误类型
      let errorType = null;
      let errorMessage = null;
      
      if (!response.ok) {
        switch (response.status) {
          case 400:
            errorType = 'validation_error';
            errorMessage = 'Invalid request parameters';
            break;
          case 402:
            errorType = 'insufficient_credits';
            errorMessage = 'Insufficient credits';
            break;
          case 408:
            errorType = 'timeout';
            errorMessage = 'Request timeout';
            break;
          case 422:
            errorType = 'unprocessable_entity';
            errorMessage = 'Image not suitable for processing';
            break;
          case 429:
            errorType = 'rate_limit';
            errorMessage = 'Too many requests';
            break;
          case 500:
          case 502:
          case 503:
            errorType = 'server_error';
            errorMessage = `Server error: ${response.status}`;
            break;
          default:
            errorType = 'unknown_error';
            errorMessage = `HTTP ${response.status}`;
        }
      }
      
      // 记录API调用详情
      await this.logApiCall(
        activityLog?.id || null,
        url,
        options.method || 'GET',
        options.body ? JSON.parse(options.body as string) : null,
        response.status,
        responseBody,
        responseTime,
        metadata?.taskId,
        errorType,
        errorMessage
      );
      
      // 如果有错误，记录到错误日志
      if (errorType && activityLog) {
        await this.logError(
          activityLog.id,
          errorType,
          response.status.toString(),
          errorMessage || 'Unknown error',
          { responseBody }
        );
      }
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 记录网络错误
      await this.logApiCall(
        activityLog?.id || null,
        url,
        options.method || 'GET',
        options.body ? JSON.parse(options.body as string) : null,
        0,
        null,
        responseTime,
        metadata?.taskId,
        'network_error',
        error instanceof Error ? error.message : 'Network error'
      );
      
      if (activityLog) {
        await this.logError(
          activityLog.id,
          'network_error',
          null,
          error instanceof Error ? error.message : 'Network error',
          { url, method: options.method }
        );
      }
      
      throw error;
    }
  }
}

// 创建单例实例
let analyticsInstance: Analytics | null = null;

export const getAnalytics = () => {
  if (typeof window === 'undefined') return null;
  
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
};

// 便捷方法
export const logActivity = (actionType: string, actionName: string, metadata?: any) => {
  const analytics = getAnalytics();
  return analytics?.logActivity(actionType, actionName, metadata);
};

export const logError = (errorType: string, errorMessage: string, context?: any) => {
  const analytics = getAnalytics();
  return analytics?.logError(null, errorType, null, errorMessage, context);
};

// 失败原因分类
export const classifyFailureReason = (error: any, status?: number): string => {
  if (!error && !status) return 'unknown';
  
  const errorMessage = error?.message || error?.error || '';
  
  // 基于状态码分类
  if (status === 422) return 'image_quality_issue';
  if (status === 408) return 'timeout';
  if (status === 402) return 'insufficient_credits';
  if (status === 429) return 'rate_limit';
  if (status === 500 || status === 502 || status === 503) return 'server_error';
  
  // 基于错误消息分类
  if (errorMessage.includes('face')) return 'no_face_detected';
  if (errorMessage.includes('quality')) return 'low_image_quality';
  if (errorMessage.includes('size') || errorMessage.includes('large')) return 'file_too_large';
  if (errorMessage.includes('format')) return 'invalid_format';
  if (errorMessage.includes('timeout')) return 'timeout';
  if (errorMessage.includes('credit')) return 'insufficient_credits';
  
  return 'unknown';
};