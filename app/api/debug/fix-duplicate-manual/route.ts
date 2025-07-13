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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔧 Fixing duplicate credits for user ${userId}`);

    // 查找该用户的所有积分记录
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

    // 找到问题记录：trans_type='monthly' 且 order_no=null
    const problematicRecord = allCredits.find(record => 
      record.trans_type === 'monthly' && !record.order_no
    );

    if (!problematicRecord) {
      return NextResponse.json({ message: 'No problematic record found' });
    }

    // 找到对应的正常记录：trans_type='purchase' 且有order_no
    const normalRecord = allCredits.find(record => 
      record.trans_type === 'purchase' && record.order_no
    );

    if (!normalRecord) {
      return NextResponse.json({ error: 'No corresponding normal record found' }, { status: 400 });
    }

    // 检查积分是否相同
    if (problematicRecord.credits !== normalRecord.credits) {
      return NextResponse.json({ 
        error: 'Credits amount mismatch - manual review required',
        details: {
          problematicRecord: problematicRecord.credits,
          normalRecord: normalRecord.credits
        }
      }, { status: 400 });
    }

    // 删除问题记录
    const { error: deleteError } = await supabase
      .from('credits')
      .delete()
      .eq('id', problematicRecord.id);

    if (deleteError) {
      console.error('❌ Error deleting problematic record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete problematic record' }, { status: 500 });
    }

    // 更新用户的 current_credits（减去重复的积分）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const currentCredits = profile?.current_credits || 0;
    const newCredits = currentCredits - problematicRecord.credits;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_credits: Math.max(0, newCredits),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile credits' }, { status: 500 });
    }

    console.log(`✅ Successfully fixed duplicate credits for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Duplicate credits fixed successfully',
      details: {
        deletedRecord: {
          id: problematicRecord.id,
          trans_type: problematicRecord.trans_type,
          credits: problematicRecord.credits,
          order_no: problematicRecord.order_no
        },
        keptRecord: {
          id: normalRecord.id,
          trans_type: normalRecord.trans_type,
          credits: normalRecord.credits,
          order_no: normalRecord.order_no
        },
        creditsRemoved: problematicRecord.credits,
        oldTotal: currentCredits,
        newTotal: Math.max(0, newCredits)
      }
    });

  } catch (error) {
    console.error('❌ Error fixing duplicate credits:', error);
    return NextResponse.json({
      error: 'Fix failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 