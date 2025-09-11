import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import AISWBTab from './AISWBTab';
import AISWBPrintModal from './AISWBPrintModal';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const AISWBPage = () => {
  const { bookId, workbookId, chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Check authentication
        const token = Cookies.get('usertoken');
        if (!token) {
          toast.error('Please login to access AISWB management');
          navigate('/login');
          return;
        }

        // Validate required IDs
        if (!topicId || (!bookId && !workbookId) || !chapterId) {
          toast.error('Invalid page access. Missing required information.');
          navigate(-1);
          return;
        }

        // Verify topic exists and user has access
        const baseUrl = isWorkbook 
          ? `https://test.ailisher.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}`
          : `https://test.ailisher.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}`;

        const response = await fetch(baseUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify topic access');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to verify topic access');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Access validation error:', error);
        toast.error('Failed to access AISWB management. Please try again.');
        navigate(-1);
      }
    };

    validateAccess();
  }, [bookId, workbookId, chapterId, topicId, navigate, isWorkbook]);

  const handleBackClick = () => {
    try {
      if (isWorkbook) {
        navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}`);
      } else {
        navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate back. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Topic</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">AISWB Management</h1>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} className="mr-2" />
            <span>Print</span>
          </button>
        </div>

        <AISWBTab topicId={topicId} />
      </div>

      <AISWBPrintModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        topicId={topicId}
      />
    </div>
  );
};

export default AISWBPage; 