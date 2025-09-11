export interface HairstyleTaskParams {
  imageUrl: string;
  hairStyle: string;
  hairColor: string;
}

export interface SubmitTaskResponse {
  success: boolean;
  taskId?: string;
  error?: string;
  error_detail?: string;
  error_code?: number;
}

export interface TaskStatusResponse {
  task_status: number | string;
  success?: boolean;
  error?: string;
  error_code?: number;
  error_detail?: string;
  [key: string]: any;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  accessKey?: string;
  secretKey?: string;
  [key: string]: any;
}

export interface HairstyleProvider {
  readonly name: string;
  submitTask(params: HairstyleTaskParams): Promise<SubmitTaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
}