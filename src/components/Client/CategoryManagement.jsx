import { Plus, X, Edit, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CategoryManagement() {
const navigate = useNavigate();
const token = Cookies.get('usertoken');

// State management
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
const [newCategoryName, setNewCategoryName] = useState('');
const [newSubcategoryName, setNewSubcategoryName] = useState('');
const [selectedCategory, setSelectedCategory] = useState(null);
const [creatingCategory, setCreatingCategory] = useState(false);
const [creatingSubcategory, setCreatingSubcategory] = useState(false);
const [editingCategory, setEditingCategory] = useState(null);
const [editingSubcategory, setEditingSubcategory] = useState(null);

const fetchAllCategories = async () => {
    try {
     setLoading(true);
     const res = await axios.get(`${API_BASE_URL}/api/categories`,{
        headers:{
            Authorization: `Bearer ${token}`
        }
     })   
     console.log(res.data);
     setCategories(res.data || []);
    } 
    catch (error) {
        console.log(error);
        toast.error('Failed to fetch categories');
    } finally {
        setLoading(false);
    }
}

useEffect(()=>{
    fetchAllCategories();
},[]);

const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setCreatingCategory(true);
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to add category");
      } else {
        toast.success("Category created successfully");
        await fetchAllCategories();
        setNewCategoryName("");
        setShowCreateModal(false);
      }
    } catch (e) {
      toast.error("Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }
    try {
      setCreatingSubcategory(true);
      const res = await fetch(
        `${API_BASE_URL}/api/categories/${selectedCategory._id}/subcategories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newSubcategoryName.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to add subcategory");
      } else {
        toast.success("Subcategory created successfully");
        await fetchAllCategories();
        setNewSubcategoryName("");
        setShowSubcategoryModal(false);
        setSelectedCategory(null);
      }
    } catch (e) {
      toast.error("Failed to create subcategory");
    } finally {
      setCreatingSubcategory(false);
    }
  };

//   const handleDeleteCategory = async (categoryId) => {
//     if (window.confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
//       try {
//         const res = await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.status === 200) {
//           toast.success('Category deleted successfully');
//           await fetchAllCategories();
//         }
//       } catch (error) {
//         toast.error('Failed to delete category');
//       }
//     }
//   };

//   const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
//     if (window.confirm('Are you sure you want to delete this subcategory?')) {
//       try {
//         const res = await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.status === 200) {
//           toast.success('Subcategory deleted successfully');
//           await fetchAllCategories();
//         }
//       } catch (error) {
//         toast.error('Failed to delete subcategory');
//       }
//     }
//   };

  const handleEditCategory = async (categoryId, newName) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/categories/${categoryId}`, 
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        toast.success('Category updated successfully');
        await fetchAllCategories();
        setEditingCategory(null);
      }
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleEditSubcategory = async (categoryId, subcategoryId, newName) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}`, 
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        toast.success('Subcategory updated successfully');
        await fetchAllCategories();
        setEditingSubcategory(null);
      }
    } catch (error) {
      toast.error('Failed to update subcategory');
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Category</span>
        </button>
      </div>

      {/* Categories Display */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No categories found. Create your first category to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {editingCategory === category._id ? (
                    <input
                      type="text"
                      defaultValue={category.name}
                      className="text-xl font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1"
                      onBlur={(e) => handleEditCategory(category._id, e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditCategory(category._id, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-800">{category.name}</h3>
                  )}
                  <button
                    onClick={() => setEditingCategory(editingCategory === category._id ? null : category._id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowSubcategoryModal(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Add Subcategory
                  </button>
                  {/* <button
                    onClick={() => handleDeleteCategory(category._id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button> */}
                </div>
              </div>

              {/* Subcategories */}
              {category.subcategories && category.subcategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory._id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      {editingSubcategory === subcategory._id ? (
                        <input
                          type="text"
                          defaultValue={subcategory.name}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
                          onBlur={(e) => handleEditSubcategory(category._id, subcategory._id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleEditSubcategory(category._id, subcategory._id, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="text-gray-700">{subcategory.name}</span>
                      )}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSubcategory(editingSubcategory === subcategory._id ? null : subcategory._id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        {/* <button
                          onClick={() => handleDeleteSubcategory(category._id, subcategory._id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No subcategories yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Create Category Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Create New Category</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter category name"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {creatingCategory ? 'Creating...' : 'Create Category'}
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create Subcategory Modal */}
    {showSubcategoryModal && selectedCategory && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Add Subcategory to {selectedCategory.name}
            </h3>
            <button
              onClick={() => {
                setShowSubcategoryModal(false);
                setSelectedCategory(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name
            </label>
            <input
              type="text"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter subcategory name"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateSubcategory}
              disabled={creatingSubcategory || !newSubcategoryName.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {creatingSubcategory ? 'Creating...' : 'Create Subcategory'}
            </button>
            <button
              onClick={() => {
                setShowSubcategoryModal(false);
                setSelectedCategory(null);
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
)
}
