import React, { useState, useEffect } from 'react';
import { QrCode, Download, Share2, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const QRCodeModal = ({ isOpen, onClose, bookId, bookTitle }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && bookId) {
      fetchQRCode();
    }
  }, [isOpen, bookId]);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/qrcode/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrCodeData(data);
      } else {
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeData?.qrCodeDataURL) return;
    
    // Create a link element
    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeDataURL;
    link.download = `${bookTitle || 'book'}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded successfully!');
  };

  const handleShare = async () => {
    if (!qrCodeData?.qrCodeDataURL) return;
    
    try {
      if (navigator.share) {
        // Convert data URL to blob
        const fetchResponse = await fetch(qrCodeData.qrCodeDataURL);
        const blob = await fetchResponse.blob();
        
        // Create file from blob
        const file = new File([blob], `${bookTitle || 'book'}-qrcode.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `QR Code for ${bookTitle || 'Book'}`,
          text: `Scan this QR code to access ${bookTitle || 'the book'} content.`,
          files: [file]
        });
        
        toast.success('QR code shared successfully!');
      } else {
        // Fallback for browsers that don't support the Web Share API
        toast.info('Sharing is not supported in this browser. You can download the QR code instead.');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('Failed to share QR code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Book QR Code</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: qrCodeData?.qrCodeColor || '#0047AB' }}
            ></div>
            <p className="text-gray-700 font-medium">Book QR Code</p>
          </div>
          
          <p className="text-gray-700 mb-2">
            Scan this QR code to access the book content. It includes:
          </p>
          {qrCodeData && (
            <ul className="list-disc list-inside text-gray-600 text-sm mb-4">
              <li>Book information</li>
              <li>{qrCodeData.chaptersCount} chapter{qrCodeData.chaptersCount !== 1 ? 's' : ''}</li>
              <li>{qrCodeData.datastoreItemsCount} datastore item{qrCodeData.datastoreItemsCount !== 1 ? 's' : ''}</li>
            </ul>
          )}
        </div>
        
        <div className="flex justify-center mb-6">
          {loading ? (
            <div className="bg-gray-100 rounded-lg h-64 w-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
              <p className="text-red-600 text-center">{error}</p>
              <button 
                onClick={fetchQRCode}
                className="mt-3 text-indigo-600 hover:text-indigo-800 mx-auto block"
              >
                Try Again
              </button>
            </div>
          ) : qrCodeData?.qrCodeDataURL ? (
            <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <img 
                src={qrCodeData.qrCodeDataURL} 
                alt="Book QR Code" 
                className="h-64 w-64 object-contain"
              />
            </div>
          ) : null}
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDownload}
            disabled={!qrCodeData?.qrCodeDataURL || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center disabled:bg-indigo-300"
          >
            <Download size={16} className="mr-2" />
            Download
          </button>
          
          <button
            onClick={handleShare}
            disabled={!qrCodeData?.qrCodeDataURL || loading || !navigator.canShare}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center disabled:bg-gray-300"
          >
            <Share2 size={16} className="mr-2" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;