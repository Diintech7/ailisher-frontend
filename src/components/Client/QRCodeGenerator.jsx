import React, { useState } from 'react';
import { QrCode, Download, X, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const QRCodeGenerator = ({ questionId, question }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [format, setFormat] = useState('json');
  const [size, setSize] = useState(300);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [error, setError] = useState(null);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        format,
        size,
        includeAnswers
      }).toString();
      
      // Use the correct API endpoint based on documentation
      const response = await fetch(`https://test.ailisher.com/api/aiswb/qr/questions/${questionId}/qrcode?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error(`Failed to generate QR code: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data && data.data.qrCode) {
        setQrCode(data.data.qrCode);
        toast.success('QR code generated successfully!');
      } else {
        throw new Error('Invalid QR code data received from server');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError(error.message || 'Failed to generate QR code. Please try again.');
      toast.error(error.message || 'Failed to generate QR code. Please try again.');
      
      // Generate a fallback QR code
      generateFallbackQR();
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackQR = () => {
    try {
      // Create a basic data object
      const questionData = {
        id: questionId,
        type: 'aiswb-question'
      };
      
      // Create content based on format
      let qrContent;
      
      if (format === 'text') {
        qrContent = `AISWB Question ID: ${questionId}`;
      } else if (format === 'url') {
        qrContent = `https://test.ailisher.com/view/questions/${questionId}`;
      } else {
        // Default to JSON
        qrContent = JSON.stringify(questionData);
      }
      
      // Use QRServer API as a fallback
      const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}`;
      
      setQrCode(qrCodeURL);
      toast.warning('Using fallback QR code generator. Some features may be limited.');
    } catch (error) {
      console.error('Error generating fallback QR:', error);
      toast.error('Failed to generate fallback QR code.');
    }
  };

  const downloadQRCode = async () => {
    if (!qrCode) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(qrCode);
      const blob = await response.blob();
      
      // Create a canvas to convert PNG to JPEG
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG with high quality
          canvas.toBlob((jpegBlob) => {
            const blobUrl = URL.createObjectURL(jpegBlob);
            
            // Create download link
      const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `question-${questionId}-qrcode.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(blobUrl);
            URL.revokeObjectURL(img.src);
            resolve();
          }, 'image/jpeg', 1.0); // Maximum quality
        };
      });
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code. Please try again.');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100"
        title="QR Code Settings"
      >
        <Settings size={20} />
      </button>
      
      <button
        onClick={generateQRCode}
        disabled={isLoading}
        className="p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100"
        title="Generate QR Code"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
        ) : (
        <QrCode size={20} />
        )}
      </button>

      {qrCode && (
        <button
          onClick={downloadQRCode}
          className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-full hover:bg-gray-100"
          title="Download QR Code"
        >
          <Download size={20} />
        </button>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">QR Code Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="json">JSON</option>
                  <option value="url">URL</option>
                  <option value="text">Text</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (px)</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Math.max(100, Math.min(1000, parseInt(e.target.value) || 300)))}
                  min="100"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Answers</span>
                </label>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    generateQRCode();
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Apply & Generate QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">QR Code Generated</h3>
              <button
                onClick={() => setQrCode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={qrCode}
                alt="Question QR Code"
                className="w-64 h-64 object-contain mb-4"
              />
              <div className="w-full bg-gray-50 p-3 rounded-md text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Format:</span>
                  <span className="text-indigo-600 font-medium">{format.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-700 font-medium">Size:</span>
                  <span className="text-indigo-600 font-medium">{size}px</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-700 font-medium">Include Answers:</span>
                  <span className="text-indigo-600 font-medium">{includeAnswers ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center w-full justify-center"
              >
                <Download size={16} className="mr-2" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Error</h3>
              <button
                onClick={() => setError(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-center">
              <div className="text-red-500 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-gray-600 text-sm mb-4">A fallback QR code has been generated, but it may have limited functionality.</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator; 