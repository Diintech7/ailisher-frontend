import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  EyeOff,
  Upload,
  Search,
  Filter,
  GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function Marketing() {
  const [marketing, setMarketing] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newImageFile,setNewImageFile] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'banner',
    subcategory: '',
    imageKey: '',
    imageUrl: '',
    imageWidth: '',
    imageHeight: '',
    imageSize: '16:9',
    location: 'top',
    route: {
      type: 'weblink',
      config: {
        url: '',
        phone: '',
        message: ''
      }
    },
    isActive: true,
    metadata: {}
  });

  // AI Image Generation state
  const [genPrompt, setGenPrompt] = useState('');
  const [genStyle, setGenStyle] = useState('realistic');
  const [genAspectRatio, setGenAspectRatio] = useState('9:16');
  const [genSeed, setGenSeed] = useState('5');
  const [genLoading, setGenLoading] = useState(false);
  const [genImage, setGenImage] = useState('');
  const [createImageMode, setCreateImageMode] = useState('upload'); 
  const [editImageMode, setEditImageMode] = useState('upload'); 

  // AI Library (saved images from Image Generator)
  const [aiImages, setAiImages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPage, setAiPage] = useState(1);
  const [aiHasMore, setAiHasMore] = useState(true);
  const [importedKey, setImportedKey] = useState('');

  // Edit form AI library state
  const [aiImagesEdit, setAiImagesEdit] = useState([]);
  const [aiLoadingEdit, setAiLoadingEdit] = useState(false);
  const [importedKeyEdit, setImportedKeyEdit] = useState('');

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState('');

  const categories = [
    { value: 'banner', label: 'Banner' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'popup', label: 'Popup' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'hero', label: 'Hero' },
    { value: 'featured', label: 'Featured' },
    { value: 'promotion', label: 'Promotion' }
  ];

  const imageSizes = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
  ];

  const locations = [
    { value: 'top', label: 'Top' },
    { value: 'middle', label: 'Middle' },
    { value: 'bottom', label: 'Bottom' }
  ];

  const axiosConfig = {
    baseURL: 'https://aipbbackend-yxnh.onrender.com',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Load marketing items
  useEffect(() => {
    fetchMarketing();
  }, [pagination.page, filters]);

  const fetchMarketing = async () => {
    try {
      setLoading(true);
      const params = {
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...filters
      };

      // Remove empty filter values so backend doesn't treat isActive="" as false
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value === '' || value === null || value === undefined) {
          delete params[key];
        }
      });

      const res = await axios.get(`/api/marketing`, axiosConfig);
      console.log(res)
      if (res?.data?.success) {
        setMarketing(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          pages: res.data.pagination.pages
        }));
      }
    } catch (e) {
      console.error('Failed to fetch marketing items', e);
      toast.error('Failed to load marketing items');
    } finally {
      setLoading(false);
    }
  };

  const loadAiImages = async (reset = false) => {
    try {
      setAiLoading(true);
      const pageToLoad = reset ? 1 : aiPage;
      const { data } = await axios.get('/api/image-generator/my-images', axiosConfig);
      if (data?.success) {
        // For now, backend returns all; support simple reset
        const images = data.data.images || [];
        setAiImages(reset ? images : [...aiImages, ...images]);
        setAiHasMore(false); // until backend supports pagination params
        setAiPage(pageToLoad + 1);
      }
    } catch (e) {
      console.error('Failed to load AI images', e);
      toast.error('Failed to load AI images');
    } finally {
      setAiLoading(false);
    }
  };

  const loadAiImagesEdit = async (reset = false) => {
    try {
      setAiLoadingEdit(true);
      const { data } = await axios.get('/api/image-generator/my-images', axiosConfig);
      if (data?.success) {
        setAiImagesEdit(reset ? (data.data.images || []) : [...aiImagesEdit, ...(data.data.images || [])]);
      }
    } catch (e) {
      console.error('Failed to load AI images (edit)', e);
      toast.error('Failed to load AI images');
    } finally {
      setAiLoadingEdit(false);
    }
  };

  // When switching to AI mode, load saved AI images
  useEffect(() => {
    if (showCreateModal && createImageMode === 'ai') {
      loadAiImages(true);
    }
  }, [showCreateModal, createImageMode]);

  // When switching to AI mode in edit, load saved AI images
  useEffect(() => {
    if (editingItem && editImageMode === 'ai') {
      loadAiImagesEdit(true);
    }
  }, [editingItem, editImageMode]);

  const importAiImage = async (generatedImageKey, previewUrl) => {
    try {
      const res = await axios.post('/api/marketing/import-ai-image', { sourceKey: generatedImageKey }, axiosConfig);
      if (res?.data?.success) {
        const { key, url } = res.data;
        setImportedKey(key);
        setNewItem(prev => ({ ...prev, imageUrl: url }));
        // infer dimensions from url
        await setImageDimensionsFromUrl(url);
        toast.success('AI image selected for marketing');
      } else {
        toast.error('Failed to select AI image');
      }
    } catch (e) {
      console.error('Import AI image failed', e);
      toast.error(e?.response?.data?.message || 'Failed to select AI image');
    }
  };

  const importAiImageEdit = async (generatedImageKey, previewUrl) => {
    try {
      const res = await axios.post('/api/marketing/import-ai-image', { sourceKey: generatedImageKey }, axiosConfig);
      if (res?.data?.success) {
        const { key, url } = res.data;
        setImportedKeyEdit(key);
        setEditingItem(prev => ({ ...(prev || {}), imageUrl: url }));
        await setImageDimensionsFromUrl(url);
        toast.success('AI image selected for marketing');
      } else {
        toast.error('Failed to select AI image');
      }
    } catch (e) {
      console.error('Import AI image (edit) failed', e);
      toast.error(e?.response?.data?.message || 'Failed to select AI image');
    }
  };

  const setImageDimensionsFromUrl = async (url) => {
    try {
      const img = new Image();
      const dims = await new Promise((resolve, reject) => {
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.onerror = reject;
        img.src = url;
      });
      setNewItem(prev => ({ ...prev, imageWidth: dims.w, imageHeight: dims.h }));
    } catch (e) {
      console.warn('Could not get image dimensions from URL');
    }
  };

  const handleCreateMarketing = async () => {
    // Validate route configuration
    if ((newItem.route.type === 'weblink' || newItem.route.type === 'other') && !newItem.route.config.url) {
      toast.error('Please enter a valid URL for web link');
      return;
    }

    if (newItem.route.type === 'whatsapp' && !newItem.route.config.phone) {
      toast.error('Please enter a valid phone number for WhatsApp');
      return;
    }

    try {
      // Branch 1: Using imported AI image key
      if (createImageMode === 'ai' && importedKey) {
        if (!newItem.imageWidth || !newItem.imageHeight) {
          toast.error('Image dimensions missing');
          return;
        }
        const payload = {
          ...newItem,
          imageKey: importedKey,
        };
        const res = await axios.post('/api/marketing', payload, axiosConfig);
        if (res?.data?.success) {
          toast.success('Marketing item created successfully');
          setShowCreateModal(false);
          resetCreateForm();
          fetchMarketing();
        }
        return;
      }

      // Branch 2: Uploading a file (upload or inline-generated)
      if (!newImageFile) {
        toast.error(createImageMode === 'ai' ? 'Please select an AI image or generate one' : 'Please select an image file');
        return;
      }

      const presign = await axios.post(
        '/api/marketing/upload-image',
        {
          fileName: newImageFile.name,
          contentType: newImageFile.type || 'image/png',
        },
        axiosConfig
      );
      const { uploadUrl, key } = presign.data;

      await axios.put(uploadUrl, newImageFile, {
        headers: { 'Content-Type': newImageFile.type || 'image/png' }
      });

      const image = new Image();
      const objectUrl = URL.createObjectURL(newImageFile);
      const dimensions = await new Promise((resolve, reject) => {
        image.onload = () => resolve({ width: image.width, height: image.height });
        image.onerror = reject;
        image.src = objectUrl;
      }).finally(() => {
        URL.revokeObjectURL(objectUrl);
      });

      const { width: imageWidth, height: imageHeight } = dimensions;
      if (!imageWidth || !imageHeight) {
        toast.error('Not able to get image dimensions');
        return;
      }

      const payload = {
        ...newItem,
        imageWidth,
        imageHeight,
        imageKey: key,
      };

      const res = await axios.post('/api/marketing', payload, axiosConfig);
      console.log(res)
      if (res?.data?.success) {
        toast.success('Marketing item created successfully');
        setShowCreateModal(false);
        resetCreateForm();
        fetchMarketing();
      }
    } catch (e) {
      console.error('Create marketing failed', e);
      toast.error(e.message);
    }
  };

  const resetCreateForm = () => {
    setImportedKey('');
    setAiImages([]);
    setAiPage(1);
    setAiHasMore(true);
    setNewItem({
      name: '',
      category: 'banner',
      subcategory: '',
      imageKey: '',
      imageUrl: '',
      imageWidth: '',
      imageHeight: '',
      imageSize: '16:9',
      location: 'top',
      route: {
        type: 'weblink',
        config: {
          url: '',
          phone: '',
          message: ''
        }
      },
      isActive: true,
      metadata: {}
    });
    setNewImageFile(null);
    setGenPrompt('');
    setGenImage('');
  };

  // Generate image via backend AI and attach as file
  const handleGenerateImage = async () => {
    if (!genPrompt) {
      toast.error('Enter a prompt to generate image');
      return;
    }
    try {
      setGenLoading(true);
      setGenImage('');
      const { data } = await axios.post(
        '/api/marketing/generate-image',
        {
          prompt: genPrompt,
          aspect_ratio: genAspectRatio,
        },
        axiosConfig
      );
      if (data?.success && data?.image) {
        const dataUrl = `data:image/png;base64,${data.image}`;
        setGenImage(dataUrl);
        // Turn base64 into a File so existing upload flow works (PNG uploaded to R2 on save)
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });
        setNewImageFile(file);
        setImportedKey(''); // Clear imported key if a new one is generated
        toast.success('AI image generated and attached');
      } else {
        toast.error('Failed to generate image');
      }
    } catch (e) {
      console.error('Generate image failed', e);
      toast.error(e?.response?.data?.error || e.message || 'Failed to generate image');
    } finally {
      setGenLoading(false);
    }
  };

  const handleEditMarketing = async () => {
    if (!editingItem || !editingItem._id) return;

    try {
      // If imported AI image was selected during edit, update with imported key
      if (editImageMode === 'ai' && importedKeyEdit) {
        if (!editingItem.imageWidth || !editingItem.imageHeight) {
          toast.error('Image dimensions missing');
          return;
        }
        const payload = {
          ...editingItem,
          imageKey: importedKeyEdit,
        };
        const res = await axios.put(`/api/marketing/${editingItem._id}`, payload, axiosConfig);
        if (res?.data?.success) {
          toast.success('Marketing item updated successfully');
          setEditingItem(null);
          setImportedKeyEdit('');
          setNewImageFile(null);
          fetchMarketing();
        }
        return;
      }

      let payload = {
        ...editingItem,
      };
      // If a new image file is selected during edit, upload and update fields
      if (newImageFile) {

        const presign = await axios.post(
          '/api/marketing/upload-image',
          {
            fileName: newImageFile.name,
            contentType: newImageFile.type || 'image/png',
          },
          axiosConfig
        );
        const { uploadUrl, key } = presign.data;

        await axios.put(uploadUrl, newImageFile, {
          headers: { 'Content-Type': newImageFile.type || 'image/png' }
        });

        const image = new Image();
        const objectUrl = URL.createObjectURL(newImageFile);
        const dimensions = await new Promise((resolve, reject) => {
          image.onload = () => resolve({ width: image.width, height: image.height });
          image.onerror = reject;
          image.src = objectUrl;
        }).finally(() => {
          URL.revokeObjectURL(objectUrl);
        });

        payload = {
          ...payload,
          imageKey: key,
          imageWidth: dimensions.width,
          imageHeight: dimensions.height,
        };
        }

      const res = await axios.put(`/api/marketing/${editingItem._id}`, payload, axiosConfig);
      if (res?.data?.success) {
        toast.success('Marketing item updated successfully');
        setEditingItem(null);
        setNewImageFile(null);
        setImportedKeyEdit('');
        fetchMarketing();
      }
    } catch (e) {
      console.error('Update marketing failed', e);
      toast.error('Failed to update marketing item');
    }
  };

  const handleDeleteMarketing = async () => {
    try {
      if (!deletingItem) return;

      const res = await axios.delete(`/api/marketing/${deletingItem._id}`, axiosConfig);
      if (res?.data?.success) {
        toast.success('Marketing item deleted successfully');
        setShowDeleteModal(false);
        setDeletingItem(null);
        fetchMarketing();
      }
    } catch (e) {
      console.error('Delete marketing failed', e);
      toast.error('Failed to delete marketing item');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await axios.patch(`/api/marketing/${item._id}/toggle-active`, {}, axiosConfig);
      if (res?.data?.success) {
        toast.success(`Marketing item ${res.data.data.isActive ? 'activated' : 'deactivated'}`);
        fetchMarketing();
      }
    } catch (e) {
      console.error('Toggle active failed', e);
      toast.error('Failed to toggle active status');
    }
  };


  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Marketing Item</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Marketing item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <input
              type="text"
              value={newItem.subcategory}
              onChange={(e) => setNewItem({...newItem, subcategory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional subcategory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Size</label>
            <select
              value={newItem.imageSize}
              onChange={(e) => setNewItem({...newItem, imageSize: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {imageSizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={newItem.location}
              onChange={(e) => setNewItem({...newItem, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {locations.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
            <select
              value={newItem.route.type}
              onChange={(e) => setNewItem({
                ...newItem, 
                route: {
                  ...newItem.route,
                  type: e.target.value,
                  config: { url: '', phone: '', message: '' }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="weblink">Web Link</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Other</option>

            </select>
          </div>

          {(newItem.route.type === 'weblink' || newItem.route.type === 'other') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                value={newItem.route.config.url}
                onChange={(e) => setNewItem({
                  ...newItem, 
                  route: {
                    ...newItem.route,
                    config: { ...newItem.route.config, url: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com"
              />
            </div>
          )}

          {newItem.route.type === 'whatsapp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
                  type="tel"
                  value={newItem.route.config.phone}
                  onChange={(e) => setNewItem({
                    ...newItem, 
                    route: {
                      ...newItem.route,
                      config: { ...newItem.route.config, phone: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                <textarea
                  value={newItem.route.config.message}
                  onChange={(e) => setNewItem({
                    ...newItem, 
                    route: {
                      ...newItem.route,
                      config: { ...newItem.route.config, message: e.target.value }
                    }
                  })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your WhatsApp message..."
                  rows="3"
            />
          </div>
              {newItem.route.config.phone && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Generated WhatsApp URL</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 break-all">
                      {`https://wa.me/${newItem.route.config.phone.replace(/\D/g, '')}${newItem.route.config.message ? `?text=${encodeURIComponent(newItem.route.config.message)}` : ''}`}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={newItem.isActive}
              onChange={(e) => setNewItem({...newItem, isActive: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="create-image-mode"
                value="upload"
                checked={createImageMode === 'upload'}
                onChange={() => {
                  setCreateImageMode('upload');
                  setGenImage('');
                  setGenPrompt('');
                  setNewItem({ ...newItem, imageUrl: '' });
                  setNewImageFile(null);
                }}
              />
              <span className="text-sm text-gray-700">Upload</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="create-image-mode"
                value="ai"
                checked={createImageMode === 'ai'}
                onChange={() => {
                  setCreateImageMode('ai');
                  setNewImageFile(null);
                  setNewItem({ ...newItem, imageUrl: '' });
                }}
              />
              <span className="text-sm text-gray-700">AI library</span>
            </label>
          </div>

          {/* Upload input (only when in upload mode) */}
          {createImageMode === 'upload' && (
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && setNewImageFile(e.target.files[0])}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Generation */}
          {createImageMode === 'ai' && (
            <div className="mt-6 p-6 border rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-semibold text-gray-800">Use AI Image</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/image-generator')}
                    className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                  >
                    Open Image Generator
                  </button>
                  <button
                    onClick={() => loadAiImages(true)}
                    className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                  >
                    Refresh Library
                  </button>
                </div>
              </div>

              {/* AI Library Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {aiLoading ? (
                  <div className="col-span-full text-sm text-gray-500">Loading AI images...</div>
                ) : aiImages.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500">No AI images yet. Generate one or open the generator.</div>
                ) : (
                  aiImages.map(img => (
                    <div key={img._id} className={`border rounded-lg overflow-hidden ${importedKey && newItem.imageUrl && newItem.imageUrl.includes(img.generatedImageUrl) ? 'ring-2 ring-purple-500' : ''}`}>
                      <img src={img.generatedImageUrl} alt={img.prompt} onClick={() => setLightboxUrl(img.generatedImageUrl)} className="w-full h-32 object-cover cursor-zoom-in" />
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-xs truncate" title={img.prompt}>{img.style} • {img.aspectRatio}</span>
                        <button
                          onClick={() => importAiImage(img.generatedImageKey, img.generatedImageUrl)}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="my-4 h-px bg-gray-200"></div>

              <p className="text-sm font-medium mb-2">Or generate new here</p>
              <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                <div className="w-full md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      className="w-full px-4 py-3 pr-36 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 placeholder-gray-400 resize-none"
                      placeholder="Describe the image you want..."
                    />
                    <button
                      onClick={handleGenerateImage}
                      disabled={genLoading || !genPrompt}
                      className="absolute top-2 right-2 px-5 py-3 bg-purple-600 text-white font-medium rounded-xl shadow hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {genLoading ? (
                        <span className="animate-pulse">✨ Generating...</span>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {genImage && (
                <div className="mt-3">
                  <img src={genImage} alt="Preview" onClick={() => setLightboxUrl(genImage)} className="w-48 h-32 object-cover rounded border cursor-zoom-in" />
                </div>
              )}
            </div>
          )}

          
          {newItem.imageUrl && (
            <div className="mt-2">
              <img
                src={newItem.imageUrl}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <p className="text-sm text-gray-500 mt-1">
                Size: {newItem.imageWidth} x {newItem.imageHeight}px
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMarketing}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create Item
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Marketing Item</h3>
          <button
            onClick={() => setEditingItem(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={editingItem?.name || ''}
              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={editingItem?.category || 'banner'}
              onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <input
              type="text"
              value={editingItem?.subcategory || ''}
              onChange={(e) => setEditingItem({...editingItem, subcategory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Size</label>
            <select
              value={editingItem?.imageSize || '16:9'}
              onChange={(e) => setEditingItem({...editingItem, imageSize: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {imageSizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={editingItem?.location || 'top'}
              onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {locations.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
            <select
              value={editingItem?.route?.type || 'weblink'}
              onChange={(e) => setEditingItem({
                ...editingItem, 
                route: {
                  ...editingItem?.route,
                  type: e.target.value,
                  config: editingItem?.route?.config || { url: '', phone: '', message: '' }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="weblink">Web Link</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Other</option>
            </select>
          </div>

          {((editingItem?.route?.type || 'weblink') === 'weblink' || (editingItem?.route?.type || 'weblink') === 'other') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                value={editingItem?.route?.config?.url || ''}
                onChange={(e) => setEditingItem({
                  ...editingItem, 
                  route: {
                    ...editingItem.route,
                    config: { ...editingItem.route?.config, url: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com"
              />
            </div>
          )}

          {(editingItem?.route?.type || 'weblink') === 'whatsapp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
                  type="tel"
                  value={editingItem?.route?.config?.phone || ''}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    route: {
                      ...editingItem.route,
                      config: { ...editingItem.route?.config, phone: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                <textarea
                  value={editingItem?.route?.config?.message || ''}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    route: {
                      ...editingItem.route,
                      config: { ...editingItem.route?.config, message: e.target.value }
                    }
                  })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your WhatsApp message..."
                  rows="3"
            />
          </div>
              {editingItem?.route?.config?.phone && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Generated WhatsApp URL</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 break-all">
                      {`https://wa.me/${editingItem.route.config.phone.replace(/\D/g, '')}${editingItem.route.config.message ? `?text=${encodeURIComponent(editingItem.route.config.message)}` : ''}`}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editingItem?.isActive || false}
              onChange={(e) => setEditingItem({...editingItem, isActive: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="edit-image-mode"
                value="upload"
                checked={editImageMode === 'upload'}
                onChange={() => {
                  setEditImageMode('upload');
                  setGenImage('');
                  setGenPrompt('');
                }}
              />
              <span className="text-sm text-gray-700">Upload</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="edit-image-mode"
                value="ai"
                checked={editImageMode === 'ai'}
                onChange={() => {
                  setEditImageMode('ai');
                  setNewImageFile(null);
                }}
              />
              <span className="text-sm text-gray-700">Generate with AI</span>
            </label>
          </div>

          {/* Upload input (only when in upload mode) */}
          {editImageMode === 'upload' && (
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && setNewImageFile(e.target.files[0])}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Generation (Edit) */}
          {editImageMode === 'ai' && (
            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Use AI Image</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/image-generator')}
                    className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
                  >
                    Open Image Generator
                  </button>
                  <button
                    onClick={() => loadAiImagesEdit(true)}
                    className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
                  >
                    Refresh Library
                  </button>
                </div>
              </div>

              {/* AI Library Grid (Edit) */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {aiLoadingEdit ? (
                  <div className="col-span-full text-xs text-gray-500">Loading AI images...</div>
                ) : aiImagesEdit.length === 0 ? (
                  <div className="col-span-full text-xs text-gray-500">No AI images yet. Generate one or open the generator.</div>
                ) : (
                  aiImagesEdit.map(img => (
                    <div key={img._id} className={`border rounded overflow-hidden ${importedKeyEdit && editingItem?.imageUrl && editingItem.imageUrl.includes(img.generatedImageUrl) ? 'ring-2 ring-purple-500' : ''}`}>
                      <img src={img.generatedImageUrl} alt={img.prompt} onClick={() => setLightboxUrl(img.generatedImageUrl)} className="w-full h-24 object-cover cursor-zoom-in" />
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-[10px] truncate" title={img.prompt}>{img.style} • {img.aspectRatio}</span>
                        <button
                          onClick={() => importAiImageEdit(img.generatedImageKey, img.generatedImageUrl)}
                          className="text-[10px] px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="text-sm font-medium mb-2">Or generate new here</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the image you want..."
                  />
                </div>
                <div>
                  <select
                    value={genStyle}
                    onChange={(e) => setGenStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="realistic">Realistic</option>
                    <option value="digital-art">Digital Art</option>
                    <option value="3d-render">3D Render</option>
                    <option value="illustration">Illustration</option>
                  </select>
                </div>
                <div>
                  <select
                    value={genAspectRatio}
                    onChange={(e) => setGenAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {imageSizes.map(size => (
                      <option key={size.value} value={size.value}>{size.value}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <input
                    type="text"
                    value={genSeed}
                    onChange={(e) => setGenSeed(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Seed (optional)"
                  />
                </div>
                <div className="md:col-span-3 flex items-center">
                  <button
                    onClick={async () => { await handleGenerateImage(); setImportedKeyEdit(''); }}
                    disabled={genLoading || !genPrompt}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    {genLoading ? 'Generating...' : 'Generate with AI'}
                  </button>
                  {genImage && (
                    <span className="ml-3 text-sm text-gray-600">Preview attached below</span>
                  )}
                </div>
              </div>
              {genImage && (
                <div className="mt-2">
                  <img src={genImage} alt="Preview" onClick={() => setLightboxUrl(genImage)} className="w-32 h-20 object-cover rounded border cursor-zoom-in" />
                </div>
              )}
            </div>
          )}
          
          {editingItem?.imageUrl && (
            <div className="mt-2">
              <img
                src={editingItem.imageUrl}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <p className="text-sm text-gray-500 mt-1">
                Size: {editingItem.imageWidth} x {editingItem.imageHeight}px
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setEditingItem(null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditMarketing}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Item
          </button>
        </div>
      </div>
    </div>
  );

  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Delete Marketing Item</h3>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingItem(null);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteMarketing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
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
          <h2 className="text-2xl font-bold text-gray-800">Marketing Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Search by name..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', isActive: '', search: '' })}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Marketing Items Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketing.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-48 object-cover cursor-zoom-in"
                    onClick={() => setLightboxUrl(item.imageUrl)}
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  {item.subcategory && (
                    <p className="text-gray-600 text-sm mb-2">{item.subcategory}</p>
                  )}
                  <p className="text-gray-500 text-xs mb-3">
                    Size: {item.imageWidth} x {item.imageHeight}px 
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    Aspect: {item.imageSize} | Location: {item.location}
                  </p>
                  {item.route && (
                    <div className="mb-3">
                      <p className="text-blue-600 text-sm font-medium">
                        Route: {item.route.type === 'whatsapp' ? 'WhatsApp' : item.route.type === 'weblink' ? 'Web Link' : 'Other'}
                      </p>
                      {item.route.type === 'whatsapp' && item.route.config?.phone && (
                        <div>
                          <p className="text-gray-600 text-xs">Phone: {item.route.config.phone}</p>
                          {item.route.config?.url && (
                            <a 
                              href={item.route.config.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-600 text-xs hover:text-green-800 underline"
                            >
                              Test WhatsApp Link
                            </a>
                          )}
                        </div>
                      )}
                      {(item.route.type === 'weblink' || item.route.type === 'other') && item.route.config?.url && (
                        <div>
                          <p className="text-gray-600 text-xs truncate">URL: {item.route.config.url}</p>
                          <a 
                            href={item.route.config.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 text-xs hover:text-blue-800 underline"
                          >
                            Test Link
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{item.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => { setDeletingItem(item); setShowDeleteModal(true); }}
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
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {editingItem && renderEditModal()}
      {showDeleteModal && renderDeleteModal()}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxUrl('')}>
          <img src={lightboxUrl} alt="Full preview" className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  );
}

