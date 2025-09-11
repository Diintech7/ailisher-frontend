import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Plus,
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  X,
  Upload,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateQuestionBankModal({ isOpen, onClose, onCreate, categoryMappings, onCategoriesUpdated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    subcategory: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && {
        subcategory:
          (categoryMappings?.[value] && categoryMappings[value][0]) || "",
      }),
    }));
  };

  const refreshCategories = async () => {
    try {
      const token = Cookies.get("usertoken");
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await res.json();
      if (!Array.isArray(list)) return;
      const mappings = {};
      list.forEach((cat) => {
        mappings[cat.name] = (cat.subcategories || []).map((sc) => sc.name);
        if (mappings[cat.name].length === 0) mappings[cat.name] = ["Other"];
      });
      if (onCategoriesUpdated) onCategoriesUpdated(mappings);
    } catch (e) {
      console.error("Failed to refresh categories", e);
    }
  };

  // Image Upload Preview Component
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
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
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        onClose();
        return;
      }
      // Validate required fields
      const requiredFields = ["title", "description", "type"];
      for (const field of requiredFields) {
        if (!form[field] || !form[field].trim()) {
          toast.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
          );
          setIsSubmitting(false);
          return;
        }
      }
      let coverImageKey = null;
      if (coverImage) {
        // Get presigned URL
        const uploadUrlResponse = await axios.post(
          `${API_BASE_URL}/api/questionbank/upload-url`,
          {
            fileName: coverImage.name,
            contentType: coverImage.type,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const uploadUrlData = uploadUrlResponse.data;
        console.log(uploadUrlData)
        if (!uploadUrlData.success) {
          throw new Error(
            uploadUrlData.message || "Failed to get upload URL"
          );
        }
        const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
          method: "PUT",
          body: coverImage,
          headers: { "Content-Type": coverImage.type },
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to S3");
        }
        coverImageKey = uploadUrlData.key;
      }
      // Prepare data for backend
      const Data = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        category: form.category,
        subcategory: form.subcategory,
      };
      if (coverImageKey) Data.coverImageKey = coverImageKey;
      // Send to backend
      const response = await fetch("http://localhost:5000/api/questionbank", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Data),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Question bank created successfully!");
        onCreate(data.data);
        onClose();
        setForm({
          title: "",
          description: "",
          type: "",
          category: "",
          subcategory: "",
        });
        setCoverImage(null);
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(data.message || "Failed to create workbook");
      }
    } catch (err) {
      // onCreate will toast errors
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Create Question Bank
          </h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Algebra QBank"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="Subjective">Subjective</option>
              <option value="Objective">Objective</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Short description"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Category
              </label>
              <div className="flex items-center gap-2">
                <select
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {Object.keys(categoryMappings || {}).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-2 py-2 bg-indigo-600 text-white rounded-md"
                  onClick={() => setCreatingCategory((prev) => !prev)}
                >
                  New
                </button>
              </div>
              {creatingCategory && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Category name"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-green-600 text-white rounded-md"
                    onClick={async () => {
                      if (!newCategoryName.trim()) {
                        toast.error("Category name is required");
                        return;
                      }
                      try {
                        setIsSubmitting(true);
                        const token = Cookies.get("usertoken");
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
                          toast.success("Category created");
                          await refreshCategories();
                          setForm((prev) => ({ ...prev, category: data.name, subcategory: "" }));
                          setNewCategoryName("");
                          setCreatingCategory(false);
                        }
                      } catch (e) {
                        toast.error("Failed to create category");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md"
                    onClick={() => {
                      setCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Subcategory
              </label>
              <div className="flex items-center gap-2">
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled={!form.category}
                >
                  <option value="" disabled>
                    {form.category ? "Select subcategory" : "Select category first"}
                  </option>
                  {(categoryMappings?.[form.category] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="px-2 py-2 bg-indigo-600 text-white rounded-md"
                  onClick={() => setCreatingSubcategory((prev) => !prev)}
                  disabled={!form.category}
                >
                  New
                </button>
              </div>
              {creatingSubcategory && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Subcategory name"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-green-600 text-white rounded-md"
                    onClick={async () => {
                      if (!newSubcategoryName.trim()) {
                        toast.error("Subcategory name is required");
                        return;
                      }
                      try {
                        setIsSubmitting(true);
                        const token = Cookies.get("usertoken");
                        // fetch categories to find id for current selected category
                        const listRes = await fetch(`${API_BASE_URL}/api/categories`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const list = await listRes.json();
                        const currentCat = Array.isArray(list)
                          ? list.find((c) => c.name === form.category)
                          : null;
                        if (!currentCat) {
                          toast.error("Select a valid category first");
                          return;
                        }
                        const res = await fetch(`${API_BASE_URL}/api/categories/${currentCat._id}/subcategories`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ name: newSubcategoryName.trim() }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          toast.error(data?.error || "Failed to add subcategory");
                        } else {
                          toast.success("Subcategory created");
                          await refreshCategories();
                          setForm((prev) => ({ ...prev, subcategory: newSubcategoryName.trim() }));
                          setNewSubcategoryName("");
                          setCreatingSubcategory(false);
                        }
                      } catch (e) {
                        toast.error("Failed to create subcategory");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md"
                    onClick={() => {
                      setCreatingSubcategory(false);
                      setNewSubcategoryName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Cover Image (Optional)
            </label>
            <ImageUploadPreview
              imagePreview={imagePreview}
              onRemove={handleRemoveImage}
            />
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF (Max: 5MB)
                  </p>
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
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditQuestionBankModal({ isOpen, onClose, bank, onUpdated, categoryMappings }) {
  const [form, setForm] = useState({
    title: bank?.title || "",
    description: bank?.description || "",
    type: bank?.type || "Subjective",
    category: bank?.category || "",
    subcategory: bank?.subcategory || "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  useEffect(() => {
    setForm({
      title: bank?.title || "",
      description: bank?.description || "",
      type: bank?.type || "Subjective",
      category: bank?.category || "",
      subcategory: bank?.subcategory || "",
    });
    setImagePreview("");
    setCoverImage(null);
  }, [bank]);
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && {
        subcategory:
          (categoryMappings?.[value] && categoryMappings[value][0]) || "",
      }),
    }));
  };
  const [saving, setSaving] = useState(false);
  if (!isOpen || !bank) return null;
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const token = Cookies.get("usertoken");
      const res = await fetch(`${API_BASE_URL}/api/questionbank/${bank._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        let updated = data.data;
        // If cover selected, upload to R2 and update cover
        if (coverImage) {
          const uploadUrlResponse = await fetch(`${API_BASE_URL}/api/questionbank/upload-url`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: coverImage.name, contentType: coverImage.type })
          });
          const uploadUrlData = await uploadUrlResponse.json();
          if (!uploadUrlData.success) throw new Error(uploadUrlData.message || 'Failed to get upload URL');
          const uploadResponse = await fetch(uploadUrlData.uploadUrl, { method: 'PUT', body: coverImage, headers: { 'Content-Type': coverImage.type } });
          if (!uploadResponse.ok) throw new Error('Failed to upload image to S3');
          const coverRes = await fetch(`${API_BASE_URL}/api/questionbank/${bank._id}/cover`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: uploadUrlData.key })
          });
          const coverData = await coverRes.json();
          if (coverData.success) {
            updated = coverData.data;
          }
        }
        toast.success("Updated");
        onUpdated(updated);
        onClose();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit Question Bank</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input name="title" value={form.title} onChange={onChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select name="type" value={form.type} onChange={onChange} className="w-full border rounded px-3 py-2" required>
              <option value="Subjective">Subjective</option>
              <option value="Objective">Objective</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} className="w-full border rounded px-3 py-2" rows={3} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={onChange} className="w-full border rounded px-3 py-2">
                <option value="">Select category</option>
                {Object.keys(categoryMappings || {}).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={onChange} className="w-full border rounded px-3 py-2" disabled={!form.category}>
                <option value="">{form.category ? "Select subcategory" : "Select category first"}</option>
                {(categoryMappings?.[form.category] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Cover Image (Optional)</label>
            {imagePreview && (
              <div className="h-40 w-full rounded-md overflow-hidden mb-2">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const QuestionBankCard = ({ bank, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div 
      onClick={onClick}
      className="p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 pr-2">
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={bank.title}>{bank.title}</h3>
        </div>
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 rounded-full transition-colors text-gray-400 hover:text-red-600 hover:bg-pink-100 bg-pink-50"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
              <button className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50" onClick={onEdit}>Edit Bank</button>
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={onDelete}>Delete Bank</button>
            </div>
          )}
        </div>
      </div>
      <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
        {bank.coverImageUrl ? (
          <img 
            src={bank.coverImageUrl} 
            alt={bank.title} 
            className="h-full w-full object-fill rounded-lg"
            onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
          />
        ) : (
          <div className="text-5xl">📘</div>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-2 flex-grow">{bank.description || 'No description available'}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          
          {bank.type && (
            <span className="px-2 py-0.5 bg-gray-100 rounded">{bank.type}</span>
          )}
          {bank.status && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{bank.status}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionBank = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [categoryMappings, setCategoryMappings] = useState({});
  const [selectedSubCategories, setSelectedSubCategories] = useState({});
  const [editingBank, setEditingBank] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingBank, setDeletingBank] = useState(null);

  const navigate = useNavigate()

  const token = useMemo(() => Cookies.get("usertoken"), []);
  const authHeaders = useMemo(
    () => ({ Authorization: token ? `Bearer ${token}` : "" }),
    [token]
  );

  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      if (!token) {
        setError("Authentication required");
        return;
      }
      // Fetch categories
      const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: authHeaders,
      });
      const categoriesData = await categoriesRes.json();
      if (Array.isArray(categoriesData)) {
        const mappings = {};
        categoriesData.forEach((cat) => {
          if (cat.name) {
            mappings[cat.name] = (cat.subcategories || []).map((sc) => sc.name);
          }
        });
        setCategoryMappings(mappings);
      }
      // Fetch question banks
      const res = await fetch(`${API_BASE_URL}/api/questionbank`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        console.log(data)
        setBanks(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load question banks");
      }
    } catch (e) {
      setError("Failed to load question banks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const onCreate = (newquestionbank) => {
    if (newquestionbank && newquestionbank._id) {
      setBanks((prev) => [newquestionbank, ...prev]);
    } else if (newquestionbank?.data?._id) {
      setBanks((prev) => [newquestionbank.data, ...prev]);
    } else {
      fetchBanks();
    }
  };

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return banks.filter((b) => {
      const matchesQuery =
        q === "" || `${b.title} ${b.description}`.toLowerCase().includes(q);
      const matchesCat = !filterCategory || b.category === filterCategory;
      const matchesSub =
        !filterSubcategory || b.subcategory === filterSubcategory;
      return matchesQuery && matchesCat && matchesSub;
    });
  }, [banks, search, filterCategory, filterSubcategory]);

  const categories = useMemo(() => {
    const set = new Set(banks.map((b) => b.category).filter(Boolean));
    return Array.from(set);
  }, [banks]);

  const subcategories = useMemo(() => {
    const set = new Set(
      banks
        .filter((b) => !filterCategory || b.category === filterCategory)
        .map((b) => b.subcategory)
        .filter(Boolean)
    );
    return Array.from(set);
  }, [banks, filterCategory]);

  // Group by category and then subcategory
  const grouped = useMemo(() => {
    const map = new Map();
    for (const b of filteredBanks) {
      const category = b.category || "Uncategorized";
      const subcategory = b.subcategory || "Other";
      if (!map.has(category)) map.set(category, new Map());
      const subMap = map.get(category);
      if (!subMap.has(subcategory)) subMap.set(subcategory, []);
      subMap.get(subcategory).push(b);
    }
    return Array.from(map.entries()).map(([cat, subMap]) => [cat, Array.from(subMap.entries())]);
  }, [filteredBanks]);

  const getSubCategoriesForCategory = (category) => {
    const standard = categoryMappings[category] || [];
    const present = filteredBanks
      .filter((b) => b.category === category && b.subcategory)
      .map((b) => b.subcategory);
    return Array.from(new Set([...(standard || []), ...present]));
  };

  const toggleSubCategory = (category, subCategory) => {
    setSelectedSubCategories((prev) => ({
      ...prev,
      [category]: prev[category] === subCategory ? null : subCategory,
    }));
  };

  const handleEditBank = (bank) => {
    setEditingBank(bank);
    setShowEditModal(true);
  };

  const handleBankUpdated = (updated) => {
    setBanks((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
  };

  const handleDeleteBank = async (bank) => {
    setDeletingBank(bank);
  };

  const confirmDelete = async () => {
    if (!deletingBank) return;
    try {
      const token = Cookies.get("usertoken");
      const res = await fetch(`${API_BASE_URL}/api/questionbank/${deletingBank._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted");
        setBanks((prev) => prev.filter((b) => b._id !== deletingBank._id));
        setDeletingBank(null);
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Question Bank</h1>
            <p className="text-gray-600">
              Create Question Banks and upload question PDFs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBanks()}
              className="inline-flex items-center px-3 py-2 rounded bg-white border hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" /> Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              <Plus size={16} className="mr-2" /> Create Question Bank
            </button>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded pl-9 pr-3 py-2"
                placeholder="Search by title or description"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory("");
              }}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Subcategories</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div> */}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-600"></div>
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
        ) : filteredBanks.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No Question Banks
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first question bank to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              <Plus size={16} className="mr-2" /> Add Question Bank
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([cat, subPairs]) => {
              const selected = selectedSubCategories[cat];
              const subs = getSubCategoriesForCategory(cat);
              const visibleItems = (subPairs || []).flatMap(([sub, items]) =>
                !selected || selected === sub ? items : []
              );
              return (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-2xl font-bold text-gray-800">{cat}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => toggleSubCategory(cat, null)}
                      className={`px-3 py-1.5 rounded-full text-sm ${!selected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      All {cat}
                    </button>
                    {subs.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSubCategory(cat, s)}
                        className={`px-3 py-1.5 rounded-full text-sm ${selected === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleItems.map((b) => (
                      <QuestionBankCard
                        key={b._id}
                        bank={b}
                        onClick={() => navigate(`/question-bank/${b.type}/${b._id}`)}
                        onEdit={(e) => {
                          e.stopPropagation();
                          handleEditBank(b);
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          handleDeleteBank(b);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateQuestionBankModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={onCreate}
        categoryMappings={categoryMappings}
        onCategoriesUpdated={setCategoryMappings}
      />
      <EditQuestionBankModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        bank={editingBank}
        onUpdated={handleBankUpdated}
        categoryMappings={categoryMappings}
      />
      {deletingBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Question Bank</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "{deletingBank.title}"?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded border bg-white hover:bg-gray-50" onClick={() => setDeletingBank(null)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
