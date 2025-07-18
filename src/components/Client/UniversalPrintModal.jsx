import React, { useState, useEffect } from 'react';
import { X, Check, Download } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const UniversalPrintModal = ({ isOpen, onClose, topicId }) => {
  // Subjective
  const [subjectiveSets, setSubjectiveSets] = useState([]);
  const [subjectiveSelected, setSubjectiveSelected] = useState({});
  const [subjectiveExpanded, setSubjectiveExpanded] = useState(null);
  // Objective
  const [objectiveSets, setObjectiveSets] = useState([]);
  const [objectiveSelected, setObjectiveSelected] = useState({});
  const [objectiveExpanded, setObjectiveExpanded] = useState(null);
  // Print Options
  const [includeBlankPages, setIncludeBlankPages] = useState(false);
  const [blankPagesCount, setBlankPagesCount] = useState(1);
  const [questionBlankPages, setQuestionBlankPages] = useState({});
  const [printWithAnswers, setPrintWithAnswers] = useState(false);
  const [customWatermark, setCustomWatermark] = useState(null);
  const [testDetailsPage, setTestDetailsPage] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [loadingSubjective, setLoadingSubjective] = useState(false);
  const [loadingObjective, setLoadingObjective] = useState(false);

  // Fetch subjective sets/questions from API
  useEffect(() => {
    if (isOpen && topicId) {
      setLoadingSubjective(true);
      const fetchSubjective = async () => {
        try {
          const token = Cookies.get('usertoken');
          if (!token) return;
          const res = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            // For each set, fetch its questions
            const setsWithQuestions = await Promise.all((data.sets || []).map(async set => {
              const questionIds = set.questions || [];
              const questions = await Promise.all(questionIds.map(async (qid) => {
                try {
                  const qres = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/questions/${qid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const qdata = await qres.json();
                  if (qdata.success && qdata.data) return { ...qdata.data, id: qid };
                } catch {}
                return null;
              }));
              return { ...set, questions: questions.filter(Boolean) };
            }));
            setSubjectiveSets(setsWithQuestions);
          } else {
            setSubjectiveSets([]);
          }
        } catch {
          setSubjectiveSets([]);
        } finally {
          setLoadingSubjective(false);
        }
      };
      fetchSubjective();
    }
  }, [isOpen, topicId]);

  // Fetch objective sets/questions from localStorage
  useEffect(() => {
    if (isOpen && topicId) {
      setLoadingObjective(true);
      const setsKey = `objective_sets_${topicId}`;
      const setsData = localStorage.getItem(setsKey);
      let parsedSets = [];
      try {
        parsedSets = setsData ? JSON.parse(setsData) : [];
      } catch {
        parsedSets = [];
      }
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
      setObjectiveSets(setsWithQuestions);
      setLoadingObjective(false);
    }
  }, [isOpen, topicId]);

  // Selection logic (subjective)
  const toggleSubjective = (setId, qid) => {
    setSubjectiveSelected(prev => {
      const newSel = { ...prev };
      if (!newSel[setId]) newSel[setId] = [];
      const idx = newSel[setId].indexOf(qid);
      if (idx === -1) newSel[setId].push(qid);
      else newSel[setId] = newSel[setId].filter(id => id !== qid);
      if (newSel[setId].length === 0) delete newSel[setId];
      return newSel;
    });
  };
  const selectAllSubjective = (setId, questions) => setSubjectiveSelected(prev => ({ ...prev, [setId]: questions.map(q => q.id) }));
  const deselectAllSubjective = (setId, questions) => setSubjectiveSelected(prev => { const n = { ...prev }; delete n[setId]; return n; });

  // Selection logic (objective)
  const toggleObjective = (setId, qid) => {
    setObjectiveSelected(prev => {
      const newSel = { ...prev };
      if (!newSel[setId]) newSel[setId] = [];
      const idx = newSel[setId].indexOf(qid);
      if (idx === -1) newSel[setId].push(qid);
      else newSel[setId] = newSel[setId].filter(id => id !== qid);
      if (newSel[setId].length === 0) delete newSel[setId];
      return newSel;
    });
  };
  const selectAllObjective = (setId, questions) => setObjectiveSelected(prev => ({ ...prev, [setId]: questions.map(q => q.id) }));
  const deselectAllObjective = (setId, questions) => setObjectiveSelected(prev => { const n = { ...prev }; delete n[setId]; return n; });

  // Watermark/Test Details
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

  // Print logic (unified for both types, but with type-specific layouts)
  const handlePrint = async () => {
    if (Object.keys(subjectiveSelected).length === 0 && Object.keys(objectiveSelected).length === 0) {
      toast.error('Please select at least one question to print');
      return;
    }
    setPrinting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Failed to open print window');
      let currentPageNumber = 1;
      let questionCounter = 1;

      // --- Test Details Page (shared) ---
      if (testDetailsPage) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html><head><title>Test Details</title><style>@page { size: A4; margin: 0; } body { margin: 0; padding: 0; } .a4-page { width: 210mm; height: 297mm; margin: 0 auto; background: white; position: relative; }</style></head><body><div class="a4-page"><img src="${testDetailsPage}" style="width: 100%; height: 100%; object-fit: contain;" /></div></body></html>
        `);
        currentPageNumber++;
      }

      // --- SUBJECTIVE PRINT (AISWB STYLE, SEPARATE LEFT COLUMNS) ---
      // Helper: generatePageHTML (refactored for separate left-column and left-sidebar)
      const generateSubjectivePageHTML = ({
        pageNumber, question, questionCounter, keywords, qrCode, shortQuestionId, answerContent, isAnswerPage = false, answerPageNumber = 1, totalAnswerPages = 1, isBlankPage = false
      }) => `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${isAnswerPage ? 'Answer' : 'Question'} ${pageNumber}</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; position: relative; width: 210mm; min-height: 297mm; }
            .a4-page { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; position: relative; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; }
            .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0.5; z-index: 0; pointer-events: none; }
            .watermark img { max-width: 300px; max-height: 300px; }
            .top-section { display: flex; border-bottom: 1px solid #000; min-height: 130px; flex: 0 0 auto; }
            .left-column { width: 120px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .qid-label { font-size: 14px; text-align: center; display: block; width: 100%; margin-bottom: 2px; }
            .qid-value { font-size: 14px; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; width: 90%; text-align: center; }
            .level-label { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; }
            .middle-column { flex: 1; overflow: visible; padding: 10px; }
            .right-column { width: 120px; border-left: 1px solid #000; display: flex; justify-content: center; align-items: center; }
            .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 10px; box-sizing: border-box; }
            .scan-text { font-size: 8px; text-align: center; margin-top: 3px; font-weight: bold; }
            .topic-section { padding: 10px; display: flex; flex-direction: column; overflow: visible; word-wrap: break-word; height: auto; }
            .topic-value { color: #00b0f0; font-size: 18px; font-weight: bold; display: flex; align-items: flex-start; flex-wrap: wrap; min-height: 60px; text-align: justify; margin-top: 5px; gap: 5px; }
            .question-preview { font-size: 16px; font-weight: bold; color: #333; white-space: normal; overflow: visible; text-overflow: unset; max-width: 100%; word-wrap: break-word; hyphens: auto; text-align: justify; font-family: 'Noto Sans', 'Calibri', sans-serif; font-style: italic; }
            .question-preview pre { white-space: pre-wrap; font-family: inherit; }
            .answer-page-indicator { font-size: 12px; color: #666; margin-bottom: 10px; }
            .middle-section { display: flex; flex: 1 1 auto; min-height: 150px; overflow: visible; }
            .left-sidebar { width: 120px; border-right: 1px solid #000; padding: 20px 0px 0px 0px; position: relative; text-align: center; display: flex; flex-direction: column; }
            .level-label1 { color: #00b0f0; font-size: 14px; font-weight: bold; text-align: center; display: block; width: 100%; margin-bottom: 5px; }
            .keywords-label { font-style: italic; margin-bottom: 10px; font-weight: bold;}
            .keywords-list { font-size: 12px; }
            .keyword-item { margin-bottom: 5px; }
            .content-area { flex: 1; padding: 20px; position: relative; display: flex; flex-direction: column; overflow: visible; min-height: 100px; height: auto; }
            .right-sidebar { width: 120px; border-left: 1px solid #000; padding: 20px 0px 0px 0px; position: relative; text-align: center; }
            .footer-section { height: 50px; border-top: 1px solid #000; display: flex; align-items: center; justify-content: space-between; padding: 0; flex: 0 0 auto; }
            .footer-left { width: 120px; border-right: 1px solid #000; height: 100%; display: flex; justify-content: center; align-items: center; }
            .footer-middle { flex: 1; height: 100%; display: flex; justify-content: center; align-items: center; }
            .footer-right { width: 120px; border-left: 1px solid #000; height: 100%; }
            .page-number { font-size: 14px; text-align: center; }
            .powered-by { font-size: 14px; text-align: center; }
            .kitabai { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="a4-page">
            <div class="watermark">
              <img src="${customWatermark || '/LOGO_WATERMARK.png'}" alt="Watermark" />
            </div>
            <div class="top-section">
              <div class="left-column">
                <div class="qid-value">
                  <div class="qid-label">Q.ID</div>
                  ${shortQuestionId}
                </div>
                <div class="level-label">${question.metadata?.difficultyLevel || 'level1'}<br>(${question.metadata?.wordLimit || 'level1'} words)</div>
              </div>
              <div class="middle-column">
                <div class="topic-section">
                  <div class="topic-value">
                    ${isBlankPage ? '' : (isAnswerPage ? `<div class="answer-page-indicator">Answer Page ${answerPageNumber} of ${totalAnswerPages}</div>` : `<span class="question-preview"><pre style="margin: 0; font-family: inherit;"><span style="color: #00b0f0; margin-right: 5px;">Q${questionCounter}:</span>${question.question}</pre></span>`) }
                  </div>
                </div>
              </div>
              <div class="right-column">
                <div class="qr-section">
                  ${isBlankPage ? '' : (qrCode ? `<img src="${qrCode}" alt="QR Code" style="width: 100px; height: 100px;" /><div class="scan-text">SCAN to Upload Answer</div>` : '')}
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
                ${isBlankPage ? '' : (answerContent ? `<div style="font-size: 14px; line-height: 1.4; font-family: 'Noto Sans', 'Calibri', sans-serif;">${!isAnswerPage ? '<div style="font-weight: bold; color: #00b0f0; margin-bottom: 8px;">Answer:</div>' : ''}<div style="text-align: justify; white-space: pre-wrap;">${answerContent}</div></div>` : '')}
              </div>
              <div class="right-sidebar"></div>
            </div>
            <div class="footer-section">
              <div class="footer-left"><div class="page-number">${pageNumber}</div></div>
              <div class="footer-middle"><div class="powered-by">Powered by <span class="kitabai">KitabAI</span></div></div>
              <div class="footer-right"></div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Helper: splitContentWithVisualSpace (copied from AISWBPrintModal)
      const splitContentWithVisualSpace = (questionText, answerText, maxAnswerChars = 2000) => {
        if (!answerText) return [];
        const charsPerLine = 82;
        const lines = answerText.split('\n');
        let totalVisualSpace = 0;
        const questionLength = questionText ? questionText.length : 0;
        const questionVisualSpace = questionLength;
        const availableSpace = 2200 - questionVisualSpace;
        const firstPageAnswerSpace = Math.min(1500, availableSpace);
        const words = answerText.split(' ');
        let currentPage = '';
        let isFirstPage = true;
        const pages = [];
        for (const word of words) {
          const testPage = currentPage + (currentPage ? ' ' : '') + word;
          const maxCharsForCurrentPage = isFirstPage ? firstPageAnswerSpace : maxAnswerChars;
          if (testPage.length > maxCharsForCurrentPage && currentPage) {
            pages.push(currentPage.trim());
            currentPage = word;
            isFirstPage = false;
          } else {
            currentPage = testPage;
          }
        }
        if (currentPage.trim()) {
          pages.push(currentPage.trim());
        }
        return pages;
      };

      // Helper: generate QR code for subjective (copied from AISWBPrintModal)
      const generateQRCodeForQuestion = async (questionId) => {
        try {
          const token = Cookies.get('usertoken');
          if (!token) return null;
          const queryParams = new URLSearchParams({ format: 'json', size: 300, includeAnswers: true }).toString();
          const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/qr/questions/${questionId}/qrcode?${queryParams}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' }
          });
          if (!response.ok) return null;
          const data = await response.json();
          if (data.success && data.data && data.data.qrCode) return data.data.qrCode;
          return null;
        } catch { return null; }
      };

      // --- Print Subjective ---
      for (const [setId, questionIds] of Object.entries(subjectiveSelected)) {
        const set = subjectiveSets.find(s => s.id === setId);
        if (!set) continue;
        for (const questionId of questionIds) {
          const question = set.questions.find(q => q.id === questionId);
          if (!question) continue;
          const keywords = (question.metadata?.keywords || []).slice(0, 10);
          const qrCode = await generateQRCodeForQuestion(questionId);
          const shortQuestionId = question.id ? question.id.slice(-10) : '';
          if (printWithAnswers && question.detailedAnswer) {
            const answerPages = splitContentWithVisualSpace(question.question, question.detailedAnswer, 2000);
            printWindow.document.write(generateSubjectivePageHTML({
              pageNumber: currentPageNumber,
              question,
              questionCounter,
              keywords,
              qrCode,
              shortQuestionId,
              answerContent: answerPages[0],
              isAnswerPage: false,
              answerPageNumber: 1,
              totalAnswerPages: answerPages.length
            }));
            currentPageNumber++;
            for (let i = 1; i < answerPages.length; i++) {
              printWindow.document.write(generateSubjectivePageHTML({
                pageNumber: currentPageNumber,
                question,
                questionCounter,
                keywords,
                qrCode: null,
                shortQuestionId,
                answerContent: answerPages[i],
                isAnswerPage: true,
                answerPageNumber: i + 1,
                totalAnswerPages: answerPages.length
              }));
              currentPageNumber++;
            }
          } else {
            printWindow.document.write(generateSubjectivePageHTML({
              pageNumber: currentPageNumber,
              question,
              questionCounter,
              keywords,
              qrCode,
              shortQuestionId,
              answerContent: null,
              isAnswerPage: false,
              answerPageNumber: 1,
              totalAnswerPages: 1
            }));
          currentPageNumber++;
          }
          questionCounter++;
          if (includeBlankPages) {
            const pagesToAdd = questionBlankPages[questionId] ?? blankPagesCount;
            for (let i = 0; i < pagesToAdd; i++) {
              printWindow.document.write(generateSubjectivePageHTML({
                pageNumber: currentPageNumber,
                question,
                questionCounter,
                keywords,
                qrCode: null,
                shortQuestionId,
                answerContent: null,
                isAnswerPage: false,
                answerPageNumber: 1,
                totalAnswerPages: 1,
                isBlankPage: true
              }));
              currentPageNumber++;
            }
          }
        }
      }

      // --- OBJECTIVE PRINT (ObjectivePrintModal STYLE) ---
      // Helper: preserveExtraSpaces (copied from ObjectivePrintModal)
      const preserveExtraSpaces = (text) => text ? text.replace(/ {2,}/g, (match) => ' ' + '&nbsp;'.repeat(match.length - 1)) : '';
      // Gather all selected objective questions
      const allObjectiveSelected = [];
      Object.entries(objectiveSelected).forEach(([setId, qids]) => {
        const set = objectiveSets.find(s => s.id === setId);
        if (!set) return;
        qids.forEach(qid => {
          const q = set.questions.find(qq => qq.id === qid);
          if (q) allObjectiveSelected.push({ ...q, setName: set.name });
        });
      });
      // Dynamic pagination by height (copied from ObjectivePrintModal)
      const A4_PAGE_HEIGHT_PX = 1050;
      const pages = [];
      let currentPageQuestions = [];
      let currentPageHeight = 0;
      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.width = '210mm';
      document.body.appendChild(hiddenContainer);
      for (const q of allObjectiveSelected) {
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
      // Write each objective page (copied from ObjectivePrintModal)
      let pageNumber = currentPageNumber;
      let objQuestionCounter = 1;
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
    .question-block { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; flex-grow: 1; }
    .question-block.first { border-top: none; }
    .question-block.last { border-bottom: none; }
    .question-block + .question-block { margin-top: -1px; }
    .left-column { width: 120px; min-width: 120px; max-width: 120px; padding: 10px; padding-top: 40px; border-right: 1px solid #000; display: flex; flex-direction: column; align-items: center; text-align: center; box-sizing: border-box; }
    .middle-column { flex: 1; padding: 10px; box-sizing: border-box; }
    .right-column { width: 120px; min-width: 120px; max-width: 120px; border-left: 1px solid #000; box-sizing: border-box; }
    .qid-label { font-size: 14px; margin-bottom: 2px; font-weight: bold; }
    .qid-value { font-size: 14px; margin-bottom: 10px; }
    .marks-label { font-size: 14px; font-weight: bold; }
    .question-text { font-size: 16px; font-weight: 500; color: #222; margin-bottom: 8px; font-family: 'Noto Sans', 'Calibri', sans-serif; font-style: italic; }
    .options-list { margin-bottom: 8px; padding-left: 0; list-style-type: none; }
    .option-row { margin-bottom: 4px; padding: 0; font-size: 15px; font-family: 'Noto Sans', 'Calibri', sans-serif; font-weight: normal; background: none; color: #222; border-radius: 0; }
    .answer-section { margin-top: 10px; font-size: 14px; }
    .explanation-row { margin-top: 8px; font-size: 13px; color: #475569; }
    .footer-section { height: 50px; border-top: 1px solid #000; display: flex; align-items: center; justify-content: space-between; padding: 0; flex: 0 0 auto; box-sizing: border-box; }
    .footer-left { width: 120px; min-width: 120px; max-width: 120px; border-right: 1px solid #000; height: 100%; display: flex; justify-content: center; align-items: center; box-sizing: border-box; }
    .footer-middle { flex: 1; height: 100%; display: flex; justify-content: center; align-items: center; box-sizing: border-box; }
    .footer-right { width: 120px; min-width: 120px; max-width: 120px; border-left: 1px solid #000; height: 100%; box-sizing: border-box; }
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
    <div class="questions-section">
      ${pageQuestions.map((q, idx) => `
        <div class="question-block${idx === 0 ? ' first' : ''}${idx === pageQuestions.length - 1 ? ' last' : ''}">
            <div class="left-column">
                <div class="qid-label">Q.ID</div>
                <div class="qid-value">${q.id ? q.id.slice(-10) : 'N/A'}</div>
                <div class="marks-label">Marks: ${q.maxMarks || 0}</div>
            </div>
            <div class="middle-column">
                <div class="question-text"><b>Q${objQuestionCounter++}:</b> ${preserveExtraSpaces(q.question)}</div>
                <ul class="options-list">
                    ${(q.options || []).map((opt, i) => `<li class="option-row">${String.fromCharCode(65 + i)}. ${preserveExtraSpaces(opt)}</li>`).join('')}
                </ul>
                ${printWithAnswers ? `<div class="answer-section"><b>Correct Answer:</b> ${String.fromCharCode(65 + q.correctAnswer)}</div>` : ''}
                ${q.explanation && printWithAnswers ? `<div class="explanation-row"><b>Explanation:</b> ${preserveExtraSpaces(q.explanation)}</div>` : ''}
            </div>
            <div class="right-column"></div>
                  </div>
                `).join('')}
              </div>
    <div class="footer-section">
      <div class="footer-left"><div class="page-number">Page ${pageNumber}</div></div>
      <div class="footer-middle"><div class="powered-by">Powered by <span class="kitabai">KitabAI</span></div></div>
      <div class="footer-right"></div>
              </div>
              </div>
</body>
</html>
        `);
        pageNumber++;
      });

      // --- Print End ---
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
      toast.error('Failed to print questions');
    } finally {
      setPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Select Questions to Print (Universal)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        {/* Print Options */}
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
            <span className="text-gray-700">Include blank pages after each subjective question</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={printWithAnswers}
              onChange={(e) => setPrintWithAnswers(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Print questions with answers</span>
          </label>
          {includeBlankPages && (
            <div className="ml-7 mt-2">
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
        {/* Subjective Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-2">Subjective Sets</h3>
          {loadingSubjective ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
          <div className="space-y-4">
            {subjectiveSets.map(set => (
              <div key={set.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setSubjectiveExpanded(subjectiveExpanded === set.id ? null : set.id)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-gray-800">{set.name}</h4>
                  <span className="text-gray-500">{subjectiveExpanded === set.id ? '▼' : '▶'}</span>
                </button>
                {subjectiveExpanded === set.id && (
                  <div className="p-4 border-t border-gray-200">
                    {set.questions.length > 0 ? (
                      <>
                        <div className="flex justify-end mb-2 space-x-2">
                          <button
                            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                            onClick={() => selectAllSubjective(set.id, set.questions)}
                            disabled={set.questions.length === 0}
                          >
                            Select All
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                              onClick={() => deselectAllSubjective(set.id, set.questions)}
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
                                onClick={() => toggleSubjective(set.id, question.id)}
                                className={`mt-1 p-1 rounded-full transition-colors ${
                                  subjectiveSelected[set.id]?.includes(question.id)
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
                                    Marks: {question.metadata?.maximumMarks || 0}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Keywords: {Array.isArray(question.metadata?.keywords) ? question.metadata.keywords.join(', ') : question.metadata?.keywords || 'N/A'}
                                  </span>
                                </div>
                                {subjectiveSelected[set.id]?.includes(question.id) && includeBlankPages && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Blank pages:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={questionBlankPages[question.id] ?? blankPagesCount}
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
        {/* Objective Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Objective Sets</h3>
          {loadingObjective ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
          <div className="space-y-4">
            {objectiveSets.map(set => (
              <div key={set.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setObjectiveExpanded(objectiveExpanded === set.id ? null : set.id)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-gray-800">{set.name}</h4>
                  <span className="text-gray-500">{objectiveExpanded === set.id ? '▼' : '▶'}</span>
                </button>
                {objectiveExpanded === set.id && (
                  <div className="p-4 border-t border-gray-200">
                    {set.questions.length > 0 ? (
                      <>
                        <div className="flex justify-end mb-2 space-x-2">
                          <button
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            onClick={() => selectAllObjective(set.id, set.questions)}
                            disabled={set.questions.length === 0}
                          >
                            Select All
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                              onClick={() => deselectAllObjective(set.id, set.questions)}
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
                                onClick={() => toggleObjective(set.id, question.id)}
                                className={`mt-1 p-1 rounded-full transition-colors ${
                                  objectiveSelected[set.id]?.includes(question.id)
                                    ? 'bg-green-600 text-white hover:bg-green-700'
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
          )}
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

export default UniversalPrintModal; 