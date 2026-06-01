import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, BookOpen, Layers, CheckCircle, AlertCircle, ArrowRight, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setExams(response.data.exams || []);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      toast.error('Failed to load classrooms list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSync = async (examId) => {
    try {
      setSyncingId(examId);
      toast.info('Syncing classroom exam structure. Please wait...', { autoClose: 3000 });
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams/${examId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success(`Synced ${response.data.exam.name} successfully!`);
        fetchExams(); // Reload status
        navigate(`/classroom/${examId}`);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Sync failed. Please verify API configuration.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleCardClick = (exam) => {
    if (exam.isSynced) {
      navigate(`/classroom/${exam.exam_id}`);
    } else {
      handleSync(exam.exam_id);
    }
  };

  // Extract all categories
  const categories = ['All', ...new Set(exams.map(e => e.category).filter(Boolean))];

  // Filter exams by search and category
  const filteredExams = exams.filter(exam => {
    const matchesSearch = (exam.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exam.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || exam.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Classrooms from Partner Portal...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Upper Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <BookOpen className="mr-3 text-blue-600" size={32} />
            Classroom Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage synced classrooms and course guides from partner networks.</p>
        </div>
        <button
          onClick={fetchExams}
          className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition duration-200"
        >
          <RefreshCw className="mr-2 text-gray-500 hover:rotate-180 transition duration-500" size={16} />
          Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
        {/* Categories Pills */}
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition duration-150 whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search classrooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Classroom Cards Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <Layers className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-800">No Classrooms Found</h3>
          <p className="text-gray-500 mt-1">Try resetting filters or checking internet connectivity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.exam_id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 relative group"
            >
              {/* Cover Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden flex items-center justify-center">
                {exam.image_url && !exam.image_url.includes('default') ? (
                  <img
                    src={exam.image_url.startsWith('http') ? exam.image_url : `${API_BASE_URL}${exam.image_url}`}
                    alt={exam.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-white text-5xl font-black opacity-20 select-none">
                    {exam.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {/* Sync status Tag */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center shadow-sm ${
                    exam.isSynced
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.isSynced ? (
                      <>
                        <CheckCircle className="mr-1 text-green-600" size={12} />
                        Synced
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 text-yellow-600" size={12} />
                        Sync Required
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    {exam.category || 'General'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{exam.name}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-3">
                    {exam.description || 'No description provided for this classroom course.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(exam.exam_id);
                    }}
                    disabled={syncingId === exam.exam_id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center transition ${
                      exam.isSynced
                        ? 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {syncingId === exam.exam_id ? (
                      <>
                        <Loader2 className="animate-spin mr-1" size={12} />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1" size={12} />
                        {exam.isSynced ? 'Re-Sync' : 'Import Exam'}
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleCardClick(exam)}
                    className="flex items-center text-sm text-blue-600 font-bold hover:text-blue-800 transition"
                  >
                    Enter Classroom
                    <ArrowRight className="ml-1" size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomList;
