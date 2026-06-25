import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Check, Sparkles } from 'lucide-react';
import { generateAIImage, saveAIImageToR2 } from '../utils/api';
import { API_BASE_URL } from '../../config';
import Cookies from 'js-cookie';

const parseRedirectUrl = (url) => {
  if (!url) return { type: 'none', id: '', custom: '' };
  
  if (url.startsWith('/plans/')) {
    return { type: 'plan', id: url.replace('/plans/', ''), custom: '' };
  }
  if (url.startsWith('/courses/')) {
    return { type: 'course', id: url.replace('/courses/', ''), custom: '' };
  }
  if (url.startsWith('/books/')) {
    return { type: 'book', id: url.replace('/books/', ''), custom: '' };
  }
  if (url.startsWith('/workbooks/')) {
    return { type: 'workbook', id: url.replace('/workbooks/', ''), custom: '' };
  }
  if (url.startsWith('/tests/objective/')) {
    return { type: 'objective-test', id: url.replace('/tests/objective/', ''), custom: '' };
  }
  if (url.startsWith('/tests/subjective/')) {
    return { type: 'subjective-test', id: url.replace('/tests/subjective/', ''), custom: '' };
  }
  if (url.startsWith('/classroom/')) {
    return { type: 'classroom', id: url.replace('/classroom/', ''), custom: '' };
  }
  if (url.startsWith('/ai-pyqs/')) {
    return { type: 'pyq', id: url.replace('/ai-pyqs/', ''), custom: '' };
  }
  if (url.startsWith('/ai-current-affairs/')) {
    return { type: 'current-affairs', id: url.replace('/ai-current-affairs/', ''), custom: '' };
  }
  if (url.startsWith('/question-banks/')) {
    return { type: 'questionbank', id: url.replace('/question-banks/', ''), custom: '' };
  }
  
  return { type: 'url', id: '', custom: url };
};

const buildRedirectUrl = (type, itemId, customVal) => {
  if (type === 'none') return '';
  if (type === 'url') return customVal;
  if (type === 'plan') return itemId ? `/plans/${itemId}` : '';
  if (type === 'course') return itemId ? `/courses/${itemId}` : '';
  if (type === 'book') return itemId ? `/books/${itemId}` : '';
  if (type === 'workbook') return itemId ? `/workbooks/${itemId}` : '';
  if (type === 'objective-test') return itemId ? `/tests/objective/${itemId}` : '';
  if (type === 'subjective-test') return itemId ? `/tests/subjective/${itemId}` : '';
  if (type === 'classroom') return itemId ? `/classroom/${itemId}` : '';
  if (type === 'pyq') return itemId ? `/ai-pyqs/${itemId}` : '';
  if (type === 'current-affairs') return itemId ? `/ai-current-affairs/${itemId}` : '';
  if (type === 'questionbank') return itemId ? `/question-banks/${itemId}` : '';
  return '';
};

const BannerModal = ({ isOpen, onClose, onBannerSaved, banner = null }) => {
  const [formData, setFormData] = useState({
    imageKey: '',
    placement: 'top',
    order: 0,
    redirectUrl: '',
    isActive: true
  });

  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');

  // Redirection management states
  const [redirectType, setRedirectType] = useState('none');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [itemsList, setItemsList] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchItemsForType = async (type) => {
    if (['none', 'url'].includes(type)) {
      setItemsList([]);
      return;
    }
    setLoadingItems(true);
    setItemsList([]);
    try {
      const token = Cookies.get('usertoken') || Cookies.get('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      let url = '';
      
      switch (type) {
        case 'plan':
          url = `${API_BASE_URL}/api/client/credit-recharge-plans`;
          break;
        case 'course':
          url = `${API_BASE_URL}/api/aicourses`;
          break;
        case 'book':
          url = `${API_BASE_URL}/api/books`;
          break;
        case 'workbook':
          url = `${API_BASE_URL}/api/workbooks`;
          break;
        case 'objective-test':
          url = `${API_BASE_URL}/api/objectivetests`;
          break;
        case 'subjective-test':
          url = `${API_BASE_URL}/api/subjectivetests`;
          break;
        case 'classroom':
          url = `${API_BASE_URL}/api/classroom-exams`;
          break;
        case 'pyq':
          url = `${API_BASE_URL}/api/classroom-exams/pyq-sets`;
          break;
        case 'current-affairs':
          url = `${API_BASE_URL}/api/classroom-exams/current-affairs`;
          break;
        case 'questionbank':
          url = `${API_BASE_URL}/api/questionbank`;
          break;
        default:
          setLoadingItems(false);
          return;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      
      if (res.ok) {
        let items = [];
        if (type === 'plan') {
          items = data.data || [];
        } else if (type === 'course') {
          items = data.courses || [];
        } else if (type === 'book') {
          items = data.books || [];
        } else if (type === 'workbook') {
          items = data.workbooks || [];
        } else if (type === 'objective-test' || type === 'subjective-test') {
          items = data.tests || [];
        } else if (type === 'classroom') {
          items = data.exams || data.data || [];
        } else if (type === 'pyq') {
          items = data.pyq_sets || [];
        } else if (type === 'current-affairs') {
          items = data.topics || [];
        } else if (type === 'questionbank') {
          items = data.data || [];
        }
        
        const formattedItems = items.map(item => {
          const id = item.pyq_set_id || item.ca_topic_id || item._id || item.exam_id || item.id;
          const title = item.name || item.title || item.businessName || id;
          return { id, title };
        });
        
        setItemsList(formattedItems);
      } else {
        console.error(`Failed to fetch ${type}:`, data.message);
      }
    } catch (err) {
      console.error(`Error fetching items for ${type}:`, err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (banner) {
        setFormData({
          imageKey: banner.imageKey || '',
          placement: banner.placement || 'top',
          order: banner.order || 0,
          redirectUrl: banner.redirectUrl || '',
          isActive: banner.isActive !== undefined ? banner.isActive : true
        });
        setPreviewUrl(banner.imageUrl || '');
        
        const parsed = parseRedirectUrl(banner.redirectUrl);
        setRedirectType(parsed.type);
        setSelectedItemId(parsed.id);
        setCustomUrl(parsed.custom);
        
        if (['plan', 'course', 'book', 'workbook', 'objective-test', 'subjective-test', 'classroom', 'pyq', 'current-affairs', 'questionbank'].includes(parsed.type)) {
          fetchItemsForType(parsed.type);
        } else {
          setItemsList([]);
        }
      } else {
        setFormData({
          imageKey: '',
          placement: 'top',
          order: 0,
          redirectUrl: '',
          isActive: true
        });
        setPreviewUrl('');
        setRedirectType('none');
        setSelectedItemId('');
        setCustomUrl('');
        setItemsList([]);
      }
    }
  }, [banner, isOpen]);

  const handleRedirectTypeChange = (type) => {
    setRedirectType(type);
    setSelectedItemId('');
    setCustomUrl('');
    setFormData(prev => ({ ...prev, redirectUrl: '' }));
    
    if (['plan', 'course', 'book', 'workbook', 'objective-test', 'subjective-test', 'classroom', 'pyq', 'current-affairs', 'questionbank'].includes(type)) {
      fetchItemsForType(type);
    } else {
      setItemsList([]);
    }
  };

  const handleCustomUrlChange = (val) => {
    setCustomUrl(val);
    setFormData(prev => ({ ...prev, redirectUrl: val }));
  };

  const handleItemSelectChange = (itemId) => {
    setSelectedItemId(itemId);
    const generatedUrl = buildRedirectUrl(redirectType, itemId, customUrl);
    setFormData(prev => ({ ...prev, redirectUrl: generatedUrl }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setImageUploading(true);
    setError('');

    try {
      const presignedResponse = await fetch(`${API_BASE_URL}/api/r2/presigned-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'banners',
          filename: file.name,
          contentType: file.type
        })
      });
      
      const presignedData = await presignedResponse.json();
      if (!presignedData.success) {
        throw new Error(presignedData.message || 'Failed to get upload URL');
      }
      
      const { uploadUrl, publicUrl, key } = presignedData.data;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      setPreviewUrl(publicUrl);
      setFormData(prev => ({
        ...prev,
        imageKey: key
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt && !showAiPrompt) {
      setAiPrompt(`A professional modern app banner for ${formData.placement} placement, clean design, high resolution`);
      setShowAiPrompt(true);
      return;
    }

    if (!aiPrompt) {
      setError('Please enter a prompt.');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const res = await generateAIImage(aiPrompt);
      if (res?.success && res?.image) {
        const dataUrl = `data:image/png;base64,${res.image}`;
        setPreviewUrl(dataUrl);
        
        // Auto-save to R2 to get a key
        const saveRes = await saveAIImageToR2({
          url: dataUrl,
          prompt: aiPrompt,
        });
        
        if (saveRes?.success) {
          setFormData(prev => ({
            ...prev,
            imageKey: saveRes.data.key
          }));
        } else {
          throw new Error('Failed to save AI image to R2');
        }
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (err) {
      setError('AI Generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = Cookies.get('usertoken') || Cookies.get('token');
      const url = banner 
        ? `${API_BASE_URL}/api/admin/banners/${banner._id}` 
        : `${API_BASE_URL}/api/admin/banners`;
      
      const method = banner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onBannerSaved();
        onClose();
      } else {
        setError(result.message || 'Failed to save banner');
      }
    } catch (error) {
      console.error('Save banner error:', error);
      setError('Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {banner ? 'Edit Banner' : 'Add New Banner'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload size={18} className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {imageUploading ? 'Uploading...' : 'Choose Image'}
                  </span>
                </label>
                {formData.imageKey && (
                  <div className="text-green-600">
                    <Check size={20} />
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-24 w-full object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* AI Generation Section */}
            <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
              <button 
                type="button" 
                onClick={handleAiGenerate}
                disabled={isGenerating || imageUploading}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-purple-700 rounded-md hover:bg-purple-50 transition-colors border border-purple-200 shadow-sm"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin h-4 w-4 text-purple-700" />
                ) : (
                  <Sparkles size={18} />
                )}
                {isGenerating ? 'Generating...' : (showAiPrompt ? 'Generate Image' : 'Generate by AI')}
              </button>
              
              {showAiPrompt && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the banner you want..."
                    className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Specify colors, style (flat, glassmorphism), or content.
                  </p>
                </div>
              )}
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Placement *
              </label>
              <select
                name="placement"
                value={formData.placement}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="top">Top Banner</option>
                <option value="medium">Medium Banner</option>
                <option value="bottom">Bottom Banner</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select where this banner will show in the app.</p>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order *
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Smaller numbers show first (e.g., 1, 2, 3).</p>
            </div>

            {/* Redirect Type & Conditional Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redirect Type
                </label>
                <select
                  value={redirectType}
                  onChange={(e) => handleRedirectTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="none">No Redirect (None)</option>
                  <option value="url">Web URL / Custom Link</option>
                  <option value="plan">App Plan (Purchase Screen)</option>
                  <option value="course">App Course (Course Screen)</option>
                  <option value="book">AI Book Screen</option>
                  <option value="workbook">AI Workbook Screen</option>
                  <option value="objective-test">Objective Test Screen</option>
                  <option value="subjective-test">Subjective Test Screen</option>
                  <option value="classroom">AI Classroom Exam Screen</option>
                  <option value="pyq">AI PYQs Screen</option>
                  <option value="current-affairs">AI Current Affairs Screen</option>
                  <option value="questionbank">Question Bank Screen</option>
                </select>
              </div>

              {redirectType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Web URL or Custom Link *
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => handleCustomUrlChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. https://example.com or custom link"
                    required
                  />
                </div>
              )}

              {!['none', 'url'].includes(redirectType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Target *
                  </label>
                  {loadingItems ? (
                    <div className="flex items-center text-sm text-gray-500 py-1">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Loading items...
                    </div>
                  ) : itemsList.length === 0 ? (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-100 italic">
                      No items found for this service.
                    </div>
                  ) : (
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleItemSelectChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {itemsList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (Enabled)
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              disabled={loading || imageUploading || !formData.imageKey}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Banner'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerModal;
