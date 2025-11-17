import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const GEMINI_API_KEY = 'AIzaSyBlfYuSZQCYEbv1yoCpXsw68ng40i5hSEU';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const GeminiModal = ({ isOpen, onClose, onResponse, question, detailedAnswer, metadata, qualityParams, title }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (isOpen && question) {
      const initialPrompt = generatePrompt();
      setPrompt(initialPrompt);
    }
  }, [isOpen, question]);

  const cleanResponse = (text) => {
    // Remove markdown symbols from headings
    text = text.replace(/^#+\s+/gm, '');
    
    // Remove markdown symbols from bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove markdown symbols from italic text
    text = text.replace(/\*(.*?)\*/g, '$1');
    
    // Remove markdown symbols from bullet points
    text = text.replace(/^\s*[-*+]\s+/gm, '• ');
    
    // Remove mark allocation
    text = text.replace(/\(\d+\s*marks?\)/gi, '');
    
    // Clean up extra spaces
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  };

  const generatePrompt = () => {
    const isDetailedAnswer = title?.toLowerCase().includes('detailed');
    const isKeywords = title?.toLowerCase().includes('keyword');
    let prompt = '';

    if (isKeywords) {
      // For keyword generation - only use question and detailed answer
      prompt = `Generate relevant keywords for the following question and its detailed answer:\n\n`;
      prompt += `Question: ${question}\n\n`;
      if (detailedAnswer) {
        prompt += `Detailed Answer: ${detailedAnswer}\n\n`;
      }
      prompt += `Please generate a list of important keywords that:\n`;
      prompt += `1. Are relevant to the question and answer\n`;
      prompt += `2. Cover key concepts and topics\n`;
      prompt += `3. Include technical terms if applicable\n`;
      prompt += `4. Are separated by commas\n\n`;
      prompt += `Format the response as a comma-separated list of keywords.`;
    } else if (isDetailedAnswer) {
      // For detailed answer - simple and focused prompt
      prompt = `Generate a comprehensive detailed answer for the following question:\n\n`;
      prompt += `Question: ${question}\n\n`;
      prompt += `Please provide a detailed answer that:\n`;
      prompt += `1. Covers all aspects of the question thoroughly\n`;
      prompt += `2. Includes relevant examples and explanations\n`;
      prompt += `3. Uses proper formatting and structure\n`;
      prompt += `4. Maintains academic rigor and clarity\n`;
      prompt += `5. Provides in-depth analysis and insights\n\n`;
      prompt += `Formatting Requirements:\n`;
      prompt += `1. Write the answer in plain text format\n`;
      prompt += `2. Use clear headings and subheadings without any symbols\n`;
      prompt += `3. Use simple bullet points without any symbols\n`;
      prompt += `4. Format tables in a simple, readable way\n`;
      prompt += `5. Use proper spacing between sections\n`;
      prompt += `6. Do not use any markdown symbols, asterisks, or hash signs\n`;
      prompt += `7. Do not include any mark allocation\n`;
      prompt += `8. Make the answer easy to read and understand\n\n`;
      prompt += `Please generate a well-structured detailed answer that meets these requirements.`;
    } else {
      // For modal answer - use metadata and detailed answer as reference
      prompt = `Generate a concise modal answer for the following question:\n\n`;
      prompt += `Question: ${question}\n\n`;

      if (detailedAnswer) {
        prompt += `Reference Detailed Answer: ${detailedAnswer}\n\n`;
      }

      prompt += `Requirements:\n`;
      prompt += `1. Difficulty Level: ${metadata.difficultyLevel}\n`;
      prompt += `2. Estimated Time: ${metadata.estimatedTime} minutes\n`;
      prompt += `3. Maximum Marks: ${metadata.maximumMarks}\n\n`;

      if (metadata.keywords) {
        const keywords = typeof metadata.keywords === 'string' 
          ? metadata.keywords 
          : Array.isArray(metadata.keywords) 
            ? metadata.keywords.join(', ')
            : '';
        
        if (keywords.trim()) {
          prompt += `Keywords to include: ${keywords}\n\n`;
        }
      }

      prompt += `Quality Parameters to include:\n`;
      if (qualityParams.intro) prompt += '- Introduction\n';
      if (qualityParams.body) {
        prompt += '- Body with:\n';
        if (qualityParams.body.features) prompt += '  * Features\n';
        if (qualityParams.body.examples) prompt += '  * Examples\n';
        if (qualityParams.body.facts) prompt += '  * Facts\n';
        if (qualityParams.body.diagram) prompt += '  * Diagram\n';
      }
      if (qualityParams.conclusion) prompt += '- Conclusion\n';

      if (qualityParams.customParams && qualityParams.customParams.length > 0) {
        prompt += '\nCustom Parameters:\n';
        qualityParams.customParams.forEach(param => {
          prompt += `- ${param}\n`;
        });
      }

      prompt += `\nFormatting Requirements:\n`;
      prompt += `1. Write the answer in plain text format\n`;
      prompt += `2. Use clear headings and subheadings without any symbols\n`;
      prompt += `3. Use simple bullet points without any symbols\n`;
      prompt += `4. Format tables in a simple, readable way\n`;
      prompt += `5. Use proper spacing between sections\n`;
      prompt += `6. Do not use any markdown symbols, asterisks, or hash signs\n`;
      prompt += `7. Do not include any mark allocation\n`;
      prompt += `8. Make the answer easy to read and understand\n\n`;
      prompt += `Please generate a well-structured modal answer that meets these requirements.`;
    }

    return prompt;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      let generatedText = data.candidates[0].content.parts[0].text;
      
      // Clean the response before sending it
      generatedText = cleanResponse(generatedText);
      
      onResponse(generatedText);
      onClose();
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title || 'Generate Answer'}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Prompt (You can modify this if needed)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 font-mono text-sm"
            placeholder="Enter your prompt here..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[100px]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiModal; 
