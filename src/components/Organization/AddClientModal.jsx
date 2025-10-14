import React, { useState } from 'react';
import { X, Upload, Loader2, Check, Copy, Eye, EyeOff } from 'lucide-react';

import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';

const AddClientModal = ({ isOpen, onClose, onClientAdded, mode = 'create', initialData, clientId }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessOwnerName: '',
    email: '',
    businessNumber: '',
    businessGSTNumber: '',
    businessPANNumber: '',
    businessMobileNumber: '',
    businessCategory: '',
    businessAddress: '',
    city: '',
    pinCode: '',
    businessLogo: '',
    businessWebsite: '',
    businessYoutubeChannel: '',
    turnOverRange: ''
  });

  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState({ userId: false, password: false });
  const [countdown, setCountdown] = useState(0);

  const businessCategories = [
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Food & Beverage',
    'Transportation',
    'Consulting',
    'Marketing',
    'Other'
  ];

  const turnoverRanges = [
    'Less than 1 Lakh',
    '1-5 Lakhs',
    '5-10 Lakhs',
    '10-25 Lakhs',
    '25-50 Lakhs',
    '50 Lakhs - 1 Crore',
    '1-5 Crores',
    '5-10 Crores',
    'Above 10 Crores'
  ];

  React.useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [mode, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLogoUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'post_blog'); // Replace with your Cloudinary upload preset
      formData.append('cloud_name', 'dsbuzlxpw'); // Replace with your Cloudinary cloud name

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dsbuzlxpw/image/upload`, // Replace with your Cloudinary cloud name
        {
          method: 'POST',
          body: formData
        }
      ).then(res => res.json());

      setFormData(prev => ({
        ...prev,
        businessLogo: response.secure_url
      }));
    } catch (error) {
      console.error('Logo upload error:', error);
      setError('Failed to upload logo. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'businessName',
      'businessOwnerName',
      'email',
      'businessNumber',
      'businessGSTNumber',
      'businessPANNumber',
      'businessMobileNumber',
      'businessCategory',
      'businessAddress',
      'city',
      'pinCode'
    ];

    for (let field of requiredFields) {
      if (!formData[field].trim()) {
        setError(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Mobile number validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.businessMobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }

    // PIN code validation (6 digits)
    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(formData.pinCode)) {
      setError('Please enter a valid 6-digit PIN code');
      return false;
    }

    return true;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const startCountdown = () => {
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          resetModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetModal = () => {
    setFormData({
      businessName: '',
      businessOwnerName: '',
      email: '',
      businessNumber: '',
      businessGSTNumber: '',
      businessPANNumber: '',
      businessMobileNumber: '',
      businessCategory: '',
      businessAddress: '',
      city: '',
      pinCode: '',
      businessLogo: '',
      businessWebsite: '',
      businessYoutubeChannel: '',
      turnOverRange: ''
    });
    setSuccess(null);
    setShowCredentials(false);
    setShowPassword(false);
    setCopied({ userId: false, password: false });
    setCountdown(0);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = Cookies.get('orgtoken');
      if (mode === 'edit') {
        if (!clientId) throw new Error('Missing clientId for update');
        const res = await fetch(`${API_BASE_URL}/api/organizations/clients/${clientId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update client');
        if (onClientAdded) onClientAdded();
        onClose();
      } else {
        const res = await fetch(`${API_BASE_URL}/api/organizations/clients/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || 'Failed to create client');
        setSuccess(result);
        setShowCredentials(true);
        if (onClientAdded) onClientAdded();
        startCountdown();
      }
    } catch (error) {
      console.error('Create client error:', error);
      setError(error.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showCredentials && success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Client Created Successfully!
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Client User ID */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-blue-800">Client User ID:</p>
                  <button
                    onClick={() => copyToClipboard(success.client.userId, 'userId')}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Copy User ID"
                  >
                    {copied.userId ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-2xl font-bold text-blue-600 font-mono bg-white px-3 py-2 rounded border">
                  {success.client.userId}
                </p>
              </div>

              {/* Temporary Password */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-amber-800">Temporary Password:</p>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-amber-600 hover:text-amber-800 p-1 rounded"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(success.client.tempPassword, 'password')}
                      className="text-amber-600 hover:text-amber-800 p-1 rounded"
                      title="Copy Password"
                    >
                      {copied.password ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p className="text-xl font-bold text-amber-700 font-mono bg-white px-3 py-2 rounded border">
                  {showPassword ? success.client.tempPassword : '••••••••••••'}
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-bold text-red-800">Important!</h4>
                  <p className="text-sm text-red-700">
                    Save these credentials immediately. This is the only time they will be displayed.
                    The client must change the password on first login.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Client Details:</h4>
              <div className="text-left space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Business:</span> {success.client.businessName}</p>
                <p><span className="font-medium">Owner:</span> {success.client.businessOwnerName}</p>
                <p><span className="font-medium">Email:</span> {success.client.email}</p>
                <p><span className="font-medium">Category:</span> {success.client.businessCategory}</p>
              </div>
            </div>

            {/* Auto-close countdown */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Auto-closing in {countdown} seconds...
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={resetModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Close Now
                </button>
                <button
                  onClick={() => {
                    setCountdown(0);
                    setShowCredentials(false);
                    setSuccess(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Another Client
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{mode === 'edit' ? 'Edit Client' : 'Add New Client'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter business name"
                required
              />
            </div>

            {/* Business Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Owner Name *
              </label>
              <input
                type="text"
                name="businessOwnerName"
                value={formData.businessOwnerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter owner name"
                required
              />
            </div>

            {/* Business Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Number *
              </label>
              <input
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter business number"
                required
              />
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter business email"
                required
              />
            </div>

            {/* Business GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business GST Number *
              </label>
              <input
                type="text"
                name="businessGSTNumber"
                value={formData.businessGSTNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter GST number"
                required
              />
            </div>

            {/* Business PAN Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business PAN Number *
              </label>
              <input
                type="text"
                name="businessPANNumber"
                value={formData.businessPANNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PAN number"
                required
              />
            </div>

            {/* Business Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Mobile Number *
              </label>
              <input
                type="tel"
                name="businessMobileNumber"
                value={formData.businessMobileNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                required
              />
            </div>

            {/* Business Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Category *
              </label>
              <select
                name="businessCategory"
                value={formData.businessCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {businessCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
                required
              />
            </div>

            {/* Pin Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code *
              </label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 6-digit PIN code"
                maxLength="6"
                required
              />
            </div>
          </div>

          {/* Business Address - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address *
            </label>
            <textarea
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete business address"
              required
            />
          </div>

          {/* Business Logo Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={logoUploading}
                />
              </div>
              {logoUploading && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Uploading...
                </div>
              )}
              {formData.businessLogo && (
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  Uploaded
                </div>
              )}
            </div>
            {formData.businessLogo && (
              <div className="mt-2">
                <img
                  src={formData.businessLogo}
                  alt="Business Logo"
                  className="h-16 w-16 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Business Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Website
              </label>
              <input
                type="url"
                name="businessWebsite"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Business YouTube Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business YouTube Channel
              </label>
              <input
                type="url"
                name="businessYoutubeChannel"
                value={formData.businessYoutubeChannel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/channel/..."
              />
            </div>
          </div>

          {/* Turnover Range */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Turnover Range
            </label>
            <select
              name="turnOverRange"
              value={formData.turnOverRange}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Turnover Range</option>
              {turnoverRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading || logoUploading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Create Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AddClientModal;