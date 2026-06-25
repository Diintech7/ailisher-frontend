import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { HelpCircle, RefreshCw, ChevronLeft, Search, BookOpen, Film, Play, X, CheckCircle, HelpCircle as QuestionIcon, Plus, Upload, Trash2, Cpu, Edit, Sparkles, MessageSquare, Send, Mic, Volume2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';

const AiPyqs = () => {
  const [pyqSets, setPyqSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState(null);
  
  // Selected Set Details
  const [questions, setQuestions] = useState([]);
  const [reels, setReels] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'reels'
  
  // Interaction & UI
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [selectedReel, setSelectedReel] = useState(null);

  // Management Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Edit Set State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSetName, setEditSetName] = useState('');
  const [editSetYear, setEditSetYear] = useState('');
  const [editSetDescription, setEditSetDescription] = useState('');
  const [isUpdatingSet, setIsUpdatingSet] = useState(false);

  // Overview Report
  const [overview, setOverview] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('');
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  const token = Cookies.get('usertoken');

  const fetchPyqSets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/pyq-sets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setPyqSets(response.data.pyq_sets || []);
      }
    } catch (err) {
      console.error('Error fetching PYQ sets:', err);
      toast.error('Failed to load PYQ sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyqSets();
  }, []);

  const handleSetClick = async (set) => {
    setSelectedSet(set);
    setDetailLoading(true);
    setActiveTab('questions');
    setSearchTerm('');
    setExpandedExplanations({});
    setFile(null);
    setOverview('');
    setChatHistory([]);
    setChatSessionId('');
    
    try {
      // Fetch Questions
      const questionsRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${set.pyq_set_id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (questionsRes.data && questionsRes.data.success) {
        const fetchedQuestions = questionsRes.data.questions || [];
        setQuestions(fetchedQuestions);
        setSelectedSet(prev => ({
          ...prev,
          question_count: fetchedQuestions.length
        }));
      }

      // Fetch Reels
      const reelsRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${set.pyq_set_id}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reelsRes.data && reelsRes.data.success) {
        setReels(reelsRes.data.reels || []);
      }
    } catch (err) {
      console.error('Error fetching set details:', err);
      toast.error('Failed to load questions and reels');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateSet = async (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    try {
      setIsCreating(true);
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets`, { name: newSetName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('PYQ Set created successfully!');
        setNewSetName('');
        setShowCreateModal(false);
        fetchPyqSets();
      }
    } catch (err) {
      console.error('Error creating set:', err);
      toast.error('Failed to create PYQ set');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', file);
      
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/upload-pdf`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        toast.success('Questions file uploaded and parsed successfully!');
        setFile(null);
        handleSetClick(selectedSet);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Failed to parse questions sheet');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateScript = async () => {
    try {
      setIsGeneratingScript(true);
      toast.info('Generating AI script transcript. Please wait...', { autoClose: 4000 });
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyqs/${selectedSet.pyq_set_id}/generate-transcript`, { language: 'English' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('AI script and reels generated successfully!');
        handleSetClick(selectedSet);
      }
    } catch (err) {
      console.error('Error generating script:', err);
      toast.error('Failed to generate AI transcript script');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleUpdateSet = async (e) => {
    e.preventDefault();
    if (!editSetName.trim()) return;
    try {
      setIsUpdatingSet(true);
      const res = await axios.put(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}`, {
        name: editSetName,
        year: editSetYear ? parseInt(editSetYear) : null,
        description: editSetDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('PYQ Set updated successfully!');
        setSelectedSet({ ...selectedSet, name: editSetName, year: editSetYear, description: editSetDescription });
        setShowEditModal(false);
        fetchPyqSets();
      }
    } catch (err) {
      console.error('Error updating set:', err);
      toast.error('Failed to update set');
    } finally {
      setIsUpdatingSet(false);
    }
  };

  const openEditModal = () => {
    setEditSetName(selectedSet.name || '');
    setEditSetYear(selectedSet.year || '');
    setEditSetDescription(selectedSet.description || '');
    setShowEditModal(true);
  };

  const handleDeleteSet = async () => {
    if (!window.confirm('Are you sure you want to delete this PYQ set? This will delete all parsed questions and video reels.')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('PYQ Set deleted successfully!');
        handleBack();
        fetchPyqSets();
      }
    } catch (err) {
      console.error('Error deleting set:', err);
      toast.error('Failed to delete set');
    }
  };

  const handleResetSet = async () => {
    if (!window.confirm('Are you sure you want to reset this PYQ Set? All parsed questions and reels will be cleared.')) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('PYQ Set reset successfully!');
        setSelectedSet(prev => ({
          ...prev,
          question_count: 0
        }));
        handleSetClick(selectedSet);
      }
    } catch (err) {
      console.error('Error resetting set:', err);
      toast.error('Failed to reset PYQ set');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/pyq-sets/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Question deleted successfully!');
        setQuestions(prev => {
          const updated = prev.filter(q => q.question_id !== questionId);
          setSelectedSet(selected => ({
            ...selected,
            question_count: updated.length
          }));
          return updated;
        });
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error('Failed to delete question');
    }
  };

  const handleGenerateOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/generate-overview`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('AI overview generated successfully!');
        setSelectedSet(prev => ({ ...prev, overview_generated: true }));
        setOverview(res.data.overview || 'AI Overview analysis compiled.');
      }
    } catch (err) {
      console.error('Error generating overview:', err);
      toast.error('Failed to generate overview report');
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleVectorize = async () => {
    try {
      setIsVectorizing(true);
      toast.info('Training AI Chatbot on this set. Please wait...', { autoClose: 3000 });
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/vectorize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('AI Chatbot trained successfully!');
        setSelectedSet(prev => ({ ...prev, overview_generated: true }));
      }
    } catch (err) {
      console.error('Error vectorizing set:', err);
      toast.error('Failed to train AI Chatbot');
    } finally {
      setIsVectorizing(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setChatHistory(res.data.history || []);
        if (res.data.session_id) setChatSessionId(res.data.session_id);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSendChat = async (e, speechText = '') => {
    if (e) e.preventDefault();
    const finalMsg = speechText || chatMessage;
    if (!finalMsg.trim()) return;
    
    const userMsg = { role: 'user', message: finalMsg, created_at: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    if (!speechText) setChatMessage('');
    
    try {
      setChatLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/chat`, {
        question: finalMsg,
        session_id: chatSessionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        const botMsg = { role: 'assistant', message: res.data.reply || res.data.message || res.data.answer, created_at: new Date().toISOString() };
        setChatHistory(prev => [...prev, botMsg]);
        if (res.data.session_id) setChatSessionId(res.data.session_id);
      }
    } catch (err) {
      console.error('Error in chat:', err);
      toast.error('AI Chatbot failed to respond');
    } finally {
      setChatLoading(false);
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
        handleSendChat(null, speechToText);
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

  const handleClearChatHistory = async () => {
    if (!window.confirm('Clear all chat messages?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/pyq-sets/${selectedSet.pyq_set_id}/chat/history`, {
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

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/pyq-sets/reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Reel deleted successfully!');
        setReels(prev => prev.filter(r => r.reel_id !== reelId));
      }
    } catch (err) {
      console.error('Error deleting reel:', err);
      toast.error('Failed to delete reel');
    }
  };

  const toggleExplanation = (questionId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleBack = () => {
    setSelectedSet(null);
    setQuestions([]);
    setReels([]);
    setShowChatDrawer(false);
    if (window.currentAudio) window.currentAudio.pause();
  };

  // Filter questions by search term
  const filteredQuestions = questions.filter(q => 
    (q.question_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.correct_answer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.explanation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Previous Year Question Sets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 1. Sets Grid View */}
      {!selectedSet ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <HelpCircle className="mr-3 text-indigo-600" size={32} />
                AI PYQs
              </h1>
              <p className="text-gray-600 mt-1">Practice and analyze Previous Years Questions (PYQs) with AI guidance.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-200 text-sm font-semibold"
              >
                <Plus size={18} className="mr-1.5" />
                Create PYQ Set
              </button>
              <button
                onClick={fetchPyqSets}
                className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition duration-200 text-sm font-medium"
              >
                <RefreshCw className="mr-2 text-gray-500" size={16} />
                Refresh Sets
              </button>
            </div>
          </div>

          {pyqSets.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <HelpCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-800">No PYQ Sets Found</h3>
              <p className="text-gray-500 mt-1">Click the "Create PYQ Set" button above to add a new set.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pyqSets.map((set) => (
                <div
                  key={set.pyq_set_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition duration-200"
                  onClick={() => handleSetClick(set)}
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 font-bold">
                      PYQ
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{set.name}</h3>
                    <p className="text-indigo-600 font-semibold text-sm mt-3 flex items-center">
                      <BookOpen size={16} className="mr-1.5" />
                      {set.question_count || 0} Questions
                    </p>
                  </div>
                  <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center text-xs text-gray-400">
                    <span>Created: {new Date(set.created_at).toLocaleDateString()}</span>
                    {set.overview_generated && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded">
                        AI Enabled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* 2. Set Detail View */
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-800">{selectedSet.name}</h1>
                  <button
                    onClick={openEditModal}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition"
                    title="Edit Set Info"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={handleResetSet}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-amber-600 transition"
                    title="Reset Questions"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={handleDeleteSet}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition"
                    title="Delete Set"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-indigo-600 font-semibold mt-0.5 flex items-center">
                  Total {selectedSet.question_count || 0} questions parsed by AI {selectedSet.year ? `| Year: ${selectedSet.year}` : ''}
                </p>
              </div>
            </div>

            {/* Actions & Tab Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerateOverview}
                disabled={overviewLoading || questions.length === 0}
                className="flex items-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                <Sparkles size={16} className="mr-1.5" />
                {overviewLoading ? 'Analyzing Overview...' : 'AI Overview Report'}
              </button>

              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || questions.length === 0}
                className="flex items-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                <Cpu size={16} className="mr-1.5" />
                {isGeneratingScript ? 'Generating AI...' : 'Generate AI Script & Reels'}
              </button>

              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition ${
                    activeTab === 'questions'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpen size={16} className="mr-2" />
                  Questions
                </button>
                <button
                  onClick={() => setActiveTab('reels')}
                  className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition ${
                    activeTab === 'reels'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Film size={16} className="mr-2" />
                  Video Reels ({reels.length})
                </button>
                <button
                  onClick={() => { setShowChatDrawer(true); fetchChatHistory(); }}
                  className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition ${
                    showChatDrawer
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare size={16} className="mr-2" />
                  AI Chatbot
                </button>
              </div>
            </div>
          </div>

          {/* PDF context Upload Segment */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Upload Questions Sheet (PDF or Excel)</h3>
            <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".pdf,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Upload size={14} className="mr-1.5" />
                {isUploading ? 'Parsing sheet...' : 'Upload & Parse'}
              </button>
            </form>
          </div>

          {/* AI Overview Analysis Display */}
          {(overview || selectedSet.overview) && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-800 mb-2 flex items-center">
                <Sparkles size={16} className="mr-1.5" />
                AI Topic breakdown Analysis Overview:
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                {overview || selectedSet.overview}
              </p>
            </div>
          )}

          {/* Loader for Details */}
          {detailLoading ? (
            <div className="flex flex-col justify-center items-center h-80 space-y-4 bg-white border rounded-xl">
              <RefreshCw className="animate-spin text-indigo-600" size={36} />
              <p className="text-gray-500 font-medium">Extracting Questions list...</p>
            </div>
          ) : activeTab === 'questions' ? (
            /* Questions Tab content */
            <>
              {/* Search Questions */}
              <div className="relative w-full max-w-md mb-6">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search questions by text or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                  <BookOpen className="mx-auto text-gray-300 mb-4" size={40} />
                  <h3 className="text-lg font-bold text-gray-800">No questions found</h3>
                  <p className="text-gray-500 mt-1">Upload a PDF/Excel sheet above to populate questions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredQuestions.map((q, idx) => (
                    <div key={q.question_id} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                      <button
                        onClick={() => handleDeleteQuestion(q.question_id)}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-start space-x-3 pr-8">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          Q{idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-800 font-semibold text-base leading-relaxed whitespace-pre-line">
                            {q.question_text}
                          </p>
                          
                          {/* Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              {q.options.map((opt, oIdx) => {
                                const optionLetter = String.fromCharCode(65 + oIdx);
                                const isCorrect = opt.startsWith(q.correct_answer) || opt.includes(q.correct_answer);
                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-3 rounded-lg border text-sm flex items-center transition ${
                                      isCorrect
                                        ? 'bg-green-50 border-green-300 text-green-900 font-medium'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2.5 ${
                                      isCorrect
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {optionLetter}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Footer options */}
                          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center">
                              <CheckCircle size={14} className="mr-1" />
                              Correct Answer: {q.correct_answer}
                            </span>
                            
                            <button
                              onClick={() => toggleExplanation(q.question_id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center"
                            >
                              <QuestionIcon size={14} className="mr-1" />
                              {expandedExplanations[q.question_id] ? 'Hide AI Explanation' : 'View AI Explanation'}
                            </button>
                          </div>

                          {/* Explanation Block */}
                          {expandedExplanations[q.question_id] && (
                            <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-gray-700 leading-relaxed">
                              <span className="font-bold text-indigo-800 block mb-1">AI Explanation:</span>
                              <p className="whitespace-pre-line">{q.explanation || 'No explanation available.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Reels Tab content */
            reels.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                <Film className="mx-auto text-gray-300 mb-4" size={40} />
                <h3 className="text-lg font-bold text-gray-800">No video reels generated</h3>
                <p className="text-gray-500 mt-1">Click the "Generate AI Script & Reels" button at the top to compile study videos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reels.map((reel) => (
                  <div
                    key={reel.reel_id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                  >
                    {/* Media Thumbnail Placeholder */}
                    <div 
                      className="relative bg-gradient-to-br from-indigo-600 to-purple-700 h-44 flex flex-col justify-between p-4 text-white cursor-pointer"
                      onClick={() => setSelectedReel(reel)}
                    >
                      <Film size={20} className="opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition duration-200">
                          <Play size={22} className="text-white fill-current" />
                        </div>
                      </div>
                      <span className="text-[10px] bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded self-start font-mono">
                        REEL PLAY
                      </span>
                    </div>

                    {/* Script details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3 italic">
                        "{reel.script || 'No transcript speech script found.'}"
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedReel(reel)}
                          className="flex-1 bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-100 transition"
                        >
                          Play Reel
                        </button>
                        <button
                          onClick={() => handleDeleteReel(reel.reel_id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* 3. Create PYQ Set Modal dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New PYQ Set</h3>
            <form onSubmit={handleCreateSet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Set Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPSC Prelims 2025 GS1"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newSetName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.1 Edit PYQ Set Modal dialog */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit PYQ Set</h3>
            <form onSubmit={handleUpdateSet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Set Name
                </label>
                <input
                  type="text"
                  value={editSetName}
                  onChange={(e) => setEditSetName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2025"
                  value={editSetYear}
                  onChange={(e) => setEditSetYear(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="e.g. Past Year Paper analysis for State PSC..."
                  value={editSetDescription}
                  onChange={(e) => setEditSetDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isUpdatingSet}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSet || !editSetName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isUpdatingSet ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Video Player Modal overlay */}
      {selectedReel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedReel(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full z-10 transition"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col md:flex-row h-auto md:h-[480px]">
              {/* Video Player */}
              <div className="w-full md:w-1/2 bg-black flex items-center justify-center h-80 md:h-full">
                <video
                  src={selectedReel.media_url || selectedReel.video_url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full"
                />
              </div>
              {/* Reel script details */}
              <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto no-scrollbar justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <Film className="mr-2 text-indigo-600" size={20} />
                    Reel Narration Script
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                    "{selectedReel.script || 'No transcript text available.'}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t text-xs text-gray-400 flex justify-between">
                  <span>Reel ID: {selectedReel.reel_id.substring(0, 12)}...</span>
                  <span>Created: {new Date(selectedReel.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot Drawer Overlay */}
      {showChatDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col relative animate-slide-in animate-duration-200">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center">
                  <MessageSquare className="mr-2 text-indigo-600" size={18} />
                  Chat with {selectedSet.name} AI Guide
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">AI assistant powered by paper context</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVectorize}
                  disabled={isVectorizing || questions.length === 0}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                    isVectorizing
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-400 cursor-not-allowed'
                      : 'bg-white border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                  title="Train AI Chatbot on this set"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVectorizing ? 'animate-spin' : ''}`} />
                  <span>{isVectorizing ? 'Training...' : 'Train AI'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowChatDrawer(false);
                    if (window.currentAudio) window.currentAudio.pause();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-150 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 flex flex-col no-scrollbar">
              {!selectedSet.overview_generated && chatHistory.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full flex-1 text-center py-8">
                  <Cpu className="text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-800">AI Chatbot Training Required</h3>
                  <p className="text-gray-500 max-w-sm mt-1 mb-6 text-sm">
                    Train the chatbot on this PYQ set questions and context PDF to start asking doubts.
                  </p>
                  <button
                    onClick={handleVectorize}
                    disabled={isVectorizing || questions.length === 0}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow disabled:opacity-50 transition"
                  >
                    <Sparkles className="mr-2" size={16} />
                    {isVectorizing ? 'Training AI Chatbot...' : 'Train AI Chatbot'}
                  </button>
                </div>
              ) : isHistoryLoading ? (
                <div className="flex justify-center items-center h-full flex-1">
                  <RefreshCw className="animate-spin text-indigo-600" size={24} />
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
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
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
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input form footer */}
            {(selectedSet.overview_generated || chatHistory.length > 0) && (
              <div className="p-4 border-t bg-white flex flex-col gap-2">
                <form onSubmit={(e) => handleSendChat(e)} className="flex gap-2 items-center">
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
                    placeholder="Ask AI Guide about this paper..."
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
                    onClick={handleClearChatHistory}
                    className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center justify-center mt-1 transition self-center"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Clear Chat History
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPyqs;
