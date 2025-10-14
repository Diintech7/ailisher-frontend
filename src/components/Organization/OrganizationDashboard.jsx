import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'

export default function OrganizationDashboard() {
  const [org, setOrg] = useState(null);

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
