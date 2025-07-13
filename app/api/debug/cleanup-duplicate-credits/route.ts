import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting duplicate credits cleanup...');

    // 验证请求来源
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, dry_run = false } = await request.json();

    let query = supabase
      .from('credits')
      .select('*')
      .eq('trans_type', 'purchase')
      .not('order_no', 'is', null)
      .order('created_at', { ascending: true });

    if (user_id) {
      query = query.eq('user_uuid', user_id);
    }

    const { data: allCredits, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Error fetching credits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    if (!allCredits || allCredits.length === 0) {
      return NextResponse.json({ 
        message: 'No credits found',
        duplicatesFound: 0,
        duplicatesRemoved: 0 
      });
    }

    console.log(`📊 Found ${allCredits.length} credit records`);

    // 🔍 查找重复积分的逻辑
    let duplicateGroups = [];
    
    // 按用户分组，查找重复积分
    const userGroups: Record<string, any[]> = {};
    for (const credit of allCredits) {
      const key = credit.user_uuid;
      if (!userGroups[key]) {
        userGroups[key] = [];
      }
      userGroups[key].push(credit);
    }

    // 检查每个用户的重复积分
    for (const [userId, userCredits] of Object.entries(userGroups)) {
      const credits = userCredits;
      
      // 🔍 查找同一时间段内的重复积分（5分钟内）
      for (let i = 0; i < credits.length; i++) {
        for (let j = i + 1; j < credits.length; j++) {
          const credit1 = credits[i];
          const credit2 = credits[j];
          
          // 检查是否是重复积分
          const timeDiff = Math.abs(new Date(credit1.created_at).getTime() - new Date(credit2.created_at).getTime());
          const isWithin5Minutes = timeDiff < 5 * 60 * 1000; // 5分钟内
          const sameCredits = credit1.credits === credit2.credits;
          
          // 🚨 特殊情况：前端重复调用导致的重复积分
          const isFrontendDuplicate = (
            credit1.trans_type === 'purchase' && 
            credit2.trans_type === 'purchase' && 
            credit1.order_no && 
            credit2.order_no && 
            credit1.order_no === credit2.order_no
          );
          
          // 🚨 特殊情况：首次购买 + 定时任务重复积分
          const isFirstPurchaseDuplicate = (
            ((credit1.trans_type === 'purchase' && credit2.trans_type === 'monthly') ||
             (credit1.trans_type === 'monthly' && credit2.trans_type === 'purchase')) &&
            sameCredits && 
            isWithin5Minutes
          );
          
          if (isFrontendDuplicate || isFirstPurchaseDuplicate || (sameCredits && isWithin5Minutes)) {
            const duplicate = {
              user_id: userId,
              credits: credit1.credits,
              credit1: credit1,
              credit2: credit2,
              type: isFrontendDuplicate ? 'frontend_duplicate' : 
                    isFirstPurchaseDuplicate ? 'first_purchase_duplicate' : 'time_based_duplicate',
              timeDiff: Math.round(timeDiff / 1000), // 秒
              shouldKeep: credit1.id < credit2.id ? credit1 : credit2, // 保留较早的记录
              shouldRemove: credit1.id < credit2.id ? credit2 : credit1 // 删除较晚的记录
            };
            
            duplicateGroups.push(duplicate);
          }
        }
      }
    }

    // 找出有重复的组
    const duplicateGroupsArray = duplicateGroups.filter(group => group.credit1 && group.credit2);

    if (duplicateGroupsArray.length === 0) {
      console.log('✅ No duplicate credits found');
      return NextResponse.json({
        success: true,
        message: 'No duplicate credits found',
        duplicatesFound: 0,
        duplicateGroups: []
      });
    }

    console.log(`🔍 Found ${duplicateGroupsArray.length} duplicate credit groups`);

    // 如果是试运行，只返回结果不删除
    if (dry_run) {
      const duplicateInfo = duplicateGroupsArray.map((group: any) => ({
        user_id: group.user_id,
        credits: group.credits,
        type: group.type,
        timeDiff: `${group.timeDiff}s`,
        keepRecord: {
          id: group.shouldKeep.id,
          trans_type: group.shouldKeep.trans_type,
          order_no: group.shouldKeep.order_no,
          created_at: group.shouldKeep.created_at
        },
        removeRecord: {
          id: group.shouldRemove.id,
          trans_type: group.shouldRemove.trans_type,
          order_no: group.shouldRemove.order_no,
          created_at: group.shouldRemove.created_at
        }
      }));

      return NextResponse.json({
        success: true,
        message: 'Dry run completed - showing duplicate credits that would be removed',
        duplicatesFound: duplicateGroupsArray.length,
        totalCreditsWouldBeRemoved: duplicateGroupsArray.reduce((sum: number, group: any) => sum + group.credits, 0),
        duplicateGroups: duplicateInfo
      });
    }

    // 实际清理重复积分
    let totalRemoved = 0;
    const cleanupResults = [];

    // 处理每个重复组
    for (const group of duplicateGroupsArray) {
      const recordsToDelete = [group.shouldRemove.id];
      
      console.log(`🔧 Processing duplicate: ${group.type} for user ${group.user_id}`);

      if (recordsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('credits')
          .delete()
          .in('id', recordsToDelete);

        if (deleteError) {
          console.error(`❌ Error deleting duplicates for ${group.user_id}:`, deleteError);
          cleanupResults.push({
            user_id: group.user_id,
            success: false,
            error: deleteError.message,
            creditsRemoved: 0
          });
        } else {
          totalRemoved += recordsToDelete.length;
          console.log(`✅ Removed ${recordsToDelete.length} duplicate credits for ${group.user_id}`);
          cleanupResults.push({
            user_id: group.user_id,
            success: true,
            creditsRemoved: group.credits,
            removedRecordId: group.shouldRemove.id,
            keptRecordId: group.shouldKeep.id
          });
        }
      }
    }

    const message = dry_run 
      ? `DRY RUN: Found ${totalRemoved} duplicate credits that would be removed`
      : `Cleanup completed: Removed ${totalRemoved} duplicate credits`;

    console.log(`✅ ${message}`);

    return NextResponse.json({
      success: true,
      message,
      duplicatesFound: totalRemoved,
      duplicatesRemoved: totalRemoved,
      groupsProcessed: duplicateGroupsArray.length,
      results: cleanupResults,
      dryRun: dry_run
    });

  } catch (error) {
    console.error('❌ Cleanup duplicate credits failed:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET方法用于查看重复积分情况
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    let query = supabase
      .from('credits')
      .select('*')
      .eq('trans_type', 'purchase')
      .not('order_no', 'is', null)
      .order('created_at', { ascending: true });

    if (user_id) {
      query = query.eq('user_uuid', user_id);
    }

    const { data: credits, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Error fetching credits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    if (!credits || credits.length === 0) {
      return NextResponse.json({ 
        message: 'No credits found',
        duplicateGroups: []
      });
    }

    // 按 user_uuid + order_no 分组找出重复记录
    const duplicateGroups = new Map<string, typeof credits>();
    
    for (const credit of credits) {
      const key = `${credit.user_uuid}_${credit.order_no}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(credit);
    }

    // 找出有重复的组
    const duplicateGroupsArray = Array.from(duplicateGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => {
        const [user_uuid, order_no] = key.split('_');
        return {
          key,
          user_uuid,
          order_no,
          duplicateCount: group.length,
          totalCredits: group.reduce((sum, r) => sum + (r.credits || 0), 0),
          records: group.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        };
      });

    const totalDuplicates = duplicateGroupsArray.reduce((sum, group) => sum + group.duplicateCount - 1, 0);
    const totalExcessCredits = duplicateGroupsArray.reduce((sum, group) => {
      const [, ...duplicates] = group.records;
      return sum + duplicates.reduce((s, r) => s + (r.credits || 0), 0);
    }, 0);

    return NextResponse.json({
      success: true,
      totalCredits: credits.length,
      duplicateGroups: duplicateGroupsArray,
      totalDuplicates,
      totalExcessCredits,
      summary: {
        message: `Found ${duplicateGroupsArray.length} duplicate groups with ${totalDuplicates} excess credits (${totalExcessCredits} total excess credits)`
      }
    });

  } catch (error) {
    console.error('❌ Error checking duplicate credits:', error);
    return NextResponse.json({
      error: 'Check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 