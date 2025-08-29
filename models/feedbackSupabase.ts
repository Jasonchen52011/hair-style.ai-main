import { createClient } from '@supabase/supabase-js';

// 获取 Supabase 客户端的函数
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function insertFeedbackSupabase(feedbackData: any) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('feedbacks')
      .insert([feedbackData])
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting feedback:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error inserting feedback:", error);
    throw error;
  }
}