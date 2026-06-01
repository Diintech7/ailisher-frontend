import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, BookOpen, FileText, ChevronRight, Hash, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import MDEditor from '@uiw/react-md-editor';
import { API_BASE_URL } from '../../config';



const ClassroomSubtopicDetail = () => {
  const { examId, paperId, subjectId, chapterId, topicId } = useParams();
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topic, setTopic] = useState(null);
  const [subtopics, setSubtopics] = useState([]);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.success) {
          setExam(response.data.exam);
          const foundPaper = response.data.tree.find(p => p.paper_id === paperId);
          setPaper(foundPaper);
          const foundSubject = foundPaper?.subjects?.find(s => s.subject_id === subjectId);
          setSubject(foundSubject);
          const foundChapter = foundSubject?.chapters?.find(c => c.chapter_id === chapterId);
          setChapter(foundChapter);
          const foundTopic = foundChapter?.topics?.find(t => t.topic_id === topicId);
          setTopic(foundTopic);
          
          const list = foundTopic?.subtopics || [];
          setSubtopics(list);
          if (list.length > 0) {
            setActiveSubtopic(list[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching subtopic details:', err);
        toast.error('Failed to load study contents');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [examId, paperId, subjectId, chapterId, topicId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading note contents...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapterId}`)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to Topics
      </button>

      {/* Header breadcrumbs */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center space-x-2 text-xs text-gray-400 font-semibold">
          <span>Classrooms</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}`)}>
            {exam?.name}
          </span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`)}>
            {subject?.name}
          </span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapterId}`)}>
            {chapter?.name}
          </span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mt-1 flex items-center">
          <Hash className="text-blue-600 mr-1.5" size={18} />
          {topic?.name}
        </h2>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Side: Subtopics Checklist / Navigation */}
        <div className="w-full lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col space-y-2 h-auto lg:h-[70vh] overflow-y-auto">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Notes Subtopics
          </div>
          {subtopics.length === 0 ? (
            <div className="text-gray-400 italic text-sm p-3">No notes synced.</div>
          ) : (
            subtopics.map((sub) => (
              <button
                key={sub.subtopic_id}
                onClick={() => setActiveSubtopic(sub)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between group ${
                  activeSubtopic?.subtopic_id === sub.subtopic_id
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText size={16} className={activeSubtopic?.subtopic_id === sub.subtopic_id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className="truncate">{sub.name}</span>
                </div>
                <ChevronRight className={`text-gray-300 transition duration-200 group-hover:text-blue-600 ${
                  activeSubtopic?.subtopic_id === sub.subtopic_id ? 'text-blue-600 translate-x-0.5' : ''
                }`} size={16} />
              </button>
            ))
          )}
        </div>

        {/* Right Side: Markdown Content Reader */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 min-h-[50vh] lg:h-[70vh] overflow-y-auto">
          {activeSubtopic ? (
            <div>
              {/* Note Header Title */}
              <div className="border-b border-gray-100 pb-4 mb-6">
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  Active Study Material
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{activeSubtopic.name}</h1>
              </div>

              {/* Render Notes Text with dynamic Markdown Parser */}
              <div className="prose max-w-none" data-color-mode="light">
                <MDEditor.Markdown 
                  source={activeSubtopic.description || ''} 
                  className="bg-transparent border-none shadow-none text-gray-800"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-400 italic">
              Please select a subtopic notes from the list to start reading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomSubtopicDetail;
