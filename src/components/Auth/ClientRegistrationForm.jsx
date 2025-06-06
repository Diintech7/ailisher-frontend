import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

const ClientRegistrationForm = ({ onRegister, isLoading, onBack }) => {
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

  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');

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

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLogoUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'post_blog');
      formData.append('cloud_name', 'dsbuzlxpw');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dsbuzlxpw/image/upload`,
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.businessMobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(formData.pinCode)) {
      setError('Please enter a valid 6-digit PIN code');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onRegister(formData);
    }
  };

  return (
    <div className="min-h-screen m-auto w-full flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-md">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create Your Account</h2>
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
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading || logoUploading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientRegistrationForm; 