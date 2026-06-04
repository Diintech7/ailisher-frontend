import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, ArrowLeft, Layers, Calendar, ChevronRight, FileText, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomDetail = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [papers, setPapers] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  // CRUD Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#6366f1'); // Indigo color default
  const [submittingSubject, setSubmittingSubject] = useState(false);

  const fetchPapersAndSubjects = async () => {
    try {
      setLoading(true);
      // 1. Fetch exam metadata
      const examRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (examRes.data && examRes.data.success) {
        setExam(examRes.data.exam);
      }

      // 2. Fetch papers
      const papersRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/papers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (papersRes.data && papersRes.data.success) {
        const papersList = papersRes.data.papers || [];
        setPapers(papersList);

        // 3. Fetch subjects for each paper
        const tempSubjectsMap = {};
        for (const paper of papersList) {
          try {
            const subRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/papers/${paper.paper_id}/subjects`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (subRes.data && subRes.data.success) {
              tempSubjectsMap[paper.paper_id] = subRes.data.subjects || [];
            }
          } catch (subErr) {
            console.error(`Error fetching subjects for paper ${paper.paper_id}:`, subErr);
            tempSubjectsMap[paper.paper_id] = [];
          }
        }
        setSubjectsMap(tempSubjectsMap);
      }
    } catch (err) {
      console.error('Error fetching exam tree:', err);
      toast.error('Failed to load exam papers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapersAndSubjects();
  }, [examId]);

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      toast.info('Syncing classroom contents. Please wait...');
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams/${examId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Sync complete!');
        fetchPapersAndSubjects();
      }
    } catch (err) {
      console.error('Force sync failed:', err);
      toast.error('Failed to force sync exam data');
    } finally {
      setSyncing(false);
    }
  };

  const fetchSubjectsForPaper = async (paperId) => {
    try {
      const subRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/papers/${paperId}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (subRes.data && subRes.data.success) {
        setSubjectsMap(prev => ({
          ...prev,
          [paperId]: subRes.data.subjects || []
        }));
      }
    } catch (err) {
      console.error(`Error fetching subjects for paper ${paperId}:`, err);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      setSubmittingSubject(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/papers/${selectedPaperId}/subjects`,
        {
          name: newSubjectName,
          color: newSubjectColor
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Subject created successfully!');
        setNewSubjectName('');
        setNewSubjectColor('#6366f1');
        setShowAddSubjectModal(false);
        // Refresh subjects for this paper
        await fetchSubjectsForPaper(selectedPaperId);
      }
    } catch (err) {
      console.error('Failed to create subject:', err);
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleSubjectClick = (paperId, subjectId) => {
    navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading classroom subjects...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button (AI Courses Style) */}
      <button
        onClick={() => navigate('/classroom')}
        className="text-indigo-600 hover:text-indigo-700 flex items-center mb-6 font-medium transition"
      >
        <ArrowLeft className="mr-1" size={16} />
        <span>Back to Dashboard</span>
      </button>

      {/* Exam Profile Banner (AI Courses style with Left cover image) */}
      {exam && (
        <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left Cover image placeholder */}
            <div className="md:w-1/4 lg:w-1/5 flex-shrink-0">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg h-40 flex items-center justify-center overflow-hidden relative">
                {exam.image_url && !exam.image_url.includes('default') ? (
                  <img
                    src={exam.image_url.startsWith('http') ? exam.image_url : `${API_BASE_URL}${exam.image_url}`}
                    alt={exam.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const ph = e.target.parentNode.querySelector('.banner-fallback');
                      if (ph) ph.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="banner-fallback absolute inset-0 flex items-center justify-center text-white text-5xl font-black opacity-20 select-none"
                  style={{ display: exam.image_url && !exam.image_url.includes('default') ? 'none' : 'flex' }}
                >
                  {exam.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Right Information area */}
            <div className="md:w-3/4 lg:w-4/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {exam.category || 'Classroom Portal'}
                </span>
                <h1 className="text-3xl font-extrabold text-gray-800 mt-2">{exam.name}</h1>
                <p className="text-gray-600 mt-2 text-sm max-w-2xl leading-relaxed">{exam.description || 'No description provided for this classroom exam.'}</p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-100 gap-4">
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar size={14} className="mr-1" />
                  Synced at: {new Date(exam.synced_at).toLocaleString()}
                </div>
                
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="flex items-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} size={14} />
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tree Section (Papers) */}
      <div className="space-y-8">
        {papers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <Layers className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">No Synced Papers found</h3>
            <p className="text-gray-500 mt-1">Please click "Sync Now" to reload data from partner networks.</p>
          </div>
        ) : (
          papers.map((paper) => (
            <div key={paper.paper_id} className="space-y-4">
              {/* Paper header */}
              <div className="flex justify-between items-center border-b border-gray-250 pb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="text-gray-400" size={20} />
                  <h2 className="text-xl font-bold text-gray-800">{paper.name}</h2>
                  <span className="text-xs text-gray-400">({subjectsMap[paper.paper_id]?.length || 0} Subjects synced)</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPaperId(paper.paper_id);
                    setShowAddSubjectModal(true);
                  }}
                  className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-md transition duration-200 shadow-sm"
                >
                  <Plus size={14} className="mr-1" />
                  Add Subject
                </button>
              </div>

              {/* Subjects Grid (AI Courses style columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(subjectsMap[paper.paper_id] || []).map((subject) => (
                  <div
                    key={subject.subject_id}
                    onClick={() => handleSubjectClick(paper.paper_id, subject.subject_id)}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer flex flex-col justify-between group"
                    style={{ borderLeft: `4px solid ${subject.color || '#6366f1'}` }}
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition truncate">
                        {subject.name}
                      </h3>
                      
                      {/* Structure Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="bg-slate-50 p-2 rounded-lg border border-gray-100">
                          <div className="text-sm font-bold text-gray-700">{subject.chapter_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Chapters</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-gray-100">
                          <div className="text-sm font-bold text-gray-700">{subject.topic_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Topics</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-gray-100">
                          <div className="text-sm font-bold text-gray-700">{subject.subtopic_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Notes</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-t border-gray-150">
                      <span className="text-xs text-gray-500 font-medium">Click to open course-material</span>
                      <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform duration-200" size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CRUD Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative">
            <button
              onClick={() => {
                setShowAddSubjectModal(false);
                setNewSubjectName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Subject</h3>
            <form onSubmit={handleCreateSubject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., Physics, Organic Chemistry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Theme Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newSubjectColor}
                      onChange={(e) => setNewSubjectColor(e.target.value)}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={newSubjectColor}
                      onChange={(e) => setNewSubjectColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectName('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSubject}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                >
                  {submittingSubject && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetail;
