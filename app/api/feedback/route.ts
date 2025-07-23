import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the handler
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const body = await request.json();
    const { feedback_type, feedback_detail, comments, email } = body;

    // Validate required fields - only feedback_detail is required
    if (!feedback_detail) {
      return NextResponse.json(
        { error: 'feedback_detail is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    let currentUserEmail = email;
    let userId = null;

    // If user is logged in, get their info
    if (user && !userError) {
      userId = user.id;
      
      // Try to get user's email from profile if not provided
      if (!currentUserEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        
        currentUserEmail = profile?.email || user.email || null;
      }
    }

    console.log('Inserting feedback:', {
      user_id: userId,
      email: currentUserEmail,
      feedback_type: feedback_type || null,
      feedback_detail,
      comments: comments || null,
    });

    // Insert feedback into Supabase using admin client
    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .insert([
        {
          user_id: userId,
          email: currentUserEmail || null,
          feedback_type: feedback_type || null,
          feedback_detail,
          comments: comments || null,
        }
      ])
      .select();

    // 如果用户已登录，更新用户的最后反馈时间到profiles表
    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          last_feedback_shown: new Date().toISOString() 
        })
        .eq('id', userId);
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Feedback submitted successfully', data },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}