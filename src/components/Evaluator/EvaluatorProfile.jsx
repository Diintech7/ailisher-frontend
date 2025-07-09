import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Mail, Phone, MapPin, BookOpen, Briefcase, Award, CheckCircle, ShieldCheck, Calendar, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default function EvaluatorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get('evaluatortoken');
        const response = await axios.get('https://aipbbackend-c5ed.onrender.com/api/evaluator-reviews/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setProfile(response.data.evaluator);
          const profile = response.data.evaluator;
          setForm({
            name: profile.name || '',
            currentcity: profile.currentcity || '',
            subjectMatterExpert: profile.subjectMatterExpert || '',
            instituteworkedwith: profile.instituteworkedwith || '',
            examFocus: profile.examFocus || '',
            experience: profile.experience || ''
          });
        } else {
          setError(response.data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  console.log(form)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setEditOpen(false);
    setForm({
      name: profile.name || '',
      currentcity: profile.currentcity || '',
      subjectMatterExpert: profile.subjectMatterExpert || '',
      instituteworkedwith: profile.instituteworkedwith || '',
      examFocus: profile.examFocus || '',
      experience: profile.experience || ''
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      const token = Cookies.get('evaluatortoken');
      const response = await axios.patch(
        'https://aipbbackend-c5ed.onrender.com/api/evaluator-reviews/profile',
        {
          name: form.name,
          currentcity: form.currentcity,
          subjectMatterExpert: form.subjectMatterExpert,
          instituteworkedwith: form.instituteworkedwith,
          examFocus: form.examFocus,
          experience: form.experience
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setProfile(response.data.evaluator);
        setEditOpen(false);
        setError(null);
        toast.success("Profile Updated Successfully")
      } else {
        setError(response.data.message || 'Failed to update profile');
        toast.error("Profile Not Updated")
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-8">
      {/* Edit Profile Button */}
      <button
        className="flex items-center gap-1 mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        onClick={() => setEditOpen(true)}
      >
        <Edit2 size={16} /> Edit Profile
      </button>

      {/* Custom Modal using Tailwind only */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setEditOpen(false)}
            >
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Profile</h2>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input name="name" value={form.name} onChange={handleChange} autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Current City</label>
                <input name="currentcity" value={form.currentcity} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Subject Matter Expert</label>
                <input name="subjectMatterExpert" value={form.subjectMatterExpert} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Institutes Worked With</label>
                <input name="instituteworkedwith" value={form.instituteworkedwith} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Exam Focus</label>
                <input name="examFocus" value={form.examFocus} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Experience (years)</label>
                <input name="experience" type="number" value={form.experience} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition mt-2"
              >
                <Save size={16} /> Save
              </button>
              {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-purple-50 rounded-xl p-8 shadow mb-10 border border-purple-100">
        <div className="bg-purple-200 rounded-full p-6 flex-shrink-0 flex items-center justify-center shadow">
          <User size={64} className="text-purple-700" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 w-full">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              {profile.name || 'N/A'}
              {profile.status === 'VERIFIED' && (
                <CheckCircle size={24} className="text-green-500" title="Verified" />
              )}
              {profile.enabled && (
                <ShieldCheck size={22} className="text-blue-500" title="Enabled" />
              )}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2 text-gray-600">
            <div className="flex items-center gap-2"><Mail size={16} /> {profile.email || 'N/A'}</div>
            <div className="flex items-center gap-2"><Phone size={16} /> {profile.phoneNumber || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="space-y-4 bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center gap-2 text-gray-700"><MapPin size={18} /> <span className="font-semibold">Current City:</span> {profile.currentcity || 'N/A'}</div>
          <div className="flex items-center gap-2 text-gray-700"><BookOpen size={18} /> <span className="font-semibold">Grade:</span> {profile.grade || 'N/A'}</div>
          <div className="flex items-center gap-2 text-gray-700"><BookOpen size={18} /> <span className="font-semibold">Experience:</span> {profile.experience != null ? `${profile.experience} years` : 'N/A'}</div>
        </div>
        <div className="space-y-4 bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center gap-2 text-gray-700"><Calendar size={18} /> <span className="font-semibold">Joined:</span> {formatDate(profile.createdAt)}</div>
          <div className="flex items-center gap-2 text-gray-700"><Award size={18} /> <span className="font-semibold">Status:</span> {profile.status || 'N/A'}</div>
        </div>
      </div>

      {/* Institutes Worked With */}
      <div className="mb-10">
        <div className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-1"><Briefcase size={22} /> Institutes Worked With</div>
        <div className="ml-2 text-gray-700 text-lg bg-white rounded-lg p-4 border shadow-sm">
          {Array.isArray(profile.instituteworkedwith) ? (
            profile.instituteworkedwith.length > 0 ? (
              <ul className="list-disc list-inside">
                {profile.instituteworkedwith.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            ) : 'N/A'
          ) : (profile.instituteworkedwith || 'N/A')}
        </div>
      </div>

      {/* Exam Focus */}
      <div className="mb-10">
        <div className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-1"><Award size={22} /> Exam Focus</div>
        <div className="ml-2 text-gray-700 text-lg bg-white rounded-lg p-4 border shadow-sm">
          {Array.isArray(profile.examFocus) ? (
            profile.examFocus.length > 0 ? (
              <ul className="list-disc list-inside">
                {profile.examFocus.map((exam, idx) => (
                  <li key={idx}>{exam}</li>
                ))}
              </ul>
            ) : 'N/A'
          ) : (profile.examFocus || 'N/A')}
        </div>
      </div>

      {/* Subject Expert */}
      <div className="mb-10">
        <div className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-1"><BookOpen size={22} /> Subject Expert</div>
        <div className="ml-2 text-gray-700 text-lg bg-white rounded-lg p-4 border shadow-sm">{profile.subjectMatterExpert || 'N/A'}</div>
      </div>
    </div>
  );
}
