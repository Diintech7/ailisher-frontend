import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function Withdrawals() {
  const [activeTab, setActiveTab] = useState('pending'); // pending | approved | rejected | processed
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    paymentMethod: 'upi',
    paymentReference: '',
    adminNotes: ''
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState('');
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);

  const adminToken = Cookies.get('admintoken');
  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  }), [adminToken]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit), status: activeTab });
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals?${qs.toString()}`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch withdrawals');
      setItems(Array.isArray(json.data) ? json.data : []);
      setTotalPages(Number(json.totalPages || 1));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [activeTab, page]);

  async function postAction(path, body) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.message || 'Action failed');
      await fetchData();
      setShowDetails(false);
      setSelectedWithdrawal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const approve = (id) => postAction(`/api/admin/withdrawals/${id}/approve`, {});
  const reject = async (id) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;
    await postAction(`/api/admin/withdrawals/${id}/reject`, { rejectionReason: reason });
  };

  const showWithdrawalDetails = async (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetails(true);
    setQrCode(null);
    setShowManualPayment(false);
    setShowManualModal(false);
    setManualPaymentData({ paymentMethod: 'upi', paymentReference: '', adminNotes: '' });
    setScreenshotFile(null);
    setScreenshotUploaded(false);
    if (screenshotPreviewUrl) URL.revokeObjectURL(screenshotPreviewUrl);
    setScreenshotPreviewUrl('');
    setScreenshotUploading(false);
  };

  const generateQRCode = async (withdrawalId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/qr-code`, { headers });
      const json = await res.json();
      if (json.success) {
        setQrCode(json.data.qrCode);
      } else {
        setError(json.message || 'Failed to generate QR code');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const processManualPayment = async (withdrawalId) => {
    if (!manualPaymentData.paymentReference.trim()) {
      setError('Payment reference is required');
      return;
    }
    // If screenshot not uploaded yet but a file is selected, upload it now
    if (!screenshotUploaded) {
      if (!screenshotFile) {
        setError('Payment screenshot is required');
        return;
      }
      const uploadedNow = await uploadPaymentScreenshot(withdrawalId);
      if (!uploadedNow) return; // uploadPaymentScreenshot already set error
    }
    await postAction(`/api/admin/withdrawals/${withdrawalId}/manual-process`, manualPaymentData);
  };

  async function uploadPaymentScreenshot(withdrawalId) {
    try {<div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => { setScreenshotFile(e.target.files?.[0] || null); setScreenshotUploaded(false); }}
                        className="block w-full text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => uploadPaymentScreenshot(selectedWithdrawal._id)}
                        disabled={!screenshotFile || screenshotUploading}
                        className={`px-3 py-2 rounded text-white ${(!screenshotFile || screenshotUploading) ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {screenshotUploading ? 'Uploading...' : (screenshotUploaded ? 'Re-upload' : 'Upload')}
                      </button>
                    </div>
      if (!screenshotFile) {
        setError('Please select a screenshot file first');
        return false;
      }
      setScreenshotUploading(true);
      setError('');
      // 1) Ask backend for presigned upload URL
      const fileName = encodeURIComponent(screenshotFile.name);
      const contentType = screenshotFile.type || 'image/png';
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/upload-screenshot`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileName, contentType })
      });
      const json = await res.json();
      if (!json.success || !json.data?.downloadUrl) {
        throw new Error(json.message || 'Failed to get upload URL');
      }
      const uploadUrl = json.data.downloadUrl;
      // 2) PUT the file to cloud storage
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: screenshotFile
      });
      setScreenshotUploaded(true);
      return true;
    } catch (e) {
      setError(e.message);
      setScreenshotUploaded(false);
      return false;
    } finally {
      setScreenshotUploading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAccountDetails = (accountDetails) => {
    if (!accountDetails) return 'N/A';
    
    const details = [];
    if (accountDetails.upiId) details.push(`UPI: ${accountDetails.upiId}`);
    if (accountDetails.accountNumber) details.push(`A/C: ${accountDetails.accountNumber}`);
    if (accountDetails.ifscCode) details.push(`IFSC: ${accountDetails.ifscCode}`);
    if (accountDetails.bankName) details.push(`Bank: ${accountDetails.bankName}`);
    if (accountDetails.accountHolderName) details.push(`Name: ${accountDetails.accountHolderName}`);
    
    return details.join(' | ');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'pending', label: 'Pending Requests' },
            { key: 'approved', label: 'Approved Requests' },
            { key: 'processed', label: 'Completed Requests' },
            { key: 'rejected', label: 'Rejected Requests' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
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

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={7}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-6 py-4" colSpan={7}>No records</td></tr>
            ) : (
              items.map((w) => (
                <tr key={w._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{w.evaluatorId?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{w.evaluatorId?.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{w.evaluatorId?.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₹ {Number(w.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{w.withdrawalMethod || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate" title={formatAccountDetails(w.accountDetails)}>
                      {formatAccountDetails(w.accountDetails)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {w.createdAt ? new Date(w.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 flex-wrap">
                      {activeTab !== 'approved' && (
                      <button 
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        onClick={() => showWithdrawalDetails(w)}
                      >
                        View Details
                      </button>
                      )}
                      {activeTab === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 text-xs" onClick={() => approve(w._id)}>Approve</button>
                          <button className="text-red-600 hover:text-red-900 text-xs" onClick={() => reject(w._id)}>Reject</button>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <button className="text-purple-600 hover:text-purple-900 text-xs" onClick={() => showWithdrawalDetails(w)}>
                          Process Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >Prev</button>
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >Next</button>
      </div>

      {/* Withdrawal Details Modal */}
      {showDetails && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Withdrawal Details</h3>
                <button
                  onClick={() => !showManualPayment && setShowDetails(false)}
                  disabled={showManualPayment}
                  title={showManualPayment ? 'Complete manual payment to close' : ''}
                  className={`text-gray-400 ${showManualPayment ? 'opacity-40 cursor-not-allowed' : 'hover:text-gray-600'}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Evaluator Info */}
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Evaluator Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedWithdrawal.evaluatorId?.name || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {selectedWithdrawal.evaluatorId?.email || 'N/A'}</div>
                    <div><span className="font-medium">Phone:</span> {selectedWithdrawal.evaluatorId?.phoneNumber || 'N/A'}</div>
                    <div><span className="font-medium">Balance:</span> ₹{selectedWithdrawal.evaluatorId?.creditBalance || 0}</div>
                  </div>
                </div>

                {/* Withdrawal Info */}
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Withdrawal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Amount:</span> ₹{selectedWithdrawal.amount}</div>
                    <div><span className="font-medium">Method:</span> {selectedWithdrawal.withdrawalMethod}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedWithdrawal.status)}`}>
                        {selectedWithdrawal.status}
                      </span>
                    </div>
                    <div><span className="font-medium">Requested:</span> {new Date(selectedWithdrawal.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-green-50 p-4 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
                  <div className="text-sm space-y-1">
                    {selectedWithdrawal.accountDetails?.upiId && (
                      <div><span className="font-medium">UPI ID:</span> {selectedWithdrawal.accountDetails.upiId}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.accountHolderName && (
                      <div><span className="font-medium">Account Holder:</span> {selectedWithdrawal.accountDetails.accountHolderName}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.accountNumber && (
                      <div><span className="font-medium">Account Number:</span> {selectedWithdrawal.accountDetails.accountNumber}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.ifscCode && (
                      <div><span className="font-medium">IFSC Code:</span> {selectedWithdrawal.accountDetails.ifscCode}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.bankName && (
                      <div><span className="font-medium">Bank:</span> {selectedWithdrawal.accountDetails.bankName}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.branchName && (
                      <div><span className="font-medium">Branch:</span> {selectedWithdrawal.accountDetails.branchName}</div>
                    )}
                    {selectedWithdrawal.accountDetails?.accountType && (
                      <div><span className="font-medium">Account Type:</span> {selectedWithdrawal.accountDetails.accountType}</div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                {selectedWithdrawal.status === 'approved' && (
                  <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">Payment QR Code</h4>
                    <div className="flex flex-col items-center space-y-4">
                      {qrCode ? (
                        <div className="text-center">
                          <img src={qrCode} alt="Payment QR Code" className="mx-auto border rounded" />
                          <p className="text-sm text-gray-600 mt-2">Scan this QR code to make payment</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateQRCode(selectedWithdrawal._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                    </div>

                <div className="flex justify-end space-x-2 pb-4 border-t mt-2">
                <button
                  onClick={() => { setShowManualPayment(false); setShowManualModal(true); setShowDetails(false); }}
                   className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                 >
                   Next
                 </button>
               </div>
               </div>
                )}
                 

               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Modal (Step 2) */}
      {showManualModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Record Manual Payment</h3>
                <button
                  onClick={() => {
                    if (!manualPaymentData.paymentReference.trim() || !screenshotUploaded) {
                      const confirmExit = window.confirm('You have not provided reference and screenshot. Are you sure you want to cancel?');
                      if (!confirmExit) return;
                    }
                    setShowManualModal(false);
                    setSelectedWithdrawal(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <div className="flex justify-between">
                    <div>
                      <div><span className="font-medium">Evaluator:</span> {selectedWithdrawal.evaluatorId?.name}</div>
                      <div><span className="font-medium">Amount:</span> ₹{selectedWithdrawal.amount}</div>
                    </div>
                    <div className="text-right">
                      <div><span className="font-medium">Method:</span> {selectedWithdrawal.withdrawalMethod}</div>
                      <div><span className="font-medium">UPI:</span> {selectedWithdrawal.accountDetails?.upiId || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      value={manualPaymentData.paymentMethod}
                      onChange={(e) => setManualPaymentData({...manualPaymentData, paymentMethod: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Reference/Transaction ID</label>
                    <input
                      type="text"
                      value={manualPaymentData.paymentReference}
                      onChange={(e) => setManualPaymentData({...manualPaymentData, paymentReference: e.target.value})}
                      placeholder="Enter transaction ID or reference"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Screenshot</label>
                    <div className="flex items-start gap-2 mt-1">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setScreenshotFile(f);
                            setScreenshotUploaded(false);
                            if (screenshotPreviewUrl) URL.revokeObjectURL(screenshotPreviewUrl);
                            setScreenshotPreviewUrl(f ? URL.createObjectURL(f) : '');
                          }}
                          className="block w-full text-sm"
                        />
                        {screenshotPreviewUrl && (
                          <div className="mt-2">
                            <img src={screenshotPreviewUrl} alt="Screenshot preview" className="max-h-40 rounded border" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => uploadPaymentScreenshot(selectedWithdrawal._id)}
                        disabled={!screenshotFile || screenshotUploading}
                        className={`px-3 py-2 rounded text-white ${(!screenshotFile || screenshotUploading) ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {screenshotUploading ? 'Uploading...' : (screenshotUploaded ? 'Re-upload' : 'Upload')}
                      </button>
                    </div>
                    {screenshotUploaded && <div className="text-xs text-green-700 mt-1">Screenshot uploaded</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
                    <textarea
                      value={manualPaymentData.adminNotes}
                      onChange={(e) => setManualPaymentData({...manualPaymentData, adminNotes: e.target.value})}
                      placeholder="Add any notes about the payment"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => processManualPayment(selectedWithdrawal._id)}
                    disabled={!manualPaymentData.paymentReference.trim() || (!screenshotUploaded && !screenshotFile)}
                    className={`px-4 py-2 rounded text-white ${(!manualPaymentData.paymentReference.trim() || (!screenshotUploaded && !screenshotFile)) ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Mark as Paid
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}