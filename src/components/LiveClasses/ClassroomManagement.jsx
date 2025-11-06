import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import {
  FaPlus,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaVideo,
  FaCalendarAlt,
  FaUsers,
  FaClock
} from 'react-icons/fa';
import Cookies from 'js-cookie';

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classDetails, setClassDetails] = useState([]);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: ''
  });

  const token = Cookies.get('admintoken');


  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-classes/admin/classrooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClassrooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-classes/admin/classrooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClassroom)
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setNewClassroom({ name: '', description: '' });
        fetchClassrooms();
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (classroomId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/live-classes/admin/classrooms/${classroomId}/classes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setClassDetails(data.data);
        setSelectedClassroom(classrooms.find(c => c._id === classroomId));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleViewClasses = (classroom) => {
    setShowClassesModal(true);
    fetchClasses(classroom._id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.scheduled}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Classrooms</h1>
          <p className="text-gray-600 mt-2">Create and manage your live classrooms</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Create Classroom
        </button>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <div
              key={classroom._id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {classroom.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{classroom.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaVideo />
                  <span className="text-sm font-medium">
                    {classroom.classesCount || 0} Classes
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleViewClasses(classroom)}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                View Classes <FaChevronRight />
              </button>
            </div>
          ))}

          {classrooms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FaVideo className="mx-auto text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600 text-lg">No classrooms yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Create your first classroom to get started
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Classroom Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Classroom</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  value={newClassroom.name}
                  onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Math 101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newClassroom.description}
                  onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a description..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createClassroom}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classes Modal */}
      {showClassesModal && selectedClassroom && (
        <ClassroomClassesModal
          classroom={selectedClassroom}
          classes={classDetails}
          onClose={() => setShowClassesModal(false)}
          onRefresh={fetchClassrooms}
        />
      )}
    </div>
  );
};

// Classes Modal Component
const ClassroomClassesModal = ({ classroom, classes, onClose, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60
  });

  const createClass = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('admintoken');
      const response = await fetch(`${API_BASE_URL}/api/live-classes/admin/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classroomId: classroom._id,
          ...newClass,
          scheduledAt: new Date(newClass.scheduledAt).toISOString()
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setNewClass({ title: '', description: '', scheduledAt: '', duration: 60 });
        onRefresh();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{classroom.name} Classes</h2>
            <p className="text-gray-600 text-sm">{classes.length} classes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPlus /> Add Class
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {classes.map((classItem) => (
            <div
              key={classItem._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {classItem.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{classItem.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt /> {new Date(classItem.scheduledAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock /> {classItem.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUsers /> {classItem.totalAttendees || 0} attended
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(classItem.status)}
                </div>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No classes scheduled yet</p>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Add New Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    value={newClass.title}
                    onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Algebra Basics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newClass.scheduledAt}
                    onChange={(e) => setNewClass({ ...newClass, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newClass.duration}
                    onChange={(e) => setNewClass({ ...newClass, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createClass}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.scheduled}`}>
      {status}
    </span>
  );
};

export default ClassroomManagement;

