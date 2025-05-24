import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  Image, 
  Video, 
  Link, 
  FileType, 
  Globe, 
  Youtube, 
  Filter 
} from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DataStore = ({ type }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState([]);
  
  // Form states
  const [uploadType, setUploadType] = useState('file');
  
  // Using refs instead of state for form fields to prevent re-renders on input change
  const titleRef = useRef('');
  const descriptionRef = useRef('');
  const urlRef = useRef('');
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const { bookId, chapterId, topicId, subtopicId } = useParams();
  const navigate = useNavigate();

  // Content type filters
  const filters = [
    { id: 'all', label: 'All', icon: FileType },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'pdf', label: 'PDFs', icon: FileText },
    { id: 'url', label: 'URLs', icon: Link },
    { id: 'website', label: 'Websites', icon: Globe },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'text', label: 'Text', icon: FileText }
  ];

  // Determine API endpoint based on type (book, chapter, topic, or subtopic)
  const getApiEndpoint = () => {
    if (type === 'book' && bookId) {
      return `https://aipbbackend.onrender.com/api/datastores/book/${bookId}`;
    } else if (type === 'chapter' && bookId && chapterId) {
      return `https://aipbbackend.onrender.com/api/datastores/chapter/${chapterId}`;
    } else if (type === 'topic' && bookId && chapterId && topicId) {
      return `https://aipbbackend.onrender.com/api/datastores/topic/${topicId}`;
    } else if (type === 'subtopic' && bookId && chapterId && topicId && subtopicId) {
      return `https://aipbbackend.onrender.com/api/datastores/subtopic/${subtopicId}`;
    }
    return null;
  };

  const fetchItems = async () => {
    setLoading(true);
    const endpoint = getApiEndpoint();
    
    if (!endpoint) {
      setError('Invalid parameters');
      setLoading(false);
      return;
    }

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setItems(data.items || []);
        setFilteredItems(data.items || []);
      } else {
        setError(data.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [bookId, chapterId, topicId, subtopicId]);

  // Apply filter when activeFilter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(items);
      return;
    }
    
    let filtered;
    switch (activeFilter) {
      case 'image':
        filtered = items.filter(item => item.fileType?.startsWith('image/'));
        break;
      case 'video':
        filtered = items.filter(item => item.fileType?.startsWith('video/'));
        break;
      case 'pdf':
        filtered = items.filter(item => item.fileType === 'application/pdf');
        break;
      case 'url':
        filtered = items.filter(item => item.itemType === 'url');
        break;
      case 'website':
        filtered = items.filter(item => item.itemType === 'website');
        break;
      case 'youtube':
        filtered = items.filter(item => item.itemType === 'youtube');
        break;
      case 'text':
        filtered = items.filter(item => item.itemType === 'text');
        break;
      default:
        filtered = items;
    }
    
    setFilteredItems(filtered);
  }, [activeFilter, items]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Use the first file's name as the title suggestion (but don't auto-update the input)
    if (files.length > 0 && !titleRef.current.value) {
      titleRef.current.value = files[0].name;
    }
  };

  const resetForm = () => {
    titleRef.current.value = '';
    descriptionRef.current.value = '';
    urlRef.current.value = '';
    setSelectedFiles([]);
    setUploadType('file');
    setShowUploadModal(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get the current values directly from refs
    const title = titleRef.current.value;
    const description = descriptionRef.current.value;
    const url = urlRef.current.value;
    
    if (uploadType === 'file' && selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    
    if (uploadType !== 'file' && !url) {
      toast.error('URL is required');
      return;
    }
    
    if (!title) {
      toast.error('Title is required');
      return;
    }
    
    setUploading(true);
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const endpoint = getApiEndpoint();
      
      if (!endpoint) {
        toast.error('Invalid parameters');
        return;
      }

      let uploadedItems = [];
      
      if (uploadType === 'file') {
        // Upload files to Cloudinary
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'post_blog'); // Replace with your upload preset

          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/dsbuzlxpw/upload`, // Replace with your cloud name
            {
              method: 'POST',
              body: formData
            }
          );

          const cloudinaryData = await cloudinaryResponse.json();
          return {
            name: title || file.name,
            description: description,
            url: cloudinaryData.secure_url,
            fileType: file.type,
            itemType: getItemTypeFromFile(file)
          };
        });

        uploadedItems = await Promise.all(uploadPromises);
      } else {
        // Handle non-file uploads (URLs, YouTube, etc.)
        uploadedItems = [{
          name: title,
          description: description,
          url: url,
          fileType: 'url/link',
          itemType: uploadType
        }];
      }
      
      // Save to backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: uploadedItems
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Item(s) added successfully!');
        fetchItems(); // Refresh the list
        resetForm();
      } else {
        toast.error(data.message || 'Failed to save items');
      }
    } catch (error) {
      console.error('Error uploading items:', error);
      toast.error('An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  const getItemTypeFromFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType === 'application/pdf') return 'pdf';
    return 'file';
  };

  const getItemIcon = (item) => {
    if (item.fileType?.startsWith('image/')) {
      return <Image size={32} className="text-blue-500" />;
    }
    if (item.fileType?.startsWith('video/')) {
      return <Video size={32} className="text-purple-500" />;
    }
    if (item.fileType === 'application/pdf') {
      return <FileText size={32} className="text-red-500" />;
    }
    if (item.itemType === 'url') {
      return <Link size={32} className="text-green-500" />;
    }
    if (item.itemType === 'website') {
      return <Globe size={32} className="text-indigo-500" />;
    }
    if (item.itemType === 'youtube') {
      return <Youtube size={32} className="text-red-600" />;
    }
    if (item.itemType === 'text') {
      return <FileText size={32} className="text-gray-600" />;
    }
    return <FileText size={32} className="text-gray-400" />;
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const endpoint = `${getApiEndpoint()}/${itemId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Item deleted successfully!');
        setItems(items.filter(item => item._id !== itemId));
      } else {
        toast.error(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('An error occurred while deleting the item');
    }
  };

  const handleBackClick = () => {
    if (type === 'book') {
      navigate(`/ai-books/${bookId}`);
    } else if (type === 'chapter') {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}`);
    } else if (type === 'topic') {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`);
    } else if (type === 'subtopic') {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`);
    } else {
      navigate('/ai-books');
    }
  };

  // Modal for adding/uploading items
  const UploadModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button 
            onClick={() => setShowUploadModal(false)}
            className="text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Item Type Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Item Type</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === 'file' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <Upload size={24} className="mb-1" />
                <span>File</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('url')}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === 'url' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <Link size={24} className="mb-1" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('youtube')}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === 'youtube' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <Youtube size={24} className="mb-1" />
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('website')}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === 'website' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <Globe size={24} className="mb-1" />
                <span>Website</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('text')}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === 'text' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                <FileText size={24} className="mb-1" />
                <span>Text</span>
              </button>
            </div>
          </div>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Title*</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              ref={titleRef}
              placeholder="Enter title"
              required
            />
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              ref={descriptionRef}
              placeholder="Enter description"
              rows="3"
            />
          </div>
          
          {/* File Upload or URL Input */}
          {uploadType === 'file' ? (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">File Upload*</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileSelect}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Click to browse or drag and drop files here</p>
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                {uploadType === 'youtube' ? 'YouTube URL*' : 
                 uploadType === 'website' ? 'Website URL*' : 
                 uploadType === 'text' ? 'Text Content*' : 'URL*'}
              </label>
              {uploadType === 'text' ? (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  ref={urlRef}
                  placeholder="Enter your text content here"
                  rows="5"
                  required
                />
              ) : (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  ref={urlRef}
                  placeholder={`Enter ${uploadType} URL`}
                  required
                />
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md mr-2 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
      
      {showUploadModal && <UploadModal />}
      
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to {type === 'book' ? 'Book' : type === 'chapter' ? 'Chapter' : type === 'topic' ? 'Topic' : 'Sub-Topic'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {type === 'book' ? 'Book' : type === 'chapter' ? 'Chapter' : type === 'topic' ? 'Topic' : 'Sub-Topic'} Data Store
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <p className="text-gray-600">
            Upload and manage files related to this {type === 'book' ? 'book' : type === 'chapter' ? 'chapter' : type === 'topic' ? 'topic' : 'sub-topic'}.
          </p>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Upload size={18} className="mr-2" />
            <span>Add New Item</span>
          </button>
        </div>
        
        {/* Filter controls */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                  activeFilter === filter.id
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <filter.icon size={16} className="mr-2" />
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No items found</h3>
            <p className="text-gray-500 mt-1">
              {activeFilter !== 'all' 
                ? `No ${activeFilter} items available. Try a different filter or add new items.` 
                : 'Upload files to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                {/* Item header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item._id)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Item content */}
                <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
                  {item.fileType?.startsWith('image/') ? (
                    <div className="h-36 w-full overflow-hidden">
                      <img 
                        src={item.url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : item.itemType === 'youtube' ? (
                    <div className="relative w-full pt-[56.25%]">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={item.url.replace('watch?v=', 'embed/')}
                        title={item.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      {getItemIcon(item)}
                      <span className="text-sm text-gray-500 mt-2">
                        {item.itemType || item.fileType?.split('/')[1] || 'File'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Item footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center"
                  >
                    <span>{item.itemType === 'text' ? 'View Text' : 'Open'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataStore;