import { HairstyleProvider, HairstyleTaskParams, SubmitTaskResponse, TaskStatusResponse, ProviderConfig } from './types';
import { getVolcAuthHeader, buildHairstylePrompt, validatePrompt } from '../volcI2iUtils';

export class JimengProvider implements HairstyleProvider {
  readonly name = 'Jimeng3.0-VolcEngine';
  private accessKey: string;
  private secretKey: string;
  private baseUrl: string;
  private reqKey: string;
  private region: string;
  private service: string;

  constructor(config: ProviderConfig = {}) {
    this.accessKey = config.accessKey || process.env.VOLC_ACCESS_KEY || '';
    this.secretKey = config.secretKey || process.env.VOLC_SECRET_KEY || '';
    this.baseUrl = process.env.VOLC_I2I_API_URL || 'https://visual.volcengineapi.com';
    this.reqKey = process.env.VOLC_I2I_REQ_KEY || 'jimeng_i2i_v30';
    this.region = process.env.VOLC_I2I_REGION || 'cn-north-1';
    this.service = process.env.VOLC_I2I_SERVICE || 'cv';

    if (!this.accessKey || !this.secretKey) {
      throw new Error('Jimeng Provider requires VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables');
    }
  }

  async submitTask(params: HairstyleTaskParams): Promise<SubmitTaskResponse> {
    const { imageUrl, hairStyle, hairColor } = params;
    
    try {
      console.log(`🎯 [Jimeng] Building prompt for hairStyle: "${hairStyle}", hairColor: "${hairColor}"`);
      const prompt = buildHairstylePrompt(hairStyle, hairColor);
      console.log(`📝 [Jimeng] Generated prompt: "${prompt}"`);
      validatePrompt(prompt);

      // Prepare image parameters (使用snake_case格式，即梦API的正确参数名)
      let imageParams: any = {};
      
      if (imageUrl.startsWith('http')) {
        // URL方式 - 使用snake_case格式
        imageParams = { image_urls: [imageUrl] };  // 即梦API需要snake_case格式
        console.log(`[Jimeng] Using URL mode: ${imageUrl}`);
      } else {
        // Handle base64 data - 即梦API需要纯base64数据，不要data URL前缀
        let base64Data: string;
        
        if (imageUrl.startsWith('data:')) {
          // 如果是data URL格式，提取纯base64部分
          const parts = imageUrl.split(',');
          if (parts.length === 2) {
            base64Data = parts[1]; // 只要base64数据，不要data:image/jpeg;base64,前缀
          } else {
            throw new Error('Invalid data URL format');
          }
        } else {
          // 假设已经是纯base64数据
          base64Data = imageUrl;
        }
        
        // 调试：检查base64数据格式
        console.log(`[Jimeng] Base64 data format check:`, {
          originalLength: imageUrl.length,
          processedLength: base64Data.length,
          originalPreview: imageUrl.substring(0, 50) + '...',
          processedPreview: base64Data.substring(0, 50) + '...',
          isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data.substring(0, 100))
        });
        
        // 使用snake_case格式的参数名，发送纯base64数据（不要data URL前缀）
        imageParams = { binary_data_base64: [base64Data] };
      }

      const reqBody = {
        req_key: this.reqKey,
        prompt: prompt,  // 改为 prompt 而不是 text
        seed: -1,        // 添加随机种子
        scale: 0.3,      // 文本影响力 (范围0.3-0.5，平衡prompt控制和原图保留)
        width: 1024,     // 优化尺寸以加快生成速度 (从1328降低到1024)
        height: 1024,    // 优化尺寸以加快生成速度
        ...imageParams
      };

      const path = '/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31';
      const authHeaders = await getVolcAuthHeader('POST', path, reqBody);

      // 添加完整的请求体日志
      console.log(`[Jimeng] Full request body:`, JSON.stringify(reqBody, null, 2));
      console.log(`[Jimeng] Submitting task with params:`, {
        hairStyle: params.hairStyle,
        hairColor: params.hairColor,
        prompt: prompt,
        hasImageUrl: !!params.imageUrl,
        imageUrlPreview: params.imageUrl?.substring(0, 100) + '...',
        reqBodyKeys: Object.keys(reqBody)
      });

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...authHeaders
        },
        body: JSON.stringify(reqBody)
      });

      const responseData = await response.json() as any;
      
      console.log(`[Jimeng] Submit response:`, {
        status: response.status,
        ok: response.ok,
        requestId: responseData.ResponseMetadata?.RequestId || responseData.request_id,
        error: responseData.ResponseMetadata?.Error || responseData.message,
        code: responseData.code,
        result: responseData.Result
      });
      
      // 打印完整响应帮助诊断
      console.log(`[Jimeng] Full response:`, JSON.stringify(responseData, null, 2));

      // Check for API-level errors
      if (responseData.code && responseData.code !== 0 && responseData.code !== 10000) {
        console.log(`[Jimeng] API returned error code ${responseData.code}: ${responseData.message}`);
        return {
          success: false,
          error: responseData.message || 'Image validation failed',
          error_code: responseData.code,
          error_detail: responseData.message
        };
      }

      // 即梦API的TaskId在data.task_id中，不是Result.TaskId
      if (response.ok && responseData.data?.task_id) {
        return {
          success: true,
          taskId: responseData.data.task_id
        };
      }
      
      // Handle case where API returns success but no TaskId
      if (responseData.code === 10000 && !responseData.data?.task_id) {
        console.log(`[Jimeng] API returned success but no TaskId - image failed face detection`);
        return {
          success: false,
          error: 'Unable to detect a clear face in the photo. Please upload a high-quality front-facing portrait photo with good lighting and no obstructions (sunglasses, masks, etc.).',
          error_code: responseData.code,
          error_detail: 'Face detection failed. Requirements: Clear front-facing photo, face should be >20% of image, resolution >400x400px'
        };
      }
      
      return {
        success: false,
        error: responseData.ResponseMetadata?.Error?.Message || responseData.message || 'Jimeng API request failed',
        error_code: responseData.ResponseMetadata?.Error?.Code || responseData.code,
        error_detail: responseData.ResponseMetadata?.Error?.CodeN || responseData.ResponseMetadata?.Error?.Message || responseData.message
      };
    } catch (error) {
      console.error('[Jimeng] Submit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in Jimeng provider'
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const reqBody = {
        req_key: this.reqKey,
        task_id: taskId,
        // Add req_json to request image URLs instead of base64
        req_json: JSON.stringify({
          return_url: true,
          logo_info: {
            add_logo: false,
            position: 0,
            language: 0,
            opacity: 1
          }
        })
      };

      const path = '/?Action=CVSync2AsyncGetResult&Version=2022-08-31';
      const authHeaders = await getVolcAuthHeader('POST', path, reqBody);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...authHeaders
        },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        console.error(`[Jimeng] Status check failed: ${response.status}`);
        return {
          task_status: 'FAILED',
          success: false,
          error_code: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const statusData = await response.json();
      console.log(`[Jimeng] Status for task ${taskId}:`, statusData);
      
      // 即梦API返回格式：{code: 10000, data: {binary_data_base64: [...], status: "..."}}
      if (statusData.code === 10000 && statusData.data) {
        const result = statusData.data;
        
        // Debug: Log the actual data structure
        console.log(`[Jimeng] Result data structure:`, {
          hasStatus: !!result.status,
          status: result.status,
          hasImageUrls: !!result.image_urls,
          imageUrlsLength: result.image_urls?.length,
          hasBinaryData: !!result.binary_data_base64,
          binaryDataLength: result.binary_data_base64?.length,
          firstImageUrl: result.image_urls?.[0],
          binaryDataPreview: result.binary_data_base64?.[0]?.substring(0, 50)
        });
        
        // 根据明确的status字段判断任务状态
        if (result.status === 'success' || result.status === 'done') {
          // 处理不同的响应格式
          let imageData = null;
          
          // 优先使用image_urls（HTTP URLs）
          if (result.image_urls && Array.isArray(result.image_urls) && result.image_urls.length > 0) {
            imageData = result.image_urls;
            console.log(`[Jimeng] Found image URLs:`, imageData);
          }
          // 格式1：直接在binary_data_base64中
          else if (result.binary_data_base64 && Array.isArray(result.binary_data_base64) && result.binary_data_base64.length > 0) {
            imageData = result.binary_data_base64;
            console.log(`[Jimeng] Found image data in binary_data_base64, length:`, imageData.length);
          }
          // 格式2：在resp_data中解析
          else if (result.resp_data) {
            try {
              const respData = typeof result.resp_data === 'string' ? JSON.parse(result.resp_data) : result.resp_data;
              console.log(`[Jimeng] Parsing resp_data:`, respData);
              
              // 检查是否有PreviewImage或其他图片字段
              const imageKeys = Object.keys(respData).filter(key => key.toLowerCase().includes('image') || key.toLowerCase().includes('preview'));
              if (imageKeys.length > 0) {
                const firstImageKey = imageKeys[0];
                const imageUris = respData[firstImageKey];
                
                if (Array.isArray(imageUris) && imageUris.length > 0) {
                  // 如果是URI引用，需要从原始响应中查找binary_data_base64
                  // 检查原始statusData中是否有binary_data_base64
                  if (statusData.data && statusData.data.binary_data_base64 && Array.isArray(statusData.data.binary_data_base64)) {
                    imageData = statusData.data.binary_data_base64;
                  } else {
                    console.log(`[Jimeng] URI references found but no binary_data_base64:`, imageUris);
                  }
                }
              }
            } catch (e) {
              console.error(`[Jimeng] Failed to parse resp_data:`, e);
            }
          }
          
          if (imageData && Array.isArray(imageData) && imageData.length > 0) {
            // 转换为前端期望的格式: { data: { images: { "style": ["base64..."] } } }
            const returnData = {
              task_status: 2, // SUCCESS
              success: true,
              result: imageData, // 保持旧格式兼容
              data: {
                images: {
                  "hairstyle": imageData // 前端期望的格式
                }
              }
            };
            console.log(`[Jimeng] Returning success data:`, {
              hasData: !!returnData.data,
              hasImages: !!returnData.data?.images,
              imageKeys: Object.keys(returnData.data?.images || {}),
              firstImagePreview: returnData.data?.images?.hairstyle?.[0]?.substring(0, 50)
            });
            return returnData;
          } else {
            console.log(`[Jimeng] Task completed but no valid image data found`);
            return {
              task_status: 3, // FAILED
              success: false,
              error: 'Task completed but no image data was generated'
            };
          }
        } else if (result.status === 'failed' || result.status === 'error') {
          return {
            task_status: 3, // FAILED
            success: false,
            error: result.resp_data || 'Task failed'
          };
        } else {
          // in_queue, processing 等状态都视为处理中
          return {
            task_status: 1, // PROCESSING
            success: false,
            currentStatus: result.status // 返回具体状态供调试
          };
        }
      }
      
      // Fallback for different response format
      return {
        task_status: 'FAILED',
        success: false,
        error: 'Invalid response format from Jimeng API'
      };
    } catch (error) {
      console.error(`[Jimeng] Status error for task ${taskId}:`, error);
      return {
        task_status: 'FAILED',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in status check'
      };
    }
  }
}