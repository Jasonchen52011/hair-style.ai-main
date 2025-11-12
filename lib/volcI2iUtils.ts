// 使用Web Crypto API替代Node.js crypto模块，兼容Edge Runtime

/**
 * Web Crypto API 辅助函数 - SHA256 哈希
 */
async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Web Crypto API 辅助函数 - HMAC-SHA256
 */
async function hmacSha256(key: string | Uint8Array, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  
  // 导入密钥
  const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // 生成HMAC
  const dataBuffer = encoder.encode(data);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

/**
 * Web Crypto API 辅助函数 - HMAC-SHA256 返回十六进制字符串
 */
async function hmacSha256Hex(key: string | Uint8Array, data: string): Promise<string> {
  const signature = await hmacSha256(key, data);
  return Array.from(signature)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 生成火山引擎 API 签名请求头 - 使用Web Crypto API实现
 * @param method 请求方法（POST/GET）
 * @param path 请求路径（如 /?Action=xxx&Version=xxx）
 * @param body 请求体（仅POST需要）
 * @returns 签名后的 Header
 */
export async function getVolcAuthHeader(
  method: 'POST' | 'GET',
  path: string,
  body?: Record<string, any>
) {
  const accessKey = process.env.VOLC_ACCESS_KEY!;
  let secretKey = process.env.VOLC_SECRET_KEY!;
  const region = process.env.VOLC_I2I_REGION!;
  const service = process.env.VOLC_I2I_SERVICE!;

  if (!accessKey || !secretKey) {
    throw new Error('Please configure VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables');
  }

  // Use secret key directly (base64 encoded) - this is the correct method!
  console.log('🔑 Using base64 secret key directly for signature');

  // 生成时间戳（使用官方格式：YYYYMMDDTHHMMSSZ）
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 构建完整URL并解析
  const fullUrl = `${process.env.VOLC_I2I_API_URL}${path}`;
  const urlObj = new URL(fullUrl);
  
  // 构建规范请求
  const canonicalUri = urlObj.pathname;
  const canonicalQueryString = urlObj.searchParams.toString();
  const hashedPayload = await sha256Hash(body ? JSON.stringify(body) : '');
  
  // Headers must be sorted alphabetically (content-type, host, x-content-sha256, x-date)
  const canonicalHeaders = [
    `content-type:application/json`,
    `host:${urlObj.hostname}`,
    `x-content-sha256:${hashedPayload}`,
    `x-date:${timestamp}`
  ].join('\n') + '\n';
  
  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n');
  
  // 构建签名字符串
  const credentialScope = `${date}/${region}/${service}/request`;
  const hashedCanonicalRequest = await sha256Hash(canonicalRequest);
  
  const stringToSign = [
    'HMAC-SHA256',
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  // 计算签名密钥 - 不使用前缀（基于GitHub jimmeng-mcp项目）
  const kDate = await hmacSha256(secretKey, date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const signingKey = await hmacSha256(kService, 'request');
  
  // 计算最终签名
  const signature = await hmacSha256Hex(signingKey, stringToSign);
  
  // 构建Authorization头
  const authorization = `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    'Authorization': authorization,
    'X-Date': timestamp,
    'X-Content-Sha256': hashedPayload,  // Add this header
    'Host': urlObj.hostname,
    'Content-Type': 'application/json'
  };
}

/**
 * 校验输入图片参数（URL/Base64）
 * @param imageParams 图片参数（imageUrls/binaryDataBase64）
 * @returns 校验结果
 */
export function validateImageParams(imageParams: {
  imageUrls?: string[];
  binaryDataBase64?: string[];
}) {
  const { imageUrls, binaryDataBase64 } = imageParams;
  
  // 二选一校验
  if (!imageUrls && !binaryDataBase64) {
    throw new Error('Must provide either imageUrls or binaryDataBase64');
  }
  
  // URL 格式校验
  if (imageUrls) {
    if (imageUrls.length !== 1) throw new Error('imageUrls only supports 1 image');
    const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png)$/i;
    if (!urlRegex.test(imageUrls[0])) {
      throw new Error('imageUrls must be JPEG/PNG format HTTP/HTTPS links');
    }
  }
  
  // Base64 格式校验
  if (binaryDataBase64) {
    if (binaryDataBase64.length !== 1) throw new Error('binaryDataBase64 only supports 1 image');
    const base64Regex = /^data:image\/(jpeg|png);base64,/i;
    if (!base64Regex.test(binaryDataBase64[0])) {
      throw new Error('binaryDataBase64 must be JPEG/PNG format Base64 encoding with data:image prefix');
    }
  }
}

/**
 * 校验 Prompt 参数
 * @param prompt 编辑指令
 * @returns 校验结果
 */
export function validatePrompt(prompt: string) {
  if (!prompt) throw new Error('prompt cannot be empty');
  if (prompt.length > 800) throw new Error('prompt length cannot exceed 800 characters');
  return true;
}

/**
 * 构建发型更换的prompt - 优化版本，基于58种发型的专门模板
 * @param hairStyle 发型类型
 * @param hairColor 发色
 * @returns 构建好的英文prompt
 */
export function buildHairstylePrompt(hairStyle: string, hairColor: string): string {
  // 发色英文描述映射 - 完全匹配hairColors数组中的id
  const haircolorDescriptions: Record<string, string> = {
    'random': 'vibrant multi-colored',
    'black': 'black',
    'white': 'white',
    'pink': 'pink',
    'purple': 'purple',
    'lightPurple': 'light purple',
    'burgundy': 'burgundy',
    'red': 'red',
    'brown': 'brown',
    'lightBrown': 'light brown',
    'blonde': 'blonde',
    'platinumBlonde': 'platinum blonde',
    'orange': 'orange',
    'green': 'green',
    'darkGreen': 'dark green',
    'blue': 'blue',
    'lightBlue': 'light blue',
    'darkBlue': 'dark blue',
    'grey': 'grey',
    'silver': 'silver',
    'gray': 'gray',
    'auburn': 'auburn',
    'rainbow': 'rainbow colored',
    'copper': 'copper',
    'honey': 'honey blonde',
    'caramel': 'caramel',
    'ash': 'ash'
  };

  const colorDescription = haircolorDescriptions[hairColor] || hairColor || 'natural';

  // 使用优化的发型模板系统
  const prompt = buildOptimizedHairstylePrompt(hairStyle, colorDescription);
  
  console.log(`[Prompt] Style: ${hairStyle}, Color: ${hairColor} -> ${colorDescription}`);
  console.log(`[Prompt] Generated: ${prompt}`);
  return prompt;
}

/**
 * 优化的发型prompt构建函数 - 专门为58种发型设计，加入"其他都不变"指令
 */
function buildOptimizedHairstylePrompt(hairStyle: string, color: string): string {
  // 58种发型的专门prompt模板映射
  const hairstylePrompts: Record<string, string> = {
    // 女性发型 (33种)
    'BobCut': 'bob cut hairstyle',
    'ShortPixieWithShavedSides': 'short pixie cut with shaved sides',
    'DoubleBun': 'double bun hairstyle',
    'Updo': 'elegant updo hairstyle',
    'PixieCut': 'pixie cut hairstyle',
    'LongCurly': 'long curly hairstyle',
    'CurlyBob': 'curly bob hairstyle',
    'JapaneseShort': 'japanese short hairstyle',
    'Spiked': 'spiky hairstyle',
    'bowlCut': 'bowl cut hairstyle',
    'Chignon': 'chignon updo hairstyle',
    'SlickedBack': 'slicked back hairstyle',
    'StackedCurlsInShortBob': 'stacked curls short bob',
    'SidePartCombOverHairstyleWithHighFade': 'side part comb over with high fade',
    'WavyFrenchBobVibesfrom1920': 'wavy french bob hairstyle',
    'ShortTwintails': 'short twintails hairstyle',
    'ShortCurlyPixie': 'short curly pixie cut',
    'LongStraight': 'long straight hairstyle',
    'LongWavy': 'long wavy hairstyle',
    'FishtailBraid': 'fishtail braid hairstyle',
    'TwinBraids': 'twin braids hairstyle',
    'Ponytail': 'ponytail hairstyle',
    'Dreadlocks': 'dreadlocks hairstyle',
    'Cornrows': 'cornrows hairstyle',
    'ShoulderLengthHair': 'shoulder length hairstyle',
    'LooseCurlyAfro': 'loose curly afro hairstyle',
    'LongTwintails': 'long twintails hairstyle',
    'LongHimeCut': 'long hime cut hairstyle',
    'BoxBraids': 'box braids hairstyle',
    'FrenchBangs': 'french bangs hairstyle',
    'MediumLongLayered': 'medium long layered hairstyle',
    'BuzzCut': 'buzz cut hairstyle',

    // 男性发型 (25种)
    'UnderCut': 'undercut hairstyle',
    'Pompadour': 'pompadour hairstyle',
    'SlickBack': 'slick back hairstyle',
    'CurlyShag': 'curly shag hairstyle',
    'WavyShag': 'wavy shag hairstyle',
    'FauxHawk': 'faux hawk hairstyle',
    'Spiky': 'spiky hairstyle',
    'CombOver': 'comb over hairstyle',
    'HighTightFade': 'high tight fade hairstyle',
    'ManBun': 'man bun hairstyle',
    'Afro': 'afro hairstyle',
    'LowFade': 'low fade hairstyle',
    'UndercutLongHair': 'undercut with long hair',
    'TwoBlockHaircut': 'two block hairstyle',
    'TexturedFringe': 'textured fringe hairstyle',
    'BluntBowlCut': 'blunt bowl cut hairstyle',
    'LongWavyCurtainBangs': 'long wavy curtain',
    'MessyTousled': 'messy tousled hairstyle',
    'CornrowBraids': 'cornrow braids hairstyle',
    'LongHairTiedUp': 'long hair tied up hairstyle',
    'TinfoilPerm': 'tinfoil perm hairstyle',
    'Chestnut': 'chestnut hairstyle',
    'ChoppyBangs': 'choppy bangs hairstyle'
  };

  // 获取发型描述，如果没有找到则使用原始名称
  const styleDescription = hairstylePrompts[hairStyle] || hairStyle.toLowerCase();
  
  // 构建简洁精准的prompt（<=120字符，单指令）
  const prompt = `Change hair to ${styleDescription} with ${color} color, keep face and background same`;
  
  console.log(`[Optimized Prompt] Style: ${hairStyle} -> ${styleDescription}, Color: ${color}`);
  console.log(`[Optimized Prompt] Generated: ${prompt}`);
  
  return prompt;
}

