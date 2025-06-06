const GEMINI_API_KEY = 'AIzaSyCCWtRX--NYoiootIlwWgg28s7n2VCfzDo'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export const generateContentWithGemini = async (prompt, context = {}) => {
  try {
    console.log('Sending request to Gemini API with prompt:', prompt)
    
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
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
    }

    const data = await response.json()
    console.log('Gemini API Response:', data)

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid response structure:', data)
      throw new Error('Invalid response structure from Gemini API')
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Error generating content with Gemini:', {
      message: error.message,
      stack: error.stack,
      prompt
    })
    throw error
  }
}

export const generateSummary = async (text, modelName = "gemini-2.0-flash") => {
  try {
    const prompt = `Generate a comprehensive summary of the following text. The summary should be well-structured, easy to understand, and capture all key points. Format the response as a JSON object with a single "summary" field:

Text to summarize:
${text}

Response format:
{
  "summary": "string"
}`

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
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
    }

    const data = await response.json()
    console.log('Gemini API Response:', data)

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid response structure:', data)
      throw new Error('Invalid response structure from Gemini API')
    }

    const generatedText = data.candidates[0].content.parts[0].text
    try {
      const parsedResponse = JSON.parse(generatedText)
      return parsedResponse.summary
    } catch (error) {
      console.error('Error parsing summary response:', error)
      return generatedText // Return raw text if JSON parsing fails
    }
  } catch (error) {
    console.error('Error generating summary:', {
      message: error.message,
      stack: error.stack,
      text
    })
    throw error
  }
}

export const generateEducationalContent = async (itemType, itemTitle, config, dataSourceType, selectedData = [], modelName = "gemini-2.0-flash", retryCount = 0) => {
  try {
    const basePrompt = `Generate educational content for ${itemType} "${itemTitle}". `
    const contextPrompt = `This content should be comprehensive and suitable for students. `

    let contentPrompt = ''
    if (dataSourceType === 'with' && selectedData.length > 0) {
      // Format the selected data sources for the prompt
      const dataSourcesText = selectedData.map(data => {
        let sourceInfo = `Source: ${data.name}`
        if (data.description) {
          sourceInfo += `\nDescription: ${data.description}`
        }
        if (data.fileType) {
          sourceInfo += `\nType: ${data.fileType}`
        }
        return sourceInfo
      }).join('\n\n')

      contentPrompt = `Use the following data sources to generate content:\n\n${dataSourcesText}\n\n`
    }

    const summaryPrompt = `
      Generate a comprehensive summary of the content. The summary should be well-structured, easy to understand, and capture all key points.
      Format the response as JSON with the following structure:
      {
        "summary": "string"
      }
    `

    const objectivePrompt = `
      Generate ${config.objective.L1.sets} sets of objective questions for L1-Beginner level,
      ${config.objective.L2.sets} sets for L2-Intermediate level,
      and ${config.objective.L3.sets} sets for L3-Advanced level.
      Each set should contain ${config.objective.L1.questionsPerSet} questions.
      Include multiple choice options and correct answers.
      Format the response as JSON with the following structure:
      {
        "objective": {
          "L1": [
            {
              "setName": "string",
              "questions": [
                {
                  "question": "string",
                  "options": ["string", "string", "string", "string"],
                  "correctAnswer": number
                }
              ]
            }
          ],
          "L2": [...],
          "L3": [...]
        }
      }
    `

    const subjectivePrompt = `
      Generate ${config.subjective.L1.sets} sets of subjective questions for L1-Beginner level,
      ${config.subjective.L2.sets} sets for L2-Intermediate level,
      and ${config.subjective.L3.sets} sets for L3-Advanced level.
      Each set should contain ${config.subjective.L1.questionsPerSet} questions.
      Include detailed answers and keywords (comma-separated) to look for in student responses.
      Format the response as JSON with the following structure:
      {
        "subjective": {
          "L1": [
            {
              "setName": "string",
              "questions": [
                {
                  "question": "string",
                  "answer": "string",
                  "keywords": "string"
                }
              ]
            }
          ],
          "L2": [...],
          "L3": [...]
        }
      }
    `

    const fullPrompt = `You are an educational content generator. Your task is to generate educational content in a specific JSON format. Do not include any text before or after the JSON response.

${basePrompt}${contextPrompt}${contentPrompt}

Please generate the following content in JSON format:

1. A summary:
${summaryPrompt}

2. Objective questions:
${objectivePrompt}

3. Subjective questions:
${subjectivePrompt}

IMPORTANT: Respond ONLY with the JSON object. Do not include any other text or explanations.`

    console.log('Full prompt for Gemini:', fullPrompt)

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`)
    }

    const data = await response.json()
    console.log('Gemini API Response:', data)

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid response structure:', data)
      throw new Error('Invalid response structure from Gemini API')
    }

    const generatedContent = data.candidates[0].content.parts[0].text
    const parsedContent = parseGeneratedContent(generatedContent)

    // Check if the response was truncated
    if (parsedContent.isTruncated && retryCount < 3) {
      console.log(`Response was truncated, retrying (attempt ${retryCount + 1})...`)
      return generateEducationalContent(itemType, itemTitle, config, dataSourceType, selectedData, modelName, retryCount + 1)
    }

    return parsedContent
  } catch (error) {
    console.error('Error generating educational content:', {
      message: error.message,
      stack: error.stack,
      itemType,
      itemTitle,
      config,
      dataSourceType,
      selectedData,
      modelName,
      retryCount
    })
    throw error
  }
}

const formatContentForDisplay = (parsedContent) => {
  try {
    let formattedText = '';

    // Format Summary
    formattedText += '📝 SUMMARY\n';
    formattedText += '-------------------\n';
    formattedText += parsedContent.summary + '\n\n';

    // Format Objective Questions
    formattedText += '🎯 OBJECTIVE QUESTIONS\n';
    formattedText += '-------------------\n';
    Object.entries(parsedContent.objective).forEach(([level, sets]) => {
      formattedText += `\nLevel ${level === 'L1' ? 'L1-Beginner' : level === 'L2' ? 'L2-Intermediate' : 'L3-Advanced'}:\n`;
      sets.forEach((set, setIndex) => {
        formattedText += `\nSet ${setIndex + 1}: ${set.setName}\n`;
        set.questions.forEach((question, qIndex) => {
          formattedText += `\n${qIndex + 1}. ${question.question}\n`;
          question.options.forEach((option, oIndex) => {
            formattedText += `   ${String.fromCharCode(65 + oIndex)}. ${option}\n`;
          });
          formattedText += `   Correct Answer: ${String.fromCharCode(65 + question.correctAnswer)}\n`;
        });
      });
    });

    // Format Subjective Questions
    formattedText += '\n📝 SUBJECTIVE QUESTIONS\n';
    formattedText += '-------------------\n';
    Object.entries(parsedContent.subjective).forEach(([level, sets]) => {
      formattedText += `\nLevel ${level === 'L1' ? 'L1-Beginner' : level === 'L2' ? 'L2-Intermediate' : 'L3-Advanced'}:\n`;
      sets.forEach((set, setIndex) => {
        formattedText += `\nSet ${setIndex + 1}: ${set.setName}\n`;
        set.questions.forEach((question, qIndex) => {
          formattedText += `\n${qIndex + 1}. ${question.question}\n`;
          formattedText += `   Answer: ${question.answer}\n`;
          formattedText += `   Keywords: ${question.keywords}\n`;
        });
      });
    });

    return formattedText;
  } catch (error) {
    console.error('Error formatting content:', error);
    return 'Error formatting content. Please try again.';
  }
};

const parseGeneratedContent = (content) => {
  try {
    // Remove any text before the first { and after the last }
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}') + 1
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON object found in response')
    }
    const jsonContent = content.slice(jsonStart, jsonEnd)

    // Check if the JSON is complete
    const openBraces = (jsonContent.match(/{/g) || []).length
    const closeBraces = (jsonContent.match(/}/g) || []).length
    const openBrackets = (jsonContent.match(/\[/g) || []).length
    const closeBrackets = (jsonContent.match(/\]/g) || []).length

    const isTruncated = openBraces !== closeBraces || openBrackets !== closeBrackets

    if (isTruncated) {
      console.error('Incomplete JSON response detected:', {
        openBraces,
        closeBraces,
        openBrackets,
        closeBrackets,
        content: jsonContent
      })
      return {
        isTruncated: true,
        raw: {
          summary: 'Response was truncated. Retrying...',
          objective: {
            L1: [],
            L2: [],
            L3: []
          },
          subjective: {
            L1: [],
            L2: [],
            L3: []
          }
        },
        formatted: 'Response was truncated. Retrying...'
      }
    }

    // Try to parse the content as JSON
    const parsedContent = JSON.parse(jsonContent)
    
    // Validate the structure
    if (!parsedContent.objective || !parsedContent.subjective || !parsedContent.summary) {
      console.error('Invalid content structure:', parsedContent)
      throw new Error('Invalid content structure')
    }

    // Convert keyPoints to keywords (comma-separated string) in subjective questions
    Object.values(parsedContent.subjective).forEach(levelSets => {
      levelSets.forEach(set => {
        set.questions.forEach(question => {
          if (question.keyPoints) {
            question.keywords = question.keyPoints.join(', ')
            delete question.keyPoints
          }
        })
      })
    })

    // Format the content for display
    const formattedContent = formatContentForDisplay(parsedContent)

    return {
      isTruncated: false,
      raw: parsedContent,
      formatted: formattedContent
    }
  } catch (error) {
    console.error('Error parsing generated content:', {
      error,
      content
    })
    // Return a default structure if parsing fails
    return {
      isTruncated: false,
      raw: {
        summary: 'Failed to generate summary due to parsing error',
        objective: {
          L1: [],
          L2: [],
          L3: []
        },
        subjective: {
          L1: [],
          L2: [],
          L3: []
        }
      },
      formatted: 'Error generating content. Please try again.'
    }
  }
} 
