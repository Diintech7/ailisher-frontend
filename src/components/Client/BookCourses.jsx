import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Book, ArrowLeft, Plus, LayoutGrid, List, MoreVertical, Trash2, Edit, Eye, MessageCircle, Mail, Play, Settings } from 'lucide-react';
import AddBookCourse from './AddBookCourse';
import AddVideosModal from './AddVideosModal';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture
} from '../utils/api';

const BookCourses = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]); // For selected course
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [editingCourse, setEditingCourse] = useState(null); // course object or null
  const [viewingCourse, setViewingCourse] = useState(null); // course object or null
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [videoViewMode, setVideoViewMode] = useState('grid'); // 'grid' or 'list' for videos
  const [showAddVideosModal, setShowAddVideosModal] = useState(false);
  const [editingVideos, setEditingVideos] = useState(null); // video object or null
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false);
  const [deleteVideoIdx, setDeleteVideoIdx] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null); // { videoIdx, topicIdx } or null
  const [deleteTopic, setDeleteTopic] = useState(null); // { videoIdx, topicIdx } or null
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(null);
  const [editingChapterIdx, setEditingChapterIdx] = useState(null); // index of chapter (video) being edited
  const [deleteChapterIdx, setDeleteChapterIdx] = useState(null); // index of chapter (video) being deleted
  const [showDeleteChapterModal, setShowDeleteChapterModal] = useState(false);
  const [chapterMenuOpenIdx, setChapterMenuOpenIdx] = useState(null);
  const [chapterActionType, setChapterActionType] = useState(null); // 'add' or 'edit'
  const [nextLectureNumber, setNextLectureNumber] = useState(1);
  const [pendingAddVideosModal, setPendingAddVideosModal] = useState(null);
  const [expandedLectureIdx, setExpandedLectureIdx] = useState(null);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [editingLectureData, setEditingLectureData] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('usertoken');
        if (!token) {
          setError('Authentication required');
          navigate('/login');
          return;
        }
        const response = await fetch(`http://localhost:5000/api/books/${bookId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setBook(data.book);
        } else {
          setError(data.message || 'Failed to fetch book details');
        }
      } catch (err) {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, navigate]);

  // Fetch courses from API
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourses(bookId);
      setCourses(res.course || []);
      console.log('Fetched courses:', res.course);
    } catch (err) {
      setError('Failed to fetch courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lectures for a course
  const fetchLectures = async (courseId) => {
    setLoading(true);
    try {
      const res = await getLectures(bookId, courseId);
      const lectures = res.lectures || [];
      setLectures(lectures);
      setCourses(prevCourses => {
        const newCourses = [...prevCourses];
        const idx = newCourses.findIndex(c => c._id === courseId);
        if (idx !== -1) {
          newCourses[idx] = { ...newCourses[idx], videos: lectures };
        }
        return newCourses;
      });
      console.log('Fetched lectures:', lectures);
    } catch (err) {
      setError('Failed to fetch lectures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [bookId]);

  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:5000/${imageUrl}`;
  };

  const getVideoThumbnail = (videoUrl) => {
    if (!videoUrl) return null;
    
    // YouTube thumbnail extraction
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    
    // Vimeo thumbnail extraction (basic)
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }
    
    // Default thumbnail for other platforms
    return null;
  };

  const handleAddCourse = async (courseData) => {
    await fetchCourses();
    setShowAddModal(false);
  };

  const handleEditCourse = (idx) => {
    const course = courses[idx];
    console.log('Opening edit form for course:', course);
    if (course.faculty) {
      course.faculty.forEach((f, i) => {
        console.log(`Faculty[${i}] image params:`, {
          faculty_imageUrl: f.faculty_imageUrl,
          faculty_imageKey: f.faculty_imageKey
        });
      });
    }
    console.log('Cover image params:', {
      cover_imageUrl: course.cover_imageUrl,
      cover_imageKey: course.cover_imageKey
    });
    setEditingCourse(idx);
    setShowAddModal(true);
    setMenuOpenIdx(null);
  };

  const handleDeleteCourse = async (idx) => {
    const courseId = courses[idx]._id;
    await deleteCourse(bookId, courseId);
    await fetchCourses();
    setShowDeleteModal(false);
    setDeleteIdx(null);
  };

  const confirmDeleteCourse = () => {
    setCourses(courses.filter((_, idx) => idx !== deleteIdx));
    setShowDeleteModal(false);
    setDeleteIdx(null);
    if (viewingCourse && courses[deleteIdx] === viewingCourse) setViewingCourse(null);
  };

  const handleViewCourse = (idx) => {
    setViewingCourse({ ...courses[idx], __viewDetails: true });
    setMenuOpenIdx(null);
    setSelectedCourseIdx(idx);
    fetchLectures(courses[idx]._id); // Always fetch lectures from API
  };

  const handleCardClick = (idx) => {
    setViewingCourse({ ...courses[idx], __viewDetails: false });
    setSelectedCourseIdx(idx);
    setMenuOpenIdx(null);
    fetchLectures(courses[idx]._id); // Always fetch lectures from API
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingCourse(null);
  };

  const handleAddVideos = (videoData) => {
    if (editingVideos !== null) {
      // Edit mode: update video
      setCourses(courses.map((c, idx) => idx === editingVideos ? { ...c, videos: c.videos.map((v, i) => i === editingVideos ? videoData : v) } : c));
      setEditingVideos(null);
    } else {
      // Add mode: add new video
      setCourses(courses.map((c, idx) => idx === editingCourse ? { ...c, videos: [...c.videos, { ...videoData, id: Date.now() }] } : c));
    }
  };

  const handleEditVideos = (idx) => {
    setEditingVideos(idx);
    setShowAddVideosModal(true);
  };

  const handleDeleteVideos = (idx) => {
    setDeleteVideoIdx(idx);
    setShowDeleteVideoModal(true);
    setMenuOpenIdx(null);
  };

  const confirmDeleteVideo = () => {
    setCourses(prevCourses => {
      const newCourses = [...prevCourses];
      newCourses[selectedCourseIdx].videos = newCourses[selectedCourseIdx].videos.filter((_, i) => i !== deleteVideoIdx);
      return newCourses;
    });
    setShowDeleteVideoModal(false);
    setDeleteVideoIdx(null);
  };

  const handleCloseAddVideosModal = () => {
    setShowAddVideosModal(false);
    setEditingVideos(null);
  };

  // Edit topic handler
  const handleEditTopic = (videoIdx, topicIdx) => {
    setEditingTopic({ videoIdx, topicIdx });
    setShowAddVideosModal(true);
  };

  // Delete topic handler
  const handleDeleteTopic = (videoIdx, topicIdx) => {
    setDeleteTopic({ videoIdx, topicIdx });
    setShowDeleteVideoModal(true);
    setMenuOpenIdx(null);
  };

  // Confirm delete topic
  const confirmDeleteTopic = () => {
    if (deleteTopic) {
      setCourses(prevCourses => {
        const newCourses = [...prevCourses];
        const { videoIdx, topicIdx } = deleteTopic;
        const topics = newCourses[selectedCourseIdx].videos[videoIdx].topics.filter((_, i) => i !== topicIdx);
        if (topics.length === 0) {
          // Remove the whole video if no topics left
          newCourses[selectedCourseIdx].videos.splice(videoIdx, 1);
        } else {
          newCourses[selectedCourseIdx].videos[videoIdx] = { ...newCourses[selectedCourseIdx].videos[videoIdx], topics };
        }
        return newCourses;
      });
    }
    setShowDeleteVideoModal(false);
    setDeleteTopic(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpenIdx(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Reset AddBookCourse form each time modal opens
  const addBookCourseKey = editingCourse !== null ? `edit-${editingCourse}` : `add-${courses.length}`;
  const addBookCourseInitial = editingCourse !== null ? courses[editingCourse] : null;

  // Reset AddVideosModal form each time modal opens
  const addVideosModalKey = editingVideos !== null ? `edit-videos-${editingVideos}` : `add-videos-${courses.length}`;
  const addVideosModalInitial = editingVideos !== null ? courses[editingVideos].videos[editingVideos] : null;

  // When going back to courses
  const handleBackToCourses = () => {
    setViewingCourse(null);
    setSelectedCourseIdx(null);
  };

  const videosToShow = selectedCourseIdx !== null ? courses[selectedCourseIdx]?.videos || [] : [];

  // Add a click outside handler to close the chapter menu
  useEffect(() => {
    const handleClickOutside = () => setChapterMenuOpenIdx(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // When a course is selected, fetch its lectures
  useEffect(() => {
    if (selectedCourseIdx !== null && courses[selectedCourseIdx]) {
      fetchLectures(courses[selectedCourseIdx]._id);
    }
    // eslint-disable-next-line
  }, [selectedCourseIdx]);

  // Example for add lecture:
  const handleAddLecture = async () => {
    const courseId = courses[selectedCourseIdx]._id;
    await fetchLectures(courseId); // Just refresh lectures
    setShowAddVideosModal(false);
  };

  // Example for edit lecture:
  const handleEditLecture = async (lectureId, lectureData) => {
    const courseId = courses[selectedCourseIdx]._id;
    await updateLecture(bookId, courseId, lectureId, lectureData);
    await fetchLectures(courseId);
    setShowAddVideosModal(false);
  };

  // Example for delete lecture:
  const handleDeleteLecture = async (lectureId) => {
    const courseId = courses[selectedCourseIdx]._id;
    const bookId = courses[selectedCourseIdx].bookId;
    console.log('Deleting lecture with _id:', lectureId, 'from courseId:', courseId, 'and bookId:', bookId);
    await deleteLecture(bookId, courseId, lectureId);
    await fetchLectures(courseId);
    setShowDeleteChapterModal(false);
    setDeleteChapterIdx(null);
  };

  // Helper to open AddVideosModal after fetching latest lectures from backend
  const openAddVideosModalWithFreshLectures = (idx, chapterActionType = null, editingTopic = null) => {
    if (idx === null || idx === undefined) return;
    const course = courses[idx];
    const lectures = course?.videos || [];
    // Find the next available lecture number
    const usedNumbers = new Set(lectures.map(l => l.lectureNumber || 0));
    let next = 1;
    while (usedNumbers.has(next)) next++;
    setNextLectureNumber(next);
    setSelectedCourseIdx(idx);
    setChapterActionType(chapterActionType);
    setEditingTopic(editingTopic);
    setPendingAddVideosModal({ idx, chapterActionType, editingTopic });
    setShowAddVideosModal(true);
  };

  // Add a function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoUrl) => {
    if (!videoUrl) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
  };

  const handleEditLectureModal = (lectureId) => {
    console.log('Edit clicked for lectureId:', lectureId);
    // Find the latest lecture object by _id from the lectures array
    const latestLecture = lectures.find(l => l._id === lectureId);
    console.log('Fetched lecture for editing:', latestLecture);
    setEditingLectureId(lectureId);
    setEditingLectureData(latestLecture);
    setShowAddVideosModal(true);
    setChapterMenuOpenIdx(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <span className="text-red-500 mr-3 flex-shrink-0 mt-0.5">!</span>
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="mt-3 text-red-600 hover:text-red-800 flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        {viewingCourse ? (
          <button
            onClick={() => setViewingCourse(null)}
            className="flex items-center text-orange-600 hover:text-orange-800 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Courses</span>
          </button>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-orange-600 hover:text-orange-800 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back</span>
          </button>
        )}
      </div>
      {/* Book details only if not viewing a course */}
      {!viewingCourse && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 relative">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/4 lg:w-1/5">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                {book?.cover_imageUrl && !imageError ? (
                  <img 
                    src={getCompleteImageUrl(book.cover_imageUrl)} 
                    alt={book.title} 
                    className="h-full w-full object-cover rounded-lg"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-center">
                    <Book size={64} className="mx-auto text-orange-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="md:w-3/4 lg:w-4/5 relative">
              <button
                className="absolute top-0 right-0 flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 shadow transition-colors"
                onClick={() => { setShowAddModal(true); setEditingCourse(null); }}
              >
                <Plus size={16} className="mr-2" />
                <span>Add Course</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{book?.title}</h1>
              <p className="text-gray-700 mb-6">{book?.description || 'No description available'}</p>
            </div>
          </div>
        </div>
      )}
      {/* Courses Section or Course Detail */}
      {viewingCourse ? (
        viewingCourse.__viewDetails ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/4 lg:w-1/5">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                  {viewingCourse.cover_imageUrl ? (
                    <img src={viewingCourse.cover_imageUrl} alt={viewingCourse.name} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <Book size={64} className="mx-auto text-orange-400" />
                  )}
                </div>
              </div>
              <div className="md:w-3/4 lg:w-4/5 flex flex-col gap-4">
                {/* Course Name */}
                <div className="p-4 rounded bg-orange-50 text-orange-800 font-bold shadow-sm text-2xl">
                  {viewingCourse.name}
                </div>
                {/* Overview */}
                {viewingCourse.overview && (
                  <div className="p-4 rounded bg-blue-50 text-blue-800 font-medium shadow-sm">
                    <span className="block font-semibold mb-1">Overview</span>
                    <span>{viewingCourse.overview}</span>
                  </div>
                )}
                {/* Details */}
                {viewingCourse.details && (
                  <div className="p-4 rounded bg-green-50 text-green-800 font-medium shadow-sm">
                    <span className="block font-semibold mb-1">Details</span>
                    <span>{viewingCourse.details}</span>
                  </div>
                )}
                {/* Faculty */}
                <div className="p-4 rounded bg-purple-50 text-purple-800 font-medium shadow-sm">
                  <span className="block font-semibold mb-1">Faculty</span>
                  {viewingCourse.faculty && Array.isArray(viewingCourse.faculty) && viewingCourse.faculty.length > 0 ? (
                    viewingCourse.faculty.map((facultyMember, idx) => (
                      <div key={idx} className="flex items-center gap-4 mb-3">
                        {facultyMember.faculty_imageUrl || facultyMember.faculty_imageKey ? (
                          <img
                            src={facultyMember.faculty_imageUrl ? facultyMember.faculty_imageUrl : getCompleteImageUrl(facultyMember.faculty_imageKey)}
                            alt="Faculty"
                            className="w-16 h-16 object-cover rounded-full border border-purple-200"
                          />
                        ) : null}
                        <div>
                          <span className="block font-semibold">Name: {facultyMember.name}</span>
                          <span className="block">About: {facultyMember.about}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span>No faculty information available</span>
                  )}
                </div>
                <button className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 w-max" onClick={() => setViewingCourse(null)}>Back to Courses</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Only course details, no book details */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 flex md:flex-row flex-col items-start gap-8 relative">
              <button
                className="absolute top-5 right-5 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow transition-colors"
                onClick={() => openAddVideosModalWithFreshLectures(selectedCourseIdx)}
              >
                <Plus size={16} className="mr-2" />
                <span>Add Lectures</span>
              </button>
              <div className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                  {viewingCourse.cover_imageUrl ? (
                    <img src={viewingCourse.cover_imageUrl} alt={viewingCourse.name} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <Book size={64} className="mx-auto text-orange-400" />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start justify-start flex-1">
                <h2 className="text-2xl font-bold text-gray-800 ">{viewingCourse.name}</h2>
              </div>
            </div>
            {/* Videos Section - Accordion List */}
            <div className="rounded-xl shadow-md border border-gray-100 p-0 mb-8">
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-t-xl px-6 py-4 flex items-center">
                <Book size={28} className="mr-3" />
                <h2 className="text-2xl font-bold tracking-wide">Lectures</h2>
              </div>
              <div className="p-0">
                {videosToShow.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-8 text-center">
                    <Play size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No lectures yet</h3>
                    <p className="text-gray-600 mb-6">Add your first lecture to start building your course content</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-orange-100">
                    {videosToShow.map((lecture, videoIdx) => {
                      const isExpanded = expandedLectureIdx === videoIdx;
                      return (
                        <div key={videoIdx} className={`transition-all ${isExpanded ? 'bg-orange-50' : 'bg-orange-100'} rounded-xl mb-2 shadow-sm`}> 
                          <div
                            className={`flex items-center justify-between px-6 py-4 cursor-pointer rounded-xl ${isExpanded ? 'bg-orange-200' : 'hover:bg-orange-200'} transition-colors`}
                            onClick={() => setExpandedLectureIdx(isExpanded ? null : videoIdx)}
                          >
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800">{lecture.lectureName}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lecture.lectureDescription}</p>
                            </div>
                            <div className="relative ml-2">
                              <button
                                className="p-2 rounded-full hover:bg-gray-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  setChapterMenuOpenIdx(chapterMenuOpenIdx === videoIdx ? null : videoIdx);
                                }}
                              >
                                <Settings size={20} />
                              </button>
                              {chapterMenuOpenIdx === videoIdx && (
                                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-30">
                                  <button
                                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleEditLectureModal(lecture._id);
                                    }}
                                  >
                                    <Edit size={16} className="mr-2" /> Edit
                                  </button>
                                  <button
                                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                                    onClick={e => {
                                      e.stopPropagation();
                                      console.log('Preparing to delete lecture:', lectures[videoIdx]?._id);
                                      setDeleteChapterIdx(videoIdx);
                                      setShowDeleteChapterModal(true);
                                      setChapterMenuOpenIdx(null);
                                    }}
                                  >
                                    <Trash2 size={16} className="mr-2" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Topics - only show if expanded */}
                          {isExpanded && (
                            <div className="pl-8 pb-4 pt-2">
                              {(lecture.topics || []).length === 0 ? (
                                <div className="text-gray-500 italic bg-white rounded-lg px-4 py-3">No topics available</div>
                              ) : (
                                <ul className="space-y-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                                  {lecture.topics.map((topic, topicIdx) => {
                                    const thumb = getYouTubeThumbnail(topic.VideoUrl);
                                    return (
                                      <li key={topicIdx} className="flex items-center gap-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 shadow-sm">
                                        <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200 flex items-center justify-center">
                                          {thumb ? (
                                            <img src={thumb} alt="Video thumbnail" className="object-cover w-full h-full" />
                                          ) : (
                                            <Play size={28} className="text-yellow-400" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="text-md font-semibold text-gray-800 mb-1">{topic.topicName}</h4>
                                          <p className="text-gray-600 text-sm mb-1 line-clamp-2">{topic.topicDescription}</p>
                                          <a
                                            href={topic.VideoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 text-xs hover:text-indigo-800"
                                          >
                                            Watch Video →
                                          </a>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 relative">
            <h2 className="text-2xl font-semibold text-gray-800">Courses</h2>
            <div className="flex space-x-2">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}><List size={20} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutGrid size={20} /></button>
            </div>
          </div>
          {courses.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Book size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Add your first course to start building your curriculum</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}>
              {courses.map((course, idx) => (
                <div
                  key={idx}
                  className={`relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} transition-all cursor-pointer group`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className={viewMode === 'grid' ? 'w-full h-40 mb-4 flex items-center justify-center bg-orange-50 rounded-lg overflow-hidden' : 'w-24 h-24 mr-4 flex-shrink-0 flex items-center justify-center bg-orange-50 rounded-lg overflow-hidden'}>
                    {course.cover_imageUrl ? (
                      <img src={course.cover_imageUrl} alt={course.name} className="object-cover w-full h-full" />
                    ) : (
                      <Book size={40} className="text-orange-300" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-start justify-between relative">
                      <h3 className="text-xl font-bold text-gray-800 mb-1 flex-1">{course.name}</h3>
                      {viewMode === 'grid' && (
                        <div className="relative">
                          <button onClick={e => { e.stopPropagation(); setMenuOpenIdx(idx === menuOpenIdx ? null : idx); }} className="p-1 rounded-full hover:bg-gray-100 ml-2 flex-shrink-0">
                            <MoreVertical size={20} />
                          </button>
                          {/* Three-dot menu dropdown for grid view */}
                          {menuOpenIdx === idx && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-20">
                              <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100" onClick={e => { e.stopPropagation(); handleViewCourse(idx); }}><Eye size={16} className="mr-2" />View</button>
                              <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100" onClick={e => { e.stopPropagation(); handleEditCourse(idx); }}><Edit size={16} className="mr-2" />Edit</button>
                              <button className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDeleteIdx(idx); setShowDeleteModal(true); }}><Trash2 size={16} className="mr-2" />Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.overview}</p>
                  </div>
                  {/* Three-dot menu for list view */}
                  {viewMode === 'list' && (
                    <div className="absolute top-2 right-2 z-10">
                      <button onClick={e => { e.stopPropagation(); setMenuOpenIdx(idx === menuOpenIdx ? null : idx); }} className="p-1 rounded-full hover:bg-gray-100">
                        <MoreVertical size={20} />
                      </button>
                      {menuOpenIdx === idx && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-20">
                          <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100" onClick={e => { e.stopPropagation(); handleViewCourse(idx); }}><Eye size={16} className="mr-2" />View</button>
                          <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100" onClick={e => { e.stopPropagation(); handleEditCourse(idx); }}><Edit size={16} className="mr-2" />Edit</button>
                          <button className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDeleteIdx(idx); setShowDeleteModal(true); }}><Trash2 size={16} className="mr-2" />Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {showAddModal && (
        <AddBookCourse
          key={addBookCourseKey}
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          onAdd={handleAddCourse}
          initialData={editingCourse !== null ? courses[editingCourse] : null}
        />
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Delete Course</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deleteIdx)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Video Delete Confirmation Modal */}
      {showDeleteVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Delete Video</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this video topic? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteVideoModal(false); setDeleteTopic(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTopic}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddVideosModal && (
        <AddVideosModal
          key={editingLectureId || 'add'}
          isOpen={showAddVideosModal}
          onClose={() => {
            setShowAddVideosModal(false);
            setEditingTopic(null);
            setEditingChapterIdx(null);
            setChapterActionType(null);
            setPendingAddVideosModal(null);
            setEditingLectureId(null);
            setEditingLectureData(null);
          }}
          onAdd={handleAddLecture}
          initialData={editingLectureData || (editingTopic
            ? {
                chapterName: courses[selectedCourseIdx]?.videos[editingTopic.videoIdx]?.chapterName,
                topics: [courses[selectedCourseIdx]?.videos[editingTopic.videoIdx]?.topics[editingTopic.topicIdx]]
              }
            : editingChapterIdx !== null
              ? chapterActionType === 'add'
                ? {
                    chapterName: courses[selectedCourseIdx]?.videos[editingChapterIdx]?.chapterName,
                    topics: [ { topicName: '', VideoUrl: '', topicDescription: '', pdf: null } ]
                  }
                : {
                    chapterName: courses[selectedCourseIdx]?.videos[editingChapterIdx]?.chapterName,
                    topics: courses[selectedCourseIdx]?.videos[editingChapterIdx]?.topics
                  }
              : addVideosModalInitial)
          }
          courseId={selectedCourseIdx !== null ? courses[selectedCourseIdx]._id : undefined}
          maxLectureNumber={nextLectureNumber - 1}
          editingLectureId={editingLectureId}
          editingLectureData={editingLectureData}
        />
      )}
      {/* Delete Chapter Confirmation Modal */}
      {showDeleteChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Delete Chapter</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this chapter and all its topics? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteChapterModal(false); setDeleteChapterIdx(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLecture(lectures[deleteChapterIdx]?._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCourses; 