import React, { useState } from 'react';
import { X, Check, Download } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const AISWBPrintModal = ({ isOpen, onClose, topicId }) => {
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [loadingSets, setLoadingSets] = useState(false);
  const [expandedSet, setExpandedSet] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingQR, setLoadingQR] = useState({});
  const [printing, setPrinting] = useState(false);
  const [includeBlankPages, setIncludeBlankPages] = useState(false);
  const [blankPagesCount, setBlankPagesCount] = useState(1);
  const [questionBlankPages, setQuestionBlankPages] = useState({});
  const [customWatermark, setCustomWatermark] = useState(null);
  const [testDetailsPage, setTestDetailsPage] = useState(null);

  const fetchSetsForPrint = async () => {
    setLoadingSets(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('🔍 Fetching sets for topic:', topicId);
      console.log('📡 API URL:', `https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets`);
      
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📥 Sets API Response:', {
        success: data.success,
        setsCount: data.sets?.length || 0,
        sets: data.sets
      });
      
      if (data.success) {
        // Store the original question IDs in a separate property
        const setsWithQuestionIds = data.sets.map(set => ({
          ...set,
          questionIds: set.questions || [], // Store original question IDs
          questions: [] // Initialize empty questions array for loaded questions
        }));
        console.log('📦 Processed Sets:', setsWithQuestionIds);
        setSets(setsWithQuestionIds);
      } else {
        toast.error(data.message || 'Failed to fetch sets');
      }
    } catch (error) {
      console.error('❌ Error fetching sets:', error);
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
      if (!set) {
        console.error('Set not found:', setId);
        return;
      }

      // Get questions array from the set's questionIds
      const questionIds = set.questionIds || [];
      console.log('🔍 Fetching questions for set:', {
        setId,
        setName: set.name,
        questionIdsCount: questionIds.length,
        questionIds
      });

      if (questionIds.length === 0) {
        console.log('⚠️ No questions found in set:', setId);
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
          console.log('📡 Fetching question:', questionId);
          const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          console.log('📥 Question API Response:', {
            questionId,
            success: data.success,
            hasData: !!data.data,
            question: data.data?.question,
            metadata: data.data?.metadata
          });
          
          if (data.success && data.data) {
            const questionData = data.data;
            return {
              id: questionId,
              question: questionData.question || '',
              content: questionData.question || '',
              detailedAnswer: questionData.detailedAnswer || '',
              modalAnswer: questionData.modalAnswer || '',
              languageMode: questionData.languageMode || 'english',
              evaluationMode: questionData.evaluationMode || 'manual',
              metadata: {
                difficultyLevel: questionData.metadata?.difficultyLevel || 'level1',
                wordLimit: questionData.metadata?.wordLimit || 0,
                estimatedTime: questionData.metadata?.estimatedTime || 0,
                maximumMarks: questionData.metadata?.maximumMarks || 0,
                keywords: questionData.metadata?.keywords || [],
                qualityParameters: questionData.metadata?.qualityParameters || {
                  intro: false,
                  body: { enabled: false, features: false, examples: false, facts: false, diagram: false },
                  conclusion: false,
                  customParams: []
                }
              }
            };
          }
          return null;
        } catch (error) {
          console.error('Error fetching question:', error);
          return null;
        }
      });

      const questionsData = await Promise.all(questionsPromises);
      const validQuestions = questionsData.filter(q => q !== null);
      console.log('📦 Processed Questions:', {
        totalQuestions: questionsData.length,
        validQuestions: validQuestions.length,
        questions: validQuestions
      });
      
      setSets(prevSets => 
        prevSets.map(s => 
          s.id === setId 
            ? { ...s, questions: validQuestions }
            : s
        )
      );
    } catch (error) {
      console.error('❌ Error in fetchQuestionsForSet:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSetClick = (setId) => {
    console.log('🖱️ Set clicked:', setId);
    if (expandedSet === setId) {
      console.log('📕 Collapsing set:', setId);
      setExpandedSet(null);
    } else {
      console.log('📗 Expanding set:', setId);
      setExpandedSet(setId);
      const set = sets.find(s => s.id === setId);
      if (set) {
        console.log('📘 Fetching questions for set:', setId);
        fetchQuestionsForSet(setId);
      }
    }
  };

  const toggleQuestionSelection = (setId, questionId) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };
      
      // Initialize the set's array if it doesn't exist
      if (!newSelection[setId]) {
        newSelection[setId] = [];
      }
      
      // Check if the question is already selected
      const questionIndex = newSelection[setId].indexOf(questionId);
      
      if (questionIndex === -1) {
        // If not selected, add it to the selection
        newSelection[setId] = [...newSelection[setId], questionId];
        // Initialize blank pages count for this question
        setQuestionBlankPages(prev => ({
          ...prev,
          [questionId]: blankPagesCount
        }));
      } else {
        // If already selected, remove it from the selection
        newSelection[setId] = newSelection[setId].filter(id => id !== questionId);
        // Remove blank pages count for this question
        setQuestionBlankPages(prev => {
          const newState = { ...prev };
          delete newState[questionId];
          return newState;
        });
      }
      
      // Clean up empty sets
      if (newSelection[setId].length === 0) {
        delete newSelection[setId];
      }
      
      console.log('Updated selection:', newSelection);
      return newSelection;
    });
  };

  const generateQRCodeForQuestion = async (questionId) => {
    setLoadingQR(prev => ({ ...prev, [questionId]: true }));
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        format: 'json',
        size: 150,
        includeAnswers: false
      }).toString();

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/qr/questions/${questionId}/qrcode?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      if (data.success && data.data?.qrCode) {
        return data.data.qrCode;
      }
      throw new Error('Invalid QR code data');
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    } finally {
      setLoadingQR(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleWatermarkUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomWatermark(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestDetailsUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTestDetailsPage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = async () => {
    if (Object.keys(selectedQuestions).length === 0) {
      toast.error('Please select at least one question to print');
      return;
    }

    setPrinting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      // Generate QR codes for all selected questions
      const qrCodes = {};
      for (const [setId, questionIds] of Object.entries(selectedQuestions)) {
        for (const questionId of questionIds) {
          const qrCode = await generateQRCodeForQuestion(questionId);
          if (qrCode) {
            qrCodes[questionId] = qrCode;
          }
        }
      }

      let currentPageNumber = 1;
      let questionCounter = 1;

      // Add test details page if uploaded
      if (testDetailsPage) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Test Details</title>
            <style>
              @page { size: A4; margin: 0; }
              body { margin: 0; padding: 0; }
              .a4-page { width: 210mm; height: 297mm; margin: 0 auto; background: white; position: relative; }
            </style>
          </head>
          <body>
            <div class="a4-page">
              <img src="${testDetailsPage}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </body>
          </html>
        `);
        currentPageNumber++;
      }

      // Process each selected question
      for (const [setId, questionIds] of Object.entries(selectedQuestions)) {
        const set = sets.find(s => s.id === setId);
        if (!set) continue;

        for (const questionId of questionIds) {
          const question = set.questions.find(q => q.id === questionId);
          if (!question) continue;

          // Limit keywords to 10
          const keywords = (question.metadata?.keywords || []).slice(0, 10);
          const qrCode = qrCodes[questionId];
          
          // Get last 10 digits of question ID
          const shortQuestionId = question.id ? question.id.slice(-10) : '';

          // Print question page
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Question ${currentPageNumber}</title>
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; position: relative; width: 210mm; min-height: 297mm; }
                .a4-page { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; position: relative; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; }
                .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0.5; z-index: 0; pointer-events: none; }
                .watermark img { max-width: 300px; max-height: 300px; }
                .top-section { display: flex; border-bottom: 1px solid #000; height: auto; min-height: 130px; max-height: auto; flex: 0 0 auto; }
                .left-column { width: 120px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                .middle-column { flex: 1; overflow: visible; padding: 10px; }
                .right-column { width: 120px; border-left: 1px solid #000; display: flex; justify-content: center; align-items: center; }
                .qid-section { padding: 10px; height: 100%; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                .qid-label { font-size: 14px; text-align: center; display: block; width: 100%; margin-bottom: 2px; }
                .qid-value { flex: 0 0 auto; font-size: 14px; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 90%; text-align: center; }
                .level-label { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; }
                .level-label1 { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; margin-bottom: 5px; }
                .topic-section { padding: 10px; display: flex; flex-direction: column; overflow: visible; word-wrap: break-word; height: auto; }
                .topic-value { color: #00b0f0; font-size: 18px; font-weight: bold; display: flex; align-items: flex-start; flex-wrap: wrap; height: auto; min-height: 60px; text-align: justify; margin-top: 5px; gap: 5px; }
                .question-preview { font-size: 16px; font-weight: bold; color: #333; white-space: normal; overflow: visible; text-overflow: unset; max-width: 100%; word-wrap: break-word; hyphens: auto; text-align: justify; font-family: 'Noto Sans', 'Calibri', sans-serif; font-style: italic; }
                .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 10px; box-sizing: border-box; }
                .scan-text { font-size: 8px; text-align: center; margin-top: 3px; font-weight: bold; }
                .middle-section { display: flex; height: auto; min-height: 150px; flex: 1 1 auto; overflow: visible; }
                .left-sidebar { width: 120px; border-right: 1px solid #000; padding: 20px 0px 0px 0px; position: relative; text-align: center; }
                .right-sidebar { width: 120px; border-left: 1px solid #000; padding: 20px 0px 0px 0px; position: relative; text-align: center; }
                .keywords-label { font-style: italic; margin-bottom: 10px; font-weight: bold;}
                .keywords-list { font-size: 12px; }
                .keyword-item { margin-bottom: 5px; }
                .content-area { flex: 1; padding: 20px; position: relative; display: flex; flex-direction: column; overflow: visible; min-height: 100px; height: auto; }
                .question-text { position: relative; z-index: 1; font-size: 16px; line-height: 1.5; font-family: 'Noto Sans', 'Calibri', sans-serif; font-style: italic; }
                .footer-section { height: 50px; border-top: 1px solid #000; display: flex; align-items: center; justify-content: space-between; padding: 0; flex: 0 0 auto; }
                .footer-left { width: 120px; border-right: 1px solid #000; height: 100%; display: flex; justify-content: center; align-items: center; }
                .footer-middle { flex: 1; height: 100%; display: flex; justify-content: center; align-items: center; }
                .footer-right { width: 120px; border-left: 1px solid #000; height: 100%; }
                .page-number { font-size: 14px; text-align: center; }
                .powered-by { font-size: 14px; text-align: center; }
                .kitabai { font-weight: bold; }
                .question-preview pre { white-space: pre-wrap; font-family: inherit; }
              </style>
            </head>
            <body>
              <div class="a4-page">
                <div class="watermark">
                  <img src="${customWatermark || '/LOGO_WATERMARK.png'}" alt="Watermark" />
                </div>
                
                <div class="top-section">
                  <div class="left-column">
                    <div class="qid-section">
                      <div class="qid-value">
                        <div class="qid-label">Q.ID</div>
                        ${shortQuestionId}
                      </div>
                      <div class="level-label">${question.metadata?.difficultyLevel || 'level1'}</br>(${question.metadata?.wordLimit || 'level1'} words)</div>
                    </div>
                  </div>
                  <div class="middle-column">
                    <div class="topic-section">
                      <div class="topic-value">
                        <span class="question-preview">
                          <pre style="margin: 0; font-family: inherit;"><span style="color: #00b0f0; margin-right: 5px;">Q${questionCounter}:</span>${question.question}</pre>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="right-column">
                    <div class="qr-section">
                      ${qrCode ? `
                        <img src="${qrCode}" alt="QR Code" style="width: 100px; height: 100px;" />
                        <div class="scan-text">SCAN to Upload Answer</div>
                      ` : ''}
                    </div>
                  </div>
                </div>
                
                <div class="middle-section">
                  <div class="left-sidebar">
                    <div class="level-label1">Marks : ${question.metadata?.maximumMarks}</div>
                    <div class="keywords-label">Keywords</div>
                    <div class="keywords-list">
                      ${keywords.map((keyword) => `<div class="keyword-item">${keyword}</div>`).join("")}
                    </div>
                  </div>
                  <div class="content-area">
                  </div>
                  <div class="right-sidebar">
                  </div>
                </div>
                
                <div class="footer-section">
                  <div class="footer-left">
                    <div class="page-number">${currentPageNumber}</div>
                  </div>
                  <div class="footer-middle">
                    <div class="powered-by">Powered by <span class="kitabai">KitabAI</span></div>
                  </div>
                  <div class="footer-right">
                  </div>
                </div>
              </div>
            </body>
            </html>
          `);
          currentPageNumber++;
          questionCounter++;

          // Add blank pages if option is enabled
          if (includeBlankPages) {
            const pagesToAdd = questionBlankPages[questionId] || blankPagesCount;
            for (let i = 0; i < pagesToAdd; i++) {
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Blank Page ${currentPageNumber}</title>
                  <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; position: relative; width: 210mm; min-height: 297mm; }
                    .a4-page { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; position: relative; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; }
                    .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0.5; z-index: 0; pointer-events: none; }
                    .watermark img { max-width: 300px; max-height: 300px; }
                    .top-section { display: flex; border-bottom: 1px solid #000; height: auto; min-height: 130px; max-height: auto; flex: 0 0 auto; }
                    .left-column { width: 120px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                    .middle-column { flex: 1; overflow: visible; padding: 10px; }
                    .right-column { width: 120px; border-left: 1px solid #000; display: flex; justify-content: center; align-items: center; }
                    .qid-section { padding: 10px; height: 100%; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                    .qid-label { font-size: 14px; text-align: center; display: block; width: 100%; margin-bottom: 2px; }
                    .qid-value { flex: 0 0 auto; font-size: 14px; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 90%; text-align: center; }
                    .level-label { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; }
                    .level-label1 { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; margin-bottom: 5px; }
                  </style>
                </head>
                <body>
                  <div class="a4-page">
                    <div class="watermark">
                      <img src="${customWatermark || '/LOGO_WATERMARK.png'}" alt="Watermark" />
                    </div>
                    
                    <div class="top-section">
                      <div class="left-column">
                        <div class="qid-section">
                          <div class="qid-value">
                            <div class="qid-label">Q.ID</div>
                            ${shortQuestionId}
                          </div>
                          <div class="level-label">${question.metadata?.difficultyLevel || 'level1'}</br>(${question.metadata?.wordLimit || 'level1'} words)</div>
                        </div>
                      </div>
                      <div class="middle-column">
                      </div>
                      <div class="right-column">
                      </div>
                    </div>
                    
                    <div class="middle-section">
                      <div class="left-sidebar">
                        <div class="level-label1">Marks : ${question.metadata?.maximumMarks}</div>
                        <div class="keywords-label">Keywords</div>
                        <div class="keywords-list">
                          ${keywords.map((keyword) => `<div class="keyword-item">${keyword}</div>`).join("")}
                        </div>
                      </div>
                      <div class="content-area">
                      </div>
                      <div class="right-sidebar">
                      </div>
                    </div>
                    
                    <div class="footer-section">
                      <div class="footer-left">
                        <div class="page-number">${currentPageNumber}</div>
                      </div>
                      <div class="footer-middle">
                        <div class="powered-by">Powered by <span class="kitabai">KItabAI</span></div>
                      </div>
                      <div class="footer-right">
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `);
              currentPageNumber++;
            }
          }
        }
      }

      // Add final script to handle printing
      printWindow.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 300);
          };
        </script>
      `);

      printWindow.document.close();
      toast.success('Questions printed successfully!');
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to print questions');
    } finally {
      setPrinting(false);
    }
  };

  const selectAllQuestions = (setId, questions) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [setId]: questions.map(q => q.id)
    }));
    setQuestionBlankPages(prev => {
      const newPages = { ...prev };
      questions.forEach(q => {
        newPages[q.id] = blankPagesCount;
      });
      return newPages;
    });
  };

  const deselectAllQuestions = (setId, questions) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };
      delete newSelection[setId];
      return newSelection;
    });
    setQuestionBlankPages(prev => {
      const newPages = { ...prev };
      questions.forEach(q => {
        delete newPages[q.id];
      });
      return newPages;
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      console.log('🚪 Modal opened, fetching sets...');
      fetchSetsForPrint();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Select Questions to Print</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Test Details Page (First Page)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleTestDetailsUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Custom Watermark
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleWatermarkUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeBlankPages}
              onChange={(e) => setIncludeBlankPages(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Include blank pages after each question</span>
          </label>

          {includeBlankPages && (
            <div className="ml-7">
              <label className="flex items-center space-x-2">
                <span className="text-gray-700">Number of blank pages:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={blankPagesCount}
                  onChange={(e) => setBlankPagesCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="form-input w-20 px-2 py-1 border rounded"
                />
              </label>
            </div>
          )}
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
                    ) : set.questions.length > 0 ? (
                      <>
                        <div className="flex justify-end mb-2 space-x-2">
                          <button
                            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                            onClick={() => selectAllQuestions(set.id, set.questions)}
                            disabled={set.questions.length === 0}
                          >
                            Select All
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                            onClick={() => deselectAllQuestions(set.id, set.questions)}
                            disabled={set.questions.length === 0}
                          >
                            Deselect All
                          </button>
                        </div>
                        <div className="space-y-3">
                          {set.questions.map((question, index) => (
                            <div
                              key={`${set.id}-${question.id}-${index}`}
                              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <button
                                onClick={() => toggleQuestionSelection(set.id, question.id)}
                                className={`mt-1 p-1 rounded-full transition-colors ${
                                  selectedQuestions[set.id]?.includes(question.id)
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-white border border-gray-300 text-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <Check size={16} />
                              </button>
                              <div className="flex-1">
                                <div className="text-gray-800">
                                  <pre className="whitespace-pre-wrap font-sans">{question.question}</pre>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="text-sm text-gray-600">
                                    Difficulty: {question.metadata?.difficultyLevel || 'level1'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Marks: {question.metadata?.maximumMarks || 0}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Time: {question.metadata?.estimatedTime || 0} min
                                  </span>
                                </div>
                                {selectedQuestions[set.id]?.includes(question.id) && includeBlankPages && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Blank pages:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={questionBlankPages[question.id] || blankPagesCount}
                                      onChange={(e) => {
                                        const value = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                                        setQuestionBlankPages(prev => ({
                                          ...prev,
                                          [question.id]: value
                                        }));
                                      }}
                                      className="form-input w-20 px-2 py-1 border rounded text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No questions available in this set</p>
                        <p className="text-sm text-gray-400 mt-1">Add questions to this set to print them</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Download size={18} className="mr-2" />
            <span>Print Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISWBPrintModal; 