import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（使用与monthly-credits-distribution相同的验证）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`🧹 Starting cleanup of expired credits at ${now.toISOString()}`);

    // 查找所有过期的积分记录
    const { data: expiredCredits, error: fetchError } = await supabase
      .from('credits')
      .select('id, user_uuid, trans_type, credits, expired_at')
      .not('expired_at', 'is', null)
      .lt('expired_at', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expired credits:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch expired credits',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!expiredCredits || expiredCredits.length === 0) {
      console.log('ℹ️  No expired credits found');
      return NextResponse.json({ 
        message: 'No expired credits found',
        cleaned: 0
      });
    }

    console.log(`📊 Found ${expiredCredits.length} expired credit records`);

    // 分组统计
    const stats = expiredCredits.reduce((acc, credit) => {
      const type = credit.trans_type || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, totalCredits: 0, userIds: new Set() };
      }
      acc[type].count++;
      acc[type].totalCredits += credit.credits || 0;
      acc[type].userIds.add(credit.user_uuid);
      return acc;
    }, {} as Record<string, { count: number; totalCredits: number; userIds: Set<string> }>);

    // 删除过期的积分记录
    const { error: deleteError } = await supabase
      .from('credits')
      .delete()
      .not('expired_at', 'is', null)
      .lt('expired_at', now.toISOString());

    if (deleteError) {
      console.error('❌ Error deleting expired credits:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete expired credits',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log(`✅ Successfully cleaned up ${expiredCredits.length} expired credit records`);

    // 转换统计数据（将Set转换为数组）
    const formattedStats = Object.entries(stats).reduce((acc, [type, data]) => {
      acc[type] = {
        count: data.count,
        totalCredits: data.totalCredits,
        affectedUsers: data.userIds.size
      };
      return acc;
    }, {} as Record<string, { count: number; totalCredits: number; affectedUsers: number }>);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      timestamp: now.toISOString(),
      totalCleaned: expiredCredits.length,
      stats: formattedStats
    });

  } catch (error) {
    console.error('❌ Error in cleanup-expired-credits:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 