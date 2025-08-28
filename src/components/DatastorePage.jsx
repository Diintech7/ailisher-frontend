import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  Plus, Save, Trash2, Link, FileText, Image, Video, Globe, 
  Youtube, Upload, AlertCircle, Check, ExternalLink, Eye, X, Loader, File,
  MoreVertical, LayoutGrid, List, Calendar, Clock, Bookmark, Heart, Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './UI/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './UI/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './UI/Dialog';
import { Progress } from './UI/Progress';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ value, onValueChange, className, children }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full rounded-lg border px-3 py-2 transition-colors duration-300 ${className}`}
    >
      <option value="All Types">All Types</option>
      <option value="Text">Text</option>
      <option value="Image">Image</option>
      <option value="Video">Video</option>
      <option value="Youtube">YouTube</option>
      <option value="Link">Link</option>
      <option value="Website">Website</option>
      <option value="Pdf">PDF</option>
    </select>
  );
};

const DatastoreContent = () => {
  // Define styles object with common styles
  const styles = {
    buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200',
    label: 'block text-sm font-medium mb-1 text-gray-700',
    error: 'bg-red-100 text-red-800',
  };
  
  // Define colors object with common color classes
  const colors = {
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    primary: 'text-purple-600',
  };
  
  const cx = (...classes) => classes.filter(Boolean).join(' ');

  const [datastoreItems, setDatastoreItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemType, setNewItemType] = useState('text');
  const [newItemData, setNewItemData] = useState({
    title: '',
    content: '',
    url: '',
    file: null,
    localFile: null,
    cloudinaryUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState(null);
  const [cloudinaryInitialized, setCloudinaryInitialized] = useState(false);
  const [cloudinaryScriptLoaded, setCloudinaryScriptLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const fileInputRef = useRef(null);
  const cloudinaryRef = useRef();
  const widgetRef = useRef();
  const cloudinaryScriptRef = useRef(null);

  useEffect(() => {
    fetchDatastoreItems();
    loadCloudinaryScript();
    return () => {
      if (cloudinaryScriptRef.current && document.body.contains(cloudinaryScriptRef.current)) {
        document.body.removeChild(cloudinaryScriptRef.current);
      }
    };
  }, []);
  
  const loadCloudinaryScript = () => {
    if (document.getElementById('cloudinary-widget-script')) {
      setCloudinaryScriptLoaded(true);
      initializeCloudinaryWhenReady();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'cloudinary-widget-script';
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      setCloudinaryScriptLoaded(true);
      initializeCloudinaryWhenReady();
    };
    script.onerror = () => {
      setError('Failed to load Cloudinary script. File uploads may not work.');
      showNotification('Failed to load Cloudinary script. Please try refreshing the page.', 'error');
    };
    
    cloudinaryScriptRef.current = script;
    document.body.appendChild(script);
  };
  
  const initializeCloudinaryWhenReady = () => {
    setTimeout(() => {
      if (window.cloudinary) {
        cloudinaryRef.current = window.cloudinary;
        initCloudinaryWidget();
      } else {
        showNotification('Cloudinary initialization delayed. Please try again.', 'error');
      }
    }, 500);
  };

  const initCloudinaryWidget = () => {
    if (!window.cloudinary) {
      return;
    }
    
    cloudinaryRef.current = window.cloudinary;
    
    const cloudName = "dsbuzlxpw";
    const uploadPreset = "post_blog";
    
    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration is missing. Please check your environment variables.');
      showNotification('Cloudinary configuration error. File uploads may not work.', 'error');
      return;
    }
    
    try {
      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFiles: 1,
        },
        (error, result) => {
          if (error) {
            showNotification('Failed to upload file: ' + error.message, 'error');
            return;
          }
          
          if (result && result.event === 'success') {
            const fileUrl = result.info.secure_url;
            setNewItemData({
              ...newItemData,
              cloudinaryUrl: fileUrl,
              file: { name: result.info.original_filename }
            });
            showNotification('File uploaded to Cloudinary successfully', 'success');
          }
        }
      );
      setCloudinaryInitialized(true);
    } catch (err) {
      setError('Failed to initialize Cloudinary widget: ' + err.message);
      showNotification('Cloudinary initialization error', 'error');
    }
  };

  const manualInitCloudinary = () => {
    if (!cloudinaryScriptLoaded) {
      loadCloudinaryScript();
      showNotification('Attempting to load Cloudinary script...', 'info');
      return;
    }
    
    if (window.cloudinary) {
      cloudinaryRef.current = window.cloudinary;
      initCloudinaryWidget();
      showNotification('Cloudinary initialized successfully', 'success');
    } else {
      showNotification('Cloudinary script not found. Please ensure the Cloudinary script is loaded.', 'error');
    }
  };

  const fetchDatastoreItems = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('usertoken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
  
      const response = await axios.get('https://aipbbackend-yxnh.onrender.com/api/datastore', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      setDatastoreItems(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch datastore items');
      setLoading(false);
    }
  };

  const handleLocalFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    setNewItemData({
      ...newItemData,
      localFile: file,
      file: file,
      cloudinaryUrl: previewUrl
    });
    
    showNotification(`File "${file.name}" selected. Click Save to upload to Cloudinary.`, 'info');
  };

  const uploadToCloudinary = async (file) => {
    try {
      setIsUploading(true);
      showNotification('Uploading to Cloudinary...', 'info');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'post_blog');
      
      let uploadType = 'image';
      if (file.type.startsWith('video/')) {
        uploadType = 'video';
      } else if (file.type === 'application/pdf') {
        uploadType = 'raw';
      }
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dsbuzlxpw/${uploadType}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setIsUploading(false);
      
      if (response.data && response.data.secure_url) {
        if (newItemData.cloudinaryUrl && newItemData.cloudinaryUrl.startsWith('blob:')) {
          URL.revokeObjectURL(newItemData.cloudinaryUrl);
        }
        
        setNewItemData({
          ...newItemData,
          cloudinaryUrl: response.data.secure_url,
          localFile: null
        });
        
        showNotification('File uploaded to Cloudinary successfully', 'success');
        return response.data.secure_url;
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (err) {
      setIsUploading(false);
      showNotification('Failed to upload to Cloudinary: ' + (err.message || 'Unknown error'), 'error');
      throw err;
    }
  };

  const handleAddItem = async () => {
    try {
      setIsUploading(true);
      const token = Cookies.get('usertoken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let requestData = {
        title: newItemData.title,
        type: newItemType
      };

      if ((newItemType === 'image' || newItemType === 'video' || newItemType === 'pdf') && newItemData.localFile) {
        const cloudinaryUrl = await uploadToCloudinary(newItemData.localFile);
        requestData.url = cloudinaryUrl;
      } else {
      switch (newItemType) {
        case 'text':
            requestData.content = newItemData.content;
          break;
        case 'link':
        case 'website':
        case 'youtube':
            requestData.url = newItemData.url;
          break;
        case 'image':
        case 'video':
        case 'pdf':
            requestData.url = newItemData.cloudinaryUrl;
          break;
        default:
          break;
        }
      }

      const response = await axios.post('https://aipbbackend-yxnh.onrender.com/api/datastore', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setDatastoreItems([...datastoreItems, response.data.data]);
      setIsUploading(false);
      setUploadProgress(0);
      setShowAddDialog(false);
      resetNewItemData();
      
      showNotification('Item added successfully', 'success');
    } catch (err) {
      setIsUploading(false);
      setError(err.message || 'Failed to add datastore item');
      showNotification('Failed to add item: ' + err.message, 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const token = Cookies.get('usertoken');
      
      await axios.delete(`https://aipbbackend-yxnh.onrender.com/api/datastore/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDatastoreItems(datastoreItems.filter(item => item._id !== id));
      showNotification('Item deleted successfully', 'success');
      
    } catch (err) {
      setError(err.message || 'Failed to delete datastore item');
      showNotification('Failed to delete item', 'error');
    }
  };

  const handleFileSelect = () => {
    if (!cloudinaryScriptLoaded) {
      showNotification('Cloudinary is not loaded yet. Attempting to load...', 'info');
      loadCloudinaryScript();
        return;
      }
      
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      showNotification('Cloudinary widget is not initialized properly. Trying to reinitialize...', 'error');
      manualInitCloudinary();
    }
  };

  const resetNewItemData = () => {
    if (newItemData.cloudinaryUrl && newItemData.cloudinaryUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newItemData.cloudinaryUrl);
    }
    
    setNewItemData({
      title: '',
      content: '',
      url: '',
      file: null,
      localFile: null,
      cloudinaryUrl: '',
    });
    setNewItemType('text');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAddDialog = (type = 'text') => {
    setNewItemType(type);
    resetNewItemData();
    setShowAddDialog(true);
    
    if (!cloudinaryInitialized && (type === 'image' || type === 'video')) {
      if (window.cloudinary) {
        manualInitCloudinary();
      } else {
        loadCloudinaryScript();
      }
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredItems = datastoreItems.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) || 
        (item.content && item.content.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  const renderItemIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={20} />;
      case 'image': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      case 'youtube': return <Youtube size={20} />;
      case 'link': return <Link size={20} />;
      case 'website': return <Globe size={20} />;
      case 'pdf': return <File size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getItemBgColor = (type) => {
    const baseClass = "bg-opacity-10";
    switch (type) {
      case 'text': return `${baseClass} bg-blue-500`;
      case 'image': return `${baseClass} bg-green-500`;
      case 'video': return `${baseClass} bg-red-500`;
      case 'youtube': return `${baseClass} bg-red-600`;
      case 'link': return `${baseClass} bg-purple-500`;
      case 'website': return `${baseClass} bg-sky-500`;
      case 'pdf': return `${baseClass} bg-orange-500`;
      default: return `${baseClass} bg-gray-500`;
    }
  };

  const getItemIconColor = (type) => {
    switch (type) {
      case 'text': return "text-blue-500";
      case 'image': return "text-green-500";
      case 'video': return "text-red-500";
      case 'youtube': return "text-red-600";
      case 'link': return "text-purple-500";
      case 'website': return "text-sky-500";
      case 'pdf': return "text-orange-500";
      default: return "text-gray-500";
    }
  };

  const getItemBorderColor = (type) => {
    switch (type) {
      case 'text': return "border-blue-200";
      case 'image': return "border-green-200";
      case 'video': return "border-red-200";
      case 'youtube': return "border-red-300";
      case 'link': return "border-purple-200";
      case 'website': return "border-sky-200";
      case 'pdf': return "border-orange-200";
      default: return "border-gray-200";
    }
  };

  const getItemGlowColor = (type) => {
    switch (type) {
      case 'text': return "hover:shadow-blue-500/20";
      case 'image': return "hover:shadow-green-500/20";
      case 'video': return "hover:shadow-red-500/20";
      case 'youtube': return "hover:shadow-red-600/20";
      case 'link': return "hover:shadow-purple-500/20";
      case 'website': return "hover:shadow-sky-500/20";
      case 'pdf': return "hover:shadow-orange-500/20";
      default: return "hover:shadow-gray-500/20";
    }
  };

  const getBadgeClasses = (type) => {
    const base = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (type) {
      case 'text': 
        return `${base} bg-blue-100 text-blue-800`;
      case 'image': 
        return `${base} bg-green-100 text-green-800`;
      case 'video': 
        return `${base} bg-red-100 text-red-800`;
      case 'youtube': 
        return `${base} bg-red-100 text-red-800`;
      case 'link': 
        return `${base} bg-purple-100 text-purple-800`;
      case 'website': 
        return `${base} bg-sky-100 text-sky-800`;
      case 'pdf': 
        return `${base} bg-orange-100 text-orange-800`;
      default: 
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const getNotificationClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const renderFormFields = () => {
    const inputClasses = cx(
      'w-full px-4 py-2 rounded-lg',
      'bg-white border-gray-300 text-gray-900',
      'focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300'
    );
    
    return (
      <div className="space-y-4">
          <div>
            <label className={styles.label}>Title</label>
            <input
              type="text"
              className={`${inputClasses} border`}
              value={newItemData.title}
              onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
              placeholder="Enter a title"
            />
          </div>
        {newItemType === 'text' && (
          <div>
            <label className={styles.label}>Content</label>
            <textarea
              className={`${inputClasses} border min-h-32`}
              value={newItemData.content}
              onChange={(e) => setNewItemData({...newItemData, content: e.target.value})}
              placeholder="Enter your text content"
              rows={6}
            />
          </div>
        )}
        {(newItemType === 'link' || newItemType === 'website' || newItemType === 'youtube') && (
          <div>
            <label className={styles.label}>URL</label>
            <input
              type="url"
              className={`${inputClasses} border`}
              value={newItemData.url}
              onChange={(e) => setNewItemData({...newItemData, url: e.target.value})}
              placeholder={`Enter the ${newItemType === 'youtube' ? 'YouTube' : newItemType === 'website' ? 'website' : 'link'} URL`}
            />
          </div>
        )}
        {(newItemType === 'image' || newItemType === 'video' || newItemType === 'pdf') && (
          <div>
            <label className={styles.label}>File</label>
            <div className="flex flex-col space-y-3">
              <div>
                <label className={`${styles.buttonSecondary} flex items-center justify-center cursor-pointer`}>
                  <Upload size={16} className="mr-2" />
                  Upload from your device
              <input
                ref={fileInputRef}
                    type="file"
                className="hidden"
                    accept={
                      newItemType === 'image' ? 'image/*' : 
                      newItemType === 'video' ? 'video/*' : 
                      'application/pdf'
                    }
                    onChange={handleLocalFileSelect}
                  />
                </label>
              </div>
              {newItemData.cloudinaryUrl && (
                <div className="p-4 rounded-lg flex items-center justify-between bg-gray-100">
                  <div className="flex items-center overflow-hidden">
                    {newItemType === 'image' && (
                      <img 
                        src={newItemData.cloudinaryUrl} 
                        alt="Preview" 
                        className="h-10 w-10 rounded object-cover mr-3"
                      />
                    )}
                    {(newItemType === 'video' || newItemType === 'pdf') && (
                      <div className={`h-10 w-10 rounded flex items-center justify-center mr-3 ${
                        newItemType === 'video' ? 'bg-gray-700' : 'bg-orange-500'
                      }`}>
                        {newItemType === 'video' ? (
                          <Video size={18} className="text-white" />
                        ) : (
                          <File size={18} className="text-white" />
                        )}
                      </div>
                    )}
                    <span className={`${colors.textSecondary} truncate max-w-xs`}>
                      {newItemData.file ? newItemData.file.name : 'Uploaded file'}
                    </span>
                  </div>
              <button
                    onClick={() => {
                      if (newItemData.cloudinaryUrl && newItemData.cloudinaryUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(newItemData.cloudinaryUrl);
                      }
                      setNewItemData({...newItemData, cloudinaryUrl: '', file: null, localFile: null});
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
              </button>
          </div>
        )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ContentPreview = ({ item }) => {
    if (!item) return null;
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-6">
          <span className={getBadgeClasses(item.type)}>
            <span className="mr-1">{renderItemIcon(item.type)}</span>
            <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
          </span>
        </div>
        <h3 className={`text-2xl font-semibold mb-6 ${colors.text}`}>{item.title}</h3>
        {item.type === 'text' && (
          <div className={`${colors.textSecondary} whitespace-pre-wrap p-4 rounded-lg bg-gray-50`}>
            {item.content}
          </div>
        )}
        {item.type === 'image' && (
          <div className="mt-2 flex justify-center">
            <img 
              src={item.url} 
              alt={item.title} 
              className="max-w-full rounded-lg object-contain mx-auto shadow-lg"
            />
          </div>
        )}
        {item.type === 'video' && (
          <div className="mt-2">
            <video 
              src={item.url} 
              controls 
              className="max-w-full rounded-lg mx-auto shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {item.type === 'pdf' && (
          <div className="mt-2">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={item.url}
                title={item.title}
                className="w-full h-full border-0"
                frameBorder="0"
              ></iframe>
            </div>
            <div className="mt-4 flex justify-center">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.buttonPrimary}
              >
                <ExternalLink size={16} className="mr-2" /> Open PDF in new tab
              </a>
            </div>
          </div>
        )}
        {item.type === 'youtube' && (
          <div className="mt-2 aspect-video">
            <iframe
              className="w-full h-full rounded-lg shadow-lg"
              src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
        {item.type === 'website' && (
          <div className="mt-2 aspect-video">
            <iframe
              src={item.url}
              className="w-full h-full rounded-lg border shadow-lg"
              title={item.title}
            ></iframe>
          </div>
        )}
        {item.type === 'link' && (
          <div className="mt-2 p-4 rounded-lg border flex flex-col items-center space-y-3 bg-white border-gray-200">
            <Globe size={24} className={`${getItemIconColor(item.type)}`} />
            <p className={colors.textSecondary}>{item.url}</p>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${styles.buttonPrimary} inline-flex items-center`}
            >
              <ExternalLink size={16} className="mr-2" /> 
              Visit Link
            </a>
          </div>
        )}
      </div>
    );
  };

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url ? url.match(regExp) : null;
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
   // Updated renderGridView with fixed card dimensions
   const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
          >
            <Card 
              className={`h-full flex flex-col overflow-hidden transition-all duration-300 border 
                border-gray-200 hover:border-gray-300
                ${getItemBgColor(item.type)} ${getItemGlowColor(item.type)} hover:shadow-lg`}
            >
              <div className="flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className={`text-xs font-medium uppercase tracking-wider ${
                      getItemIconColor(item.type)
                    } flex items-center p-1 rounded-full bg-white bg-opacity-60`}>
                      {renderItemIcon(item.type)}
                      <span className="ml-1">{item.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenAddDialog(item.type)}
                        className={`p-1 rounded-full hover:bg-gray-100 transition-colors duration-200`}
                        title={`Add new ${item.type}`}
                      >
                        <Plus size={14} className={colors.text} />
                      </button>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className={`p-1 rounded-full hover:bg-gray-100 transition-colors duration-200`}
                        title="View details"
                      >
                        <Eye size={14} className={colors.text} />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold line-clamp-2 mt-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-1 flex-1 text-sm">
                  {item.type === 'text' && (
                    <p className={`${colors.textSecondary} line-clamp-2 text-xs bg-gray-50 p-2 rounded-lg`}>
                      {item.content}
                    </p>
                  )}
                  
                  {item.type === 'image' && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  
                  {item.type === 'video' && (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                      <Video size={30} className="text-gray-300 opacity-50" />
                      {item.url && (
                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black bg-opacity-60">
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="bg-white text-black px-3 py-1 rounded-full font-medium transform transition-transform hover:scale-105 text-xs"
                          >
                            Play Video
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {item.type === 'pdf' && (
                    <div className="aspect-video flex items-center justify-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-inner">
                      <File size={30} className="text-orange-500 drop-shadow-md" />
                    </div>
                  )}
                  
                  {item.type === 'youtube' && (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative shadow-inner">
                      <img 
                        src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/0.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-2 shadow-lg">
                          <Youtube size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'website' && (
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      <Globe size={28} className="text-blue-500 drop-shadow-md" />
                    </div>
                  )}
                  
                  {item.type === 'link' && (
                    <div className="aspect-video flex items-center justify-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-inner">
                      <div className="text-center">
                        <Link size={28} className={`inline-block mb-1 ${colors.primary} drop-shadow-md`} />
                        <span className={`${colors.textSecondary} text-xs line-clamp-1`}>{item.url}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between gap-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(item.createdAt)}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className={`p-1 rounded-full hover:bg-red-100 transition-colors duration-200`}
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </CardFooter>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  // Updated renderListView with table layout
  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Content Preview
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <motion.tr
                key={item._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                className="hover:bg-opacity-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${getItemBgColor(item.type)}`}>
                      {renderItemIcon(item.type)}
                    </div>
                    <span className="ml-3 text-sm font-medium">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">
                    {item.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm max-w-xs truncate">
                    {item.type === 'text' && (
                      <span className={colors.textSecondary}>{item.content}</span>
                    )}
                    {item.type === 'link' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${colors.primary} hover:underline`}
                      >
                        {item.url}
                      </a>
                    )}
                    {(item.type === 'image' || item.type === 'video' || item.type === 'pdf') && (
                      <span className={colors.textSecondary}>Media file</span>
                    )}
                    {item.type === 'youtube' && (
                      <span className={colors.textSecondary}>YouTube video</span>
                    )}
                    {item.type === 'website' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${colors.primary} hover:underline`}
                      >
                        {item.url}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {formatDate(item.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className={`p-1 rounded-full hover:bg-gray-100 transition-colors duration-200`}
                      title="View details"
                    >
                      <Eye size={16} className={colors.text} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className={`p-1 rounded-full hover:bg-red-100 transition-colors duration-200`}
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 p-4 rounded-lg ${
            getNotificationClasses(notification.type)
          } shadow-lg z-50 flex items-center`}
        >
          {notification.type === 'success' ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          {notification.message}
        </motion.div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className={`text-2xl font-bold ${colors.text} mb-2`}>Datastore</h1>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mt-4 md:mt-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => handleOpenAddDialog()}
            className={`${styles.buttonPrimary} flex items-center justify-center`}
          >
            <Plus size={18} className="mr-2" /> Add Content
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search datastore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors duration-300 border bg-white border-gray-300 text-gray-900`}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className={`w-5 h-5 ${colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="w-full md:w-48">
          <CustomSelect
            value={filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            onValueChange={(value) => {
              if (value === 'All Types') {
                setFilterType('all');
              } else {
                setFilterType(value.toLowerCase());
              }
            }}
            className="bg-white text-gray-900"
          />
        </div>
      </div>
      
      {loading && (
        <div className="col-span-full flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader size={36} className="animate-spin text-purple-500 mb-4" />
            <p className={colors.textSecondary}>Loading your content...</p>
          </div>
        </div>
      )}
      
      {error && !loading && (
        <div className={`col-span-full p-6 rounded-lg ${styles.error} mb-6`}>
          <div className="flex items-center">
            <AlertCircle size={24} className="mr-3" />
            <p>Error: {error}</p>
          </div>
        </div>
      )}
      
      {!loading && !error && filteredItems.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <div className={`text-xl ${colors.textSecondary} mb-6`}>
            {searchQuery ? 'No items match your search' : 'No items in your datastore'}
          </div>
          <button
            onClick={() => handleOpenAddDialog()}
            className={styles.buttonPrimary}
          >
            <Plus size={18} className="mr-2" /> Add Content
          </button>
        </div>
      )}
      
      {!loading && !error && filteredItems.length > 0 && (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className={`p-2 rounded-full mr-2 ${getItemBgColor(newItemType)}`}>
                {renderItemIcon(newItemType)}
              </span>
              Add {newItemType.charAt(0).toUpperCase() + newItemType.slice(1)} Content
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue={newItemType} value={newItemType} className="mt-4">
            <TabsList className="w-full flex justify-center space-x-2 mb-6">
              {[
                { id: 'text', icon: FileText, label: 'Text', color: 'blue' },
                { id: 'image', icon: Image, label: 'Image', color: 'green' },
                { id: 'video', icon: Video, label: 'Video', color: 'red' },
                { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'red' },
                { id: 'link', icon: Link, label: 'Link', color: 'purple' },
                { id: 'website', icon: Globe, label: 'Website', color: 'sky' },
                { id: 'pdf', icon: File, label: 'PDF', color: 'orange' }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  onClick={() => setNewItemType(tab.id)}
                  className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                    newItemType === tab.id 
                      ? `${getItemIconColor(tab.id)} ${getItemBgColor(tab.id)} border-b-2 border-${tab.color}-500`
                      : `${colors.textSecondary} hover:bg-gray-100`
                  }`}
                  style={{ 
                    backgroundColor: 'transparent !important', 
                    color: 'inherit',
                    '--tw-bg-opacity': newItemType === tab.id ? undefined : '0',
                    '--override-bg': newItemType === tab.id ? undefined : 'transparent'
                  }}
                >
                  <tab.icon 
                    size={20} 
                    className={`mb-1 ${newItemType === tab.id ? getItemIconColor(tab.id) : colors.textSecondary}`} 
                  />
                  <span className={`text-xs ${newItemType === tab.id ? getItemIconColor(tab.id) : colors.textSecondary}`}>
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className={`p-6 space-y-6 bg-white text-gray-900 border border-gray-200 rounded-lg transition-colors duration-300`}>
              <TabsContent value="text">{renderFormFields()}</TabsContent>
              <TabsContent value="image">{renderFormFields()}</TabsContent>
              <TabsContent value="video">{renderFormFields()}</TabsContent>
              <TabsContent value="youtube">{renderFormFields()}</TabsContent>
              <TabsContent value="link">{renderFormFields()}</TabsContent>
              <TabsContent value="website">{renderFormFields()}</TabsContent>
              <TabsContent value="pdf">{renderFormFields()}</TabsContent>
            </div>
          </Tabs>
          
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className={colors.textSecondary}>Uploading...</span>
                <span className={colors.textSecondary}>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              className={`${styles.buttonSecondary} flex items-center`}
              disabled={isUploading}
            >
              <X size={18} className="mr-2" /> Cancel
            </button>
            
            <button
              type="button"
              onClick={handleAddItem}
              className={`${styles.buttonPrimary} flex items-center`}
              disabled={isUploading || !newItemData.title || 
                (newItemType === 'text' && !newItemData.content) ||
                ((newItemType === 'link' || newItemType === 'website' || newItemType === 'youtube') && !newItemData.url) ||
                ((newItemType === 'image' || newItemType === 'video') && !newItemData.file)}
            >
              <Save size={18} className="mr-2" /> Save Content
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedItem && (
                <>
                  <span className={`p-2 rounded-full mr-3 ${getItemBgColor(selectedItem.type)}`}>
                    {renderItemIcon(selectedItem.type)}
                  </span>
                  <span className="ml-2">{selectedItem?.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && <ContentPreview item={selectedItem} />}
          
          <DialogFooter>
            <div className="flex w-full justify-between">
              <button
                onClick={() => setSelectedItem(null)}
                className={styles.buttonSecondary}
              >
                Close
              </button>
              
              {selectedItem?.type === 'link' || selectedItem?.type === 'website' || selectedItem?.type === 'youtube' ? (
                <a 
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.buttonPrimary}
                >
                  <ExternalLink size={18} className="mr-2" /> Open in New Tab
                </a>
              ) : null}
              
              <button
                onClick={() => {
                  handleDeleteItem(selectedItem?._id);
                  setSelectedItem(null);
                }}
                className={`flex items-center justify-center px-4 py-2 rounded-lg 
                  bg-red-100 hover:bg-red-200 text-red-700 
                  transition-colors duration-200`}
              >
                <Trash2 size={18} className="mr-2" /> Delete
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatastoreContent;