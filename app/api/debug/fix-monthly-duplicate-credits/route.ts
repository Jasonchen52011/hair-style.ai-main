import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`🔧 Fixing monthly duplicate credits for user ${userId}`);

    // 1. 获取用户的所有credits记录
    const { data: allCredits, error: fetchError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', userId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching credits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    if (!allCredits || allCredits.length === 0) {
      return NextResponse.json({ message: 'No credits found for this user' });
    }

    // 2. 找到问题记录：trans_type='monthly' 且 order_no=null
    const problematicRecords = allCredits.filter(record => 
      record.trans_type === 'monthly' && !record.order_no
    );

    if (problematicRecords.length === 0) {
      return NextResponse.json({ message: 'No problematic records found' });
    }

    // 3. 找到对应的正常记录：trans_type='purchase' 且有order_no
    const normalRecords = allCredits.filter(record => 
      record.trans_type === 'purchase' && record.order_no
    );

    const results = [];
    let totalCreditsToRemove = 0;

    // 4. 处理每个问题记录
    for (const problematicRecord of problematicRecords) {
      console.log(`🔍 Processing problematic record ID: ${problematicRecord.id}`);

      // 检查是否有时间接近且积分数量相同的正常记录
      const timeDiff = 5 * 60 * 1000; // 5分钟
      const problematicTime = new Date(problematicRecord.created_at).getTime();
      
      const matchingNormalRecord = normalRecords.find(normalRecord => {
        const normalTime = new Date(normalRecord.created_at).getTime();
        return Math.abs(normalTime - problematicTime) <= timeDiff &&
               normalRecord.credits === problematicRecord.credits;
      });

      if (matchingNormalRecord) {
        console.log(`✅ Found matching normal record for problematic record ${problematicRecord.id}`);
        
        // 删除异常记录
        const { error: deleteError } = await supabase
          .from('credits')
          .delete()
          .eq('id', problematicRecord.id);

        if (deleteError) {
          console.error(`❌ Error deleting record ${problematicRecord.id}:`, deleteError);
          results.push({
            id: problematicRecord.id,
            action: 'delete',
            success: false,
            error: deleteError.message
          });
        } else {
          console.log(`✅ Successfully deleted problematic record ${problematicRecord.id}`);
          totalCreditsToRemove += problematicRecord.credits;
          results.push({
            id: problematicRecord.id,
            action: 'delete',
            success: true,
            creditsRemoved: problematicRecord.credits
          });
        }
      } else {
        console.log(`⚠️  No matching normal record found for problematic record ${problematicRecord.id}`);
        results.push({
          id: problematicRecord.id,
          action: 'skip',
          success: false,
          reason: 'No matching normal record found'
        });
      }
    }

    // 5. 更新用户的current_credits
    if (totalCreditsToRemove > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_credits')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        return NextResponse.json({ 
          error: 'Failed to fetch user profile',
          results 
        }, { status: 500 });
      }

      const newCurrentCredits = (profile?.current_credits || 0) - totalCreditsToRemove;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_credits: Math.max(0, newCurrentCredits), // 确保不会是负数
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating profile credits:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update profile credits',
          results 
        }, { status: 500 });
      }

      console.log(`✅ Updated profile credits: ${profile?.current_credits} -> ${newCurrentCredits}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly duplicate credits fixed',
      userId,
      totalCreditsRemoved: totalCreditsToRemove,
      recordsProcessed: problematicRecords.length,
      results
    });

  } catch (error) {
    console.error('❌ Error fixing monthly duplicate credits:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET 方法用于检查问题
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    console.log(`🔍 Checking monthly duplicate credits for user ${userId}`);

    // 获取用户的所有credits记录
    const { data: allCredits, error: fetchError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', userId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching credits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    if (!allCredits || allCredits.length === 0) {
      return NextResponse.json({ message: 'No credits found for this user' });
    }

    // 找到问题记录
    const problematicRecords = allCredits.filter(record => 
      record.trans_type === 'monthly' && !record.order_no
    );

    const normalRecords = allCredits.filter(record => 
      record.trans_type === 'purchase' && record.order_no
    );

    const analysis = problematicRecords.map(problematicRecord => {
      const timeDiff = 5 * 60 * 1000; // 5分钟
      const problematicTime = new Date(problematicRecord.created_at).getTime();
      
      const matchingNormalRecord = normalRecords.find(normalRecord => {
        const normalTime = new Date(normalRecord.created_at).getTime();
        return Math.abs(normalTime - problematicTime) <= timeDiff &&
               normalRecord.credits === problematicRecord.credits;
      });

      return {
        problematicRecord: {
          id: problematicRecord.id,
          credits: problematicRecord.credits,
          created_at: problematicRecord.created_at,
          trans_type: problematicRecord.trans_type,
          trans_no: problematicRecord.trans_no,
          order_no: problematicRecord.order_no
        },
        matchingNormalRecord: matchingNormalRecord ? {
          id: matchingNormalRecord.id,
          credits: matchingNormalRecord.credits,
          created_at: matchingNormalRecord.created_at,
          trans_type: matchingNormalRecord.trans_type,
          trans_no: matchingNormalRecord.trans_no,
          order_no: matchingNormalRecord.order_no
        } : null,
        canFix: !!matchingNormalRecord
      };
    });

    const totalDuplicateCredits = problematicRecords.reduce((sum, record) => sum + record.credits, 0);

    return NextResponse.json({
      success: true,
      userId,
      totalCreditsRecords: allCredits.length,
      problematicRecords: problematicRecords.length,
      normalRecords: normalRecords.length,
      totalDuplicateCredits,
      canFixRecords: analysis.filter(a => a.canFix).length,
      analysis
    });

  } catch (error) {
    console.error('❌ Error checking monthly duplicate credits:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 