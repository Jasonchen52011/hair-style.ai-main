// Node.js 18+ 有内置的 fetch
const API_URL = 'http://localhost:3000/api/user-credits-simple';
const USER_ID = 'd8952a55-6c30-413a-b230-8d9304d880be'; // jasonchen520019@gmail.com 的用户ID

async function testCreditsAPI() {
  console.log('🔍 测试积分 API...\n');
  
  try {
    // 测试 GET 请求
    console.log('1️⃣ 测试 GET 请求:');
    const response = await fetch(`${API_URL}?userId=${USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API 调用成功');
      console.log('响应数据:');
      console.log('- 用户ID:', data.user?.id);
      console.log('- 积分余额:', data.user?.credits);
      console.log('- 有效订阅:', data.user?.hasActiveSubscription);
      console.log('- Profile信息:', data.user?.profile);
      
      if (data.user?.creditHistory && data.user.creditHistory.length > 0) {
        console.log('\n积分历史 (最近5条):');
        data.user.creditHistory.slice(0, 5).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.trans_type}: ${record.credits} 积分 (${record.created_at})`);
        });
      }
    } else {
      console.error('❌ API 调用失败:', response.status);
      console.error('错误信息:', data);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

// 运行测试
testCreditsAPI().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});