import React, { useState } from 'react';
import { FiUsers, FiMessageSquare, FiCheckSquare, FiDollarSign, FiBriefcase, FiServer, FiBarChart2, FiAlertCircle } from 'react-icons/fi';

const AdminDashboard = () => {
  const [period, setPeriod] = useState('month');

  // Static placeholder data
  const stats = [
    { id: 1, name: 'Total Clients', value: '28', icon: <FiBriefcase className="text-blue-600" size={24} />, change: '+12.5', status: 'increase' },
    { id: 2, name: 'Active Users', value: '245', icon: <FiUsers className="text-green-600" size={24} />, change: '+8.2', status: 'increase' },
    { id: 3, name: 'Monthly Revenue', value: '$12,450', icon: <FiDollarSign className="text-yellow-600" size={24} />, change: '+15.3', status: 'increase' },
    { id: 4, name: 'Support Tickets', value: '15', icon: <FiAlertCircle className="text-red-600" size={24} />, change: '-5.1', status: 'decrease' },
  ];

  const topClients = [
    { id: 1, name: 'EduTech Solutions', users: 42, revenue: '$2,500', status: 'active' },
    { id: 2, name: 'Global Learning Institute', users: 38, revenue: '$2,100', status: 'active' },
    { id: 3, name: 'Smart Academy', users: 26, revenue: '$1,750', status: 'active' },
    { id: 4, name: 'Premier Education', users: 24, revenue: '$1,600', status: 'active' },
    { id: 5, name: 'Future Schools Network', users: 18, revenue: '$1,200', status: 'active' },
  ];

  const recentActivities = [
    { id: 1, action: 'New client registered', details: 'Innovative Learning Co.', time: '30 minutes ago' },
    { id: 2, action: 'Payment received', details: '$1,250 from EduTech Solutions', time: '2 hours ago' },
    { id: 3, action: 'Support ticket resolved', details: 'Ticket #1234 - API integration issue', time: '5 hours ago' },
    { id: 4, action: 'New user added', details: 'Admin user for Smart Academy', time: 'Yesterday' },
    { id: 5, action: 'System update completed', details: 'AI Agent performance improvements', time: 'Yesterday' },
  ];

  const pendingTasks = [
    { id: 1, task: 'Review new client application', priority: 'high', deadline: 'Today' },
    { id: 2, task: 'Prepare monthly report', priority: 'medium', deadline: 'Tomorrow' },
    { id: 3, task: 'Follow up on payment issues', priority: 'high', deadline: 'Today' },
    { id: 4, task: 'Update pricing plans', priority: 'low', deadline: 'Next week' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Management overview of your platform and clients</p>
      </div>

      {/* Time Period Filter */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              period === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 text-sm font-medium ${
              period === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              period === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Quarter
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Clients Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Top Clients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.users}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.revenue}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Clients
            </button>
          </div>
        </div>

        {/* Activity & Tasks Section */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Pending Tasks</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start">
                    <div className="mr-3 mt-1">
                      <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center">
                        <FiCheckSquare className="text-gray-300" size={12} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{task.task}</p>
                      <div className="flex justify-between mt-1">
                        <span className={`text-xs rounded-full px-2 py-1 font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">{task.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FiServer className="text-blue-500 mr-2" size={18} />
              <h3 className="font-medium text-gray-800">Server Load</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>65% utilized</span>
              <span>35% available</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FiBarChart2 className="text-green-500 mr-2" size={18} />
              <h3 className="font-medium text-gray-800">AI Usage</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>82% utilized</span>
              <span>18% available</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FiMessageSquare className="text-purple-500 mr-2" size={18} />
              <h3 className="font-medium text-gray-800">Conversations</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>45% utilized</span>
              <span>55% available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;