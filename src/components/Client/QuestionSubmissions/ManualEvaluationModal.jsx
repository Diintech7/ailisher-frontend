import React, { useState, useEffect } from 'react';
import { userAnswerService } from '../../../services/userAnswerService';
import { toast } from 'react-toastify';

const ManualEvaluationModal = ({ submission, onClose, onEvaluationComplete }) => {
  const [evaluationPrompt, setEvaluationPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate prompt immediately when component mounts
  useEffect(() => {
    if (submission && submission.question) {
      console.log('Generating prompt with submission:', submission);
      const prompt = generateEvaluationPrompt(submission.extractedTexts || []);
      console.log('Generated prompt:', prompt);
      setEvaluationPrompt(prompt);
    }
  }, [submission]);

  const generateEvaluationPrompt = (extractedTexts) => {
    if (!submission || !submission.question) {
      console.error('Missing required data:', { submission });
      return '';
    }

    const question = submission.question;
    let prompt = `Evaluate the following answer for the given question:\n\n`;
    
    // Question details
    prompt += `QUESTION DETAILS:\n`;
    prompt += `Question: ${question.question || 'No question provided'}\n`;
    
    // Include all metadata fields
    prompt += `\nQUESTION METADATA:\n`;
    if (question.metadata) {
      Object.entries(question.metadata).forEach(([key, value]) => {
        if (key === 'qualityParameters') {
          prompt += `\nQUALITY PARAMETERS:\n`;
          try {
            const params = typeof value === 'string' ? JSON.parse(value) : value;
            Object.entries(params).forEach(([param, paramValue]) => {
              if (param === 'body' && typeof paramValue === 'object') {
                prompt += `body:\n`;
                Object.entries(paramValue).forEach(([bodyParam, bodyValue]) => {
                  prompt += `  - ${bodyParam}: ${bodyValue}\n`;
                });
              } else if (param === 'customParams' && paramValue) {
                prompt += `customParams:\n`;
                Object.entries(paramValue).forEach(([customParam, customValue]) => {
                  prompt += `  - ${customParam}: ${customValue}\n`;
                });
              } else {
                prompt += `${param}: ${paramValue}\n`;
              }
            });
          } catch (e) {
            console.error('Error parsing quality parameters:', e);
            prompt += `${value}\n`;
          }
        } else {
          prompt += `${key}: ${value}\n`;
        }
      });
    } else {
      prompt += `No metadata available\n`;
    }
    
    // Include reference answer
    if (question.detailedAnswer) {
      prompt += `\nREFERENCE ANSWER (Expected Format):\n`;
      prompt += `${question.detailedAnswer}\n`;
      prompt += `\nNote: This is the expected answer format. Evaluate the student's answer based on this reference.\n`;
    }
    
    // Student's answer with extracted text
    prompt += `\nSTUDENT'S ANSWER:\n`;
    prompt += `The student has submitted ${submission.answerImages?.length || 0} image(s) as their answer.\n`;
    prompt += `Here is the text extracted from each image using text extraction:\n\n`;
    
    if (extractedTexts && extractedTexts.length > 0) {
      extractedTexts.forEach((text, index) => {
        prompt += `Image ${index + 1}:\n${text}\n\n`;
      });
    } else {
      prompt += `No text was extracted from the images.\n\n`;
    }
    
    // Evaluation criteria
    prompt += `\nEVALUATION CRITERIA:\n`;
    prompt += `1. Evaluate the extracted text from the images\n`;
    prompt += `2. Compare with the reference answer format\n`;
    prompt += `3. Evaluate based on the following quality parameters:\n`;
    
    if (question.metadata?.qualityParameters) {
      try {
        const params = typeof question.metadata.qualityParameters === 'string' 
          ? JSON.parse(question.metadata.qualityParameters)
          : question.metadata.qualityParameters;
        
        Object.entries(params).forEach(([param, paramValue]) => {
          if (param === 'body' && typeof paramValue === 'object') {
            prompt += `   body:\n`;
            Object.entries(paramValue).forEach(([bodyParam, bodyValue]) => {
              prompt += `     - ${bodyParam}: ${bodyValue}\n`;
            });
          } else if (param === 'customParams' && paramValue) {
            prompt += `   customParams:\n`;
            Object.entries(paramValue).forEach(([customParam, customValue]) => {
              prompt += `     - ${customParam}: ${customValue}\n`;
            });
          } else {
            prompt += `   - ${param}: ${paramValue}\n`;
          }
        });
      } catch (e) {
        console.error('Error parsing quality parameters for criteria:', e);
        prompt += `   Error parsing quality parameters\n`;
      }
    }
    
    prompt += `Please provide a detailed evaluation in the following format:\n`;
    prompt += `ACCURACY: [percentage]\n`;
    prompt += `EXTRACTED TEXT: [summary of extracted text]\n`;
    prompt += `STRENGTHS:\n- [strength 1]\n- [strength 2]\n...\n`;
    prompt += `WEAKNESSES:\n- [weakness 1]\n- [weakness 2]\n...\n`;
    prompt += `SUGGESTIONS:\n- [suggestion 1]\n- [suggestion 2]\n...\n`;
    prompt += `MARKS: [number out of ${question.metadata?.maximumMarks || 10}]\n`;
    prompt += `FEEDBACK: [detailed feedback]\n`;

    return prompt;
  };

  const handleEvaluate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await userAnswerService.evaluateManual(submission._id, {
        evaluationPrompt,
        includeExtractedText: true,
        includeQuestionDetails: true,
        maxMarks: submission.question.metadata?.maximumMarks
      });
      console.log('Evaluation response:', response);

      if (response.success) {
        toast.success('Answer evaluated successfully');
        onEvaluationComplete(response.data || response);
        onClose();
      } else {
        setError(response.message || 'Evaluation failed');
        toast.error(response.message || 'Evaluation failed');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setError(error.message || 'Failed to evaluate answer');
      toast.error(error.message || 'Failed to evaluate answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Debug log to check if component is rendering with correct props
  console.log('Modal rendering with submission:', submission);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Manual Evaluation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Evaluation Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Prompt
                <span className="text-gray-500 text-xs ml-2">
                  (You can modify this prompt before evaluation)
                </span>
              </label>
              <textarea
                value={evaluationPrompt}
                onChange={(e) => setEvaluationPrompt(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Generating evaluation prompt..."
                readOnly={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEvaluate}
            disabled={isLoading || !evaluationPrompt.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Evaluating...' : 'Evaluate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualEvaluationModal; 