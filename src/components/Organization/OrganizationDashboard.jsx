import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'

export default function OrganizationDashboard() {
  const [org, setOrg] = useState(null);
  const [clientStats, setClientStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0, recent: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const orgData = Cookies.get('organization');
    if (orgData) {
      try {
        setOrg(JSON.parse(orgData));
      } catch (e) {
        setOrg(null);
      }
    }
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingStats(true);
        const token = Cookies.get('orgtoken');
        if (!token) {
          setClientStats({ total: 0, active: 0, inactive: 0, pending: 0, recent: 0 });
          return;
        }
        const response = await axios.get('https://test.ailisher.com/api/organizations/clients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const clients = Array.isArray(response.data?.data) ? response.data.data : [];
        const total = clients.length;
        const active = clients.filter(c => (c.status || '').toLowerCase() === 'active').length;
        const inactive = clients.filter(c => (c.status || '').toLowerCase() === 'inactive').length;
        const pending = clients.filter(c => !c.status || (c.status || '').toLowerCase() === 'pending').length;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = clients.filter(c => c.createdAt && new Date(c.createdAt).getTime() >= thirtyDaysAgo).length;
        setClientStats({ total, active, inactive, pending, recent });
      } catch (e) {
        setClientStats({ total: 0, active: 0, inactive: 0, pending: 0, recent: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organization Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your organization details</p>
        </div>
        {org && (
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
            Active
          </span>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Total Clients</div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{loadingStats ? '—' : clientStats.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-emerald-700">Active</div>
          <div className="mt-2 text-3xl font-bold text-emerald-800">{loadingStats ? '—' : clientStats.active}</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-rose-700">Inactive</div>
          <div className="mt-2 text-3xl font-bold text-rose-800">{loadingStats ? '—' : clientStats.inactive}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-amber-700">Pending</div>
          <div className="mt-2 text-3xl font-bold text-amber-800">{loadingStats ? '—' : clientStats.pending}</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-indigo-700">New (30 days)</div>
          <div className="mt-2 text-3xl font-bold text-indigo-800">{loadingStats ? '—' : clientStats.recent}</div>
        </div>
      </div>

      {org ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-5 shadow">
              <div className="text-xs/5 uppercase tracking-wide opacity-90">Organization</div>
              <div className="mt-1 text-lg font-semibold">{org.name}</div>
              <div className="mt-3 h-px"></div>
              <hr/>
              <div className="mt-3 text-xs">{org.slug}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-5 bg-slate-50">
              <div className="text-xs/5 uppercase tracking-wide text-slate-500">Contact Email</div>
              <div className="mt-1 text-slate-800 font-medium">{org.authEmail}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">Verified</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-5 bg-white">
              <div className="text-xs/5 uppercase tracking-wide text-slate-500">Status</div>
              <div className="mt-1 text-slate-800 font-medium">Active</div>
              <button className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">Manage</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No organization data found.</div>
      )}
    </div>
  )
}
