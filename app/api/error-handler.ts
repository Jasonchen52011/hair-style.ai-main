import axios from 'axios';
import { StatusCodes } from 'http-status-codes';

export function handleApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    // 处理网络错误
    if (!error.response) {
      return {
        message: 'Network Error',
        status: StatusCodes.SERVICE_UNAVAILABLE
      };
    }
    
    // 处理API错误
    return {
      message: error.response.data?.message || error.message,
      status: error.response.status
    };
  }
  
  // 处理其他错误
  return {
    message: error instanceof Error ? error.message : 'Unknown Error',
    status: StatusCodes.INTERNAL_SERVER_ERROR
  };
} 