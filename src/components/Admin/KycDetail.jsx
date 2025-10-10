import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
export default function KycDetail() {
    const token = Cookies.get('admintoken');

    const [items, setItems] = useState([]);
    const [kycLoading, setKycLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState(null);

    const endpointForTab = (tab) => {
      switch (tab) {
        case 'pending':
          return 'submitted-kyc';
        case 'verified':
          return 'verified-kyc';
        case 'rejected':
          return 'rejected-kyc';
        default:
          return 'submitted-kyc';
      }
    };

    const fetchKycLists = async (tab) => {
      try {
        setKycLoading(true);
        const token = Cookies.get('admintoken');
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`https://test.ailisher.com/api/admin/${endpointForTab(tab)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch KYC list');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('KYC fetch error:', err);
        toast.error(err.message || 'Failed to fetch KYC list');
        setItems([]);
      } finally {
        setKycLoading(false);
      }
    };

    useEffect(() => {
      fetchKycLists(activeTab);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const openDetail = async (id) => {
      try {
        setDetailLoading(true);
        setDetail(null);
        setDetailOpen(true);
        const token = Cookies.get('admintoken');
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(`https://test.ailisher.com/api/evaluators/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch evaluator');
        const data = await res.json();
        if (data?.success !== false && (data?.evaluator || data?.data || data)) {
          setDetail(data.evaluator || data.data || data);
        } else {
          setDetail(null);
        }
      } catch (err) {
        console.error('Evaluator detail error:', err);
        toast.error(err.message || 'Failed to fetch evaluator');
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };

    const closeDetail = () => {
      setDetailOpen(false);
      setDetail(null);
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="border-b border-gray-200 flex-1">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending' },
              { key: 'verified', label: 'Verified' },
              { key: 'rejected', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="ml-4">
          <button
            onClick={() => fetchKycLists(activeTab)}
            disabled={kycLoading}
            className={`inline-flex items-center px-3 py-2 border text-sm rounded-md shadow-sm ${
              kycLoading
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {kycLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
               <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{activeTab === 'verified' ? 'Verified At' : activeTab === 'rejected' ? 'Rejected At' : 'Submitted At'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kycLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td>
                </tr>
              )}

              {!kycLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No records found.</td>
                </tr>
              )}

              {!kycLoading && items.map((item) => {
                const name = item?.name || item?.user?.name || item?.profile?.name || '—';
                const email = item?.email || item?.user?.email || item?.profile?.email || '—';
                const mobile = item?.phoneNumber || item?.user?.phoneNumber || item?.profile?.phoneNumber || '—';
                const status = (item?.status || activeTab || '—').toString();
                 const submittedAt = item?.kycDetails?.submittedAt || item?.submittedAt || item?.createdAt;
                 const verifiedAt = item?.kycDetails?.verifiedAt || item?.verifiedAt;
                 const rejectedAt = item?.kycDetails?.rejectedAt || item?.rejectedAt; // may be undefined
                 const timeForTab = activeTab === 'verified' ? verifiedAt : activeTab === 'rejected' ? rejectedAt : submittedAt;
                 const timeDisplay = timeForTab ? new Date(timeForTab).toLocaleString() : '—';
                const id = item?._id || item?.id || '—';
                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{mobile}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        status.toLowerCase() === 'verified' ? 'bg-green-100 text-green-800' :
                        status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{timeDisplay}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm">
                       <button
                         onClick={() => openDetail(id)}
                         className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                       >
                         View Detail
                       </button>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={closeDetail} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Evaluator Details</h3>
              <button onClick={closeDetail} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {detailLoading && (
                <div className="text-center text-gray-500">Loading details…</div>
              )}
              {!detailLoading && !detail && (
                <div className="text-center text-gray-500">No detail available.</div>
              )}
              {!detailLoading && detail && (
                <div className="space-y-8">
                  <section>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Basic Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="text-gray-900">{detail.name || '—'}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{detail.email || '—'}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{detail.phoneNumber || '—'}</span></div>
                      <div><span className="text-gray-500">Subject Expert:</span> <span className="text-gray-900">{detail.subjectMatterExpert || '—'}</span></div>
                      <div><span className="text-gray-500">Exam Focus:</span> <span className="text-gray-900">{detail.examFocus || '—'}</span></div>
                      <div><span className="text-gray-500">Experience:</span> <span className="text-gray-900">{detail.experience ?? '—'}</span></div>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Account Holder:</span> <span className="text-gray-900">{detail.bankDetails?.accountHolderName || '—'}</span></div>
                      <div><span className="text-gray-500">Account Number:</span> <span className="text-gray-900">{detail.bankDetails?.accountNumber || '—'}</span></div>
                      <div><span className="text-gray-500">IFSC:</span> <span className="text-gray-900">{detail.bankDetails?.ifscCode || '—'}</span></div>
                      <div><span className="text-gray-500">Bank:</span> <span className="text-gray-900">{detail.bankDetails?.bankName || '—'}</span></div>
                      <div><span className="text-gray-500">Branch:</span> <span className="text-gray-900">{detail.bankDetails?.branchName || '—'}</span></div>
                      <div><span className="text-gray-500">Account Type:</span> <span className="text-gray-900">{detail.bankDetails?.accountType || '—'}</span></div>
                      <div><span className="text-gray-500">UPI ID:</span> <span className="text-gray-900">{detail.bankDetails?.upiId || '—'}</span></div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">KYC Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Status:</span> <span className="text-gray-900">{detail.kycDetails?.status || '—'}</span></div>
                      <div><span className="text-gray-500">PAN:</span> <span className="text-gray-900">{detail.kycDetails?.panNumber || '—'}</span></div>
                      <div><span className="text-gray-500">Aadhar:</span> <span className="text-gray-900">{detail.kycDetails?.aadharNumber || '—'}</span></div>
                      <div><span className="text-gray-500">Submitted At:</span> <span className="text-gray-900">{detail.kycDetails?.submittedAt ? new Date(detail.kycDetails.submittedAt).toLocaleString() : '—'}</span></div>
                      {/* <div><span className="text-gray-500">Verified At:</span> <span className="text-gray-900">{detail.kycDetails?.verifiedAt ? new Date(detail.kycDetails.verifiedAt).toLocaleString() : '—'}</span></div> */}
                      {/* <div><span className="text-gray-500">Rejected At:</span> <span className="text-gray-900">{detail.kycDetails?.rejectedAt ? new Date(detail.kycDetails.rejectedAt).toLocaleString() : '—'}</span></div> */}
                      {/* <div className="md:col-span-2"><span className="text-gray-500">Rejection Reason:</span> <span className="text-gray-900">{detail.kycDetails?.rejectionReason || '—'}</span></div> */}
                    </div>

                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">PAN Document</div>
                          {detail.kycDetails?.documents?.panDocument?.downloadUrl ? (
                          <img src={detail.kycDetails.documents.panDocument.downloadUrl} alt="PAN Document" className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" />
                          ) : (<span className="text-gray-400">Not uploaded</span>)}
                        </div>
                        <div>
                          <div className="text-gray-500">Aadhar Front</div>
                          {detail.kycDetails?.documents?.aadharFront?.downloadUrl ? (
                          <img src={detail.kycDetails.documents.aadharFront.downloadUrl} alt="PAN Document" className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" />
                        ) : (<span className="text-gray-400">Not uploaded</span>)}
                        </div>
                        <div>
                          <div className="text-gray-500">Aadhar Back</div>
                          {detail.kycDetails?.documents?.aadharBack?.downloadUrl ? (
                          <img src={detail.kycDetails.documents.aadharBack.downloadUrl} alt="PAN Document" className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" />
                        ) : (<span className="text-gray-400">Not uploaded</span>)}
                        </div>
                        <div>
                          <div className="text-gray-500">Bank Passbook</div>
                          {detail.kycDetails?.documents?.bankPassbook?.downloadUrl ? (
                          <img src={detail.kycDetails.documents.bankPassbook.downloadUrl} alt="PAN Document" className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" />
                        ) : (<span className="text-gray-400">Not uploaded</span>)}
                        </div>
                      </div>
                    </div>
                  </section>

                  
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t bg-gray-50 text-right">
              <button onClick={closeDetail} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
