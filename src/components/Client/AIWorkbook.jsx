import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Plus, AlertTriangle, Image, Upload, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Workbook Item Component
const WorkbookItem = ({ workbook, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100"
  >
    <div className="h-48 bg-gradient-to-br from-green-50 to-teal-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
      {workbook.coverImage ? (
        <img 
          src={workbook.coverImage.startsWith('data:') ? workbook.coverImage : `http://localhost:5000/${workbook.coverImage}`} 
          alt={workbook.title} 
          className="h-full w-full object-cover rounded-lg"
        />
      ) : (
        <FileText size={64} className="text-teal-400" />
      )}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{workbook.title}</h3>
    <p className="text-gray-600 text-sm flex-grow">{workbook.description || 'No description available'}</p>
    <div className="flex justify-end mt-4">
      <span className="flex items-center text-teal-600 font-medium text-sm">
        View Details
        <ChevronRight size={18} className="ml-1" />
      </span>
    </div>
  </div>
);

// Image Upload Preview Component
const ImageUploadPreview = ({ imagePreview, onRemove }) => {
  if (!imagePreview) return null;
  
  return (
    <div className="relative mt-2 mb-4">
      <div className="h-48 w-full rounded-md overflow-hidden">
        <img 
          src={imagePreview} 
          alt="Cover preview" 
          className="h-full w-full object-cover"
        />
      </div>
      <button 
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Add Workbook Modal Component
const AddWorkbookModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setCoverImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      const response = await fetch('http://localhost:5000/api/workbooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Workbook created successfully!');
        onAdd(data.workbook);
        onClose();
      } else {
        toast.error(data.message || 'Failed to create workbook');
      }
    } catch (error) {
      console.error('Error creating workbook:', error);
      toast.error('An error occurred while creating the workbook');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Workbook</h2>
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
          
          {/* Cover Image Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Cover Image</label>
            <ImageUploadPreview imagePreview={imagePreview} onRemove={handleRemoveImage} />
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (Max: 5MB)</p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
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
                'Create Workbook'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main AIWorkbook component
const AIWorkbook = () => {
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const fetchWorkbooks = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/workbooks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkbooks(data.workbooks || []);
      } else {
        setError(data.message || 'Failed to fetch workbooks');
      }
    } catch (error) {
      console.error('Error fetching workbooks:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkbooks();
  }, [navigate]);

  const handleAddWorkbook = () => {
    setShowAddModal(true);
  };

  const handleWorkbookAdded = (newWorkbook) => {
    setWorkbooks([...workbooks, newWorkbook]);
  };

  const handleWorkbookClick = (workbookId) => {
    navigate(`/ai-workbook/${workbookId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">AI Workbooks</h1>
        <div className="flex flex-wrap gap-3">
          
          <button 
            onClick={handleAddWorkbook}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Workbook</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : workbooks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No workbooks yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI workbook to get started</p>
          <button 
            onClick={handleAddWorkbook}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Workbook</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {workbooks.map((workbook) => (
            <WorkbookItem 
              key={workbook._id} 
              workbook={workbook} 
              onClick={() => handleWorkbookClick(workbook._id)}
            />
          ))}
        </div>
      )}

      <AddWorkbookModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleWorkbookAdded}
      />
    </div>
  );
};

export default AIWorkbook; 