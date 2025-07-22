// 测试auth callback是否工作

async function testCallback() {
  try {
    console.log('Testing auth callback endpoint...\n');
    
    // 测试callback路由是否可访问
    const response = await fetch('http://localhost:3000/api/auth/callback', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // 如果是重定向，显示目标URL
    if (response.status === 307 || response.status === 302) {
      console.log('Redirect to:', response.headers.get('location'));
    }
    
    // 检查Supabase配置
    console.log('\n=== Environment Check ===');
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCallback();