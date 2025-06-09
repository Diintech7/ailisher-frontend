import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, X, Check, Download } from 'lucide-react';
import AISWBTab from './AISWBTab';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const AISWBPage = () => {
  const { bookId, workbookId, chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isWorkbook = location.includes('/ai-workbook/');
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [loadingSets, setLoadingSets] = useState(false);
  const [expandedSet, setExpandedSet] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

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
          ? `https://aipbbackend.onrender.com/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}`
          : `https://aipbbackend.onrender.com/api/books/${bookId}/chapters/${chapterId}/topics/${topicId}`;

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

  const fetchSetsForPrint = async () => {
    setLoadingSets(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend.onrender.com/api/aiswb/topic/${topicId}/sets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Sets data:', data);
      
      if (data.success) {
        setSets(data.sets);
      } else {
        toast.error(data.message || 'Failed to fetch sets');
      }
    } catch (error) {
      console.error('Error fetching sets:', error);
      toast.error('Failed to fetch sets');
    } finally {
      setLoadingSets(false);
    }
  };

  const fetchQuestionsForSet = async (setId) => {
    setLoadingQuestions(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const set = sets.find(s => s.id === setId);
      const questionIds = set.questions || [];
      console.log('Fetching questions for set with IDs:', questionIds);

      if (questionIds.length === 0) {
        setSets(prevSets => 
          prevSets.map(s => 
            s.id === setId 
              ? { ...s, questions: [] }
              : s
          )
        );
        setLoadingQuestions(false);
        return;
      }

      const questionsPromises = questionIds.map(async (questionId) => {
        try {
          const response = await fetch(`https://aipbbackend.onrender.com/api/aiswb/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          console.log(`API response for question ${questionId}:`, data);
          console.log(`API data.data for question ${questionId}:`, data.data);
          
          if (data.success && data.data && typeof data.data === 'object') {
            // Ensure we have a consistent structure, even if some fields are missing
            const questionData = data.data;
            return {
              id: questionData._id || questionData.id,
              content: questionData.content || questionData.question || questionData.text || '',
              metadata: questionData.metadata || {},
              detailedAnswer: questionData.detailedAnswer || '',
              modalAnswer: questionData.modalAnswer || '',
              languageMode: questionData.languageMode || 'english'
              // Add other fields if necessary
            };
          }
          console.warn(`Failed to fetch valid data for question ${questionId}. Response:`, data);
          return null;
        } catch (error) {
          console.error(`Error fetching question ${questionId}:`, error);
          return null;
        }
      });

      const questionsData = await Promise.all(questionsPromises);
      console.log('Raw questions data after fetching all:', questionsData);
      
      const validQuestions = questionsData.filter(q => q !== null);
      console.log('Valid questions after filtering nulls:', validQuestions);
      
      if (validQuestions.length > 0) {
        // We already formatted the data in the map above, just update the state
        console.log('Questions ready to be displayed:', validQuestions);
        // Log the content of the first transformed question to verify
        if (validQuestions.length > 0) {
          console.log('Content of first transformed question:', validQuestions[0].content);
        }
        setSets(prevSets => 
          prevSets.map(s => 
            s.id === setId 
              ? { ...s, questions: validQuestions }
              : s
          )
        );
      } else {
        console.log('No valid questions found after fetching');
        setSets(prevSets => 
          prevSets.map(s => 
            s.id === setId 
              ? { ...s, questions: [] }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error in fetchQuestionsForSet:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSetClick = (setId) => {
    if (expandedSet === setId) {
      setExpandedSet(null);
    } else {
      setExpandedSet(setId);
      const set = sets.find(s => s.id === setId);
      if (set && (!set.questions || set.questions.length === 0)) {
        fetchQuestionsForSet(setId);
      }
    }
  };

  const handlePrintClick = () => {
    setShowPrintModal(true);
    fetchSetsForPrint();
  };

  const toggleQuestionSelection = (setId, questionId) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };
      if (!newSelection[setId]) {
        newSelection[setId] = [];
      }
      
      const questionIndex = newSelection[setId].indexOf(questionId);
      if (questionIndex === -1) {
        newSelection[setId].push(questionId);
      } else {
        newSelection[setId].splice(questionIndex, 1);
      }
      
      if (newSelection[setId].length === 0) {
        delete newSelection[setId];
      }
      
      return newSelection;
    });
  };

  const handlePrintSelected = () => {
    // Get all selected questions
    const selectedQuestionsList = [];
    Object.entries(selectedQuestions).forEach(([setId, questionIds]) => {
      const set = sets.find(s => s.id === setId);
      if (set) {
        questionIds.forEach(questionId => {
          const question = set.questions.find(q => q.id === questionId);
          if (question) {
            selectedQuestionsList.push({
              ...question,
              setName: set.name
            });
          }
        });
      }
    });

    if (selectedQuestionsList.length === 0) {
      toast.error('Please select at least one question to print');
      return;
    }

    // Create print content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Selected Questions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .question { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .set-name { color: #4F46E5; font-weight: bold; margin-bottom: 10px; }
            .metadata { margin: 10px 0; color: #666; }
            .metadata span { margin-right: 20px; }
            .content { margin: 15px 0; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          ${selectedQuestionsList.map(q => `
            <div class="question">
              <div class="set-name">Set: ${q.setName}</div>
              <div class="metadata">
                <span>Type: ${q.metadata?.questionType || 'Question'}</span>
                <span>Difficulty: ${q.metadata?.difficultyLevel || 'Medium'}</span>
                <span>Marks: ${q.metadata?.marks || '1'}</span>
                <span>Time: ${q.metadata?.timeLimit || 'N/A'} min</span>
              </div>
              <div class="content">${q.content}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
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
            onClick={handlePrintClick}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} className="mr-2" />
            <span>Print</span>
          </button>
        </div>

        <AISWBTab topicId={topicId} />
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Select Questions to Print</h2>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {loadingSets ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {sets.map(set => (
                  <div key={set.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleSetClick(set.id)}
                      className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{set.name}</h3>
                      <span className="text-gray-500">
                        {expandedSet === set.id ? '▼' : '▶'}
                      </span>
                    </button>
                    
                    {expandedSet === set.id && (
                      <div className="p-4 border-t border-gray-200">
                        {loadingQuestions ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : set.questions && set.questions.length > 0 ? (
                          <div className="space-y-3">
                            {set.questions.map((question, index) => (
                              <div
                                key={`${set.id}-${question.id}-${index}`}
                                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <button
                                  onClick={() => toggleQuestionSelection(set.id, question.id)}
                                  className={`mt-1 p-1 rounded-full ${
                                    selectedQuestions[set.id]?.includes(question.id)
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white border border-gray-300 text-gray-400'
                                  }`}
                                >
                                  <Check size={16} />
                                </button>
                                <div className="flex-1">
                                  <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: question.content }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4">No questions in this set</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrintSelected}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Download size={18} className="mr-2" />
                <span>Print Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISWBPage; 