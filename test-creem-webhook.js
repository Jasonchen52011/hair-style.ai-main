// Test script for Creem webhook
const testWebhook = async () => {
  const webhookUrl = 'http://localhost:3000/api/creem/webhook';
  
  // 模拟从截图中看到的实际 Creem webhook 数据
  const testData = {
    eventType: 'checkout.completed',
    data: {
      customer: {
        id: 'test-user-123'
      },
      product: {
        id: 'prod_7kbzeBzBsEnWbRA0iTh7wf' // One time purchase product ID
      },
      subscription: {
        id: 'sub_test_123'
      },
      order: {
        id: 'order_test_123'
      },
      checkout: {
        id: 'checkout_test_123'
      }
    }
  };

  try {
    console.log('🧪 Testing webhook with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed:', result.error || result.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// 测试不同的事件类型
const testMultipleEvents = async () => {
  const events = [
    'checkout.completed',
    'subscription.paid', 
    'subscription.active'
  ];
  
  for (const eventType of events) {
    console.log(`\n🧪 Testing event type: ${eventType}`);
    
    const testData = {
      eventType: eventType,
      data: {
        customer: {
          id: `test-user-${eventType.replace('.', '-')}`
        },
        product: {
          id: 'prod_7kbzeBzBsEnWbRA0iTh7wf'
        },
        subscription: {
          id: `sub_${eventType.replace('.', '-')}_123`
        },
        order: {
          id: `order_${eventType.replace('.', '-')}_123`
        },
        checkout: {
          id: `checkout_${eventType.replace('.', '-')}_123`
        }
      }
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/creem/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      console.log(`📊 ${eventType} - Status: ${response.status}`);
      console.log(`📊 ${eventType} - Result:`, result.success ? '✅ Success' : '❌ Failed');
      
      if (!response.ok) {
        console.log(`❌ ${eventType} - Error:`, result.error || result.message);
      }
      
    } catch (error) {
      console.error(`❌ ${eventType} - Test error:`, error.message);
    }
    
    // 等待一秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// 运行测试
if (require.main === module) {
  console.log('🚀 Starting Creem webhook tests...');
  testMultipleEvents().then(() => {
    console.log('\n🏁 All tests completed');
  });
}

module.exports = { testWebhook, testMultipleEvents }; 