"use client";

import { useState, useEffect } from "react";

interface RealtimePageProps {
  supabase: any;
}

export default function RealtimePage({ supabase }: RealtimePageProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchRealtimeData();
  }, []);

  const fetchRealtimeData = async () => {
    try {
      setLoading(true);
      setCurrentPage(1); // Reset to first page when searching
      
      // Build date range
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      let query = supabase
        .from('user_activity_logs')
        .select(`
          *,
          profiles!user_id (
            email,
            name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      const { data } = await query;
      
      // If there are search conditions, filter on the client side
      let filteredData = data || [];
      if (searchEmail) {
        filteredData = filteredData.filter((activity: any) => 
          activity.profiles?.email?.toLowerCase().includes(searchEmail.toLowerCase())
        );
      }
      if (searchName) {
        filteredData = filteredData.filter((activity: any) => 
          activity.profiles?.name?.toLowerCase().includes(searchName.toLowerCase())
        );
      }
      
      setActivities(filteredData);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (activity: any) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  // Pagination calculations
  const totalPages = Math.ceil(activities.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedActivities = activities.slice(startIndex, endIndex);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">User Activity Data</h2>
          <span className="text-sm text-gray-600">
            {activities.length > 0 ? `Total: ${activities.length} records` : 'Click search to load data'}
          </span>
        </div>
        
        {/* Search Bar */}
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
                onClick={fetchRealtimeData}
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
                  className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No data
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((activity: any) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFullDate(activity.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {activity.metadata?.task_id ? activity.metadata.task_id.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.action_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.profiles?.email || 'Guest User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.profiles?.name || 'Not Set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.device_type || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleViewDetails(activity)}
                        className="text-purple-600 hover:text-purple-800 underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {activities.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="mr-2 text-sm text-gray-700">
                    Rows per page:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {startIndex + 1}-{Math.min(endIndex, activities.length)} of {activities.length}
                  </span>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Activity Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.user_id || 'Guest'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.profiles?.email || 'Guest User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.profiles?.name || 'Not Set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.session_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.action_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.action_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Page URL</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedActivity.page_url || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="mt-1 text-sm text-gray-900">{formatFullDate(selectedActivity.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.device_type || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Browser</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.browser || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedActivity.ip_address || 'Unknown'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="mt-1 text-sm text-gray-900 break-all">{selectedActivity.user_agent || 'None'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedActivity.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}