import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const CATEGORY_OPTIONS = ['Basic', 'Premium', 'Enterprise'];
const TYPE_TABS = [
  { value: 'book', label: 'AIBooks' },
  { value: 'workbook', label: 'AIWorkbooks' },
  { value: 'test', label: 'AITtests' }
];

const initialPlan = {
  name: '',
  description: '',
  duration: 30,
  credits: 0,
  MRP: 0,
  offerPrice: 0,
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
            duration: p.duration || 30,
            credits: p.credits || 0,
            MRP: p.MRP || 0,
            offerPrice: p.offerPrice || 0,
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
      category: x.mainCategory || x.category || 'General'
    };
  }

  const visibleList = (() => {
    const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
    let list = data[currentKey] || [];
    if (filterCategory !== 'All') list = list.filter((i) => String(i.category).toLowerCase() === filterCategory.toLowerCase());
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
      if (isEdit) {
        const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(plan)
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
          body: JSON.stringify({ ...plan, items })
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
    <div className="flex items-center space-x-4 p-4">
      <button
        onClick={() => navigate("/plans")}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back to Plan
      </button>
    </div>
  </div>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{isEdit ? 'Edit Plan' : 'Create Plan'}</h2>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={submitPlan} className="bg-white border rounded shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border p-2 rounded" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <input className="w-full border p-2 rounded" value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (days)</label>
          <input type="number" className="w-full border p-2 rounded" value={plan.duration} onChange={(e) => setPlan({ ...plan, duration: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Credits</label>
          <input type="number" className="w-full border p-2 rounded" value={plan.credits} onChange={(e) => setPlan({ ...plan, credits: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">MRP</label>
          <input type="number" className="w-full border p-2 rounded" value={plan.MRP} onChange={(e) => setPlan({ ...plan, MRP: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Offer Price</label>
          <input type="number" className="w-full border p-2 rounded" value={plan.offerPrice} onChange={(e) => setPlan({ ...plan, offerPrice: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="w-full border p-2 rounded" value={plan.category} onChange={(e) => setPlan({ ...plan, category: e.target.value })}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image Key</label>
          <input className="w-full border p-2 rounded" value={plan.imageKey} onChange={(e) => setPlan({ ...plan, imageKey: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Video Key</label>
          <input className="w-full border p-2 rounded" value={plan.videoKey} onChange={(e) => setPlan({ ...plan, videoKey: e.target.value })} />
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded">{submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Plan')}</button>
          <button type="button" className="border px-4 py-2 rounded" onClick={() => navigate('/plans')}>Cancel</button>
        </div>
      </form>

      {!isEdit && (
        <div className="bg-white border rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              {TYPE_TABS.map((t) => (
                <button key={t.value} className={`px-3 py-2 rounded ${activeTab === t.value ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`} onClick={() => { setActiveTab(t.value); if ((data[t.value] || []).length === 0) loadTab(t.value); }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select className="border p-2 rounded" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option>All</option>
                {Array.from(new Set((data[activeTab] || []).map((i) => i.category))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input className="border p-2 rounded" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {activeTab === 'test' && (
                <div className="mb-3 flex gap-2">
                  <button className={`px-3 py-1 rounded text-sm ${testSubTab === 'objective' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTestSubTab('objective')}>Objective</button>
                  <button className={`px-3 py-1 rounded text-sm ${testSubTab === 'subjective' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTestSubTab('subjective')}>Subjective</button>
                </div>
              )}
              {visibleList.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No items</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {visibleList.map((it) => (
                    <div key={it.id} className={`border rounded overflow-hidden hover:shadow transition relative ${(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) ? 'ring-2 ring-blue-500' : ''}`}>
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="w-full h-32 object-cover bg-gray-100" />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                      )}
                      <div className="p-3">
                        <div className="text-sm font-medium line-clamp-2">{it.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{it.category}</div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <input type="checkbox" checked={(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id))} onChange={() => toggleSelect(it.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Selected: {selected.book.size + selected.workbook.size + selected.testObjective.size + selected.testSubjective.size}</div>
                <div className="flex gap-2">
                  <button className="border px-3 py-2 rounded" type="button" onClick={selectAllCurrent}>Select All</button>
                  <button className="border px-3 py-2 rounded" type="button" onClick={clearSelectedCurrent}>Clear</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isEdit && (
        <div className="bg-white border rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Bundled Items ({planItems.length})</div>
            <button className="text-blue-600 hover:underline" onClick={() => { setPickerOpen(true); if (data.book.length === 0) loadTab('book'); }}>+ Add Items</button>
          </div>
          {planItems.length === 0 ? (
            <div className="text-sm text-gray-500">No items</div>
          ) : (
            <ul className="divide-y">
              {planItems.map((it) => (
                <li key={it._id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.itemType}</div>
                  </div>
                  <button className="text-red-600 text-sm hover:underline" onClick={() => deleteItem(it._id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-lg font-semibold">Select Items</div>
              <button className="text-gray-600" onClick={() => setPickerOpen(false)}>✕</button>
            </div>
            <div className="px-4 pt-3">
              <div className="flex gap-3 border-b">
                {TYPE_TABS.map((t) => (
                  <button key={t.value} className={`px-3 py-2 -mb-px border-b-2 ${activeTab === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`} onClick={() => { setActiveTab(t.value); if ((data[t.value] || []).length === 0) loadTab(t.value); }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <input className="border p-2 rounded w-1/2" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="flex items-center gap-3">
                <select className="border p-2 rounded" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option>All</option>
                {(() => {
                  const currentKey = activeTab === 'test' ? (testSubTab === 'objective' ? 'testObjective' : 'testSubjective') : activeTab;
                  return Array.from(new Set((data[currentKey] || []).map((i) => i.category))).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ));
                })()}
                </select>
                <div className="text-sm text-gray-600">Selected: {selected.book.size + selected.workbook.size + selected.testObjective.size + selected.testSubjective.size}</div>
              </div>
              </div>
              <div className="mt-3 max-h-80 overflow-auto border rounded">
                {loading ? (
                  <div className="p-4">Loading...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3">
                    {activeTab === 'test' && (
                      <div className="col-span-full mb-2">
                        <div className="inline-flex gap-2">
                          <button className={`px-3 py-1 rounded text-sm ${testSubTab === 'objective' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTestSubTab('objective')}>Objective</button>
                          <button className={`px-3 py-1 rounded text-sm ${testSubTab === 'subjective' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTestSubTab('subjective')}>Subjective</button>
                        </div>
                      </div>
                    )}
                    {visibleList.map((it) => (
                      <label key={it.id} className={`border rounded overflow-hidden hover:shadow transition relative cursor-pointer ${(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id)) ? 'ring-2 ring-blue-500' : ''}`}>
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-full h-24 object-cover bg-gray-100" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                        )}
                        <div className="p-2 text-xs">
                          <div className="font-medium line-clamp-2">{it.name}</div>
                          <div className="text-gray-500">{it.category}</div>
                        </div>
                        <input type="checkbox" className="absolute top-2 right-2" checked={(activeTab === 'test' ? (testSubTab === 'objective' ? selected.testObjective.has(it.id) : selected.testSubjective.has(it.id)) : selected[activeTab].has(it.id))} onChange={() => toggleSelect(it.id)} />
                      </label>
                    ))}
                    {visibleList.length === 0 && (
                      <div className="col-span-full p-6 text-center text-gray-500">No items</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button className="border px-4 py-2 rounded" onClick={() => setPickerOpen(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addSelectedItemsToPlan}>Add Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
