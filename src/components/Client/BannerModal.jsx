import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Check, Sparkles } from 'lucide-react';
import { generateAIImage, saveAIImageToR2 } from '../utils/api';
import { API_BASE_URL } from '../../config';
import Cookies from 'js-cookie';

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

  useEffect(() => {
    if (banner) {
      setFormData({
        imageKey: banner.imageKey || '',
        placement: banner.placement || 'top',
        order: banner.order || 0,
        redirectUrl: banner.redirectUrl || '',
        isActive: banner.isActive !== undefined ? banner.isActive : true
      });
      setPreviewUrl(banner.imageUrl || '');
    } else {
      setFormData({
        imageKey: '',
        placement: 'top',
        order: 0,
        redirectUrl: '',
        isActive: true
      });
      setPreviewUrl('');
    }
  }, [banner, isOpen]);

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

            {/* Redirect URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect Link (Optional)
              </label>
              <input
                type="url"
                name="redirectUrl"
                value={formData.redirectUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
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
