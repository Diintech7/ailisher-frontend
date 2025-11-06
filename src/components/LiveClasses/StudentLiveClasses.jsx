import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import {
  FaVideo,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaSignInAlt,
  FaPlayCircle
} from 'react-icons/fa';

const StudentLiveClasses = ({ onJoinClass }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);

  const token = Cookies.get('admintoken');

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-classes/classes?status=scheduled,live`);
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async (classId) => {
    setJoining(classId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-classes/classes/${classId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'guest' })
      });
      const data = await response.json();
      if (data.success) {
        // Call parent callback with class data
        if (onJoinClass) {
          onJoinClass({
            token: data.data.token,
            roomId: data.data.roomId,
            roomCode: data.data.roomCode,
            class: data.data.class
          });
        }
      }
    } catch (error) {
      console.error('Error joining class:', error);
      alert('Failed to join class');
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const isUpcoming = (scheduledAt) => {
    return new Date(scheduledAt) > new Date();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
        <p className="text-gray-600 mt-2">Join your scheduled live classes</p>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div
              key={classItem._id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                {getStatusBadge(classItem.status)}
                <span className={`text-xs ${isUpcoming(classItem.scheduledAt) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {isUpcoming(classItem.scheduledAt) ? 'Upcoming' : 'Started'}
                </span>
              </div>

              {/* Class Info */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {classItem.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {classItem.description}
                </p>

                {classItem.classroom && (
                  <p className="text-xs text-gray-500 mb-4">
                    Classroom: {classItem.classroom.name}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendarAlt />
                    <span>{formatDate(classItem.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock />
                    <span>{classItem.duration} minutes</span>
                  </div>
                  {classItem.totalAttendees > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUsers />
                      <span>{classItem.totalAttendees} attending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={() => joinClass(classItem._id)}
                disabled={joining === classItem._id || !['scheduled', 'live'].includes(classItem.status)}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  classItem.status === 'live'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'
                }`}
              >
                {joining === classItem._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Joining...
                  </>
                ) : classItem.status === 'live' ? (
                  <>
                    <FaPlayCircle /> Join Now
                  </>
                ) : (
                  <>
                    <FaSignInAlt /> Join Class
                  </>
                )}
              </button>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FaVideo className="mx-auto text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600 text-lg">No classes available</p>
              <p className="text-gray-500 text-sm mt-2">
                Check back later for scheduled classes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLiveClasses;

