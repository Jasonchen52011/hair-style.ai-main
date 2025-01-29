import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 修改上传目录为 public/images
const uploadDir = join(process.cwd(), 'public', 'images');

export async function POST(req: NextRequest) {
    try {
        // 1. 确保上传目录存在
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 2. 获取上传的文件
        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ 
                success: false, 
                error: '没有找到图片文件' 
            }, { status: 400 });
        }

        // 3. 验证文件类型
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return NextResponse.json({ 
                success: false, 
                error: '只支持 JPG、PNG 和 WebP 格式的图片' 
            }, { status: 400 });
        }

        // 4. 验证文件大小 (3MB)
        if (file.size > 3 * 1024 * 1024) {
            return NextResponse.json({ 
                success: false, 
                error: '图片大小不能超过 3MB' 
            }, { status: 400 });
        }

        // 5. 生成唯一文件名
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueId = uuidv4();
        const extension = file.type.split('/')[1];
        const fileName = `${uniqueId}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // 6. 保存文件
        await writeFile(filePath, buffer);

        // 7. 返回文件 URL
        const fileUrl = `/images/${fileName}`;
        
        return NextResponse.json({ 
            success: true, 
            url: fileUrl,
            fileName: fileName,
            fullPath: filePath
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ 
            success: false, 
            error: '上传失败',
            details: (error as Error).message
        }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
