import React, { useState } from 'react';
import { FiUsers, FiBookOpen, FiMessageSquare, FiActivity, FiDatabase, FiCpu } from 'react-icons/fi';

const ClientDashboard = () => {
  const [period, setPeriod] = useState('week');
  
  // Static placeholder data
  const stats = [
    { id: 1, name: 'Users', value: '12', icon: <FiUsers className="text-blue-500" size={24} />, change: '+3', status: 'increase' },
    { id: 2, name: 'AI Books', value: '5', icon: <FiBookOpen className="text-green-500" size={24} />, change: '+1', status: 'increase' },
    { id: 3, name: 'Conversations', value: '126', icon: <FiMessageSquare className="text-purple-500" size={24} />, change: '+22', status: 'increase' },
    { id: 4, name: 'Usage Minutes', value: '542', icon: <FiActivity className="text-red-500" size={24} />, change: '-15', status: 'decrease' },
  ];

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'completed a test', time: '2 hours ago', resource: 'Physics 101' },
    { id: 2, user: 'Jane Smith', action: 'created a new AI book', time: '5 hours ago', resource: 'Chemistry Basics' },
    { id: 3, user: 'Alex Johnson', action: 'had a conversation', time: 'Yesterday', resource: 'Math AI Assistant' },
    { id: 4, user: 'Maria Garcia', action: 'uploaded documents', time: 'Yesterday', resource: 'Biology Dataset' },
    { id: 5, user: 'Robert Brown', action: 'invited a new user', time: '2 days ago', resource: 'Team Member' },
  ];

  const usageData = [
    { category: 'AI Books', percentage: 35 },
    { category: 'Conversations', percentage: 25 },
    { category: 'Workbooks', percentage: 20 },
    { category: 'Tests', percentage: 15 },
    { category: 'Other', percentage: 5 },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Client Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your learning platform.</p>
      </div>
      
      {/* Time Period Filter */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              period === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 text-sm font-medium ${
              period === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              period === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Month
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 rounded-full bg-gray-100">{stat.icon}</div>
              <span className={`text-sm font-medium ${stat.status === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>
      
      {/* Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">
                      {activity.user} <span className="font-normal text-gray-600">{activity.action}</span>
                    </p>
                    <p className="text-sm text-gray-500">{activity.resource}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Activity
            </button>
          </div>
        </div>
        
        {/* Usage Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resource Usage</h2>
          <div className="space-y-4">
            {usageData.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium text-gray-800">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Access */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-all">
                <FiBookOpen className="text-blue-500 mb-2" size={20} />
                <span className="text-sm text-gray-700">AI Books</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-all">
                <FiDatabase className="text-green-500 mb-2" size={20} />
                <span className="text-sm text-gray-700">Datastore</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-all">
                <FiCpu className="text-purple-500 mb-2" size={20} />
                <span className="text-sm text-gray-700">AI Agents</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-all">
                <FiUsers className="text-red-500 mb-2" size={20} />
                <span className="text-sm text-gray-700">Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;