import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Book, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';

const BookChaptersQRView = () => {
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { bookId } = useParams();

  useEffect(() => {
    const fetchBookAndChapters = async () => {
      setLoading(true);
      try {
        // Fetch book details
        const bookResponse = await fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}`);
        const bookData = await bookResponse.json();
        
        // Fetch chapters
        const chaptersResponse = await fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}/chapters`);
        const chaptersData = await chaptersResponse.json();
        
        if (bookData.success) {
          setBook(bookData.book);
        } else {
          setError(bookData.message || 'Failed to fetch book details');
        }
        
        if (chaptersData.success) {
          setChapters(chaptersData.chapters || []);
        } else {
          setError(chaptersData.message || 'Failed to fetch chapters');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchBookAndChapters();
  }, [bookId]);

  // Function to get complete image URL
  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // If the imageUrl is already an absolute URL (starts with http or https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Otherwise, assume it's a relative path and prepend the backend URL
    return `https://aipbbackend-c5ed.onrender.com/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4 lg:w-1/5">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
              {book?.coverImage ? (
                <img 
                  src={getCompleteImageUrl(book.coverImage)} 
                  alt={book.title} 
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Book size={64} className="mx-auto text-indigo-400" />
                </div>
              )}
            </div>
          </div>
          <div className="md:w-3/4 lg:w-4/5">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{book?.title}</h1>
            <p className="text-gray-700 mb-4">{book?.description || 'No description available'}</p>
            <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chapters</h2>
        {chapters.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No chapters available</h3>
            <p className="text-gray-600">This book doesn't have any chapters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {chapters
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((chapter) => (
                <div 
                  key={chapter._id}
                  className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-full mr-4 flex-shrink-0">
                      <FileText size={22} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{chapter.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{chapter.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      <div className="text-center mt-8 text-gray-500 text-sm">
        <p>This information is provided via QR code scan.</p>
        <p className="mt-1">Scan date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default BookChaptersQRView;