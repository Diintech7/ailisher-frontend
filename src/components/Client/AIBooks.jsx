import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Book,
  ChevronRight,
  Plus,
  Database,
  ArrowLeft,
  AlertTriangle,
  Image,
  Upload,
  X,
  Search,
  Filter,
  ChevronDown,
  Star,
  TrendingUp,
  Edit,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 1. Add constants for languages and categories (can be hardcoded or fetched if needed)
const LANGUAGES = [
  "Hindi",
  "English",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Gujarati",
  "Urdu",
  "Kannada",
  "Odia",
  "Malayalam",
  "Punjabi",
  "Assamese",
  "Other",
];

const BookItem = ({
  book,
  onClick,
  onToggleHighlight,
  onToggleTrending,
  currentUser,
  onEdit,
  categoryMappings,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const displaySubCategory =
    book.subCategory === "Other" && book.customSubCategory
      ? book.customSubCategory
      : book.subCategory;

  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a full URL (http/https), return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // If it's a data URL, return as is
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    // If it's an S3 URL, return as is
    if (imageUrl.includes("amazonaws.com")) {
      return imageUrl;
    }

    // For local files, construct the full URL
    return `http://localhost:5000/${imageUrl}`;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleHighlight = async (e) => {
    e.stopPropagation();
    try {
      await onToggleHighlight(book._id, !book.isHighlighted);
      toast.success(
        `Book ${book.isHighlighted ? "removed from" : "added to"} highlights`
      );
    } catch (error) {
      toast.error("Failed to update highlight status");
    }
  };

  const handleToggleTrending = async (e) => {
    e.stopPropagation();
    try {
      await onToggleTrending(book._id, !book.isTrending);
      toast.success(
        `Book ${book.isTrending ? "removed from" : "added to"} trending`
      );
    } catch (error) {
      toast.error("Failed to update trending status");
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Stop event from bubbling up to the card
    setShowEditModal(true);
    setShowMenu(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/books/${book._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Book deleted successfully");
        // Refresh the page to update the book list
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to delete book");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Failed to delete book");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Book Card */}
      <div
        onClick={onClick}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 relative"
      >
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {book.isHighlighted && (
            <div className="bg-yellow-100 text-yellow-800 p-1 rounded-full">
              <Star size={12} />
            </div>
          )}
          {book.isTrending && (
            <div className="bg-red-100 text-red-800 p-1 rounded-full">
              <TrendingUp size={12} />
            </div>
          )}
          {/* Three dots menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event from bubbling up to the card
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-full transition-colors text-gray-400 hover:text-red-600 hover:bg-pink-100 bg-pink-50"
              title="More options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                >
                  <Edit size={14} className="mr-2" />
                  Edit Book
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <X size={14} className="mr-2" />
                  Delete Book
                </button>
              </div>
            )}
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          {book.title}
        </h3>

        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 mb-4 rounded-lg flex items-center justify-center overflow-hidden">
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="h-full w-full object-fill rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "";
              }}
            />
          ) : book.coverImage ? (
            <img
              src={getCompleteImageUrl(book.coverImage)}
              alt={book.title}
              className="h-full w-full object-fill rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "";
              }}
            />
          ) : (
            <Book size={64} className="text-indigo-400" />
          )}
        </div>

        <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
        <p className="text-gray-500 text-xs mb-2">{book.publisher}</p>
        <p className="text-gray-600 text-sm flex-grow">
          {book.description || "No description available"}
        </p>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            {/* Highlight toggle button */}
            <button
              onClick={handleToggleHighlight}
              className={`p-1 rounded transition-colors ${
                book.isHighlighted
                  ? "text-yellow-600 bg-yellow-100 hover:bg-yellow-200"
                  : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
              }`}
              title={
                book.isHighlighted
                  ? "Remove from highlights"
                  : "Add to highlights"
              }
            >
              <Star size={16} />
            </button>

            {/* Trending toggle button */}
            <button
              onClick={handleToggleTrending}
              className={`p-1 rounded transition-colors ${
                book.isTrending
                  ? "text-red-600 bg-red-100 hover:bg-red-200"
                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              }`}
              title={
                book.isTrending ? "Remove from trending" : "Add to trending"
              }
            >
              <TrendingUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Book Modal */}
      {showEditModal && (
        <EditBookModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onEdit={onEdit}
          book={book}
          currentUser={currentUser}
          categoryMappings={categoryMappings}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Delete Book
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{book.title}"? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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

const FiltersPanel = ({
  filters,
  onFiltersChange,
  onClearFilters,
  authors,
  publishers,
  allBooks,
  categoryMappings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Odia",
    "Malayalam",
    "Punjabi",
    "Assamese",
    "Other",
  ];

  const customSubCategories = [
    ...new Set(
      allBooks
        .filter(
          (book) => book.subCategory === "Other" && book.customSubCategory
        )
        .map((book) => book.customSubCategory)
    ),
  ].sort();

  const allTags = [
    ...new Set(allBooks.flatMap((book) => book.tags || [])),
  ].sort();

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const getValidSubCategories = () => {
    if (!filters.mainCategory) {
      return [];
    }

    const standardCategories = categoryMappings[filters.mainCategory] || [];

    if (filters.mainCategory === "Other") {
      return [...standardCategories, ...customSubCategories];
    }
    return standardCategories;
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && (typeof value === "string" ? value.trim() : true)
  );

  const handleClearFilters = (e) => {
    e.stopPropagation();
    onClearFilters();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 max-w-3xl">
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
            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by title, author, or description..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Category
              </label>
              <select
                value={filters.mainCategory || ""}
                onChange={(e) => {
                  const newMainCategory = e.target.value;
                  handleFilterChange("mainCategory", newMainCategory);
                  handleFilterChange("subCategory", "");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryMappings).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Category
              </label>
              <select
                value={filters.subCategory || ""}
                onChange={(e) =>
                  handleFilterChange("subCategory", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!filters.mainCategory}
              >
                <option value="">All Subcategories</option>
                {getValidSubCategories().map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={filters.language || ""}
                onChange={(e) => handleFilterChange("language", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <select
                value={filters.author || ""}
                onChange={(e) => handleFilterChange("author", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Authors</option>
                {authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <select
                value={filters.tag || ""}
                onChange={(e) => handleFilterChange("tag", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Books</option>
                <option value="highlighted">Highlighted Only</option>
                <option value="trending">Trending Only</option>
                <option value="normal">Normal Only</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddBookModal = ({
  isOpen,
  onClose,
  onAdd,
  currentUser,
  categoryMappings,
  onCategoriesUpdated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    publisher: "",
    language: "English",
    mainCategory: "Other",
    subCategory: "Other",
    customSubCategory: "",
    exam: "",
    paper: "",
    subject: "",
    tags: "",
    isHighlighted: false,
    categoryOrder: 0,
    rating: 0,
    ratingCount: 0,
    conversations: [],
    users: [],
    summary: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const languages = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Odia",
    "Malayalam",
    "Punjabi",
    "Assamese",
    "Other",
  ];

  const [formErrors, setFormErrors] = useState({
    rating: "",
    ratingCount: "",
    summary: "",
  });

  if (!isOpen) return null;

  const refreshCategories = async () => {
    try {
      const token = Cookies.get("usertoken");
      const res = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await res.json();
      if (!Array.isArray(list)) return;
      // Convert list to mappings
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setCreatingCategory(true);
      const token = Cookies.get("usertoken");
      const res = await fetch("http://localhost:5000/api/categories", {
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
        setFormData((prev) => ({
          ...prev,
          mainCategory: data.name,
          subCategory: "Other",
        }));
        setNewCategoryName("");
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
      const token = Cookies.get("usertoken");
      // Need category id; fetch categories and find the current mainCategory
      const listRes = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = await listRes.json();
      const currentCat = Array.isArray(list)
        ? list.find((c) => c.name === formData.mainCategory)
        : null;
      if (!currentCat) {
        toast.error("Select a valid main category first");
        return;
      }
      const res = await fetch(
        `http://localhost:5000/api/categories/${currentCat._id}/subcategories`,
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
        toast.success("Subcategory created");
        await refreshCategories();
        setFormData((prev) => ({
          ...prev,
          subCategory: newSubcategoryName.trim(),
        }));
        setNewSubcategoryName("");
      }
    } catch (e) {
      toast.error("Failed to create subcategory");
    } finally {
      setCreatingSubcategory(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (
      formData.rating &&
      (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5)
    ) {
      errors.rating = "Rating must be between 0 and 5";
    }
    if (
      formData.ratingCount &&
      (isNaN(formData.ratingCount) || formData.ratingCount < 0)
    ) {
      errors.ratingCount = "Rating count must be a non-negative number";
    }
    if (formData.summary && formData.summary.length > 1000) {
      errors.summary = "Summary cannot exceed 1000 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for numeric inputs
    if (
      name === "rating" ||
      name === "ratingCount" ||
      name === "categoryOrder"
    ) {
      const numValue = value === "" ? "" : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else if (name === "conversations" || name === "users") {
      // Handle arrays for conversations and users
      const arrayValue = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setFormData((prev) => ({
        ...prev,
        [name]: arrayValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "mainCategory" && {
          subCategory: categoryMappings[value]?.[0] || "Other",
          customSubCategory: "",
        }),
      }));
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        onClose();
        return;
      }

      const requiredFields = ["title", "description", "author", "publisher"];
      for (const field of requiredFields) {
        if (!formData[field] || !formData[field].trim()) {
          toast.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
          );
          setIsSubmitting(false);
          return;
        }
      }

      let coverImageKey = null;

      // If there's a cover image, first get a presigned URL and upload to S3
      if (coverImage) {
        try {
          // Get presigned URL
          const uploadUrlResponse = await fetch(
            "http://localhost:5000/api/books/cover-upload-url",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: coverImage.name,
                contentType: coverImage.type,
              }),
            }
          );

          const uploadUrlData = await uploadUrlResponse.json();

          if (!uploadUrlData.success) {
            throw new Error(
              uploadUrlData.message || "Failed to get upload URL"
            );
          }

          // Upload to S3 using presigned URL
          const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
            method: "PUT",
            body: coverImage,
            headers: {
              "Content-Type": coverImage.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image to S3");
          }

          coverImageKey = uploadUrlData.key;
        } catch (error) {
          console.error("Error uploading cover image:", error);
          toast.error("Failed to upload cover image");
          setIsSubmitting(false);
          return;
        }
      }

      // Create book with all fields
      const bookData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        language: formData.language,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        isHighlighted: formData.isHighlighted,
        categoryOrder: parseInt(formData.categoryOrder) || 0,
        coverImageKey: coverImageKey,
        rating: parseFloat(formData.rating) || 0,
        ratingCount: parseInt(formData.ratingCount) || 0,
        conversations: Array.isArray(formData.conversations)
          ? formData.conversations
          : [],
        users: Array.isArray(formData.users) ? formData.users : [],
        summary: formData.summary.trim(),
      };

      // Add optional fields if they exist
      if (formData.exam.trim()) bookData.exam = formData.exam.trim();
      if (formData.paper.trim()) bookData.paper = formData.paper.trim();
      if (formData.subject.trim()) bookData.subject = formData.subject.trim();

      if (currentUser) {
        const clientId = currentUser.userId || currentUser.id;
        bookData.clientId = clientId;
      }

      if (
        formData.subCategory === "Other" &&
        formData.customSubCategory.trim()
      ) {
        bookData.customSubCategory = formData.customSubCategory.trim();
      }

      if (formData.tags.trim()) {
        const tagsArray = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0 && tag.length <= 30)
          .slice(0, 10);
        if (tagsArray.length > 0) {
          bookData.tags = tagsArray;
        }
      }

      console.log("Sending book data:", bookData);

      const response = await fetch("http://localhost:5000/api/books", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Book created successfully!");
        onAdd(data.book);
        onClose();
        setFormData({
          title: "",
          description: "",
          author: "",
          publisher: "",
          language: "English",
          mainCategory: "Other",
          subCategory: "Other",
          exam: "",
          paper: "",
          subject: "",
          tags: "",
          isHighlighted: false,
          categoryOrder: 0,
          rating: 0,
          ratingCount: 0,
          conversations: [],
          users: [],
          summary: "",
        });
        setCoverImage(null);
        setImagePreview("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        if (Array.isArray(data.message)) {
          data.message.forEach((msg) => toast.error(msg));
        } else {
          toast.error(data.message || "Failed to create book");
        }
      }
    } catch (error) {
      console.error("Error creating book:", error);
      toast.error("An error occurred while creating the book");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidSubCategories = () => {
    return categoryMappings[formData.mainCategory] || ["Other"];
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title *{" "}
                  <span className="text-gray-500">
                    ({formData.title.length}/100)
                  </span>
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
                  Author *{" "}
                  <span className="text-gray-500">
                    ({formData.author.length}/100)
                  </span>
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
                  Publisher *{" "}
                  <span className="text-gray-500">
                    ({formData.publisher.length}/100)
                  </span>
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
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Language *
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description *{" "}
                <span className="text-gray-500">
                  ({formData.description.length}/1000)
                </span>
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
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Main Category *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    name="mainCategory"
                    value={formData.mainCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {Object.keys(categoryMappings).map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                      onClick={handleCreateCategory}
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
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Sub Category *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {(categoryMappings[formData.mainCategory] || ["Other"]).map(
                      (subCategory) => (
                        <option key={subCategory} value={subCategory}>
                          {subCategory}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="button"
                    className="px-2 py-2 bg-indigo-600 text-white rounded-md"
                    onClick={() => setCreatingSubcategory((prev) => !prev)}
                    disabled={!formData.mainCategory}
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
                      onClick={handleCreateSubcategory}
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

            {/* <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Category Order
              </label>
              <input
                type="number"
                name="categoryOrder"
                value={formData.categoryOrder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                placeholder="Enter category order (0 for default)"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the category list</p>
            </div> */}

            {/* New fields: Exam, Paper, Subject */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Exam{" "}
                  <span className="text-gray-500">
                    ({formData.exam.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="exam"
                  value={formData.exam}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. UPSC, SSC"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Paper{" "}
                  <span className="text-gray-500">
                    ({formData.paper.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="paper"
                  value={formData.paper}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Prelims, Mains"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Subject{" "}
                  <span className="text-gray-500">
                    ({formData.subject.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Mathematics, History"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter tags separated by commas (e.g., exam prep, study guide, mathematics)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas. Maximum 10 tags, 30
                characters each.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating (0-5){" "}
                  {formErrors.rating && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.rating ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Enter rating (0-5)"
                />
                {formErrors.rating && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.rating}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating Count{" "}
                  {formErrors.ratingCount && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="ratingCount"
                  value={formData.ratingCount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.ratingCount
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  placeholder="Enter number of ratings"
                />
                {formErrors.ratingCount && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.ratingCount}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Summary{" "}
                <span className="text-gray-500">
                  ({formData.summary.length}/1000)
                </span>
                {formErrors.summary && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.summary ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
                maxLength={500}
                placeholder="Enter a brief summary of the book..."
              />
              {formErrors.summary && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.summary}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Total Conversations
              </label>
              <input
                type="text"
                name="conversations"
                value={formData.conversations.join(", ")}
                onChange={(e) => {
                  const conversationsArray = e.target.value
                    .split(",")
                    .map((conv) => conv.trim())
                    .filter((conv) => conv.length > 0);
                  setFormData((prev) => ({
                    ...prev,
                    conversations: conversationsArray,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter conversation IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter conversation IDs separated by commas
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Total Users
              </label>
              <input
                type="text"
                name="users"
                value={formData.users.join(", ")}
                onChange={(e) => {
                  const usersArray = e.target.value
                    .split(",")
                    .map((user) => user.trim())
                    .filter((user) => user.length > 0);
                  setFormData((prev) => ({ ...prev, users: usersArray }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter user IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter user IDs separated by commas
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isHighlighted"
                  checked={formData.isHighlighted}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 text-sm">
                  Make this book highlighted
                </span>
              </label>
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
                  "Create Book"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditBookModal = ({
  isOpen,
  onClose,
  onEdit,
  book,
  currentUser,
  categoryMappings,
}) => {
  const [formData, setFormData] = useState({
    title: book.title || "",
    description: book.description || "",
    author: book.author || "",
    publisher: book.publisher || "",
    language: book.language || "English",
    mainCategory: book.mainCategory || "Other",
    subCategory: book.subCategory || "Other",
    exam: book.exam || "",
    paper: book.paper || "",
    subject: book.subject || "",
    tags: book.tags ? book.tags.join(", ") : "",
    isHighlighted: book.isHighlighted || false,
    categoryOrder: book.categoryOrder || 0,
    rating: book.rating || 0,
    ratingCount: book.ratingCount || 0,
    conversations: book.conversations || [],
    users: book.users || [],
    summary: book.summary || "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    book.coverImageUrl || book.coverImage || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const languages = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Odia",
    "Malayalam",
    "Punjabi",
    "Assamese",
    "Other",
  ];

  const [formErrors, setFormErrors] = useState({
    rating: "",
    ratingCount: "",
    summary: "",
  });

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};

    if (
      formData.rating &&
      (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5)
    ) {
      errors.rating = "Rating must be between 0 and 5";
    }

    if (
      formData.ratingCount &&
      (isNaN(formData.ratingCount) || formData.ratingCount < 0)
    ) {
      errors.ratingCount = "Rating count must be a non-negative number";
    }

    if (formData.summary && formData.summary.length > 1000) {
      errors.summary = "Summary cannot exceed 1000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (
      name === "rating" ||
      name === "ratingCount" ||
      name === "categoryOrder"
    ) {
      const numValue = value === "" ? "" : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else if (name === "conversations" || name === "users") {
      const arrayValue = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setFormData((prev) => ({
        ...prev,
        [name]: arrayValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "mainCategory" && {
          subCategory: categoryMappings[value]?.[0] || "Other",
          customSubCategory: "",
        }),
      }));
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        onClose();
        return;
      }

      const requiredFields = ["title", "description", "author", "publisher"];
      for (const field of requiredFields) {
        if (!formData[field] || !formData[field].trim()) {
          toast.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
          );
          setIsSubmitting(false);
          return;
        }
      }

      let coverImageKey = null;

      if (coverImage) {
        try {
          const uploadUrlResponse = await fetch(
            "http://localhost:5000/api/books/cover-upload-url",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: coverImage.name,
                contentType: coverImage.type,
              }),
            }
          );

          const uploadUrlData = await uploadUrlResponse.json();

          if (!uploadUrlData.success) {
            throw new Error(
              uploadUrlData.message || "Failed to get upload URL"
            );
          }

          const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
            method: "PUT",
            body: coverImage,
            headers: {
              "Content-Type": coverImage.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image to S3");
          }

          coverImageKey = uploadUrlData.key;
        } catch (error) {
          console.error("Error uploading cover image:", error);
          toast.error("Failed to upload cover image");
          setIsSubmitting(false);
          return;
        }
      }

      const bookData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        language: formData.language,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        isHighlighted: formData.isHighlighted,
        categoryOrder: parseInt(formData.categoryOrder) || 0,
        rating: parseFloat(formData.rating) || 0,
        ratingCount: parseInt(formData.ratingCount) || 0,
        conversations: Array.isArray(formData.conversations)
          ? formData.conversations
          : [],
        users: Array.isArray(formData.users) ? formData.users : [],
        summary: formData.summary.trim(),
      };

      if (coverImageKey) {
        bookData.coverImageKey = coverImageKey;
      }

      if (formData.exam.trim()) bookData.exam = formData.exam.trim();
      if (formData.paper.trim()) bookData.paper = formData.paper.trim();
      if (formData.subject.trim()) bookData.subject = formData.subject.trim();

      if (currentUser) {
        const clientId = currentUser.userId || currentUser.id;
        bookData.clientId = clientId;
      }

      if (
        formData.subCategory === "Other" &&
        formData.customSubCategory.trim()
      ) {
        bookData.customSubCategory = formData.customSubCategory.trim();
      }

      if (formData.tags.trim()) {
        const tagsArray = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0 && tag.length <= 30)
          .slice(0, 10);
        if (tagsArray.length > 0) {
          bookData.tags = tagsArray;
        }
      }

      const response = await fetch(
        `http://localhost:5000/api/books/${book._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Book updated successfully!");
        onEdit(data.book);
        onClose();
      } else {
        if (Array.isArray(data.message)) {
          data.message.forEach((msg) => toast.error(msg));
        } else {
          toast.error(data.message || "Failed to update book");
        }
      }
    } catch (error) {
      console.error("Error updating book:", error);
      toast.error("An error occurred while updating the book");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidSubCategories = () => {
    return categoryMappings[formData.mainCategory] || ["Other"];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title *{" "}
                  <span className="text-gray-500">
                    ({formData.title.length}/100)
                  </span>
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
                  Author *{" "}
                  <span className="text-gray-500">
                    ({formData.author.length}/100)
                  </span>
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
                  Publisher *{" "}
                  <span className="text-gray-500">
                    ({formData.publisher.length}/100)
                  </span>
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
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Language *
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description *{" "}
                <span className="text-gray-500">
                  ({formData.description.length}/1000)
                </span>
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
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Main Category *
                </label>
                <select
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {Object.keys(categoryMappings).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Sub Category *
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {getValidSubCategories().map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Category Order
              </label>
              <input
                type="number"
                name="categoryOrder"
                value={formData.categoryOrder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                placeholder="Enter category order (0 for default)"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the category list</p>
            </div> */}

            {/* New fields: Exam, Paper, Subject */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Exam{" "}
                  <span className="text-gray-500">
                    ({formData.exam.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="exam"
                  value={formData.exam}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. UPSC, SSC"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Paper{" "}
                  <span className="text-gray-500">
                    ({formData.paper.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="paper"
                  value={formData.paper}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Prelims, Mains"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Subject{" "}
                  <span className="text-gray-500">
                    ({formData.subject.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={100}
                  placeholder="e.g. Mathematics, History"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter tags separated by commas (e.g., exam prep, study guide, mathematics)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas. Maximum 10 tags, 30
                characters each.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating (0-5){" "}
                  {formErrors.rating && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.rating ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Enter rating (0-5)"
                />
                {formErrors.rating && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.rating}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rating Count{" "}
                  {formErrors.ratingCount && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="ratingCount"
                  value={formData.ratingCount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.ratingCount
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  min="0"
                  placeholder="Enter number of ratings"
                />
                {formErrors.ratingCount && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.ratingCount}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Summary{" "}
                <span className="text-gray-500">
                  ({formData.summary.length}/1000)
                </span>
                {formErrors.summary && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.summary ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
                maxLength={500}
                placeholder="Enter a brief summary of the book..."
              />
              {formErrors.summary && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.summary}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Total Conversations
              </label>
              <input
                type="text"
                name="conversations"
                value={formData.conversations.join(", ")}
                onChange={(e) => {
                  const conversationsArray = e.target.value
                    .split(",")
                    .map((conv) => conv.trim())
                    .filter((conv) => conv.length > 0);
                  setFormData((prev) => ({
                    ...prev,
                    conversations: conversationsArray,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter conversation IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter conversation IDs separated by commas
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Total Users
              </label>
              <input
                type="text"
                name="users"
                value={formData.users.join(", ")}
                onChange={(e) => {
                  const usersArray = e.target.value
                    .split(",")
                    .map((user) => user.trim())
                    .filter((user) => user.length > 0);
                  setFormData((prev) => ({ ...prev, users: usersArray }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter user IDs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter user IDs separated by commas
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isHighlighted"
                  checked={formData.isHighlighted}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 text-sm">
                  Make this book highlighted
                </span>
              </label>
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
                  "Update Book"
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState({});
  const [selectedSubCategories, setSelectedSubCategories] = useState({});
  const [categoryOrders, setCategoryOrders] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    mainCategory: "",
    subCategory: "",
    language: "",
    author: "",
    tag: "",
    status: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 500,
    total: 0,
  });
  const [categoryOrder, setCategoryOrder] = useState("newest");

  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        setError("Authentication required");
        navigate("/login");
        return;
      }

      // Fetch categories from backend
      const categoriesResponse = await fetch(
        "http://localhost:5000/api/categories",
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

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      // Add category order parameter
      if (categoryOrder === "oldest") {
        queryParams.append("sort", "createdAt:1");
      } else {
        queryParams.append("sort", "createdAt:-1");
      }

      // Then fetch the books with pagination and filters
      const booksResponse = await fetch(
        `http://localhost:5000/api/books?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const booksData = await booksResponse.json();
      if (booksData.success) {
        setBooks(booksData.books || []);
        setCurrentUser(booksData.currentUser || null);
        setPagination((prev) => ({
          ...prev,
          total: booksData.total,
        }));

        // Set category orders from the API response
        if (booksData.categoryOrders) {
          setCategoryOrders(booksData.categoryOrders);
        } else {
          // If no category orders in response, calculate from books
          const orders = {};
          booksData.books.forEach((book) => {
            if (
              !orders[book.mainCategory] ||
              book.categoryOrder > orders[book.mainCategory]
            ) {
              orders[book.mainCategory] = book.categoryOrder || 0;
            }
          });
          setCategoryOrders(orders);
        }
      } else {
        setError(booksData.message || "Failed to fetch books");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };
  console.log("categoryMappings", categoryMappings);
  useEffect(() => {
    fetchBooks();
  }, [navigate, pagination.page, pagination.limit, categoryOrder, filters]);

  // Group books by category and subcategory
  const groupedBooks = books.reduce((acc, book) => {
    const mainCategory = book.mainCategory;
    const subCategory =
      book.subCategory === "Other" && book.customSubCategory
        ? book.customSubCategory
        : book.subCategory;

    if (!acc[mainCategory]) {
      acc[mainCategory] = {};
    }
    if (!acc[mainCategory][subCategory]) {
      acc[mainCategory][subCategory] = [];
    }
    acc[mainCategory][subCategory].push(book);
    return acc;
  }, {});

  // Get all subcategories for a main category
  const getSubCategories = (mainCategory) => {
    const standardCategories = categoryMappings[mainCategory] || [];
    const customCategories = books
      .filter(
        (book) =>
          book.mainCategory === mainCategory &&
          book.subCategory === "Other" &&
          book.customSubCategory
      )
      .map((book) => book.customSubCategory);

    return [...new Set([...standardCategories, ...customCategories])];
  };

  // Toggle subcategory selection
  const toggleSubCategory = (mainCategory, subCategory) => {
    setSelectedSubCategories((prev) => ({
      ...prev,
      [mainCategory]: prev[mainCategory] === subCategory ? null : subCategory,
    }));
  };

  // Get books to display for a main category
  const getBooksToDisplay = (mainCategory, subCategories) => {
    const selectedSubCategory = selectedSubCategories[mainCategory];
    if (!selectedSubCategory) {
      // If no subcategory is selected, show all books in the main category
      return Object.values(subCategories).flat();
    }
    return subCategories[selectedSubCategory] || [];
  };

  const handleAddBook = () => {
    setShowAddModal(true);
  };

  const handleBookAdded = (newBook) => {
    setBooks((prev) => [...prev, newBook]);
  };

  const handleBookClick = (bookId) => {
    navigate(`/ai-books/${bookId}`);
  };

  const handleToggleHighlight = async (bookId, isHighlighted) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const endpoint = `/api/books/${bookId}/highlight`;
      const method = isHighlighted ? "POST" : "DELETE";

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: isHighlighted
          ? JSON.stringify({ note: "", order: 0 })
          : undefined,
      });

      const data = await response.json();
      if (data.success) {
        setBooks((prev) =>
          prev.map((book) =>
            book._id === bookId
              ? {
                  ...book,
                  isHighlighted,
                  highlightedAt: isHighlighted
                    ? new Date().toISOString()
                    : null,
                }
              : book
          )
        );
      } else {
        toast.error(data.message || "Failed to update highlight status");
      }
    } catch (error) {
      console.error("Error updating highlight status:", error);
      toast.error("Failed to update highlight status");
    }
  };

  const handleToggleTrending = async (bookId, isTrending) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const endpoint = `/api/books/${bookId}/trending`;
      const method = isTrending ? "POST" : "DELETE";

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: isTrending ? JSON.stringify({ note: "", order: 0 }) : undefined,
      });

      const data = await response.json();
      if (data.success) {
        setBooks((prev) =>
          prev.map((book) =>
            book._id === bookId
              ? {
                  ...book,
                  isTrending,
                  trendingAt: isTrending ? new Date().toISOString() : null,
                }
              : book
          )
        );
      } else {
        toast.error(data.message || "Failed to update trending status");
      }
    } catch (error) {
      console.error("Error updating trending status:", error);
      toast.error("Failed to update trending status");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      mainCategory: "",
      subCategory: "",
      language: "",
      author: "",
      tag: "",
      status: "",
    });
  };

  // Get unique authors and publishers for filters
  const authors = [...new Set(books.map((book) => book.author))].sort();
  const publishers = [...new Set(books.map((book) => book.publisher))].sort();

  // Add pagination controls component
  const PaginationControls = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Items per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {totalPages}
          </span>

          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(totalPages, prev.page + 1),
              }))
            }
            disabled={pagination.page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={categoryOrder}
            onChange={(e) => setCategoryOrder(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div> */}
      </div>
    );
  };

  // Add new function to handle category order update
  const handleCategoryOrderUpdate = async (mainCategory, order) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const parsedOrder = parseInt(order) || 0;

      // Update category order for all books in the category
      const response = await fetch(
        `http://localhost:5000/api/books/categories/${mainCategory}/order`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: parsedOrder }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Failed to update category order");
        return;
      }

      // Update local state
      setCategoryOrders((prev) => ({
        ...prev,
        [mainCategory]: parsedOrder,
      }));

      // Refresh books to get updated order
      // await fetchBooks();
      toast.success(`Order updated for ${mainCategory}`);
      setEditingCategory(null); // Exit editing mode
    } catch (error) {
      console.error("Error updating category order:", error);
      toast.error("Failed to update category order");
    }
  };

  // Add function to handle order input blur
  const handleOrderBlur = (mainCategory) => {
    handleCategoryOrderUpdate(mainCategory, editingValue);
  };

  // Add function to handle order input key press
  const handleOrderKeyPress = (e, mainCategory) => {
    if (e.key === "Enter") {
      handleCategoryOrderUpdate(mainCategory, editingValue);
    }
  };

  // Add function to handle start editing
  const handleStartEditing = (mainCategory) => {
    setEditingCategory(mainCategory);
    setEditingValue(categoryOrders[mainCategory]?.toString() || "0");
  };

  const handleBookEdit = (updatedBook) => {
    setBooks((prev) =>
      prev.map((book) => (book._id === updatedBook._id ? updatedBook : book))
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Books</h1>
          <p className="text-gray-600">
            Manage your collection of AI-powered books
          </p>
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
      ) : books.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Book size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No books yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first AI book to get started
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
        <>
          <FiltersPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            authors={authors}
            publishers={publishers}
            allBooks={books}
            categoryMappings={categoryMappings}
          />

          <div className="space-y-12">
            {Object.entries(groupedBooks)
              .sort(([catA, _], [catB, __]) => {
                const orderA = categoryOrders[catA] || 0;
                const orderB = categoryOrders[catB] || 0;
                if (orderA === orderB) return catA.localeCompare(catB);
                return orderA - orderB;
              })
              .map(([mainCategory, subCategories]) => (
                <div key={mainCategory} className="space-y-6">
                  {/* Main Category Header with Order Input */}
                  <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {editingCategory === mainCategory ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingValue}
                          onChange={(e) =>
                            setEditingValue(
                              e.target.value.replace(/[^0-9]/g, "")
                            )
                          }
                          onBlur={() => handleOrderBlur(mainCategory)}
                          onKeyPress={(e) =>
                            handleOrderKeyPress(e, mainCategory)
                          }
                          className="w-10 px-2 py-1 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                          placeholder="Order"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEditing(mainCategory)}
                          className="w-10 px-2 py-1 border-2 border-gray-500 rounded-full cursor-pointer bg-gray-50 text-center"
                        >
                          {categoryOrders[mainCategory] || 0}
                        </div>
                      )}
                      <h2 className="text-2xl font-bold text-gray-800">
                        {mainCategory}
                      </h2>
                    </div>
                  </div>

                  {/* Subcategories List */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => toggleSubCategory(mainCategory, null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !selectedSubCategories[mainCategory]
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All {mainCategory}
                    </button>
                    {getSubCategories(mainCategory).map((subCategory) => (
                      <button
                        key={subCategory}
                        onClick={() =>
                          toggleSubCategory(mainCategory, subCategory)
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedSubCategories[mainCategory] === subCategory
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {subCategory}
                      </button>
                    ))}
                  </div>

                  {/* Books Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getBooksToDisplay(mainCategory, subCategories).map(
                      (book) => (
                        <BookItem
                          key={book._id}
                          book={book}
                          onClick={() => handleBookClick(book._id)}
                          onToggleHighlight={handleToggleHighlight}
                          onToggleTrending={handleToggleTrending}
                          currentUser={currentUser}
                          onEdit={handleBookEdit}
                          categoryMappings={categoryMappings}
                        />
                      )
                    )}
                  </div>
                </div>
              ))}
          </div>

          <PaginationControls />
        </>
      )}

      <AddBookModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleBookAdded}
        currentUser={currentUser}
        categoryMappings={categoryMappings}
        onCategoriesUpdated={setCategoryMappings}
      />
    </div>
  );
};

export default AIBooks;
