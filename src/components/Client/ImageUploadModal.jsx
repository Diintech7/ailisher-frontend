import React, { useState } from 'react';
import { X, Upload, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const ImageUploadModal = ({ isOpen, onClose, questionId, onSubmissionComplete }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only image files are allowed');
    }
    
    // Create preview URLs and add to state
    const newPreviewImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setImages([...images, ...validFiles]);
    setPreviewImages([...previewImages, ...newPreviewImages]);
  };

  const removeImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewImages[index].preview);
    
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    
    const updatedPreviews = [...previewImages];
    updatedPreviews.splice(index, 1);
    
    setImages(updatedImages);
    setPreviewImages(updatedPreviews);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    
    setUploading(true);
    
    try {
      // Get user token
      const token = Cookies.get('usertoken');
      
      // Try to upload to server if token exists
      if (token) {
        try {
          // Create FormData to send files
          const formData = new FormData();
          images.forEach((image, index) => {
            formData.append('answerImages', image);
          });
          formData.append('questionId', questionId);
          
          const response = await fetch('https://test.ailisher.com/api/aiswb/submissions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success('Answer submitted successfully');
            // Clean up preview URLs
            previewImages.forEach(img => URL.revokeObjectURL(img.preview));
            onSubmissionComplete(data.data);
            onClose();
            return;
          } else {
            console.warn('Server submission failed, falling back to local storage:', data.message);
            // Continue to local storage fallback
          }
        } catch (error) {
          console.error('Error submitting to server:', error);
          // Continue to local storage fallback
        }
      }
      
      // Fallback to local storage if server submission fails or no token
      // Convert images to data URLs for local storage
      const imagePromises = images.map(image => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(image);
        });
      });
      
      const imageDataUrls = await Promise.all(imagePromises);
      
      // Create submission object
      const submission = {
        answerImages: imageDataUrls
      };
      
      // Clean up preview URLs
      previewImages.forEach(img => URL.revokeObjectURL(img.preview));
      
      // Call the completion handler with the local submission data
      onSubmissionComplete(submission);
      onClose();
      toast.success('Answer saved locally');
      
    } catch (error) {
      console.error('Error handling submission:', error);
      toast.error('Failed to save answer');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop functionality
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Validate file types
      const validFiles = droppedFiles.filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length !== droppedFiles.length) {
        toast.error('Only image files are allowed');
      }
      
      // Create preview URLs and add to state
      const newPreviewImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setImages([...images, ...validFiles]);
      setPreviewImages([...previewImages, ...newPreviewImages]);
    }
  };

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previewImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Upload Answer Images</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Upload images of your handwritten or typed answer. You can upload multiple images.
            </p>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Click to upload images</p>
                <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
              </label>
            </div>
          </div>

          {previewImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      disabled={uploading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <label
                    htmlFor="image-upload"
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Plus size={24} className="text-gray-400" />
                    <span className="text-gray-500 text-sm mt-1">Add more</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              disabled={uploading || images.length === 0}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={16} className="mr-2" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal; 