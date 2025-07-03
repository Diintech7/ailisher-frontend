import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AISWBSets from './AISWBSets';
import AISWBQuestions from './AISWBQuestions';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const AISWBTab = ({ topicId }) => {
  const [selectedSet, setSelectedSet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Check authentication
        const token = Cookies.get('usertoken');
        if (!token) {
          setError('Authentication required');
          toast.error('Please login to access AISWB management');
          navigate('/login');
          return;
        }

        // Validate topic ID
        if (!topicId) {
          setError('Invalid topic ID');
          toast.error('Invalid topic information');
          navigate(-1);
          return;
        }

        // Verify topic access
        const response = await fetch(`http://localhost:5000/api/aiswb/topic/${topicId}/sets`, {
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
        setError(error.message || 'Failed to access AISWB management');
        toast.error('Failed to access AISWB management. Please try again.');
        navigate(-1);
      }
    };

    validateAccess();
  }, [topicId, navigate]);

  const handleSetSelect = (set) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Please login to access AISWB management');
        navigate('/login');
        return;
      }

      if (!set || !set.id) {
        toast.error('Invalid set selection');
        return;
      }

    setSelectedSet(set);
    } catch (error) {
      console.error('Set selection error:', error);
      toast.error('Failed to select set. Please try again.');
    }
  };

  const handleBackToSets = () => {
    try {
    setSelectedSet(null);
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedSet ? (
        <AISWBQuestions
          topicId={topicId}
          selectedSet={selectedSet}
          onBack={handleBackToSets}
        />
      ) : (
        <AISWBSets
          topicId={topicId}
          onSetSelect={handleSetSelect}
        />
      )}
    </div>
  );
};

export default AISWBTab; 