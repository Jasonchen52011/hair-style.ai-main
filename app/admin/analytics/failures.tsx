"use client";

import { useState, useEffect } from "react";

interface FailuresPageProps {
  supabase: any;
}

export default function FailuresPage({ supabase }: FailuresPageProps) {
  const [failedTasks, setFailedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    fetchFailedTasks();
  }, [dateRange]);

  const fetchFailedTasks = async () => {
    try {
      setLoading(true);
      
      // Build date range
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      const { data: tasks } = await supabase
        .from('hairstyle_generation_tasks')
        .select(`
          *,
          profiles (
            email,
            name
          )
        `)
        .eq('status', 'failed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply client-side filtering for email and name
      let filteredTasks = tasks || [];
      if (searchEmail) {
        filteredTasks = filteredTasks.filter((task: any) => 
          task.profiles?.email?.toLowerCase().includes(searchEmail.toLowerCase())
        );
      }
      if (searchName) {
        filteredTasks = filteredTasks.filter((task: any) => 
          task.profiles?.name?.toLowerCase().includes(searchName.toLowerCase())
        );
      }

      setFailedTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching failed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading failed tasks...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Failed Tasks</h2>
          <span className="text-sm text-gray-600">
            Total: {failedTasks.length} failures
          </span>
        </div>
        
        {/* Search and Date Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchFailedTasks}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
              {(searchEmail || searchName) && (
                <button
                  onClick={() => {
                    setSearchEmail("");
                    setSearchName("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Failure Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Style
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits Used
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {failedTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No failed tasks found
                </td>
              </tr>
            ) : (
              failedTasks.map((task: any) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {task.task_id?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {task.failure_reason || 'Unknown error'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.style || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(task.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.user_id ? task.user_id.slice(0, 8) + '...' : 'Guest'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.credits_used || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

function getMostCommonError(tasks: any[]): string {
  const errorCounts: { [key: string]: number } = {};
  
  tasks.forEach(task => {
    const reason = task.failure_reason || 'Unknown error';
    errorCounts[reason] = (errorCounts[reason] || 0) + 1;
  });
  
  const mostCommon = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)[0];
  
  return mostCommon ? mostCommon[0] : 'Unknown error';
}