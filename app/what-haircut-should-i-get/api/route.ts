// app/what-haircut-should-i-get/api/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { generateContentWithFallback, defaultSafetySettings } from '../../utils/gemini-helper';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("Gemini API key is not set in environment variables.");
}

const generationConfig = {
  temperature: 0.8,
  topK: 1,
  topP: 1,
  maxOutputTokens: 3000,
};

const safetySettings = defaultSafetySettings;

// 定义重试相关常量
const RETRY_DELAY = 1000;
const MAX_RETRIES = 5;

// 发型数据库 - 这里应该从Hair Type Identifier的数据源获取
const HAIRSTYLE_DATABASE = {
  "layered_bob": {
    images: ["/images/hairstyles/female/curly-bob.webp", "/images/hairstyles/female/stacked-curls-bob.webp", "/images/hairstyles/female/pixie-cut.webp"]
  },
  "pixie_cut": {
    images: ["/images/hairstyles/female/pixie-cut.webp", "/images/hairstyles/female/short-twintails.webp", "/images/hairstyles/male/choppy-bangs.webp"]
  },
  "long_layers": {
    images: ["/images/hairstyles/female/updo.webp", "/images/hairstyles/female/ponytail.webp", "/images/hairstyles/male/long-hair-tied-up.webp"]
  },
  "bob_cut": {
    images: ["/images/hairstyles/female/curly-bob.webp", "/images/hairstyles/female/stacked-curls-bob.webp", "/images/hairstyles/female/chignon.webp"]
  },
  "shag_cut": {
    images: ["/images/hairstyles/male/curly-shag.webp", "/images/hairstyles/male/wavy-shag.webp", "/images/hairstyles/male/messy-tousled.webp"]
  },
  "lob_cut": {
    images: ["/images/hairstyles/female/curly-bob.webp", "/images/hairstyles/female/chignon.webp", "/images/hairstyles/female/updo.webp"]
  },
  "bangs_style": {
    images: ["/images/hairstyles/male/choppy-bangs.webp", "/images/hairstyles/female/pixie-cut.webp", "/images/hairstyles/female/short-twintails.webp"]
  },
  "curly_cut": {
    images: ["/images/hairstyles/female/curly-bob.webp", "/images/hairstyles/female/dreadlocks.webp", "/images/hairstyles/male/curly-shag.webp"]
  },
  "textured_crop": {
    images: ["/images/hairstyles/male/high-tight-fade.webp", "/images/hairstyles/male/faux-hawk.webp", "/images/hairstyles/male/blunt-bowl-cut.webp"]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: answers are required' },
        { status: 400 }
      );
    }

    // 构建AI提示词
    const prompt = buildHaircutAnalysisPrompt(answers);

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const result = await generateContentWithFallback(prompt, generationConfig, safetySettings);
        
        // 解析AI响应
        const analysis = parseAIResponse(result);
        
        // 匹配发型图片
        const finalResult = enhanceWithImages(analysis);
        
        return NextResponse.json(finalResult);

      } catch (error: any) {
        console.error(`Attempt ${retries + 1} failed:`, error);
        
        if (retries === MAX_RETRIES - 1) {
          // 最后一次重试失败，返回后备响应
          return NextResponse.json(generateFallbackResponse(answers));
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
      }
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

function buildHaircutAnalysisPrompt(answers: Record<string, string>): string {
  // 将答案转换为更易读的格式
  const formattedAnswers = Object.entries(answers).map(([key, value]) => {
    return `${key}: ${value}`;
  }).join('\n');

  return `
You are a professional hairstylist AI advisor. Based on the following user answers, recommend the perfect haircut:

User Responses:
${formattedAnswers}

Please provide your response in the following JSON format:
{
  "primaryRecommendation": {
    "name": "The [Haircut Name]",
    "description": "Brief description of the haircut",
    "whyItWorks": "Start with a compliment about the user, then provide detailed explanation of why this haircut is perfect for them based on their face shape, hair texture, lifestyle, and preferences. Do not include any references like (q1), (q7), (q8), etc.",
    "maintenance": "How often to trim and general upkeep requirements",
    "styleTip": "Professional styling advice and recommended products",
    "styleKey": "one of: layered_bob, pixie_cut, long_layers, bob_cut, shag_cut, lob_cut, bangs_style, curly_cut, textured_crop",
    "additionalTips": {
      "maintenanceGuide": [
        "Specific maintenance tip 1",
        "Specific maintenance tip 2",
        "Specific maintenance tip 3"
      ],
      "communicationTips": [
        "How to describe this cut to your stylist",
        "What photos to bring to the salon",
        "Key questions to ask your hairstylist"
      ]
    }
  },
  "alternativeOptions": [
    {
      "name": "Alternative haircut name 1",
      "description": "Brief description",
      "maintenance": "Maintenance requirements",
      "styleKey": "style_key_1"
    },
    {
      "name": "Alternative haircut name 2", 
      "description": "Brief description",
      "maintenance": "Maintenance requirements",
      "styleKey": "style_key_2"
    }
  ]
}

Important guidelines:
- Start whyItWorks with a genuine compliment about the user
- Consider face shape as the primary factor for flattering cuts
- Match hair texture with appropriate styling techniques
- Respect their lifestyle and time commitment preferences
- Provide specific, actionable advice
- Use professional but accessible language
- Ensure styleKey matches one of the available options
- Make maintenance recommendations realistic and specific
- Do not include any question references like (q1), (q7), (q8), (q9), (q10), etc. in any part of the response
`;
}

function parseAIResponse(aiResponse: string) {
  try {
    // 尝试从响应中提取JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw error;
  }
}

function enhanceWithImages(analysis: any) {
  // 为主要推荐添加图片
  if (analysis.primaryRecommendation?.styleKey && HAIRSTYLE_DATABASE[analysis.primaryRecommendation.styleKey]) {
    analysis.primaryRecommendation.images = HAIRSTYLE_DATABASE[analysis.primaryRecommendation.styleKey].images;
  }

  // 为替代选项添加图片
  if (analysis.alternativeOptions) {
    analysis.alternativeOptions = analysis.alternativeOptions.map((option: any) => {
      if (option.styleKey && HAIRSTYLE_DATABASE[option.styleKey]) {
        option.images = HAIRSTYLE_DATABASE[option.styleKey].images;
      }
      return option;
    });
  }

  return analysis;
}

function generateFallbackResponse(answers: Record<string, string>) {
  // 基于用户答案的简单逻辑生成后备响应
  const faceShape = answers.q1 || 'oval';
  const hairTexture = answers.q2 || 'straight';
  const lifestyle = answers.q5 || 'minimal';

  let recommendedCut = 'layered_bob';
  let cutName = 'The Layered Bob';
  let description = 'A versatile and flattering cut that works for most face shapes';

  // 简单的匹配逻辑
  if (faceShape === 'round' && lifestyle === 'minimal') {
    recommendedCut = 'lob_cut';
    cutName = 'The Long Bob (Lob)';
    description = 'An elegant, low-maintenance cut that elongates round faces';
  } else if (hairTexture === 'curly') {
    recommendedCut = 'curly_cut';
    cutName = 'The Curly Layers';
    description = 'A cut designed to enhance your natural curl pattern';
  } else if (lifestyle === 'lot') {
    recommendedCut = 'pixie_cut';
    cutName = 'The Pixie Cut';
    description = 'A bold, stylish cut for those who love to experiment';
  }

  const fallbackResponse = {
    primaryRecommendation: {
      name: cutName,
      description: description,
      whyItWorks: `You have excellent taste in considering this versatile style! This cut perfectly complements your ${faceShape} face shape and ${hairTexture} hair texture while fitting your lifestyle preferences.`,
      maintenance: "Trim every 6-8 weeks to maintain the shape",
      styleTip: "Use a lightweight styling product for best results",
      styleKey: recommendedCut,
      images: HAIRSTYLE_DATABASE[recommendedCut]?.images || [],
      additionalTips: {
        maintenanceGuide: [
          "Use a heat protectant when styling",
          "Get regular trims to prevent split ends",
          "Use products suited for your hair type"
        ],
        communicationTips: [
          "Bring reference photos to your stylist",
          "Discuss your daily styling routine",
          "Ask about styling techniques for your hair type"
        ]
      }
    },
    alternativeOptions: [
      {
        name: "The Bob Cut",
        description: "A classic, timeless cut that never goes out of style",
        maintenance: "Trim every 6 weeks",
        styleKey: "bob_cut",
        images: HAIRSTYLE_DATABASE["bob_cut"]?.images || []
      },
      {
        name: "Long Layers", 
        description: "Flowing layers that add movement and dimension",
        maintenance: "Trim every 8-10 weeks",
        styleKey: "long_layers",
        images: HAIRSTYLE_DATABASE["long_layers"]?.images || []
      }
    ]
  };

  return fallbackResponse;
}