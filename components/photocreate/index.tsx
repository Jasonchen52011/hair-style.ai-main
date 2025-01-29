import { useState, Dispatch, SetStateAction, ReactNode } from 'react';

interface PhotoUploadProps {
  onUploadSuccess: Dispatch<SetStateAction<string | undefined>>;
  buttonClassName?: string;
  children?: ReactNode;
}

export default function PhotoInput() {
  const [processedImage, setProcessedImage] = useState<string>('');

  async function handleUpload() {
    try {
      // 1. 先上传图片
      const uploadResponse = await fetch('/api/hairextraction', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: '图片地址' })
      });
      const uploadResult = await uploadResponse.json();
      
      if (uploadResult.task_id) {
        // 2. 等待几秒后查询结果
        const resultResponse = await fetch(`/api/hairextraction?taskId=${uploadResult.task_id}`);
        const result = await resultResponse.json();
        
        // 3. 处理返回的结果
        if (result.status === 'success') {
          // 显示处理后的图片
          setProcessedImage(result.image);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div>
      {processedImage && <img src={processedImage} alt="Processed" />}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
