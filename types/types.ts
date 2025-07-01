// 定义 API 响应类型
export interface ApiResponse {
  request_id: string;
  log_id: string;
  error_code: number;
  error_code_str: string;
  error_msg: string;
  error_detail: {
    status_code: number;
    code: string;
    code_message: string;
    message: string;
  };
  task_type?: string;
  task_id?: string;
  data: {
    images?: {
      [key: string]: string[];
    };
    elements?: Array<{
      image_url: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }>;
  };
}

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            context?: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}
