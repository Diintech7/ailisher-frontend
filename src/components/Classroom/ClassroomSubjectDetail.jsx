import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, BookOpen, Layers, ChevronRight, Loader2, Plus, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomSubjectDetail = () => {
  const { examId, paperId, subjectId } = useParams();
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  // CRUD Modal State
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterImageUrl, setNewChapterImageUrl] = useState('');
  const [submittingChapter, setSubmittingChapter] = useState(false);

  // Edit Chapter Modal State
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editChapterForm, setEditChapterForm] = useState({
    name: '',
    image_url: ''
  });
  const [updatingChapter, setUpdatingChapter] = useState(false);

  const fetchMetadataAndChapters = async () => {
    try {
      setLoading(true);
      // 1. Fetch exam/paper/subject metadata
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setExam(response.data.exam);
        const foundPaper = response.data.tree.find(p => p.paper_id === paperId);
        setPaper(foundPaper);
        const foundSubject = foundPaper?.subjects?.find(s => s.subject_id === subjectId);
        setSubject(foundSubject);
      }

      // 2. Fetch chapters
      await fetchChaptersOnly();
    } catch (err) {
      console.error('Error fetching subject chapters:', err);
      toast.error('Failed to load chapters list');
    } finally {
      setLoading(false);
    }
  };

  const fetchChaptersOnly = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/subjects/${subjectId}/chapters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setChapters(response.data.chapters || []);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
    }
  };

  useEffect(() => {
    fetchMetadataAndChapters();
  }, [examId, paperId, subjectId]);

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;

    try {
      setSubmittingChapter(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/subjects/${subjectId}/chapters`,
        { 
          name: newChapterName,
          image_url: newChapterImageUrl 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        toast.success('Chapter created successfully!');
        setNewChapterName('');
        setNewChapterImageUrl('');
        setShowAddChapterModal(false);
        await fetchChaptersOnly();
      }
    } catch (err) {
      console.error('Failed to create chapter:', err);
      toast.error(err.response?.data?.message || 'Failed to create chapter');
    } finally {
      setSubmittingChapter(false);
    }
  };

  const handleEditChapterClick = (e, chapter) => {
    e.stopPropagation();
    setEditingChapterId(chapter.chapter_id);
    setEditChapterForm({
      name: chapter.name || '',
      image_url: chapter.image_url || ''
    });
    setShowEditChapterModal(true);
  };

  const handleUpdateChapter = async (e) => {
    e.preventDefault();
    if (!editChapterForm.name.trim()) return;
    try {
      setUpdatingChapter(true);
      const response = await axios.put(`${API_BASE_URL}/api/classroom-exams/chapters/${editingChapterId}`, editChapterForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Chapter updated successfully!');
        setShowEditChapterModal(false);
        await fetchChaptersOnly();
      }
    } catch (err) {
      console.error('Failed to update chapter:', err);
      toast.error('Failed to update chapter');
    } finally {
      setUpdatingChapter(false);
    }
  };

  const handleDeleteChapter = async (e, chapterId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Chapter? This will remove all nested Topics and Subtopics.')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/classroom-exams/chapters/${chapterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Chapter deleted successfully!');
        await fetchChaptersOnly();
      }
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      toast.error('Failed to delete chapter');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading chapters list...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/classroom/${examId}/papers/${paperId}`)}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Paper Details
        </button>

        {/* Breadcrumbs / Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left Cover image placeholder */}
            <div className="md:w-1/4 lg:w-1/5 flex-shrink-0">
              <div 
                className="rounded-lg h-32 flex items-center justify-center overflow-hidden relative"
                style={{ background: `linear-gradient(135deg, ${(subject?.color || '#3b82f6')}dd, ${subject?.color || '#3b82f6'})` }}
              >
                {subject?.image_url && !subject.image_url.includes('default') ? (
                  <img
                    src={subject.image_url.startsWith('http') ? subject.image_url : `${API_BASE_URL}${subject.image_url}`}
                    alt={subject.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const ph = e.target.parentNode.querySelector('.banner-fallback');
                      if (ph) ph.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="banner-fallback absolute inset-0 flex items-center justify-center text-white text-4xl font-black opacity-20 select-none uppercase"
                  style={{ display: subject?.image_url && !subject.image_url.includes('default') ? 'none' : 'flex' }}
                >
                  {subject?.name?.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Right Information area */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-400 font-semibold mb-2">
                  <span>Classrooms</span>
                  <span>/</span>
                  <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}`)}>
                    {exam?.name}
                  </span>
                  <span>/</span>
                  <span className="cursor-pointer hover:text-blue-600 truncate" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}`)}>
                    {paper?.name || 'Paper'}
                  </span>
                </div>
                
                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-3xl font-extrabold text-gray-900 flex items-center" style={{ borderLeft: `5px solid ${subject?.color || '#3b82f6'}`, paddingLeft: '12px' }}>
                    {subject?.name}
                  </h1>
                  <button
                    onClick={() => setShowAddChapterModal(true)}
                    className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-sm flex-shrink-0"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Chapter
                  </button>
                </div>
                
                <p className="text-gray-500 mt-2 text-sm">
                  Select a chapter below to view the detailed topics and learning notes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <Layers className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-800">No Chapters Synced</h3>
              <p className="text-gray-500 mt-1">This subject does not contain any chapters.</p>
            </div>
          ) : (
            chapters.map((chapter, index) => (
              <div
                key={chapter.chapter_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-100 transition group"
              >
                <div 
                  onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapter.chapter_id}`)}
                  className="flex items-center space-x-4 flex-1"
                >
                  {/* Chapter Image/Number Badge */}
                  <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition duration-200 overflow-hidden relative">
                    {chapter.image_url ? (
                      <img
                        src={chapter.image_url.startsWith('http') ? chapter.image_url : `${API_BASE_URL}${chapter.image_url}`}
                        alt={chapter.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center text-inherit font-extrabold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                      {chapter.name}
                    </h3>
                    <div className="flex items-center text-xs text-gray-400 font-semibold mt-1">
                      <BookOpen size={12} className="mr-1" />
                      {chapter.topics?.length || 0} Topics
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => handleEditChapterClick(e, chapter)}
                      className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-blue-600 shadow-sm transition"
                      title="Edit Chapter"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChapter(e, chapter.chapter_id)}
                      className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-red-600 shadow-sm transition"
                      title="Delete Chapter"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition duration-200" size={20} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-150 relative">
            <button
              onClick={() => {
                setShowAddChapterModal(false);
                setNewChapterName('');
                setNewChapterImageUrl('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Chapter</h3>
            <form onSubmit={handleCreateChapter}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Chapter Name</label>
                  <input
                    type="text"
                    required
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Newton's Laws of Motion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newChapterImageUrl}
                    onChange={(e) => setNewChapterImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., https://example.com/motion.jpg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChapterModal(false);
                    setNewChapterName('');
                    setNewChapterImageUrl('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChapter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                >
                  {submittingChapter && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Chapter Modal */}
      {showEditChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-150 relative">
            <button
              onClick={() => setShowEditChapterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Chapter</h3>
            <form onSubmit={handleUpdateChapter}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Chapter Name</label>
                  <input
                    type="text"
                    required
                    value={editChapterForm.name}
                    onChange={(e) => setEditChapterForm({ ...editChapterForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Newton's Laws of Motion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={editChapterForm.image_url}
                    onChange={(e) => setEditChapterForm({ ...editChapterForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., https://example.com/motion.jpg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditChapterModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingChapter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                >
                  {updatingChapter && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomSubjectDetail;
