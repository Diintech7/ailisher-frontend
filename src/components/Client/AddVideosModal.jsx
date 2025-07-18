import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createLecture, updateLecture, fetchYouTubeTranscript } from '../utils/api';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import YouTube from '../YouTube';


const AddVideosModal = ({ isOpen, onClose, onAdd, initialData, courseId, editingLectureId, maxLectureNumber }) => {
  const { bookId } = useParams();
  const [formData, setFormData] = useState({
    lectureName: '',
    lectureDescription: '',
    topics: [
      {
        topicName: '',
        topicDescription: '',
        VideoUrl: '',
      }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  // Track which topic is currently previewing YouTube
  const [activeYouTubeIdx, setActiveYouTubeIdx] = useState(null);
  const [youtubeTranscripts, setYoutubeTranscripts] = useState({}); // { [idx]: transcript }

  // Handler to update transcriptText for a topic
  const handleTranscript = (index, transcript) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.map((topic, i) =>
        i === index ? { ...topic, transcriptText: transcript } : topic
      )
    }));
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        lectureName: initialData.lectureName || '',
        lectureDescription: initialData.lectureDescription || '',
        topics: (initialData.topics || []).map(t => ({
          topicName: t.topicName || '',
          topicDescription: t.topicDescription || '',
          VideoUrl: t.VideoUrl || '',
        }))
      });
    } else {
      setFormData({
        lectureName: '',
        lectureDescription: '',
        topics: [
          {
            topicName: '',
            topicDescription: '',
            VideoUrl: '',
          }
        ]
      });
    }
  }, [initialData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTopicChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.map((topic, i) => 
        i === index ? { ...topic, [field]: value } : topic
      )
    }));
  };





  const addTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, {
        topicName: '',
        topicDescription: '',
        VideoUrl: '',
      }]
    }));
  };

  const removeTopic = (index) => {
    if (formData.topics.length > 1) {
      setFormData(prev => ({
        ...prev,
        topics: prev.topics.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Validate form
    if (!formData.lectureName.trim()) {
      alert('Please enter Lecture Name');
      setSubmitting(false);
      return;
    }
    if (!formData.lectureDescription.trim()) {
      alert('Please enter Lecture Description');
      setSubmitting(false);
      return;
    }
    const hasEmptyTopics = formData.topics.some(topic => 
      !topic.topicName.trim() || !topic.topicDescription.trim() || !topic.VideoUrl.trim()
    );
    if (hasEmptyTopics) {
      alert('Please fill all fields for all topics');
      setSubmitting(false);
      return;
    }
    // Check for token before making API call
    const token = Cookies.get('usertoken');
    console.log('[AddVideosModal] Token being used:', token);
    if (!token) {
      alert('Authentication required. Please log in again.');
      setSubmitting(false);
      return;
    }
    try {
      // Prepare API data, including transcriptText
      const apiData = {
        lectureNumber: (maxLectureNumber || 0) + 1, // Ensure unique lectureNumber
        lectureName: formData.lectureName,
        lectureDescription: formData.lectureDescription,
        topics: formData.topics.map(t => ({
          topicName: t.topicName,
          topicDescription: t.topicDescription,
          VideoUrl: t.VideoUrl,
          transcriptText: t.transcriptText // <-- include transcriptText
        }))
      };
      console.log('[AddVideosModal] Payload being sent to backend:', apiData);
      let response;
      if (editingLectureId) {
        response = await updateLecture(bookId, courseId, editingLectureId, apiData);
      } else {
        response = await createLecture(bookId, courseId, apiData);
      }
      console.log('[AddVideosModal] Lecture API response:', response);
      if (onAdd) onAdd(response);
      onClose(); // Only close modal on success
    } catch (err) {
      console.error('Error submitting lecture:', err);
      alert('Error: ' + err.message);
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setFormData({
      lectureName: '',
      lectureDescription: '',
      topics: [
        {
          topicName: '',
          topicDescription: '',
          VideoUrl: '',
        }
      ]
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData ? 'Edit Videos' : 'Add Videos'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {/* Lecture Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lecture Name *
            </label>
            <input
              type="text"
              value={formData.lectureName}
              onChange={(e) => handleInputChange('lectureName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter lecture name"
              required
            />
          </div>
          {/* Lecture Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lecture Description *
            </label>
            <textarea
              value={formData.lectureDescription}
              onChange={(e) => handleInputChange('lectureDescription', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter lecture description"
              required
            />
          </div>
          {/* Topics Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Topics</h3>
              <button
                type="button"
                onClick={addTopic}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add Topic
              </button>
            </div>
            {formData.topics.map((topic, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-700">Topic {index + 1}</h4>
                  {formData.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopic(index)}
                      className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      value={topic.topicName}
                      onChange={(e) => handleTopicChange(index, 'topicName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter topic name"
                      required
                    />
                  </div>
                  {/* Topic Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Description *
                    </label>
                    <textarea
                      value={topic.topicDescription}
                      onChange={(e) => handleTopicChange(index, 'topicDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter topic description"
                      required
                    />
                  </div>
                </div> {/* end grid */}

                {/* Video URL and YouTube Preview - full width below grid */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={topic.VideoUrl}
                    onChange={(e) => {
                      handleTopicChange(index, 'VideoUrl', e.target.value);
                      setActiveYouTubeIdx(index); // Show YouTube preview for this topic
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    required
                    onFocus={() => setActiveYouTubeIdx(index)}
                  />
                  {/* Show YouTube preview and transcript only for the active topic */}
                  {topic.VideoUrl && activeYouTubeIdx === index && (
                    <div className="mt-4 -mx-6 md:-mx-8">
                      <div className="w-full px-0 md:px-4">
                        <YouTube
                          url={topic.VideoUrl}
                          showInput={false}
                          onTranscript={(transcript) => handleTranscript(index, transcript)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              disabled={submitting}
            >
              {initialData ? 'Update Videos' : 'Add Videos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideosModal; 