"use client"

import { Dispatch, SetStateAction, ReactNode } from 'react';

interface PhotoUploadProps {
    onUploadSuccess: Dispatch<SetStateAction<string | undefined>>;
    buttonClassName?: string;
    buttonContent: ReactNode;
}

export default function PhotoUpload({ 
    onUploadSuccess, 
    buttonClassName = '', 
    buttonContent
}: PhotoUploadProps) {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                // 这里添加你的文件上传逻辑
                // const response = await fetch('/api/upload', {
                //   method: 'POST',
                //   body: formData
                // });
                // const data = await response.json();
                
                // 临时使用本地 URL 进行测试
                const localUrl = URL.createObjectURL(file);
                onUploadSuccess(localUrl);
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };

    return (
        <div>
            <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="photo-upload"
            />
            <label htmlFor="photo-upload" className={buttonClassName}>
                {buttonContent}
            </label>
        </div>
    );
}
