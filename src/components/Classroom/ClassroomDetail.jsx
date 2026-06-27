import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, ArrowLeft, Calendar, FileText, Loader2, Plus, X, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
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

  // Add Paper Modal State
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [newPaperName, setNewPaperName] = useState('');
  const [submittingPaper, setSubmittingPaper] = useState(false);

  // Edit Paper Modal State
  const [showEditPaperModal, setShowEditPaperModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [editPaperName, setEditPaperName] = useState('');
  const [updatingPaper, setUpdatingPaper] = useState(false);
  const [uploadingPaper11, setUploadingPaper11] = useState(false);
  const [uploadingPaper916, setUploadingPaper916] = useState(false);
  const [uploadingPaper169, setUploadingPaper169] = useState(false);

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

        // 3. Fetch subjects for each paper to get count
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

  const handleCreatePaper = async (e) => {
    e.preventDefault();
    if (!newPaperName.trim()) return;

    try {
      setSubmittingPaper(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/classroom-exams/${examId}/papers`,
        {
          name: newPaperName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Paper created successfully!');
        setNewPaperName('');
        setShowAddPaperModal(false);
        await fetchPapersAndSubjects();
      }
    } catch (err) {
      console.error('Failed to create paper:', err);
      toast.error(err.response?.data?.message || 'Failed to create paper');
    } finally {
      setSubmittingPaper(false);
    }
  };

  const handleEditPaperClick = (e, paper) => {
    e.stopPropagation();
    setSelectedPaper(paper);
    setEditPaperName(paper.name);
    setShowEditPaperModal(true);
  };

  const handleUploadPaperImage = async (field, file) => {
    if (!file || !selectedPaper) return;
    const ratioLabel = field.replace('image_', '');
    const setter = ratioLabel === '1_1' ? setUploadingPaper11 : ratioLabel === '9_16' ? setUploadingPaper916 : setUploadingPaper169;
    
    try {
      setter(true);
      const formData = new FormData();
      formData.append(field, file);
      
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams/papers/${selectedPaper.paper_id}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        toast.success(`Image (${ratioLabel.replace('_', ':')}) uploaded successfully!`);
        const newUrl = response.data.urls[`image_url_${ratioLabel}`];
        setSelectedPaper(prev => ({
          ...prev,
          [`image_url_${ratioLabel}`]: newUrl
        }));
      }
    } catch (err) {
      console.error(`Failed to upload ${ratioLabel} image:`, err);
      toast.error(`Failed to upload ${ratioLabel} image`);
    } finally {
      setter(false);
    }
  };

  const handleUpdatePaper = async (e) => {
    e.preventDefault();
    if (!editPaperName.trim() || !selectedPaper) return;

    try {
      setUpdatingPaper(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/classroom-exams/papers/${selectedPaper.paper_id}`,
        {
          name: editPaperName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Paper updated successfully!');
        setShowEditPaperModal(false);
        setSelectedPaper(null);
        setEditPaperName('');
        await fetchPapersAndSubjects();
      }
    } catch (err) {
      console.error('Failed to update paper:', err);
      toast.error(err.response?.data?.message || 'Failed to update paper');
    } finally {
      setUpdatingPaper(false);
    }
  };

  const handleDeletePaper = async (e, paperId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Paper? This will delete all nested Subjects, Chapters, and Topics.')) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/classroom-exams/papers/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success('Paper deleted successfully!');
        await fetchPapersAndSubjects();
      }
    } catch (err) {
      console.error('Failed to delete paper:', err);
      toast.error('Failed to delete paper');
    }
  };

  const handleTogglePaperStatus = async (e, paperId) => {
    e.stopPropagation();
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/classroom-exams/papers/${paperId}/status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Status toggled successfully');
        setPapers(prevPapers => 
          prevPapers.map(p => 
            p.paper_id === paperId ? { ...p, isEnabled: response.data.isEnabled } : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to toggle status');
    }
  };

  const handlePaperClick = (paperId) => {
    navigate(`/classroom/${examId}/papers/${paperId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-medium">Loading classroom papers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/classroom')}
        className="text-indigo-600 hover:text-indigo-700 flex items-center mb-6 font-medium transition"
      >
        <ArrowLeft className="mr-1" size={16} />
        <span>Back to Dashboard</span>
      </button>

      {/* Exam Profile Banner */}
      {exam && (
        <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
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
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddPaperModal(true)}
                    className="flex items-center bg-white text-indigo-600 border border-indigo-200 font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-indigo-50 transition text-sm"
                  >
                    <Plus className="mr-2" size={14} />
                    Add Paper
                  </button>
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
        </div>
      )}

      {/* Grid Section (Papers) */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="text-indigo-600 mr-2" size={20} />
          Classroom Papers
        </h2>

        {papers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">No Synced Papers found</h3>
            <p className="text-gray-500 mt-1">Please add a paper or click "Sync Now" to reload data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => {
              const subjectCount = subjectsMap[paper.paper_id]?.length || 0;
              return (
                <div
                  key={paper.paper_id}
                  onClick={() => handlePaperClick(paper.paper_id)}
                  className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
                    paper.isEnabled === false ? 'opacity-70 bg-gray-50/50' : ''
                  }`}
                  style={{ borderLeft: `4px solid ${paper.isEnabled === false ? '#d1d5db' : '#6366f1'}` }}
                >
                  {/* Image/Cover container inside paper card */}
                  <div className="w-full h-40 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center overflow-hidden mb-4 relative animate-in fade-in duration-200">
                    {/* Floating Actions overlay */}
                    <div className="absolute top-2 right-2 flex items-center space-x-1 z-10 bg-white/85 backdrop-blur-sm p-1.5 rounded-lg shadow-sm onClick-bubble" onClick={(e) => e.stopPropagation()}>
                      {/* Status Toggle Button */}
                      <button
                        onClick={(e) => handleTogglePaperStatus(e, paper.paper_id)}
                        className={`p-1 border rounded-md transition duration-200 ${
                          paper.isEnabled !== false 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-gray-100 border-gray-250 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={paper.isEnabled !== false ? "Disable Paper (Hides from App)" : "Enable Paper"}
                      >
                        {paper.isEnabled !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => handleEditPaperClick(e, paper)}
                        className="p-1 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-gray-50 shadow-sm transition"
                        title="Edit Paper"
                      >
                        <Edit size={13} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeletePaper(e, paper.paper_id)}
                        className="p-1 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-red-650 hover:bg-red-50 shadow-sm transition"
                        title="Delete Paper"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {(paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url) ? (
                      <img
                        src={
                          (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url).startsWith('http')
                            ? (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url)
                            : `${API_BASE_URL}${paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url}`
                        }
                        alt={paper.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const ph = e.target.parentNode.querySelector('.fallback-initials');
                          if (ph) ph.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div 
                      className="fallback-initials absolute inset-0 flex items-center justify-center text-white text-5xl font-black opacity-20 select-none"
                      style={{ display: (paper.image_url_16_9 || paper.image_url_1_1 || paper.image_url_9_16 || paper.image_url) ? 'none' : 'flex' }}
                    >
                      {paper.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition line-clamp-2">
                      {paper.name}
                    </h3>
                    
                    <div className="flex items-center mt-3 gap-2 flex-wrap">
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">
                        Synced
                      </span>
                      {paper.isEnabled === false && (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer / Stats info */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-450 font-medium">
                    <span>Subjects: {subjectCount}</span>
                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform duration-200 font-semibold flex items-center">
                      View Subjects &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Paper Modal */}
      {showAddPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAddPaperModal(false);
                setNewPaperName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Paper</h3>
            <form onSubmit={handleCreatePaper}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper Name</label>
                  <input
                    type="text"
                    required
                    value={newPaperName}
                    onChange={(e) => setNewPaperName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., General Studies Paper 1"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPaperModal(false);
                    setNewPaperName('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPaper}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                >
                  {submittingPaper && <Loader2 className="animate-spin mr-1.5" size={14} />}
                  Create Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Paper Modal */}
      {showEditPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-250 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowEditPaperModal(false);
                setSelectedPaper(null);
                setEditPaperName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Paper</h3>
            <form onSubmit={handleUpdatePaper}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper Name</label>
                  <input
                    type="text"
                    required
                    value={editPaperName}
                    onChange={(e) => setEditPaperName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., General Studies Paper 1"
                  />
                </div>

                {/* Custom Aspect Ratios Uploader */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aspect Ratio Images (R2 Storage)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1:1 Square Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-655">1:1 Square</span>
                      <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {uploadingPaper11 ? (
                          <Loader2 className="animate-spin text-indigo-655" size={18} />
                        ) : selectedPaper && selectedPaper.image_url_1_1 ? (
                          <img src={selectedPaper.image_url_1_1} alt="1:1" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingPaper11 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadPaperImage('image_1_1', e.target.files[0])}
                          disabled={uploadingPaper11}
                        />
                      </label>
                    </div>

                    {/* 9:16 Portrait Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-655">9:16 Portrait</span>
                      <div className="w-10 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner">
                        {uploadingPaper916 ? (
                          <Loader2 className="animate-spin text-indigo-655" size={18} />
                        ) : selectedPaper && selectedPaper.image_url_9_16 ? (
                          <img src={selectedPaper.image_url_9_16} alt="9:16" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingPaper916 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadPaperImage('image_9_16', e.target.files[0])}
                          disabled={uploadingPaper916}
                        />
                      </label>
                    </div>

                    {/* 16:9 Landscape Ratio */}
                    <div className="flex flex-col items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 h-40">
                      <span className="text-[10px] font-bold text-gray-655">16:9 Banner</span>
                      <div className="w-18 h-10 bg-gray-200 border border-gray-300 rounded flex items-center justify-center overflow-hidden relative shadow-inner my-3">
                        {uploadingPaper169 ? (
                          <Loader2 className="animate-spin text-indigo-655" size={18} />
                        ) : selectedPaper && selectedPaper.image_url_16_9 ? (
                          <img src={selectedPaper.image_url_16_9} alt="16:9" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-center w-full transition">
                        {uploadingPaper169 ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadPaperImage('image_16_9', e.target.files[0])}
                          disabled={uploadingPaper169}
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
                    setShowEditPaperModal(false);
                    setSelectedPaper(null);
                    setEditPaperName('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPaper}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                >
                  {updatingPaper && <Loader2 className="animate-spin mr-1.5" size={14} />}
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

export default ClassroomDetail;
