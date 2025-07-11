'use client';

import { useState } from 'react';
import config from '../../config';

export default function WebhookTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('46ddf6ac-0d70-4502-b362-66aef071499b'); // 真实用户ID

  const testWebhook = async (planId: string, planName: string) => {
    setLoading(true);
    setTestResult(null);

    try {
      const testData = {
        event: 'payment.success',
        data: {
          metadata: {
            user_id: userId
          },
          product_id: planId,
          subscription_id: `test_sub_${Date.now()}`,
          order_id: `test_order_${Date.now()}`,
          checkout_id: `test_checkout_${Date.now()}`,
          status: 'active'
        }
      };

      console.log('🧪 Testing webhook with data:', testData);

      const response = await fetch('/api/creem/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      console.log('📋 Webhook response:', result);
      
      setTestResult({
        status: response.status,
        success: response.ok,
        data: result,
        testData
      });

      // 如果成功，查询数据库验证
      if (response.ok) {
        await checkDatabase();
      }

    } catch (error) {
      console.error('❌ Webhook test error:', error);
      setTestResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    try {
      // 检查用户credits
      const creditsResponse = await fetch(`/api/creem/user-credits?userId=${userId}`);
      const creditsData = await creditsResponse.json();
      
      setTestResult((prev: any) => ({
        ...prev,
        databaseCheck: {
          credits: creditsData,
          creditsSuccess: creditsResponse.ok
        }
      }));

    } catch (error) {
      console.error('❌ Database check error:', error);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Webhook 调试工具</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">测试用户ID:</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="输入测试用户ID"
        />
        <p className="text-sm text-gray-600 mt-1">
          💡 使用数据库中存在的真实用户ID进行测试
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => testWebhook(config.creem.products.oneTime.id, '一次性购买')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors"
        >
          {loading ? '测试中...' : `测试一次性购买 (${config.creem.products.oneTime.credits} credits)`}
        </button>

        <button
          onClick={() => testWebhook(config.creem.products.monthly.id, '月度订阅')}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors"
        >
          {loading ? '测试中...' : `测试月度订阅 (${config.creem.products.monthly.credits} credits)`}
        </button>

        <button
          onClick={() => testWebhook(config.creem.products.yearly.id, '年度订阅')}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors"
        >
          {loading ? '测试中...' : `测试年度订阅 (${config.creem.products.yearly.credits} credits)`}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Webhook 响应:</h3>
            <div className={`p-3 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              状态: {testResult.status} - {testResult.success ? '成功' : '失败'}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">发送的数据:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResult.testData, null, 2)}
            </pre>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">响应数据:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>

          {testResult.databaseCheck && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">数据库验证:</h3>
              <div className={`p-3 rounded mb-2 ${testResult.databaseCheck.creditsSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Credits 查询: {testResult.databaseCheck.creditsSuccess ? '成功' : '失败'}
              </div>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResult.databaseCheck.credits, null, 2)}
              </pre>
            </div>
          )}

          {testResult.error && (
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-red-600">错误信息:</h3>
              <div className="bg-red-100 text-red-800 p-3 rounded">
                {testResult.error}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium mb-2">📋 使用说明:</h3>
        <ul className="text-sm space-y-1">
          <li>1. 使用数据库中真实存在的用户ID进行测试</li>
          <li>2. 点击相应的按钮测试不同的订阅类型</li>
          <li>3. 查看响应结果和数据库验证</li>
          <li>4. 检查Supabase中是否创建了对应的subscription记录</li>
          <li>5. 如果失败，查看浏览器控制台和服务器日志</li>
        </ul>
      </div>
    </div>
  );
} 