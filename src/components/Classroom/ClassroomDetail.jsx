import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { RefreshCw, ArrowLeft, Layers, Calendar, ChevronRight, FileText, Loader2, BookCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

const ClassroomDetail = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const token = Cookies.get('usertoken');

  const fetchExamTree = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/classroom-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setExam(response.data.exam);
        setTree(response.data.tree || []);
      }
    } catch (err) {
      console.error('Error fetching exam tree:', err);
      toast.error('Failed to load exam papers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamTree();
  }, [examId]);

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      toast.info('Syncing classroom contents. Please wait...');
      const response = await axios.post(`${API_BASE_URL}/api/classroom-exams/${examId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        toast.success('Sync complete!');
        fetchExamTree();
      }
    } catch (err) {
      console.error('Force sync failed:', err);
      toast.error('Failed to force sync exam data');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubjectClick = (paperId, subjectId) => {
    navigate(`/classroom/${examId}/papers/${paperId}/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading classroom subjects...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/classroom')}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition font-semibold"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to Dashboard
      </button>

      {/* Exam Profile Banner */}
      {exam && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">
              {exam.category || 'Classroom Portal'}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{exam.name}</h1>
            <p className="text-gray-600 mt-1 max-w-2xl">{exam.description}</p>
            <div className="flex items-center text-xs text-gray-400 mt-4">
              <Calendar size={14} className="mr-1" />
              Synced at: {new Date(exam.synced_at).toLocaleString()}
            </div>
          </div>
          
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} size={16} />
            Sync Now
          </button>
        </div>
      )}

      {/* Tree Section (Papers) */}
      <div className="space-y-8">
        {tree.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
            <Layers className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">No Synced Papers found</h3>
            <p className="text-gray-500 mt-1">Please click "Sync Now" to reload data from partner networks.</p>
          </div>
        ) : (
          tree.map((paper) => (
            <div key={paper.paper_id} className="space-y-4">
              {/* Paper header */}
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                <FileText className="text-gray-400" size={20} />
                <h2 className="text-xl font-bold text-gray-800">{paper.name}</h2>
                <span className="text-xs text-gray-400">({paper.subjects?.length || 0} Subjects synced)</span>
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paper.subjects?.map((subject) => (
                  <div
                    key={subject.subject_id}
                    onClick={() => handleSubjectClick(paper.paper_id, subject.subject_id)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition duration-200 flex flex-col justify-between group"
                    style={{ borderLeft: `4px solid ${subject.color || '#3b82f6'}` }}
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {subject.name}
                      </h3>
                      
                      {/* Structure Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-sm font-bold text-gray-700">{subject.chapter_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Chapters</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-sm font-bold text-gray-700">{subject.topic_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Topics</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-sm font-bold text-gray-700">{subject.subtopic_count || 0}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Notes</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Click to open course-material</span>
                      <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition duration-200" size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassroomDetail;
