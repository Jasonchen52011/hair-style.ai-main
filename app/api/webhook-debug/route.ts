import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const debugInfo = {
    env_check: {
      has_stripe_private_key: !!process.env.STRIPE_PRIVATE_KEY,
      has_webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhook_secret_prefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10),
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    headers: {},
    body: null,
    signature_check: null,
    order_check: null,
    supabase_test: null
  };

  try {
    // 获取请求头
    const sig = request.headers.get("stripe-signature");
    debugInfo.headers = {
      stripe_signature: sig ? sig.substring(0, 20) + "..." : null,
      content_type: request.headers.get("content-type"),
    };

    // 获取body
    const body = await request.text();
    debugInfo.body = {
      length: body.length,
      preview: body.substring(0, 100) + "..."
    };

    // 测试Supabase连接
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // 测试查询
      const { data, error } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
        
      debugInfo.supabase_test = {
        success: !error,
        error: error?.message,
        has_access: !!data
      };
    } catch (e) {
      debugInfo.supabase_test = {
        success: false,
        error: e.message
      };
    }

    // 尝试验证webhook签名
    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
        const event = stripe.webhooks.constructEvent(
          body, 
          sig, 
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        debugInfo.signature_check = {
          success: true,
          event_type: event.type,
          event_id: event.id
        };

        // 如果是checkout.session.completed，检查订单
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const orderNo = session.metadata?.order_no;
          
          if (orderNo) {
            const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
            const order = await findOrderByOrderNoSupabase(orderNo);
            
            debugInfo.order_check = {
              order_no: orderNo,
              found: !!order,
              status: order?.status,
              credits: order?.credits,
              user_uuid: order?.user_uuid
            };
          }
        }
      } catch (err) {
        debugInfo.signature_check = {
          success: false,
          error: err.message
        };
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      debugInfo
    }, { status: 500 });
  }
}