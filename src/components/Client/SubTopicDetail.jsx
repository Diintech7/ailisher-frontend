import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database, ArrowLeft, Edit, Trash2, AlertTriangle, Save, MessageSquare, QrCode } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCodeModalSubTopic from './QRCodeModalSubTopic';

// Rich Text Editor Component (Simplified)
const RichTextEditor = ({ initialContent, onSave, readOnly }) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState(initialContent || '');
  const [isEditing, setIsEditing] = useState(!readOnly);
  
  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
  };
  
  if (readOnly && !isEditing) {
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <div className="text-sm font-medium text-gray-700">Editor</div>
        {!readOnly && (
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
          >
            <Save size={14} className="mr-1" />
            <span>Save</span>
          </button>
        )}
      </div>
      <textarea
        ref={editorRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-4 min-h-[400px] font-mono text-sm focus:outline-none"
        placeholder="Enter HTML content here..."
      />
    </div>
  );
};

// Edit SubTopic Modal Component
const EditSubTopicModal = ({ isOpen, onClose, bookId, workbookId, chapterId, topicId, subtopic, onUpdate }) => {
  const [title, setTitle] = useState(subtopic?.title || '');
  const [description, setDescription] = useState(subtopic?.description || '');
  const [order, setOrder] = useState(subtopic?.order !== undefined ? subtopic.order.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Determine if we're in workbook context
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  useEffect(() => {
    if (subtopic) {
      setTitle(subtopic.title || '');
      setDescription(subtopic.description || '');
      setOrder(subtopic.order !== undefined ? subtopic.order.toString() : '');
    }
  }, [subtopic]);

  if (!isOpen || !subtopic) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        onClose();
        return;
      }

      // Determine endpoint based on context
      const updateUrl = isWorkbook
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopic._id}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopic._id}`;
      
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          order: order ? parseInt(order) : undefined 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Sub-topic updated successfully!');
        onUpdate(data.subtopic);
        onClose();
      } else {
        setError(data.message || 'Failed to update sub-topic');
        toast.error(data.message || 'Failed to update sub-topic');
      }
    } catch (error) {
      console.error('Error updating sub-topic:', error);
      setError(error.message || 'An error occurred while updating the sub-topic');
      toast.error(error.message || 'An error occurred while updating the sub-topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Sub-Topic</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Order (optional)</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Update Sub-Topic'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
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
  );
};

// Main SubTopicDetail component
const SubTopicDetail = () => {
  const [subtopic, setSubtopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const { bookId, workbookId, chapterId, topicId, subtopicId } = useParams();
  const navigate = useNavigate();
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  
  // Determine if we're in workbook context
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  const fetchSubTopicDetails = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      // Determine endpoint based on context
      const subtopicUrl = isWorkbook
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`;

      const response = await fetch(subtopicUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch subtopic: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubtopic(data.subtopic);
      } else {
        throw new Error(data.message || 'Failed to fetch sub-topic details');
      }
    } catch (error) {
      console.error('Error fetching sub-topic details:', error);
      setError(error.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubTopicDetails();
  }, [bookId, workbookId, chapterId, topicId, subtopicId, navigate, isWorkbook]);

  const handleEditSubTopic = () => {
    setShowEditModal(true);
  };

  const handleSubTopicUpdated = (updatedSubtopic) => {
    setSubtopic(updatedSubtopic);
  };

  const handleDeleteSubTopic = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteSubTopic = async () => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        setShowDeleteModal(false);
        return;
      }

      // Determine endpoint based on context
      const deleteUrl = isWorkbook
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Sub-topic deleted successfully!');
        
        // Navigate back to the appropriate topic page based on context
        if (isWorkbook) {
          navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}`);
        } else {
          navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`);
        }
      } else {
        toast.error(data.message || 'Failed to delete sub-topic');
      }
    } catch (error) {
      console.error('Error deleting sub-topic:', error);
      toast.error(error.message || 'An error occurred while deleting the sub-topic');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleSaveContent = async (newContent) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Determine endpoint based on context
      const updateUrl = isWorkbook
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`;

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Content saved successfully!');
        setSubtopic(data.subtopic);
      } else {
        toast.error(data.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error(error.message || 'An error occurred while saving the content');
    }
  };

  const handleBackClick = () => {
    // Navigate back to the appropriate topic page based on context
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`);
    }
  };

  const handleSubTopicDataStore = () => {
    // Navigate to the appropriate datastore page based on context
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/datastore`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/datastore`);
    }
  };

  const handleSubTopicAssetsClick = () => {
    if (!effectiveBookId || !chapterId || !topicId || !subtopicId) {
      toast.error('Invalid IDs. Cannot access assets.');
      return;
    }
    
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/assets`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/assets`);
    }
  };

  const handleChatWithSubTopic = () => {
    if (!effectiveBookId || !chapterId || !topicId || !subtopicId) {
      toast.error('Invalid IDs. Cannot start chat.');
      return;
    }
    
    const chatId = effectiveBookId;
    const chatType = isWorkbook ? 'workbook-subtopic' : 'subtopic';
    
    navigate(`/chat/${chatId}?type=${chatType}&chapterId=${chapterId}&topicId=${topicId}&subtopicId=${subtopicId}&title=${encodeURIComponent(subtopic?.title || '')}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={handleBackClick}
              className="mt-3 text-red-600 hover:text-red-800 flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Topic</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">{subtopic?.title}</h1>
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <button 
                onClick={handleEditSubTopic}
                className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <Edit size={16} className="mr-1" />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDeleteSubTopic}
                className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} className="mr-1" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{subtopic?.description || 'No description available'}</p>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleSubTopicDataStore}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
            >
              <Database size={16} className="mr-2" />
              <span>Sub-Topic Datastore</span>
            </button>
            <button 
              onClick={() => setIsEditingContent(!isEditingContent)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Edit size={16} className="mr-2" />
              <span>{isEditingContent ? 'Cancel Edit' : 'Edit Content'}</span>
            </button>
            <button 
              onClick={handleChatWithSubTopic}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
            >
              <MessageSquare size={16} className="mr-2" />
              <span>Chat with Sub-Topic</span>
            </button>
            
            <button 
              onClick={() => setShowQRCodeModal(true)}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
            >
              <QrCode size={16} className="mr-2" />
              <span>Sub Topic QR</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content</h2>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <RichTextEditor 
            initialContent={subtopic?.content} 
            onSave={handleSaveContent}
            readOnly={!isEditingContent}
          />
        </div>
      </div>

      <EditSubTopicModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopic={subtopic}
        onUpdate={handleSubTopicUpdated}
      />

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDeleteSubTopic}
        title="Delete Sub-Topic"
        message="Are you sure you want to delete this sub-topic? All content will be permanently removed."
      />

      <QRCodeModalSubTopic
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        bookId={bookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
        subtopicTitle={subtopic?.title}
      />
    </div>
  );
};

export default SubTopicDetail;