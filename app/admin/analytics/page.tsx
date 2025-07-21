"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import FailuresPage from "./failures";
import RealtimePage from "./realtime";

export default function AdminAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [selectedView, setSelectedView] = useState("realtime");
  const supabase = createClientComponentClient();
  const router = useRouter();

  // 检查是否已登录
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/admin/verify');
      if (response.ok) {
        setIsAuthenticated(true);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        fetchDashboardData();
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    router.refresh();
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get overview data
      const { data: overview } = await supabase.rpc('admin_dashboard_summary');
      
      // Get today's statistics
      const { data: todayStats } = await supabase
        .from('user_activity_logs')
        .select('action_name, created_at')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      // Get failed tasks
      const { data: failedTasks } = await supabase
        .from('hairstyle_generation_tasks')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get API performance data
      const { data: apiPerformance } = await supabase
        .from('api_call_logs')
        .select('endpoint, response_status, response_time_ms')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      setDashboardData({
        overview,
        todayStats,
        failedTasks,
        apiPerformance
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  // 登录页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Analytics Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            {error && (
              <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard page
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['failures','realtime'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  selectedView === view
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div>
            {selectedView === 'overview' && <OverviewSection data={dashboardData} />}
            {selectedView === 'failures' && <FailuresPage supabase={supabase} />}
            {selectedView === 'api' && <ApiSection data={dashboardData} />}
            {selectedView === 'realtime' && <RealtimePage supabase={supabase} />}
          </div>
        )}
      </div>
    </div>
  );
}

// Overview Component
function OverviewSection({ data }: any) {
  const stats = calculateStats(data.todayStats || []);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Today's Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Page Views" value={stats.pageViews} color="blue" />
        <StatCard title="Generations Started" value={stats.generationsStarted} color="yellow" />
        <StatCard title="Successful" value={stats.successful} color="green" />
        <StatCard title="Failed" value={stats.failed} color="red" />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
        <div className="text-3xl font-bold text-purple-600">
          {stats.successRate}%
        </div>
      </div>
    </div>
  );
}


// API Performance Component
function ApiSection({ data }: any) {
  const apiStats = calculateApiStats(data.apiPerformance || []);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">API Performance (Last Hour)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Response Time</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{apiStats.avgResponseTime}ms</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{apiStats.errorRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{apiStats.totalRequests}</p>
        </div>
      </div>
    </div>
  );
}


// Stat Card Component
function StatCard({ title, value, color }: { title: string; value: number | string; color: 'blue' | 'yellow' | 'green' | 'red' }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} bg-opacity-10`}>
          <div className={`w-8 h-8 ${colorClasses[color]} rounded`}></div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateStats(todayStats: any[]) {
  const pageViews = todayStats.filter(s => s.action_name === 'ai_hairstyle_page').length;
  const generationsStarted = todayStats.filter(s => s.action_name === 'hairstyle_generation_started').length;
  const successful = todayStats.filter(s => s.action_name === 'hairstyle_generated').length;
  const failed = todayStats.filter(s => s.action_name === 'generation_failed').length;
  const successRate = generationsStarted > 0 ? Math.round((successful / generationsStarted) * 100) : 0;
  
  return { pageViews, generationsStarted, successful, failed, successRate };
}

function calculateApiStats(apiPerformance: any[]) {
  if (apiPerformance.length === 0) {
    return { avgResponseTime: 0, errorRate: 0, totalRequests: 0 };
  }
  
  const totalRequests = apiPerformance.length;
  const errors = apiPerformance.filter(r => r.response_status >= 400).length;
  const errorRate = Math.round((errors / totalRequests) * 100);
  const avgResponseTime = Math.round(
    apiPerformance.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalRequests
  );
  
  return { avgResponseTime, errorRate, totalRequests };
}