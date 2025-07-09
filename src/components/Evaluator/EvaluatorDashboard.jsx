import React from 'react';
import { ClipboardList, Users, Star, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';
import Cookies from 'js-cookie';

export default function EvaluatorDashboard() {
  // Temporary data
  const evaluatorData = {
    name: 'NA',
    grade: 'NA',
    subjectMatterExpert: 'NA',
    examFocus: 'NA',
    experience: 'NA',
    status: 'NA',
    stats: {
      totalEvaluations: 'NA',
      averageRating: 'NA',
      creditsEarned: 'NA',
    },
    recentActivity: [
      {
        id: 1,
        type: 'evaluation',
        description: 'Completed evaluation for JEE Advanced Math',
        timestamp: '2 hours ago'
      },
      {
        id: 2,
        type: 'credit',
        description: 'Earned 50 credits for evaluation',
        timestamp: '3 hours ago'
      },
      {
        id: 3,
        type: 'profile',
        description: 'Updated profile information',
        timestamp: '1 day ago'
      }
    ]
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {evaluatorData.name}!</h1>
        <p className="mt-2 text-gray-600">Here's an overview of your evaluator dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <ClipboardList size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
              <p className="text-2xl font-semibold text-gray-900">{evaluatorData.stats.totalEvaluations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Star size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{evaluatorData.stats.averageRating}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Credits Earned</p>
              <p className="text-2xl font-semibold text-gray-900">{evaluatorData.stats.creditsEarned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Award size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Grade Level</p>
              <p className="text-2xl font-semibold text-gray-900">{evaluatorData.grade}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {evaluatorData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center text-gray-600">
                <Clock size={20} className="mr-3" />
                <div>
                  <p>{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Subject Matter Expert</span>
              <span className="font-medium">{evaluatorData.subjectMatterExpert}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Exam Focus</span>
              <span className="font-medium">{evaluatorData.examFocus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Experience</span>
              <span className="font-medium">{evaluatorData.experience} years</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle size={14} className="mr-1" />
                {evaluatorData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ClipboardList size={20} className="mr-2 text-green-600" />
            <span>Start New Evaluation</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users size={20} className="mr-2 text-blue-600" />
            <span>View Profile</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Star size={20} className="mr-2 text-yellow-600" />
            <span>View Credits</span>
          </button>
        </div>
      </div>
    </div>
  );
}
