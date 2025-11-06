import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function UserDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const query = useQuery();
  const clientId = query.get('clientId');

  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('usertoken');
        if (!token) {
          throw new Error('Authentication required');
        }
        if (!clientId || !userId) {
          throw new Error('Missing clientId or userId');
        }

        const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/mobile/user-profile/${userId}` , {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log(json);
        if (!json.success) throw new Error(json.message || 'Failed to load user');
        setData(json.data);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [clientId, userId]);

  const user = data?.user || {};
  const profile = data?.profile || {};
  const answers = data?.answers || {};
  const library = data?.library || {};
  const purchases = data?.purchases || {};

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">User Detail</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >Back</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200 px-4 pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTab('profile')}
                className={`px-4 py-2 text-sm rounded-t-md ${tab==='profile' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >Profile</button>
              <button
                onClick={() => setTab('activity')}
                className={`px-4 py-2 text-sm rounded-t-md ${tab==='activity' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >Activity</button>
            </div>
          </div>

          {tab === 'profile' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info label="Name" value={profile.name} />
              <Info label="Mobile" value={user.mobile} />
              <Info label="Client ID" value={user.clientId} />
              <Info label="Verified" value={user.isVerified ? 'Yes' : 'No'} />
              <Info label="Age" value={profile.age} />
              <Info label="Gender" value={profile.gender} />
              <Info label="Native Language" value={profile.nativeLanguage} />
              <Info label="City" value={profile.city} />
              <Info label="Pincode" value={profile.pincode} />
              <Info label="Exams" value={(profile.exams || []).join(', ')} />
              <Info label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleString() : ''} />
            </div>
          )}

          {tab === 'activity' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Login">
                <Info label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : ''} />
                <Info label="Login Count" value={user.loginCount} />
              </Section>

              <Section title="Answers">
                <Info label="Total Submissions" value={answers.totalSubmissions} />
                <Info label="Evaluated Count" value={answers.evaluatedCount} />
                <Info label="Total Time Spent (min)" value={Math.round((answers.totalTimeSpent || 0) / 60)} />
                <Info label="Average Score" value={Number(answers.averageScore || 0).toFixed(1)} />
                <Info label="Best Score" value={answers.bestScore} />
                <Info label="Last Submission" value={answers.lastSubmissionAt ? new Date(answers.lastSubmissionAt).toLocaleString() : ''} />
              </Section>

              <Section title="Library">
                <Info label="Saved Books" value={library.myBooksCount} />
                <Info label="Saved Workbooks" value={library.myWorkbooksCount} />
              </Section>

              <Section title="Purchases">
                <Info label="Total Purchases" value={purchases.totalPurchases} />
                <Info label="Total Amount" value={purchases.totalAmount} />
                <Info label="Last Purchase At" value={purchases.lastPurchaseAt ? new Date(purchases.lastPurchaseAt).toLocaleString() : ''} />
                <Info label="Last Purchase Amount" value={purchases.lastPurchase ? `${purchases.lastPurchase.amount} ${purchases.lastPurchase.currency || ''}`.trim() : '-'} />
                <Info label="Last Purchase Gateway" value={purchases.lastPurchase?.gatewayName} />
                <Info label="Last Purchase Mode" value={purchases.lastPurchase?.paymentMode} />
              </Section>

              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Recent Answers</h3>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Submitted</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Score</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Attempt</th>
                        <th className="px-3 py-2 text-left">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(answers.recent || []).map((a, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : ''}</td>
                          <td className="px-3 py-2">{a.submissionStatus}</td>
                          <td className="px-3 py-2">{a.evaluation?.score ?? a.score ?? '-'}</td>
                          <td className="px-3 py-2">{a.testType}</td>
                          <td className="px-3 py-2">{a.attemptNumber}</td>
                          <td className="px-3 py-2">{a.metadata?.timeSpent ?? a.timeSpent ?? 0}</td>
                        </tr>
                      ))}
                      {(!answers.recent || answers.recent.length === 0) && (
                        <tr><td className="px-3 py-3 text-center text-gray-500" colSpan={6}>No recent answers</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value ?? '-'}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="text-sm font-semibold text-gray-800 mb-2">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}


