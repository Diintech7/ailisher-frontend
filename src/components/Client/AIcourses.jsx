import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { Plus, Trash2, Edit, Image as ImageIcon, Loader2, AlertTriangle, Book } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// const API_BASE_URL = 'https://test.ailisher.com';
const API_BASE_URL = 'https://test.ailisher.com';


const initialForm = {
  title: '',
  overview: '',
  details: '',
  mainCategory: 'Other',
  subCategory: 'Other',
  customSubCategory: '',
  tags: '',
  coverImageFile: null,
  coverImageKey: '',
  coverImageUrl: '',
  faculty: [{ name: '', about: '', facultyImageFile: null, facultyImageKey: '', facultyImageUrl: '' }]
};

const AIcourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]); // [{_id,name,subcategories:[{name}]}]
  const [subcategoriesMap, setSubcategoriesMap] = useState({}); // { [mainName]: [subNames] }
  const [catsLoading, setCatsLoading] = useState(false);
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState({}); // { [mainCategory]: selectedSub or null }

  const getSubCategories = (main) => {
    const fromMapping = subcategoriesMap[main];
    if (fromMapping && fromMapping.length) return fromMapping;
    const subSet = new Set();
    (courses || []).forEach((c) => {
      const mainCat = c?.mainCategory || 'Other';
      if (mainCat === main) subSet.add(c?.subCategory || 'Other');
    });
    return Array.from(subSet);
  };

  const toggleSubCategory = (main, sub) => {
    setSelectedSubCategories((prev) => ({ ...prev, [main]: sub || null }));
  };

  const getItemsForMain = (main, subMap) => {
    const sel = selectedSubCategories[main];
    return sel ? (subMap[sel] || []) : Object.values(subMap).flat();
  };

  const token = useMemo(() => Cookies.get('usertoken'), []);

  const authHeaders = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/aicourses`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch AI courses');
      setCourses(data.courses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    fetchCourses();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
    // Fetch categories when opening form
    fetchCategories();
  };

  const openEdit = async (course) => {
    // Fetch full course (ensures faculty array and URLs are present)
    let src = course;
    try {
      const res = await fetch(`${API_BASE_URL}/api/aicourses/${course._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data?.success && data.course) src = data.course;
    } catch (_) {}

    const normalizedFaculty = Array.isArray(src?.faculty)
      ? src.faculty
          .filter((f) => f && typeof f === 'object')
          .map((f) => ({
            name: f.name || '',
            about: f.about || '',
            facultyImageFile: null,
            facultyImageKey: f.facultyImageKey || '',
            facultyImageUrl: f.facultyImageUrl || ''
          }))
      : [];

    setForm({
      ...initialForm,
      title: src.title || '',
      overview: src.overview || '',
      details: src.details || '',
      mainCategory: src.mainCategory || 'Other',
      subCategory: src.subCategory || 'Other',
      customSubCategory: src.customSubCategory || '',
      tags: Array.isArray(src.tags) ? src.tags.join(', ') : (src.tags || ''),
      coverImageFile: null,
      coverImageKey: src.coverImageKey || '',
      coverImageUrl: src.coverImageUrl || '',
      faculty: normalizedFaculty.length ? normalizedFaculty : [{ name: '', about: '', facultyImageFile: null, facultyImageKey: '', facultyImageUrl: '' }]
    });
    setEditingId(src._id || course._id);
    setShowForm(true);
    fetchCategories();
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Close open item menu when clicking anywhere outside menu/button
  useEffect(() => {
    const handleGlobalMouseDown = () => setMenuOpenIdx(null);
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, []);

  const handleFacultyChange = (idx, field, value) => {
    setForm(prev => {
      const faculty = [...prev.faculty];
      faculty[idx] = { ...faculty[idx], [field]: value };
      return { ...prev, faculty };
    });
  };

  const addFaculty = () => setForm(prev => ({ ...prev, faculty: [...prev.faculty, { name: '', about: '', facultyImageFile: null, facultyImageKey: '', facultyImageUrl: '' }] }));
  const removeFaculty = (idx) => setForm(prev => ({ ...prev, faculty: prev.faculty.filter((_, i) => i !== idx) }));

  // Fetch categories and build mapping
  const fetchCategories = async () => {
    try {
      setCatsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const list = await res.json();
      if (Array.isArray(list)) {
        setCategories(list);
        const map = {};
        list.forEach(c => {
          const subs = (c.subcategories || []).map(sc => sc.name);
          map[c.name] = subs.length ? subs : ['Other'];
        });
        setSubcategoriesMap(map);
        // Ensure current form selections are valid
        setForm(prev => {
          const main = prev.mainCategory && map[prev.mainCategory] ? prev.mainCategory : (list[0]?.name || 'Other');
          const subsForMain = map[main] || ['Other'];
          const sub = subsForMain.includes(prev.subCategory) ? prev.subCategory : subsForMain[0];
          return { ...prev, mainCategory: main, subCategory: sub };
        });
      }
    } catch (e) {
      // ignore silently; UI will still allow manual entry
    } finally {
      setCatsLoading(false);
    }
  };

  // Upload helper: requests presigned URL then uploads the file, returns { key }
  const uploadFileToS3 = async (file, type = 'cover') => {
    if (!file) return { key: '', url: '' };
    const upRes = await fetch(`${API_BASE_URL}/api/aicourses/upload-url`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, type })
    });
    const upData = await upRes.json();
    if (!upRes.ok || !upData.success) throw new Error(upData.message || 'Failed to get upload URL');
    const putRes = await fetch(upData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!putRes.ok) throw new Error('Failed to upload file');
    return { key: upData.key };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Upload cover first if provided
      let coverKey = form.coverImageKey;
      if (form.coverImageFile) {
        const { key } = await uploadFileToS3(form.coverImageFile, 'cover');
        coverKey = key;
      }

      // Upload faculty images and prepare faculty payload
      const facultyPayload = [];
      for (const fac of form.faculty) {
        let fKey = fac.facultyImageKey;
        if (fac.facultyImageFile) {
          const { key } = await uploadFileToS3(fac.facultyImageFile, 'faculty');
          fKey = key;
        }
        facultyPayload.push({ name: fac.name, about: fac.about, facultyImageKey: fKey });
      }

      const payload = {
        title: form.title,
        overview: form.overview,
        details: form.details,
        coverImageKey: coverKey,
        mainCategory: form.mainCategory,
        subCategory: form.subCategory,
        customSubCategory: form.customSubCategory || undefined,
        tags: form.tags,
        faculty: facultyPayload
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/api/aicourses/${editingId}` : `${API_BASE_URL}/api/aicourses`;
      const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save AI course');
      await fetchCourses();
      closeForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this AI course?')) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/aicourses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
      await fetchCourses();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Courses</h1>
          <p className="text-gray-600">
            Manage your collection of AI-powered courses
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openCreate}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle
            className="text-red-500 mr-3 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Book size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No courses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first AI course to get started
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Add Course</span>
          </button>
        </div>
      )  : (
        <>
          {Object.entries(
            courses.reduce((acc, c) => {
              const main = c.mainCategory || 'Other';
              const sub = c.subCategory || 'Other';
              acc[main] = acc[main] || {};
              acc[main][sub] = acc[main][sub] || [];
              acc[main][sub].push(c);
              return acc;
            }, {})
          ).map(([main, subMap]) => (
            <div key={main} className="mb-10">
              <div className="border-b border-gray-200 pb-2 mb-4">
                <h2 className="text-xl font-bold text-gray-800">{main}</h2>
              </div>
                {/* Subcategories List */}
                <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => toggleSubCategory(main, null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedSubCategories[main]
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All {main}
                </button>
                {getSubCategories(main).map((subCategory) => (
                  <button
                    key={subCategory}
                    onClick={() =>
                      toggleSubCategory(main, subCategory)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSubCategories[main] === subCategory
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {subCategory}
                  </button>
                ))}
              </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getItemsForMain(main, subMap).map((c) => (
                      <div key={c._id} className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col cursor-pointer" onClick={() => navigate(`/ai-courses/${c._id}`)}>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenIdx(menuOpenIdx === c._id ? null : c._id); }}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </button>
                          {menuOpenIdx === c._id && (
                            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-md z-10">
                              <button
                                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                                onClick={(e) => { e.stopPropagation(); openEdit(c); setMenuOpenIdx(null); }}
                              >Edit</button>
                              <button
                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); setMenuOpenIdx(null); handleDelete(c._id); }}
                              >Delete</button>
                            </div>
                          )}
                        </div>
                        <div className="w-full h-40 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
                          {c.coverImageUrl ? (
                            <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-300" size={40} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">{c.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{c.overview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit AI Course' : 'Add AI Course'}</h2>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Overview</label>
                  <input name="overview" value={form.overview} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Details</label>
                  <textarea name="details" value={form.details} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Main Category</label>
                  {Object.keys(subcategoriesMap).length > 0 ? (
                    <select
                      name="mainCategory"
                      value={form.mainCategory}
                      onChange={(e) => {
                        const main = e.target.value;
                        const subs = subcategoriesMap[main] || ['Other'];
                        setForm(prev => ({ ...prev, mainCategory: main, subCategory: subs.includes(prev.subCategory) ? prev.subCategory : subs[0] }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      {Object.keys(subcategoriesMap).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <input name="mainCategory" value={form.mainCategory} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                  )}
                  {catsLoading && <div className="text-xs text-gray-500 mt-1">Loading categories...</div>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Sub Category</label>
                  {subcategoriesMap[form.mainCategory]?.length ? (
                    <select
                      name="subCategory"
                      value={form.subCategory}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                    >
                      {subcategoriesMap[form.mainCategory].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ) : (
                    <input name="subCategory" value={form.subCategory} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                  )}
                </div>
                {/* <div>
                  <label className="block text-sm text-gray-700 mb-1">Custom Subcategory</label>
                  <input name="customSubCategory" value={form.customSubCategory} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                </div> */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Tags (CSV or JSON)</label>
                  <input name="tags" value={form.tags} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Cover Image</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-orange-400 transition"
                    onClick={() => document.getElementById('aicourse-cover-input')?.click()}
                  >
                    {form.coverImageFile ? (
                      <img
                        src={URL.createObjectURL(form.coverImageFile)}
                        alt="cover-preview"
                        className="max-h-48 rounded"
                      />
                    ) : form.coverImageUrl ? (
                      <img src={form.coverImageUrl} alt="cover" className="max-h-48 rounded" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="mx-auto mb-2" />
                        <div>Click to upload cover image</div>
                        <div className="text-xs">PNG, JPG up to 5MB</div>
                      </div>
                    )}
                  </div>
                  <input
                    id="aicourse-cover-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setForm(prev => ({ ...prev, coverImageFile: e.target.files?.[0] || null }))}
                  />
                  {/* {(form.coverImageFile || form.coverImageUrl) && (
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded border"
                        onClick={() => document.getElementById('aicourse-cover-input')?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded border text-red-600"
                        onClick={() => setForm(prev => ({ ...prev, coverImageFile: null, coverImageUrl: '', coverImageKey: '' }))}
                      >
                        Remove
                      </button>
                    </div>
                  )} */}
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Faculty</h3>
                  <button type="button" onClick={addFaculty} className="text-sm text-orange-600 hover:text-orange-700">+ Add Faculty</button>
                </div>
                {form.faculty.map((f, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 border p-3 rounded">
                    <input placeholder="Name" value={f.name} onChange={(e) => handleFacultyChange(idx, 'name', e.target.value)} className="border rounded px-3 py-2" />
                    <input placeholder="About" value={f.about} onChange={(e) => handleFacultyChange(idx, 'about', e.target.value)} className="border rounded px-3 py-2" />
                    <div className="flex items-center gap-4">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded p-2 flex items-center justify-center cursor-pointer hover:border-orange-400 min-w-[110px] min-h-[64px]"
                        onClick={() => document.getElementById(`fac-img-${idx}`)?.click()}
                      >
                        {f.facultyImageFile ? (
                          <img src={URL.createObjectURL(f.facultyImageFile)} alt="faculty" className="h-16 w-16 object-cover rounded" />
                        ) : f.facultyImageUrl ? (
                          <img src={f.facultyImageUrl} alt="faculty" className="h-16 w-16 object-cover rounded" />
                        ) : (
                          <ImageIcon className="text-gray-300" size={24} />
                        )}
                      </div>
                      <input id={`fac-img-${idx}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFacultyChange(idx, 'facultyImageFile', e.target.files?.[0] || null)} />
                      {/* {(f.facultyImageFile || f.facultyImageUrl) && (
                        <>
                          <button type="button" className="px-2 py-1 text-sm rounded border" onClick={() => document.getElementById(`fac-img-${idx}`)?.click()}>Change</button>
                          <button type="button" className="px-2 py-1 text-sm rounded border text-red-600" onClick={() => handleFacultyChange(idx, 'facultyImageFile', null) || handleFacultyChange(idx, 'facultyImageUrl', '') || handleFacultyChange(idx, 'facultyImageKey', '')}>Remove</button>
                        </>
                      )} */}
                      <div className="flex items-center gap-2"><button type="button" onClick={() => removeFaculty(idx)} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 flex items-center">
                  {submitting && <Loader2 className="animate-spin mr-2" />} {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIcourses;


