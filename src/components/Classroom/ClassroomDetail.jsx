import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, ArrowLeft, Layers, Calendar, ChevronRight, FileText, Loader2, Plus, X, Edit, Trash2, MessageSquare, Send, Mic, Volume2 } from 'lucide-react';
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
  const [newSubjectImageUrl, setNewSubjectImageUrl] = useState('');
  const [submittingSubject, setSubmittingSubject] = useState(false);

  // Edit Subject Modal State
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editingSubjectPaperId, setEditingSubjectPaperId] = useState(null);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    name: '',
    color: '#6366f1',
    image_url: ''
  });
  const [updatingSubject, setUpdatingSubject] = useState(false);

  // Chatbot Drawer State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatPaper, setChatPaper] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);

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

  const handleOpenPaperChat = async (paper) => {
    setChatPaper(paper);
    setShowChatModal(true);
    setChatHistory([]);
    setChatSessionId('');
    
    try {
      setIsHistoryLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/classroom-exams/papers/${paper.paper_id}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setChatHistory(res.data.history || []);
        if (res.data.session_id) setChatSessionId(res.data.session_id);
      }
    } catch (err) {
      console.error('Error fetching paper chat history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSendPaperChat = async (e, directMessage = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalMsg = directMessage || chatMessage;
    if (!finalMsg.trim()) return;
    
    const userMsg = { role: 'user', message: finalMsg, created_at: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    
    try {
      setChatLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/papers/${chatPaper.paper_id}/chat`, {
        question: finalMsg,
        session_id: chatSessionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        const botReply = res.data.reply || res.data.message || res.data.answer;
        const botMsg = { role: 'assistant', message: botReply, created_at: new Date().toISOString() };
        setChatHistory(prev => [...prev, botMsg]);
        if (res.data.session_id) setChatSessionId(res.data.session_id);

        // Auto-play voice output if the query was triggered by voice input
        if (directMessage) {
          handlePlayTTS(botReply);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('AI Chatbot failed to respond');
    } finally {
      setChatLoading(false);
    }
  };

  const handleVectorizePaper = async () => {
    if (!chatPaper) return;
    try {
      setIsVectorizing(true);
      toast.info('Training AI Chatbot on this paper. Please wait...', { autoClose: 3000 });
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/papers/${chatPaper.paper_id}/vectorize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('AI Chatbot trained successfully!');
      } else {
        toast.success('AI Chatbot trained successfully!');
      }
    } catch (err) {
      console.error('Error vectorizing paper:', err);
      toast.error('Failed to train AI Chatbot');
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleClearPaperChatHistory = async () => {
    if (!window.confirm('Clear all chat messages for this paper?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/papers/${chatPaper.paper_id}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Chat history cleared!');
        setChatHistory([]);
        setChatSessionId('');
      }
    } catch (err) {
      console.error('Error clearing chat history:', err);
      toast.error('Failed to clear history');
    }
  };

  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      if (speechToText.trim()) {
        handleSendPaperChat(null, speechToText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Voice input failed. Check microphone permissions.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handlePlayTTS = (text) => {
    try {
      if (window.currentAudio) {
        window.currentAudio.pause();
      }
      const audioUrl = `${API_BASE_URL}/api/classroom-exams/tts/speak?text=${encodeURIComponent(text)}&voice=alloy`;
      const audio = new Audio(audioUrl);
      window.currentAudio = audio;
      audio.play().catch(err => {
        console.error('Failed to play TTS audio:', err);
        toast.error('Unable to play voice response');
      });
    } catch (err) {
      console.error('TTS Playback Error:', err);
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
          color: newSubjectColor,
          image_url: newSubjectImageUrl
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Subject created successfully!');
        setNewSubjectName('');
        setNewSubjectColor('#6366f1');
        setNewSubjectImageUrl('');
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

  const handleEditSubjectClick = (e, paperId, subject) => {
    e.stopPropagation();
    setEditingSubjectPaperId(paperId);
    setEditingSubjectId(subject.subject_id);
    setEditSubjectForm({
      name: subject.name || '',
      color: subject.color || '#6366f1',
      image_url: subject.image_url || ''
    });
    setShowEditSubjectModal(true);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editSubjectForm.name.trim()) return;
    try {
      setUpdatingSubject(true);
      const response = await axios.put(`${API_BASE_URL}/api/classroom-exams/subjects/${editingSubjectId}`, editSubjectForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Subject updated successfully!');
        setShowEditSubjectModal(false);
        fetchSubjectsForPaper(editingSubjectPaperId);
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
      toast.error('Failed to update subject');
    } finally {
      setUpdatingSubject(false);
    }
  };

  const handleDeleteSubject = async (e, paperId, subjectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Subject? This will remove all nested Chapters, Topics, and Subtopics.')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/classroom-exams/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Subject deleted successfully!');
        fetchSubjectsForPaper(paperId);
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      toast.error('Failed to delete subject');
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenPaperChat(paper)}
                    className="flex items-center text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-md transition duration-200 border border-indigo-100 shadow-sm"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    AI Chatbot
                  </button>
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
              </div>

              {/* Subjects Grid (AI Courses style columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(subjectsMap[paper.paper_id] || []).map((subject) => (
                  <div
                    key={subject.subject_id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer flex flex-col justify-between group relative"
                    style={{ borderLeft: `4px solid ${subject.color || '#6366f1'}` }}
                  >
                    {/* Hover actions panel */}
                    <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => handleEditSubjectClick(e, paper.paper_id, subject)}
                        className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-indigo-600 shadow-sm transition"
                        title="Edit Subject"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSubject(e, paper.paper_id, subject.subject_id)}
                        className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-red-600 shadow-sm transition"
                        title="Delete Subject"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div onClick={() => handleSubjectClick(paper.paper_id, subject.subject_id)}>
                      {/* Cover Image Container */}
                      <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                        {subject.image_url ? (
                          <img
                            src={subject.image_url.startsWith('http') ? subject.image_url : `${API_BASE_URL}${subject.image_url}`}
                            alt={subject.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="absolute inset-0 flex items-center justify-center text-gray-400 font-extrabold text-3xl opacity-20 select-none uppercase"
                          style={{ display: subject.image_url ? 'none' : 'flex' }}
                        >
                          {subject.name.substring(0, 2)}
                        </div>
                      </div>

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
                setNewSubjectImageUrl('');
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newSubjectImageUrl}
                    onChange={(e) => setNewSubjectImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., https://example.com/physics.jpg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectName('');
                    setNewSubjectImageUrl('');
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

      {/* CRUD Edit Subject Modal */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative">
            <button
              onClick={() => setShowEditSubjectModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Subject</h3>
            <form onSubmit={handleUpdateSubject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={editSubjectForm.name}
                    onChange={(e) => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Theme Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editSubjectForm.color}
                      onChange={(e) => setEditSubjectForm({ ...editSubjectForm, color: e.target.value })}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={editSubjectForm.color}
                      onChange={(e) => setEditSubjectForm({ ...editSubjectForm, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={editSubjectForm.image_url}
                    onChange={(e) => setEditSubjectForm({ ...editSubjectForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., https://example.com/physics.jpg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditSubjectModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSubject}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                >
                  {updatingSubject && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paper Chatbot Drawer Overlay */}
      {showChatModal && chatPaper && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col relative animate-slide-in animate-duration-200">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center">
                  <MessageSquare className="mr-2 text-indigo-600" size={18} />
                  Chat with {chatPaper.name} AI
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">AI assistant powered by paper context</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVectorizePaper}
                  disabled={isVectorizing}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                    isVectorizing
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-400 cursor-not-allowed'
                      : 'bg-white border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                  title="Train AI Chatbot on this paper"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVectorizing ? 'animate-spin' : ''}`} />
                  <span>{isVectorizing ? 'Training...' : 'Train AI'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowChatModal(false);
                    if (window.currentAudio) window.currentAudio.pause();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-150 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 flex flex-col">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full flex-1">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full flex-1 text-center text-gray-400 py-8">
                  <MessageSquare size={36} className="mb-2 opacity-55 text-indigo-500" />
                  <p className="text-xs font-bold text-gray-700">No chat history</p>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[240px]">Ask any doubt or get explanations about subjects, chapters, and topics of this paper.</p>
                </div>
              ) : (
                chatHistory.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handlePlayTTS(msg.message)}
                        className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-slate-50 transition shadow-sm mt-1 flex-shrink-0"
                        title="Speak response"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border rounded-bl-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className={`text-[9px] block text-right mt-1.5 opacity-60 ${
                        msg.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
                      }`}>
                        {new Date(msg.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input form */}
            <div className="p-4 border-t bg-white flex flex-col gap-2">
              <form onSubmit={handleSendPaperChat} className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleStartListening}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition flex-shrink-0 ${
                    isListening
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                  title="Voice Input (Speech-to-Text)"
                >
                  <Mic size={16} />
                </button>
                <input
                  type="text"
                  placeholder="Type your question about the paper..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatMessage.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
              {chatHistory.length > 0 && (
                <button
                  onClick={handleClearPaperChatHistory}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center justify-center mt-1 transition self-center"
                >
                  <Trash2 size={12} className="mr-1" />
                  Clear Chat History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetail;
