import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Mail, Phone, MapPin, BookOpen, Briefcase, Award, CheckCircle, ShieldCheck, Calendar } from 'lucide-react';

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

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-8">
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
