import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const runtime = "edge";

// Google API 密钥
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

if (!GOOGLE_API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("Warning: GOOGLE_API_KEY is not set. The API will not work as expected.");
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// 强制 JSON 格式输出的配置
const generationConfigForJson = {
  temperature: 0.3,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1200,
  responseMimeType: "application/json",
};

// 安全设置
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// 发质类型定义
const HAIR_TYPES = [
  "Type 1A - Straight Fine",
  "Type 1B - Straight Medium", 
  "Type 1C - Straight Coarse",
  "Type 2A - Wavy Fine",
  "Type 2B - Wavy Medium",
  "Type 2C - Wavy Coarse", 
  "Type 3A - Curly Fine",
  "Type 3B - Curly Medium",
  "Type 3C - Curly Coarse",
  "Type 4A - Coily Fine",
  "Type 4B - Coily Medium",
  "Type 4C - Coily Coarse"
];

// 可用的发型选项 - 基于实际图片（58个发型）
const AVAILABLE_HAIRSTYLES = [
  // Female styles (34个)
  "Bob cut", "Bowl cut", "Curly bob", "Neat bob", "Wavy bob", "Stacked curls bob",
  "Pixie cut", "Short pixie", "Short curly pixie", "Buzz cut female",
  "Long straight", "Long wavy", "Long curly", "Long hime cut", "Long twintails", 
  "Medium layered", "Shoulder length", "Japanese short", "French bangs",
  "Ponytail", "Updo", "Chignon", "Double bun", "Short twintails",
  "Twin braids", "Fishtail braid", "Box braids", "Cornrows", "Dreadlocks",
  "Side part fade", "Slicked back", "Spiked", "Loose curly afro", "Black female",
  
  // Male styles (24个)
  "Afro", "Blunt bowl cut", "Buzz cut", "Chestnut", "Choppy bangs",
  "Comb over", "Cornrow braids", "Curly shag", "Faux hawk", "High tight fade",
  "Long hair tied up", "Long wavy curtain", "Low fade", "Man bun", "Messy tousled",
  "Pompadour", "Slick back", "Spiky", "Textured fringe", "Tinfoil perm", 
  "Two block", "Undercut", "Undercut long hair", "Wavy shag"
];

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'No image file provided.',
        success: false 
      }, { status: 400 });
    }

    // 转换图片为 base64
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: imageFile.type,
      },
    };

    // 构建 Prompt
    const prompt = `
      Analyze the hair in this uploaded image and identify the hair type. 
      
      CRITICAL: Your response MUST be ONLY a valid JSON object. No explanations, no markdown, no additional text.
      
      Available hair types: ${HAIR_TYPES.join(', ')}.
      Available hairstyles (MUST only choose from these): ${AVAILABLE_HAIRSTYLES.join(', ')}.
      
      Return exactly this JSON format with 3 results:
      
      {"results":[{"hairType":"Type 2A - Wavy Fine","confidence":85,"characteristics":["Natural wave pattern","Fine hair strands","Low density"],"commonIssues":["Lacks volume","Gets oily quickly","Hard to hold curl"],"suitableStyles":["Long wavy","Bob cut","Pixie cut"],"careAdvice":["Use lightweight shampoo","Avoid heavy conditioners","Use volumizing products"],"productRecommendations":["Volumizing mousse","Light hold gel","Dry shampoo"]},{"hairType":"Type 1B - Straight Medium","confidence":75,"characteristics":["Slight body","Medium thickness","Natural shine"],"commonIssues":["Gets oily","Lacks volume","Hard to curl"],"suitableStyles":["Bob cut","Long straight","Pixie cut"],"careAdvice":["Regular washing","Light conditioner","Volume spray"],"productRecommendations":["Dry shampoo","Texturing spray","Light mousse"]},{"hairType":"Type 2B - Wavy Medium","confidence":65,"characteristics":["Defined waves","Medium density","Some frizz"],"commonIssues":["Frizz issues","Wave definition","Humidity sensitivity"],"suitableStyles":["Long wavy","Bob cut","Medium layered"],"careAdvice":["Scrunching method","Anti-frizz serum","Diffuse drying"],"productRecommendations":["Curl cream","Leave-in spray","Frizz serum"]]}]}
      
      Rules:
      - JSON only, no other text
      - Confidence: 60-95 range
      - Exactly 3 results ordered by confidence
      - All arrays must have exactly 3 items
      - Choose hairstyles ONLY from the available list
      
      Analyze the hair texture, curl pattern, thickness visible in the image.
    `;

    // 调用 Gemini API
    const startTime = Date.now();
    
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-002",
        generationConfig: generationConfigForJson,
        safetySettings: safetySettings,
      });

      const result = await model.generateContent([
        prompt,
        imagePart
      ]);

      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const processingTime = Date.now() - startTime;

      try {
        const parsedResult = JSON.parse(text);
        
        // 验证结果结构
        if (!parsedResult.results || !Array.isArray(parsedResult.results) || parsedResult.results.length !== 3) {
          throw new Error('Invalid response structure');
        }

        // 添加处理时间
        parsedResult.processingTime = processingTime;
        parsedResult.success = true;

        return NextResponse.json(parsedResult);

      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return NextResponse.json({ 
          error: 'Failed to parse analysis results. Please try again.',
          success: false 
        }, { status: 500 });
      }

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      return NextResponse.json({ 
        error: 'AI analysis failed. Please try again.',
        success: false 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Hair type analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed. Please try again with a clear hair photo.',
      success: false 
    }, { status: 500 });
  }
}