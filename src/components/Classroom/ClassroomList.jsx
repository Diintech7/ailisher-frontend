import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, BookOpen, Layers, CheckCircle, AlertCircle, ArrowRight, Loader2, Search, Image as ImageIcon, Plus, X, Edit, Trash2, History } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingExam, setAddingExam] = useState(false);
  const [newExam, setNewExam] = useState({
    name: '',
    category: '',
    description: '',
    image_url: ''
  });

  // Edit Exam Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState('');
  const [editExamForm, setEditExamForm] = useState({
    name: '',
    category: '',
    description: '',
    image_url: ''
  });
  const [updatingExam, setUpdatingExam] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyExamsList, setHistoryExamsList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExamName, setHistoryExamName] = useState('');

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExam.name) {
      toast.error('Exam name is required');
      return;
    }
    try {
      setAddingExam(true);
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams`, newExam, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Exam created successfully!');
        setShowAddModal(false);
        setNewExam({ name: '', category: '', description: '', image_url: '' });
        fetchExams();
      }
    } catch (err) {
      console.error('Failed to create exam:', err);
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setAddingExam(false);
    }
  };

  const handleEditExamClick = (e, exam) => {
    e.stopPropagation();
    setEditingExamId(exam.exam_id);
    setEditExamForm({
      name: exam.name || '',
      category: exam.category || '',
      description: exam.description || '',
      image_url: exam.image_url || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (!editExamForm.name) {
      toast.error('Exam name is required');
      return;
    }
    try {
      setUpdatingExam(true);
      const response = await axios.put(`${API_BASE_URL}/api/classroom-exams/${editingExamId}`, editExamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Exam updated successfully!');
        setShowEditModal(false);
        fetchExams();
      }
    } catch (err) {
      console.error('Failed to update exam:', err);
      toast.error('Failed to update exam');
    } finally {
      setUpdatingExam(false);
    }
  };

  const handleDeleteExam = async (e, examId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Classroom Exam? This will delete all cached papers, subjects, chapters, and topics.')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Exam deleted successfully!');
        fetchExams();
      }
    } catch (err) {
      console.error('Failed to delete exam:', err);
      toast.error('Failed to delete exam');
    }
  };

  const handleViewHistory = async (e, exam) => {
    e.stopPropagation();
    setHistoryExamName(exam.name);
    setHistoryExamsList([]);
    setShowHistoryModal(true);
    try {
      setHistoryLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/classroom-exams/${exam.exam_id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setHistoryExamsList(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch study history:', err);
      toast.error('Failed to load study history logs');
    } finally {
      setHistoryLoading(false);
    }
  };

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

  // Group filtered exams by category for grouped layout style matching AI Courses
  const groupedExams = filteredExams.reduce((acc, exam) => {
    const categoryName = exam.category || 'General';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(exam);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Classrooms from Partner Portal...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Upper Dashboard Header (AI Courses style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <BookOpen className="mr-3 text-indigo-600" size={32} />
            AI Classrooms
          </h1>
          <p className="text-gray-600 mt-1">Manage synced classrooms and course guides from partner networks.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-200 text-sm font-semibold"
          >
            <Plus className="mr-2" size={16} />
            Add Exam
          </button>
          <button
            onClick={fetchExams}
            className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition duration-200 text-sm font-medium"
          >
            <RefreshCw className="mr-2 text-gray-500 hover:rotate-180 transition duration-500" size={16} />
            Refresh List
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4 shadow-sm">
        {/* Categories Pills */}
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition duration-150 whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Classroom Grouped Grids */}
      {filteredExams.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <Layers className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-800">No Classrooms Found</h3>
          <p className="text-gray-500 mt-1">Try resetting filters or checking internet connectivity.</p>
        </div>
      ) : (
        Object.entries(groupedExams).map(([categoryName, examsList]) => (
          <div key={categoryName} className="mb-10">
            {/* Category Heading (AI Courses Style) */}
            <div className="border-b border-gray-200 pb-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">{categoryName}</h2>
            </div>

            {/* Grid layout (AI Courses style: xl:grid-cols-4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {examsList.map((exam) => (
                <div
                  key={exam.exam_id}
                  className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col cursor-pointer hover:shadow-md transition-shadow duration-200"
                  onClick={() => handleCardClick(exam)}
                >
                  {/* Image container inside padding (AI Courses style) */}
                  <div className="w-full h-40 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center overflow-hidden mb-3 relative animate-in fade-in duration-200">
                    <div className="absolute top-2 left-2 flex items-center space-x-1 z-10 bg-white/85 backdrop-blur-sm p-1 rounded-md shadow-sm">
                      <button
                        onClick={(e) => handleEditExamClick(e, exam)}
                        className="p-1 rounded text-gray-700 hover:text-indigo-600 hover:bg-white transition"
                        title="Edit Exam"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => handleViewHistory(e, exam)}
                        className="p-1 rounded text-gray-700 hover:text-green-600 hover:bg-white transition"
                        title="Study History"
                      >
                        <History size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteExam(e, exam.exam_id)}
                        className="p-1 rounded text-gray-700 hover:text-red-600 hover:bg-white transition"
                        title="Delete Exam"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {exam.image_url && !exam.image_url.includes('default') ? (
                      <img
                        src={exam.image_url.startsWith('http') ? exam.image_url : `${API_BASE_URL}${exam.image_url}`}
                        alt={exam.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          // Show initials placeholder on error
                          const ph = e.target.parentNode.querySelector('.fallback-initials');
                          if (ph) ph.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div 
                      className="fallback-initials absolute inset-0 flex items-center justify-center text-white text-5xl font-black opacity-20 select-none"
                      style={{ display: exam.image_url && !exam.image_url.includes('default') ? 'none' : 'flex' }}
                    >
                      {exam.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Sync status Tag */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center shadow-sm ${
                        exam.isSynced
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.isSynced ? (
                          <>
                            <CheckCircle className="mr-1 text-green-600" size={10} />
                            Synced
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-1 text-yellow-600" size={10} />
                            Sync Required
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                        {exam.category || 'General'}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{exam.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                        {exam.description || 'No description provided for this classroom course.'}
                      </p>
                    </div>

                    {/* Clean Footer Divider & Actions (AI Courses style) */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSync(exam.exam_id);
                        }}
                        disabled={syncingId === exam.exam_id}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded border flex items-center transition ${
                          exam.isSynced
                            ? 'border-gray-200 hover:bg-gray-50 text-gray-600'
                            : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {syncingId === exam.exam_id ? (
                          <>
                            <Loader2 className="animate-spin mr-1 animate-duration-1000" size={10} />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-1" size={10} />
                            {exam.isSynced ? 'Re-Sync' : 'Import'}
                          </>
                        )}
                      </button>
                      
                      <span className="flex items-center text-xs text-indigo-600 font-bold hover:text-indigo-800 transition">
                        Enter Classroom
                        <ArrowRight className="ml-1" size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {/* Create Exam Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Classroom Exam</h3>
            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Exam Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEET, IIT JEE Main"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Medical"
                  value={newExam.category}
                  onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Provide brief details about this exam..."
                  value={newExam.description}
                  onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm h-24 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={addingExam}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingExam || !newExam.name.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50 flex items-center"
                >
                  {addingExam ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" size={14} />
                      Adding...
                    </>
                  ) : (
                    'Add Exam'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal Dialog */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Classroom Exam</h3>
            <form onSubmit={handleUpdateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Exam Name
                </label>
                <input
                  type="text"
                  value={editExamForm.name}
                  onChange={(e) => setEditExamForm({ ...editExamForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <input
                  type="text"
                  value={editExamForm.category}
                  onChange={(e) => setEditExamForm({ ...editExamForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={editExamForm.description}
                  onChange={(e) => setEditExamForm({ ...editExamForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editExamForm.image_url}
                  onChange={(e) => setEditExamForm({ ...editExamForm, image_url: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={updatingExam}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingExam || !editExamForm.name.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50 flex items-center"
                >
                  {updatingExam ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study History Modal Dialog */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Study Progress History</h3>
            <p className="text-xs text-indigo-600 font-semibold mb-4 uppercase tracking-wider">Exam: {historyExamName}</p>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : historyExamsList.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Layers className="mx-auto text-gray-300 mb-2" size={36} />
                  <p className="text-sm font-medium">No study progress sessions recorded yet.</p>
                </div>
              ) : (
                historyExamsList.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{item.subtopic_name || 'Subtopic Session'}</h4>
                      <p className="text-xs text-gray-400 mt-1">Date: {new Date(item.date || item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                        {item.time_spent_minutes || 0} mins read
                      </span>
                      {item.quiz_score !== undefined && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded">
                          Quiz: {item.quiz_score}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomList;
