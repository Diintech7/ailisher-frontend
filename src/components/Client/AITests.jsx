import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Clock, Star, TrendingUp, BookOpen, FileText, X, ArrowLeft, Play, Users, Calendar, ToggleRight, Copy } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const AITests = () => {
  const [activeTab, setActiveTab] = useState('objective');
  const [objectiveTests, setObjectiveTests] = useState([]);
  const [subjectiveTests, setSubjectiveTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTest, setDeletingTest] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [testToCopy, setTestToCopy] = useState(null);
  const [copyFormData, setCopyFormData] = useState({
    name: '',
    description: ''
  });
  const token = Cookies.get('usertoken');
  const [categoryMappings, setCategoryMappings] = useState({});
  const [filters, setFilters] = useState({ category: '', subcategory: '' });
  const [selectedSubCategories, setSelectedSubCategories] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // Fetch categories from backend
      const categoriesResponse = await fetch(
        "https://test.ailisher.com/api/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const categoriesData = await categoriesResponse.json();

      // Transform to expected format
      const transformedCategories = {};
      categoriesData.forEach((category) => {
        if (category.name && category.subcategories) {
          transformedCategories[category.name] = category.subcategories.map(
            (sub) => sub.name
          );
        }
      });

      setCategoryMappings(transformedCategories);
      const [objectiveResponse, subjectiveResponse] = await Promise.all([
        axios.get('https://test.ailisher.com/api/objectivetests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://test.ailisher.com/api/subjectivetests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setObjectiveTests(objectiveResponse.data.tests || []);
      setSubjectiveTests(subjectiveResponse.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (testData) => {
    try {
      const endpoint = activeTab === 'objective' 
        ? 'https://test.ailisher.com/api/objectivetests'
        : 'https://test.ailisher.com/api/subjectivetests';

      const response = await axios.post(endpoint, testData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Test created successfully');
      setShowCreateModal(false);
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error(error.response?.data?.message || 'Failed to create test');
    }
  };

  const handleUpdateTest = async (testData) => {
    try {
      const endpoint = activeTab === 'objective' 
        ? `https://test.ailisher.com/api/objectivetests/${editingTest._id}`
        : `https://test.ailisher.com/api/subjectivetests/${editingTest._id}`;

      const response = await axios.put(endpoint, testData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Test updated successfully');
      setShowCreateModal(false);
      setEditingTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error(error.response?.data?.message || 'Failed to update test');
    }
  };

  const handleDeleteTest = async () => {
    if (!deletingTest) return;

    try {
      const endpoint = activeTab === 'objective' 
        ? `https://test.ailisher.com/api/objectivetests/${deletingTest._id}`
        : `https://test.ailisher.com/api/subjectivetests/${deletingTest._id}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Test deleted successfully');
      setShowDeleteModal(false);
      setDeletingTest(null);
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(error.response?.data?.message || 'Failed to delete test');
    }
  };

  const openCreateModal = () => {
    setEditingTest(null);
    setShowCreateModal(true);
  };

  const openEditModal = (test, e) => {
    e.stopPropagation();
    setEditingTest(test);
    setShowCreateModal(true);
  };

  const openDeleteModal = (test, e) => {
    e.stopPropagation();
    setDeletingTest(test);
    setShowDeleteModal(true);
  };

  const openCopyModal = (test, e) => {
    e.stopPropagation();
    setTestToCopy(test);
    setCopyFormData({
      name: `${test.name}_Copy`,
      description: test.description || ''
    });
    setShowCopyModal(true);
  };

  const handleCopyTest = async () => {
    try {
      const endpoint = activeTab === 'objective' 
        ? `${API_BASE_URL}/api/objectivetests/${testToCopy._id}/copy`
        : `${API_BASE_URL}/api/subjectivetests/${testToCopy._id}/copy`;

      const response = await axios.post(endpoint, copyFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Test copied successfully!');
        setShowCopyModal(false);
        setTestToCopy(null);
        setCopyFormData({ name: '', description: '' });
        fetchTests(); // Refresh the tests list
      } else {
        toast.error(response.data.message || 'Failed to copy test');
      }
    } catch (error) {
      console.error('Error copying test:', error);
      toast.error(error.response?.data?.message || 'Failed to copy test');
    }
  };

  const showTestModal = (test,type) => {
    if(test.isEnabled)
    {
      navigate(`/ai-tests/${type}/${test._id}`);
    }
    else
    {
      toast.error("This Test Is Disabled")
    }
  };

  const renderTestCard = (test, type) => (
    <div key={test._id} className="flex flex-col">
      <div
        onClick={() => showTestModal(test, type)}
          className={`p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 relative ${test.isEnabled === true ? 'bg-white' : 'bg-gray-400 opacity-50'}`}
      >
        {/* Status indicators and menu (top-right) */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 z-10"
          data-menu-root
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {test.isHighlighted && (
            <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
              <Star size={12} />
            </div>
          )}
          {test.isTrending && (
            <div className="bg-red-100 text-red-800 p-1 rounded-full">
              <TrendingUp size={12} />
            </div>
          )}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === test._id ? null : test._id); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 rounded-full transition-colors text-gray-400 hover:text-blue-600 hover:bg-blue-50 bg-blue-50"
              title="More options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {openMenuId === test._id && (
              <div
                className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100"
                data-menu-root
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); openEditModal(test, e); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openCopyModal(test, e); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center"
                >
                  <Copy size={14} className="mr-2" />
                  Copy Test
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openDeleteModal(test, e); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleEnabled(test, type); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${test.isEnabled === true ? 'text-red-800' : 'text-green-800'}`}
                >
                  <ToggleRight size={14} className="mr-2" />
                  {test.isEnabled === true ? 'Disable' : 'Enable'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
          {test.imageUrl ? (
            <img
              src={test.imageUrl}
              alt={test.name}
              className="h-full w-full object-fill rounded-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
              }}
            />
          ) : (
            <FileText size={64} className="text-indigo-400" />
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">{test.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{test.description}</p>

        {/* Test Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{test.Estimated_time || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <BookOpen size={14} className="mr-1" />
            <span>{test.category || 'Uncategorized'}</span>
          </div>
        </div>

        {/* Subcategory */}
        {test.subcategory && (
          <div className="mb-3">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {test.subcategory}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between mt-auto">
          <span
            className={`px-2 py-1 rounded text-xs font-medium 
              ${test.isActive ? (test.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-600 text-white' ): 'bg-red-100 text-red-800'}
            `}
          >
            {test.isActive ? 'Active' : 'Inactive'}
          </span>

          <span className="text-xs text-gray-500">
            {type === 'objective' ? 'Objective' : 'Subjective'}
          </span>
        </div>
      </div>
    </div>
  );

  const getValidSubCategories = () => {
    if (!filters.category) return [];
    return categoryMappings[filters.category] || [];
  };

  const displayedTests = activeTab === 'objective' ? objectiveTests : subjectiveTests;
  const filteredTests = displayedTests.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.subcategory && t.subcategory !== filters.subcategory) return false;
    return true;
  });

  useEffect(() => {
    const handleDocumentClick = (event) => {
      // If clicking inside any menu root, don't close
      const target = event.target;
      if (target && target.closest && target.closest('[data-menu-root]')) {
        return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const toggleEnabled = async (test, type) => {
    try {
      const endpoint = type === 'objective'
        ? `https://test.ailisher.com/api/objectivetests/${test._id}`
        : `https://test.ailisher.com/api/subjectivetests/${test._id}`;
      const response = await axios.patch(endpoint, { isEnabled: !test.isEnabled }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = response.data?.test || { ...test, isEnabled: !test.isEnabled };
      if (type === 'objective') {
        setObjectiveTests(prev => prev.map(t => t._id === test._id ? updated : t));
      } else {
        setSubjectiveTests(prev => prev.map(t => t._id === test._id ? updated : t));
      }
      toast.success(`Test ${updated.isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling enabled:', error);
      toast.error(error.response?.data?.message || 'Failed to update test');
    } finally {
      setOpenMenuId(null);
    }
  };

  // Group tests by category and subcategory (similar to AIWorkbook)
  const groupedTests = filteredTests.reduce((acc, test) => {
    const mainCategory = test.category || 'Uncategorized';
    const subCategory = test.subcategory || 'Other';
    if (!acc[mainCategory]) acc[mainCategory] = {};
    if (!acc[mainCategory][subCategory]) acc[mainCategory][subCategory] = [];
    acc[mainCategory][subCategory].push(test);
    return acc;
  }, {});

  const getSubCategoriesFor = (mainCategory) => {
    const standard = categoryMappings[mainCategory] || [];
    const present = Array.from(new Set(
      filteredTests
        .filter((t) => (t.category || 'Uncategorized') === mainCategory)
        .map((t) => t.subcategory || 'Other')
    ));
    const combined = Array.from(new Set([...(standard.length ? standard : []), ...present]));
    return combined.length ? combined : ['Other'];
  };

  const toggleSubCategory = (mainCategory, subCategory) => {
    setSelectedSubCategories((prev) => ({
      ...prev,
      [mainCategory]: prev[mainCategory] === subCategory ? null : subCategory,
    }));
  };

  const getTestsToDisplay = (mainCategory, subCategories) => {
    const selected = selectedSubCategories[mainCategory];
    if (!selected) {
      return Object.values(subCategories).flat();
    }
    return subCategories[selected] || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tests</h1>
          <p className="text-gray-600">Create and manage your AI-powered tests</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('objective')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'objective'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Objective Tests
              </button>
              <button
                onClick={() => setActiveTab('subjective')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subjective'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subjective Tests
              </button>
            </nav>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'objective' ? 'Objective' : 'Subjective'} Tests
            </h2>
            <p className="text-gray-600">
              {(activeTab === 'objective' ? filteredTests.length : filteredTests.length)} tests available
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create {activeTab === 'objective' ? 'Objective' : 'Subjective'} Test
          </button>
        </div>

      

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Grouped Tests (by Category/Subcategory) */}
        {!loading && (
          <div className="space-y-10">
            {Object.keys(groupedTests).length === 0 ? (
              <div />
            ) : (
              Object.keys(groupedTests).sort().map((mainCategory) => {
                const subCategories = groupedTests[mainCategory];
                const availableSubs = getSubCategoriesFor(mainCategory);
                const testsToShow = getTestsToDisplay(mainCategory, subCategories);
                return (
                  <section key={mainCategory}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold text-gray-900">{mainCategory}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* All chip */}
                      <button
                        onClick={() => setSelectedSubCategories((prev) => ({ ...prev, [mainCategory]: null }))}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          !selectedSubCategories[mainCategory]
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        All
                      </button>
                      {availableSubs.map((sub) => {
                        const isActive = selectedSubCategories[mainCategory] === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => toggleSubCategory(mainCategory, sub)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                    {testsToShow.length === 0 ? (
                      <div className="text-sm text-gray-500">No tests in this category.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {testsToShow.map((test) => renderTestCard(test, activeTab))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTests.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} tests found</h3>
            <p className="text-gray-600 mb-6">Try adjusting filters or create a new test</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Create First Test
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TestModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTest(null);
          }}
          onSubmit={editingTest ? handleUpdateTest : handleCreateTest}
          test={editingTest}
          type={activeTab}
          categoryMappings={categoryMappings}
          onCategoriesUpdated={setCategoryMappings}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingTest(null);
          }}
          onConfirm={handleDeleteTest}
          test={deletingTest}
          type={activeTab}
        />
      )}

      {/* Copy Test Modal */}
      {showCopyModal && testToCopy && (
        <CopyModal
          isOpen={showCopyModal}
          onClose={() => {
            setShowCopyModal(false);
            setTestToCopy(null);
            setCopyFormData({ name: '', description: '' });
          }}
          onConfirm={handleCopyTest}
          test={testToCopy}
          type={activeTab}
          formData={copyFormData}
          setFormData={setCopyFormData}
        />
      )}
    </div>
  );
};

// Test Modal Component
const TestModal = ({ isOpen, onClose, onSubmit, test, type, categoryMappings = {}, onCategoriesUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    Estimated_time: '',
    instructions: '',
    isTrending: false,
    isHighlighted: false,
    isActive: true
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageKey, setImageKey] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const token = Cookies.get('usertoken');

  useEffect(() => {
    if (test) {
      setFormData({
        name: test.name || '',
        description: test.description || '',
        category: test.category || '',
        subcategory: test.subcategory || '',
        Estimated_time: test.Estimated_time || '',
        instructions: test.instructions || '',
        isTrending: test.isTrending || false,
        isHighlighted: test.isHighlighted || false,
        isActive: test.isActive !== undefined ? test.isActive : true
      });
      setImageKey(test.imageKey || '');
      setImagePreview(test.imageUrl || '');
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        Estimated_time: '',
        instructions: '',
        isTrending: false,
        isHighlighted: false,
        isActive: true
      });
      setImageKey('');
      setImagePreview('');
    }
    
    // Reset drag state
    setIsDragOver(false);
  }, [test]);

  const refreshCategories = async () => {
    try {
      const res = await fetch("https://test.ailisher.com/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await res.json();
      if (!Array.isArray(list)) return;
      const mappings = {};
      list.forEach((cat) => {
        mappings[cat.name] = (cat.subcategories || []).map((sc) => sc.name);
        if (mappings[cat.name].length === 0) mappings[cat.name] = ['Other'];
      });
      if (onCategoriesUpdated) onCategoriesUpdated(mappings);
    } catch (e) {
      console.error('Failed to refresh categories', e);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      setCreatingCategory(true);
      const res = await fetch("https://test.ailisher.com/api/categories", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to add category');
      } else {
        toast.success('Category created');
        await refreshCategories();
        setFormData((prev) => ({ ...prev, category: data.name, subcategory: 'Other' }));
        setNewCategoryName('');
      }
    } catch (e) {
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }
    try {
      setCreatingSubcategory(true);
      const listRes = await fetch("https://test.ailisher.com/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await listRes.json();
      const currentCat = Array.isArray(list) ? list.find((c) => c.name === formData.category) : null;
      if (!currentCat) {
        toast.error('Select a valid category first');
        return;
      }
      const res = await fetch(`https://test.ailisher.com/api/categories/${currentCat._id}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubcategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to add subcategory');
      } else {
        toast.success('Subcategory created');
        await refreshCategories();
        setFormData((prev) => ({ ...prev, subcategory: newSubcategoryName.trim() }));
        setNewSubcategoryName('');
      }
    } catch (e) {
      toast.error('Failed to create subcategory');
    } finally {
      setCreatingSubcategory(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setImageKey('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      // Get presigned URL for upload
      const response = await axios.post(
        `https://test.ailisher.com/api/${type === 'objective' ? 'objectivetests' : 'subjectivetests'}/upload-image`,
        {
          fileName: file.name,
          contentType: file.type
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = response.data;

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to S3');
      }

      setImageKey(key);
      toast.success('Image uploaded successfully');
      return key;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Test name is required');
      return;
    }

    try {
      let finalImageKey = imageKey;
      
      // Upload new image if selected
      if (selectedImage) {
        finalImageKey = await uploadImage(selectedImage);
      }

      const submitData = {
        ...formData,
        imageKey: finalImageKey
      };

      onSubmit(submitData);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Failed to create test');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {test ? 'Edit' : 'Create'} {type === 'objective' ? 'Objective' : 'Subjective'} Test
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter test description"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const firstSub = (categoryMappings[newCat] || [])[0] || '';
                      setFormData({ ...formData, category: newCat, subcategory: firstSub });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {Object.keys(categoryMappings).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    disabled={!formData.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select subcategory</option>
                    {(categoryMappings[formData.category] || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Category</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {creatingCategory ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Subcategory</label>
                    <input
                      type="text"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="Enter new subcategory"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSubcategory}
                    disabled={creatingSubcategory || !formData.category}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {creatingSubcategory ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time</label>
              <input
                type="text"
                value={formData.Estimated_time}
                onChange={(e) => setFormData({...formData, Estimated_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30 minutes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter test instructions"
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Image (Optional)</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mb-4">
                  <div className="h-48 w-full rounded-md overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Test preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <div className="flex items-center justify-center w-full">
                <label 
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
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
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              
              {uploadingImage && (
                <div className="mt-2 text-sm text-blue-600">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading image...
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTrending"
                  checked={formData.isTrending}
                  onChange={(e) => setFormData({...formData, isTrending: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isTrending" className="ml-2 text-sm text-gray-700">
                  Mark as Trending
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHighlighted"
                  checked={formData.isHighlighted}
                  onChange={(e) => setFormData({...formData, isHighlighted: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isHighlighted" className="ml-2 text-sm text-gray-700">
                  Mark as Highlighted
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : (test ? 'Update' : 'Create') + ' Test'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, test, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Delete {type === 'objective' ? 'Objective' : 'Subjective'} Test</h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete "{test?.name}"? This action cannot be undone.
            </p>
          </div>
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
    </div>
  );
};

// Copy Test Modal
const CopyModal = ({ isOpen, onClose, onConfirm, test, type, formData, setFormData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <Copy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Copy {type === 'objective' ? 'Objective' : 'Subjective'} Test</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter description"
              />
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-2">This will copy:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All test settings</li>
                <li>All questions ({test.questions?.length || 0} questions)</li>
                <li>Instructions and configuration</li>
                <li>Category and subcategory</li>
                <li>Estimated time</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Note: The new test will start as disabled, won't be marked as trending/highlighted, and won't include the cover image (you can add a new one).
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Copy Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITests; 