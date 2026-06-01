import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, BookOpen, Layers, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomSubjectDetail = () => {
  const { examId, paperId, subjectId } = useParams();
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [chapters, setChapters] = useState([]);
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
          setChapters(foundSubject?.chapters || []);
        }
      } catch (err) {
        console.error('Error fetching subject chapters:', err);
        toast.error('Failed to load chapters list');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [examId, paperId, subjectId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading chapters list...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/classroom/${examId}`)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to Papers
      </button>

      {/* Breadcrumbs / Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-400 font-semibold mb-2">
          <span>Classrooms</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(`/classroom/${examId}`)}>
            {exam?.name}
          </span>
          <span>/</span>
          <span className="truncate">{paper?.name}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center" style={{ borderLeft: `5px solid ${subject?.color || '#3b82f6'}`, paddingLeft: '12px' }}>
          {subject?.name}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Select a chapter below to view the detailed topics and learning notes.
        </p>
      </div>

      {/* Chapters List */}
      <div className="space-y-4 max-w-4xl">
        {chapters.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
            <Layers className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">No Chapters Synced</h3>
            <p className="text-gray-500 mt-1">This subject does not contain any chapters.</p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={chapter.chapter_id}
              onClick={() => navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}/chapters/${chapter.chapter_id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-100 transition group"
            >
              <div className="flex items-center space-x-4">
                {/* Chapter Number Badge */}
                <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                    {chapter.name}
                  </h3>
                  <div className="flex items-center text-xs text-gray-400 font-semibold mt-1">
                    <BookOpen size={12} className="mr-1" />
                    {chapter.topics?.length || 0} Topics
                  </div>
                </div>
              </div>

              <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition duration-200" size={20} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassroomSubjectDetail;
