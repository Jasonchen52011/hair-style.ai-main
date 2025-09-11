import { HairstyleProvider, HairstyleTaskParams, SubmitTaskResponse, TaskStatusResponse, ProviderConfig } from './types';

export class AilabApiProvider implements HairstyleProvider {
  readonly name = 'AILabAPI';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.AILABAPI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://www.ailabapi.com/api';
    
    if (!this.apiKey) {
      throw new Error('AILabAPI key is required');
    }
  }

  async submitTask(params: HairstyleTaskParams): Promise<SubmitTaskResponse> {
    const { imageUrl, hairStyle, hairColor } = params;
    
    // Handle hairstyle selection logic
    let finalHairStyle = hairStyle;
    if (!hairStyle || hairStyle === "color-only") {
      finalHairStyle = 'LongWavy';
    }

    const formData = new FormData();
    formData.append("task_type", "async");
    
    if (imageUrl.startsWith('http')) {
      formData.append("image_url", imageUrl);
    } else {
      try {
        let binaryData: Uint8Array;
        
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid data URL format');
          }
          binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          binaryData = Uint8Array.from(atob(imageUrl), c => c.charCodeAt(0));
        }
        
        const blob = new Blob([binaryData as BlobPart], { type: 'image/jpeg' });
        formData.append("image", blob, 'image.jpg');
      } catch (error) {
        return {
          success: false,
          error: `Invalid image data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    formData.append("hair_data", JSON.stringify([{
      style: finalHairStyle,
      color: hairColor,
      num: 1
    }]));

    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/portrait/effects/hairstyles-editor-pro`,
        {
          method: 'POST',
          headers: {
            "ailabapi-api-key": this.apiKey,
            "Accept": "application/json"
          },
          body: formData
        }
      );

      const responseData = await response.json() as any;
      
      if (responseData.error_code === 0 && responseData.task_id) {
        return {
          success: true,
          taskId: responseData.task_id
        };
      }
      
      return {
        success: false,
        error: responseData.error || 'AILabAPI request failed',
        error_detail: responseData.error_detail,
        error_code: responseData.error_code
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/common/query-async-task-result?task_id=${taskId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "ailabapi-api-key": this.apiKey
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        return {
          task_status: 'FAILED',
          success: false,
          error_code: response.status
        };
      }

      const statusData = await response.json();
      return statusData;
    } catch (error) {
      return {
        task_status: 'FAILED',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok || response.status < 500) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }
        
        const delay = (attempt + 1) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}