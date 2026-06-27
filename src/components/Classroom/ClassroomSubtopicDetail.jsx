import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, FileText, ChevronRight, Hash, Loader2, Plus, X, Video, RefreshCw, Volume2, Globe, HelpCircle, CheckCircle, XCircle, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import MDEditor from '@uiw/react-md-editor';
import { API_BASE_URL } from '../../config';

const ClassroomSubtopicDetail = () => {
  const { examId, paperId, subjectId, chapterId, topicId } = useParams();
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topic, setTopic] = useState(null);

  // Subtopics list and Selected detail state
  const [subtopics, setSubtopics] = useState([]);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [reels, setReels] = useState([]);
  const [topicReels, setTopicReels] = useState([]);
  const [isTopicView, setIsTopicView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'reels' | 'quiz'

  // Generators configuration
  const [genLanguage, setGenLanguage] = useState('English');
  const [genVoice, setGenVoice] = useState('female');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [generatingReel, setGeneratingReel] = useState(false);

  // Quiz State Variables
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizError, setQuizError] = useState('');

  // Add Subtopic CRUD Modal State
  const [showAddSubtopicModal, setShowAddSubtopicModal] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [newSubtopicDesc, setNewSubtopicDesc] = useState('');
  const [submittingSubtopic, setSubmittingSubtopic] = useState(false);

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const formatMarkdown = (text) => {
    if (!text) return '';
    // Replace escaped newlines with actual newlines
    return text.replace(/\\n/g, '\n');
  };

  const fetchMetadataAndSubtopics = async () => {
    try {
      setLoading(true);
      // 1. Fetch exam/paper/subject/chapter/topic metadata
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
        const foundTopic = foundChapter?.topics?.find(t => t.topic_id === topicId);
        setTopic(foundTopic);
      }

      // 1.1 Fetch topic reels (if any)
      let initialTopicReels = [];
      try {
        const topicReelsRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/topics/${topicId}/reels`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (topicReelsRes.data && topicReelsRes.data.success) {
          initialTopicReels = topicReelsRes.data.reels || [];
          setTopicReels(initialTopicReels);
        }
      } catch (err) {
        console.error('Error fetching topic-level reels:', err);
      }

      // 2. Fetch subtopics list and load details for the first one
      await fetchSubtopicsOnly(true, initialTopicReels);
    } catch (err) {
      console.error('Error fetching subtopic details:', err);
      toast.error('Failed to load study contents');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtopicsOnly = async (selectFirst = false, currentTopicReels = topicReels) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/topics/${topicId}/subtopics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        const list = response.data.subtopics || [];
        setSubtopics(list);
        if (list.length > 0) {
          if (selectFirst || !activeSubtopic) {
            setIsTopicView(false);
            setActiveSubtopic(list[0]);
            await fetchSubtopicDetails(list[0].subtopic_id);
          } else {
            // Find currently active subtopic in fresh list and reload it
            const matched = list.find(s => s.subtopic_id === activeSubtopic.subtopic_id);
            if (matched) {
              setIsTopicView(false);
              setActiveSubtopic(matched);
              await fetchSubtopicDetails(matched.subtopic_id);
            }
          }
        } else {
          // No subtopics synced, select topic view by default if topic reels exist
          if (currentTopicReels && currentTopicReels.length > 0) {
            setIsTopicView(true);
            setActiveSubtopic(null);
            setReels(currentTopicReels);
            setActiveTab('reels');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching subtopics list:', err);
    }
  };

  const fetchSubtopicDetails = async (subtopicId) => {
    try {
      setLoadingDetails(true);
      // Fetch fresh subtopic details (loads database copy)
      const res = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/subtopics/${subtopicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setActiveSubtopic(res.data.subtopic);
      }

      // Fetch reels synced for this subtopic
      const reelsRes = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}/subtopics/${subtopicId}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reelsRes.data && reelsRes.data.success) {
        setReels(reelsRes.data.reels || []);
      }
    } catch (err) {
      console.error('Error fetching subtopic details/reels:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchMetadataAndSubtopics();
  }, [examId, paperId, subjectId, chapterId, topicId]);

  const handleSelectSubtopic = async (sub) => {
    setIsTopicView(false);
    setActiveSubtopic(sub);
    await fetchSubtopicDetails(sub.subtopic_id);
  };

  const handleSelectTopicView = () => {
    setIsTopicView(true);
    setActiveSubtopic(null);
    setReels(topicReels);
    setActiveTab('reels');
  };

  // Reset quiz state when activeSubtopic or isTopicView changes
  useEffect(() => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError('');
  }, [activeSubtopic, isTopicView]);

  const handleGenerateQuiz = async () => {
    try {
      setQuizLoading(true);
      setQuizError('');
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizSubmitted(false);

      const endpoint = isTopicView
        ? `${API_BASE_URL}/api/classroom-exams/topics/${topicId}/quiz/generate`
        : `${API_BASE_URL}/api/classroom-exams/subtopics/${activeSubtopic.subtopic_id}/quiz/generate`;

      const response = await axios.post(
        endpoint,
        {
          num_questions: quizNumQuestions,
          difficulty: quizDifficulty,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.success) {
        setQuizQuestions(response.data.questions || []);
      } else {
        setQuizError('Failed to generate quiz questions.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setQuizError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (questionIndex, option) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(quizAnswers).length === 0) {
      toast.warning('Please answer at least one question before submitting.');
      return;
    }
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError('');
  };

  const handleCreateSubtopic = async (e) => {
    e.preventDefault();
    if (!newSubtopicName.trim()) return;

    try {
      setSubmittingSubtopic(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/topics/${topicId}/subtopics`,
        {
          name: newSubtopicName,
          description: newSubtopicDesc
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        toast.success('Subtopic created successfully!');
        setNewSubtopicName('');
        setNewSubtopicDesc('');
        setShowAddSubtopicModal(false);
        await fetchSubtopicsOnly(false);
      }
    } catch (err) {
      console.error('Failed to create subtopic:', err);
      toast.error(err.response?.data?.message || 'Failed to create subtopic');
    } finally {
      setSubmittingSubtopic(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!activeSubtopic) return;
    try {
      setGeneratingNotes(true);
      toast.info('Generating AI Revision Notes. Please wait...');
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/subtopics/${activeSubtopic.subtopic_id}/generate-notes`,
        { language: genLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        toast.success('Revision Notes generated successfully!');
        await fetchSubtopicDetails(activeSubtopic.subtopic_id);
      }
    } catch (err) {
      console.error('Failed to generate notes:', err);
      toast.error(err.response?.data?.message || 'Failed to generate revision notes');
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleGenerateReel = async () => {
    if (!activeSubtopic) return;
    try {
      setGeneratingReel(true);
      toast.info('Generating AI Video Reel. This may take 1-2 minutes...');
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/subtopics/${activeSubtopic.subtopic_id}/generate-reel`,
        {
          language: genLanguage,
          voice_id: genVoice
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        toast.success('Video Reel generated successfully!');
        await fetchSubtopicDetails(activeSubtopic.subtopic_id);
      }
    } catch (err) {
      console.error('Failed to generate reel:', err);
      toast.error(err.response?.data?.message || 'Failed to generate video reel');
    } finally {
      setGeneratingReel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading study content...</p>
      </div>
    );
  }

  const studyNotesContent = isTopicView 
    ? (topic?.description || '') 
    : (activeSubtopic?.notes || activeSubtopic?.description || '');
  const isDescriptionMarkdown = isTopicView 
    ? (topic?.description && (topic.description.includes('#') || topic.description.includes('\n') || topic.description.includes('\\n')))
    : (activeSubtopic?.description && (activeSubtopic.description.includes('#') || activeSubtopic.description.includes('\n') || activeSubtopic.description.includes('\\n')));

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
      <button
        onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapterId}`)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to Topics
      </button>

      {/* Header breadcrumbs */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center space-x-2 text-xs text-gray-400 font-semibold">
            <span>Classrooms</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}`)}>
              {exam?.name}
            </span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}`)}>
              {paper?.name || 'Paper'}
            </span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`)}>
              {subject?.name}
            </span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapterId}`)}>
              {chapter?.name}
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-1 flex items-center">
            <Hash className="text-blue-600 mr-1.5" size={18} />
            {topic?.name}
          </h2>
        </div>

        {/* Tabs Navigation (Premium Pill Switcher in Header) */}
        {(activeSubtopic || isTopicView) && (
          <div className="bg-gray-100 p-1.5 rounded-xl flex space-x-1 border border-gray-200/50 flex-shrink-0 h-fit">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center transition-all duration-200 ${
                activeTab === 'notes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={16} className="mr-2" />
              Study Notes
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center transition-all duration-200 ${
                activeTab === 'reels'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Video size={16} className="mr-2" />
              Video Reels
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center transition-all duration-200 ${
                activeTab === 'quiz'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HelpCircle size={16} className="mr-2" />
              AI Quiz
            </button>
          </div>
        )}
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Side: Subtopics Checklist / Navigation */}
        <div className="w-full lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col space-y-2 h-auto lg:h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center px-3 mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Notes Subtopics
            </span>
            <button
              onClick={() => setShowAddSubtopicModal(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Add Subtopic"
            >
              <Plus size={16} />
            </button>
          </div>
          {topicReels.length > 0 && (
            <button
              onClick={handleSelectTopicView}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between group mb-2 ${
                isTopicView
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Video size={16} className={isTopicView ? 'text-blue-600' : 'text-gray-400'} />
                <span className="truncate">Topic Video / Overview</span>
              </div>
              <ChevronRight className={`text-gray-300 transition duration-200 group-hover:text-blue-600 ${
                isTopicView ? 'text-blue-600 translate-x-0.5' : ''
              }`} size={16} />
            </button>
          )}
          {subtopics.length === 0 ? (
            topicReels.length === 0 && (
              <div className="text-gray-400 italic text-sm p-3">No notes synced.</div>
            )
          ) : (
            subtopics.map((sub) => (
              <button
                key={sub.subtopic_id}
                onClick={() => handleSelectSubtopic(sub)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between group ${
                  activeSubtopic?.subtopic_id === sub.subtopic_id
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText size={16} className={activeSubtopic?.subtopic_id === sub.subtopic_id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className="truncate">{sub.name}</span>
                </div>
                <ChevronRight className={`text-gray-300 transition duration-200 group-hover:text-blue-600 ${
                  activeSubtopic?.subtopic_id === sub.subtopic_id ? 'text-blue-600 translate-x-0.5' : ''
                }`} size={16} />
              </button>
            ))
          )}
        </div>

        {/* Right Side: Tab View Reader */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 min-h-[50vh] lg:h-[70vh] overflow-y-auto relative">
          {loadingDetails ? (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 z-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : null}

          {activeSubtopic || isTopicView ? (
            <div>
              {/* Note Header Title */}
              <div className="border-b border-gray-100 pb-4 mb-6">
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {isTopicView ? 'Topic Overview' : 'Active Study Material'}
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
                  {isTopicView ? (topic?.name || 'Overview') : activeSubtopic.name}
                </h1>
                {isTopicView ? (
                  topic?.description && !isDescriptionMarkdown && (
                    <p className="text-gray-500 mt-1 text-sm">{topic.description}</p>
                  )
                ) : (
                  activeSubtopic.description && !isDescriptionMarkdown && (
                    <p className="text-gray-500 mt-1 text-sm">{activeSubtopic.description}</p>
                  )
                )}
              </div>



              {/* Tab Panels */}
              {activeTab === 'notes' ? (
                // STUDY NOTES PANEL
                studyNotesContent ? (
                  <div>
                    <div className="prose max-w-none mb-8" data-color-mode="light">
                      <MDEditor.Markdown 
                        source={formatMarkdown(studyNotesContent)} 
                        className="bg-transparent border-none shadow-none text-gray-800 animate-fadeIn"
                      />
                    </div>

                    {/* Regenerator options */}
                    {!isTopicView && (
                      <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                          <Globe size={16} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-600">Language:</span>
                          <select
                            value={genLanguage}
                            onChange={(e) => setGenLanguage(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Hinglish">Hinglish</option>
                          </select>
                        </div>

                        <button
                          onClick={handleGenerateNotes}
                          disabled={generatingNotes}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition duration-200 disabled:opacity-50 text-sm shadow-sm"
                        >
                          {generatingNotes ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2" size={16} />
                              Regenerate Notes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {isTopicView ? "No topic overview available" : "No revision notes generated yet"}
                    </h3>
                    <p className="text-gray-500 max-w-sm mt-1 mb-6 text-sm">
                      {isTopicView 
                        ? "There is no description or overview text synced for this topic."
                        : "Unlock detailed concepts, explanations, and key takeaways generated specifically for this subtopic."}
                    </p>

                    {!isTopicView && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Globe size={18} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">Language:</span>
                          <select
                            value={genLanguage}
                            onChange={(e) => setGenLanguage(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Hinglish">Hinglish</option>
                          </select>
                        </div>

                        <button
                          onClick={handleGenerateNotes}
                          disabled={generatingNotes}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition duration-200 disabled:opacity-50 text-sm shadow-sm"
                        >
                          {generatingNotes ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2" size={16} />
                              Generate Notes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : activeTab === 'reels' ? (
                // VIDEO REELS PANEL
                reels.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reels.map((reel, index) => (
                        <div key={index} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col p-4">
                          {/* Video Player */}
                          <div className="aspect-[9/16] w-full max-w-[240px] mx-auto rounded-xl overflow-hidden shadow-md bg-black relative mb-4">
                            <video
                              src={reel.video_url || reel.media_url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Script text */}
                          {reel.script && (
                            <div className="bg-white p-3 rounded-lg border border-gray-150 text-xs text-gray-600 max-h-32 overflow-y-auto font-mono">
                              <span className="font-bold text-gray-700 block mb-1">Generated Script:</span>
                              {reel.script}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-400 mt-2 text-right">
                            Generated: {new Date(reel.created_at || new Date()).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Generator trigger to generate another reel */}
                    {!isTopicView && (
                      <div className="border-t border-gray-100 pt-6 mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Globe size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600">Language:</span>
                            <select
                              value={genLanguage}
                              onChange={(e) => setGenLanguage(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none"
                            >
                              <option value="English">English</option>
                              <option value="Hindi">Hindi</option>
                              <option value="Hinglish">Hinglish</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600">Voice:</span>
                            <select
                              value={genVoice}
                              onChange={(e) => setGenVoice(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none"
                            >
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateReel}
                          disabled={generatingReel}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition duration-200 disabled:opacity-50 text-sm shadow-sm"
                        >
                          {generatingReel ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Assembling Reel...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2" size={16} />
                              Generate Another Reel
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-red-50 p-4 rounded-full text-red-600 mb-4">
                      <Video size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {isTopicView ? "No topic video reels available" : "No video reels generated yet"}
                    </h3>
                    <p className="text-gray-500 max-w-sm mt-1 mb-6 text-sm">
                      {isTopicView
                        ? "There are no video reels generated directly for this topic."
                        : "Generate dynamic AI reel videos to visually summarize this subtopic with synthetic voices."}
                    </p>

                    {!isTopicView && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Globe size={18} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">Language:</span>
                          <select
                            value={genLanguage}
                            onChange={(e) => setGenLanguage(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Hinglish">Hinglish</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Volume2 size={18} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">Voice Tone:</span>
                          <select
                            value={genVoice}
                            onChange={(e) => setGenVoice(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="female">Female Voice</option>
                            <option value="male">Male Voice</option>
                          </select>
                        </div>

                        <button
                          onClick={handleGenerateReel}
                          disabled={generatingReel}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition duration-200 disabled:opacity-50 text-sm shadow-sm"
                        >
                          {generatingReel ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Assembling Reel...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2" size={16} />
                              Generate Reel
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // AI QUIZ PANEL
                <div className="space-y-6 animate-fadeIn">
                  {quizLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                      <p className="text-gray-700 font-bold">Generating your AI Quiz...</p>
                      <p className="text-gray-400 text-xs mt-1">Analyzing content to formulate practice questions.</p>
                    </div>
                  )}

                  {!quizLoading && quizError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm">
                      <div className="text-red-700 font-bold text-lg mb-2">Quiz Generation Failed</div>
                      <p className="text-red-600 text-sm mb-6 leading-relaxed">{quizError}</p>
                      <button
                        onClick={handleResetQuiz}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {!quizLoading && !quizError && quizQuestions.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-lg mx-auto shadow-sm">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4">
                          <HelpCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Generate AI Practice Quiz</h3>
                        <p className="text-gray-500 text-sm max-w-sm mt-1 mb-6">
                          Test your understanding of {isTopicView ? "this topic" : "this subtopic"} with dynamic, AI-generated questions.
                        </p>

                        <div className="w-full space-y-4 mb-6">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <span className="text-sm font-semibold text-gray-700">Number of Questions:</span>
                            <select
                              value={quizNumQuestions}
                              onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={5}>5 Questions</option>
                              <option value={10}>10 Questions</option>
                              <option value={15}>15 Questions</option>
                              <option value={20}>20 Questions</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Difficulty Level:</span>
                            <select
                              value={quizDifficulty}
                              onChange={(e) => setQuizDifficulty(e.target.value)}
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateQuiz}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-200 text-sm shadow-sm"
                        >
                          Generate Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {!quizLoading && !quizError && quizQuestions.length > 0 && (
                    <div className="space-y-8">
                      {/* Score Summary Banner if submitted */}
                      {quizSubmitted && (
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-full">
                              <Award size={32} />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold">Quiz Results</h4>
                              <p className="text-white/80 text-sm mt-0.5">
                                You answered {Object.keys(quizAnswers).filter(k => quizAnswers[k] === quizQuestions[k].correct).length} out of {quizQuestions.length} questions correctly.
                              </p>
                            </div>
                          </div>
                          <div className="text-center sm:text-right">
                            <div className="text-3xl font-black">
                              {Math.round((Object.keys(quizAnswers).filter(k => quizAnswers[k] === quizQuestions[k].correct).length / quizQuestions.length) * 100)}%
                            </div>
                            <span className="text-xs text-white/70">Passing Score: 50%</span>
                          </div>
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-6">
                        {quizQuestions.map((q, qIndex) => {
                          const isCorrect = quizAnswers[qIndex] === q.correct;
                          const hasSelected = quizAnswers[qIndex] !== undefined;

                          return (
                            <div key={qIndex} className={`bg-white p-6 rounded-2xl border transition-all duration-250 ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'border-green-200 bg-green-50/20'
                                  : 'border-red-200 bg-red-50/20'
                                : 'border-gray-200'
                            }`}>
                              <div className="flex items-start space-x-3">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                                  {qIndex + 1}
                                </span>
                                <h4 className="text-base font-bold text-gray-800">{q.question}</h4>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ml-9">
                                {q.options.map((opt, oIndex) => {
                                  const isSelected = quizAnswers[qIndex] === opt;
                                  const isOptionCorrectValue = opt === q.correct;

                                  let optionStyle = 'border-gray-200 hover:bg-gray-50 text-gray-700';
                                  if (isSelected) {
                                    optionStyle = 'border-blue-600 bg-blue-50 text-blue-700 font-semibold';
                                  }

                                  if (quizSubmitted) {
                                    if (isOptionCorrectValue) {
                                      optionStyle = 'border-green-600 bg-green-50 text-green-700 font-bold';
                                    } else if (isSelected && !isCorrect) {
                                      optionStyle = 'border-red-600 bg-red-50 text-red-700 font-semibold';
                                    } else {
                                      optionStyle = 'border-gray-250 bg-gray-50/50 text-gray-400 opacity-60';
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIndex}
                                      onClick={() => handleSelectOption(qIndex, opt)}
                                      disabled={quizSubmitted}
                                      className={`flex items-center text-left px-4 py-3 rounded-xl border transition-all duration-150 text-sm ${optionStyle}`}
                                    >
                                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs mr-3 flex-shrink-0">
                                        {String.fromCharCode(65 + oIndex)}
                                      </span>
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              {quizSubmitted && q.explanation && (
                                <div className="mt-4 ml-9 p-4 bg-gray-50 rounded-xl border border-gray-150 text-xs text-gray-650 leading-relaxed">
                                  <div className="flex items-center space-x-1.5 font-bold text-gray-700 mb-1.5">
                                    {isCorrect ? (
                                      <CheckCircle className="text-green-600" size={14} />
                                    ) : (
                                      <XCircle className="text-red-600" size={14} />
                                    )}
                                    <span>Explanation:</span>
                                  </div>
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8">
                        <button
                          onClick={handleResetQuiz}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition duration-200 text-sm shadow-sm"
                        >
                          {quizSubmitted ? "Try Another Quiz" : "Reset Answers"}
                        </button>

                        {!quizSubmitted && (
                          <button
                            onClick={handleSubmitQuiz}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition duration-200 text-sm shadow-sm"
                          >
                            Submit Answers
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-400 italic">
              Please select a subtopic notes from the list to start reading.
            </div>
          )}
        </div>
      </div>

      {/* CRUD Add Subtopic Modal */}
      {showAddSubtopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-150 relative">
            <button
              onClick={() => {
                setShowAddSubtopicModal(false);
                setNewSubtopicName('');
                setNewSubtopicDesc('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Subtopic</h3>
            <form onSubmit={handleCreateSubtopic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subtopic Name</label>
                  <input
                    type="text"
                    required
                    value={newSubtopicName}
                    onChange={(e) => setNewSubtopicName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Centripetal Acceleration Formulas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={newSubtopicDesc}
                    onChange={(e) => setNewSubtopicDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
                    placeholder="e.g., Derivation and practical exam examples"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubtopicModal(false);
                    setNewSubtopicName('');
                    setNewSubtopicDesc('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSubtopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                >
                  {submittingSubtopic && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Create Subtopic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ClassroomSubtopicDetail;
