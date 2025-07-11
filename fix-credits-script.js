// 年费积分修复脚本
// 使用方法：将您的用户ID替换下面的 YOUR_USER_ID，然后在浏览器控制台中运行

async function fixYearlyCredits(userId) {
    try {
        console.log('🔧 开始修复年费积分...');
        
        // 首先诊断问题
        const diagnosisResponse = await fetch('/api/debug/user-credits-diagnosis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId })
        });
        
        const diagnosisData = await diagnosisResponse.json();
        console.log('📊 诊断结果:', diagnosisData);
        
        if (diagnosisData.recommendations && diagnosisData.recommendations.length > 0) {
            console.log('⚠️ 发现问题:', diagnosisData.recommendations);
            
            // 修复缺失的年费积分
            const fixResponse = await fetch('/api/creem/fix-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: 1000,
                    transType: 'purchase',
                    reason: '年费订阅初始积分补偿'
                })
            });
            
            const fixData = await fixResponse.json();
            
            if (fixResponse.ok) {
                console.log('✅ 积分修复成功!');
                console.log('修复详情:', fixData.data);
                console.log(`积分已从 ${fixData.data.previousCredits} 增加到 ${fixData.data.newTotal}`);
                
                // 建议刷新页面
                console.log('🔄 请刷新页面查看最新积分');
                return fixData;
            } else {
                console.error('❌ 修复失败:', fixData.error);
                return null;
            }
        } else {
            console.log('✅ 未发现积分问题');
            return diagnosisData;
        }
        
    } catch (error) {
        console.error('❌ 操作失败:', error);
        return null;
    }
}

// 使用示例：将下面的用户ID替换为您的实际用户ID
// fixYearlyCredits('YOUR_USER_ID');

console.log(`
🔧 年费积分修复脚本已加载

使用方法：
1. 替换下面的 YOUR_USER_ID 为您的实际用户ID
2. 在控制台中运行：fixYearlyCredits('YOUR_USER_ID')

或者访问可视化工具：
http://localhost:3000/debug/fix-yearly-credits.html
`); 