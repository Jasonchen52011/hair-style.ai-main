import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Upload directory set to public/images
const uploadDir = join(process.cwd(), 'public', 'images');

export async function POST(req: NextRequest) {
    try {
        // 1. Ensure upload directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 2. Get uploaded file
        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ 
                success: false, 
                error: 'No image file found' 
            }, { status: 400 });
        }

        // 3. Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Only JPG, PNG and WebP images are supported' 
            }, { status: 400 });
        }

        // 4. Validate file size (3MB)
        if (file.size > 3 * 1024 * 1024) {
            return NextResponse.json({ 
                success: false, 
                error: 'Image size cannot exceed 3MB' 
            }, { status: 400 });
        }

        // 5. Generate unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueId = uuidv4();
        const extension = file.type.split('/')[1];
        const fileName = `${uniqueId}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // 6. Save file
        await writeFile(filePath, buffer);

        // 7. Return file URL
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
            error: 'Upload failed',
            details: (error as Error).message
        }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
