import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Play,
  ArrowLeft,
  Book,
} from "lucide-react";

const API_BASE_URL = "https://test.ailisher.com";

const emptyTopic = () => ({
  topicName: "",
  topicDescription: "",
  videoChoice: "url",
  VideoUrl: "",
  videoFile: null,
  videoKey: "",
  transcriptFile: null,
  transcriptKey: "",
});

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => Cookies.get("usertoken"), []);
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [selectedLectureIndex, setSelectedLectureIndex] = useState(0);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    isOpen: false,
    lectureIdx: -1,
    topicName: "",
    topicDescription: "",
    videoChoice: "url",
    VideoUrl: "",
    videoFile: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [form, setForm] = useState({
    lectureName: "",
    lectureDescription: "",
    topics: [emptyTopic()],
  });

  const fetchCourse = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/aicourses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setCourse(data.course);
    } catch (_) {}
  };

  const fetchLectures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/aicourses/${courseId}/lectures`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to fetch lectures");
      const fetchedLectures = data.lectures || [];
      setLectures(fetchedLectures);
      // Set default selection to first available topic
      if (fetchedLectures.length > 0) {
        const firstWithTopicsIdx = fetchedLectures.findIndex(
          (l) => (l.topics || []).length > 0
        );
        if (firstWithTopicsIdx !== -1) {
          setSelectedLectureIndex(firstWithTopicsIdx);
          setSelectedTopicIndex(0);
        } else {
          setSelectedLectureIndex(0);
          setSelectedTopicIndex(0);
        }
      } else {
        setSelectedLectureIndex(0);
        setSelectedTopicIndex(0);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }
    fetchCourse();
    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  const openCreate = () => {
    setEditingLecture(null);
    setForm({
      lectureName: "",
      lectureDescription: "",
      topics: [emptyTopic()],
    });
    setShowForm(true);
  };

  const openEdit = (lec) => {
    setEditingLecture(lec);
    setForm({
      lectureName: lec.lectureName || "",
      lectureDescription: lec.lectureDescription || "",
      topics: (lec.topics || []).map((t) => ({
        topicName: t.topicName || "",
        topicDescription: t.topicDescription || "",
        // Prefer VideoKey to decide if it was an upload
        videoChoice: t.VideoKey ? "upload" : "url",
        VideoUrl: t.VideoKey ? "" : t.VideoUrl || "",
        videoFile: null,
        videoKey: t.VideoKey || "",
        transcriptFile: null,
        transcriptKey: t.transcriptKey || "",
      })),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLecture(null);
  };

  const handleTopicChange = (idx, field, value) => {
    setForm((prev) => {
      const topics = [...prev.topics];
      topics[idx] = { ...topics[idx], [field]: value };
      return { ...prev, topics };
    });
  };

  const addTopic = () =>
    setForm((prev) => ({ ...prev, topics: [...prev.topics, emptyTopic()] }));
  const removeTopic = (idx) =>
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== idx),
    }));

  const getUploadUrl = async (file, type = "lecture") => {
    const resp = await fetch(`${API_BASE_URL}/api/aicourses/upload-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        type,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success)
      throw new Error(data.message || "Failed to get upload URL");
    return data; // { uploadUrl, key }
  };

  const uploadToR2 = async (file) => {
    const { uploadUrl, key } = await getUploadUrl(file, "lecture");
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Failed to upload file");
    return key;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Prepare topics: upload files and set either VideoUrl (URL) or videoKey
      const preparedTopics = [];
      for (const t of form.topics) {
        let videoKey = t.videoKey || "";
        let VideoUrl = t.VideoUrl || "";
        if (t.videoChoice === "upload") {
          if (t.videoFile && !videoKey)
            videoKey = await uploadToR2(t.videoFile);
        }
        let transcriptKey = t.transcriptKey || "";
        if (t.transcriptFile && !transcriptKey)
          transcriptKey = await uploadToR2(t.transcriptFile);
        preparedTopics.push({
          topicName: t.topicName,
          topicDescription: t.topicDescription,
          VideoUrl: t.videoChoice === "url" ? VideoUrl : undefined,
          videoKey: t.videoChoice === "upload" ? videoKey : undefined,
          transcriptKey,
        });
      }

      const payload = {
        lectureName: form.lectureName,
        lectureDescription: form.lectureDescription,
        topics: preparedTopics,
      };

      const method = editingLecture ? "PUT" : "POST";
      const url = editingLecture
        ? `${API_BASE_URL}/api/aicourses/${courseId}/lectures/${editingLecture._id}`
        : `${API_BASE_URL}/api/aicourses/${courseId}/lectures`;
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to save lecture");
      await fetchLectures();
      closeForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddTopic = (lecIdx) => {
    setNewTopic({
      isOpen: true,
      lectureIdx: lecIdx,
      topicName: "",
      topicDescription: "",
      videoChoice: "url",
      VideoUrl: "",
      videoFile: null,
    });
  };

  const closeAddTopic = () => {
    setNewTopic((p) => ({ ...p, isOpen: false, lectureIdx: -1 }));
  };

  const submitAddTopic = async () => {
    if (!newTopic.isOpen || newTopic.lectureIdx < 0) return;
    const lec = lectures[newTopic.lectureIdx];
    if (!lec) return;
    try {
      setAddingTopic(true);
      setError(null);
      let body = {
        topicName: newTopic.topicName,
        topicDescription: newTopic.topicDescription,
      };
      if (newTopic.videoChoice === "url") {
        if (newTopic.VideoUrl) body.VideoUrl = newTopic.VideoUrl;
      } else if (newTopic.videoChoice === "upload") {
        if (newTopic.videoFile) {
          const key = await uploadToR2(newTopic.videoFile);
          body.videoKey = key;
        }
      }
      const resp = await fetch(
        `${API_BASE_URL}/api/aicourses/lecture/${lec._id}/add-topic`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(body),
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data.message || "Failed to add topic");
      await fetchLectures();
      // focus on the lecture and last topic
      const newLectures = lectures;
      const topicsCount = (newLectures[newTopic.lectureIdx]?.topics || []).length;
      setSelectedLectureIndex(newTopic.lectureIdx);
      setSelectedTopicIndex(Math.max(0, topicsCount - 1));
      closeAddTopic();
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm("Delete this lecture?")) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/aicourses/${courseId}/lectures/${lectureId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to delete");
      await fetchLectures();
    } catch (e) {
      setError(e.message);
    }
  };

  const getYouTubeEmbed = (url) => {
    if (!url) return null;
    try {
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(ytRegex);
      if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
      return null;
    } catch (_) { return null; }
  };

  const handleSelect = (lecIdx, topicIdx) => {
    setSelectedLectureIndex(lecIdx);
    setSelectedTopicIndex(topicIdx);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-600 hover:text-orange-700 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to Courses</span>
          </button>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4 lg:w-1/5">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
              {course?.coverImageUrl ? (
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Book size={64} className="mx-auto text-indigo-400" />
                </div>
              )}
            </div>
          </div>
          <div className="md:w-3/4 lg:w-4/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">
                {course?.title}
              </h1>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={openEdit}
                  className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  <Edit size={16} className="mr-1" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteLecture}
                  className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} className="mr-1" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              {course?.details || "No description available"}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openCreate}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <Plus size={16} className="mr-2" /> Add Lecture
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 shadow-sm">
        {lectures.length === 0 ? (
          <div className="p-10 text-center text-gray-600">No lectures yet</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
            {/* Left: Player and details */}
            <div className="lg:col-span-8">
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                {(() => {
                  const lec = lectures[selectedLectureIndex] || {};
                  const topic = (lec.topics || [])[selectedTopicIndex] || {};
                  const yt = getYouTubeEmbed(topic.VideoUrl);
                  const playerKey = `${selectedLectureIndex}-${selectedTopicIndex}-${topic.VideoUrl || topic.VideoKey || ''}`;
                  if (topic.VideoUrl) {
                    return yt ? (
                      <iframe
                        key={playerKey}
                        title={`yt-player-${selectedLectureIndex}-${selectedTopicIndex}`}
                        src={yt}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video key={playerKey} controls className="w-full h-full">
                        <source src={topic.VideoUrl} />
                        Your browser does not support the video tag.
                      </video>
                    );
                  }
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-300 text-sm">
                      <Play size={18} className="mr-2" /> No video for selected topic
                    </div>
                  );
                })()}
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Lecture {(lectures[selectedLectureIndex] || {}).lectureNumber}</div>
                <h3 className="text-2xl font-semibold text-gray-900">{(lectures[selectedLectureIndex] || {}).lectureName}</h3>
                <p className="text-gray-600 mt-1">{(lectures[selectedLectureIndex] || {}).lectureDescription}</p>
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-800">{(((lectures[selectedLectureIndex] || {}).topics) || [])[selectedTopicIndex]?.topicName}</div>
                  <div className="text-sm text-gray-600">{(((lectures[selectedLectureIndex] || {}).topics) || [])[selectedTopicIndex]?.topicDescription}</div>
                  {(((lectures[selectedLectureIndex] || {}).topics) || [])[selectedTopicIndex]?.VideoUrl && (
                    <div className="mt-2">
                      <a
                        href={(((lectures[selectedLectureIndex] || {}).topics) || [])[selectedTopicIndex]?.VideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Open video in new tab
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => openEdit(lectures[selectedLectureIndex])} className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md flex items-center"><Edit size={14} className="mr-1" />Edit lecture</button>
                  <button onClick={() => handleDeleteLecture((lectures[selectedLectureIndex] || {})._id)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center"><Trash2 size={14} className="mr-1" />Delete lecture</button>
                </div>
              </div>
            </div>

            {/* Right: List of lectures and topics */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-gray-200 rounded-lg max-h-[75vh] overflow-y-auto">
                {lectures.map((lec, lecIdx) => (
                  <div key={lec._id} className="border-b border-gray-100">
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${lecIdx === selectedLectureIndex ? "bg-gray-50" : ""}`}
                      onClick={() => handleSelect(lecIdx, 0)}
                    >
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">Lecture {lec.lectureNumber}</div>
                      <div className="font-medium text-gray-900">{lec.lectureName}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{lec.lectureDescription}</div>
                    </button>
                    {(lec.topics || []).length === 0 ? (
                      <div className="px-4 pb-3 text-sm text-gray-400">No topics</div>
                    ) : (
                      <div className="px-2 pb-3 space-y-1">
                        {(lec.topics || []).map((t, tIdx) => {
                          console.log("t",t)
                          const isActive = lecIdx === selectedLectureIndex && tIdx === selectedTopicIndex;
                          const yt = getYouTubeEmbed(t.VideoUrl);
                          return (
                            <button
                              key={`${lec._id}-${tIdx}`}
                              onClick={(e) => { e.stopPropagation(); handleSelect(lecIdx, tIdx); }}
                              className={`w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50 ${isActive ? "bg-orange-50 ring-1 ring-orange-200" : ""}`}
                            >
                              <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                {t.VideoUrl ? (
                                  yt ? (
                                    <img alt="thumb" className="w-full h-full object-cover" src={`https://img.youtube.com/vi/${(t.VideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)||[])[1]}/mqdefault.jpg`} />
                                  ) : (
                                    <video
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                      // onMouseEnter={(e) => { try { e.currentTarget.play(); } catch (_) {} }}
                                      // onMouseLeave={(e) => { try { e.currentTarget.pause(); e.currentTarget.currentTime = 0; } catch (_) {} }}
                                    >
                                      <source src={t.VideoUrl} />
                                    </video>
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No video</div>
                                )}
                              </div>
                              <div className="min-w-0 text-left">
                                <div className={`text-sm ${isActive ? "text-orange-700" : "text-gray-800"} truncate`}>{t.topicName || `Topic ${tIdx + 1}`}</div>
                                <div className="text-xs text-gray-600 truncate">{t.topicDescription}</div>
                              </div>
                            </button>
                          );
                        })}
                        <div className="pt-2">
                          <button
                            onClick={() => openAddTopic(lecIdx)}
                            className="w-full text-left text-xs text-orange-600 hover:text-orange-700 px-2 py-1"
                          >
                            + Add topic
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingLecture ? "Edit Lecture" : "Add Lecture"}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Lecture Name
                  </label>
                  <input
                    value={form.lectureName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lectureName: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Lecture Description
                  </label>
                  <input
                    value={form.lectureDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lectureDescription: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Topics</h3>
                  <button
                    type="button"
                    onClick={addTopic}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    + Add Topic
                  </button>
                </div>
                {form.topics.map((t, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        placeholder="Topic name"
                        value={t.topicName}
                        onChange={(e) =>
                          handleTopicChange(idx, "topicName", e.target.value)
                        }
                        className="border rounded px-3 py-2"
                      />
                      <input
                        placeholder="Topic description"
                        value={t.topicDescription}
                        onChange={(e) =>
                          handleTopicChange(
                            idx,
                            "topicDescription",
                            e.target.value
                          )
                        }
                        className="border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={t.videoChoice === "url"}
                          onChange={() =>
                            handleTopicChange(idx, "videoChoice", "url")
                          }
                        />{" "}
                        YouTube/URL
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={t.videoChoice === "upload"}
                          onChange={() =>
                            handleTopicChange(idx, "videoChoice", "upload")
                          }
                        />{" "}
                        Upload video
                      </label>
                    </div>
                    {t.videoChoice === "url" ? (
                      <input
                        placeholder="https://..."
                        value={t.VideoUrl}
                        onChange={(e) =>
                          handleTopicChange(idx, "VideoUrl", e.target.value)
                        }
                        className="border rounded px-3 py-2 w-full"
                      />
                    ) : (
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          handleTopicChange(
                            idx,
                            "videoFile",
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    )}
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => removeTopic(idx)}
                        className="text-red-600 hover:text-red-700 flex items-center"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Remove topic
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 flex items-center"
                >
                  {saving && <Loader2 className="animate-spin mr-2" />}{" "}
                  {editingLecture ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {newTopic.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Topic</h2>
              <button onClick={closeAddTopic} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Topic name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newTopic.topicName}
                  onChange={(e) => setNewTopic((p) => ({ ...p, topicName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Topic description</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newTopic.topicDescription}
                  onChange={(e) => setNewTopic((p) => ({ ...p, topicDescription: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={newTopic.videoChoice === "url"}
                    onChange={() => setNewTopic((p) => ({ ...p, videoChoice: "url" }))}
                  />
                  YouTube/URL
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={newTopic.videoChoice === "upload"}
                    onChange={() => setNewTopic((p) => ({ ...p, videoChoice: "upload" }))}
                  />
                  Upload video
                </label>
              </div>
              {newTopic.videoChoice === "url" ? (
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://..."
                  value={newTopic.VideoUrl}
                  onChange={(e) => setNewTopic((p) => ({ ...p, VideoUrl: e.target.value }))}
                />
              ) : (
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setNewTopic((p) => ({ ...p, videoFile: e.target.files?.[0] || null }))}
                />
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={closeAddTopic} className="px-4 py-2 rounded border">Cancel</button>
                <button
                  onClick={submitAddTopic}
                  disabled={addingTopic || !newTopic.topicName || !newTopic.topicDescription}
                  className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {addingTopic ? 'Adding…' : 'Add topic'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
