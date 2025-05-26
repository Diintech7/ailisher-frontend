import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, ChevronRight, Plus, Database, ArrowLeft, AlertTriangle, Image, Upload, X, Search, Filter, ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const BookItem = ({ book, onClick }) => {
  const displaySubCategory = book.subCategory === 'Other' && book.customSubCategory 
    ? book.customSubCategory 
    : book.subCategory;
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100"
    >
      <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
        {book.coverImage ? (
          <img 
            src={book.coverImage.startsWith('data:') ? book.coverImage : `https://aipbbackend.onrender.com/${book.coverImage}`} 
            alt={book.title} 
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <Book size={64} className="text-indigo-400" />
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{book.title}</h3>
      <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
      <p className="text-gray-500 text-xs mb-2">{book.publisher}</p>
      <p className="text-gray-600 text-sm flex-grow">{book.description || 'No description available'}</p>
      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{book.mainCategory}</span>
          <span className="text-xs font-medium text-indigo-600">{displaySubCategory}</span>
        </div>
        <span className="flex items-center text-indigo-600 font-medium text-sm">
          View Details
          <ChevronRight size={18} className="ml-1" />
        </span>
      </div>
    </div>
  );
};
const ImageUploadPreview = ({ imagePreview, onRemove }) => {
  if (!imagePreview) return null;
  return (
    <div className="relative mt-2 mb-4">
      <div className="h-48 w-full rounded-md overflow-hidden">
        <img 
          src={imagePreview} 
          alt="Cover preview" 
          className="h-full w-full object-cover"
        />
      </div>
      <button 
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
const FiltersPanel = ({ filters, onFiltersChange, onClearFilters, authors, publishers, allBooks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const CATEGORY_MAPPINGS = {
    'Competitive Exams': ['UPSC', 'NEET', 'JEE', 'GATE', 'CAT'],
    'Professional Courses': ['CA', 'CMA', 'CS', 'ACCA', 'CFA', 'FRM'],
    'Language Tests': ['IELTS', 'TOEFL', 'GRE', 'GMAT'],
    'Academic': ['Engineering', 'Medical', 'Management', 'Science', 'Arts', 'Commerce'],
    'Other': ['Other']
  };
  const languages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
  ];
  const customSubCategories = [...new Set(
    allBooks
      .filter(book => book.subCategory === 'Other' && book.customSubCategory)
      .map(book => book.customSubCategory)
  )].sort();
  const allTags = [...new Set(
    allBooks.flatMap(book => book.tags || [])
  )].sort();
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  const getValidSubCategories = () => {
    if (!filters.mainCategory) return [];
    const standardCategories = CATEGORY_MAPPINGS[filters.mainCategory] || [];
    if (filters.mainCategory === 'Other') {
      return [...standardCategories, ...customSubCategories];
    }
    return standardCategories;
  };
  const hasActiveFilters = Object.values(filters).some(value => 
    value && (typeof value === 'string' ? value.trim() : true)
  );
  const handleClearFilters = (e) => {
    e.stopPropagation();
    onClearFilters();
  };
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center text-left"
          >
            <Filter size={20} className="text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            {hasActiveFilters && (
              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1"
            >
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or description..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
              <select
  value={filters.mainCategory || ''}
  onChange={(e) => {
    const newMainCategory = e.target.value;
    handleFilterChange('mainCategory', newMainCategory);
    handleFilterChange('subCategory', '');
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <option value="">All Categories</option>
  {Object.keys(CATEGORY_MAPPINGS).map(category => (
    <option key={category} value={category}>{category}</option>
  ))}
</select>
            </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
  <select
    value={filters.subCategory || ''}
    onChange={(e) => handleFilterChange('subCategory', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
    disabled={!filters.mainCategory}
  >
    <option value="">All Subcategories</option>
    {getValidSubCategories().map(subCategory => (
      <option key={subCategory} value={subCategory}>{subCategory}</option>
    ))}
    {customSubCategories.map(customSub => (
      <option key={`custom-${customSub}`} value={customSub}>
        {customSub} (Custom)
      </option>
    ))}
  </select>
</div>    
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={filters.language || ''}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <select
                value={filters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <select
                value={filters.tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const AddBookModal = ({ isOpen, onClose, onAdd, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    publisher: '',
    language: 'English',
    mainCategory: 'Other',
    subCategory: 'Other',
    customSubCategory: '',
    tags: '',
    isPublic: false
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const CATEGORY_MAPPINGS = {
    'Competitive Exams': ['UPSC', 'NEET', 'JEE', 'GATE', 'CAT'],
    'Professional Courses': ['CA', 'CMA', 'CS', 'ACCA', 'CFA', 'FRM'],
    'Language Tests': ['IELTS', 'TOEFL', 'GRE', 'GMAT'],
    'Academic': ['Engineering', 'Medical', 'Management', 'Science', 'Arts', 'Commerce'],
    'Other': ['Other']
  };
  const languages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
  ];
  if (!isOpen) return null;
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'mainCategory' && { 
        subCategory: CATEGORY_MAPPINGS[value]?.[0] || 'Other', 
        customSubCategory: '' 
      })
    }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
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
      const requiredFields = ['title', 'description', 'author', 'publisher'];
      for (const field of requiredFields) {
        if (!formData[field] || !formData[field].trim()) {
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setIsSubmitting(false);
          return;
        }
      }
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('publisher', formData.publisher.trim());
      formDataToSend.append('language', formData.language);
      formDataToSend.append('mainCategory', formData.mainCategory);
      formDataToSend.append('subCategory', formData.subCategory);
      formDataToSend.append('isPublic', formData.isPublic);
      if (currentUser) {
        const clientId = currentUser.userId || currentUser.id;
        formDataToSend.append('clientId', clientId);
      }
      if (formData.subCategory === 'Other' && formData.customSubCategory.trim()) {
        formDataToSend.append('customSubCategory', formData.customSubCategory.trim());
      }
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length <= 30)
          .slice(0, 10); // Limit to 10 tags max
        if (tagsArray.length > 0) {
          formDataToSend.append('tags', JSON.stringify(tagsArray));
        }
      }
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage);
      }
      const response = await fetch('https://aipbbackend.onrender.com/api/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Book created successfully!');
        onAdd(data.book);
        onClose();
        setFormData({
          title: '',
          description: '',
          author: '',
          publisher: '',
          language: 'English',
          mainCategory: 'Other',
          subCategory: 'Other',
          customSubCategory: '',
          tags: '',
          isPublic: false
        });
        setCoverImage(null);
        setImagePreview('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        if (Array.isArray(data.message)) {
          data.message.forEach(msg => toast.error(msg));
        } else {
          toast.error(data.message || 'Failed to create book');
        }
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('An error occurred while creating the book');
    } finally {
      setIsSubmitting(false);
    }
  };
  const getValidSubCategories = () => {
    return CATEGORY_MAPPINGS[formData.mainCategory] || ['Other'];
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {currentUser && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Creating book for:</span> {currentUser.name}
                  {currentUser.role === 'client' && currentUser.userId && (
                    <span className="ml-2 text-blue-600">({currentUser.userId})</span>
                  )}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title * <span className="text-gray-500">({formData.title.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Author * <span className="text-gray-500">({formData.author.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter author name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Publisher * <span className="text-gray-500">({formData.publisher.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  maxLength={100}
                  placeholder="Enter publisher name"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Language *</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description * <span className="text-gray-500">({formData.description.length}/1000)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                maxLength={1000}
                required
                placeholder="Enter a detailed description of the book..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Main Category *</label>
                <select
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {Object.keys(CATEGORY_MAPPINGS).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Sub Category *</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {getValidSubCategories().map(subCategory => (
                    <option key={subCategory} value={subCategory}>{subCategory}</option>
                  ))}
                </select>
              </div>
            </div>
            {formData.subCategory === 'Other' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Custom Sub Category <span className="text-gray-500">({formData.customSubCategory.length}/50)</span>
                </label>
                <input
                  type="text"
                  name="customSubCategory"
                  value={formData.customSubCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={50}
                  placeholder="Enter custom subcategory"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Tags (Optional)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter tags separated by commas (e.g., exam prep, study guide, mathematics)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas. Maximum 10 tags, 30 characters each.</p>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 text-sm">Make this book public (visible to other users)</span>
              </label>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Cover Image (Optional)</label>
              <ImageUploadPreview imagePreview={imagePreview} onRemove={handleRemoveImage} />
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (Max: 5MB)</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Create Book'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
const AIBooks = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    mainCategory: '',
    subCategory: '',
    language: '',
    author: '',
    publisher: '',
    tag: '',
    visibility: '',
    sortBy: 'newest'
  });
  const navigate = useNavigate();
  const authors = [...new Set(books.map(book => book.author))].sort();
  const publishers = [...new Set(books.map(book => book.publisher))].sort();
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }
      const response = await fetch('https://aipbbackend.onrender.com/api/books', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBooks(data.books || []);
        setFilteredBooks(data.books || []);
        setCurrentUser(data.currentUser || null);
      } else {
        setError(data.message || 'Failed to fetch books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBooks();
  }, [navigate]);
useEffect(() => {
  if (books.length === 0) return;
  let result = [...books];
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    result = result.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      (book.description && book.description.toLowerCase().includes(searchTerm))
    );
  }
  if (filters.mainCategory) {
    result = result.filter(book => book.mainCategory === filters.mainCategory);
  }
  if (filters.subCategory) {
    result = result.filter(book => {
      if (book.subCategory === filters.subCategory) {
        return true;
      }
      if (book.subCategory === 'Other' && book.customSubCategory === filters.subCategory) {
        return true;
      }
      return false;
    });
  }
  if (filters.language) {
    result = result.filter(book => book.language === filters.language);
  }
  if (filters.author) {
    result = result.filter(book => book.author === filters.author);
  }
  if (filters.tag) {
    result = result.filter(book => 
      book.tags && book.tags.includes(filters.tag)
    );
  }
  setFilteredBooks(result);
}, [filters, books]);
  const handleAddBook = () => {
    setShowAddModal(true);
  };
  const handleBookAdded = (newBook) => {
    setBooks([...books, newBook]);
  };
  const handleBookClick = (bookId) => {
    navigate(`/ai-books/${bookId}`);
  };
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };
  const handleClearFilters = () => {
    setFilters({
      search: '',
      mainCategory: '',
      subCategory: '',
      language: '',
      author: '',
      publisher: '',
      tag: '',
      visibility: '',
      sortBy: 'newest'
    });
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My AI Books</h1>
          {currentUser && (
            <p className="text-gray-600 mt-1">
              Welcome, {currentUser.name}
              {currentUser.role === 'client' && currentUser.userId && (
                <span className="ml-2 text-indigo-600 font-medium">({currentUser.userId})</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleAddBook}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Book</span>
          </button>
        </div>
      </div>
      <FiltersPanel 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        authors={authors}
        publishers={publishers}
        allBooks={books}
      />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Book size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {books.length === 0 ? 'No books yet' : 'No books match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {books.length === 0 
              ? 'Create your first AI book to get started' 
              : 'Try adjusting your search or filters'}
          </p>
          <button 
            onClick={handleAddBook}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Book</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookItem 
              key={book._id} 
              book={book} 
              onClick={() => handleBookClick(book._id)}
            />
          ))}
        </div>
      )}
      <AddBookModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleBookAdded}
        currentUser={currentUser}
      />
    </div>
  );
};
export default AIBooks;
