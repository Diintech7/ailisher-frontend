import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ChevronRight, Plus, Database, ArrowLeft, Trash2, Edit, AlertTriangle, X, MessageSquare, Settings } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PDFSplitter from './PDFSplitter';

const ChapterItem = ({ chapter, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center border border-gray-100"
  >
    <div className="p-3 bg-teal-100 rounded-full mr-4 flex-shrink-0">
      <FileText size={22} className="text-teal-600" />
    </div>
    <div className="flex-grow">
      <h3 className="font-medium text-gray-800">{chapter.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{chapter.description || 'No description'}</p>
    </div>
    <div className="flex items-center text-teal-600">
      <span className="mr-1 text-sm font-medium hidden md:block">View</span>
      <ChevronRight size={18} />
    </div>
  </div>
);

const AddChapterModal = ({ isOpen, onClose, workbookId, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearInputs = () => {
    setTitle('');
    setDescription('');
    setOrder('');
  };

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
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          order: order ? parseInt(order) : undefined,
          parentType: 'workbook'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Chapter created successfully!');
        onAdd(data.chapter);
        clearInputs();
        onClose();
      } else {
        toast.error(data.message || 'Failed to create chapter');
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error('An error occurred while creating the chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Chapter</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-32"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Order (optional)</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={clearInputs}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            >
              <X size={16} className="mr-1" />
              Clear
            </button>
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
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Create Chapter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditWorkbookModal = ({ isOpen, onClose, workbook, onUpdate }) => {
  const [title, setTitle] = useState(workbook?.title || '');
  const [description, setDescription] = useState(workbook?.description || '');
  const [coverImage, setCoverImage] = useState(workbook?.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workbook) {
      setTitle(workbook.title || '');
      setDescription(workbook.description || '');
      setCoverImage(workbook.coverImage || '');
    }
  }, [workbook]);

  if (!isOpen || !workbook) return null;

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
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbook._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, coverImage })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Workbook updated successfully!');
        onUpdate(data.workbook);
        onClose();
      } else {
        toast.error(data.message || 'Failed to update workbook');
      }
    } catch (error) {
      console.error('Error updating workbook:', error);
      toast.error('An error occurred while updating the workbook');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Workbook</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-32"
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
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Update Workbook'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
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

const WorkbookDetail = () => {
  const { workbookId } = useParams();
  const navigate = useNavigate();
  const [workbook, setWorkbook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showEditWorkbookModal, setShowEditWorkbookModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPDFSplitter, setShowPDFSplitter] = useState(false);

  const fetchWorkbookDetails = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }
      
      // Fetch workbook details
      const workbookResponse = await fetch(`https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const workbookData = await workbookResponse.json();
      
      if (!workbookData.success) {
        throw new Error(workbookData.message || 'Failed to fetch workbook');
      }
      
      setWorkbook(workbookData.workbook);
      
      // Fetch chapters
      const chaptersResponse = await fetch(`https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}/chapters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const chaptersData = await chaptersResponse.json();
      
      if (chaptersData.success) {
        setChapters(chaptersData.chapters || []);
      } else {
        console.error('Failed to fetch chapters:', chaptersData.message);
      }
    } catch (error) {
      console.error('Error fetching workbook details:', error);
      setError(error.message || 'Failed to fetch workbook details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkbookDetails();
  }, [workbookId, navigate]);

  const handleAddChapter = () => {
    setShowAddChapterModal(true);
  };

  const handleChapterAdded = (newChapter) => {
    setChapters([...chapters, newChapter]);
  };

  const handleEditWorkbook = () => {
    setShowEditWorkbookModal(true);
  };

  const handleWorkbookUpdated = (updatedWorkbook) => {
    setWorkbook(updatedWorkbook);
  };

  const handleDeleteWorkbook = () => {
    setShowDeleteConfirm(true);
  };

  const handleDataStoreClick = () => {
    navigate(`/ai-workbook/${workbookId}/datastore`);
  };

  const confirmDeleteWorkbook = async () => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/workbooks/${workbookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Workbook deleted successfully');
        navigate('/ai-workbook');
      } else {
        toast.error(data.message || 'Failed to delete workbook');
      }
    } catch (error) {
      console.error('Error deleting workbook:', error);
      toast.error('An error occurred while deleting the workbook');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleChapterClick = (chapterId) => {
    navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}`);
  };

  const handleBackClick = () => {
    navigate('/ai-workbook');
  };

  const handleImageError = () => {
    // Fallback if image fails to load
    if (workbook) setWorkbook({ ...workbook, coverImage: null });
  };

  const handleConfigureClick = () => {
    setShowPDFSplitter(true);
  };

  // Helper function to handle image URLs
  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:')) return imageUrl;
    return `https://aipbbackend-yxnh.onrender.com/${imageUrl}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Back button */}
      <button 
        onClick={handleBackClick}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6 group"
      >
        <ArrowLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Workbooks</span>
      </button>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      ) : workbook ? (
        <>
          {/* Workbook header */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/4 lg:w-1/5">
                <div className="bg-gradient-to-br from-teal-50 to-green-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                  {workbook?.coverImage ? (
                    <img 
                      src={getCompleteImageUrl(workbook.coverImage)} 
                      alt={workbook.title} 
                      className="h-full w-full object-cover rounded-lg"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="text-center">
                      <FileText size={64} className="mx-auto text-teal-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:w-3/4 lg:w-4/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h1 className="text-3xl font-bold text-gray-800">{workbook?.title}</h1>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <button 
                      onClick={handleEditWorkbook}
                      className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      <Edit size={16} className="mr-1" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={handleDeleteWorkbook}
                      className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">{workbook?.description || 'No description available'}</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleDataStoreClick}
                    className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
                  >
                    <Database size={16} className="mr-2" />
                    <span>Workbook DataStore</span>
                  </button>
                  <button 
                    onClick={handleAddChapter}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} className="mr-2" />
                    <span>Add Chapter</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/chat/${workbookId}?type=workbook`)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    <span>Chat with Workbook</span>
                  </button>
                  <button 
                    onClick={handleConfigureClick}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <Settings size={16} className="mr-2" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chapters section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chapters</h2>
            
            {chapters.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No chapters yet</h3>
                <p className="text-gray-600 mb-6">Add your first chapter to start building your workbook</p>
                <button 
                  onClick={handleAddChapter}
                  className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  <span>Add Chapter</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {chapters
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((chapter) => (
                    <ChapterItem 
                      key={chapter._id} 
                      chapter={chapter} 
                      onClick={() => handleChapterClick(chapter._id)}
                    />
                  ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-yellow-800">Workbook not found</h3>
            <p className="text-yellow-700">The workbook you're looking for does not exist or has been deleted.</p>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <AddChapterModal 
        isOpen={showAddChapterModal} 
        onClose={() => setShowAddChapterModal(false)} 
        workbookId={workbookId}
        onAdd={handleChapterAdded}
      />
      
      <EditWorkbookModal 
        isOpen={showEditWorkbookModal} 
        onClose={() => setShowEditWorkbookModal(false)} 
        workbook={workbook}
        onUpdate={handleWorkbookUpdated}
      />
      
      <DeleteConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteWorkbook}
        title="Delete Workbook"
        message="Are you sure you want to delete this workbook? This action cannot be undone and will delete all chapters, topics, and related data."
      />
      
      {/* PDF Splitter Modal */}
      {showPDFSplitter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Configure Workbook PDF</h2>
              <button 
                onClick={() => setShowPDFSplitter(false)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <PDFSplitter 
              bookId={workbookId} 
              bookType="workbook"
              onClose={() => setShowPDFSplitter(false)}
              onSuccess={() => {
                setShowPDFSplitter(false);
                fetchWorkbookDetails();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbookDetail; 