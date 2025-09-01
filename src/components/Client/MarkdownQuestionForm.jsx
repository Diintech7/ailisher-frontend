import React from 'react';
import MarkdownEditor from './MarkdownEditor';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Cookies from "js-cookie";
import { API_BASE_URL } from '../../config';

const MarkdownQuestionForm = ({ 
  onBack, 
  questionBankId, 
  onQuestionsSaved,
  editingQuestion = null
}) => {
  const [formData, setFormData] = React.useState({
    question: editingQuestion?.question || "",
    options: editingQuestion?.options || ["", "", "", ""],
    correctAnswer: editingQuestion?.correctAnswer || editingQuestion?.correctOption || 0,
    difficulty: editingQuestion?.difficulty || "L1",
    estimatedTime: editingQuestion?.estimatedTime || 1,
    positiveMarks: editingQuestion?.positiveMarks || 1,
    negativeMarks: editingQuestion?.negativeMarks || 0.33,
    solution: editingQuestion?.solution || {
      type: "text",
      text: "",
      video: { url: "", title: "", description: "", duration: 0 },
      image: { url: "", caption: "" },
    },
  });

  const [showPreview, setShowPreview] = React.useState(true);

  // Update form data when editingQuestion changes
  React.useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question: editingQuestion.question || "",
        options: editingQuestion.options || ["", "", "", ""],
        correctAnswer: editingQuestion.correctAnswer || editingQuestion.correctOption || 0,
        difficulty: editingQuestion.difficulty || "L1",
        estimatedTime: editingQuestion.estimatedTime || 1,
        positiveMarks: editingQuestion.positiveMarks || 1,
        negativeMarks: editingQuestion.negativeMarks || 0.33,
        solution: editingQuestion.solution || {
          type: "text",
          text: "",
          video: { url: "", title: "", description: "", duration: 0 },
          image: { url: "", caption: "" },
        },
      });
    }
  }, [editingQuestion]);

  const handleSave = async () => {
    // Validate form data
    if (!formData.question.trim()) {
      alert("Please enter a question");
      return;
    }
    
    if (formData.options.some(option => !option.trim())) {
      alert("Please fill in all options");
      return;
    }

    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        alert("Authentication required");
        return;
      }

      const payload = {
        question: formData.question,
        options: formData.options,
        correctOption: formData.correctAnswer,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime,
        positiveMarks: formData.positiveMarks,
        negativeMarks: formData.negativeMarks,
        solution: formData.solution,
        questionBankId: questionBankId,
      };

      const url = editingQuestion 
        ? `${API_BASE_URL}/api/questionbank/${editingQuestion._id || editingQuestion.id}/question`
        : `${API_BASE_URL}/api/questionbank/${questionBankId}/question`;
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert(editingQuestion ? "Question updated successfully!" : "Question saved successfully!");
        onQuestionsSaved();
      } else {
        alert(result.message || `Failed to ${editingQuestion ? 'update' : 'save'} question`);
      }
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question");
    }
  };

  const renderMarkdownPreview = (text) => {
    // Simple markdown preview - you can enhance this with a proper markdown renderer
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-6 top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Questions
              </button>
              <div className="text-gray-400">|</div>
              <span className="text-sm text-gray-500">
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
                {editingQuestion ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-hide">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Question Details</h2>
            
      {/* Question Editor */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Question</h3>
      <MarkdownEditor
        value={formData.question}
                onChange={(value) => setFormData(prev => ({ ...prev, question: value }))}
        placeholder="Enter your question in markdown format..."
                label=""
      />
            </div>

      {/* Options Editor */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Options</h3>
      <div className="space-y-4">
                {formData.options.map((option, idx) => (
                      <>
                      <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option {String.fromCharCode(65 + idx)}
        </label>
                      <label className="inline-flex items-center gap-2 text-sm text-green-600 font-bold">
            <input
              type="radio"
              name="correctAnswer"
              value={idx}
              checked={formData.correctAnswer === idx}
                          onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: parseInt(e.target.value) }))}
                          className="text-green-600"
            />
                        Set as answer
                      </label>
                      </div>
            <MarkdownEditor
              value={option}
              onChange={(value) => {
                const newOptions = [...formData.options];
                newOptions[idx] = value;
                          setFormData(prev => ({ ...prev, options: newOptions }));
              }}
              placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                        label=""
            />
                      
                      </>
        ))}
              </div>
      </div>

      {/* Solution Editor */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Solution</h3>
        <MarkdownEditor
          value={formData.solution.text}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  solution: { ...prev.solution, text: value } 
                }))}
          placeholder="Enter solution or explanation in markdown format..."
                label=""
              />
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L1">Beginner (L1)</option>
                  <option value="L2">Intermediate (L2)</option>
                  <option value="L3">Advanced (L3)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time (mins)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Positive Marks
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={formData.positiveMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, positiveMarks: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negative Marks
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={formData.negativeMarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, negativeMarks: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Preview</h2>
            
            {showPreview ? (
              <div className="space-y-6">
                {/* Question Preview */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Question</h3>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(formData.question) }}
                  />
                </div>

                {/* Options Preview */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Options</h3>
                  <div className="space-y-3">
                    {formData.options.map((option, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border-2 transition-all ${
                          idx === formData.correctAnswer 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                            idx === formData.correctAnswer 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <div 
                            className="flex-1"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(option) }}
                          />
                          {idx === formData.correctAnswer && (
                            <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Solution Preview */}
                {formData.solution.text && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Solution</h3>
                    <div 
                      className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(formData.solution.text) }}
                    />
                  </div>
                )}

                {/* Metadata Preview */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Question Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Difficulty:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        formData.difficulty === 'L1' ? 'bg-green-100 text-green-800' :
                        formData.difficulty === 'L2' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formData.difficulty === 'L1' ? 'Beginner' :
                         formData.difficulty === 'L2' ? 'Intermediate' : 'Advanced'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Time:</span>
                      <span className="ml-2">{formData.estimatedTime} min</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Positive Marks:</span>
                      <span className="ml-2 text-green-600">+{formData.positiveMarks}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Negative Marks:</span>
                      <span className="ml-2 text-red-600">-{formData.negativeMarks}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Click "Show Preview" to see how your question will appear</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownQuestionForm;