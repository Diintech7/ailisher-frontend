import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Globe, RefreshCw, ChevronLeft, Film, Play, X, Plus, Upload, Cpu } from 'lucide-react';
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

  // Management State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicScript, setNewTopicScript] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

  const token = Cookies.get('usertoken');

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/current-affairs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setTopics(response.data.topics || []);
      }
    } catch (err) {
      console.error('Error fetching Current Affairs topics:', err);
      toast.error('Failed to load Current Affairs topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

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
      toast.error('Failed to load news video reels');
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
        name: newTopicName,
        script: newTopicScript
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Current Affairs topic created successfully!');
        setNewTopicName('');
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
        // Update local state script display
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

  const handleBack = () => {
    setSelectedTopic(null);
    setReels([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Curated Current Affairs Feed...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 1. Topics Timeline / List View */}
      {!selectedTopic ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Globe className="mr-3 text-indigo-600" size={32} />
                AI Current Affairs
              </h1>
              <p className="text-gray-600 mt-1">Stay updated with curated news events, summaries, and video lectures.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-200 text-sm font-semibold"
              >
                <Plus size={18} className="mr-1.5" />
                Add News Topic
              </button>
              <button
                onClick={fetchTopics}
                className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition duration-200 text-sm font-medium"
              >
                <RefreshCw className="mr-2 text-gray-500" size={16} />
                Refresh News
              </button>
            </div>
          </div>

          {topics.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <Globe className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-800">No Current Affairs Available</h3>
              <p className="text-gray-500 mt-1">Click the "Add News Topic" button above to publish new updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <div
                  key={topic.ca_topic_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200 cursor-pointer"
                  onClick={() => handleTopicClick(topic)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md">
                        Latest Update
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{topic.name}</h3>
                    
                    {topic.script && (
                      <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-4 italic">
                        "{topic.script}"
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
          )}
        </>
      ) : (
        /* 2. Topic Details View (Reels) */
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{selectedTopic.name}</h1>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  Published: {new Date(selectedTopic.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* AI Generator Action */}
            <button
              onClick={handleGenerateTranscript}
              disabled={isGeneratingTranscript}
              className="flex items-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              <Cpu size={16} className="mr-1.5" />
              {isGeneratingTranscript ? 'Compiling AI script...' : 'Auto-Generate AI Script'}
            </button>
          </div>

          {/* Context file uploader */}
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

          {/* Script Overview Card */}
          {selectedTopic.script && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 mb-8 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">Executive Summary:</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line italic">
                "{selectedTopic.script}"
              </p>
            </div>
          )}

          {/* Reels Lists */}
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
              <p className="text-gray-500 mt-1">Video reels will appear here after clicking "Auto-Generate AI Script".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {reels.map((reel) => (
                <div
                  key={reel.reel_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                >
                  {/* Media player wrapper overlay */}
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
                      PLAY NEWS
                    </span>
                  </div>

                  {/* Reel details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4 italic">
                      "{reel.script || 'No narration transcript details.'}"
                    </p>
                    <button
                      onClick={() => setSelectedReel(reel)}
                      className="w-full bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-100 transition"
                    >
                      Stream Video Reel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 3. Create Current Affairs Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative animate-in fade-in duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Current Affairs Topic</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Topic Title / Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Union Budget 2026 Announcements"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Initial Summary / Script (Optional)
                </label>
                <textarea
                  placeholder="Enter initial news brief narration transcript script..."
                  value={newTopicScript}
                  onChange={(e) => setNewTopicScript(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
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
                  disabled={isCreating || !newTopicName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Topic'}
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
                    News Voiceover Script
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                    "{selectedReel.script || 'No transcript text available.'}"
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
