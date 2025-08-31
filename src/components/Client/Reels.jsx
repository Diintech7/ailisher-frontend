import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Video,
  MessageCircle,
  Bot,
  MessageSquare,
  Send,
  Plus,
  Edit,
  Trash2,
  X,
  Play,
  Pause,
  GripVertical,
  MoreVertical,
  ToggleRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const Reels = React.memo(function Reels() {
  const [reels, setReels] = useState([]);
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingreel, setDeletingreel] = useState(null);
  const [newReel, setNewReel] = useState({
    title: "",
    description: "",
    youtubeLink: "",
    mode: "youtube", // 'youtube' | 'upload'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [playingReelId, setPlayingReelId] = useState(null);
  const [newYoutubeId, setNewYoutubeId] = useState("");
  const [editYoutubeId, setEditYoutubeId] = useState("");
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Group reels by date
  const groupReelsByDate = (reelsList) => {
    const grouped = {};

    reelsList.forEach((reel) => {
      const date = new Date(reel.createdAt || reel.updatedAt || Date.now());
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: formattedDate,
          reels: [],
        };
      }
      grouped[dateKey].reels.push(reel);
    });

    // Sort by date (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([key, value]) => ({
        dateKey: key,
        ...value,
      }));
  };

  const navigate = useNavigate();

  const token = Cookies.get("usertoken");
  const user = JSON.parse(Cookies.get("user") || "{}");

  const extractYoutubeId = (url) => {
    if (!url) return "";
    const watchMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?#\s]+)/
    );
    if (watchMatch && watchMatch[1]) return watchMatch[1];
    const fallbackMatch = url.match(/[?&]v=([^&?#\s]+)/);
    if (fallbackMatch && fallbackMatch[1]) return fallbackMatch[1];
    return "";
  };

  const getThumbnailFromYouTube = (id) => {
    return id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : "https://via.placeholder.com/300x200?text=No+Thumbnail";
  };

  const getEmbedUrl = (id) => {
    return id
      ? `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`
      : "";
  };

  const axiosConfig = {
    // baseURL: 'https://test.ailisher.com',
    baseURL: "https://test.ailisher.com",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Load reels from API
  useEffect(() => {
    handleGetReels();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest(".menu-container")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleGetReels = async () => {
    try {
      const res = await axios.get(`/api/reels`, axiosConfig);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setReels(list);
    } catch (e) {
      console.error("Failed to fetch reels", e);
    }
  };

  const handleCreateReel = async () => {
    if (!newReel.title) return;
    try {
      let body = {
        title: newReel.title,
        description: newReel.description,
      };

      if (newReel.mode === "youtube") {
        if (!newReel.youtubeLink) return;
        body.youtubeLink = newReel.youtubeLink;
      } else if (newReel.mode === "upload") {
        if (!selectedFile) return;
        // 1) Get presigned URL
        setUploading(true);
        setUploadProgress(0);
        const presignRes = await axios.post(
          `${axiosConfig.baseURL}/api/reels/upload-url`,
          {
            fileName: selectedFile.name,
            contentType: selectedFile.type || "video/mp4",
          },
          {
            headers: axiosConfig.headers,
          }
        );

        console.log(presignRes);
        console.log(axiosConfig);
        const { uploadUrl, key } = presignRes?.data || {};
        if (!uploadUrl || !key) throw new Error("Failed to get upload URL");

        // 2) Upload to R2/S3
        await axios.put(uploadUrl, selectedFile, {
          headers: { "Content-Type": selectedFile.type || "video/mp4" },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          },
        });

        // 3) Create reel with videoKey
        body.videoKey = key;
      }

      const res = await axios.post(`/api/reels`, body, axiosConfig);
      const created = res?.data?.data;
      console.log("Created reel:", created);
      if (res?.data?.success && created) {
        setNewReel({
          title: "",
          description: "",
          youtubeLink: "",
          mode: "youtube",
        });
        setSelectedFile(null);
        setUploading(false);
        setUploadProgress(0);
        setShowCreateReel(false);
        handleGetReels();
      }
    } catch (e) {
      console.error("Create reel failed", e);
      setUploading(false);
    }
  };

  const handleEditReel = async () => {
    if (!editingReel || !editingReel._id) return;
    try {
      const body = {
        title: editingReel.title,
        description: editingReel.description,
        youtubeLink: editingReel.youtubeLink,
      };
      const res = await axios.put(
        `/api/reels/${editingReel._id}`,
        body,
        axiosConfig
      );
      console.log(res);
      const updated = res?.data?.data;
      if (res?.data?.success && updated) {
        setReels(reels.map((r) => (r._id === editingReel._id ? updated : r)));
        setEditingReel(null);
      }
    } catch (e) {
      console.error("Update reel failed", e);
    }
  };

  const handleDeleteReel = async () => {
    try {
      if (!deletingreel) return;

      const res = await axios.delete(
        `/api/reels/${deletingreel._id}`,
        axiosConfig
      );
      if (res?.data?.success) {
        toast.success("Test deleted successfully");
        setShowDeleteModal(false);
        setDeletingreel(null);
        setReels(reels.filter((r) => r._id !== deletingreel._id));
      }
    } catch (e) {
      console.error("Delete reel failed", e);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dropIndex, dateKey) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const items = Array.from(reels);
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, reorderedItem);

    // Optimistic update
    setReels(items);
    setIsReordering(true);
    setDraggedIndex(null);

    try {
      // Send to backend
      const response = await axios.patch(
        "/api/reels/reorder",
        { reels: items },
        axiosConfig
      );
      if (response.data.success) {
        setReels(response.data.data);
        toast.success("Reordered successfully");
      }
    } catch (error) {
      console.error("Reorder error:", error);
      // Revert on error
      const originalResponse = await axios.get("/api/reels", axiosConfig);
      setReels(originalResponse.data.data);
      toast.error("Failed to reorder");
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openDeleteModal = (reel, e) => {
    e.stopPropagation();
    setDeletingreel(reel);
    setShowDeleteModal(true);
    setOpenMenuId(null); // Close menu when opening delete modal
  };

  const handleMenuToggle = (reelId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === reelId ? null : reelId);
  };

  const handleEditClick = (reel, e) => {
    e.stopPropagation();
    setEditingReel(reel);
    setEditYoutubeId(reel.youtubeId || extractYoutubeId(reel.youtubeLink));
    setOpenMenuId(null); // Close menu when opening edit modal
  };

  const toggleEnabled = async (reel) => {
    try {
      const response = await axios.patch(
        `/api/reels/${reel._id}`,
        { isEnabled: !reel.isEnabled },
        axiosConfig
      );

      // Backend returns { success: true, message: '...', reel: {...} }
      const updated = response.data?.reel || {
        ...reel,
        isEnabled: !reel.isEnabled,
      };

      // Update the specific reel in the array
      setReels((prev) => prev.map((r) => (r._id === reel._id ? updated : r)));

      toast.success(`Reel ${updated.isEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling enabled:", error);
      toast.error(error.response?.data?.message || "Failed to update reel");
    } finally {
      setOpenMenuId(null);
    }
  };

  const renderCreateReelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create New Reel</h3>
          <button
            onClick={() => setShowCreateReel(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Reel Title"
            value={newReel.title}
            onChange={(e) => setNewReel({ ...newReel, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newReel.description}
            onChange={(e) =>
              setNewReel({ ...newReel, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
          />
          {/* Mode Selector */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setNewReel({ ...newReel, mode: "youtube" })}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                newReel.mode === "youtube"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              YouTube Link
            </button>
            <button
              type="button"
              onClick={() => setNewReel({ ...newReel, mode: "upload" })}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                newReel.mode === "upload"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Upload Video
            </button>
          </div>

          {newReel.mode === "youtube" ? (
            <>
              <input
                type="url"
                placeholder="YouTube URL (watch, youtu.be, shorts, reels)"
                value={newReel.youtubeLink}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewReel({ ...newReel, youtubeLink: val });
                  setNewYoutubeId(extractYoutubeId(val));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {newReel.youtubeLink && (
                <div className="pt-2 space-y-2">
                  <img
                    src={getThumbnailFromYouTube(newYoutubeId)}
                    alt="Preview thumbnail"
                    className="w-full h-40 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/300x200?text=No+Thumbnail";
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center m-auto space-y-3 w-full">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full max-w-md justify-center items-center"
                />

                {selectedFile && (
                  <div className="text-sm text-gray-600 text-center">
                    {selectedFile.name} (
                    {Math.round(selectedFile.size / 1024 / 1024)} MB)
                  </div>
                )}

                {uploading && (
                  <div className="w-full max-w-md bg-gray-200 rounded h-2">
                    <div
                      className="bg-purple-600 h-2 rounded"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCreateReel(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReel}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-60"
            disabled={uploading}
          >
            Save Reel
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditReelModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Reel</h3>
          <button
            onClick={() => setEditingReel(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Reel Title"
            value={editingReel?.title || ""}
            onChange={(e) =>
              setEditingReel({ ...editingReel, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Description"
            value={editingReel?.description || ""}
            onChange={(e) =>
              setEditingReel({ ...editingReel, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
          />
          <input
            type="url"
            placeholder="YouTube URL (watch, youtu.be, shorts, reels)"
            value={editingReel?.youtubeLink || ""}
            onChange={(e) => {
              const val = e.target.value;
              setEditingReel({ ...editingReel, youtubeLink: val });
              setEditYoutubeId(extractYoutubeId(val));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {editingReel?.youtubeLink && (
            <div className="pt-2 space-y-2">
              <img
                src={getThumbnailFromYouTube(
                  editYoutubeId || editingReel.youtubeId
                )}
                alt="Preview thumbnail"
                className="w-full h-40 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300x200?text=No+Thumbnail";
                }}
              />
            </div>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setEditingReel(null)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditReel}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Reel
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Confirmation Modal
  const DeleteModal = ({ isOpen, onClose, onConfirm, reel }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Reel
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{reel?.title}"? This action
                cannot be undone.
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

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center space-x-4 p-4">
            <button
              onClick={() => navigate("/tools")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Tools
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Reels Management
            </h2>
            <button
              onClick={() => setShowCreateReel(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Reel</span>
            </button>
          </div>

          {/* Reels Grouped by Date */}
          {reels && reels.length > 0 && reels.every((reel) => reel._id) ? (
            <div className="space-y-8">
              {groupReelsByDate(reels).map((dateGroup) => (
                <div key={dateGroup.dateKey} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 border-b-2 border-purple-500 pb-2">
                        {dateGroup.date}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      {dateGroup.reels.length} reel
                      {dateGroup.reels.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Reels Grid for this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dateGroup.reels.map((reel, index) => {
                      const globalIndex = reels.findIndex(
                        (r) => r._id === reel._id
                      );
                      return (
                        <div
                          key={`draggable-${reel._id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, globalIndex)}
                          onDragOver={handleDragOver}
                          onDrop={(e) =>
                            handleDrop(e, globalIndex, dateGroup.dateKey)
                          }
                          onDragEnd={handleDragEnd}
                          className={`${
                            reel.isEnabled === true ? "bg-white" : "bg-gray-300"
                          } rounded-lg shadow-md overflow-hidden cursor-grab hover:shadow-lg transition-all duration-200 ${
                            draggedIndex === globalIndex
                              ? "shadow-xl scale-105 rotate-2"
                              : ""
                          } ${isReordering ? "opacity-75" : ""}`}
                        >
                          {/* --- Your Reel Card --- */}
                          <div clasName = "flex">
                          <div className="relative">
                            {/* Drag Indicator */}
                            <div className="absolute top-2 left-2 z-10 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                              ⋮⋮ Drag
                            </div>
                            <div className="absolute top-2 right-2 z-10 menu-container text-xs">
                              <button
                                onClick={(e) => handleMenuToggle(reel._id, e)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                              </button>

                              {/* Dropdown Menu */}
                              {openMenuId === reel._id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <button
                                    onClick={(e) => handleEditClick(reel, e)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={(e) => openDeleteModal(reel, e)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                  {/* Only show enable/disable option if user created this reel */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEnabled(reel);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                                      reel.isEnabled === true
                                        ? "text-red-800 hover:bg-red-50"
                                        : "text-green-800 hover:bg-green-50"
                                    }`}
                                  >
                                    <ToggleRight className="w-4 h-4" />
                                    <span>
                                      {reel.isEnabled === true
                                        ? "Disable"
                                        : "Enable"}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Determine content type (YouTube or uploaded video) */}
                            {(() => {
                              const youtubeId = extractYoutubeId(
                                reel.youtubeLink
                              );
                              if (youtubeId) {
                                return playingReelId === reel._id ? (
                                  <div className="aspect-video w-full">
                                    <iframe
                                      className="w-full h-full"
                                      src={getEmbedUrl(youtubeId)}
                                      title={reel.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    />
                                    <button
                                      className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded"
                                      onClick={() => setPlayingReelId(null)}
                                    >
                                      Close
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <img
                                      src={getThumbnailFromYouTube(youtubeId)}
                                      alt={reel.title}
                                      className="w-full h-48 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "https://via.placeholder.com/300x200?text=No+Thumbnail";
                                      }}
                                    />
                                    <button
                                      className="absolute inset-0 flex items-center justify-center"
                                      onClick={() => setPlayingReelId(reel._id)}
                                      aria-label="Play video"
                                    >
                                      <div className="bg-black/50 rounded-full p-3">
                                        <Play className="w-6 h-6 text-white" />
                                      </div>
                                    </button>
                                  </>
                                );
                              }

                              if (reel.videoUrl) {
                                return (
                                  <video
                                    className="w-full h-48 object-cover"
                                    src={reel.videoUrl}
                                    controls
                                  />
                                );
                              }

                              return (
                                <img
                                  src="https://via.placeholder.com/300x200?text=No+Preview"
                                  alt={reel.title}
                                  className="w-full h-48 object-cover"
                                />
                              );
                            })()}
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">
                              {reel.title}
                            </h3>
                            {reel.description && (
                              <p className="text-gray-600 text-sm mb-3">
                                {reel.description}
                              </p>
                            )}
                            <div className="flex justify-between text-sm text-gray-500 mb-4">
                              <span>👁️ {reel.metrics?.views ?? 0} views</span>
                              <span>❤️ {reel.metrics?.likes ?? 0} likes</span>
                            </div>
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reels found. Create your first reel!
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      {showCreateReel && renderCreateReelModal()}
      {editingReel && renderEditReelModal()}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingreel(null);
          }}
          onConfirm={handleDeleteReel}
          reel={deletingreel}
        />
      )}
    </>
  );
});

export default Reels;
