import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const UserHome = () => {
  const [user, setUser] = useState({ name: 'Loading...' });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user info from cookie
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      setUser(userData);
    }

    // In a real application, you would fetch data from your API
    // For now, let's use mock data
    const fetchData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setRecentActivities([
            { id: 1, type: 'book', title: 'Introduction to Machine Learning', date: '2 hours ago', progress: 35 },
            { id: 2, type: 'test', title: 'Algebra Quiz 2', date: '1 day ago', score: 85 },
            { id: 3, type: 'chat', title: 'Chat with Math Tutor', date: '3 days ago', messages: 12 }
          ]);
          
          setRecommendedBooks([
            { id: 1, title: 'Advanced Physics', image: 'https://via.placeholder.com/150', category: 'Science' },
            { id: 2, title: 'World History', image: 'https://via.placeholder.com/150', category: 'History' },
            { id: 3, title: 'Calculus Made Easy', image: 'https://via.placeholder.com/150', category: 'Mathematics' },
            { id: 4, title: 'English Literature', image: 'https://via.placeholder.com/150', category: 'Literature' }
          ]);
          
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name || 'Student'}!</h1>
        <p className="text-gray-600 mt-2">
          Continue your learning journey with personalized content and resources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
              <Link to="/my-library" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600">
                    {activity.type === 'book' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {activity.type === 'test' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {activity.type === 'chat' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-gray-500">{activity.date}</div>
                  </div>
                  <div>
                    {activity.progress && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{activity.progress}%</span> complete
                      </div>
                    )}
                    {activity.score && (
                      <div className="text-sm text-gray-600">
                        Score: <span className="font-medium">{activity.score}%</span>
                      </div>
                    )}
                    {activity.messages && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{activity.messages}</span> messages
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Books */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recommended Books</h2>
              <Link to="/ai-books" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Browse Library
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendedBooks.map((book) => (
                <div key={book.id} className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img src="/api/placeholder/150/200" alt={book.title} className="w-full h-40 object-cover" />
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 truncate">{book.title}</h3>
                    <p className="text-sm text-gray-500">{book.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Access */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/ai-books" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="mt-2 text-sm font-medium">AI Books</span>
              </Link>
              <Link to="/tests" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="mt-2 text-sm font-medium">Tests</span>
              </Link>
              <Link to="/ai" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="mt-2 text-sm font-medium">AI Chat</span>
              </Link>
              <Link to="/lectures" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="mt-2 text-sm font-medium">Lectures</span>
              </Link>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Physics</span>
                  <span className="text-sm font-medium text-gray-700">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Mathematics</span>
                  <span className="text-sm font-medium text-gray-700">70%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Chemistry</span>
                  <span className="text-sm font-medium text-gray-700">30%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Literature</span>
                  <span className="text-sm font-medium text-gray-700">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHome;