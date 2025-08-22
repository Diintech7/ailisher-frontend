import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Video, 
  MessageCircle, 
  Bot, 
  MessageSquare, 
  Send,
  Plus,
  Edit,
  Trash2,
  X,
  Play,
  Pause
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function Reels() {
    const [reels, setReels] = useState([]);
    const [showCreateReel, setShowCreateReel] = useState(false);
    const [editingReel, setEditingReel] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingreel,setDeletingreel]=useState(null);
    const [newReel, setNewReel] = useState({
      title: '',
      description: '',
      youtubeLink: ''
    });
    const [playingReelId, setPlayingReelId] = useState(null);
    const [newYoutubeId, setNewYoutubeId] = useState('');
    const [editYoutubeId, setEditYoutubeId] = useState('');

    const navigate = useNavigate();

    const token = Cookies.get('usertoken');

  const extractYoutubeId = (url) => {
    if (!url) return '';
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?#\s]+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];
    const fallbackMatch = url.match(/[?&]v=([^&?#\s]+)/);
    if (fallbackMatch && fallbackMatch[1]) return fallbackMatch[1];
    return '';
  };

  const getThumbnailFromYouTube = (id) => {
    console.log("id",id)
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'https://via.placeholder.com/300x200?text=No+Thumbnail';
  };

  const getEmbedUrl = (id) => {
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0` : '';
  };

  const axiosConfig = {
    baseURL: 'https://aipbbackend-c5ed.onrender.com',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Load reels from API
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/reels`, axiosConfig);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setReels(list);
      } catch (e) {
        console.error('Failed to fetch reels', e);
      }
    })();
  }, []);

  const handleCreateReel = async () => {
    if (!newReel.title || !newReel.youtubeLink) return;
    try {
      const body = {
        title: newReel.title,
        description: newReel.description,
        youtubeLink: newReel.youtubeLink,
      };
      const res = await axios.post(`/api/reels`, body, axiosConfig);
      const created = res?.data?.data;
      if (res?.data?.success && created) {
        setReels([created, ...reels]);
        setNewReel({ title: '', description: '', youtubeLink: '' });
        setShowCreateReel(false);
      }
    } catch (e) {
      console.error('Create reel failed', e);
    }
  };

  const handleEditReel = async () => {
    if (!editingReel || !editingReel._id) return;
    try {
      const body = {
        title: editingReel.title,
        description: editingReel.description,
        youtubeLink: editingReel.youtubeLink,
      };
      const res = await axios.put(`/api/reels/${editingReel._id}`, body, axiosConfig);
      const updated = res?.data?.data;
      if (res?.data?.success && updated) {
        setReels(reels.map(r => (r._id === editingReel._id ? updated : r)));
        setEditingReel(null);
      }
    } catch (e) {
      console.error('Update reel failed', e);
    }
  };

  const handleDeleteReel = async () => {
    try {
      if (!deletingreel) return;

      const res = await axios.delete(`/api/reels/${deletingreel._id}`, axiosConfig);
      if (res?.data?.success) {
        toast.success('Test deleted successfully');
        setShowDeleteModal(false);
        setDeletingreel(null);      
        setReels(reels.filter(r => r._id !== deletingreel._id));
      }
    } catch (e) {
      console.error('Delete reel failed', e);
    }
  };

  const openDeleteModal = (reel, e) => {
    e.stopPropagation();
    setDeletingreel(reel);
    setShowDeleteModal(true);
  };

  const renderCreateReelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create New Reel</h3>
          <button
            onClick={() => setShowCreateReel(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Reel Title"
            value={newReel.title}
            onChange={(e) => setNewReel({...newReel, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newReel.description}
            onChange={(e) => setNewReel({...newReel, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
          />
          <input
            type="url"
            placeholder="YouTube URL (watch, youtu.be, shorts, reels)"
            value={newReel.youtubeLink}
            onChange={(e) => {
              const val = e.target.value;
              setNewReel({...newReel, youtubeLink: val});
              setNewYoutubeId(extractYoutubeId(val));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {newReel.youtubeLink && (
            <div className="pt-2 space-y-2">
              <img
                src={getThumbnailFromYouTube(newYoutubeId)}
                alt="Preview thumbnail"
                className="w-full h-40 object-cover rounded"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Thumbnail'; }}
              />
              
            </div>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCreateReel(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReel}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create Reel
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditReelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Reel</h3>
          <button
            onClick={() => setEditingReel(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Reel Title"
            value={editingReel?.title || ''}
            onChange={(e) => setEditingReel({...editingReel, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Description"
            value={editingReel?.description || ''}
            onChange={(e) => setEditingReel({...editingReel, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
          />
          <input
            type="url"
            placeholder="YouTube URL (watch, youtu.be, shorts, reels)"
            value={editingReel?.youtubeLink || ''}
            onChange={(e) => {
              const val = e.target.value;
              setEditingReel({...editingReel, youtubeLink: val});
              setEditYoutubeId(extractYoutubeId(val));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {editingReel?.youtubeLink && (
            <div className="pt-2 space-y-2">
              <img
                src={getThumbnailFromYouTube(editYoutubeId || editingReel.youtubeId)}
                alt="Preview thumbnail"
                className="w-full h-40 object-cover rounded"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Thumbnail'; }}
              />
            </div>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setEditingReel(null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditReel}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Reel
          </button>
        </div>
      </div>
    </div>
  );

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, reel }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Reel</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{reel?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center space-x-4 p-4">
            <button
              onClick={() => navigate('/tools')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Tools
            </button>
            
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Reels Management</h2>
            <button
              onClick={() => setShowCreateReel(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Reel</span>
            </button>
          </div>
    
          {/* Reels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel) => (
              <div key={reel._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  {playingReelId === reel._id ? (
                    <div className="aspect-video w-full">
                      <iframe
                        className="w-full h-full"
                        src={getEmbedUrl(reel.youtubeId)}
                        title={reel.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      <button
                        className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded"
                        onClick={() => setPlayingReelId(null)}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={getThumbnailFromYouTube(reel.youtubeId)} 
                        alt={reel.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Thumbnail'; }}
                      />
                      <button
                        className="absolute inset-0 flex items-center justify-center"
                        onClick={() => setPlayingReelId(reel._id)}
                        aria-label="Play video"
                      >
                        <div className="bg-black/50 rounded-full p-3">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    </>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{reel.title}</h3>
                  {reel.description && (
                    <p className="text-gray-600 text-sm mb-3">{reel.description}</p>
                  )}
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>👁️ {reel.metrics?.views ?? 0} views</span>
                    <span>❤️ {reel.metrics?.likes ?? 0} likes</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setEditingReel(reel); setEditYoutubeId(reel.youtubeId || extractYoutubeId(reel.youtubeLink)); }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) =>{ e.stopPropagation(); openDeleteModal(reel,e)} }
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        {/* Modals */}
      {showCreateReel && renderCreateReelModal()}
      {editingReel && renderEditReelModal()}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingreel(null);
          }}
          onConfirm={handleDeleteReel}
          reel={deletingreel}
        />
      )}
      </>
      ); 
}
