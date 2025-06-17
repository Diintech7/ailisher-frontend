import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database, ArrowLeft, Plus, FileText, Image, Youtube, Link, File, AlertTriangle } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DatastoreItemCard = ({ item }) => {
    
  const getIcon = () => {
    switch(item.type) {
      case 'pdf':
        return <File className="text-red-500" size={20} />;
      case 'image':
        return <Image className="text-blue-500" size={20} />;
      case 'video':
        return <Youtube className="text-red-500" size={20} />;
      case 'youtube':
        return <Youtube className="text-red-500" size={20} />;
      default:
        return <Link className="text-indigo-500" size={20} />;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <div className="p-2 bg-gray-100 rounded-full mr-4">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{item.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{item.description || 'No description'}</p>
          <div className="mt-2">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View Resource
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatastoreItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { type, id } = useParams();
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      let endpoint = '';
      if (type === 'book') {
        endpoint = `https://aipbbackend-c5ed.onrender.com/api/datastores/book/${id}/items`;
      } else if (type === 'chapter') {
        endpoint = `https://aipbbackend-c5ed.onrender.com/api/datastores/chapter/${id}/items`;
      } else if (type === 'topic') {
        endpoint = `https://aipbbackend-c5ed.onrender.com/api/datastores/topic/${id}/items`;
      } else {
        endpoint = `https://aipbbackend-c5ed.onrender.com/api/datastores/book/${id}/items`;
       
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setItems(data.items);
      } else {
        setError(data.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching datastore items:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, id, navigate]);

  const handleBackClick = () => {
    if (type === 'book') {
      navigate(`/ai-books/${id}`);
    } else if (type === 'chapter') {
      // You might need to adjust this based on your routing structure
      const bookId = window.location.pathname.split('/')[3];
      navigate(`/ai-books/${bookId}/chapters/${id}`);
    } else if (type === 'topic') {
      const [bookId, chapterId] = window.location.pathname.split('/').slice(3, 5);
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${id}`);
    }
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
      
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Go back</span>
        </button>
        <button
          onClick={() => navigate('/datastores')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          <span>Add New Item</span>
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {type === 'book' && 'Book'} 
        {type === 'chapter' && 'Chapter'} 
        {type === 'topic' && 'Topic'} Datastore Items
      </h1>

      {items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Database size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No items found</h3>
          <p className="text-gray-600 mb-6">Add items to this {type} datastore to see them here</p>
          <button 
            onClick={() => navigate('/datastores')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <DatastoreItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DatastoreItemsList;