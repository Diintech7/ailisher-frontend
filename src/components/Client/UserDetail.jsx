import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { User, Activity, Award, BookOpen, ShoppingCart, Clock, TrendingUp, Calendar, CheckCircle, XCircle, ArrowLeft, Gift, BarChart3 } from 'lucide-react';
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

  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const [planId, setPlanId] = useState('');
  const [trialPlans, setTrialPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [activeTrial, setActiveTrial] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('usertoken');
        if (!token) throw new Error('Authentication required');
        if (!clientId || !userId) throw new Error('Missing clientId or userId');

        const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/mobile/user-profile/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
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

  useEffect(() => {
    const loadTrialPlans = async () => {
      if (!grantOpen || !clientId) return;
      setPlansLoading(true);
      try {
        const token = Cookies.get('usertoken');
        const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok && json.success) {
          const plans = (json.data || []).filter(p => p.category === 'Trial' && p.status === 'active' && p.isEnabled);
          setTrialPlans(plans);
        } else {
          setTrialPlans([]);
        }
      } catch (_) {
        setTrialPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadTrialPlans();
  }, [grantOpen, clientId]);

  useEffect(() => {
    const fetchActiveTrial = async () => {
      try {
        if (!clientId || !data?.profile?._id) return;
        const token = Cookies.get('usertoken');
        const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/mobile/credit/trial/user/${data.profile._id}/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setActiveTrial(json.data);
        }
      } catch (_) {}
    };
    fetchActiveTrial();
  }, [clientId, data?.profile?._id]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (tab !== 'analytics' || !clientId || !userId) return;
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const token = Cookies.get('usertoken');
        if (!token) throw new Error('Authentication required');
        const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/app-analytics/${userId}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load analytics');
        setAnalyticsData(json);
      } catch (e) {
        setAnalyticsError(e.message || 'Failed to load analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [tab, clientId, userId]);

  const user = data?.user || {};
  const profile = data?.profile || {};
  const answers = data?.answers || {};
  const library = data?.library || {};
  const purchases = data?.purchases || {};

  const stats = [
    { label: 'Total Submissions', value: answers.totalSubmissions || 0, icon: Activity, color: 'blue' },
    { label: 'Avg Score', value: `${Number(answers.averageScore || 0).toFixed(1)}%`, icon: TrendingUp, color: 'green' },
    { label: 'Total Purchases', value: purchases.totalPurchases || 0, icon: ShoppingCart, color: 'purple' },
    { label: 'Login Count', value: user.loginCount || 0, icon: Clock, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{profile.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  {user.isVerified ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                  {user.isVerified ? 'Verified' : 'Not Verified'}
                </span>
                <span>•</span>
                <span>{user.mobile}</span>
              </div>
            </div>
            
            <button
              onClick={() => setGrantOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all"
            >
              <Gift className="w-5 h-5" />
              Grant Trial
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${
                  stat.color === 'blue' ? 'bg-blue-50' :
                  stat.color === 'green' ? 'bg-green-50' :
                  stat.color === 'purple' ? 'bg-purple-50' :
                  'bg-orange-50'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'activity', label: 'Activity', icon: Activity },
                { id: 'performance', label: 'Performance', icon: Award },
                { id: 'analytics', label: 'App Analytics', icon: BarChart3 },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {tab === 'overview' && (
              <div className="space-y-8">
                <Section title="Personal Information" icon={User}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard label="Full Name" value={profile.name} />
                    <InfoCard label="Mobile Number" value={user.mobile} />
                    <InfoCard label="Age" value={profile.age} />
                    <InfoCard label="Gender" value={profile.gender} />
                    <InfoCard label="Native Language" value={profile.nativeLanguage} />
                    <InfoCard label="City" value={profile.city} />
                    <InfoCard label="Pincode" value={profile.pincode} />
                    <InfoCard label="Exams" value={(Array.isArray(profile.exams) ? profile.exams : []).join(', ')} />
                  </div>
                </Section>

                {activeTrial && (
                  <Section title="Active Trial" icon={Gift}>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InfoCard label="Plan Name" value={activeTrial.plan?.name} variant="light" />
                        <InfoCard label="Credits Granted" value={activeTrial.userPlan?.creditsGranted} variant="light" />
                        <InfoCard label="Duration" value={`${activeTrial.plan?.duration} days`} variant="light" />
                        <InfoCard label="Status" value={activeTrial.userPlan?.status} variant="light" />
                        <InfoCard label="Start Date" value={new Date(activeTrial.userPlan?.startDate).toLocaleDateString()} variant="light" />
                        <InfoCard label="End Date" value={new Date(activeTrial.userPlan?.endDate).toLocaleDateString()} variant="light" />
                      </div>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-8">
                <Section title="Login Activity" icon={Clock}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard label="Total Logins" value={user.loginCount} />
                    <InfoCard label="Last Login" value={new Date(user.lastLoginAt).toLocaleString()} />
                    <InfoCard label="Account Created" value={new Date(user.createdAt).toLocaleString()} />
                  </div>
                </Section>

                <Section title="Library" icon={BookOpen}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard label="Saved Books" value={library.myBooksCount} />
                    <InfoCard label="Saved Workbooks" value={library.myWorkbooksCount} />
                  </div>
                </Section>

                <Section title="Purchase History" icon={ShoppingCart}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard label="Total Purchases" value={purchases.totalPurchases} />
                    <InfoCard label="Total Amount" value={`₹${purchases.totalAmount}`} />
                    <InfoCard label="Last Purchase" value={new Date(purchases.lastPurchaseAt).toLocaleDateString()} />
                  </div>
                  {purchases.lastPurchase && (
                    <div className="mt-6 bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-4">Latest Purchase Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard label="Amount" value={`₹${purchases.lastPurchase.amount}`} variant="light" />
                        <InfoCard label="Gateway" value={purchases.lastPurchase.gatewayName} variant="light" />
                        <InfoCard label="Payment Mode" value={purchases.lastPurchase.paymentMode} variant="light" />
                      </div>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {tab === 'performance' && (
              <div className="space-y-8">
                <Section title="Performance Metrics" icon={TrendingUp}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InfoCard label="Total Submissions" value={answers.totalSubmissions} />
                    <InfoCard label="Evaluated" value={answers.evaluatedCount} />
                    <InfoCard label="Average Score" value={`${Number(answers.averageScore).toFixed(1)}%`} />
                    <InfoCard label="Best Score" value={answers.bestScore} />
                    <InfoCard label="Total Time Spent" value={`${Math.round(answers.totalTimeSpent / 60)} min`} />
                    <InfoCard label="Last Submission" value={new Date(answers.lastSubmissionAt).toLocaleDateString()} />
                  </div>
                </Section>

                <Section title="Recent Submissions" icon={Activity}>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Attempt</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {answers.recent.map((a, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {new Date(a.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                a.submissionStatus === 'evaluated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {a.submissionStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                              {a.score ?? '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{a.testType}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">#{a.attemptNumber}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{a.timeSpent}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </div>
            )}

            {tab === 'analytics' && (
              <div className="space-y-8">
                {analyticsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-slate-600">Loading analytics...</div>
                  </div>
                )}

                {analyticsError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                    Error: {analyticsError}
                  </div>
                )}

                {!analyticsLoading && !analyticsError && analyticsData && (
                  <>
                    <Section title="Time Spent Summary" icon={Clock}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-blue-700">Today</div>
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-3xl font-bold text-blue-900">
                            {analyticsData.summary?.last1DayMinutes || 0} min
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {analyticsData.summary?.last1DaySeconds || 0} seconds
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-purple-700">Last 7 Days</div>
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-3xl font-bold text-purple-900">
                            {analyticsData.summary?.last7DaysMinutes || 0} min
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {analyticsData.summary?.last7DaysSeconds || 0} seconds
                          </div>
                        </div>
                      </div>
                    </Section>

                    <Section title="Daily Usage (Last 7 Days)" icon={BarChart3}>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        {analyticsData.summary?.perDay && analyticsData.summary.perDay.length > 0 ? (
                          <UsageChart data={analyticsData.summary.perDay} />
                        ) : (
                          <div className="text-center py-8 text-slate-500">No usage data available</div>
                        )}
                      </div>
                    </Section>

                    <Section title="Page Analytics" icon={Activity}>
                      {analyticsData.data && analyticsData.data.length > 0 ? (
                        <PageAnalyticsByDate data={analyticsData.data} />
                      ) : (
                        <div className="text-center py-8 text-slate-500">No page analytics available</div>
                      )}
                    </Section>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grant Trial Modal */}
        {grantOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
              <div className="px-6 py-5 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Grant Trial Access</h2>
                <p className="text-sm text-slate-600 mt-1">Select a trial plan to grant to this user</p>
              </div>
              
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Trial Plan</label>
                <select className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                  <option value="">Choose a trial plan</option>
                  {trialPlans.map(p => (
                    <option value={p._id} key={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                <button 
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                  onClick={() => setGrantOpen(false)}
                >
                  Cancel
                </button>
                <button className="px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 transition-all">
                  Grant Trial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ label, value, variant = 'default' }) {
  return (
    <div className={variant === 'light' ? '' : 'bg-slate-50 rounded-lg p-4 border border-slate-200'}>
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value || '-'}</div>
    </div>
  );
}

function UsageChart({ data }) {
  if (!data || data.length === 0) return <div className="text-center py-8 text-slate-500">No data available</div>;
  
  // Use seconds for more accurate scaling, especially for small values
  const maxSeconds = Math.max(...data.map(d => d.seconds || 0), 1);
  const maxMinutes = Math.max(...data.map(d => d.minutes || 0), 1);
  const chartHeight = 200;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-[200px] mb-4">
        {data.map((day, idx) => {
          // Use seconds for more accurate height calculation
          const height = maxSeconds > 0 ? (day.seconds / maxSeconds) * chartHeight : 0;
          // Ensure minimum height for visibility if there's any data
          const barHeight = day.seconds > 0 ? Math.max(height, 8) : 4;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end">
              <div className="relative w-full flex flex-col items-center group">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                  style={{ height: `${barHeight}px`, minHeight: '4px' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                    {day.seconds > 0 ? (
                      day.seconds < 60 ? `${day.seconds} sec` : `${day.minutes} min (${day.seconds}s)`
                    ) : '0 sec'}
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 text-center" style={{ writingMode: 'horizontal-tb' }}>
                  {formatDate(day.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span>Minutes spent per day</span>
        </div>
      </div>
    </div>
  );
}

function PageAnalyticsByDate({ data }) {
  // Helper to parse time strings like "20 min" to seconds
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const str = String(timeStr).trim().toLowerCase();
    const minMatch = str.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (minMatch) return parseInt(minMatch[1]) * 60;
    const secMatch = str.match(/(\d+)\s*(s|sec|secs|second|seconds)/);
    if (secMatch) return parseInt(secMatch[1]);
    const num = parseInt(str);
    return isNaN(num) ? 0 : num;
  };

  // Helper to format seconds back to readable format
  const formatSeconds = (seconds) => {
    if (seconds < 60) return `${seconds} s`;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Group entries by date (YYYY-MM-DD)
  const groupedByDate = {};
  
  data.forEach((entry) => {
    if (!entry.createdAt) return;
    const date = new Date(entry.createdAt);
    const dateKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        date: dateKey,
        dateObj: date,
        entries: [],
        pages: new Map(), // page_name -> { timeSpentSeconds, visitedCount }
        totalTimeSeconds: 0
      };
    }
    
    groupedByDate[dateKey].entries.push(entry);
    
    // Parse total_time for this entry
    const entryTimeSeconds = parseTimeToSeconds(entry.total_time);
    groupedByDate[dateKey].totalTimeSeconds += entryTimeSeconds;
    
    // Aggregate pages
    if (entry.pages && Array.isArray(entry.pages)) {
      entry.pages.forEach((page) => {
        const pageName = page.page_name || 'Unknown';
        const pageTimeSeconds = parseTimeToSeconds(page.time_spent);
        const pageVisits = page.visited_count || 0;
        
        if (!groupedByDate[dateKey].pages.has(pageName)) {
          groupedByDate[dateKey].pages.set(pageName, {
            timeSpentSeconds: 0,
            visitedCount: 0
          });
        }
        
        const pageData = groupedByDate[dateKey].pages.get(pageName);
        pageData.timeSpentSeconds += pageTimeSeconds;
        pageData.visitedCount += pageVisits;
      });
    }
  });

  // Convert to array and sort by date (newest first)
  const datesArray = Object.values(groupedByDate).sort((a, b) => {
    return new Date(b.dateObj) - new Date(a.dateObj);
  });

  // Show last 7 days
  const recentDates = datesArray.slice(0, 7);

  if (recentDates.length === 0) {
    return <div className="text-center py-8 text-slate-500">No page analytics available</div>;
  }

  return (
    <div className="space-y-6">
      {recentDates.map((dayData, idx) => {
        const pagesArray = Array.from(dayData.pages.entries())
          .map(([name, data]) => ({
            name,
            timeSpent: formatSeconds(data.timeSpentSeconds),
            visitedCount: data.visitedCount
          }))
          .sort((a, b) => b.visitedCount - a.visitedCount); // Sort by visits

        return (
          <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">
                {dayData.dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-sm font-medium text-indigo-600">
                {formatSeconds(dayData.totalTimeSeconds)} total
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pagesArray.map((page, pIdx) => (
                <div key={pIdx} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs font-medium text-slate-700 mb-1">{page.name}</div>
                  <div className="text-xs text-slate-600">{page.timeSpent}</div>
                  <div className="text-xs text-slate-500 mt-1">{page.visitedCount} visits</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}