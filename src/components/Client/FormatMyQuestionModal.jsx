import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronRight, Wand2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import GeminiModal from '../GeminiModal';
import Cookies from 'js-cookie';

const FormatMyQuestionModal = ({ isOpen, onClose, onAddQuestion, onEditQuestion, editingQuestion, onQuestions, scrollToSection }) => {
  const initialQuestionState = {
    question: '',
    detailedAnswer: '',
    metadata: {
      keywords: '',
      difficultyLevel: 'level1',
      wordLimit: '',
      estimatedTime: '',
      maximumMarks: '',
      qualityParameters: {
        intro: false,
        body: {
          enabled: false,
          features: false,
          examples: false,
          facts: false,
          diagram: false
        },
        conclusion: false,
        customParams: []
      }
    },
    modalAnswer: '',
    languageMode: 'english',
    answerVideoUrls: [],
    evaluationMode: 'auto',
    evaluationType:'',
    evaluationGuideline: '',
    // local-only: selected modal answer PDFs
    modalAnswerPdfFiles: []
  };

  const [questions, setQuestions] = useState([initialQuestionState]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedBody, setExpandedBody] = useState({});
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [currentGenerationType, setCurrentGenerationType] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [defaultFramework, setDefaultFramework] = useState('');
  const [existingPdfs, setExistingPdfs] = useState([]); // Track existing PDFs for editing
  const pdfSectionRef = React.useRef(null);

  
  // Fetch default evaluation framework from backend
  const fetchDefaultFramework = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('https://test.ailisher.com/api/aiswb/default-evaluation-framework', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const framework = data.data.defaultFramework || '';
          setDefaultFramework(framework);
          console.log(framework);
          // Only set the default framework if we're not editing
          if (!editingQuestion) {
            setQuestions(prevQuestions =>
              prevQuestions.map(q => ({
                ...q,
                evaluationGuideline: framework
              }))
            );
          }
          return framework;
        }
      } else {
        console.error('Failed to fetch default framework');
      }
    } catch (error) {
      console.error('Error fetching default framework:', error);
    }
    return '';
  };

  useEffect(() => {
    if (!isOpen) return;

    const prepareModal = async () => {
      if (editingQuestion) {
        const shouldUseDefault =
          !editingQuestion.evaluationGuideline ||
          !editingQuestion.evaluationGuideline.trim();
        const evaluationGuidelineValue = shouldUseDefault
          ? defaultFramework
          : editingQuestion.evaluationGuideline;

        const formattedQuestion = {
          ...editingQuestion,
          metadata: {
            ...editingQuestion.metadata,
            keywords: Array.isArray(editingQuestion.metadata.keywords)
              ? editingQuestion.metadata.keywords.join(', ')
              : editingQuestion.metadata.keywords,
            qualityParameters: {
              ...editingQuestion.metadata.qualityParameters,
              customParams:
                editingQuestion.metadata.qualityParameters.customParams || []
            }
          },
          // Keep answerVideoUrls as array, convert to comma-separated string for display
          answerVideoUrls: Array.isArray(editingQuestion.answerVideoUrls)
            ? editingQuestion.answerVideoUrls.join(', ')
            : editingQuestion.answerVideoUrls || '',

          evaluationType: editingQuestion.evaluationType || '',
          evaluationGuideline: evaluationGuidelineValue || ''
        };
        console.log('Editing question:', editingQuestion);
        // Populate the form with the editing question
        setQuestions([formattedQuestion]);

        if (shouldUseDefault && !defaultFramework) {
          const framework = await fetchDefaultFramework();
          if (framework) {
            setQuestions(prevQuestions =>
              prevQuestions.map((q, index) =>
                index === 0 ? { ...q, evaluationGuideline: framework } : q
              )
            );
          }
        }

        // Set existing PDFs for editing mode
        if (editingQuestion.modalAnswerPdfs && Array.isArray(editingQuestion.modalAnswerPdfs)) {
          setExistingPdfs(editingQuestion.modalAnswerPdfs.map(pdf => pdf.key));
        } else {
          setExistingPdfs([]);
        }
      } else {
        // For new questions, fetch default framework and set it
        await fetchDefaultFramework();
        setExistingPdfs([]);
      }

      if (scrollToSection === 'pdf') {
        setTimeout(() => {
          pdfSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 200);
      }
    };

    prepareModal();
  }, [isOpen, editingQuestion, scrollToSection, defaultFramework]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { ...initialQuestionState }]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field.startsWith('metadata.')) {
      const metadataField = field.split('.')[1];
      if (metadataField === 'qualityParameters') {
        const qpField = field.split('.')[2];
        if (qpField === 'body') {
          const bodyField = field.split('.')[3];
          if (bodyField === 'enabled') {
            newQuestions[index].metadata.qualityParameters.body.enabled = value;
          } else {
            newQuestions[index].metadata.qualityParameters.body[bodyField] = value;
          }
        } else {
          newQuestions[index].metadata.qualityParameters[qpField] = value;
        }
      } else {
        newQuestions[index].metadata[metadataField] = value;
      }
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handlePdfFilesChange = (index, files) => {
    const newQuestions = [...questions];
    const incoming = Array.from(files || []).filter(f => f && f.type === 'application/pdf');
    const existing = Array.isArray(newQuestions[index].modalAnswerPdfFiles) ? newQuestions[index].modalAnswerPdfFiles : [];
    newQuestions[index].modalAnswerPdfFiles = [...existing, ...incoming];
    setQuestions(newQuestions);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (!e.dataTransfer?.files) return;
    handlePdfFilesChange(index, e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemovePdfAt = (qIndex, fileIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].modalAnswerPdfFiles.splice(fileIndex, 1);
    setQuestions(newQuestions);
  };

  const handleDeleteExistingPdf = async (pdfKey) => {
    try {
      const token = Cookies.get('usertoken');
      const response = await fetch(`https://test.ailisher.com/api/aiswb/questions/${editingQuestion.id}/pdf/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: pdfKey })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from existing PDFs state
          setExistingPdfs(prev => prev.filter(key => key !== pdfKey));
          toast.success('PDF deleted successfully!');
        } else {
          toast.error(data.message || 'Failed to delete PDF');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete PDF');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error('Failed to delete PDF');
    }
  };

  const handleAddCustomQP = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].metadata.qualityParameters.customParams.push('');
    setQuestions(newQuestions);
  };

  const handleRemoveCustomQP = (questionIndex, qpIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].metadata.qualityParameters.customParams.splice(qpIndex, 1);
    setQuestions(newQuestions);
  };

  const handleCustomQPChange = (questionIndex, qpIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].metadata.qualityParameters.customParams[qpIndex] = value;
    setQuestions(newQuestions);
  };

  const handleGenerateDetailedAnswer = async (index) => {
    const question = questions[index].question;
    if (!question.trim()) {
      toast.error('Please enter a question first');
      return;
    }
    setCurrentQuestionIndex(index);
    setCurrentGenerationType('detailedAnswer');
    setShowGeminiModal(true);
  };

  const handleGenerateModalAnswer = async (index) => {
    const question = questions[index].question;
    if (!question.trim()) {
      toast.error('Please enter a question first');
      return;
    }
    setCurrentQuestionIndex(index);
    setCurrentGenerationType('modalAnswer');
    setShowGeminiModal(true);
  };

  const handleGenerateKeywords = async (index) => {
    const question = questions[index].question;
    if (!question.trim()) {
      toast.error('Please enter a question first');
      return;
    }
    setCurrentQuestionIndex(index);
    setCurrentGenerationType('keywords');
    setShowGeminiModal(true);
  };

  const handleGeminiResponse = (response) => {
    if (currentQuestionIndex !== null && currentGenerationType) {
      const newQuestions = [...questions];
      
      // Clean and format the response
      let cleanResponse = response
        .replace(/^Here's the (detailed|modal) answer:\s*/i, '')
        .replace(/^Answer:\s*/i, '')
        .replace(/^Generated (detailed|modal) answer:\s*/i, '')
        .replace(/^Here's the answer:\s*/i, '')
        .replace(/^Here's the generated answer:\s*/i, '')
        .replace(/^(Here's|Generated|Here is|Here are).*?:\s*/i, '')
        .replace(/^Answer(s)?:\s*/i, '')
        .replace(/^The answer is:\s*/i, '')
        .replace(/^(Based on|According to).*?:\s*/i, '')
        .replace(/^(Let me|I'll).*?:\s*/i, '')
        .replace(/^Here's a(n)?\s*/i, '')
        .replace(/^(I have|I've).*?:\s*/i, '')
        .replace(/^(The following|Below is).*?:\s*/i, '')
        .replace(/^(As an AI|As a language model).*?:\s*/i, '')
        .trim();

      if (currentGenerationType === 'detailedAnswer') {
        newQuestions[currentQuestionIndex].detailedAnswer = cleanResponse;
      } else if (currentGenerationType === 'modalAnswer') {
        newQuestions[currentQuestionIndex].modalAnswer = cleanResponse;
      } else if (currentGenerationType === 'keywords') {
        const cleanKeywords = cleanResponse
          .split(',')
          .map(k => k.trim())
          .filter(k => k)
          .join(', ');
        newQuestions[currentQuestionIndex].metadata.keywords = cleanKeywords;
      }
      
      setQuestions(newQuestions);
      toast.success(`${currentGenerationType === 'detailedAnswer' ? 'Detailed' : currentGenerationType === 'modalAnswer' ? 'Modal' : 'Keywords'} generated successfully!`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation: Ensure evaluationType is selected if evaluationMode is manual
    for (const q of questions) {
      if (q.evaluationMode === 'manual' && !q.evaluationType) {
        setError('Please select an evaluation type for manual evaluation mode.');
        toast.error('Please select an evaluation type for manual evaluation mode.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      console.log('Original questions data:', questions);

      const questionsData = questions.map((q, index) => {
        let videoUrls = [];
        if (typeof q.answerVideoUrls === 'string') {
          videoUrls = q.answerVideoUrls.split(',').map(url => url.trim()).filter(url => url);
        } else if (Array.isArray(q.answerVideoUrls)) {
          videoUrls = q.answerVideoUrls.map(url => url && url.trim()).filter(url => url);
        }

        // Create a new object without answerVideoUrls and evaluationType
        const { answerVideoUrls, evaluationType, ...rest } = q;

        // Create base data object
        const processedData = {
          ...rest,
          metadata: {
            keywords: (q.metadata?.keywords || '').split(',').map(k => k.trim()).filter(k => k),
            difficultyLevel: q.metadata?.difficultyLevel || 'level1',
            wordLimit: parseInt(q.metadata?.wordLimit || q.wordLimit || 0) || 0,
            estimatedTime: parseInt(q.metadata?.estimatedTime || 0) || 0,
            maximumMarks: parseInt(q.metadata?.maximumMarks || q.maximumMarks || 0) || 0,
            qualityParameters: {
              intro: q.metadata?.qualityParameters?.intro || false,
              body: {
                enabled: q.metadata?.qualityParameters?.body?.enabled || false,
                features: q.metadata?.qualityParameters?.body?.features || false,
                examples: q.metadata?.qualityParameters?.body?.examples || false,
                facts: q.metadata?.qualityParameters?.body?.facts || false,
                diagram: q.metadata?.qualityParameters?.body?.diagram || false
              },
              conclusion: q.metadata?.qualityParameters?.conclusion || false,
              customParams: (q.metadata?.qualityParameters?.customParams || []).filter(param => param.trim())
            }
          },
          languageMode: q.languageMode || 'english',
          evaluationMode: q.evaluationMode || 'auto',
          evaluationGuideline: q.evaluationGuideline && q.evaluationGuideline.trim() ? q.evaluationGuideline.trim() : undefined,
          answerVideoUrls: videoUrls
        };

        // Only add evaluationType if evaluationMode is 'manual' and evaluationType has a valid value
        if (q.evaluationMode === 'manual' && evaluationType && evaluationType.trim()) {
          processedData.evaluationType = evaluationType;
        }
        
        console.log('Processed question data:', processedData);
        return processedData;
      });

      console.log('Final questions data to be sent:', questionsData);

      if (editingQuestion) {
        // Update existing question
        const updatedQuestion = {
          ...questionsData[0],
          id: editingQuestion.id
        };
        console.log('Modal: Updating question with data:', updatedQuestion);
        console.log('Modal: Question ID being updated:', editingQuestion.id);
        const result = await onEditQuestion(updatedQuestion);
        console.log('Modal: Update result from onEditQuestion:', result);
        if (result) {
          // Upload and attach new PDFs if any
          const pdfFiles = questions[0]?.modalAnswerPdfFiles || [];
          if (Array.isArray(pdfFiles) && pdfFiles.length > 0) {
            const token = Cookies.get('usertoken');
            for (const file of pdfFiles) {
              try {
                // 1) Get presigned URL
                const presignRes = await fetch(`https://test.ailisher.com/api/aiswb/questions/${editingQuestion.id}/pdf/presign`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ fileName: file.name, contentType: 'application/pdf' })
                });
                const presignData = await presignRes.json();
                if (!presignRes.ok || !presignData.success) {
                  throw new Error(presignData.message || 'Failed to get presigned URL');
                }

                const { uploadUrl, key } = presignData.data || {};
                if (!uploadUrl || !key) {
                  throw new Error('Invalid presign response');
                }

                // 2) Upload to S3
                const putRes = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/pdf' },
                  body: file
                });
                if (!putRes.ok) {
                  const errText = await putRes.text().catch(() => '');
                  throw new Error(`S3 upload failed: ${putRes.status} ${errText}`);
                }

                // 3) Attach key to question
                const attachRes = await fetch(`https://test.ailisher.com/api/aiswb/questions/${editingQuestion.id}/pdf/attach`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ key })
                });
                const attachData = await attachRes.json();
                if (!attachRes.ok || !attachData.success) {
                  throw new Error(attachData.message || 'Failed to attach PDF');
                }
              } catch (err) {
                console.error('PDF upload/attach error:', err);
                toast.error(`Failed to upload PDF ${file.name}: ${err.message}`);
              }
            }
          }
          
          console.log('Modal: Question update successful!');
          toast.success('Question updated successfully!');
          onClose();
          onQuestions();
        } else {
          console.error('Modal: Question update failed!');
        }
      } else {
        // Add new questions
        let allSuccess = true;
        for (let qIndex = 0; qIndex < questionsData.length; qIndex++) {
          const question = questionsData[qIndex];
          console.log('Sending question to API:', question);
          const createdId = await onAddQuestion(question);
          console.log('Created question id:', createdId);
          if (!createdId) {
            allSuccess = false;
            break;
          }

          // Upload and attach PDFs if any
          const pdfFiles = questions[qIndex]?.modalAnswerPdfFiles || [];
          if (Array.isArray(pdfFiles) && pdfFiles.length > 0) {
            const token = Cookies.get('usertoken');
            for (const file of pdfFiles) {
              try {
                // 1) Get presigned URL
                const presignRes = await fetch(`https://test.ailisher.com/api/aiswb/questions/${createdId}/pdf/presign`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ fileName: file.name, contentType: 'application/pdf' })
                });
                const presignData = await presignRes.json();
                if (!presignRes.ok || !presignData.success) {
                  throw new Error(presignData.message || 'Failed to get presigned URL');
                }

                const { uploadUrl, key } = presignData.data || {};
                if (!uploadUrl || !key) {
                  throw new Error('Invalid presign response');
                }

                // 2) Upload to S3
                const putRes = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/pdf' },
                  body: file
                });
                if (!putRes.ok) {
                  const errText = await putRes.text().catch(() => '');
                  throw new Error(`S3 upload failed: ${putRes.status} ${errText}`);
                }

                // 3) Attach key to question
                const attachRes = await fetch(`https://test.ailisher.com/api/aiswb/questions/${createdId}/pdf/attach`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ key })
                });
                const attachData = await attachRes.json();
                if (!attachRes.ok || !attachData.success) {
                  throw new Error(attachData.message || 'Failed to attach PDF');
                }
              } catch (err) {
                console.error('PDF upload/attach error:', err);
                toast.error(`Failed to upload PDF ${file.name}: ${err.message}`);
                allSuccess = false;
                break;
              }
            }
            if (!allSuccess) break;
          }
        }
        
        if (allSuccess) {
          toast.success('Questions added successfully!');
          onClose();
          onQuestions();
        }
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      
      // Handle specific error types
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        setError('Server error occurred. Please try again later.');
        toast.error('Server error occurred. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Authentication failed. Please login again.');
        toast.error('Authentication failed. Please login again.');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        setError('You do not have permission to perform this action.');
        toast.error('You do not have permission to perform this action.');
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        setError('Resource not found. Please check your input.');
        toast.error('Resource not found. Please check your input.');
      } else {
        setError('Failed to save questions. Please try again.');
        toast.error('Failed to save questions. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingQuestion ? 'Edit Question' : 'Add New Questions'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {editingQuestion ? 'Edit Question' : `Question ${index + 1}`}
                </h3>
                {!editingQuestion && questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Question Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap"
                  rows={3}
                  required
                />
              </div>

              {/* Detailed Answer Field */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Detailed Answer
                  </label>
                  {question.question.trim() && (
                    <button
                      type="button"
                      onClick={() => handleGenerateDetailedAnswer(index)}
                      className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Wand2 size={14} className="mr-1" />
                      <span>Generate</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={question.detailedAnswer}
                  onChange={(e) => handleQuestionChange(index, 'detailedAnswer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap font-mono"
                  rows={5}
                  required
                />
              </div>

              {/* Metadata Section */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Metadata</h3>
                
                {/* Keywords */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Keywords (comma-separated)
                    </label>
                    {question.question.trim() && (
                      <button
                        type="button"
                        onClick={() => handleGenerateKeywords(index)}
                        className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Wand2 size={14} className="mr-1" />
                        <span>Generate</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={question.metadata.keywords}
                    onChange={(e) => handleQuestionChange(index, 'metadata.keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., physics, mechanics, force"
                  />
                </div>

                {/* Difficulty Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={question.metadata.difficultyLevel}
                    onChange={(e) => handleQuestionChange(index, 'metadata.difficultyLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="level1">Level 1</option>
                    <option value="level2">Level 2</option>
                    <option value="level3">Level 3</option>
                  </select>
                </div>

                {/* Word Limit */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word Limit
                  </label>
                  <input
                    type="number"
                    value={question.metadata.wordLimit || question.wordLimit}
                    onChange={(e) => handleQuestionChange(index, 'metadata.wordLimit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>

                {/* Estimated Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={question.metadata.estimatedTime}
                    onChange={(e) => handleQuestionChange(index, 'metadata.estimatedTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>

                {/* Maximum Marks */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    value={question.metadata.maximumMarks || question.maximumMarks}
                    onChange={(e) => handleQuestionChange(index, 'metadata.maximumMarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>

                {/* Language Mode */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language Mode
                  </label>
                  <select
                    value={question.languageMode}
                    onChange={(e) => handleQuestionChange(index, 'languageMode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>

                {/* Answer Video URL */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Video URLs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={question.answerVideoUrls}
                    onChange={(e) => handleQuestionChange(index, 'answerVideoUrls', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter video URLs separated by commas"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter multiple URLs separated by commas (e.g., url1, url2, url3)
                  </p>
                </div>

                {/* Evaluation Mode */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Mode
                  </label>
                  <select
                    value={question.evaluationMode}
                    onChange={(e) => handleQuestionChange(index, 'evaluationMode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                {/* Evaluation Type (only for manual mode) */}
                {question.evaluationMode === 'manual' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Type
                    </label>
                    <select
                      value={question.evaluationType}
                      onChange={(e) => handleQuestionChange(index, 'evaluationType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Evaluation Type</option>
                      <option value="with annotation">With Annotation</option>
                      <option value="without annotation">Without Annotation</option>
                    </select>
                  </div>
                )}

                {/* Evaluation Guideline */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Evaluation Guideline
                    </label>
                    <button
                      type="button"
                      onClick={() => handleQuestionChange(index, 'evaluationGuideline', defaultFramework)}
                      className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    >
                      <span>Reset to Default</span>
                    </button>
                  </div>
                  <textarea
                    value={question.evaluationGuideline}
                    onChange={(e) => handleQuestionChange(index, 'evaluationGuideline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Enter custom evaluation criteria or modify the default framework above..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The default evaluation framework is shown above. You can modify it or enter your own custom criteria.
                  </p>
                </div>

                {/* Quality Parameters */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Parameters
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.metadata.qualityParameters.intro}
                        onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.intro', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Introduction</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.metadata.qualityParameters.body.enabled}
                        onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.body.enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Body</label>
                    </div>
                    
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.metadata.qualityParameters.body.features}
                          onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.body.features', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Features</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.metadata.qualityParameters.body.examples}
                          onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.body.examples', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Examples</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.metadata.qualityParameters.body.facts}
                          onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.body.facts', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Facts</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.metadata.qualityParameters.body.diagram}
                          onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.body.diagram', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Diagram</label>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.metadata.qualityParameters.conclusion}
                        onChange={(e) => handleQuestionChange(index, 'metadata.qualityParameters.conclusion', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Conclusion</label>
                    </div>
                  </div>
                </div>

                {/* Custom Quality Parameters */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Quality Parameters
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddCustomQP(index)}
                      className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Plus size={14} className="mr-1" />
                      <span>Add Parameter</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {question.metadata.qualityParameters.customParams.map((param, paramIndex) => (
                      <div key={paramIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={param}
                          onChange={(e) => handleCustomQPChange(index, paramIndex, e.target.value)}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Parameter name"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomQP(index, paramIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Answer Field */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Modal Answer
                  </label>
                  {question.question.trim() && (
                    <button
                      type="button"
                      onClick={() => handleGenerateModalAnswer(index)}
                      className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Wand2 size={14} className="mr-1" />
                      <span>Generate</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={question.modalAnswer}
                  onChange={(e) => handleQuestionChange(index, 'modalAnswer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Modal Answer PDFs */}
              <div ref={index === 0 ? pdfSectionRef : null} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modal Answer PDFs
                </label>
                
                {/* Existing PDFs (only show in editing mode) */}
                {editingQuestion && existingPdfs.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Existing PDFs:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {existingPdfs.map((pdfKey, pdfIdx) => (
                        <div key={pdfIdx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Upload size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-700 truncate max-w-[220px]">
                              {pdfKey.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Existing</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingPdf(pdfKey)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete PDF"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New PDF Upload Area */}
                <div
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {editingQuestion ? 'Add new PDFs or drag and drop here' : 'Drag and drop PDFs here, or click to select'}
                    </div>
                    <label className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                      Browse
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => handlePdfFilesChange(index, e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                {/* New PDF Files */}
                {Array.isArray(question.modalAnswerPdfFiles) && question.modalAnswerPdfFiles.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">New PDFs to upload:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {question.modalAnswerPdfFiles.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between bg-white border border-gray-200 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Upload size={14} className="text-gray-500" />
                            <span className="text-sm text-gray-700 truncate max-w-[220px]">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePdfAt(index, fIdx)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">You can attach multiple PDF files as model answers.</p>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              {!editingQuestion && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  <span>Add Another Question</span>
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  editingQuestion ? 'Update Question' : 'Add Questions'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showGeminiModal && (
        <GeminiModal
          isOpen={showGeminiModal}
          onClose={() => {
            setShowGeminiModal(false);
            setCurrentGenerationType(null);
            setCurrentQuestionIndex(null);
          }}
          onResponse={handleGeminiResponse}
          question={questions[currentQuestionIndex]?.question}
          detailedAnswer={questions[currentQuestionIndex]?.detailedAnswer}
          metadata={questions[currentQuestionIndex]?.metadata}
          qualityParams={questions[currentQuestionIndex]?.metadata?.qualityParameters}
          title={currentGenerationType === 'detailedAnswer' ? 'Generate Detailed Answer' : 
                 currentGenerationType === 'modalAnswer' ? 'Generate Modal Answer' : 
                 'Generate Keywords'}
        />
      )}
    </div>
  );
};

export default FormatMyQuestionModal; 
