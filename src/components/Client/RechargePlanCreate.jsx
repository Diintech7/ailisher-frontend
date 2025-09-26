import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { Trash } from 'lucide-react';

const CATEGORY_OPTIONS = ['Basic', 'Premium', 'Enterprise'];
const TYPE_TABS = [
  { value: 'book', label: 'AIBooks' },
  { value: 'workbook', label: 'AIWorkbooks' },
  { value: 'test', label: 'AITtests' }
];

const initialPlan = {
  name: '',
  description: '',
  duration: '',
  credits: '',
  MRP: '',
  offerPrice: '',
  category: 'Basic',
  imageKey: '',
  videoKey: ''
};

export default function RechargePlanCreate() {
  const { planId } = useParams();
  const isEdit = Boolean(planId);

  const [plan, setPlan] = useState(initialPlan);
  const [planItems, setPlanItems] = useState([]); // only for edit mode
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Picker state (used in create, and also for add-items in edit)
  const [activeTab, setActiveTab] = useState('book');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubCategory, setFilterSubCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ book: [], workbook: [], testObjective: [], testSubjective: [] });
  const [selected, setSelected] = useState({ book: new Set(), workbook: new Set(), testObjective: new Set(), testSubjective: new Set() });
  const [testSubTab, setTestSubTab] = useState('objective'); // 'objective' | 'subjective'
  const [pickerOpen, setPickerOpen] = useState(false);

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');
  const baseHeaders = useMemo(() => ({ 'Content-Type': 'application/json' }), []);
  const authHeaders = useMemo(
    () => (token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders),
    [token, baseHeaders]
  );

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, { headers: authHeaders });
          const body = await res.json();
          if (!res.ok || !body.success) throw new Error(body.message || 'Failed to load plan');
          const p = body.data;
          setPlan({
            name: p.name || '',
            description: p.description || '',
            duration: p.duration || '',
            credits: p.credits || '',
            MRP: p.MRP || '',
            offerPrice: p.offerPrice || '',
            category: ['Basic','Premium','Enterprise'].includes(p.category) ? p.category : 'Basic',
            imageKey: p.imageKey || '',
            videoKey: p.videoKey || ''
          });
          setPlanItems(Array.isArray(p.items) ? p.items : []);
        } catch (e) {
          setError(e.message);
        }
      })();
    } else {
      loadTab('book');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  async function loadTab(tab) {
    setLoading(true);
    setError('');
    try {
      if (tab === 'book') {
        const res = await fetch(`${API_BASE_URL}/api/books`, { headers: authHeaders });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Failed to load books');
        const arr = Array.isArray(body) ? body : (body.data || body.books || []);
        setData((prev) => ({ ...prev, book: arr.map(normalizeItem) }));
      } else if (tab === 'workbook') {
        const res = await fetch(`${API_BASE_URL}/api/workbooks`, { headers: authHeaders });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Failed to load workbooks');
        const arr = Array.isArray(body) ? body : (body.data || body.workbooks || []);
        setData((prev) => ({ ...prev, workbook: arr.map(normalizeItem) }));
      } else if (tab === 'test') {
        const [objRes, subjRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/objectivetests`, { headers: authHeaders }),
          fetch(`${API_BASE_URL}/api/subjectivetests`, { headers: authHeaders })
        ]);
        const [obj, subj] = await Promise.all([objRes.json(), subjRes.json()]);
        if (!objRes.ok) throw new Error(obj.message || 'Failed to load objective tests');
        if (!subjRes.ok) throw new Error(subj.message || 'Failed to load subjective tests');
        const objArr = Array.isArray(obj) ? obj : (obj.data || obj.tests || []);
        const subjArr = Array.isArray(subj) ? subj : (subj.data || subj.tests || []);
        const objective = objArr.map(normalizeItem);
        const subjective = subjArr.map(normalizeItem);
        setData((prev) => ({ ...prev, testObjective: objective, testSubjective: subjective }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function normalizeItem(x) {
    return {
      id: x._id || x.id,
      name: x.title || x.name || 'Untitled',
      image: x.coverImageUrl || x.imageUrl || '',
      category: x.mainCategory || x.category || 'General',
      subCategory: x.subCategory || 'Other',
      customSubCategory: x.customSubCategory || null
    };
  }
  
  function getPlanItemImageUrl(item) {
    // Try multiple possible fields coming from API
    if (item?.referencedItemImageUrl) return item.referencedItemImageUrl;
    return '';
  }

  // Function to get existing item IDs from plan items
  const getExistingItemIds = () => {
    if (!isEdit || !planItems.length) return new Set();
    
    const existingIds = new Set();
    planItems.forEach(item => {
      if (item.referenceId) {
        existingIds.add(item.referenceId);
      }
    });
    return existingIds;
  };

  const visibleList = (() => {
    const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
    let list = data[currentKey] || [];
    
    // Filter out items that are already in the plan (only in edit mode)
    if (isEdit) {
      const existingIds = getExistingItemIds();
      list = list.filter((i) => !existingIds.has(i.id));
    }
    
    // Filter by main category
    if (filterCategory !== 'All') {
      list = list.filter((i) => String(i.category).toLowerCase() === filterCategory.toLowerCase());
    }
    
    // Filter by subcategory
    if (filterSubCategory !== 'All') {
      list = list.filter((i) => {
        const itemSubCategory = i.subCategory === 'Other' && i.customSubCategory 
          ? i.customSubCategory 
          : i.subCategory;
        return String(itemSubCategory).toLowerCase() === filterSubCategory.toLowerCase();
      });
    }
    
    // Filter by search term
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((i) => (i.name || '').toLowerCase().includes(q));
  })();

  function toggleSelect(id) {
    const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
    setSelected((prev) => {
      const next = new Set(prev[currentKey]);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, [currentKey]: next };
    });
  }

  function selectAllCurrent() {
    const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
    setSelected((prev) => {
      const next = new Set(prev[currentKey]);
      visibleList.forEach((i) => next.add(i.id));
      return { ...prev, [currentKey]: next };
    });
  }

  function clearSelectedCurrent() {
    const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
    setSelected((prev) => ({ ...prev, [currentKey]: new Set() }));
  }

  async function submitPlan(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Convert empty strings to numbers for submission
      const planData = {
        ...plan,
        duration: plan.duration === '' ? 0 : Number(plan.duration),
        credits: plan.credits === '' ? 0 : Number(plan.credits),
        MRP: plan.MRP === '' ? 0 : Number(plan.MRP),
        offerPrice: plan.offerPrice === '' ? 0 : Number(plan.offerPrice)
      };
      
      if (isEdit) {
        const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(planData)
        });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message || 'Failed to update plan');
        navigate('/plans');
      } else {
        const items = [];
        const keys = ['book', 'workbook', 'testObjective', 'testSubjective'];
        const typeMap = {
          book: 'book',
          workbook: 'workbook',
          testObjective: 'objective-test',
          testSubjective: 'subjective-test'
        };
        for (const key of keys) {
          const map = new Map((data[key] || []).map((i) => [i.id, i.name]));
          selected[key].forEach((id) => items.push({ itemType: typeMap[key], referenceId: id, name: map.get(id) || 'Item', quantity: 1, expiresWithPlan: true }));
        }
        const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ ...planData, items })
        });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message || 'Failed to create plan');
        navigate('/plans');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteItem(itemId) {
    if (!isEdit || !planId) return;
    try {
        const confirmed = window.confirm("Are you sure you want to delete this item?");
        if (!confirmed) return;
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}/items/${itemId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || 'Failed to remove item');
      setPlanItems(body.data.items || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addSelectedItemsToPlan() {
    if (!isEdit || !planId) return;
    try {
      const keys = ['book', 'workbook', 'testObjective', 'testSubjective'];
      const typeMap = {
        book: 'book',
        workbook: 'workbook',
        testObjective: 'objective-test',
        testSubjective: 'subjective-test'
      };
      for (const tab of keys) {
        for (const id of selected[tab]) {
          // eslint-disable-next-line no-await-in-loop
          const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ itemType: typeMap[tab], referenceId: id, name: (data[tab].find((i) => i.id === id)?.name) || 'Item', quantity: 1, expiresWithPlan: true })
          });
          // eslint-disable-next-line no-await-in-loop
          const body = await res.json();
          if (!res.ok || !body.success) throw new Error(body.message || 'Failed to add item');
          setPlanItems(body.data.items || []);
        }
      }
      // Clear selection and close modal
      setSelected({ book: new Set(), workbook: new Set(), testObjective: new Set(), testSubjective: new Set() });
      setPickerOpen(false);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow-sm border-b">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/plans")}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Plans
        </button>
        <h2 className="text-2xl font-semibold">{isEdit ? 'Edit Plan' : 'Create Plan'}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => navigate('/plans')}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          form="plan-form"
          disabled={submitting} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Plan')}
        </button>
      </div>
    </div>
  </div>
    <div className="p-6">

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      <form id="plan-form" onSubmit={submitPlan} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={plan.name} 
                    onChange={(e) => setPlan({ ...plan, name: e.target.value })} 
                    placeholder="Enter plan name"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none" 
                    rows="6"
                    value={plan.description} 
                    onChange={(e) => setPlan({ ...plan, description: e.target.value })} 
                    placeholder="Describe your plan"
                    required 
                  />
                </div>
                {/* <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days) </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.duration} 
                      onChange={(e) => setPlan({ ...plan, duration: e.target.value === '' ? '' : Number(e.target.value) })} 
                      // min="1"
                      // required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.credits} 
                      onChange={(e) => setPlan({ ...plan, credits: e.target.value === '' ? '' : Number(e.target.value) })} 
                      // min="0"
                      // required 
                    />
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹) *</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.MRP} 
                      onChange={(e) => setPlan({ ...plan, MRP: e.target.value === '' ? '' : Number(e.target.value) })} 
                      min="0"
                      step="0.01"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Offer Price (₹) *</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.offerPrice} 
                      onChange={(e) => setPlan({ ...plan, offerPrice: e.target.value === '' ? '' : Number(e.target.value) })} 
                      min="0"
                      step="0.01"
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={plan.category} 
                    onChange={(e) => setPlan({ ...plan, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days) </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.duration} 
                      onChange={(e) => setPlan({ ...plan, duration: e.target.value === '' ? '' : Number(e.target.value) })} 
                      // min="1"
                      // required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      value={plan.credits} 
                      onChange={(e) => setPlan({ ...plan, credits: e.target.value === '' ? '' : Number(e.target.value) })} 
                      // min="0"
                      // required 
                    />
                  </div>
                </div>
            {/* Media Information */}
            {/* <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Assets</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Key</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={plan.imageKey} 
                    onChange={(e) => setPlan({ ...plan, imageKey: e.target.value })} 
                    placeholder="Enter image key (optional)"
                  />
                </div>
                
              </div>
            </div> */}
          </div>
        </div>
      </form>

      {!isEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Select Items to Include</h3>
            <div className="flex items-center gap-3">
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={filterCategory} 
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setFilterSubCategory('All'); // Reset subcategory when main category changes
                }}
              >
                <option value="All">All Categories</option>
                {Array.from(new Set((data[activeTab] || []).map((i) => i.category))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={filterSubCategory} 
                onChange={(e) => setFilterSubCategory(e.target.value)}
                disabled={filterCategory === 'All'}
              >
                <option value="All">All Subcategories</option>
                {(() => {
                  const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
                  const filteredItems = filterCategory === 'All' 
                    ? (data[currentKey] || [])
                    : (data[currentKey] || []).filter((i) => String(i.category).toLowerCase() === filterCategory.toLowerCase());
                  
                  const subcategories = new Set();
                  filteredItems.forEach((i) => {
                    const subCategory = i.subCategory === 'Other' && i.customSubCategory 
                      ? i.customSubCategory 
                      : i.subCategory;
                    if (subCategory) subcategories.add(subCategory);
                  });
                  
                  return Array.from(subcategories).map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ));
                })()}
              </select>
              <input 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Search items..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="flex gap-2 mb-6">
            {TYPE_TABS.map((t) => (
              <button 
                key={t.value} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === t.value 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`} 
                onClick={() => { 
                  setActiveTab(t.value); 
                  setFilterCategory('All');
                  setFilterSubCategory('All');
                  if ((data[t.value] || []).length === 0) loadTab(t.value); 
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading items...</div>
            </div>
          ) : (
            <>
              {activeTab === 'test' && (
                <div className="mb-6 flex gap-2">
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      testSubTab === 'objective' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`} 
                    onClick={() => setTestSubTab('objective')}
                  >
                    Objective Tests
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      testSubTab === 'subjective' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`} 
                    onClick={() => setTestSubTab('subjective')}
                  >
                    Subjective Tests
                  </button>
                </div>
              )}
              {visibleList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-2">No items found</div>
                  <div className="text-gray-400 text-sm">Try adjusting your search or filter criteria</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {visibleList.map((it) => (
                    <div 
                      key={it.id} 
                      className={`border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative ${
                        (activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) 
                          ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSelect(it.id)}
                    >
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="w-full h-32 object-cover bg-gray-100" />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-2xl mb-1">📚</div>
                            <div className="text-xs">No image</div>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.category}</div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          (activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id))
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selected.book.size + selected.workbook.size + selected.testObjective.size + selected.testSubjective.size}</span> items selected
                </div>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors" 
                    type="button" 
                    onClick={selectAllCurrent}
                  >
                    Select All
                  </button>
                  <button 
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors" 
                    type="button" 
                    onClick={clearSelectedCurrent}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bundled Items</h3>
              <p className="text-sm text-gray-600">{planItems.length} items included</p>
            </div>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
              onClick={() => { setPickerOpen(true); if (data.book.length === 0) loadTab('book'); }}
            >
              + Add Items
            </button>
          </div>
          {planItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No items added yet</div>
              <div className="text-gray-400 text-sm">Click "Add Items" to include content in this plan</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {planItems.map((it) => (
                <div key={it._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-3">
                      {getPlanItemImageUrl(it) ? (
                        <img src={getPlanItemImageUrl(it)} alt={it.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">📦</div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{it.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{it.itemType.replace('-', ' ')}</div>
                      </div>
                    </div>
                    <button 
                      className="text-red-600 text-sm hover:text-red-700 hover:underline transition-colors" 
                      onClick={() => deleteItem(it._id)}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Select Items to Add</h3>
                <p className="text-sm text-gray-600">Choose items to include in this plan</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors" 
                onClick={() => setPickerOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex gap-2 mb-6">
                {TYPE_TABS.map((t) => (
                  <button 
                    key={t.value} 
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === t.value 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`} 
                    onClick={() => { 
                      setActiveTab(t.value); 
                      setFilterCategory('All');
                      setFilterSubCategory('All');
                      if ((data[t.value] || []).length === 0) loadTab(t.value); 
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mb-6">
                <input 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-1/2" 
                  placeholder="Search by name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
                <div className="flex items-center gap-4">
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={filterCategory} 
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setFilterSubCategory('All'); // Reset subcategory when main category changes
                    }}
                  >
                    <option value="All">All Categories</option>
                    {(() => {
                      const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
                      return Array.from(new Set((data[currentKey] || []).map((i) => i.category))).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ));
                    })()}
                  </select>
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={filterSubCategory} 
                    onChange={(e) => setFilterSubCategory(e.target.value)}
                    disabled={filterCategory === 'All'}
                  >
                    <option value="All">All Subcategories</option>
                    {(() => {
                      const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
                      const filteredItems = filterCategory === 'All' 
                        ? (data[currentKey] || [])
                        : (data[currentKey] || []).filter((i) => String(i.category).toLowerCase() === filterCategory.toLowerCase());
                      
                      const subcategories = new Set();
                      filteredItems.forEach((i) => {
                        const subCategory = i.subCategory === 'Other' && i.customSubCategory 
                          ? i.customSubCategory 
                          : i.subCategory;
                        if (subCategory) subcategories.add(subCategory);
                      });
                      
                      return Array.from(subcategories).map((sc) => (
                        <option key={sc} value={sc}>{sc}</option>
                      ));
                    })()}
                  </select>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selected.book.size + selected.workbook.size + selected.testObjective.size + selected.testSubjective.size}</span> selected
                  </div>
                </div>
              </div>
              <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading items...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                    {activeTab === 'test' && (
                      <div className="col-span-full mb-4">
                        <div className="flex gap-2">
                          <button 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              testSubTab === 'objective' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`} 
                            onClick={() => setTestSubTab('objective')}
                          >
                            Objective Tests
                          </button>
                          <button 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              testSubTab === 'subjective' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`} 
                            onClick={() => setTestSubTab('subjective')}
                          >
                            Subjective Tests
                          </button>
                        </div>
                      </div>
                    )}
                    {visibleList.map((it) => (
                      <div 
                        key={it.id} 
                        className={`border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative ${
                          (activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) 
                            ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSelect(it.id)}
                      >
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-full h-24 object-cover bg-gray-100" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="text-xl mb-1">📚</div>
                              <div className="text-xs">No image</div>
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.category}</div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            (activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id))
                              ? 'bg-blue-600 border-blue-600' 
                              : 'bg-white border-gray-300'
                          }`}>
                            {(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {visibleList.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <div className="text-gray-500 text-lg mb-2">No items found</div>
                        <div className="text-gray-400 text-sm">Try adjusting your search or filter criteria</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors" 
                onClick={() => setPickerOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" 
                onClick={addSelectedItemsToPlan}
              >
                Add Selected ({selected.book.size + selected.workbook.size + selected.testObjective.size + selected.testSubjective.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
