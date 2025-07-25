import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Plus, AlertTriangle, Image, Upload, X, TrendingUp, Star, Edit, Book } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Add constants for languages and categories (can be hardcoded or fetched if needed)
const LANGUAGES = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
];
const CATEGORY_MAPPINGS = {
  'Civil Services': ['UPSC(IAS)', 'BPSC', 'UPPCS', 'JPSC', 'RPSC', 'MPPCS'],
  'SSC': ['SSC-CGL', 'SSC-CHSL', 'SSC-GD'],
  'Defense': ['NDA', 'CDS', 'AFCAT'],
  'Teacher': ['DSSSB', 'CTET', 'UPTET', 'Bihar-TET'],
  'Law': ['CLAT', 'DU-LLB', 'JUDICIARY'],
  'CA': ['CA-Foundation', 'CA-Inter', 'CA-Final'],
  'CMA': ['CMA-Foundation', 'CMA-Inter', 'CMA-Final'],
  'CS': ['CS-Executive', 'CS-Professional'],
  'NCERT': ['1st CLASS', '2nd CLASS', '3rd CLASS', '4th CLASS', '5th CLASS', '6th CLASS', '7th CLASS', '8th CLASS', '9th CLASS', '10th CLASS', '11th CLASS', '12th CLASS'],
  'Other': ['Other']
};

// Workbook Item Component
const WorkbookItem = ({ workbook, onClick, onEdit }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleDelete = async (e) => {
      e.stopPropagation();
      setShowDeleteModal(true);
      setShowMenu(false);
    };

    const handleEdit = (e) => {
      e.stopPropagation();
      setShowMenu(false);
      onEdit(workbook);
    };

    // Highlight/Trending handlers
    const handleToggleHighlight = async (e) => {
      e.stopPropagation();
      try {
        const token = Cookies.get('usertoken');
        const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/workbooks/${workbook._id}/highlight`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          toast.success(data.message || 'Highlight status updated');
          if (data.workbook) onEdit(data.workbook);
        } else {
          toast.error(data.message || 'Failed to update highlight');
        }
      } catch (error) {
        toast.error('Failed to update highlight');
      }
    };
    const handleToggleTrending = async (e) => {
      e.stopPropagation();
      try {
        const token = Cookies.get('usertoken');
        const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/workbooks/${workbook._id}/trend`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          toast.success(data.message || 'Trending status updated');
          if (data.workbook) onEdit(data.workbook);
        } else {
          toast.error(data.message || 'Failed to update trending');
        }
      } catch (error) {
        toast.error('Failed to update trending');
      }
    };

    return (
      <div className="flex flex-col">
      {/* Book Card */}
      <div 
        onClick={onClick}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 relative"
      >
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {workbook.isHighlighted && (
            <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
              <Star size={12} />
            </div>
          )}
          {workbook.isTrending && (
            <div className="bg-red-100 text-red-800 p-1 rounded-full">
              <TrendingUp size={12} />
            </div>
          )}
          {/* Three dots menu button */}
          <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-full transition-colors text-gray-400 hover:text-red-600 hover:bg-pink-100 bg-pink-50"
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                  >
                    <Edit size={14} className="mr-2" />
                    Edit Book
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <X size={14} className="mr-2" />
                    Delete Book
                  </button>
                </div>
              )}
            </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{workbook.title}</h3>
        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
          {workbook.coverImageUrl ? (
            <img 
              src={workbook.coverImageUrl} 
              alt={workbook.title} 
              className="h-full w-full object-fill rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
              }}
            />
          ) : workbook.coverImage ? (
            <img 
              src={workbook.coverImage} 
              alt={workbook.title} 
              className="h-full w-full object-fill rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
              }}
            />
          ) : (
            <Book size={64} className="text-indigo-400" />
          )}
        </div>
        <p className="text-gray-600 text-sm mb-2">by {workbook.author}</p>
        <p className="text-gray-500 text-xs mb-2">{workbook.publisher}</p>
        <p className="text-gray-600 text-sm flex-grow">{workbook.description || 'No description available'}</p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleHighlight}
              className={`p-1 rounded transition-colors ${
                workbook.isHighlighted 
                  ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
              }`}
              title={workbook.isHighlighted ? 'Remove from highlights' : 'Add to highlights'}
            >
              <Star size={16} />
            </button>
            <button
              onClick={handleToggleTrending}
              className={`p-1 rounded transition-colors ${
                workbook.isTrending 
                  ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={workbook.isTrending ? 'Remove from trending' : 'Add to trending'}
            >
              <TrendingUp size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Book</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{workbook.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(workbook._id)}
                className="px-4 py-2 text-white bg-red-200 rounded-md hover:bg-red-300 transition-colors"
              >
                Confirm
              </button>
              {/* You may want to add a delete handler here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

// Replace AddWorkbookModal with a new version that matches the backend model and S3 upload logic
const AddWorkbookModal = ({ isOpen, onClose, onAdd, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    publisher: '',
    language: 'English',
    mainCategory: 'Other',
    subCategory: 'Other',
    customSubCategory: '',
    exam: '',
    paper: '',
    subject: '',
    tags: '',
    summary: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'mainCategory' && { subCategory: CATEGORY_MAPPINGS[value]?.[0] || 'Other', customSubCategory: '' })
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      // Validate required fields
      const requiredFields = ['title', 'description', 'author', 'publisher'];
      for (const field of requiredFields) {
        if (!formData[field] || !formData[field].trim()) {
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setIsSubmitting(false);
          return;
        }
      }
      let coverImageKey = null;
      if (coverImage) {
        // Get presigned URL
        const uploadUrlResponse = await fetch('https://aipbbackend-c5ed.onrender.com/api/workbooks/cover-upload-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: coverImage.name,
            contentType: coverImage.type
          })
        });
        const uploadUrlData = await uploadUrlResponse.json();
        if (!uploadUrlData.success) {
          throw new Error(uploadUrlData.message || 'Failed to get upload URL');
        }
        // Upload to S3
        const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
          method: 'PUT',
          body: coverImage,
          headers: { 'Content-Type': coverImage.type }
        });
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to S3');
        }
        coverImageKey = uploadUrlData.key;
      }
      // Prepare data for backend
      const workbookData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        language: formData.language,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        summary: formData.summary.trim(),
        clientId: currentUser?.userId || currentUser?.id,
      };
      if (formData.customSubCategory && formData.subCategory === 'Other') {
        workbookData.customSubCategory = formData.customSubCategory.trim();
      }
      if (formData.exam) workbookData.exam = formData.exam.trim();
      if (formData.paper) workbookData.paper = formData.paper.trim();
      if (formData.subject) workbookData.subject = formData.subject.trim();
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0 && tag.length <= 30).slice(0, 10);
        if (tagsArray.length > 0) workbookData.tags = tagsArray;
      }
      if (coverImageKey) workbookData.coverImageKey = coverImageKey;
      // Send to backend
      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/workbooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workbookData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Workbook created successfully!');
        onAdd(data.workbook);
        onClose();
        setFormData({
          title: '', description: '', author: '', publisher: '', language: 'English', mainCategory: 'Other', subCategory: 'Other', customSubCategory: '', exam: '', paper: '', subject: '', tags: '', summary: ''
        });
        setCoverImage(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
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

  const getValidSubCategories = () => {
    return CATEGORY_MAPPINGS[formData.mainCategory] || ['Other'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Workbook</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required maxLength={100} placeholder="Enter workbook title" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Creator (Author) *</label>
                <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required maxLength={100} placeholder="Enter author name" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Institution (Publisher) *</label>
                <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required maxLength={100} placeholder="Enter publisher name" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Language *</label>
                <select name="language" value={formData.language} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  {LANGUAGES.map(lang => (<option key={lang} value={lang}>{lang}</option>))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24" maxLength={1000} required placeholder="Enter a detailed description of the workbook..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Main Category *</label>
                <select name="mainCategory" value={formData.mainCategory} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  {Object.keys(CATEGORY_MAPPINGS).map(category => (<option key={category} value={category}>{category}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Sub Category *</label>
                <select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                  {getValidSubCategories().map(subCategory => (<option key={subCategory} value={subCategory}>{subCategory}</option>))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Custom Subcategory (if Other)</label>
              <input type="text" name="customSubCategory" value={formData.customSubCategory} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" maxLength={50} placeholder="Enter custom subcategory if needed" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Exam</label>
                <input type="text" name="exam" value={formData.exam} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" maxLength={100} placeholder="e.g. UPSC, SSC" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Paper</label>
                <input type="text" name="paper" value={formData.paper} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" maxLength={100} placeholder="e.g. Prelims, Mains" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Subject</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" maxLength={100} placeholder="e.g. Mathematics, History" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Tags (comma separated, max 10 tags, 30 chars each)</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., exam prep, study guide, mathematics" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Summary</label>
              <textarea name="summary" value={formData.summary} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24" maxLength={500} placeholder="Enter a brief summary of the workbook..." />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Cover Image (Optional)</label>
              <ImageUploadPreview imagePreview={imagePreview} onRemove={handleRemoveImage} />
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (Max: 5MB)</p>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center">
                {isSubmitting ? (<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>) : ('Create Workbook')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditBookModal = ({ isOpen, onClose, onEdit, book, currentUser, categoryMappings }) => {
  const [formData, setFormData] = useState({
    title: book.title || '',
    description: book.description || '',
    author: book.author || '',
    publisher: book.publisher || '',
    language: book.language || 'English',
    mainCategory: book.mainCategory || 'Other',
    subCategory: book.subCategory || 'Other',
    exam: book.exam || '',
    paper: book.paper || '',
    subject: book.subject || '',
    tags: book.tags ? book.tags.join(', ') : '',
    isHighlighted: book.isHighlighted || false,
    categoryOrder: book.categoryOrder || 0,
    rating: book.rating || 0,
    ratingCount: book.ratingCount || 0,
    conversations: book.conversations || [],
    users: book.users || [],
    summary: book.summary || ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(book.coverImageUrl || book.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const languages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
  ];
  
  const [formErrors, setFormErrors] = useState({
    rating: '',
    ratingCount: '',
    summary: ''
  });
  
  if (!isOpen) return null;
  
  const validateForm = () => {
    const errors = {};
    
    if (formData.rating && (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5)) {
      errors.rating = 'Rating must be between 0 and 5';
    }
    
    if (formData.ratingCount && (isNaN(formData.ratingCount) || formData.ratingCount < 0)) {
      errors.ratingCount = 'Rating count must be a non-negative number';
    }
    
    if (formData.summary && formData.summary.length > 1000) {
      errors.summary = 'Summary cannot exceed 1000 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'rating' || name === 'ratingCount' || name === 'categoryOrder') {
      const numValue = value === '' ? '' : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else if (name === 'conversations' || name === 'users') {
      const arrayValue = value.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      setFormData(prev => ({
        ...prev,
        [name]: arrayValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        ...(name === 'mainCategory' && { 
          subCategory: categoryMappings[value]?.[0] || 'Other',
          customSubCategory: '' 
        })
      }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setCoverImage(file);
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
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        onClose();
        return;
      }
      
      const requiredFields = ['title', 'description', 'author', 'publisher'];
      for (const field of requiredFields) {
        if (!formData[field] || !formData[field].trim()) {
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setIsSubmitting(false);
          return;
        }
      }

      let coverImageKey = null;
      
      if (coverImage) {
        try {
          const uploadUrlResponse = await fetch('https://aipbbackend-c5ed.onrender.com/api/workbooks/cover-upload-url', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: coverImage.name,
              contentType: coverImage.type
            })
          });

          const uploadUrlData = await uploadUrlResponse.json();
          
          if (!uploadUrlData.success) {
            throw new Error(uploadUrlData.message || 'Failed to get upload URL');
          }

          const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
            method: 'PUT',
            body: coverImage,
            headers: {
              'Content-Type': coverImage.type
            }
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to S3');
          }

          coverImageKey = uploadUrlData.key;
        } catch (error) {
          console.error('Error uploading cover image:', error);
          toast.error('Failed to upload cover image');
          setIsSubmitting(false);
          return;
        }
      }
      
      const bookData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        language: formData.language,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        isHighlighted: formData.isHighlighted,
        categoryOrder: parseInt(formData.categoryOrder) || 0,
        rating: parseFloat(formData.rating) || 0,
        ratingCount: parseInt(formData.ratingCount) || 0,
        conversations: Array.isArray(formData.conversations) ? formData.conversations : [],
        users: Array.isArray(formData.users) ? formData.users : [],
        summary: formData.summary.trim()
      };
      
      if (coverImageKey) {
        bookData.coverImageKey = coverImageKey;
      }
      
      if (formData.exam.trim()) bookData.exam = formData.exam.trim();
      if (formData.paper.trim()) bookData.paper = formData.paper.trim();
      if (formData.subject.trim()) bookData.subject = formData.subject.trim();
      
      if (currentUser) {
        const clientId = currentUser.userId || currentUser.id;
        bookData.clientId = clientId;
      }
      
      if (formData.subCategory === 'Other' && formData.customSubCategory.trim()) {
        bookData.customSubCategory = formData.customSubCategory.trim();
      }
      
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length <= 30)
          .slice(0, 10);
        if (tagsArray.length > 0) {
          bookData.tags = tagsArray;
        }
      }
      
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/workbooks/${book._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Book updated successfully!');
        onEdit(data.workbook); // Changed from data.book to data.workbook
        onClose();
      } else {
        if (Array.isArray(data.message)) {
          data.message.forEach(msg => toast.error(msg));
        } else {
          toast.error(data.message || 'Failed to update book');
        }
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('An error occurred while updating the book');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getValidSubCategories = () => {
    return categoryMappings[formData.mainCategory] || ['Other'];
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title * <span className="text-gray-500">({formData.title.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Author * <span className="text-gray-500">({formData.author.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter author name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Publisher * <span className="text-gray-500">({formData.publisher.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter publisher name"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Language *</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description * <span className="text-gray-500">({formData.description.length}/1000)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                maxLength={1000}
                required
                placeholder="Enter a detailed description of the book..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Main Category *</label>
                <select
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {Object.keys(categoryMappings).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Sub Category *</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {getValidSubCategories().map(subCategory => (
                    <option key={subCategory} value={subCategory}>{subCategory}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* New fields: Exam, Paper, Subject */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Exam <span className="text-gray-500">({formData.exam.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="exam"
                  value={formData.exam}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. UPSC, SSC"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Paper <span className="text-gray-500">({formData.paper.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="paper"
                  value={formData.paper}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Prelims, Mains"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Subject <span className="text-gray-500">({formData.subject.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Mathematics, History"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Tags (Optional)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter tags separated by commas (e.g., exam prep, study guide, mathematics)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas. Maximum 10 tags, 30 characters each.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating (0-5) {formErrors.rating && <span className="text-red-500 text-xs">*</span>}
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.rating ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Enter rating (0-5)"
                />
                {formErrors.rating && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.rating}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating Count {formErrors.ratingCount && <span className="text-red-500 text-xs">*</span>}
                </label>
                <input
                  type="number"
                  name="ratingCount"
                  value={formData.ratingCount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${formErrors.ratingCount ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  placeholder="Enter number of ratings"
                />
                {formErrors.ratingCount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.ratingCount}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Summary <span className="text-gray-500">({formData.summary.length}/1000)</span>
                {formErrors.summary && <span className="text-red-500 text-xs">*</span>}
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${formErrors.summary ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
                maxLength={500}
                placeholder="Enter a brief summary of the book..."
              />
              {formErrors.summary && (
                <p className="text-red-500 text-xs mt-1">{formErrors.summary}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Total Conversations</label>
              <input
                type="text"
                name="conversations"
                value={formData.conversations.join(', ')}
                onChange={(e) => {
                  const conversationsArray = e.target.value.split(',')
                    .map(conv => conv.trim())
                    .filter(conv => conv.length > 0);
                  setFormData(prev => ({ ...prev, conversations: conversationsArray }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter conversation IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">Enter conversation IDs separated by commas</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Total Users</label>
              <input
                type="text"
                name="users"
                value={formData.users.join(', ')}
                onChange={(e) => {
                  const usersArray = e.target.value.split(',')
                    .map(user => user.trim())
                    .filter(user => user.length > 0);
                  setFormData(prev => ({ ...prev, users: usersArray }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter user IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">Enter user IDs separated by commas</p>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isHighlighted"
                  checked={formData.isHighlighted}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 text-sm">Make this book highlighted</span>
              </label>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Cover Image (Optional)</label>
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
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Update Book'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// FiltersPanel for workbooks (adapted from AIBooks)
const FiltersPanel = ({ filters, onFiltersChange, onClearFilters, authors, publishers, allWorkbooks, categoryMappings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const customSubCategories = [...new Set(
    allWorkbooks.filter(wb => wb.subCategory === 'Other' && wb.customSubCategory)
      .map(wb => wb.customSubCategory)
  )].sort();
  const allTags = [...new Set(
    allWorkbooks.flatMap(wb => wb.tags || [])
  )].sort();
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  const getValidSubCategories = () => {
    if (!filters.mainCategory) return [];
    const standardCategories = categoryMappings[filters.mainCategory] || [];
    if (filters.mainCategory === 'Other') {
      return [...standardCategories, ...customSubCategories];
    }
    return standardCategories;
  };
  const hasActiveFilters = Object.values(filters).some(value => value && (typeof value === 'string' ? value.trim() : true));
  const handleClearFilters = (e) => {
    e.stopPropagation();
    onClearFilters();
  };
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 max-w-3xl">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-left">
            <ChevronRight size={20} className={`text-teal-600 mr-2 ${isOpen ? 'rotate-90' : ''}`} />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            {hasActiveFilters && (
              <span className="ml-2 bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">Active</span>
            )}
          </button>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-sm text-red-600 hover:text-red-800 transition-colors">Clear All</button>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <ChevronRight size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, author, or description..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
              <select
                value={filters.mainCategory || ''}
                onChange={(e) => {
                  const newMainCategory = e.target.value;
                  handleFilterChange('mainCategory', newMainCategory);
                  handleFilterChange('subCategory', '');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryMappings).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
              <select
                value={filters.subCategory || ''}
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={!filters.mainCategory}
              >
                <option value="">All Subcategories</option>
                {getValidSubCategories().map(subCategory => (
                  <option key={subCategory} value={subCategory}>{subCategory}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={filters.language || ''}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Languages</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <select
                value={filters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <select
                value={filters.tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main AIWorkbook component
const AIWorkbook = () => {
  const [workbooks, setWorkbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingWorkbook, setEditingWorkbook] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    mainCategory: '',
    subCategory: '',
    language: '',
    author: '',
    tag: ''
  });
  const [selectedSubCategories, setSelectedSubCategories] = useState({});
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
      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/workbooks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWorkbooks(data.workbooks || []);
        setCurrentUser(data.currentUser || null);
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
    // eslint-disable-next-line
  }, [navigate]);

  // Filtering logic (client-side, for now)
  const filteredWorkbooks = workbooks.filter(wb => {
    if (filters.search && !(
      wb.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      wb.author?.toLowerCase().includes(filters.search.toLowerCase()) ||
      wb.description?.toLowerCase().includes(filters.search.toLowerCase())
    )) return false;
    if (filters.mainCategory && wb.mainCategory !== filters.mainCategory) return false;
    if (filters.subCategory && (wb.subCategory !== filters.subCategory && wb.customSubCategory !== filters.subCategory)) return false;
    if (filters.language && wb.language !== filters.language) return false;
    if (filters.author && wb.author !== filters.author) return false;
    if (filters.tag && !(wb.tags && wb.tags.includes(filters.tag))) return false;
    return true;
  });

  // Group workbooks by category and subcategory
  const groupedWorkbooks = filteredWorkbooks.reduce((acc, workbook) => {
    const mainCategory = workbook.mainCategory;
    const subCategory = workbook.subCategory === 'Other' && workbook.customSubCategory
      ? workbook.customSubCategory
      : workbook.subCategory;
    if (!acc[mainCategory]) acc[mainCategory] = {};
    if (!acc[mainCategory][subCategory]) acc[mainCategory][subCategory] = [];
    acc[mainCategory][subCategory].push(workbook);
    return acc;
  }, {});

  // Get all subcategories for a main category
  const getSubCategories = (mainCategory) => {
    const standardCategories = CATEGORY_MAPPINGS[mainCategory] || [];
    const customCategories = workbooks
      .filter(wb => wb.mainCategory === mainCategory && wb.subCategory === 'Other' && wb.customSubCategory)
      .map(wb => wb.customSubCategory);
    return [...new Set([...standardCategories, ...customCategories])];
  };

  // Toggle subcategory selection
  const toggleSubCategory = (mainCategory, subCategory) => {
    setSelectedSubCategories(prev => ({
      ...prev,
      [mainCategory]: prev[mainCategory] === subCategory ? null : subCategory
    }));
  };

  // Get workbooks to display for a main category
  const getWorkbooksToDisplay = (mainCategory, subCategories) => {
    const selectedSubCategory = selectedSubCategories[mainCategory];
    if (!selectedSubCategory) {
      // If no subcategory is selected, show all workbooks in the main category
      return Object.values(subCategories).flat();
    }
    return subCategories[selectedSubCategory] || [];
  };

  const handleAddWorkbook = () => {
    setShowAddModal(true);
  };

  const handleWorkbookAdded = (newWorkbook) => {
    setWorkbooks([...workbooks, newWorkbook]);
  };

  const handleWorkbookClick = (workbookId) => {
    navigate(`/ai-workbook/${workbookId}`);
  };

  // Edit logic
  const handleEditWorkbook = (workbook) => {
    setEditingWorkbook(workbook);
    setShowEditModal(true);
  };
  const handleWorkbookEdited = (updatedWorkbook) => {
    if (!updatedWorkbook || !updatedWorkbook._id) return;
    setWorkbooks((prev) =>
      prev.map((wb) => (wb._id === updatedWorkbook._id ? updatedWorkbook : wb))
    );
  };

  // Get unique authors and publishers for filters
  const authors = [...new Set(workbooks.map(wb => wb.author))].sort();
  const publishers = [...new Set(workbooks.map(wb => wb.publisher))].sort();

  // Add filter panel and grouped view
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">AI Workbooks</h1>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleAddWorkbook} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors shadow-sm">
            <Plus size={16} className="mr-2" />
            <span>Add Workbook</span>
          </button>
        </div>
      </div>
      <FiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({ search: '', mainCategory: '', subCategory: '', language: '', author: '', tag: '' })}
        authors={authors}
        publishers={publishers}
        allWorkbooks={workbooks}
        categoryMappings={CATEGORY_MAPPINGS}
      />
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
      ) : filteredWorkbooks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No workbooks yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI workbook to get started</p>
          <button onClick={handleAddWorkbook} className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
            <Plus size={16} className="mr-2" />
            <span>Add Workbook</span>
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedWorkbooks).map(([mainCategory, subCategories]) => (
            <div key={mainCategory} className="space-y-6">
              {/* Main Category Header with Subcategory Chips */}
              <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">{mainCategory}</h2>
                </div>
              </div>
              {/* Subcategories List */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => toggleSubCategory(mainCategory, null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedSubCategories[mainCategory]
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All {mainCategory}
                </button>
                {getSubCategories(mainCategory).map(subCategory => (
                  <button
                    key={subCategory}
                    onClick={() => toggleSubCategory(mainCategory, subCategory)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSubCategories[mainCategory] === subCategory
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subCategory}
                  </button>
                ))}
              </div>
              {/* Workbooks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getWorkbooksToDisplay(mainCategory, subCategories).map((workbook) => (
                  <WorkbookItem
                    key={workbook._id}
                    workbook={workbook}
                    onClick={() => handleWorkbookClick(workbook._id)}
                    onEdit={handleEditWorkbook}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <AddWorkbookModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleWorkbookAdded}
        currentUser={currentUser}
      />
      {showEditModal && editingWorkbook && (
        <EditBookModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onEdit={handleWorkbookEdited}
          book={editingWorkbook}
          currentUser={currentUser}
          categoryMappings={CATEGORY_MAPPINGS}
        />
      )}
    </div>
  );
};

export default AIWorkbook; 