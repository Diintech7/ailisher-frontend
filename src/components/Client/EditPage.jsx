import React, { useState } from 'react'
import MDEditor from '@uiw/react-md-editor'

const GeneratePage = ({ testData, onBack, initialQuestionForms }) => {
  const [questions, setQuestions] = useState([])
  const [questionForms, setQuestionForms] = useState(
    initialQuestionForms || [
    {
      id: Date.now(),
      questionText: '',
      options: ['', '', '', ''],
      solution: '',
      level: 'Easy',
      positiveMarks: 1,
      negativeMarks: 0
    }
    ]
  )

  const handleOptionChange = (formId, index, value) => {
    setQuestionForms(prev => prev.map(form => 
      form.id === formId 
        ? { ...form, options: form.options.map((opt, i) => i === index ? value : opt) }
        : form
    ))
  }

  const handleSubmitAllQuestions = () => {
    const validQuestions = questionForms.filter(form => 
      form.questionText.trim() && form.options.some(opt => opt.trim())
    )
    
    if (validQuestions.length > 0) {
      const newQuestions = validQuestions.map(form => ({
        ...form,
        id: Date.now() + Math.random()
      }))
      setQuestions(prev => [...prev, ...newQuestions])
      
      // Clear all forms after submission
      setQuestionForms([{
        id: Date.now(),
        questionText: '',
        options: ['', '', '', ''],
        solution: '',
        level: 'Easy',
        positiveMarks: 1,
        negativeMarks: 0
      }])
    }
  }

  const handleInputChange = (formId, e) => {
    const { name, value } = e.target
    setQuestionForms(prev => prev.map(form => 
      form.id === formId 
        ? { ...form, [name]: value }
        : form
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className=" px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onBack(questionForms)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Generate questions
            </button>
            <div className='ml-70'>
              <h1 className="text-gray-600 ">Edit Mode</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Section - Add Question Form */}
        <div className="w-1/2 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Form Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Add Question</h2>
              </div>
              
              {questionForms.map((form, formIndex) => (
                <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-gray-900">Question {formIndex + 1}</h3>
                  </div>
                  
                  <form id={`questionForm${form.id}`} className="space-y-3">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text *
                      </label>
                      <div data-color-mode="light">
                        <MDEditor
                          value={form.questionText}
                          onChange={(value) => handleInputChange(form.id, { target: { name: 'questionText', value: value || '' } })}
                          height={120}
                          preview="live"
                          className="w-full"
                          placeholder="Enter your question here... You can use markdown formatting!"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options *
                      </label>
                      <div className="space-y-2">
                        {form.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(form.id, index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Solution */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solution
                      </label>
                      <div data-color-mode="light">
                        <MDEditor
                          value={form.solution}
                          onChange={(value) => handleInputChange(form.id, { target: { name: 'solution', value: value || '' } })}
                          height={80}
                          preview="live"
                          className="w-full"
                          placeholder="Enter the solution or explanation... You can use markdown formatting!"
                        />
                      </div>
                    </div>

                    {/* Metadata Fields */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Level
                        </label>
                        <select
                          value={form.level}
                          onChange={(e) => handleInputChange(form.id, { target: { name: 'level', value: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      {/* Positive Marks */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Positive Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.positiveMarks}
                          onChange={(e) => handleInputChange(form.id, { target: { name: 'positiveMarks', value: parseInt(e.target.value) || 0 } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          placeholder="1"
                        />
                      </div>

                      {/* Negative Marks */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Negative Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.negativeMarks}
                          onChange={(e) => handleInputChange(form.id, { target: { name: 'negativeMarks', value: parseInt(e.target.value) || 0 } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Live Preview */}
        <div className="w-1/2 bg-gray-50 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
            </div>
            
            {/* Active Form Preview */}
            {questionForms.map((form, formIndex) => (
              <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-medium text-gray-900">Question {formIndex + 1} Preview</h3>
                  <span className="text-xs text-gray-500">Live Preview</span>
                </div>
                
                {/* Question Text Preview */}
                {form.questionText ? (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Question:</h4>
                    <div className="bg-gray-50 p-2 rounded-md border-l-3 border-blue-400">
                      <div data-color-mode="light">
                        <MDEditor.Markdown 
                          source={form.questionText} 
                          className="bg-transparent border-none shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Question:</h4>
                    <p className="text-gray-400 italic bg-gray-50 p-2 rounded-md border-l-3 border-gray-300 text-xs">
                      Start typing your question...
                    </p>
                  </div>
                )}
                
                {/* Options Preview */}
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Options:</h4>
                  <div className="space-y-1">
                    {form.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className={`text-xs ${option ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                          {option || `Option ${String.fromCharCode(65 + index)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Solution Preview */}
                {form.solution && (
                  <div className="bg-blue-50 border-l-3 border-blue-400 p-3 rounded-r-md">
                    <h4 className="text-xs font-medium text-blue-800 mb-1">Solution:</h4>
                    <div data-color-mode="light">
                      <MDEditor.Markdown 
                        source={form.solution} 
                        className="bg-transparent border-none shadow-none text-blue-700 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Metadata Preview */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Metadata:</h4>
                  <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                    <span>Level: <span className="font-semibold text-gray-900">{form.level}</span></span>
                    <span>Positive: <span className="font-semibold text-gray-900">{form.positiveMarks}</span></span>
                    <span>Negative: <span className="font-semibold text-gray-900">{form.negativeMarks}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratePage
