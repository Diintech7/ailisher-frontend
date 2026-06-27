import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, ArrowLeft, Layers, ChevronRight, FileText, Loader2, Plus, X, Edit, Trash2, MessageSquare, Send, Mic, Volume2, Wand2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomPaperDetail = () => {
  const { examId, paperId } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const [exam, setExam] = useState(null);
  const [paper, setPaper] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingStructure, setGeneratingStructure] = useState(false);

  // CRUD Modals for Subject
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#6366f1'); // Default indigo
  const [newSubjectImageUrl, setNewSubjectImageUrl] = useState('');
  const [newSubjectFile11, setNewSubjectFile11] = useState(null);
  const [newSubjectFile916, setNewSubjectFile916] = useState(null);
  const [newSubjectFile169, setNewSubjectFile169] = useState(null);
  const [submittingSubject, setSubmittingSubject] = useState(false);

  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    name: '',
    color: '#6366f1',
    image_url: '',
    image_url_1_1: '',
    image_url_9_16: '',
    image_url_16_9: ''
  });
  const [updatingSubject, setUpdatingSubject] = useState(false);
  const [uploadingSubject11, setUploadingSubject11] = useState(false);
  const [uploadingSubject916, setUploadingSubject916] = useState(false);
  const [uploadingSubject169, setUploadingSubject169] = useState(false);

  // AI Chatbot Drawer State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  
  // Voice Settings for Azure Neural TTS
  const [selectedVoice, setSelectedVoice] = useState('hi-IN-SwaraNeural'); // default to Swara Neural for Indian students
  const [autoPlayTTS, setAutoPlayTTS] = useState(true);

  const voicesList = [
    { id: 'hi-IN-SwaraNeural', name: 'Hindi Female (Swara)' },
    { id: 'hi-IN-MadhurNeural', name: 'Hindi Male (Madhur)' },
    { id: 'en-IN-NeerjaNeural', name: 'English Female (Neerja)' },
    { id: 'en-IN-PrabhatNeural', name: 'English Male (Prabhat)' }
  ];

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch exam metadata
      const examRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (examRes.data && examRes.data.success) {
        setExam(examRes.data.exam);
      }

      // 2. Fetch papers list and find specific paper info
      const papersRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/papers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (papersRes.data && papersRes.data.success) {
        const foundPaper = (papersRes.data.papers || []).find(p => p.paper_id === paperId);
        setPaper(foundPaper);
      }

      // 3. Fetch subjects for the current paper
      await fetchSubjects();
    } catch (err) {
      console.error('Error fetching paper detail view:', err);
      toast.error('Failed to load paper detailed syllabus');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const subRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/papers/${paperId}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (subRes.data && subRes.data.success) {
        setSubjects(subRes.data.subjects || []);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      toast.error('Failed to reload subjects list');
    }
  };

  useEffect(() => {
    fetchPaperDetails();
  }, [examId, paperId]);

  // Auto-Generate structure handler
  const handleAutoGenerate = async () => {
    if (!window.confirm('Do you want AI to automatically generate the complete Subject & Chapter structure for this paper? This will overwrite or add to existing subjects.')) return;
    
    try {
      setGeneratingStructure(true);
      toast.info('AI is analyzing paper syllabus and generating topics. This may take about a minute. Please wait...');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/papers/${paperId}/auto-generate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('AI syllabus structure generated successfully!');
        await fetchSubjects();
      } else {
        toast.error('AI generation was successful but didn\'t return expected structure. Reloading...');
        await fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to auto-generate structure:', err);
      toast.error(err.response?.data?.message || 'Failed to auto-generate structure');
    } finally {
      setGeneratingStructure(false);
    }
  };

  // Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      setSubmittingSubject(true);

      // Step 1: Create the subject to get subject_id
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/papers/${paperId}/subjects`,
        {
          name: newSubjectName,
          color: newSubjectColor,
          image_url: newSubjectImageUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        const createdSubjectId = response.data.subject?.subject_id;

        // Step 2: Upload any pending image files to R2
        if (createdSubjectId && (newSubjectFile11 || newSubjectFile916 || newSubjectFile169)) {
          toast.info('Uploading images to R2...', { autoClose: 2000 });
          const formData = new FormData();
          if (newSubjectFile11) formData.append('image_1_1', newSubjectFile11);
          if (newSubjectFile916) formData.append('image_9_16', newSubjectFile916);
          if (newSubjectFile169) formData.append('image_16_9', newSubjectFile169);

          try {
            await axios.post(
              `${API_BASE_URL}/api/classroom-exams/subjects/${createdSubjectId}/images`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          } catch (imgErr) {
            console.error('Image upload failed but subject was created:', imgErr);
            toast.warning('Subject created, but image upload failed. You can re-upload via Edit.');
          }
        }

        toast.success('Subject created successfully!');
        setNewSubjectName('');
        setNewSubjectColor('#6366f1');
        setNewSubjectImageUrl('');
        setNewSubjectFile11(null);
        setNewSubjectFile916(null);
        setNewSubjectFile169(null);
        setShowAddSubjectModal(false);
        await fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to create subject:', err);
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSubmittingSubject(false);
    }
  };

  // Edit Subject trigger
  const handleEditSubjectClick = (e, subject) => {
    e.stopPropagation();
    setSelectedSubject(subject);
    setEditSubjectForm({
      name: subject.name || '',
      color: subject.color || '#6366f1',
      image_url: subject.image_url || subject.image_url_1_1 || '',
      image_url_1_1: subject.image_url_1_1 || subject.image_url || '',
      image_url_9_16: subject.image_url_9_16 || '',
      image_url_16_9: subject.image_url_16_9 || ''
    });
    setShowEditSubjectModal(true);
  };

  // Upload Subject Image
  const handleUploadSubjectImage = async (field, file) => {
    if (!file) return;
    const ratioLabel = field.replace('image_', '');
    const setter = ratioLabel === '1_1' ? setUploadingSubject11 : ratioLabel === '9_16' ? setUploadingSubject916 : setUploadingSubject169;
    
    try {
      setter(true);
      const formData = new FormData();
      formData.append(field, file);
      
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams/subjects/${selectedSubject.subject_id}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        toast.success(`Image (${ratioLabel.replace('_', ':')}) uploaded successfully!`);
        const targetKey = ratioLabel === '1_1' ? 'image_url' : `image_url_${ratioLabel}`;
        const newUrl = response.data.urls[targetKey];
        setEditSubjectForm(prev => ({
          ...prev,
          [targetKey]: newUrl,
          ...(ratioLabel === '1_1' ? { image_url_1_1: newUrl } : {})
        }));
      }
    } catch (err) {
      console.error(`Failed to upload ${ratioLabel} image:`, err);
      toast.error(`Failed to upload ${ratioLabel} image`);
    } finally {
      setter(false);
    }
  };

  // Update Subject
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editSubjectForm.name.trim() || !selectedSubject) return;

    try {
      setUpdatingSubject(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/classroom-exams/subjects/${selectedSubject.subject_id}`,
        editSubjectForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Subject updated successfully!');
        setShowEditSubjectModal(false);
        setSelectedSubject(null);
        await fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
      toast.error('Failed to update subject');
    } finally {
      setUpdatingSubject(false);
    }
  };

  // Toggle Subject Visibility
  const handleToggleSubjectStatus = async (e, subjectId) => {
    e.stopPropagation();
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/classroom-exams/subjects/${subjectId}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Status updated');
        setSubjects(prev =>
          prev.map(s =>
            s.subject_id === subjectId ? { ...s, isEnabled: response.data.isEnabled } : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle subject status:', err);
      toast.error('Failed to toggle subject status');
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (e, subjectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Subject? This will remove all nested Chapters, Topics, and Subtopics.')) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/classroom-exams/subjects/${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Subject deleted successfully!');
        await fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      toast.error('Failed to delete subject');
    }
  };

  // Navigate to chapters
  const handleSubjectClick = (subjectId) => {
    navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`);
  };

  // ==========================================
  // Chatbot Drawer Handlers
  // ==========================================
  const handleOpenPaperChat = async () => {
    setShowChatModal(true);
    setChatHistory([]);
    setChatSessionId('');
    
    try {
      setIsHistoryLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/classroom-exams/papers/${paperId}/chat/history`, {
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
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/papers/${paperId}/chat`, {
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

        // Auto-play voice output if toggled
        if (autoPlayTTS) {
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
    try {
      setIsVectorizing(true);
      toast.info('Training AI Chatbot on this paper. Please wait...', { autoClose: 3000 });
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/papers/${paperId}/vectorize`, {}, {
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
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/papers/${paperId}/chat/history`, {
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
      // Pass the selected voice (Azure voice id) correctly to avoid alloy voice fallback issues
      const audioUrl = `${API_BASE_URL}/api/classroom-exams/tts/speak?text=${encodeURIComponent(text)}&voice=${selectedVoice}`;
      const audio = new Audio(audioUrl);
      window.currentAudio = audio;
      audio.play().catch(err => {
        console.error('Failed to play Azure TTS audio:', err);
        toast.error('Unable to play voice response');
      });
    } catch (err) {
      console.error('TTS Playback Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading syllabus structure...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-col space-y-2 mb-6">
        <button
          onClick={() => navigate(`/classroom/${examId}`)}
          className="text-indigo-600 hover:text-indigo-700 flex items-center font-medium transition self-start"
        >
          <ArrowLeft className="mr-1" size={16} />
          <span>Back to Paper List</span>
        </button>
        
        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-150 self-start">
          <span className="hover:text-indigo-600 cursor-pointer font-medium" onClick={() => navigate('/classroom')}>Classrooms</span>
          <ChevronRight size={12} className="mx-1.5 text-gray-400" />
          <span className="hover:text-indigo-600 cursor-pointer font-medium" onClick={() => navigate(`/classroom/${examId}`)}>{exam?.name || 'Classroom'}</span>
          <ChevronRight size={12} className="mx-1.5 text-gray-400" />
          <span className="font-semibold text-gray-700 truncate max-w-[200px]">{paper?.name || 'Paper Details'}</span>
        </div>
      </div>

      {/* Paper Hero Header */}
      {paper && (
        <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6 mb-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 z-10 relative">
            {/* Left Cover image placeholder */}
            <div className="md:w-1/4 lg:w-1/5 flex-shrink-0">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg h-40 flex items-center justify-center overflow-hidden relative">
                {(paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url) ? (
                  <img
                    src={
                      (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url).startsWith('http')
                        ? (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url)
                        : `${API_BASE_URL}${paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url}`
                    }
                    alt={paper.name}
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
                  style={{ display: (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url) ? 'none' : 'flex' }}
                >
                  {paper.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Right Information & Action area */}
            <div className="md:w-3/4 lg:w-4/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {exam?.category || 'Syllabus'}
                </span>
                <h1 className="text-3xl font-extrabold text-gray-800 mt-2 flex items-center">
                  <FileText className="text-indigo-600 mr-2" size={28} />
                  {paper.name}
                </h1>
                <p className="text-gray-500 mt-2 text-sm max-w-2xl leading-relaxed">
                  Configure syllabus structure, auto-generate topics using AI, and manage student learning modules for this paper.
                </p>
              </div>

              {/* Action Buttons Panel */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleAutoGenerate}
                  disabled={generatingStructure}
                  className="flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-emerald-100 transition text-sm disabled:opacity-50"
                >
                  {generatingStructure ? (
                    <Loader2 className="mr-2 animate-spin" size={15} />
                  ) : (
                    <Wand2 className="mr-2" size={15} />
                  )}
                  Auto-Generate Syllabus
                </button>

                <button
                  onClick={handleOpenPaperChat}
                  className="flex items-center bg-indigo-50 text-indigo-650 border border-indigo-200 font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-indigo-100 transition text-sm"
                >
                  <MessageSquare className="mr-2" size={15} />
                  Paper AI Chatbot
                </button>

                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="flex items-center bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition text-sm"
                >
                  <Plus className="mr-2" size={15} />
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Subject Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-850 mb-6 flex items-center">
          <Layers className="text-indigo-600 mr-2" size={20} />
          Subjects inside Paper
        </h2>

        {subjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <Layers className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">No Subjects found</h3>
            <p className="text-gray-500 mt-1">Please add a subject manually or click "Auto-Generate Syllabus" to populate structure using AI.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.subject_id}
                className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between group relative ${subject.isEnabled === false ? 'opacity-55 grayscale-[30%]' : ''}`}
                style={{ borderLeft: `4px solid ${subject.color || '#6366f1'}` }}
              >
                {/* Hover actions panel */}
                <div className="absolute top-3 right-3 z-10 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleSubjectStatus(e, subject.subject_id)}
                    className={`p-1.5 bg-white border rounded-lg shadow-sm transition ${
                      subject.isEnabled === false
                        ? 'border-gray-200 text-gray-400 hover:text-indigo-600'
                        : 'border-emerald-200 text-emerald-600 hover:text-gray-500'
                    }`}
                    title={subject.isEnabled === false ? 'Enable Subject (Hidden from Students)' : 'Disable Subject (Hide from Students)'}
                  >
                    {subject.isEnabled === false ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={(e) => handleEditSubjectClick(e, subject)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 shadow-sm transition"
                    title="Edit Subject"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSubject(e, subject.subject_id)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-650 shadow-sm transition"
                    title="Delete Subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Card Body */}
                <div onClick={() => handleSubjectClick(subject.subject_id)}>
                  {/* Cover Image Container */}
                  <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                    {(subject.image_url_16_9 || subject.image_url_1_1 || subject.image_url_9_16 || subject.image_url) ? (
                      <img
                        src={
                          (subject.image_url_16_9 || subject.image_url_1_1 || subject.image_url_9_16 || subject.image_url).startsWith('http')
                            ? (subject.image_url_16_9 || subject.image_url_1_1 || subject.image_url_9_16 || subject.image_url)
                            : `${API_BASE_URL}${subject.image_url_16_9 || subject.image_url_1_1 || subject.image_url_9_16 || subject.image_url}`
                        }
                        alt={subject.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center text-gray-400 font-extrabold text-3xl opacity-15 select-none uppercase"
                      style={{ display: (subject.image_url_16_9 || subject.image_url_1_1 || subject.image_url_9_16 || subject.image_url) ? 'none' : 'flex' }}
                    >
                      {subject.name.substring(0, 2)}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition truncate flex items-center gap-2">
                      {subject.name}
                      {subject.isEnabled === false && (
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0">
                          <EyeOff size={8} />
                          Hidden
                        </span>
                      )}
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
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAddSubjectModal(false);
                setNewSubjectName('');
                setNewSubjectFile11(null);
                setNewSubjectFile916(null);
                setNewSubjectFile169(null);
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
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., Physics, Organic Chemistry"
                  />
                </div>

                {/* R2 Aspect Ratio Image Uploaders */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aspect Ratio Images (R2 Storage)</h4>
                  <p className="text-[10px] text-gray-400 mb-3">Images will be uploaded after the subject is created.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1:1 Square */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">1:1 Square</span>
                      <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {newSubjectFile11 ? (
                          <img src={URL.createObjectURL(newSubjectFile11)} alt="1:1" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {newSubjectFile11 ? '✓ Ready' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setNewSubjectFile11(e.target.files[0] || null)}
                        />
                      </label>
                    </div>

                    {/* 9:16 Portrait */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">9:16 Portrait</span>
                      <div className="w-10 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {newSubjectFile916 ? (
                          <img src={URL.createObjectURL(newSubjectFile916)} alt="9:16" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {newSubjectFile916 ? '✓ Ready' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setNewSubjectFile916(e.target.files[0] || null)}
                        />
                      </label>
                    </div>

                    {/* 16:9 Landscape */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">16:9 Banner</span>
                      <div className="w-18 h-10 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner my-3">
                        {newSubjectFile169 ? (
                          <img src={URL.createObjectURL(newSubjectFile169)} alt="16:9" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {newSubjectFile169 ? '✓ Ready' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setNewSubjectFile169(e.target.files[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectName('');
                    setNewSubjectFile11(null);
                    setNewSubjectFile916(null);
                    setNewSubjectFile169(null);
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
                  {submittingSubject ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Edit Subject Modal */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative animate-in fade-in zoom-in-95 duration-200">
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
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., Physics"
                  />
                </div>

                {/* Custom Aspect Ratios Uploader */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aspect Ratio Images (R2 Storage)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1:1 Square Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">1:1 Square</span>
                      <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {uploadingSubject11 ? (
                          <Loader2 className="animate-spin text-indigo-650" size={18} />
                        ) : (editSubjectForm.image_url_1_1 || editSubjectForm.image_url) ? (
                          <img src={editSubjectForm.image_url_1_1 || editSubjectForm.image_url} alt="1:1" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingSubject11 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadSubjectImage('image_1_1', e.target.files[0])}
                          disabled={uploadingSubject11}
                        />
                      </label>
                    </div>

                    {/* 9:16 Portrait Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">9:16 Portrait</span>
                      <div className="w-10 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {uploadingSubject916 ? (
                          <Loader2 className="animate-spin text-indigo-650" size={18} />
                        ) : editSubjectForm.image_url_9_16 ? (
                          <img src={editSubjectForm.image_url_9_16} alt="9:16" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingSubject916 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadSubjectImage('image_9_16', e.target.files[0])}
                          disabled={uploadingSubject916}
                        />
                      </label>
                    </div>

                    {/* 16:9 Landscape Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-650">16:9 Banner</span>
                      <div className="w-18 h-10 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner my-3">
                        {uploadingSubject169 ? (
                          <Loader2 className="animate-spin text-indigo-650" size={18} />
                        ) : editSubjectForm.image_url_16_9 ? (
                          <img src={editSubjectForm.image_url_16_9} alt="16:9" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingSubject169 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadSubjectImage('image_16_9', e.target.files[0])}
                          disabled={uploadingSubject169}
                        />
                      </label>
                    </div>
                  </div>
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
      {showChatModal && paper && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col relative animate-slide-in animate-duration-200">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center">
                  <MessageSquare className="mr-2 text-indigo-600" size={18} />
                  Chat with {paper.name} AI
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

            {/* Voice Settings Dropdown Inside Chat Panel */}
            <div className="px-4 py-2 border-b bg-indigo-50/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-500 font-semibold">TTS Voice:</span>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {voicesList.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <input
                  type="checkbox"
                  id="autoPlayCheck"
                  checked={autoPlayTTS}
                  onChange={(e) => setAutoPlayTTS(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="autoPlayCheck" className="text-gray-600 font-semibold cursor-pointer select-none">
                  Auto-Play Speak
                </label>
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
                      ? 'bg-red-50 text-red-650 border-red-200 animate-pulse'
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

export default ClassroomPaperDetail;
