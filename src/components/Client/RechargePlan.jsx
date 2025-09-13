import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';

export default function RechargePlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');
  const baseHeaders = { 'Content-Type': 'application/json' };
  const authHeaders = token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans`, {
        method: 'GET',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load plans');
      setPlans(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePlan(planId) {
    if (!window.confirm('Delete this plan and its items?')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete plan');
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      if (detailOpen && detailPlan && detailPlan._id === planId) setDetailOpen(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function openPlanDetails(planId) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailPlan(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load plan');
      setDetailPlan(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function DiscountBadge({ mrp, offer }) {
    const discount = mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
    if (discount <= 0) return null;
    return (
      <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{discount}% off</span>
    );
  }

  return (
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Recharge Plans</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => navigate('/recharge-plan/create')}>Create Plan</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        plans.length === 0 ? (
          <div className="text-gray-600">No plans yet. Click "Create Plan" to add one.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow transition group">
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex items-start justify-between cursor-pointer" onClick={() => openPlanDetails(plan._id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold leading-tight">{plan.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plan.category === 'Premium' ? 'bg-purple-100 text-purple-700' : plan.category === 'Enterprise' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{plan.category || 'Basic'}</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{plan.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.description}</p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold">₹{plan.offerPrice}
                        <DiscountBadge mrp={plan.MRP} offer={plan.offerPrice} />
                      </div>
                      <div className="text-xs text-gray-500 line-through">₹{plan.MRP}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{plan.credits} credits</div>
                      <div className="text-xs text-gray-500">{plan.duration} days</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Items: {(plan.items || []).length}</span>
                    {(plan.items || []).slice(0, 3).map((it) => (
                      <span key={it._id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{it.itemType}</span>
                    ))}
                    {(plan.items || []).length > 3 && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600">+{(plan.items || []).length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Updated: {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString()}</div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/recharge-plan/${plan._id}/edit`)} className="px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDeletePlan(plan._id)} className="px-3 py-1.5 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {detailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-lg font-semibold">Plan Details</div>
              <button className="text-gray-600" onClick={() => setDetailOpen(false)}>✕</button>
            </div>
            <div className="p-4">
              {detailLoading ? (
                <div>Loading...</div>
              ) : detailPlan ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-semibold">{detailPlan.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${detailPlan.category === 'Premium' ? 'bg-purple-100 text-purple-700' : detailPlan.category === 'Enterprise' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{detailPlan.category}</span></div>
                      <div className="text-sm text-gray-600 mt-1">{detailPlan.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">₹{detailPlan.offerPrice}</div>
                      <div className="text-xs text-gray-500 line-through">₹{detailPlan.MRP}</div>
                      <div className="text-sm mt-1">{detailPlan.credits} credits • {detailPlan.duration} days</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Bundled Items ({(detailPlan.items || []).length})</div>
                    {(detailPlan.items || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No items.</div>
                    ) : (
                      <ul className="divide-y">
                        {detailPlan.items.map((item) => (
                          <li key={item._id} className="py-2">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.itemType}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">Failed to load plan.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
