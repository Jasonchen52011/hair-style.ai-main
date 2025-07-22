"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function TestSystemPage() {
  const [testResults, setTestResults] = useState<any>({
    loading: true,
    auth: null,
    database: null,
    payment: null,
    errors: []
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results: any = {
      loading: false,
      auth: {},
      database: {},
      payment: {},
      errors: []
    };

    try {
      // 1. 测试认证状态
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = {
        isLoggedIn: !!user,
        userId: user?.id,
        email: user?.email,
        provider: user?.app_metadata?.provider
      };

      // 2. 测试数据库连接
      try {
        const dbTestResponse = await fetch('/api/test-db');
        const dbTest = await dbTestResponse.json();
        results.database = dbTest;
      } catch (error: any) {
        results.errors.push(`Database test failed: ${error.message}`);
      }

      // 3. 测试支付流程
      try {
        const paymentTestResponse = await fetch('/api/test-payment-flow');
        const paymentTest = await paymentTestResponse.json();
        results.payment = paymentTest;
      } catch (error: any) {
        results.errors.push(`Payment test failed: ${error.message}`);
      }

      // 4. 测试用户积分余额
      try {
        const creditsResponse = await fetch('/api/user-credits-balance');
        const credits = await creditsResponse.json();
        results.credits = credits;
      } catch (error: any) {
        results.errors.push(`Credits test failed: ${error.message}`);
      }

    } catch (error: any) {
      results.errors.push(`General error: ${error.message}`);
    }

    setTestResults(results);
  };

  const addTestCredits = async () => {
    try {
      const response = await fetch('/api/test-add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: 100 })
      });
      const result = await response.json();
      alert(`Added credits: ${JSON.stringify(result)}`);
      runTests(); // 重新运行测试
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (testResults.loading) {
    return <div className="p-8">Loading tests...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">System Test Page</h1>
      
      {/* 认证状态 */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🔐 Authentication Status</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(testResults.auth, null, 2)}
        </pre>
      </div>

      {/* 数据库连接 */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🗄️ Database Connection</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(testResults.database, null, 2)}
        </pre>
      </div>

      {/* 支付流程测试 */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">💳 Payment Flow Test</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(testResults.payment, null, 2)}
        </pre>
      </div>

      {/* 用户积分 */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">💰 User Credits</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(testResults.credits, null, 2)}
        </pre>
        <button
          onClick={addTestCredits}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add 100 Test Credits
        </button>
      </div>

      {/* 错误信息 */}
      {testResults.errors.length > 0 && (
        <div className="mb-8 p-6 bg-red-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4">❌ Errors</h2>
          <ul className="list-disc list-inside">
            {testResults.errors.map((error: string, index: number) => (
              <li key={index} className="text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={runTests}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
        >
          🔄 Re-run All Tests
        </button>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Go to Pricing Page
        </button>
      </div>
    </div>
  );
}