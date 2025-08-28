import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ChevronRight, Plus, Database, ArrowLeft, Edit, Trash2, AlertTriangle, MessageSquare, QrCode } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCodeModalChapter from './QRCodeModalChapter';
import QRCodeModalTopic from './QRCodeModalTopic';

// Topic Item Component
const TopicItem = ({ topic, onClick, onQRCodeClick, isWorkbook }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-center">
      <div 
        onClick={onClick}
        className="flex-grow flex items-center cursor-pointer"
      >
        <div className={`p-3 ${isWorkbook ? 'bg-teal-100' : 'bg-emerald-100'} rounded-full mr-4 flex-shrink-0`}>
          <FileText size={22} className={isWorkbook ? 'text-teal-600' : 'text-emerald-600'} />
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-gray-800">{topic.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{topic.description || 'No description'}</p>
        </div>
        <div className={`flex items-center ${isWorkbook ? 'text-teal-600' : 'text-emerald-600'}`}>
          <span className="mr-1 text-sm font-medium hidden md:block">View</span>
          <ChevronRight size={18} />
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onQRCodeClick(topic._id);
        }}
        className="ml-4 p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
        title="Show QR Code"
      >
        <QrCode size={18} />
      </button>
    </div>
  </div>
);

// Add Topic Modal Component
const AddTopicModal = ({ isOpen, onClose, bookId, chapterId, workbookId, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Determine context from URL
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  
  // Use the appropriate ID based on context
  const effectiveBookId = isWorkbook ? workbookId : bookId;

  // Validate props on component mount
  useEffect(() => {
    if (isOpen) {
      // Clear any previous errors when the modal opens
      setError('');
      
      console.log('AddTopicModal opened with:', { 
        isWorkbook, 
        bookId, 
        workbookId, 
        chapterId, 
        effectiveBookId 
      });
      
      // Check for invalid IDs when the modal is opened
      if (isWorkbook && (!workbookId || workbookId === 'undefined')) {
        setError('Invalid workbook ID provided');
        console.error('Modal opened with invalid workbook ID:', { workbookId, location });
      } else if (!isWorkbook && (!bookId || bookId === 'undefined')) {
        setError('Invalid book ID provided');
        console.error('Modal opened with invalid book ID:', { bookId, location });
      }
      
      if (!chapterId || chapterId === 'undefined') {
        setError('Invalid chapter ID provided');
        console.error('Modal opened with invalid chapterId:', chapterId);
      }
    }
  }, [isOpen, bookId, workbookId, chapterId, effectiveBookId, isWorkbook, location]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!title.trim()) {
        setError('Title is required');
        setIsSubmitting(false);
        return;
      }
      
      // Validate IDs based on context
      if (isWorkbook) {
        if (!workbookId || workbookId === 'undefined') {
          setError('Invalid workbook ID');
          console.error('Invalid workbook ID:', workbookId);
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!bookId || bookId === 'undefined') {
          setError('Invalid book ID');
          console.error('Invalid book ID:', bookId);
          setIsSubmitting(false);
          return;
        }
      }
      
      if (!chapterId || chapterId === 'undefined') {
        setError('Invalid chapter ID');
        console.error('Invalid chapterId:', chapterId);
        setIsSubmitting(false);
        return;
      }
      
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        onClose();
        return;
      }

      // Prepare the request payload
      const payload = { 
        title: title.trim(), 
        description: description.trim(),
        content: content.trim(),
        parentType: 'chapter' // Add the required parentType field
      };
      
      // Only add order if it's a valid number
      if (order && !isNaN(parseInt(order))) {
        payload.order = parseInt(order);
      }
      
      // Determine the correct API endpoint based on context
      const topicsEndpoint = isWorkbook
        ? `https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics`
        : `https://aipbbackend-yxnh.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics`;
      
      console.log('Sending topic creation request with:', {
        url: topicsEndpoint,
        payload,
        isWorkbook,
        context: isWorkbook ? 'workbook' : 'book'
      });

      const response = await fetch(topicsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Topic created successfully!');
        onAdd(data.topic);
        onClose();
      } else {
        setError(data.message || 'Failed to create topic');
        toast.error(data.message || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
        setError(error.message || 'An error occurred while creating the topic');
        toast.error(error.message || 'An error occurred while creating the topic');
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
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Topic</h2>
          
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${isWorkbook ? 'focus:ring-teal-500' : 'focus:ring-emerald-500'} h-24`}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${isWorkbook ? 'focus:ring-teal-500' : 'focus:ring-emerald-500'} h-32`}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Order (optional)</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${isWorkbook ? 'focus:ring-teal-500' : 'focus:ring-emerald-500'}`}
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
                className={`px-4 py-2 ${isWorkbook ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-md transition-colors flex items-center justify-center`}
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Create Topic'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Chapter Modal Component
  const EditChapterModal = ({ isOpen, onClose, bookId, workbookId, chapter, onUpdate }) => {
    const [title, setTitle] = useState(chapter?.title || '');
    const [description, setDescription] = useState(chapter?.description || '');
    const [order, setOrder] = useState(chapter?.order !== undefined ? chapter.order.toString() : '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // Determine context from URL
    const location = window.location.pathname;
    const isWorkbook = location.includes('/ai-workbook/');
    
    // Use the appropriate ID based on context
    const effectiveBookId = isWorkbook ? workbookId : bookId;

    useEffect(() => {
      if (chapter) {
        setTitle(chapter.title || '');
        setDescription(chapter.description || '');
        setOrder(chapter.order !== undefined ? chapter.order.toString() : '');
      }
    }, [chapter]);

    if (!isOpen || !chapter) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      
      try {
        // Validate context and IDs
        if (isWorkbook && (!workbookId || workbookId === 'undefined')) {
          setError('Invalid workbook ID');
          setIsSubmitting(false);
          return;
        }
        
        if (!isWorkbook && (!bookId || bookId === 'undefined')) {
          setError('Invalid book ID');
          setIsSubmitting(false);
          return;
        }
        
        if (!chapter || !chapter._id) {
          setError('Invalid chapter data');
          setIsSubmitting(false);
          return;
        }
        
        const token = Cookies.get('usertoken');
        if (!token) {
          setError('Authentication required');
          onClose();
          return;
        }

        // Determine the correct API endpoint based on context
        const updateEndpoint = isWorkbook
          ? `https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters/${chapter._id}`
          : `https://aipbbackend-yxnh.onrender.com/api/books/${bookId}/chapters/${chapter._id}`;
          
        console.log('Updating chapter via:', { updateEndpoint, isWorkbook });

        const response = await fetch(updateEndpoint, {
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
          console.error('Server error response for chapter update:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          toast.success('Chapter updated successfully!');
          onUpdate(data.chapter);
          onClose();
        } else {
          setError(data.message || 'Failed to update chapter');
          toast.error(data.message || 'Failed to update chapter');
        }
      } catch (error) {
        console.error('Error updating chapter:', error);
        setError(error.message || 'An error occurred while updating the chapter');
        toast.error(error.message || 'An error occurred while updating the chapter');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Chapter</h2>
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
                  'Update Chapter'
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

  // Main ChapterDetail component
  const ChapterDetail = () => {
    const [chapter, setChapter] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const params = useParams(); // Get all params
    const navigate = useNavigate();
    const [showQRCodeModal, setShowQRCodeModal] = useState(false);
    const [showTopicQRCodeModal, setShowTopicQRCodeModal] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    
    // Extract params
    const { bookId, workbookId, chapterId } = params;
    
    // Check URL path to determine context
    const location = window.location.pathname;
    const isWorkbook = location.includes('/ai-workbook/');
    
    // Use the appropriate ID based on context
    const effectiveBookId = isWorkbook ? workbookId : bookId;
    
    // Debug output to help diagnose issues
    useEffect(() => {
      console.log('ChapterDetail context:', { 
        location, 
        isWorkbook, 
        bookId, 
        workbookId, 
        chapterId, 
        effectiveBookId,
        allParams: params
      });
    }, [location, isWorkbook, bookId, workbookId, chapterId, effectiveBookId, params]);
    
    useEffect(() => {
      const fetchChapterDetails = async () => {
        setLoading(true);
        try {
          // Validate IDs
          if (!chapterId || chapterId === 'undefined') {
            console.error('Invalid chapter ID:', chapterId);
            setError('Invalid chapter ID');
            setLoading(false);
            return;
          }
          
          // For workbook context, we need workbookId
          if (isWorkbook && (!workbookId || workbookId === 'undefined')) {
            console.error('Invalid workbook ID for workbook context:', workbookId);
            setError('Invalid workbook ID');
            setLoading(false);
            return;
          }
          
          // For book context, we need bookId
          if (!isWorkbook && (!bookId || bookId === 'undefined')) {
            console.error('Invalid book ID for book context:', bookId);
            setError('Invalid book ID');
            setLoading(false);
            return;
          }
    
          const token = Cookies.get('usertoken');
          if (!token) {
            setError('Authentication required');
            navigate('/auth');
            return;
          }
    
          // Determine the API endpoints based on whether it's a workbook or regular book
          const baseEndpoint = isWorkbook 
            ? `https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}`
            : `https://aipbbackend-yxnh.onrender.com/api/books/${bookId}/chapters/${chapterId}`;
          
          // For workbook topics, we should try to fetch the chapter first since
          // the topics endpoint might not be fully implemented on the backend
          console.log('Fetching chapter from endpoint:', { baseEndpoint, isWorkbook });
          
          const chapterResponse = await fetch(baseEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!chapterResponse.ok) {
            console.error('Chapter request failed with status:', chapterResponse.status);
            setError(`Failed to fetch chapter details (${chapterResponse.status})`);
            setLoading(false);
            return;
          }
          
          const chapterData = await chapterResponse.json();
          if (chapterData.success) {
            setChapter(chapterData.chapter);
          } else {
            setError(chapterData.message || 'Failed to fetch chapter details');
            setLoading(false);
            return;
          }
          
          // Now try to fetch topics, but be more lenient with errors
          try {
            const topicsEndpoint = isWorkbook
              ? `https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics`
              : `https://aipbbackend-yxnh.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics`;
            
            console.log('Attempting to fetch topics from:', { topicsEndpoint, isWorkbook });
            
            const topicsResponse = await fetch(topicsEndpoint, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (topicsResponse.ok) {
              const topicsData = await topicsResponse.json();
              if (topicsData.success) {
                setTopics(topicsData.topics || []);
              } else {
                console.warn('Topics request returned non-success:', topicsData.message);
                // Still set empty topics array
                setTopics([]);
              }
            } else {
              console.warn(`Topics request failed with status: ${topicsResponse.status} - this is expected for workbook chapters if the backend doesn't fully support topics for workbooks yet`);
              // Set empty topics array - this is expected for workbook chapters
              setTopics([]);
            }
          } catch (topicsError) {
            console.warn('Error fetching topics (continuing anyway):', topicsError);
            // Continue with empty topics
            setTopics([]);
          }
          
          // Complete loading - even if topics failed, we can still show the chapter
          setLoading(false);
          
        } catch (error) {
          console.error('Error fetching chapter details:', error);
          setError('Failed to connect to the server');
          setLoading(false);
        }
      };

      fetchChapterDetails();
    }, [bookId, workbookId, chapterId, navigate, isWorkbook]);

    const handleDataStoreClick = () => {
      if (!effectiveBookId || effectiveBookId === 'undefined' || !chapterId || chapterId === 'undefined') {
        toast.error('Invalid book or chapter ID');
        return;
      }
      
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/datastore`);
      } else {
        navigate(`/ai-books/${bookId}/chapters/${chapterId}/datastore`);
      }
    };

    const handleChapterAssetsClick = () => {
      if (!effectiveBookId || effectiveBookId === 'undefined' || !chapterId || chapterId === 'undefined') {
        toast.error('Invalid book or chapter ID');
        return;
      }
      
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/assets`);
      } else {
        navigate(`/ai-books/${bookId}/chapters/${chapterId}/assets`);
      }
    };

    const handleAddTopic = () => {
      // Validate IDs before showing the modal
      if (!chapterId || chapterId === 'undefined') {
        toast.error('Invalid chapter ID. Cannot add a topic.');
        return;
      }
      
      // For workbook context
      if (isWorkbook) {
        if (!workbookId || workbookId === 'undefined') {
          toast.error('Invalid workbook ID. Cannot add a topic.');
          console.error('Invalid IDs when trying to add topic in workbook context:', { workbookId, chapterId });
          return;
        }
      } 
      // For book context
      else {
        if (!bookId || bookId === 'undefined') {
          toast.error('Invalid book ID. Cannot add a topic.');
          console.error('Invalid IDs when trying to add topic in book context:', { bookId, chapterId });
          return;
        }
      }
      
      // Show the modal only if we have valid IDs
      console.log('Opening add topic modal with:', { isWorkbook, bookId, workbookId, chapterId });
      setShowAddModal(true);
    };

    const handleTopicAdded = (newTopic) => {
      console.log('Topic added successfully:', { newTopic, isWorkbook, bookId, workbookId, chapterId });
      setTopics([...topics, newTopic]);
    };

    const handleEditChapter = () => {
      setShowEditModal(true);
    };

    const handleChapterUpdated = (updatedChapter) => {
      setChapter(updatedChapter);
    };

    const handleDeleteChapter = () => {
      setShowDeleteModal(true);
    };

    const confirmDeleteChapter = async () => {
      try {
        // Validate context and IDs
        if (isWorkbook && (!workbookId || workbookId === 'undefined')) {
          toast.error('Invalid workbook ID');
          setShowDeleteModal(false);
          return;
        }
        
        if (!isWorkbook && (!bookId || bookId === 'undefined')) {
          toast.error('Invalid book ID');
          setShowDeleteModal(false);
          return;
        }
        
        if (!chapterId || chapterId === 'undefined') {
          toast.error('Invalid chapter ID');
          setShowDeleteModal(false);
          return;
        }
        
        const token = Cookies.get('usertoken');
        if (!token) {
          toast.error('Authentication required');
          setShowDeleteModal(false);
          return;
        }

        // Determine the appropriate endpoint based on context
        const deleteEndpoint = isWorkbook
          ? `https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}`
          : `https://aipbbackend-yxnh.onrender.com/api/books/${bookId}/chapters/${chapterId}`;
          
        console.log('Deleting chapter via:', { deleteEndpoint, isWorkbook });

        const response = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Chapter deleted successfully!');
          
          // Navigate back to the appropriate page
          if (isWorkbook) {
            navigate(`/ai-workbook/${workbookId}`);
          } else {
            navigate(`/ai-books/${bookId}`);
          }
        } else {
          toast.error(data.message || 'Failed to delete chapter');
        }
      } catch (error) {
        console.error('Error deleting chapter:', error);
        toast.error('An error occurred while deleting the chapter');
      } finally {
        setShowDeleteModal(false);
      }
    };

    const handleTopicClick = (topicId) => {
      if (!topicId || topicId === 'undefined') {
        toast.error('Invalid topic ID');
        return;
      }
      
      if (!effectiveBookId || effectiveBookId === 'undefined' || !chapterId || chapterId === 'undefined') {
        toast.error('Invalid book or chapter ID');
        return;
      }
      
      // Navigate to the appropriate route based on whether it's a workbook or regular book
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}`);
      } else {
        navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`);
      }
    };

    const handleBackClick = () => {
      // Go back to the appropriate page based on whether it's a workbook or regular book
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}`);
      } else {
        navigate(`/ai-books/${bookId}`);
      }
    };

    const handleTopicQRCodeClick = (topicId) => {
      setSelectedTopicId(topicId);
      setShowTopicQRCodeModal(true);
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
            className={`flex items-center ${isWorkbook ? 'text-teal-600 hover:text-teal-800' : 'text-indigo-600 hover:text-indigo-800'} transition-colors`}
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to {isWorkbook ? 'Workbook' : 'Book'}</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{chapter?.title}</h1>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <button 
                  onClick={handleEditChapter}
                  className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  <Edit size={16} className="mr-1" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={handleDeleteChapter}
                  className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} className="mr-1" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
            <p className="text-gray-700 mb-6">{chapter?.description || 'No description available'}</p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleDataStoreClick}
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
              >
                <Database size={16} className="mr-2" />
                <span>Chapter Datastore</span>
              </button>
              
              <button 
                onClick={handleAddTopic}
                className={`flex items-center px-4 py-2 ${isWorkbook ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-md transition-colors shadow-sm`}
              >
                <Plus size={16} className="mr-2" />
                <span>Add Topic</span>
              </button>
              
              <button 
                onClick={() => {
                  if (!effectiveBookId || effectiveBookId === 'undefined' || !chapterId || chapterId === 'undefined') {
                    toast.error('Invalid book or chapter ID');
                    return;
                  }
                  
                  // Use the appropriate ID based on type
                  const chatId = isWorkbook ? workbookId : bookId;
                  const chatType = isWorkbook ? 'workbook-chapter' : 'chapter';
                  
                  navigate(`/chat/${chatId}?type=${chatType}&chapterId=${chapterId}&title=${encodeURIComponent(chapter?.title || '')}`);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
              >
                <MessageSquare size={16} className="mr-2" />
                <span>Chat with Chapter</span>
              </button>
              
              <button 
                onClick={() => setShowQRCodeModal(true)}
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
              >
                <QrCode size={16} className="mr-2" />
                <span>Chapter QR</span>
              </button>

              <button 
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
                onClick={handleChapterAssetsClick}
              >
                <Database size={16} className="mr-2" />
                <span>Chapter Assets</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Topics</h2>
          
          {topics.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              
              {/* Now allow topics for workbooks too */}
              <h3 className="text-xl font-medium text-gray-800 mb-2">No topics yet</h3>
              <p className="text-gray-600 mb-6">Add your first topic to start building your chapter</p>
              <button 
                onClick={handleAddTopic}
                className={`inline-flex items-center px-4 py-2 ${isWorkbook ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-md transition-colors`}
              >
                <Plus size={16} className="mr-2" />
                <span>Add Topic</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {topics
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((topic) => (
                  <TopicItem 
                    key={topic._id} 
                    topic={topic} 
                    onClick={() => handleTopicClick(topic._id)}
                    onQRCodeClick={handleTopicQRCodeClick}
                    isWorkbook={isWorkbook}
                  />
                ))}
            </div>
          )}
        </div>

        <AddTopicModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          bookId={bookId || ''} 
          chapterId={chapterId || ''}
          onAdd={handleTopicAdded}
          workbookId={workbookId || ''}
        />

        <EditChapterModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          bookId={bookId}
          workbookId={workbookId}
          chapter={chapter}
          onUpdate={handleChapterUpdated}
        />

        <DeleteConfirmModal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)} 
          onConfirm={confirmDeleteChapter}
          title="Delete Chapter"
          message="Are you sure you want to delete this chapter? All topics and content will be permanently removed."
        />

        <QRCodeModalChapter
          isOpen={showQRCodeModal}
          onClose={() => setShowQRCodeModal(false)}
          bookId={bookId}
          chapterId={chapterId}
          chapterTitle={chapter?.title}
          isWorkbook={isWorkbook}
          workbookId={workbookId}
        />

        <QRCodeModalTopic
          isOpen={showTopicQRCodeModal}
          onClose={() => setShowTopicQRCodeModal(false)}
          bookId={bookId}
          chapterId={chapterId}
          topicId={selectedTopicId}
          topicTitle={topics.find(t => t._id === selectedTopicId)?.title}
          isWorkbook={isWorkbook}
          workbookId={workbookId}
        />
      </div>
    );
  };

  export default ChapterDetail;