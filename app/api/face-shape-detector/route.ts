import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// [中文注释]：从环境变量中获取 API 密钥。
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// [中文注释]：这是您在用户请求中提供的发型列表。
// [中文注释]：将其包含在 prompt 中，可以引导 AI 推荐您系统中存在的发型。
const femaleStyles = "Bob Cut, Short Pixie, Double Bun, Pixie Cut, Curly Bob, Japanese Short, Spiked, French Bob, Long Wavy, Fishtail Braid, Twin Braids, Dreadlocks, Cornrows, Loose Curly Afro, Box Braids, French Bangs, Buzz Cut";
const maleStyles = "Buzz Cut, Undercut, Pompadour, Slick Back, Curly Shag, Wavy Shag, Faux Hawk, Spiky, Comb Over, High Tight Fade, Man Bun, Afro, Low Fade, Undercut Long Hair, Two Block, Textured Fringe, Blunt Bowl Cut, Long Wavy Curtain, Messy Tousled, Cornrow Braids, Long Hair Tied Up, Tinfoil Perm, Chestnut, Choppy Bangs";


// [中文注释]：将 Buffer 转换为 base64 编码的函数。
async function fileToGenerativePart(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: file.type,
    },
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    // [中文注释]：这是给AI的核心指令（Prompt）。
    // [中文注释]：现在包含了性别检测功能，并要求AI以JSON格式返回。
    const prompt = `
      Analyze the user-uploaded image to determine their face shape and gender. Your response MUST be a valid JSON object and nothing else.
      
      The only possible face shapes you can identify are: Oval, Round, Square, Heart, Diamond, Oblong.
      The only possible genders you can identify are: male, female.
      
      The available female hairstyle simulators are: ${femaleStyles}.
      The available male hairstyle simulators are: ${maleStyles}.
      
      First, detect the person's gender, then recommend hairstyles ONLY from the corresponding gender's hairstyle list.
      
      Based on the detected shape and gender, generate a JSON object with the following structure. Adhere strictly to the word counts.

      {
        "faceShape": "[The detected face shape from the allowed list]",
        "gender": "[The detected gender: 'male' or 'female']",
        "characteristics": "[A brief, bulleted list of the main features of this face shape, based on the provided photo. Example: '- Forehead is wider than the jawline\\n- Pointed chin']",
        "positiveVibes": "[A flattering and positive description of the face shape's aesthetic appeal and what makes it unique. Approximately 100 words.]",
        "recommendations": {
          "cute": {
            "hairstyleName": "[Name of a suitable cute hairstyle from the DETECTED GENDER's hairstyle list. Choose a style that genuinely fits a 'cute' aesthetic.]",
            "reason": "[A detailed explanation of why this hairstyle is suitable for a 'cute' look, focusing on how it complements the detected face shape. Discuss how it balances proportions, softens or enhances features, and creates a youthful or playful vibe. Approximately 120 words.]"
          },
          "gentle": {
            "hairstyleName": "[Name of a suitable gentle hairstyle from the DETECTED GENDER's hairstyle list. Choose a style that evokes a soft, elegant, or romantic feel.]",
            "reason": "[A detailed explanation of why this hairstyle is suitable for a 'gentle' look. Explain how layers, waves, or soft lines interact with the face shape to create a sense of grace and sophistication. Approximately 120 words.]"
          },
          "cool": {
            "hairstyleName": "[Name of a suitable handsome/cool hairstyle from the DETECTED GENDER's hairstyle list. This can be edgy, chic, or bold.]",
            "reason": "[A detailed explanation of why this hairstyle is suitable for a 'cool' or 'handsome' look. Describe how sharp lines, asymmetry, volume, or texture can create a modern, confident, and striking appearance that flatters the face shape. Approximately 120 words.]"
          }
        },
        "unsuitable": {
          "title": "Hairstyles to Reconsider",
          "reason": "[A detailed explanation of which general hairstyle types or features to avoid for this specific face shape and why. For example, explain how certain cuts might overemphasize width, length, or sharp angles in an unflattering way. Provide clear reasons based on facial proportions. Approximately 120 words.]"
        }
      }
      
      IMPORTANT: Make sure to recommend hairstyles ONLY from the correct gender's list. If the detected gender is 'female', use only female hairstyles. If the detected gender is 'male', use only male hairstyles.
    `;

    const imagePart = await fileToGenerativePart(imageFile);
    
    // [中文注释]：使用 gemini-1.5-flash-latest 模型。
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json", // [中文注释]：强制模型输出JSON
      }
    });

    // [中文注释]：重试机制 - 最多尝试3次
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Face shape detection attempt ${attempt}/${maxRetries}`);
        
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // [中文注释]：解析AI返回的JSON字符串。
        const parsedResult = JSON.parse(responseText);

        // [中文注释]：验证返回的结果包含性别信息
        if (!parsedResult.gender || !['male', 'female'].includes(parsedResult.gender)) {
          throw new Error('Invalid gender detection result');
        }

        console.log(`Face shape detection succeeded on attempt ${attempt}`);
        console.log(`Detected gender: ${parsedResult.gender}, Face shape: ${parsedResult.faceShape}`);
        
        return NextResponse.json(parsedResult);
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Face shape detection attempt ${attempt} failed:`, error);
        
        // [中文注释]：如果不是最后一次尝试，等待一段时间后重试
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000; // 递增等待时间：1秒、2秒
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // [中文注释]：所有重试都失败了，抛出最后一个错误
    throw lastError;

  } catch (error) {
    console.error('Error in face shape detector API:', error);
    // [中文注释]：向客户端返回一个通用的错误信息。
    return NextResponse.json(
        { error: 'Failed to process the image. The AI model may be unavailable or an internal error occurred.' },
        { status: 500 }
    );
  }
}