import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, BookOpen, ChevronRight, Hash, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomChapterDetail = () => {
  const { examId, paperId, subjectId, chapterId } = useParams();
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  // CRUD Modal State
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [submittingTopic, setSubmittingTopic] = useState(false);

  const fetchMetadataAndTopics = async () => {
    try {
      setLoading(true);
      // 1. Fetch exam/paper/subject/chapter metadata
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setExam(response.data.exam);
        const foundPaper = response.data.tree.find(p => p.paper_id === paperId);
        setPaper(foundPaper);
        const foundSubject = foundPaper?.subjects?.find(s => s.subject_id === subjectId);
        setSubject(foundSubject);
        const foundChapter = foundSubject?.chapters?.find(c => c.chapter_id === chapterId);
        setChapter(foundChapter);
      }

      // 2. Fetch topics
      await fetchTopicsOnly();
    } catch (err) {
      console.error('Error fetching chapter topics:', err);
      toast.error('Failed to load topics list');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsOnly = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/chapters/${chapterId}/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setTopics(response.data.topics || []);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  useEffect(() => {
    fetchMetadataAndTopics();
  }, [examId, paperId, subjectId, chapterId]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      setSubmittingTopic(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/chapters/${chapterId}/topics`,
        { name: newTopicName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        toast.success('Topic created successfully!');
        setNewTopicName('');
        setShowAddTopicModal(false);
        await fetchTopicsOnly();
      }
    } catch (err) {
      console.error('Failed to create topic:', err);
      toast.error(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setSubmittingTopic(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading topics list...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`)}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Subject Chapters
        </button>

        {/* Breadcrumbs / Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-400 font-semibold mb-2">
              <span>Classrooms</span>
              <span>/</span>
              <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}`)}>
                {exam?.name}
              </span>
              <span>/</span>
              <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`)}>
                {subject?.name}
              </span>
              <span>/</span>
              <span className="truncate">{paper?.name}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
              <BookOpen className="mr-3 text-blue-500" size={28} />
              {chapter?.name}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Browse topics inside this chapter to study their corresponding subtopics and detailed concepts.
            </p>
          </div>
          <button
            onClick={() => setShowAddTopicModal(true)}
            className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-sm"
          >
            <Plus size={16} className="mr-1.5" />
            Add Topic
          </button>
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          {topics.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <Hash className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-800">No Topics Synced</h3>
              <p className="text-gray-500 mt-1">This chapter does not contain any topics yet.</p>
            </div>
          ) : (
            topics.map((topic, index) => (
              <div
                key={topic.topic_id}
                onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapterId}/topics/${topic.topic_id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-100 transition group"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                      {topic.name}
                    </h3>
                    <div className="text-xs text-gray-400 font-semibold mt-1">
                      {topic.subtopics?.length || 0} Subtopics / Notes synced
                    </div>
                  </div>
                </div>

                <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition duration-200" size={20} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-150 relative">
            <button
              onClick={() => {
                setShowAddTopicModal(false);
                setNewTopicName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Topic</h3>
            <form onSubmit={handleCreateTopic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic Name</label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Circular Motion Concepts"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTopicModal(false);
                    setNewTopicName('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                >
                  {submittingTopic && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomChapterDetail;
