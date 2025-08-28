import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, FileText, Database, ExternalLink, AlertTriangle, Image, Music, Video, File, Archive } from 'lucide-react';

const TopicViewer = () => {
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { bookId, chapterId, topicId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopicData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/qrcode/book-data/${bookId}/chapters/${chapterId}/topics/${topicId}`);
        const data = await response.json();
        
        if (data.success) {
          setTopicData(data);
        } else {
          setError(data.message || 'Failed to fetch topic data');
        }
      } catch (error) {
        console.error('Error fetching topic data:', error);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    if (bookId && chapterId && topicId) {
      fetchTopicData();
    }
  }, [bookId, chapterId, topicId, navigate]);

  // Function to get complete image URL
  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    return `https://aipbbackend-yxnh.onrender.com/${imageUrl}`;
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="text-gray-600" />;
    
    const type = fileType.toLowerCase();
    
    if (type.includes('image/')) {
      return <Image className="text-green-600" />;
    } else if (type.includes('audio/') || type.includes('music')) {
      return <Music className="text-purple-600" />;
    } else if (type.includes('video/')) {
      return <Video className="text-red-600" />;
    } else if (type.includes('pdf')) {
      return <FileText className="text-red-700" />;
    } else if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return <FileText className="text-green-700" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gzip')) {
      return <Archive className="text-yellow-600" />;
    } else if (type.includes('text/') || type.includes('document')) {
      return <FileText className="text-blue-600" />;
    } else {
      return <File className="text-gray-600" />;
    }
  };

  // Get color class based on file type
  const getColorClass = (fileType) => {
    if (!fileType) return 'bg-gray-100';
    
    const type = fileType.toLowerCase();
    
    if (type.includes('image/')) {
      return 'bg-green-100';
    } else if (type.includes('audio/') || type.includes('music')) {
      return 'bg-purple-100';
    } else if (type.includes('video/')) {
      return 'bg-red-100';
    } else if (type.includes('pdf')) {
      return 'bg-red-50';
    } else if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return 'bg-green-50';
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gzip')) {
      return 'bg-yellow-50';
    } else if (type.includes('text/') || type.includes('document')) {
      return 'bg-blue-50';
    } else {
      return 'bg-gray-100';
    }
  };

  // Function to format file type
  const formatFileType = (fileType) => {
    if (!fileType) return 'Unknown type';
    
    return fileType
      .replace('application/', '')
      .replace('image/', '')
      .replace('audio/', '')
      .replace('video/', '')
      .replace('text/', '')
      .toUpperCase();
  };

  const handleBackClick = () => {
    navigate(`/book-viewer/${bookId}/chapters/${chapterId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600"></div>
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
              <span>Back to Chapter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-yellow-800">Not Found</h3>
            <p className="text-yellow-700">Topic data could not be found</p>
            <button 
              onClick={handleBackClick}
              className="mt-3 text-yellow-600 hover:text-yellow-800 flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Back to Chapter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Chapter</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4 lg:w-1/5">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
              {topicData.book?.coverImage ? (
                <img 
                  src={getCompleteImageUrl(topicData.book.coverImage)} 
                  alt={topicData.book.title} 
                  className="h-full w-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="text-center"><svg class="mx-auto text-emerald-400" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg></div>';
                  }}
                />
              ) : (
                <div className="text-center">
                  <Book size={64} className="mx-auto text-emerald-400" />
                </div>
              )}
            </div>
          </div>
          <div className="md:w-3/4 lg:w-4/5">
            <div className="mb-2">
              <span className="text-sm text-gray-500">From "{topicData.chapter?.title || 'Unknown Chapter'}" in "{topicData.book?.title || 'Unknown Book'}"</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{topicData.topic?.title}</h1>
            <p className="text-gray-700 mb-6">{topicData.topic?.description || 'No description available'}</p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <FileText size={16} className="mr-2" />
                <span>View Full Topic</span>
              </button>
              
              <button
                onClick={() => navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/datastore`)} 
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
              >
                <Database size={16} className="mr-2" />
                <span>Topic Datastore</span>
              </button>
              
              <button
                onClick={() => navigate(`/book-viewer/${bookId}/chapters/${chapterId}`)} 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Book size={16} className="mr-2" />
                <span>View Chapter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {topicData.topic?.content && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content</h2>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: topicData.topic.content }} />
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sub-Topics ({topicData.subtopics?.length || 0})</h2>
        {!topicData.subtopics || topicData.subtopics.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No sub-topics available for this topic</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topicData.subtopics
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((subtopic) => (
                <div 
                  key={subtopic._id}
                  className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-full mr-3 flex-shrink-0">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-800">{subtopic.title}</h3>
                  </div>
                  
                  {subtopic.description && (
                    <p className="text-sm text-gray-600 mb-3 pl-10">{subtopic.description}</p>
                  )}
                  
                  {subtopic.content && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-700 mb-2">Content Preview</h4>
                      <div className="text-sm text-gray-800 line-clamp-3">
                        {subtopic.content.replace(/<[^>]*>/g, '')}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 pl-10">
                    <button
                      onClick={() => navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopic._id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      <span>View Full Sub-Topic</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Datastore Items ({topicData.datastoreItems?.length || 0})</h2>
        {!topicData.datastoreItems || topicData.datastoreItems.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No datastore items available for this topic</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicData.datastoreItems.map((item) => {
              const isImage = item.fileType && item.fileType.toLowerCase().includes('image/');
              return (
                <div 
                  key={item._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {isImage && item.url && (
                    <div className="h-40 overflow-hidden bg-gray-100">
                      <img 
                        src={getCompleteImageUrl(item.url)} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="text-gray-400" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${getColorClass(item.fileType)}`}>
                        {getFileIcon(item.fileType)}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500">{formatFileType(item.fileType)}</p>
                      </div>
                    </div>
                    <a 
                      href={getCompleteImageUrl(item.url)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center mt-2"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      <span>View File</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicViewer;