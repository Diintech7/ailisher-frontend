import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AISWBSets from './AISWBSets';
import AISWBQuestions from './AISWBQuestions';
import ObjectiveSets from './ObjectiveSets';
import ObjectiveQuestionManagement from './ObjectiveQuestionManagement';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { ArrowLeft, Download } from 'lucide-react';
import AISWBPrintModal from './AISWBPrintModal';
import ObjectivePrintModal from './ObjectivePrintModal';
import UniversalPrintModal from './UniversalPrintModal';

const AISWBTab = ({ topicId }) => {
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedObjectiveSet, setSelectedObjectiveSet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('subjective');
  const [showSubjectivePrint, setShowSubjectivePrint] = useState(false);
  const [showObjectivePrint, setShowObjectivePrint] = useState(false);
  const [showUniversalPrint, setShowUniversalPrint] = useState(false);
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

        // Verify topic access (This is a generic check, might need adjustment if endpoints differ)
        const response = await fetch(`https://test.ailisher.com/api/aiswb/topic/${topicId}/sets`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify topic access');
        }

        const data = await response.json();
        if (!data.success && response.status !== 404) { // 404 can be OK if no sets exist yet
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
    setSelectedSet(set);
  };
  
  const handleObjectiveSetSelect = (set) => {
    setSelectedObjectiveSet(set);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
  };
  
  const handleBackToObjectiveSets = () => {
    setSelectedObjectiveSet(null);
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

  if (selectedSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AISWBQuestions
          topicId={topicId}
          selectedSet={selectedSet}
          onBack={handleBackToSets}
        />
      </div>
    );
  }

  if (selectedObjectiveSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBackToObjectiveSets}
          className="mb-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Sets
        </button>
        <ObjectiveQuestionManagement selectedSet={selectedObjectiveSet} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Universal Print Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowUniversalPrint(true)}
          className="flex items-center px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 transition-colors"
        >
          <Download size={18} className="mr-2" />
          Print (Both)
        </button>
      </div>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('subjective')}
          className={`px-6 py-3 text-lg font-medium transition-colors ${
            activeTab === 'subjective'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Subjective
        </button>
        <button
          onClick={() => setActiveTab('objective')}
          className={`px-6 py-3 text-lg font-medium transition-colors ${
            activeTab === 'objective'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Objective
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'subjective' && (
        <>
          <div className="flex justify-start mb-4">
            <button
              onClick={() => setShowSubjectivePrint(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Print Subjective
            </button>
          </div>
          <AISWBSets
            topicId={topicId}
            onSetSelect={handleSetSelect}
          />
          {showSubjectivePrint && (
            <AISWBPrintModal
              isOpen={showSubjectivePrint}
              onClose={() => setShowSubjectivePrint(false)}
              topicId={topicId}
            />
          )}
        </>
      )}

      {activeTab === 'objective' && (
        <>
          <div className="flex justify-start mb-4">
            <button
              onClick={() => setShowObjectivePrint(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Print Objective
            </button>
          </div>
          <ObjectiveSets topicId={topicId} onSetSelect={handleObjectiveSetSelect} />
          {showObjectivePrint && (
            <ObjectivePrintModal
              isOpen={showObjectivePrint}
              onClose={() => setShowObjectivePrint(false)}
              topicId={topicId}
            />
          )}
        </>
      )}

      {showUniversalPrint && (
        <UniversalPrintModal
          isOpen={showUniversalPrint}
          onClose={() => setShowUniversalPrint(false)}
          topicId={topicId}
        />
      )}
    </div>
  );
};

export default AISWBTab; 