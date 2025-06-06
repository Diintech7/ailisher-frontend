import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ChevronRight, Plus, Database, ArrowLeft, Trash2, Edit, AlertTriangle, Book, X, MessageSquare, Settings, QrCode } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PDFSplitter from './PDFSplitter';
import QRCodeModal from './QRCodeModal';
import QRCodeModalChapter from './QRCodeModalChapter';

const ChapterItem = ({ chapter, onClick, onQRCodeClick }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-center">
      <div 
        onClick={onClick}
        className="flex-grow flex items-center cursor-pointer"
      >
        <div className="p-3 bg-indigo-100 rounded-full mr-4 flex-shrink-0">
          <FileText size={22} className="text-indigo-600" />
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-gray-800">{chapter.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{chapter.description || 'No description'}</p>
        </div>
        <div className="flex items-center text-indigo-600">
          <span className="mr-1 text-sm font-medium hidden md:block">View</span>
          <ChevronRight size={18} />
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onQRCodeClick(chapter._id);
        }}
        className="ml-4 p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
        title="Show QR Code"
      >
        <QrCode size={18} />
      </button>
    </div>
  </div>
);

const AddChapterModal = ({ isOpen, onClose, bookId, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearInputs = () => {
    setTitle('');
    setDescription('');
    setOrder('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        onClose();
        return;
      }
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          description, 
          order: order ? parseInt(order) : undefined,
          parentType: 'book'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Chapter created successfully!');
        onAdd(data.chapter);
        clearInputs();
        onClose();
      } else {
        toast.error(data.message || 'Failed to create chapter');
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error('An error occurred while creating the chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Chapter</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Order (optional)</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={clearInputs}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            >
              <X size={16} className="mr-1" />
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Create Chapter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBookModal = ({ isOpen, onClose, book, onUpdate }) => {
  const [title, setTitle] = useState(book?.title || '');
  const [description, setDescription] = useState(book?.description || '');
  const [coverImage, setCoverImage] = useState(book?.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setDescription(book.description || '');
      setCoverImage(book.coverImage || '');
    }
  }, [book]);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        onClose();
        return;
      }
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${book._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, coverImage })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Book updated successfully!');
        onUpdate(data.book);
        onClose();
      } else {
        toast.error(data.message || 'Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('An error occurred while updating the book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Book</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Cover Image URL (optional)</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                'Update Book'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const BookDetail = () => {
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeView, setActiveView] = useState('book');
  const [showPDFSplitter, setShowPDFSplitter] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showChapterQRCodeModal, setShowChapterQRCodeModal] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const { bookId } = useParams();
  const navigate = useNavigate();

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }
      const bookPromise = fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const chaptersPromise = fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}/chapters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const [bookResponse, chaptersResponse] = await Promise.all([bookPromise, chaptersPromise]);
      const bookData = await bookResponse.json();
      const chaptersData = await chaptersResponse.json();
      if (bookData.success) {
        setBook(bookData.book);
      } else {
        setError(bookData.message || 'Failed to fetch book details');
      }
      if (chaptersData.success) {
        setChapters(chaptersData.chapters || []);
      } else {
        console.error('Failed to fetch chapters');
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId, navigate]);

  const handleAddChapter = () => {
    setShowAddModal(true);
  };

  const handleChapterAdded = (newChapter) => {
    setChapters([...chapters, newChapter]);
  };

  const handleEditBook = () => {
    setShowEditModal(true);
  };

  const handleBookUpdated = (updatedBook) => {
    setBook(updatedBook);
  };

  const handleDeleteBook = () => {
    setShowDeleteModal(true);
  };

  const handleDataStoreClick = () => {
    navigate(`/ai-books/${bookId}/datastore`);
  };
  
  const confirmDeleteBook = async () => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        setShowDeleteModal(false);
        return;
      }
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Book deleted successfully!');
        navigate('/ai-books');
      } else {
        toast.error(data.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('An error occurred while deleting the book');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleChapterClick = (chapterId) => {
    navigate(`/ai-books/${bookId}/chapters/${chapterId}`);
  };

  const handleBackClick = () => {
    navigate('/ai-books');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleConfigureClick = () => {
    setShowPDFSplitter(true);
  };

  const handleShowQRCode = () => {
    setShowQRCodeModal(true);
  };

  const handleChapterQRCodeClick = (chapterId) => {
    setSelectedChapterId(chapterId);
    setShowChapterQRCodeModal(true);
  };

  const handleBookAssetsClick = () => {
    navigate(`/ai-books/${bookId}/assets`);
  };

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
      <div className="flex justify-center items-center h-64">
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
            <button 
              onClick={handleBackClick}
              className="mt-3 text-red-600 hover:text-red-800 flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      {!showPDFSplitter && (
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Books</span>
          </button>
        </div>
      )}
      
      {showPDFSplitter ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">PDF Splitter</h2>
            <button 
              onClick={() => setShowPDFSplitter(false)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span>Back to Book</span>
            </button>
          </div>
          <PDFSplitter
            isOpen={true}
            onClose={() => setShowPDFSplitter(false)}
            bookId={bookId}
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/4 lg:w-1/5">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                  {book?.coverImage && !imageError ? (
                    <img 
                      src={getCompleteImageUrl(book.coverImage)} 
                      alt={book.title} 
                      className="h-full w-full object-cover rounded-lg"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="text-center">
                      <Book size={64} className="mx-auto text-indigo-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:w-3/4 lg:w-4/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h1 className="text-3xl font-bold text-gray-800">{book?.title}</h1>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <button 
                      onClick={handleEditBook}
                      className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      <Edit size={16} className="mr-1" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={handleDeleteBook}
                      className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">{book?.description || 'No description available'}</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleDataStoreClick}
                    className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors shadow-sm"
                  >
                    <Database size={16} className="mr-2" />
                    <span>Book Datastore</span>
                  </button>

                  <button 
                    onClick={handleAddChapter}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} className="mr-2" />
                    <span>Add Chapter</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/chat/${bookId}?type=book&title=${encodeURIComponent(book?.title || '')}`)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    <span>Chat with Book</span>
                  </button>
                  
                  <button 
                    onClick={handleConfigureClick}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <Settings size={16} className="mr-2" />
                    <span>Configure</span>
                  </button>
                  
                  <button 
                    onClick={handleShowQRCode}
                    className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    <QrCode size={16} className="mr-2" />
                    <span>Book QR</span>
                  </button>
                  
                  <button 
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    onClick={handleBookAssetsClick}
                  >
                    <Database size={16} className="mr-2" />
                    <span>Book Assets</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chapters</h2>
            {chapters.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No chapters yet</h3>
                <p className="text-gray-600 mb-6">Add your first chapter to start building your book</p>
                <button 
                  onClick={handleAddChapter}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  <span>Add Chapter</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {chapters
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((chapter) => (
                    <ChapterItem 
                      key={chapter._id} 
                      chapter={chapter} 
                      onClick={() => handleChapterClick(chapter._id)}
                      onQRCodeClick={handleChapterQRCodeClick}
                    />
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      <AddChapterModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        bookId={bookId}
        onAdd={handleChapterAdded}
      />
      <EditBookModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        book={book}
        onUpdate={handleBookUpdated}
      />
      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDeleteBook}
        title="Delete Book"
        message="Are you sure you want to delete this book? All chapters and content will be permanently removed."
      />
      <QRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        bookId={bookId}
        bookTitle={book?.title}
      />
      <QRCodeModalChapter
        isOpen={showChapterQRCodeModal}
        onClose={() => setShowChapterQRCodeModal(false)}
        bookId={bookId}
        chapterId={selectedChapterId}
        chapterTitle={chapters.find(c => c._id === selectedChapterId)?.title}
      />
    </div>
  );
};

export default BookDetail;