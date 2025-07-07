import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, MoreVertical, X, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

// Helper to preserve extra spaces in options
function preserveExtraSpaces(text) {
  return text.replace(/ {2,}/g, (match) => ' ' + '&nbsp;'.repeat(match.length - 1));
}

const ObjectiveQuestionManagement = ({ selectedSet }) => {
  const [questions, setQuestions] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  const getLocalStorageKey = useCallback(() => {
    return `objective_questions_${selectedSet.id}`;
  }, [selectedSet]);

  useEffect(() => {
    if (selectedSet) {
      try {
        const storedQuestions = localStorage.getItem(getLocalStorageKey());
        if (storedQuestions) {
          setQuestions(JSON.parse(storedQuestions));
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching questions from local storage:', error);
        toast.error('Failed to load questions.');
        setQuestions([]);
      }
    } else {
      setQuestions([]);
      setIsFormModalOpen(false);
      setIsEditModalOpen(false);
    }
  }, [selectedSet, getLocalStorageKey]);

  const saveQuestionsToLocalStorage = (updatedQuestions) => {
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error('Error saving questions to local storage:', error);
      toast.error('Failed to save questions.');
    }
  };

  const handleAddNewQuestions = (newQuestions) => {
    setQuestions(prevQuestions => {
      const questionsWithIds = newQuestions.map((q, i) => ({ ...q, id: `q_${Date.now()}_${i}` }));
      const updatedQuestions = [...prevQuestions, ...questionsWithIds];
      saveQuestionsToLocalStorage(updatedQuestions);
      return updatedQuestions;
    });
  };
  
  const handleUpdateQuestion = (updatedQuestion) => {
    const updatedQuestions = questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
    setQuestions(updatedQuestions);
    saveQuestionsToLocalStorage(updatedQuestions);
    toast.success('Question updated successfully');
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(updatedQuestions);
      saveQuestionsToLocalStorage(updatedQuestions);
      toast.success('Question deleted successfully');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  if (!selectedSet) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-full">
        <p className="text-gray-500 text-lg">Select a set to manage its questions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Questions for: <span className='text-blue-600'>{selectedSet.name}</span></h2>
        <button 
            onClick={() => setIsFormModalOpen(true)} 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Questions</span>
        </button>
      </div>

      {isFormModalOpen && (
        <AddQuestionModal 
            onAddQuestions={handleAddNewQuestions} 
            onClose={() => setIsFormModalOpen(false)}
        />
      )}

      {isEditModalOpen && editingQuestion && (
        <EditQuestionModal 
            question={editingQuestion}
            onUpdateQuestion={handleUpdateQuestion} 
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingQuestion(null);
            }}
        />
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Existing Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <p className="text-gray-500">No questions added yet.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <QuestionItem 
                key={q.id} 
                question={q} 
                index={index}
                onDelete={handleDeleteQuestion}
                onEdit={handleEditQuestion}
                onView={setViewingQuestion}
              />
            ))}
          </div>
        )}
      </div>
      {viewingQuestion && (
        <QuestionViewModal question={viewingQuestion} onClose={() => setViewingQuestion(null)} />
      )}
    </div>
  );
};

const AddQuestionModal = ({ onAddQuestions, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                 <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">Add New Questions</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full">
                        <X size={24} />
                    </button>
                 </div>
                 <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <MultiQuestionForm 
                        onAddQuestions={onAddQuestions} 
                        onSubmitted={onClose}
                    />
                 </div>
            </div>
        </div>
    );
};

const EditQuestionModal = ({ question, onUpdateQuestion, onClose }) => {
    const [editedQuestion, setEditedQuestion] = useState(question);

    const handleFieldChange = (field, value) => {
        if (field.startsWith('option-')) {
            const optionIndex = parseInt(field.split('-')[1], 10);
            const newOptions = [...editedQuestion.options];
            newOptions[optionIndex] = value;
            setEditedQuestion({...editedQuestion, options: newOptions});
        } else {
            setEditedQuestion({...editedQuestion, [field]: value});
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!editedQuestion.question.trim() || editedQuestion.options.some(opt => !opt.trim())) {
            toast.error('Please fill out the question and all four options.');
            return;
        }
        onUpdateQuestion(editedQuestion);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">Edit Question</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-4 border rounded-md bg-white shadow-sm">
                            <h4 className="font-semibold text-lg mb-4">Question Details</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                    <textarea 
                                        value={editedQuestion.question} 
                                        onChange={e => handleFieldChange('question', e.target.value)} 
                                        placeholder="Enter the question text" 
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                    {editedQuestion.options.map((opt, i) => (
                                        <div key={i} className="flex items-center space-x-3 mb-3">
                                            <input 
                                                type="text" 
                                                value={opt} 
                                                onChange={e => handleFieldChange(`option-${i}`, e.target.value)} 
                                                placeholder={`Option ${i + 1}`} 
                                                className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                required 
                                            />
                                            <input 
                                                type="radio" 
                                                name="correctAnswer" 
                                                checked={editedQuestion.correctAnswer === i} 
                                                onChange={() => handleFieldChange('correctAnswer', i)} 
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                                    <input 
                                        type="url" 
                                        value={editedQuestion.videoUrl} 
                                        onChange={e => handleFieldChange('videoUrl', e.target.value)} 
                                        placeholder="https://www.youtube.com/watch?v=..." 
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                                    <textarea 
                                        value={editedQuestion.explanation} 
                                        onChange={e => handleFieldChange('explanation', e.target.value)} 
                                        placeholder="Provide a detailed explanation for the correct answer" 
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                    <input 
                                        type="text" 
                                        value={editedQuestion.tags} 
                                        onChange={e => handleFieldChange('tags', e.target.value)} 
                                        placeholder="Enter tags separated by commas (e.g., physics, mechanics, force)" 
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Marks</label>
                                        <input 
                                            type="number" 
                                            value={editedQuestion.maxMarks} 
                                            onChange={e => handleFieldChange('maxMarks', e.target.value)} 
                                            placeholder="10" 
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (seconds)</label>
                                        <input 
                                            type="number" 
                                            value={editedQuestion.estimatedTime} 
                                            onChange={e => handleFieldChange('estimatedTime', e.target.value)} 
                                            placeholder="120" 
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Negative Marks</label>
                                        <input 
                                            type="number" 
                                            value={editedQuestion.negativeMarks} 
                                            onChange={e => handleFieldChange('negativeMarks', e.target.value)} 
                                            placeholder="0" 
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                 </div>
            </div>
        </div>
    );
};

const MultiQuestionForm = ({ onAddQuestions, onSubmitted }) => {
    const initialQuestionState = {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        videoUrl: '',
        explanation: '',
        tags: '',
        maxMarks: '',
        estimatedTime: '',
        negativeMarks: ''
    };

    const [questionForms, setQuestionForms] = useState([initialQuestionState]);

    const handleFormChange = (index, field, value) => {
        const newForms = [...questionForms];
        if (field.startsWith('option-')) {
            const optionIndex = parseInt(field.split('-')[1], 10);
            newForms[index].options[optionIndex] = value;
        } else {
            newForms[index][field] = value;
        }
        setQuestionForms(newForms);
    };

    const addQuestionForm = () => {
        setQuestionForms([...questionForms, {...initialQuestionState}]);
    };

    const removeQuestionForm = (index) => {
        const newForms = questionForms.filter((_, i) => i !== index);
        setQuestionForms(newForms);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let isValid = true;
        for (const form of questionForms) {
            if (!form.question.trim() || form.options.some(opt => !opt.trim())) {
                toast.error('Please fill out the question and all four options for each question.');
                isValid = false;
                break;
            }
        }
        if(isValid) {
            onAddQuestions(questionForms);
            toast.success(`${questionForms.length} question(s) submitted successfully!`);
            if (onSubmitted) {
                onSubmitted();
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {questionForms.map((form, index) => (
                <div key={index} className="p-4 border rounded-md relative bg-white shadow-sm">
                    <h4 className="font-semibold text-lg mb-4">Question {index + 1}</h4>
                    {questionForms.length > 1 && (
                        <button type="button" onClick={() => removeQuestionForm(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full">
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                            <textarea 
                                value={form.question} 
                                onChange={e => handleFormChange(index, 'question', e.target.value)} 
                                placeholder="Enter the question text" 
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                        {form.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-3 mb-3">
                                    <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => handleFormChange(index, `option-${i}`, e.target.value)} 
                                        placeholder={`Option ${i + 1}`} 
                                        className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        required 
                                    />
                                    <input 
                                        type="radio" 
                                        name={`correctAnswer-${index}`} 
                                        checked={form.correctAnswer === i} 
                                        onChange={() => handleFormChange(index, 'correctAnswer', i)} 
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                            <input 
                                type="url" 
                                value={form.videoUrl} 
                                onChange={e => handleFormChange(index, 'videoUrl', e.target.value)} 
                                placeholder="https://www.youtube.com/watch?v=..." 
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                            <textarea 
                                value={form.explanation} 
                                onChange={e => handleFormChange(index, 'explanation', e.target.value)} 
                                placeholder="Provide a detailed explanation for the correct answer" 
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <input 
                                type="text" 
                                value={form.tags} 
                                onChange={e => handleFormChange(index, 'tags', e.target.value)} 
                                placeholder="Enter tags separated by commas (e.g., physics, mechanics, force)" 
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Marks</label>
                                <input 
                                    type="number" 
                                    value={form.maxMarks} 
                                    onChange={e => handleFormChange(index, 'maxMarks', e.target.value)} 
                                    placeholder="10" 
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (seconds)</label>
                                <input 
                                    type="number" 
                                    value={form.estimatedTime} 
                                    onChange={e => handleFormChange(index, 'estimatedTime', e.target.value)} 
                                    placeholder="120" 
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Negative Marks</label>
                                <input 
                                    type="number" 
                                    value={form.negativeMarks} 
                                    onChange={e => handleFormChange(index, 'negativeMarks', e.target.value)} 
                                    placeholder="0" 
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex justify-between items-center pt-6 border-t mt-6">
                <button type="button" onClick={addQuestionForm} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                    <Plus size={16} className="mr-2" /> Add Another Question
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit Questions</button>
            </div>
        </form>
    );
};

const QuestionItem = ({ question, index, onDelete, onEdit, onView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
                <div className="flex-grow cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className='flex items-center'>
                         <ChevronRight size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                         <p className="font-semibold ml-2">{index + 1}. {question.question}</p>
                    </div>
                </div>
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <MoreVertical size={16} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border" onMouseLeave={() => setIsMenuOpen(false)}>
                            <ul className="py-1">
                                <li>
                                    <button onClick={() => { onView(question); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                        View
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => { onEdit(question); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                        <Edit2 size={14} className="mr-2" /> Edit
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => { onDelete(question.id); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                        <Trash2 size={14} className="mr-2" /> Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            {isExpanded && (
                <div className="ml-4 mt-2 pl-6 space-y-1 text-sm border-l-2 border-gray-200">
                    {question.options.map((opt, i) => (
                        <p
                          key={i}
                          className={`p-1 rounded ${i === question.correctAnswer ? 'text-green-800 bg-green-100 font-medium' : 'text-gray-700'}`}
                          style={{ whiteSpace: 'normal' }}
                          dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65 + i)}. ${preserveExtraSpaces(opt)}` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const QuestionViewModal = ({ question, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{question.question}</h3>
                
                <div className="space-y-2 mb-4">
                    <h4 className='font-semibold'>Options:</h4>
                    {question.options.map((opt, i) => (
                        <p
                          key={i}
                          className={`p-2 rounded ${i === question.correctAnswer ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100'}`}
                          style={{ whiteSpace: 'normal' }}
                          dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65 + i)}. ${preserveExtraSpaces(opt)}` }}
                        />
                    ))}
                </div>

                {question.explanation && (
                    <div className="mb-4">
                        <h4 className='font-semibold'>Explanation:</h4>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded">{question.explanation}</p>
                    </div>
                )}
                
                {question.videoUrl && (
                    <div className="mb-4">
                        <h4 className='font-semibold'>Video URL:</h4>
                        <a href={question.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{question.videoUrl}</a>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    {question.tags && <div><h4 className='font-semibold'>Tags:</h4> <p>{question.tags}</p></div>}
                    {question.maxMarks && <div><h4 className='font-semibold'>Max Marks:</h4> <p>{question.maxMarks}</p></div>}
                    {question.estimatedTime && <div><h4 className='font-semibold'>Est. Time (s):</h4> <p>{question.estimatedTime}</p></div>}
                    {question.negativeMarks && <div><h4 className='font-semibold'>Negative Marks:</h4> <p>{question.negativeMarks}</p></div>}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ObjectiveQuestionManagement;
