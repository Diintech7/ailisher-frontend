import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Globe, RefreshCw, ChevronLeft, Film, Play, X, Plus, Upload, Cpu, Edit, Trash2, ToggleLeft, ToggleRight, FileVideo, Calendar, MoreVertical } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';

const AiCurrentAffairs = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Selected Topic Reels Details
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  
  // Video Playback
  const [selectedReel, setSelectedReel] = useState(null);

  // Tab Navigation: 'ai' | 'custom' | 'feed'
  const [activeTab, setActiveTab] = useState('feed');
  const [feedReels, setFeedReels] = useState([]);
  const [feedCategory, setFeedCategory] = useState('All');
  const [feedTimeframe, setFeedTimeframe] = useState('Today');
  const [topicsCategory, setTopicsCategory] = useState('All');
  const [dateFilterMode, setDateFilterMode] = useState('All');
  const [customSelectedDate, setCustomSelectedDate] = useState(null);
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);

  // Management State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newTopicScript, setNewTopicScript] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTopicId, setEditTopicId] = useState('');
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicCategory, setEditTopicCategory] = useState('');
  const [editTopicContent, setEditTopicContent] = useState('');
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);

  // Upload Context PDF (AI Topics)
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

  // Custom Video Upload State (Custom Topics)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [customVideoTitle, setCustomVideoTitle] = useState('');
  const [customVideoMode, setCustomVideoMode] = useState('upload'); // 'upload' | 'url'
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [customVideoFile, setCustomVideoFile] = useState(null);
  const [customUploading, setCustomUploading] = useState(false);
  const [customUploadProgress, setCustomUploadProgress] = useState(0);

  const token = Cookies.get('usertoken');

  const fetchTopics = async (tab = activeTab) => {
    try {
      setLoading(true);
      if (tab === 'feed') {
        const [feedRes, customRes, aiRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs/reels-feed`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs?isCustom=true`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs?isCustom=false`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (feedRes.data && feedRes.data.success) {
          setFeedReels(feedRes.data.reels || []);
        }

        let combinedTopics = [];
        if (customRes.data && customRes.data.success) {
          combinedTopics = [...combinedTopics, ...(customRes.data.topics || [])];
        }
        if (aiRes.data && aiRes.data.success) {
          combinedTopics = [...combinedTopics, ...(aiRes.data.topics || [])];
        }
        setTopics(combinedTopics);
        return;
      }

      const isCustomVal = tab === 'custom' ? 'true' : 'false';
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs?isCustom=${isCustomVal}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setTopics(response.data.topics || []);
      }
    } catch (err) {
      console.error('Error fetching Current Affairs:', err);
      toast.error('Failed to load Current Affairs data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTopicsCategory('All');
    setDateFilterMode('All');
    setCustomSelectedDate(null);
    fetchTopics();
  }, [activeTab]);


  const handleTopicClick = async (topic) => {
    setSelectedTopic(topic);
    setReelsLoading(true);
    setFile(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs/${topic.ca_topic_id}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setReels(response.data.reels || []);
      }
    } catch (err) {
      console.error('Error fetching Current Affair reels:', err);
      toast.error('Failed to load video reels');
    } finally {
      setReelsLoading(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      setIsCreating(true);
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/current-affairs`, {
        title: newTopicName,
        category: newTopicCategory,
        content: newTopicScript,
        isCustom: activeTab === 'custom'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Category created successfully!');
        setNewTopicName('');
        setNewTopicCategory('');
        setNewTopicScript('');
        setShowCreateModal(false);
        fetchTopics();
      }
    } catch (err) {
      console.error('Error creating Current Affairs topic:', err);
      toast.error('Failed to create topic');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (e, topic) => {
    e.stopPropagation();
    setEditTopicId(topic.ca_topic_id);
    setEditTopicTitle(topic.title || topic.name || '');
    setEditTopicCategory(topic.category || '');
    setEditTopicContent(topic.content || topic.script || '');
    setShowEditModal(true);
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!editTopicTitle.trim()) return;
    try {
      setIsUpdatingTopic(true);
      const res = await axios.put(`${API_BASE_URL}/api/classroom-exams/current-affairs/${editTopicId}`, {
        title: editTopicTitle,
        category: editTopicCategory,
        content: editTopicContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('News topic updated successfully!');
        setShowEditModal(false);
        fetchTopics();
      }
    } catch (err) {
      console.error('Error updating Current Affairs topic:', err);
      toast.error('Failed to update topic');
    } finally {
      setIsUpdatingTopic(false);
    }
  };

  const handleDeleteTopic = async (e, caTopicId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this topic and all its custom/AI reels?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/current-affairs/${caTopicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Current Affairs topic deleted successfully!');
        fetchTopics();
      }
    } catch (err) {
      console.error('Error deleting Current Affairs topic:', err);
      toast.error('Failed to delete topic');
    }
  };

  const handleDeleteReel = async (e, reelId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this video reel?')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/classroom-exams/current-affairs/reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Video reel deleted successfully!');
        if (selectedTopic) {
          handleTopicClick(selectedTopic);
        }
      }
    } catch (err) {
      console.error('Error deleting video reel:', err);
      toast.error('Failed to delete reel');
    }
  };

  const handleToggleReelStatus = async (e, reel) => {
    e.stopPropagation();
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/classroom-exams/current-affairs/reels/${reel.reel_id}/status`,
        { isEnabled: !reel.isEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        toast.success(`Reel ${!reel.isEnabled ? 'enabled' : 'disabled'} successfully!`);
        if (selectedTopic) {
          handleTopicClick(selectedTopic);
        }
      }
    } catch (err) {
      console.error('Error toggling reel status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', file);
      
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/current-affairs/${selectedTopic.ca_topic_id}/upload-pdf`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        toast.success('News source PDF uploaded successfully!');
        setFile(null);
        handleTopicClick(selectedTopic);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Failed to upload PDF source');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateTranscript = async () => {
    try {
      setIsGeneratingTranscript(true);
      toast.info('AI is generating news transcript. Please wait...', { autoClose: 4000 });
      const res = await axios.post(`${API_BASE_URL}/api/classroom-exams/current-affairs/${selectedTopic.ca_topic_id}/generate-transcript`, { language: 'Hindi' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('AI transcript script generated successfully!');
        const updatedTopic = { ...selectedTopic, script: res.data.script || 'AI script generated successfully.' };
        setSelectedTopic(updatedTopic);
        handleTopicClick(updatedTopic);
      }
    } catch (err) {
      console.error('Error generating transcript:', err);
      toast.error('Failed to generate AI transcript script');
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleUploadCustomVideo = async (e) => {
    e.preventDefault();
    if (!customVideoTitle.trim()) return;

    try {
      let body = { title: customVideoTitle };
      setCustomUploading(true);

      if (customVideoMode === 'url') {
        if (!customVideoUrl.trim()) return;
        body.video_url = customVideoUrl;
      } else {
        if (!customVideoFile) return;

        // 1. Get R2 presigned upload URL
        const presignRes = await axios.post(`${API_BASE_URL}/api/reels/upload-url`, {
          fileName: customVideoFile.name,
          contentType: customVideoFile.type || 'video/mp4'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { uploadUrl, key } = presignRes?.data || {};
        if (!uploadUrl || !key) throw new Error('Failed to get upload URL');

        // 2. Put file directly to Cloudflare R2
        await axios.put(uploadUrl, customVideoFile, {
          headers: { 'Content-Type': customVideoFile.type || 'video/mp4' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setCustomUploadProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          }
        });

        body.video_key = key;
      }

      // 3. Post data to database
      const res = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/current-affairs/${selectedTopic.ca_topic_id}/reels`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.success) {
        toast.success('Custom video reel added successfully!');
        setCustomVideoTitle('');
        setCustomVideoUrl('');
        setCustomVideoFile(null);
        setShowUploadModal(false);
        handleTopicClick(selectedTopic);
      }
    } catch (err) {
      console.error('Error adding custom video:', err);
      toast.error('Failed to upload custom video');
    } finally {
      setCustomUploading(false);
      setCustomUploadProgress(0);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setReels([]);
  };

  // Group reels by date for Tab 3 (Daily Reels Feed)
  const groupReelsByDate = (reelsList) => {
    const grouped = {};
    reelsList.forEach((reel) => {
      const date = new Date(reel.created_at || Date.now());
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: formattedDate,
          reels: [],
        };
      }
      grouped[dateKey].reels.push(reel);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([key, value]) => ({
        dateKey: key,
        ...value,
      }));
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const groupReelsByCategory = (reelsList) => {
    const grouped = {};
    reelsList.forEach((reel) => {
      const cat = reel.category || "General";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(reel);
    });
    return Object.entries(grouped).map(([categoryName, reels]) => ({
      categoryName,
      reels,
    }));
  };

  const renderReelCard = (reel) => (
    <div
      key={reel.reel_id}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
    >
      <div 
        className="relative bg-gradient-to-br from-indigo-600 to-purple-700 h-40 flex flex-col justify-between p-4 text-white cursor-pointer"
        onClick={() => setSelectedReel(reel)}
      >
        <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded self-start tracking-wider uppercase font-bold">
          {reel.isCustom ? 'Custom Content' : 'AI Reels'}
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition duration-200">
            <Play size={18} className="text-white fill-current" />
          </div>
        </div>
        <span className="text-[10px] text-gray-200 truncate font-semibold">
          {reel.topic_title}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h4 className="text-sm font-bold text-gray-800 truncate flex-1" title={reel.title}>
            {reel.title}
          </h4>
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
            {reel.category || 'General'}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-semibold mb-3">
          Uploaded: {new Date(reel.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
        <button
          onClick={() => setSelectedReel(reel)}
          className="w-full bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-100 transition"
        >
          Stream Reels
        </button>
      </div>
    </div>
  );

  if (loading && topics.length === 0 && feedReels.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading AI Current Affairs Feed...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 1. Main Dashboard Header */}
      {!selectedTopic && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Globe className="mr-3 text-indigo-600" size={32} />
              AI Current Affairs {activeTab && `(${activeTab === 'feed' ? 'Daily Reels Feed' : activeTab === 'ai' ? 'AI Generated' : 'Custom Library'})`}
            </h1>
            <p className="text-gray-600 mt-1">Manage AI-generated topics, upload custom video folders, and review chronological reels feed.</p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab !== 'feed' && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-200 text-sm font-semibold"
                >
                  <Plus size={18} className="mr-1.5" />
                  {activeTab === 'custom' ? 'Add Custom Category' : 'Add News Topic'}
                </button>
                <button
                  onClick={() => fetchTopics(activeTab)}
                  className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition duration-200 text-sm font-medium"
                >
                  <RefreshCw className="mr-2 text-gray-500" size={16} />
                  Refresh List
                </button>
              </>
            )}

            {/* Navigation Dropdown 3-Dot Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTabsDropdown(!showTabsDropdown)}
                className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-600 transition flex items-center justify-center font-bold"
                title="Navigation Menu"
              >
                <MoreVertical size={18} />
              </button>
              
              {showTabsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('feed');
                      setShowTabsDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'feed' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Daily Reels Feed (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ai');
                      setShowTabsDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'ai' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    AI Generated
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('custom');
                      setShowTabsDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'custom' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Custom Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Category Pills Navigation */}
      {!selectedTopic && (
        <div className="border-b border-gray-200 mb-8 pb-4">
          <span className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
            Categories
          </span>
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {(activeTab === 'feed'
              ? ['All', ...new Set([...feedReels.map(r => r.category || 'General'), ...topics.map(t => t.category || 'General')])]
              : ['All', ...new Set(topics.map(t => t.category || 'General'))]
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  if (activeTab === 'feed') {
                    setFeedCategory(cat);
                  } else {
                    setTopicsCategory(cat);
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition duration-200 whitespace-nowrap shadow-sm ${
                  (activeTab === 'feed' ? feedCategory : topicsCategory) === cat
                    ? 'bg-indigo-600 text-white border border-transparent'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Render Views based on Tab */}
      {!selectedTopic ? (
        <>
          {/* Tab 1 (AI) & Tab 2 (Custom Topics) View */}
          {activeTab !== 'feed' ? (
            topics.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                <Globe className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-800">
                  {activeTab === 'custom' ? 'No Custom Folders Created' : 'No Current Affairs Topics Available'}
                </h3>
                <p className="text-gray-500 mt-1">
                  {activeTab === 'custom' 
                    ? 'Click "Add Custom Category" to create a new folder and upload videos.' 
                    : 'Click "Add News Topic" to sync new updates.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3.1. Premium Dynamic Filter Toolbar (Date Selection + Calendar + 3-Dot Dropdown) */}
                {(() => {
                  const dateOptions = [{ label: 'All', value: 'All' }];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(Date.now() - i * 86400000);
                    let label = '';
                    if (i === 0) label = 'Today';
                    else if (i === 1) label = 'Yesterday';
                    else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    dateOptions.push({ label, value: `day_${i}` });
                  }

                  return (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Filter by Date:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {dateOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setDateFilterMode(opt.value);
                                setCustomSelectedDate(null);
                              }}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition duration-200 ${
                                dateFilterMode === opt.value
                                  ? 'bg-indigo-600 text-white shadow-sm border border-transparent'
                                  : 'bg-white text-gray-700 hover:bg-gray-155 border border-gray-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}

                          {/* Calendar Custom Date Picker Button */}
                          <div className="relative">
                            <button 
                              type="button"
                              className={`p-2 rounded-xl border text-xs font-bold transition duration-200 flex items-center justify-center ${
                                dateFilterMode === 'Custom'
                                  ? 'bg-indigo-600 text-white border-transparent'
                                  : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-100'
                              }`}
                              title={customSelectedDate ? `Selected: ${customSelectedDate}` : "Choose custom date"}
                            >
                              <Calendar size={16} />
                            </button>
                            <input
                              type="date"
                              onChange={(e) => {
                                if (e.target.value) {
                                  setDateFilterMode('Custom');
                                  setCustomSelectedDate(e.target.value);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>

                          {/* Custom Selected Date Indicator */}
                          {dateFilterMode === 'Custom' && customSelectedDate && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">
                              {new Date(customSelectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3.2. Filtered Topics Grid */}
                {(() => {
                  const filteredTopics = topics.filter(t => {
                    const tCat = t.category || 'General';
                    const matchesCat = topicsCategory === 'All' || tCat === topicsCategory;
                    
                    let matchesTime = false;
                    if (dateFilterMode === 'All') {
                      matchesTime = true;
                    } else if (dateFilterMode.startsWith('day_')) {
                      const offset = parseInt(dateFilterMode.split('_')[1], 10);
                      const targetDate = new Date(Date.now() - offset * 86400000);
                      matchesTime = isSameDay(t.created_at, targetDate);
                    } else if (dateFilterMode === 'Custom' && customSelectedDate) {
                      matchesTime = isSameDay(t.created_at, parseLocalDate(customSelectedDate));
                    }

                    return matchesCat && matchesTime;
                  });

                  if (filteredTopics.length === 0) {
                    return (
                      <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                        <Globe className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-800">No Topics Match Selected Filters</h3>
                        <p className="text-gray-500 mt-1 mb-4">Try changing the category or date settings to see more topics.</p>
                        <button
                          onClick={() => {
                            setTopicsCategory('All');
                            setDateFilterMode('All');
                            setCustomSelectedDate(null);
                          }}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                        >
                          Reset Filters
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTopics.map((topic) => (
                        <div
                          key={topic.ca_topic_id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200 cursor-pointer"
                          onClick={() => handleTopicClick(topic)}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md uppercase">
                                {topic.category || (topic.isCustom ? 'Custom Content' : 'AI Sync')}
                              </span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => openEditModal(e, topic)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTopic(e, topic.ca_topic_id)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">{topic.title || topic.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-wider">
                              Created: {new Date(topic.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            
                            {(topic.content || topic.script) && (
                              <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-4 italic">
                                "{topic.content || topic.script}"
                              </p>
                            )}
                          </div>

                          <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center">
                            <span className="text-xs text-indigo-600 font-bold flex items-center">
                              <Film size={14} className="mr-1" />
                              {topic.reel_count || 0} Video Reels
                            </span>
                            <span className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition">
                              View Details →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            /* Tab 3: Daily Timeline Reels Feed Preview */
            feedReels.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                <Film className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-800">No Reels In Feed</h3>
                <p className="text-gray-500 mt-1">Publish AI generated reels or upload custom videos to populate the timeline.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3.1. Premium Dynamic Filter Toolbar (Date Selection + Calendar + 3-Dot Dropdown) */}
                {(() => {
                  const dateOptions = [{ label: 'All', value: 'All' }];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(Date.now() - i * 86400000);
                    let label = '';
                    if (i === 0) label = 'Today';
                    else if (i === 1) label = 'Yesterday';
                    else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    dateOptions.push({ label, value: `day_${i}` });
                  }

                  const filteredFeedReels = feedReels.filter(reel => {
                    const reelCat = reel.category || 'General';
                    const matchesCat = feedCategory === 'All' || reelCat === feedCategory;
                    
                    let matchesTime = false;
                    if (dateFilterMode === 'All') {
                      matchesTime = true;
                    } else if (dateFilterMode.startsWith('day_')) {
                      const offset = parseInt(dateFilterMode.split('_')[1], 10);
                      const targetDate = new Date(Date.now() - offset * 86400000);
                      matchesTime = isSameDay(reel.created_at, targetDate);
                    } else if (dateFilterMode === 'Custom' && customSelectedDate) {
                      matchesTime = isSameDay(reel.created_at, parseLocalDate(customSelectedDate));
                    }

                    return matchesCat && matchesTime;
                  });

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Filter by Date:
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {dateOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setDateFilterMode(opt.value);
                                  setCustomSelectedDate(null);
                                }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition duration-200 ${
                                  dateFilterMode === opt.value
                                    ? 'bg-indigo-600 text-white shadow-sm border border-transparent'
                                    : 'bg-white text-gray-700 hover:bg-gray-150 border border-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}

                            {/* Calendar Custom Date Picker Button */}
                            <div className="relative">
                              <button 
                                type="button"
                                className={`p-2 rounded-xl border text-xs font-bold transition duration-200 flex items-center justify-center ${
                                  dateFilterMode === 'Custom'
                                    ? 'bg-indigo-600 text-white border-transparent'
                                    : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-100'
                                }`}
                                title={customSelectedDate ? `Selected: ${customSelectedDate}` : "Choose custom date"}
                              >
                                <Calendar size={16} />
                              </button>
                              <input
                                type="date"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setDateFilterMode('Custom');
                                    setCustomSelectedDate(e.target.value);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>

                            {/* Custom Selected Date Indicator */}
                            {dateFilterMode === 'Custom' && customSelectedDate && (
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">
                                {new Date(customSelectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3.2. Filtered Reels Results */}
                      {filteredFeedReels.length === 0 ? (
                        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                          <Film className="mx-auto text-gray-300 mb-4" size={48} />
                          <h3 className="text-lg font-bold text-gray-800">No Reels Match Selected Filters</h3>
                          <p className="text-gray-500 mt-1 mb-4">Try changing your category or date settings to see more video reels.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedCategory('All');
                              setDateFilterMode('All');
                              setCustomSelectedDate(null);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                          >
                            Reset Filters
                          </button>
                        </div>
                      ) : dateFilterMode !== 'All' ? (
                        /* Case 1: Specific date selected -> Group by category if category is All, else flat grid */
                        feedCategory === 'All' ? (
                          <div className="space-y-8">
                            {groupReelsByCategory(filteredFeedReels).map((catGroup) => (
                              <div key={catGroup.categoryName} className="space-y-4">
                                <h3 className="text-lg font-extrabold text-gray-800 border-b pb-2 border-indigo-100 flex items-center">
                                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
                                  {catGroup.categoryName}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                  {catGroup.reels.map((reel) => renderReelCard(reel))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredFeedReels.map((reel) => renderReelCard(reel))}
                          </div>
                        )
                      ) : (
                        /* Case 2: All dates (All time) -> Grouped day-by-day (date) */
                        <div className="space-y-8">
                          {groupReelsByDate(filteredFeedReels).map((dateGroup) => (
                            <div key={dateGroup.dateKey} className="space-y-4">
                              <h3 className="text-lg font-extrabold text-gray-800 border-b pb-2 border-indigo-100 flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
                                {dateGroup.date}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {dateGroup.reels.map((reel) => renderReelCard(reel))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )
          )}
        </>
      ) : (
        /* 4. Single Topic Details View (Reels & uploads list) */
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{selectedTopic.title || selectedTopic.name}</h1>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5 uppercase tracking-wider">
                  {selectedTopic.isCustom ? 'Custom Folder' : 'AI Sync'} Category: {selectedTopic.category || 'General'}
                </p>
              </div>
            </div>

            {/* AI Generator Action vs Custom Upload Video Button */}
            {selectedTopic.isCustom ? (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Plus size={16} className="mr-1.5" />
                Upload Custom Video
              </button>
            ) : (
              <button
                onClick={handleGenerateTranscript}
                disabled={isGeneratingTranscript}
                className="flex items-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                <Cpu size={16} className="mr-1.5" />
                {isGeneratingTranscript ? 'Compiling AI script...' : 'Auto-Generate AI Script'}
              </button>
            )}
          </div>

          {/* Context file uploader (AI Topics Only) */}
          {!selectedTopic.isCustom && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Upload News Document (PDF context)</h3>
              <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  <Upload size={14} className="mr-1.5" />
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>
          )}

          {/* Executive Summary Summary Card (AI Topics Only) */}
          {!selectedTopic.isCustom && (selectedTopic.content || selectedTopic.script) && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 mb-8 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">Executive Summary:</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line italic">
                "{selectedTopic.content || selectedTopic.script}"
              </p>
            </div>
          )}

          {/* Video List Section */}
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Film className="mr-2 text-indigo-600 font-bold" size={20} />
            Available Video Reels ({reels.length})
          </h2>

          {reelsLoading ? (
            <div className="flex flex-col justify-center items-center h-60 bg-white border rounded-xl shadow-sm">
              <RefreshCw className="animate-spin text-indigo-600" size={32} />
              <p className="text-gray-500 font-medium mt-3">Loading video reel stream URLs...</p>
            </div>
          ) : reels.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <Film className="mx-auto text-gray-300 mb-4" size={40} />
              <h3 className="text-lg font-bold text-gray-800">No video reels published</h3>
              <p className="text-gray-500 mt-1">
                {selectedTopic.isCustom 
                  ? 'Click "Upload Custom Video" to add your first reel to this custom category.' 
                  : 'Video reels will appear here after clicking "Auto-Generate AI Script".'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {reels.map((reel) => (
                <div
                  key={reel.reel_id}
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200 ${
                    !reel.isEnabled ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
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
                      PLAY VIDEO
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 truncate mb-1">{reel.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 italic">
                        "{reel.script || 'No narration transcript details.'}"
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedReel(reel)}
                          className="flex-1 bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-100 transition"
                        >
                          Stream Video
                        </button>
                        <button
                          onClick={(e) => handleDeleteReel(e, reel.reel_id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* Toggle status for local custom reels */}
                      {selectedTopic.isCustom && (
                        <button
                          onClick={(e) => handleToggleReelStatus(e, reel)}
                          className={`w-full py-1.5 border rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                            reel.isEnabled 
                              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' 
                              : 'border-gray-250 bg-gray-150 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {reel.isEnabled ? (
                            <>
                              <ToggleRight size={16} />
                              <span>Enabled</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={16} />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 5. Create Current Affairs Topic / Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {activeTab === 'custom' ? 'Create Custom Video Folder' : 'Add Current Affairs Topic'}
            </h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  {activeTab === 'custom' ? 'Folder Name / Category' : 'Topic Title / Headline'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'custom' ? 'e.g. Budget Highlights Video Set' : 'e.g. Union Budget 2026 Announcements'}
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Category Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Economics, Polity, Geography"
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              {activeTab !== 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Initial Summary / Content (Optional)
                  </label>
                  <textarea
                    placeholder="Enter initial news brief summary..."
                    value={newTopicScript}
                    onChange={(e) => setNewTopicScript(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              )}
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
                  disabled={isCreating || !newTopicName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5.1 Edit Topic / Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Current Affairs Topic</h3>
            <form onSubmit={handleUpdateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Title / Headline Name
                </label>
                <input
                  type="text"
                  value={editTopicTitle}
                  onChange={(e) => setEditTopicTitle(e.target.value)}
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
                  value={editTopicCategory}
                  onChange={(e) => setEditTopicCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              {!selectedTopic?.isCustom && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Summary / Content
                  </label>
                  <textarea
                    value={editTopicContent}
                    onChange={(e) => setEditTopicContent(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isUpdatingTopic}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTopic || !editTopicTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isUpdatingTopic ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Custom Video Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setCustomVideoTitle('');
                setCustomVideoFile(null);
                setCustomVideoUrl('');
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Video to custom folder</h3>
            <form onSubmit={handleUploadCustomVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Video Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budget Day Overview Part 1"
                  value={customVideoTitle}
                  onChange={(e) => setCustomVideoTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                  disabled={customUploading}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomVideoMode('upload')}
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    customVideoMode === 'upload'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-350'
                  }`}
                  disabled={customUploading}
                >
                  Upload Local File
                </button>
                <button
                  type="button"
                  onClick={() => setCustomVideoMode('url')}
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    customVideoMode === 'url'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-350'
                  }`}
                  disabled={customUploading}
                >
                  Paste Video URL
                </button>
              </div>

              {customVideoMode === 'url' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Video link URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/video.mp4"
                    value={customVideoUrl}
                    onChange={(e) => setCustomVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required={customVideoMode === 'url'}
                    disabled={customUploading}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 w-full border border-dashed rounded-lg p-4 bg-gray-50 border-gray-300">
                  <FileVideo className="text-gray-400" size={32} />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setCustomVideoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                    required={customVideoMode === 'upload'}
                    disabled={customUploading}
                  />
                  {customVideoFile && (
                    <div className="text-xs text-gray-600 text-center font-bold">
                      {customVideoFile.name} ({Math.round(customVideoFile.size / 1024 / 1024)} MB)
                    </div>
                  )}
                  {customUploading && customVideoMode === 'upload' && (
                    <div className="w-full bg-gray-250 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${customUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setCustomVideoTitle('');
                    setCustomVideoFile(null);
                    setCustomVideoUrl('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled={customUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customUploading || !customVideoTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {customUploading ? 'Uploading...' : 'Save Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Video Player Modal Overlay */}
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
              {/* Reel Script/Summary Description */}
              <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto no-scrollbar justify-between bg-white">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <Film className="mr-2 text-indigo-600" size={20} />
                    Video Details
                  </h3>
                  <h4 className="text-base font-extrabold text-gray-800 mb-2">{selectedReel.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                    "{selectedReel.script || 'No narration transcript text available.'}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t text-xs text-gray-400 flex justify-between">
                  <span>Reel ID: {selectedReel.reel_id.substring(0, 12)}...</span>
                  <span>Published: {new Date(selectedReel.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCurrentAffairs;
