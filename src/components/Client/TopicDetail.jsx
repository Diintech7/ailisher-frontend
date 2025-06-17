import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database, ArrowLeft, Edit, Trash2, AlertTriangle, Save, Book, FileText, ChevronRight, Plus, MessageSquare, QrCode, BookOpen } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCodeModalTopic from './QRCodeModalTopic';
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

// SubTopic Item Component
const SubTopicItem = ({ subtopic, onClick, onQRCodeClick }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-center">
      <div 
        onClick={onClick}
        className="flex-grow flex items-center cursor-pointer"
      >
        <div className="p-3 bg-blue-100 rounded-full mr-4 flex-shrink-0">
          <FileText size={22} className="text-blue-600" />
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-gray-800">{subtopic.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{subtopic.description || 'No description'}</p>
        </div>
        <div className="flex items-center text-blue-600">
          <span className="mr-1 text-sm font-medium hidden md:block">View</span>
          <ChevronRight size={18} />
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onQRCodeClick(subtopic._id);
        }}
        className="ml-4 p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
        title="Show QR Code"
      >
        <QrCode size={18} />
      </button>
    </div>
  </div>
);

// Add SubTopic Modal Component
const AddSubTopicModal = ({ isOpen, onClose, bookId, workbookId, chapterId, topicId, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Determine if we're in workbook context
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        onClose();
        return;
      }

      // Determine endpoint based on context
      const subtopicsUrl = isWorkbook 
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics`;

      const response = await fetch(subtopicsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description,
          content,
          order: order ? parseInt(order) : undefined 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Sub-topic created successfully!');
        onAdd(data.subtopic);
        onClose();
      } else {
        setError(data.message || 'Failed to create sub-topic');
        toast.error(data.message || 'Failed to create sub-topic');
      }
    } catch (error) {
      console.error('Error creating sub-topic:', error);
      setError(error.message || 'An error occurred while creating the sub-topic');
      toast.error(error.message || 'An error occurred while creating the sub-topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setTitle('');
    setDescription(''); 
    setContent('');
    setOrder('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Sub-Topic</h2>
        
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Order (optional)</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Create Sub-Topic'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Topic Modal Component
const EditTopicModal = ({ isOpen, onClose, bookId, workbookId, chapterId, topic, onUpdate }) => {
  const [title, setTitle] = useState(topic?.title || '');
  const [description, setDescription] = useState(topic?.description || '');
  const [order, setOrder] = useState(topic?.order !== undefined ? topic.order.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Determine if we're in workbook context
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '');
      setDescription(topic.description || '');
      setOrder(topic.order !== undefined ? topic.order.toString() : '');
    }
  }, [topic]);

  if (!isOpen || !topic) return null;

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
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topic._id}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topic._id}`;

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
        toast.success('Topic updated successfully!');
        onUpdate(data.topic);
        onClose();
      } else {
        setError(data.message || 'Failed to update topic');
        toast.error(data.message || 'Failed to update topic');
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      setError(error.message || 'An error occurred while updating the topic');
      toast.error(error.message || 'An error occurred while updating the topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Topic</h2>
        
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
                'Update Topic'
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

// Main TopicDetail component
const TopicDetail = () => {
  const [topic, setTopic] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddSubTopicModal, setShowAddSubTopicModal] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const { bookId, workbookId, chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showSubTopicQRCodeModal, setShowSubTopicQRCodeModal] = useState(false);
  const [selectedSubTopicId, setSelectedSubTopicId] = useState(null);
  
  // Determine if we're in workbook context
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  const fetchTopicDetails = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      // Determine endpoints based on context (workbook or book)
      const baseUrl = isWorkbook 
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}`;
      
      const topicUrl = `${baseUrl}/topics/${topicId}`;
      const subtopicsUrl = `${baseUrl}/topics/${topicId}/subtopics`;
      
      const topicPromise = fetch(topicUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const subtopicsPromise = fetch(subtopicsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const [topicResponse, subtopicsResponse] = await Promise.all([topicPromise, subtopicsPromise]);
      
      if (!topicResponse.ok) {
        const errorText = await topicResponse.text();
        throw new Error(`Failed to fetch topic: ${topicResponse.status} - ${errorText}`);
      }
      
      const topicData = await topicResponse.json();
      
      if (topicData.success) {
        setTopic(topicData.topic);
      } else {
        throw new Error(topicData.message || 'Failed to fetch topic details');
      }
      
      // Only process subtopics if the response is successful
      if (subtopicsResponse.ok) {
        const subtopicsData = await subtopicsResponse.json();
        if (subtopicsData.success) {
          setSubtopics(subtopicsData.subtopics || []);
        } else {
          console.warn('Subtopics request returned non-success:', subtopicsData.message);
          setSubtopics([]);
        }
      } else {
        console.warn(`Subtopics request failed with status: ${subtopicsResponse.status}`);
        setSubtopics([]);
      }
    } catch (error) {
      console.error('Error fetching topic details:', error);
      setError(error.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetails();
  }, [bookId, workbookId, chapterId, topicId, navigate, isWorkbook]);

  const handleAddSubTopic = () => {
    setShowAddSubTopicModal(true);
  };

  const handleSubTopicAdded = (newSubtopic) => {
    setSubtopics([...subtopics, newSubtopic]);
  };

  const handleEditTopic = () => {
    setShowEditModal(true);
  };

  const handleTopicUpdated = (updatedTopic) => {
    setTopic(updatedTopic);
  };

  const handleDeleteTopic = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteTopic = async () => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        setShowDeleteModal(false);
        return;
      }

      // Determine endpoint based on context
      const deleteUrl = isWorkbook
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Topic deleted successfully!');
        
        // Navigate back to the appropriate chapter page
        if (isWorkbook) {
          navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}`);
        } else {
          navigate(`/ai-books/${bookId}/chapters/${chapterId}`);
        }
      } else {
        toast.error(data.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('An error occurred while deleting the topic');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleSubTopicClick = (subtopicId) => {
    // Navigate to the appropriate subtopic page based on context
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`);
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
        ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}`
        : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}`;

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
        setTopic(data.topic);
      } else {
        toast.error(data.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An error occurred while saving the content');
    }
  };

  const handleBackClick = () => {
    // Navigate back to the appropriate chapter page based on context
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}`);
    }
  };

  const handleTopicDataStore = () => {
    // Navigate to the appropriate datastore page based on context
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/datastore`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/datastore`);
    }
  };

  const handleTopicAssetsClick = () => {
    if (!effectiveBookId || !chapterId || !topicId) {
      toast.error('Invalid IDs. Cannot access assets.');
      return;
    }
    
    if (isWorkbook) {
      navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/assets`);
    } else {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/assets`);
    }
  };

  const handleChatWithTopic = () => {
    if (!effectiveBookId || !chapterId || !topicId) {
      toast.error('Invalid IDs. Cannot start chat.');
      return;
    }
    
    const chatId = effectiveBookId;
    const chatType = isWorkbook ? 'workbook-topic' : 'topic';
    
    navigate(`/chat/${chatId}?type=${chatType}&chapterId=${chapterId}&topicId=${topicId}&title=${encodeURIComponent(topic?.title || '')}`);
  };

  const handleSubTopicQRCodeClick = (subtopicId) => {
    setSelectedSubTopicId(subtopicId);
    setShowSubTopicQRCodeModal(true);
  };

  const handleAddAISWB = () => {
    const token = Cookies.get('usertoken');
    if (!token) {
      toast.error('Please login to access AISWB management');
      navigate('/login');
      return;
    }

    // Validate all required IDs
    if (!effectiveBookId || !chapterId || !topicId) {
      toast.error('Invalid IDs. Cannot access AISWB management.');
      return;
    }

    // Ensure we have a valid topic
    if (!topic) {
      toast.error('Topic information not available. Please try again.');
      return;
    }
    
    try {
      // Navigate to the AISWB management page based on context
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/aiswb`);
      } else {
        navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/aiswb`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate to AISWB management. Please try again.');
    }
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
          <span>Back to Chapter</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{topic?.title}</h1>
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <button 
                onClick={handleEditTopic}
                className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <Edit size={16} className="mr-1" />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDeleteTopic}
                className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} className="mr-1" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{topic?.description || 'No description available'}</p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={handleTopicDataStore}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
            >
              <Database size={16} className="mr-2" />
              <span>Topic Datastore</span>
            </button>
            
            <button 
              onClick={handleAddSubTopic}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              <span>Add Sub-Topic</span>
            </button>
            
            <button 
              onClick={handleChatWithTopic}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
            >
              <MessageSquare size={16} className="mr-2" />
              <span>Chat with Topic</span>
            </button>
            
            <button 
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
              onClick={() => setShowQRCodeModal(true)}
            >
              <QrCode size={16} className="mr-2" />
              <span>Topic QR</span>
            </button>

            <button 
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
              onClick={handleTopicAssetsClick}
            >
              <Database size={16} className="mr-2" />
              <span>Topic Assets</span>
            </button>

            <button 
              onClick={handleAddAISWB}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
            >
              <BookOpen size={16} className="mr-2" />
              <span>Add AISWB</span>
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Content</h2>
            <RichTextEditor 
              initialContent={topic?.content} 
              onSave={handleSaveContent} 
              readOnly={!isEditingContent}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sub-Topics</h2>
        
        {subtopics.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No sub-topics yet</h3>
            <p className="text-gray-600 mb-6">Add your first sub-topic to expand your content</p>
            <button 
              onClick={handleAddSubTopic}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              <span>Add Sub-Topic</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subtopics
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((subtopic) => (
                <SubTopicItem 
                  key={subtopic._id} 
                  subtopic={subtopic} 
                  onClick={() => handleSubTopicClick(subtopic._id)}
                  onQRCodeClick={handleSubTopicQRCodeClick}
                />
              ))}
          </div>
        )}
      </div>

      <EditTopicModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topic={topic}
        onUpdate={handleTopicUpdated}
      />

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDeleteTopic}
        title="Delete Topic"
        message="Are you sure you want to delete this topic? All content will be permanently removed."
      />

      <AddSubTopicModal 
        isOpen={showAddSubTopicModal} 
        onClose={() => setShowAddSubTopicModal(false)} 
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        onAdd={handleSubTopicAdded}
      />

      <QRCodeModalTopic
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        topicTitle={topic?.title}
      />

      <QRCodeModalSubTopic
        isOpen={showSubTopicQRCodeModal}
        onClose={() => setShowSubTopicQRCodeModal(false)}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={selectedSubTopicId}
        subtopicTitle={subtopics.find(t => t._id === selectedSubTopicId)?.title}
      />
    </div>
  );
};

export default TopicDetail;