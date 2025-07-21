import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 环境变量中设置管理员凭据
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// 必须从环境变量获取密码哈希
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// 检查环境变量是否加载
if (!ADMIN_PASSWORD_HASH) {
  console.error('Error: ADMIN_PASSWORD_HASH must be set in environment variables');
}

// 生成密码哈希的辅助函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // 验证用户名和密码
    const passwordHash = hashPassword(password);
    
    if (username !== ADMIN_USERNAME || passwordHash !== ADMIN_PASSWORD_HASH) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 创建会话令牌
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
    
    // 暂时不使用数据库存储会话
    
    // 设置安全的 HTTP-only cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful'
    });
    
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // 登出
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}