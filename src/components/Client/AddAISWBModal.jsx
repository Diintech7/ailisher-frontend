import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { toast } from 'react-toastify';
import GeminiModal from '../GeminiModal';
import Cookies from 'js-cookie';

const AddAISWBModal = ({ isOpen, onClose, onAddQuestion, onEditQuestion, editingQuestion }) => {
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
    answerVideoUrl: '',
    evaluationMode: 'manual'
  };

  const [questions, setQuestions] = useState([initialQuestionState]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedBody, setExpandedBody] = useState({});
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [currentGenerationType, setCurrentGenerationType] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);

  useEffect(() => {
    if (editingQuestion) {
      // Pre-fill the form with editing question data
      const formattedQuestion = {
        ...editingQuestion,
        metadata: {
          ...editingQuestion.metadata,
          keywords: Array.isArray(editingQuestion.metadata.keywords) 
            ? editingQuestion.metadata.keywords.join(', ')
            : editingQuestion.metadata.keywords,
          qualityParameters: {
            ...editingQuestion.metadata.qualityParameters,
            customParams: editingQuestion.metadata.qualityParameters.customParams || []
          }
        },
        // Convert answerVideoUrls array to comma-separated string for the form
        answerVideoUrl: Array.isArray(editingQuestion.answerVideoUrls) 
          ? editingQuestion.answerVideoUrls.join(', ')
          : editingQuestion.answerVideoUrls || ''
      };
      setQuestions([formattedQuestion]);
    } else {
      setQuestions([initialQuestionState]);
    }
  }, [editingQuestion]);

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

    try {
      console.log('Original questions data:', questions);

      const questionsData = questions.map(q => {
        // Process answerVideoUrls to get valid YouTube URLs
        let videoUrls = [];
        if (typeof q.answerVideoUrl === 'string') {
          videoUrls = q.answerVideoUrl.split(',')
            .map(url => url.trim())
            .filter(url => url.includes('youtube.com/watch?v='));
        } else if (Array.isArray(q.answerVideoUrl)) {
          videoUrls = q.answerVideoUrl.filter(url => url.includes('youtube.com/watch?v='));
        }

        // Create a new object without answerVideoUrl
        const { answerVideoUrl, ...rest } = q;

        const processedData = {
          ...rest,
          metadata: {
            keywords: q.metadata.keywords.split(',').map(k => k.trim()).filter(k => k),
            difficultyLevel: q.metadata.difficultyLevel,
            wordLimit: parseInt(q.metadata.wordLimit) || 0,
            estimatedTime: parseInt(q.metadata.estimatedTime) || 0,
            maximumMarks: parseInt(q.metadata.maximumMarks) || 0,
            qualityParameters: {
              intro: q.metadata.qualityParameters.intro,
              body: {
                enabled: q.metadata.qualityParameters.body.enabled,
                features: q.metadata.qualityParameters.body.features,
                examples: q.metadata.qualityParameters.body.examples,
                facts: q.metadata.qualityParameters.body.facts,
                diagram: q.metadata.qualityParameters.body.diagram
              },
              conclusion: q.metadata.qualityParameters.conclusion,
              customParams: q.metadata.qualityParameters.customParams.filter(param => param.trim())
            }
          },
          languageMode: q.languageMode,
          answerVideoUrls: videoUrls  // Only sending answerVideoUrls
        };
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
        console.log('Updating question with data:', updatedQuestion);
        const result = await onEditQuestion(updatedQuestion);
        if (result) {
          toast.success('Question updated successfully!');
          onClose();
        }
      } else {
        // Add new questions
        let allSuccess = true;
        for (const question of questionsData) {
          console.log('Sending question to API:', question);
          const result = await onAddQuestion(question);
          console.log('API response for question:', result);
          if (!result) {
            allSuccess = false;
            break;
          }
        }
        
        if (allSuccess) {
          toast.success('Questions added successfully!');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      setError('Failed to save questions. Please try again.');
      toast.error('Failed to save questions. Please try again.');
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
                    value={question.metadata.wordLimit}
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
                    value={question.metadata.maximumMarks}
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
                    <option value="both">Both</option>
                  </select>
                </div>

                {/* Answer Video URL */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Video URLs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={question.answerVideoUrl}
                    onChange={(e) => handleQuestionChange(index, 'answerVideoUrl', e.target.value)}
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

export default AddAISWBModal; 
