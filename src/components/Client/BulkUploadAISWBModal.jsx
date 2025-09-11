import React, { useState } from 'react';
import { X, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const BulkUploadAISWBModal = ({ isOpen, onClose, topicId, existingSets = [], onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrors([]);
    setProgress('');
    setSuccessCount(0);
  };

  const handleDownloadSample = () => {
    window.open('/sample-subjective-upload.xlsx', '_blank');
  };

  // Helper: Find set by name (case-insensitive)
  const findSetByName = (name) => {
    return existingSets.find(
      (set) => set.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  // Helper: Create set via API
  const createSet = async (setName) => {
    const token = Cookies.get('usertoken');
    const response = await fetch(
      `https://test.ailisher.com/api/aiswb/topic/${topicId}/sets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: setName }),
      }
    );
    const data = await response.json();
    if (data.success && data.set) return data.set;
    throw new Error(data.message || 'Failed to create set');
  };

  // Helper: Create question via API
  const createQuestion = async (setId, questionObj) => {
    const token = Cookies.get('usertoken');
    const response = await fetch(
      `https://test.ailisher.com/api/aiswb/topic/${topicId}/sets/${setId}/questions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questionObj),
      }
    );
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Invalid JSON response', text: await response.text() };
    }
    console.log('[BulkUpload] API response for question:', { status: response.status, data });
    if (data.success) return true;
    throw new Error(data.message || 'Failed to add question');
  };

  // Main upload handler
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file first.');
      return;
    }
    setParsing(true);
    setUploading(false);
    setProgress('Parsing Excel...');
    setErrors([]);
    setSuccessCount(0);
    try {
      // Parse Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      console.log('[BulkUpload] Parsed Excel rows:', rows);
      if (!rows.length) throw new Error('Excel file is empty.');
      // Group by set name
      const setsMap = {};
      rows.forEach((row, idx) => {
        const setName = row['Set Name']?.trim();
        if (!setName) return;
        if (!setsMap[setName]) setsMap[setName] = [];
        setsMap[setName].push({ ...row, _rowNum: idx + 2 }); // Excel rows are 1-indexed, + header
      });
      console.log('[BulkUpload] Grouped sets:', setsMap);
      setParsing(false);
      setUploading(true);
      setProgress('Uploading sets and questions...');
      let totalSuccess = 0;
      let errorList = [];
      // Sequentially process each set
      for (const setName of Object.keys(setsMap)) {
        let setObj = findSetByName(setName);
        // If set does not exist, create it
        if (!setObj) {
          try {
            setProgress(`Creating set: ${setName}`);
            console.log(`[BulkUpload] Creating set: ${setName}`);
            setObj = await createSet(setName);
            console.log(`[BulkUpload] Set created:`, setObj);
            if (onUploadComplete) onUploadComplete('set', setObj);
            // Add delay after set creation
            console.log('[BulkUpload] Waiting 2000ms after set creation before adding questions...');
            await new Promise(res => setTimeout(res, 2000));
          } catch (err) {
            console.error(`[BulkUpload] Error creating set '${setName}':`, err.message);
            errorList.push({ type: 'set', set: setName, error: err.message });
            continue; // Skip questions for this set
          }
        } else {
          console.log(`[BulkUpload] Set already exists:`, setObj);
        }
        // For each question in this set, sequentially
        for (const q of setsMap[setName]) {
          // Prepare question object as per AddAISWBModal.jsx
          try {
            setProgress(`Adding question to set: ${setName}`);
            const questionObj = {
              question: q['Question'] || '',
              detailedAnswer: q['Detailed Answer'] || '',
              metadata: {
                keywords: (q['Keywords'] || '').split(',').map(k => k.trim()).filter(Boolean),
                difficultyLevel: q['Difficulty Level'] || 'level1',
                wordLimit: parseInt(q['Word Limit']) || 0,
                estimatedTime: parseInt(q['Estimated Time']) || 0,
                maximumMarks: parseInt(q['Maximum Marks']) || 0,
                qualityParameters: {
                  intro: (q['Quality Parameters'] || '').toLowerCase().includes('intro'),
                  body: {
                    enabled: (q['Quality Parameters'] || '').toLowerCase().includes('body'),
                    features: (q['Quality Parameters'] || '').toLowerCase().includes('features'),
                    examples: (q['Quality Parameters'] || '').toLowerCase().includes('examples'),
                    facts: (q['Quality Parameters'] || '').toLowerCase().includes('facts'),
                    diagram: (q['Quality Parameters'] || '').toLowerCase().includes('diagram'),
                  },
                  conclusion: (q['Quality Parameters'] || '').toLowerCase().includes('conclusion'),
                  customParams: (q['Quality Parameters'] || '').split(',').map(p => p.trim()).filter(p => !['intro','body','features','examples','facts','diagram','conclusion'].includes(p.toLowerCase()) && p)
                }
              },
              modalAnswer: q['Modal Answer'] || '',
              languageMode: q['Language Mode'] || 'english',
              answerVideoUrls: (q['Answer Video URLs'] || '').split(',').map(url => url.trim()).filter(Boolean),
              evaluationMode: q['Evaluation Mode'] || 'auto',
              ...(q['Evaluation Mode'] === 'manual' && q['Evaluation Type']
                ? { evaluationType: q['Evaluation Type'] }
                : {})
            };
            if (!questionObj.question) throw new Error('Question is required (row ' + q._rowNum + ')');
            console.log(`[BulkUpload] Adding question to set '${setName}' (setId: ${setObj.id}):`, questionObj);
            const result = await createQuestion(setObj.id, questionObj);
            console.log(`[BulkUpload] Question added to set '${setName}' (row ${q._rowNum}):`, result);
            totalSuccess++;
          } catch (err) {
            console.error(`[BulkUpload] Error adding question to set '${setName}' (row ${q._rowNum}):`, err.message);
            errorList.push({ type: 'question', set: setName, row: q._rowNum, error: err.message });
          }
        }
        console.log(`[BulkUpload] Finished processing set: ${setName}`);
      }
      setSuccessCount(totalSuccess);
      setErrors(errorList);
      setProgress('Upload complete.');
      if (onUploadComplete) onUploadComplete('done');
      toast.success(`Bulk upload complete. ${totalSuccess} questions added.`);
      console.log(`[BulkUpload] Upload complete. Total questions added: ${totalSuccess}`);
      if (errorList.length > 0) {
        console.warn('[BulkUpload] Errors:', errorList);
      }
    } catch (err) {
      setProgress('');
      setErrors([{ type: 'fatal', error: err.message }]);
      toast.error('Bulk upload failed: ' + err.message);
      console.error('[BulkUpload] Fatal error:', err.message);
    } finally {
      setParsing(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Bulk Upload Subjective Sets & Questions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc pl-6 text-sm text-gray-700">
            <li>Download the sample Excel file and fill your data in the same format.</li>
            <li>Each row represents a question. "Set Name" column is required for grouping.</li>
            <li>Columns: Set Name, Question, Detailed Answer, Keywords, Difficulty Level, Word Limit, Estimated Time, Maximum Marks, Quality Parameters, Modal Answer, Language Mode, Answer Video URLs, Evaluation Mode, Evaluation Type.</li>
            <li>For all questions, <b>Evaluation Mode</b> should be <b>manual</b> and <b>Evaluation Type</b> should be <b>with annotation</b>.</li>
            <li>Quality Parameters: comma separated (e.g. intro,body,features,examples,conclusion,custom1)</li>
            <li>Leave optional fields blank if not needed.</li>
          </ul>
          <button onClick={handleDownloadSample} className="mt-2 flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
            <Download size={16} className="mr-2" /> Download Sample Excel
          </button>
        </div>
        <div className="mb-4">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mb-2" />
          <button
            onClick={handleUpload}
            disabled={!file || parsing || uploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload size={16} className="mr-2" />
            {parsing ? 'Parsing...' : uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {progress && <div className="mb-2 text-sm text-blue-700">{progress}</div>}
        {successCount > 0 && <div className="mb-2 text-green-700">{successCount} questions added successfully.</div>}
        {errors.length > 0 && (
          <div className="mb-2 text-red-700">
            <div>Errors:</div>
            <ul className="list-disc pl-6">
              {errors.map((err, idx) => (
                <li key={idx}>
                  {err.type === 'set' && <span>Set <b>{err.set}</b>: {err.error}</span>}
                  {err.type === 'question' && <span>Set <b>{err.set}</b>, Row {err.row}: {err.error}</span>}
                  {err.type === 'fatal' && <span>{err.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadAISWBModal; 