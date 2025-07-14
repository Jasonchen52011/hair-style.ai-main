import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    webhook_url: '/api/creem/webhook',
    environment: process.env.NODE_ENV,
    checks: []
  };

  // 检查环境变量
  const envChecks = [
    { name: 'CREEM_API_KEY', value: !!process.env.CREEM_API_KEY },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'NEXT_PUBLIC_SITE_URL', value: !!process.env.NEXT_PUBLIC_SITE_URL }
  ];

  diagnosis.checks.push({
    category: 'Environment Variables',
    results: envChecks
  });

  // 检查Supabase连接
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    diagnosis.checks.push({
      category: 'Supabase Connection',
      results: [
        { name: 'Connection', value: !error },
        { name: 'Error', value: error?.message || 'None' }
      ]
    });
  } catch (error) {
    diagnosis.checks.push({
      category: 'Supabase Connection',
      results: [
        { name: 'Connection', value: false },
        { name: 'Error', value: error.message }
      ]
    });
  }

  // 检查webhook端点
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/creem/webhook`
      : 'http://localhost:3000/api/creem/webhook';

    diagnosis.checks.push({
      category: 'Webhook Configuration',
      results: [
        { name: 'Expected URL', value: webhookUrl },
        { name: 'Local Test URL', value: 'http://localhost:3000/api/creem/webhook' },
        { name: 'Production URL', value: 'https://hair-style.ai/api/creem/webhook' }
      ]
    });
  } catch (error) {
    diagnosis.checks.push({
      category: 'Webhook Configuration',
      results: [
        { name: 'Error', value: error.message }
      ]
    });
  }

  return NextResponse.json(diagnosis);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 模拟webhook处理
    const testResult = {
      received: true,
      timestamp: new Date().toISOString(),
      body: body,
      validation: {
        hasEventType: !!body.eventType,
        hasObject: !!body.object,
        hasUserId: !!(body.object?.customer?.id || body.object?.metadata?.user_id),
        hasProductId: !!body.object?.product?.id
      }
    };

    return NextResponse.json({
      message: 'Test webhook received successfully',
      result: testResult
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Test webhook failed',
      error: error.message
    }, { status: 500 });
  }
} 