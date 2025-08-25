import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  EyeOff,
  Upload,
  Search,
  Filter,
  GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function Marketing() {
  const [marketing, setMarketing] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'banner',
    subcategory: '',
    imageUrl: '',
    imageWidth: '',
    imageHeight: '',
    position: 0,
    route: '',
    isActive: true,
    metadata: {}
  });

  const categories = [
    { value: 'banner', label: 'Banner' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'popup', label: 'Popup' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'hero', label: 'Hero' },
    { value: 'featured', label: 'Featured' },
    { value: 'promotion', label: 'Promotion' }
  ];

  const axiosConfig = {
    baseURL: 'https://aipbbackend-c5ed.onrender.com',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Load marketing items
  useEffect(() => {
    fetchMarketing();
  }, [pagination.page, filters]);

  const fetchMarketing = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const res = await axios.get(`/api/marketing?${params}`, axiosConfig);
      if (res?.data?.success) {
        setMarketing(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          pages: res.data.pagination.pages
        }));
      }
    } catch (e) {
      console.error('Failed to fetch marketing items', e);
      toast.error('Failed to load marketing items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarketing = async () => {
    if (!newItem.name || !newItem.category || !newItem.imageUrl || !newItem.imageWidth || !newItem.imageHeight) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await axios.post('/api/marketing', newItem, axiosConfig);
      console.log(res)
      if (res?.data?.success) {
        toast.success('Marketing item created successfully');
        setShowCreateModal(false);
        setNewItem({
          name: '',
          category: 'banner',
          subcategory: '',
          imageUrl: '',
          imageWidth: '',
          imageHeight: '',
          position: 0,
          route: '',
          isActive: true,
          metadata: {}
        });
        fetchMarketing();
      }
    } catch (e) {
      console.error('Create marketing failed', e);
      toast.error('Failed to create marketing item');
    }
  };

  const handleEditMarketing = async () => {
    if (!editingItem || !editingItem._id) return;

    try {
      const res = await axios.put(`/api/marketing/${editingItem._id}`, editingItem, axiosConfig);
      if (res?.data?.success) {
        toast.success('Marketing item updated successfully');
        setEditingItem(null);
        fetchMarketing();
      }
    } catch (e) {
      console.error('Update marketing failed', e);
      toast.error('Failed to update marketing item');
    }
  };

  const handleDeleteMarketing = async () => {
    try {
      if (!deletingItem) return;

      const res = await axios.delete(`/api/marketing/${deletingItem._id}`, axiosConfig);
      if (res?.data?.success) {
        toast.success('Marketing item deleted successfully');
        setShowDeleteModal(false);
        setDeletingItem(null);
        fetchMarketing();
      }
    } catch (e) {
      console.error('Delete marketing failed', e);
      toast.error('Failed to delete marketing item');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await axios.patch(`/api/marketing/${item._id}/toggle-active`, {}, axiosConfig);
      if (res?.data?.success) {
        toast.success(`Marketing item ${res.data.data.isActive ? 'activated' : 'deactivated'}`);
        fetchMarketing();
      }
    } catch (e) {
      console.error('Toggle active failed', e);
      toast.error('Failed to toggle active status');
    }
  };

  const handleImageUpload = async (file) => {
    try {
      // You can reuse your existing S3 upload logic here
      // For now, we'll use a placeholder
      const imageUrl = URL.createObjectURL(file);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        if (editingItem) {
          setEditingItem(prev => ({
            ...prev,
            imageUrl,
            imageWidth: img.width,
            imageHeight: img.height
          }));
        } else {
          setNewItem(prev => ({
            ...prev,
            imageUrl,
            imageWidth: img.width,
            imageHeight: img.height
          }));
        }
      };
      img.src = imageUrl;
    } catch (e) {
      console.error('Image upload failed', e);
      toast.error('Failed to upload image');
    }
  };

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Marketing Item</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Marketing item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <input
              type="text"
              value={newItem.subcategory}
              onChange={(e) => setNewItem({...newItem, subcategory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional subcategory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input
              type="number"
              value={newItem.position}
              onChange={(e) => setNewItem({...newItem, position: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Display order"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
            <input
              type="text"
              value={newItem.route}
              onChange={(e) => setNewItem({...newItem, route: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Navigation route (optional)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={newItem.isActive}
              onChange={(e) => setNewItem({...newItem, isActive: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              <Upload className="w-4 h-4" />
            </button>
          </div>
          
          {newItem.imageUrl && (
            <div className="mt-2">
              <img
                src={newItem.imageUrl}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <p className="text-sm text-gray-500 mt-1">
                Size: {newItem.imageWidth} x {newItem.imageHeight}px
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMarketing}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create Item
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Marketing Item</h3>
          <button
            onClick={() => setEditingItem(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={editingItem?.name || ''}
              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={editingItem?.category || 'banner'}
              onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <input
              type="text"
              value={editingItem?.subcategory || ''}
              onChange={(e) => setEditingItem({...editingItem, subcategory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input
              type="number"
              value={editingItem?.position || 0}
              onChange={(e) => setEditingItem({...editingItem, position: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
            <input
              type="text"
              value={editingItem?.route || ''}
              onChange={(e) => setEditingItem({...editingItem, route: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editingItem?.isActive || false}
              onChange={(e) => setEditingItem({...editingItem, isActive: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              <Upload className="w-4 h-4" />
            </button>
          </div>
          
          {editingItem?.imageUrl && (
            <div className="mt-2">
              <img
                src={editingItem.imageUrl}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <p className="text-sm text-gray-500 mt-1">
                Size: {editingItem.imageWidth} x {editingItem.imageHeight}px
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setEditingItem(null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditMarketing}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Item
          </button>
        </div>
      </div>
    </div>
  );

  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Delete Marketing Item</h3>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingItem(null);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteMarketing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center space-x-4 p-4">
          <button
            onClick={() => navigate('/tools')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Tools
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Marketing Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Search by name..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', isActive: '', search: '' })}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Marketing Items Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketing.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  {item.subcategory && (
                    <p className="text-gray-600 text-sm mb-2">{item.subcategory}</p>
                  )}
                  <p className="text-gray-500 text-xs mb-3">
                    Size: {item.imageWidth} x {item.imageHeight}px | Position: {item.position}
                  </p>
                  {item.route && (
                    <p className="text-blue-600 text-sm mb-3">Route: {item.route}</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{item.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => { setDeletingItem(item); setShowDeleteModal(true); }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {editingItem && renderEditModal()}
      {showDeleteModal && renderDeleteModal()}
    </div>
  );
}

