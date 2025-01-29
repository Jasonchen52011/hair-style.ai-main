import axios from 'axios';
import axiosRetry from 'axios-retry';
import { StatusCodes } from 'http-status-codes';
import https from 'https';

const apiClient = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosRetry(apiClient, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 重试间隔时间
  },
  retryCondition: (error) => {
    // 只在网络错误或500系列错误时重试
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status >= StatusCodes.INTERNAL_SERVER_ERROR;
  },
});

apiClient.interceptors.request.use((config) => {
  // 添加认证信息
  const token = process.env.API_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 统一处理特定错误
    if (error.response?.status === StatusCodes.UNAUTHORIZED) {
      // 处理认证错误
    }
    return Promise.reject(error);
  }
);

export default apiClient; 