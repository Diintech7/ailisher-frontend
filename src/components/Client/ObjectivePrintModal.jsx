import React, { useState, useEffect } from 'react';
import { X, Check, Download } from 'lucide-react';

const PAGE_CONTENT_LIMIT = 3500; // Estimated max characters (question + options + explanation) for a single A4 page. Adjust as needed.

const ObjectivePrintModal = ({ isOpen, onClose, topicId }) => {
  const [sets, setSets] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [expandedSet, setExpandedSet] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [customWatermark, setCustomWatermark] = useState(null);
  const [testDetailsPage, setTestDetailsPage] = useState(null);
  const [printWithAnswers, setPrintWithAnswers] = useState(false);

  useEffect(() => {
    if (isOpen && topicId) {
      const setsKey = `objective_sets_${topicId}`;
      const setsData = localStorage.getItem(setsKey);
      let parsedSets = [];
      try {
        parsedSets = setsData ? JSON.parse(setsData) : [];
      } catch {
        parsedSets = [];
      }
      // For each set, fetch its questions
      const setsWithQuestions = parsedSets.map(set => {
        const questionsKey = `objective_questions_${set.id}`;
        let questions = [];
        try {
          const questionsData = localStorage.getItem(questionsKey);
          questions = questionsData ? JSON.parse(questionsData) : [];
        } catch {
          questions = [];
        }
        return { ...set, questions };
      });
      setSets(setsWithQuestions);
    }
  }, [isOpen, topicId]);

  const handleSetClick = (setId) => {
    setExpandedSet(expandedSet === setId ? null : setId);
  };

  const toggleQuestionSelection = (setId, questionId) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };
      const currentSet = newSelection[setId] ? [...newSelection[setId]] : [];
      const idx = currentSet.indexOf(questionId);
      if (idx === -1) {
        currentSet.push(questionId);
      } else {
        currentSet.splice(idx, 1);
      }
      if (currentSet.length === 0) {
        delete newSelection[setId];
      } else {
        newSelection[setId] = currentSet;
      }
      return newSelection;
    });
  };

  const selectAllQuestions = (setId, questions) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [setId]: questions.map(q => q.id)
    }));
  };

  const deselectAllQuestions = (setId) => {
    setSelectedQuestions(prev => {
      const newSelection = { ...prev };
      delete newSelection[setId];
      return newSelection;
    });
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
    // Gather all selected questions in order
    const allSelected = [];
    Object.entries(selectedQuestions).forEach(([setId, qids]) => {
      const set = sets.find(s => s.id === setId);
      if (!set) return;
      qids.forEach(qid => {
        const q = set.questions.find(qq => qq.id === qid);
        if (q) allSelected.push({ ...q, setName: set.name });
      });
    });
    if (allSelected.length === 0) {
      alert('Please select at least one question to print');
      return;
    }
    setPrinting(true);

    try {
      // --- DYNAMIC PAGINATION BASED ON HEIGHT ---
      const A4_PAGE_HEIGHT_PX = 1050; // A4 height is ~1122px, leaving a buffer for footer, etc.
      const pages = [];
      let currentPageQuestions = [];
      let currentPageHeight = 0;
      
      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.width = '210mm'; // A4 width
      document.body.appendChild(hiddenContainer);

      const preserveExtraSpaces = (text) => text ? text.replace(/ {2,}/g, (match) => ' ' + '&nbsp;'.repeat(match.length - 1)) : '';
      
      for (const q of allSelected) {
        const questionBlock = document.createElement('div');
        questionBlock.style.fontFamily = 'Arial, sans-serif';
        questionBlock.style.display = 'flex';
        questionBlock.style.borderTop = '1px solid #000';
        
        questionBlock.innerHTML = `
          <div style="width: 120px; padding: 10px; border-right: 1px solid #000; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; text-align: center;">
              <div style="font-size: 14px; font-weight: bold;">Q.ID</div>
              <div style="font-size: 14px; margin-bottom: 10px;">${q.id ? q.id.slice(-10) : 'N/A'}</div>
              <div style="font-size: 14px; font-weight: bold;">Marks: ${q.maxMarks || 0}</div>
          </div>
          <div style="flex: 1; padding: 10px; box-sizing: border-box;">
              <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;"><b>Q:</b> ${preserveExtraSpaces(q.question)}</div>
              <ul style="padding-left: 0; list-style-type: none; margin-bottom: 8px;">
                  ${(q.options || []).map((opt, i) => `<li style="font-size: 15px; margin-bottom: 4px;">${String.fromCharCode(65 + i)}. ${preserveExtraSpaces(opt)}</li>`).join('')}
              </ul>
              ${printWithAnswers ? `<div style="font-size: 14px; margin-top: 10px;"><b>Correct Answer:</b> ${String.fromCharCode(65 + q.correctAnswer)}</div>` : ''}
              ${q.explanation && printWithAnswers ? `<div style="font-size: 13px; margin-top: 8px; color: #475569;"><b>Explanation:</b> ${preserveExtraSpaces(q.explanation)}</div>` : ''}
          </div>
          <div style="width: 120px; border-left: 1px solid #000;"></div>
        `;
        hiddenContainer.appendChild(questionBlock);
        const questionHeight = questionBlock.offsetHeight;
        hiddenContainer.removeChild(questionBlock);
        
        if (currentPageHeight + questionHeight > A4_PAGE_HEIGHT_PX && currentPageQuestions.length > 0) {
            pages.push(currentPageQuestions);
            currentPageQuestions = [];
            currentPageHeight = 0;
        }

        currentPageQuestions.push(q);
        currentPageHeight += questionHeight;
      }
      
      if (currentPageQuestions.length > 0) {
          pages.push(currentPageQuestions);
      }
      
      document.body.removeChild(hiddenContainer);
      // --- END OF DYNAMIC PAGINATION ---

      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Failed to open print window');
      
      let pageNumber = 1;
      let questionCounter = 1;
      
      pages.forEach(pageQuestions => {
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Objective Questions Print</title>
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .a4-page { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; position: relative; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; }
    .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0.5; z-index: 0; pointer-events: none; }
    .watermark img { max-width: 300px; max-height: 300px; }
    .questions-section { z-index: 10; flex: 1 0 auto; padding: 0; display: flex; flex-direction: column; justify-content: flex-start; }
    
    .question-block {
        display: flex;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        flex-grow: 1;
    }
    .question-block.first {
        border-top: none;
    }
    .question-block.last {
        border-bottom: none;
    }
    .question-block + .question-block {
        margin-top: -1px;
    }
    .left-column {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        padding: 10px;
        padding-top: 40px;
        border-right: 1px solid #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
    }
    .middle-column {
        flex: 1;
        padding: 10px;
        box-sizing: border-box;
    }
    .right-column {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        border-left: 1px solid #000;
        box-sizing: border-box;
    }
    .qid-label {
        font-size: 14px;
        margin-bottom: 2px;
        font-weight: bold;
    }
    .qid-value {
        font-size: 14px;
        margin-bottom: 10px;
    }
    .marks-label {
        font-size: 14px;
        font-weight: bold;
    }

    .question-text { font-size: 16px; font-weight: 500; color: #222; margin-bottom: 8px; font-family: 'Noto Sans', 'Calibri', sans-serif; font-style: italic; }
    .options-list { margin-bottom: 8px; padding-left: 0; list-style-type: none; }
    .option-row { margin-bottom: 4px; padding: 0; font-size: 15px; font-family: 'Noto Sans', 'Calibri', sans-serif; font-weight: normal; background: none; color: #222; border-radius: 0; }
    .answer-section {
        margin-top: 10px;
        font-size: 14px;
    }
    .explanation-row { 
      margin-top: 8px;
      font-size: 13px; 
      color: #475569; 
    }

    .footer-section {
        height: 50px;
        border-top: 1px solid #000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0;
        flex: 0 0 auto;
        box-sizing: border-box;
    }
    .footer-left {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        border-right: 1px solid #000;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
    }
    .footer-middle {
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
    }
    .footer-right {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        border-left: 1px solid #000;
        height: 100%;
        box-sizing: border-box;
    }
    .page-number { font-size: 14px; color: #64748b; }
    .powered-by { font-size: 14px; color: #64748b; }
    .kitabai { font-weight: bold; color: #0ea5e9; }
  </style>
</head>
<body>
  <div class="a4-page">
    <div class="watermark">
      <img src="${customWatermark || '/LOGO_WATERMARK.png'}" alt="Watermark" />
    </div>
    ${testDetailsPage && pageNumber === 1 ? `<img src="${testDetailsPage}" style="width:100%;height:100%;object-fit:contain;" />` : ''}
    <div class="questions-section">
      ${pageQuestions.map((q, idx) => `
        <div class="question-block${idx === 0 ? ' first' : ''}${idx === pageQuestions.length - 1 ? ' last' : ''}">
            <div class="left-column">
                <div class="qid-label">Q.ID</div>
                <div class="qid-value">${q.id ? q.id.slice(-10) : 'N/A'}</div>
                <div class="marks-label">Marks: ${q.maxMarks || 0}</div>
            </div>
            <div class="middle-column">
                <div class="question-text"><b>Q${questionCounter++}:</b> ${preserveExtraSpaces(q.question)}</div>
                <ul class="options-list">
                    ${(q.options || []).map((opt, i) => `
                        <li class="option-row">${String.fromCharCode(65 + i)}. ${preserveExtraSpaces(opt)}</li>
                    `).join('')}
                </ul>
                ${printWithAnswers ? `<div class="answer-section"><b>Correct Answer:</b> ${String.fromCharCode(65 + q.correctAnswer)}</div>` : ''}
                ${q.explanation && printWithAnswers ? `<div class="explanation-row"><b>Explanation:</b> ${preserveExtraSpaces(q.explanation)}</div>` : ''}
            </div>
            <div class="right-column">
                
            </div>
        </div>
      `).join('')}
    </div>
    <div class="footer-section">
      <div class="footer-left">
        <div class="page-number">Page ${pageNumber}</div>
      </div>
      <div class="footer-middle">
        <div class="powered-by">Powered by <span class="kitabai">KitabAI</span></div>
      </div>
      <div class="footer-right"></div>
    </div>
  </div>
</body>
</html>
        `);
        pageNumber++;
      });
      printWindow.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          };
        </script>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print questions. Check the console for more details.');
    } finally {
      setPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Select Objective Questions to Print</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
              checked={printWithAnswers}
              onChange={(e) => setPrintWithAnswers(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Print questions with answers</span>
          </label>
        </div>
        <div className="space-y-4">
          {sets.map(set => (
            <div key={set.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleSetClick(set.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">{set.name}</h3>
                <span className="text-gray-500">{expandedSet === set.id ? '▼' : '▶'}</span>
              </button>
              {expandedSet === set.id && (
                <div className="p-4 border-t border-gray-200">
                  {set.questions.length > 0 ? (
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
                          onClick={() => deselectAllQuestions(set.id)}
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
                                  Marks: {question.maxMarks || 0}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Tags: {question.tags || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No questions available in this set</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
            disabled={printing}
          >
            <Download size={18} className="mr-2" />
            <span>Print Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectivePrintModal; 