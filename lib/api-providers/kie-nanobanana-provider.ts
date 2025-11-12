import { HairstyleProvider, HairstyleTaskParams, SubmitTaskResponse, TaskStatusResponse, ProviderConfig } from './types';
import { buildHairstylePrompt, validatePrompt } from '../volcI2iUtils';

export class KieNanoBananaProvider implements HairstyleProvider {
  readonly name = 'KIE-NanoBanana';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.KIE_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.kie.ai';

    if (!this.apiKey) {
      throw new Error('KIE NanoBanana Provider requires KIE_API_KEY environment variable');
    }
  }

  /**
   * Upload base64 image to tmpfiles.org and return public URL
   * Using free temporary file hosting (same as image template project)
   */
  private async uploadBase64ToTmpfiles(base64Data: string): Promise<string> {
    try {
      // Extract base64 data and mime type
      let pureBase64: string;
      let mimeType = 'image/jpeg'; // default

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          pureBase64 = matches[2];
        } else {
          throw new Error('Invalid data URL format');
        }
      } else {
        pureBase64 = base64Data;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(pureBase64, 'base64');

      console.log(`[KIE-NanoBanana] Uploading image to tmpfiles.org (size: ${buffer.length} bytes)`);

      // Create form data with the buffer
      const formData = new FormData();
      const extension = mimeType.split('/')[1] || 'jpg';
      const filename = `kie-upload-${Date.now()}.${extension}`;
      formData.append('file', new Blob([buffer], { type: mimeType }), filename);

      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`tmpfiles.org upload failed: ${response.status}`);
      }

      const result: any = await response.json();

      // tmpfiles.org returns: {"status":"success","data":{"url":"https://tmpfiles.org/xxxxx/filename.png"}}
      if (result.status === 'success' && result.data?.url) {
        let directUrl = result.data.url;

        // Convert to direct download URL: https://tmpfiles.org/dl/xxxxx/filename.png
        if (directUrl.includes('tmpfiles.org/') && !directUrl.includes('/dl/')) {
          directUrl = directUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }

        console.log(`[KIE-NanoBanana] Image uploaded successfully: ${directUrl}`);
        return directUrl;
      } else {
        throw new Error('tmpfiles.org upload failed: no URL in response');
      }

    } catch (error) {
      console.error('[KIE-NanoBanana] Error uploading base64 image:', error);
      throw error;
    }
  }

  async submitTask(params: HairstyleTaskParams): Promise<SubmitTaskResponse> {
    let { imageUrl } = params;
    const { hairStyle, hairColor } = params;

    try {
      console.log(`🎯 [KIE-NanoBanana] Building prompt for hairStyle: "${hairStyle}", hairColor: "${hairColor}"`);
      const prompt = buildHairstylePrompt(hairStyle, hairColor);
      console.log(`📝 [KIE-NanoBanana] Generated prompt: "${prompt}"`);
      validatePrompt(prompt);

      // Handle base64 images by uploading to tmpfiles.org
      if (!imageUrl.startsWith('http')) {
        console.log('[KIE-NanoBanana] Detected base64 image, uploading to tmpfiles.org...');
        imageUrl = await this.uploadBase64ToTmpfiles(imageUrl);
        console.log(`[KIE-NanoBanana] Image uploaded, new URL: ${imageUrl}`);
      }

      const requestBody = {
        model: 'google/nano-banana-edit',
        input: {
          prompt: prompt,
          image_urls: [imageUrl],
          output_format: 'png',
          image_size: '1:1'
        }
      };

      console.log(`[KIE-NanoBanana] Submitting task with params:`, {
        hairStyle: params.hairStyle,
        hairColor: params.hairColor,
        prompt: prompt,
        imageUrl: imageUrl
      });

      const response = await fetch(`${this.baseUrl}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json() as any;

      console.log(`[KIE-NanoBanana] Submit response:`, {
        status: response.status,
        ok: response.ok,
        code: responseData.code,
        message: responseData.message,
        taskId: responseData.data?.taskId
      });

      // Check for success (code: 200)
      if (response.ok && responseData.code === 200 && responseData.data?.taskId) {
        return {
          success: true,
          taskId: responseData.data.taskId
        };
      }

      // Handle API errors
      return {
        success: false,
        error: responseData.message || 'KIE API request failed',
        error_code: responseData.code,
        error_detail: responseData.message
      };
    } catch (error) {
      console.error('[KIE-NanoBanana] Submit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in KIE NanoBanana provider'
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      console.log(`[KIE-NanoBanana] Checking status for task: ${taskId}`);

      const response = await fetch(`${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.error(`[KIE-NanoBanana] Status check failed: ${response.status}`);
        return {
          task_status: 'FAILED',
          success: false,
          error_code: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const statusData = await response.json();
      console.log(`[KIE-NanoBanana] Status response:`, {
        code: statusData.code,
        state: statusData.data?.state,
        hasResultJson: !!statusData.data?.resultJson
      });

      if (statusData.code === 200 && statusData.data) {
        const result = statusData.data;

        // Map KIE states to internal task_status
        // KIE states: waiting, queuing, generating, success, fail
        switch (result.state) {
          case 'success': {
            // Parse resultJson to get image URLs
            let imageUrls: string[] = [];

            if (result.resultJson) {
              try {
                const resultObj = typeof result.resultJson === 'string'
                  ? JSON.parse(result.resultJson)
                  : result.resultJson;

                if (resultObj.resultUrls && Array.isArray(resultObj.resultUrls)) {
                  imageUrls = resultObj.resultUrls;
                }
              } catch (e) {
                console.error(`[KIE-NanoBanana] Failed to parse resultJson:`, e);
              }
            }

            if (imageUrls.length > 0) {
              console.log(`[KIE-NanoBanana] Task completed successfully with ${imageUrls.length} images`);
              return {
                task_status: 2, // SUCCESS
                success: true,
                result: imageUrls,
                data: {
                  images: {
                    "hairstyle": imageUrls
                  }
                }
              };
            } else {
              console.log(`[KIE-NanoBanana] Task marked success but no images found`);
              return {
                task_status: 3, // FAILED
                success: false,
                error: 'Task completed but no image URLs found in result'
              };
            }
          }

          case 'fail': {
            return {
              task_status: 3, // FAILED
              success: false,
              error: result.failMsg || 'Task failed',
              error_code: result.failCode
            };
          }

          case 'waiting':
          case 'queuing':
          case 'generating': {
            return {
              task_status: 1, // PROCESSING
              success: false,
              currentStatus: result.state
            };
          }

          default: {
            console.log(`[KIE-NanoBanana] Unknown state: ${result.state}`);
            return {
              task_status: 1, // PROCESSING (assume still working)
              success: false,
              currentStatus: result.state
            };
          }
        }
      }

      // Fallback for unexpected response format
      return {
        task_status: 'FAILED',
        success: false,
        error: statusData.message || 'Invalid response format from KIE API'
      };
    } catch (error) {
      console.error(`[KIE-NanoBanana] Status error for task ${taskId}:`, error);
      return {
        task_status: 'FAILED',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in status check'
      };
    }
  }
}
