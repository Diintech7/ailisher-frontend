import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function CreditAccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [accountDetails, setAccountDetails] = useState(null);
  const [rechargePlans, setRechargePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [addCreditAmount, setAddCreditAmount] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [addCreditLoading, setAddCreditLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ show: false, success: false, message: '' });

  const fetchAccountDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`https://aipbbackend-yxnh.onrender.com/api/admin/credit-account/${accountId}`,
        { headers: { Authorization: `Bearer ${Cookies.get('admintoken')}` } }
      );
      setAccountDetails(response.data.data);
    } catch (error) {
      console.error('Failed to fetch account details:', error);
    }
    setLoadingDetails(false);
  };

  const fetchRechargePlans = async () => {
    try {
      const response = await axios.get('https://aipbbackend-yxnh.onrender.com/api/admin/get-recharge-plan',
        { headers: { Authorization: `Bearer ${Cookies.get('admintoken')}` } }
      );
      setRechargePlans(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recharge plans', error);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
    fetchRechargePlans();
  }, [accountId]);

  const initiatePayment = async () => {
    if (!selectedPlan) { alert('Select a plan'); return; }
    try {
    const token  = Cookies.get('admintoken')
    const adminUser = Cookies.get('adminUser')
    let adminId = null;
    
    if (adminUser) {
      try {
        const adminData = JSON.parse(adminUser);
        adminId = adminData._id;
      } catch (e) {
        console.error('Error parsing admin user data:', e);
      }
    }
    console.log(adminId);
    console.log(adminUser);
    
      const response = await fetch('https://aipbbackend-yxnh.onrender.com/api/admin/paytm/initiate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: selectedPlan.offerPrice,
          customerEmail: 'customername@gmail.com',
          customerPhone: accountDetails?.mobile,
          customerName: accountDetails?.userId?.name,
          projectId: 'AILISHER',
          userId: accountDetails?.userId?.userId,
          planId: selectedPlan?._id,
          credits: selectedPlan?.credits,
          adminId: adminId,
          adminMessage: adminMessage || null
        })
      });
      const data = await response.json();
      if (data.success && data.paytmParams) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paytmUrl;
        Object.keys(data.paytmParams).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.paytmParams[key];
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        alert('Payment initiation failed');
      }
    } catch (e) {
      alert('Payment initiation failed');
    }
  };

  

  if (loadingDetails || !accountDetails) {
    return (
      <div className="p-4">
        <button className="text-blue-700" onClick={() => navigate('/admin/credit-account')}>&larr; Back</button>
        <div className="mt-4 text-gray-600">Loading account details...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <button className="text-blue-700 hover:underline" onClick={() => navigate('/admin/credit-account')}>&larr; Back to accounts</button>
        <div className="text-right">
          <div className="text-sm text-gray-600">Balance</div>
          <div className="text-3xl md:text-4xl font-bold text-green-600">₹{accountDetails.balance}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-xs text-gray-500 mb-1">Name</div>
          <div className="font-medium">{accountDetails.userId?.name}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-xs text-gray-500 mb-1">Mobile</div>
          <div className="font-medium">{accountDetails.mobile}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-xs text-gray-500 mb-1">Credit ID</div>
          <div className="font-mono text-sm">{accountId}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction history */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Transaction History</h3>
          {accountDetails.transactions?.length ? (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-2 px-3 text-left">Date</th>
                    <th className="py-2 px-3 text-left">Type</th>
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {accountDetails.transactions.map(tx => {
                    const isCredit = tx.type === 'credit';
                    const isAdminCredit = tx.category === 'admin_adjustment';
                    const isDebit = tx.type === 'debit';
                    let rowClass = '';
                    if (isAdminCredit) rowClass = 'bg-orange-50';
                    else if (isCredit) rowClass = 'bg-green-50';
                    else if (isDebit) rowClass = 'bg-red-50';
                    return (
                      <tr key={tx._id} className={`border-b hover:bg-gray-50 ${rowClass}`}>
                        <td className="py-2 px-3 text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString()}<br/>
                          <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold">
                            {isAdminCredit ? 'Admin Credit' : tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3">{tx.description}</td>
                        <td className={`py-2 px-3 text-right ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{tx.amount}
                        </td>
                        <td className="py-2 px-3 text-right">₹{tx.balanceAfter}</td>
                        <td className="py-2 px-3">{tx.status}</td>
                        <td className="py-2 px-3">{tx.addedBy ? tx.addedBy.name : 'System'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 bg-gray-50 rounded p-4">No transactions found.</div>
          )}
        </div>

        {/* Right: Plans + Payment */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-3">Recharge Credits</h3>
          {rechargePlans.length ? (
            <div className="flex flex-col gap-2 mb-4">
              {rechargePlans.map(plan => (
                <label key={plan._id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${selectedPlan?._id === plan._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div>
                    <div className="font-semibold">{plan.credits} Credits</div>
                    <div>
                      <span className="text-green-600 font-bold">₹ {plan.offerPrice}</span>
                      <span className="text-gray-400 line-through ml-2">₹ {plan.MRP}</span>
                    </div>
                  </div>
                  <input type="radio" name="plan" checked={selectedPlan?._id === plan._id} onChange={() => { setSelectedPlan(plan); setAddCreditAmount(plan.credits); }} />
                </label>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 mb-4">No active plans.</div>
          )}

          <div className="border rounded p-3">
            <div className="text-sm text-gray-600 mb-2">Custom credits</div>
            <input
              type="number"
              min="1"
              className="border rounded px-2 py-1 w-full mb-2"
              value={addCreditAmount}
              onChange={(e) => { setAddCreditAmount(e.target.value); setSelectedPlan(null); }}
              placeholder="Enter credits"
            />
            <input
              type="text"
              className="border rounded px-2 py-1 w-full mb-2"
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Admin message (optional)"
            />
            <div className="mb-2">
              <span className="font-semibold">Total amount: </span>
              <span>₹{selectedPlan ? selectedPlan.offerPrice : (addCreditAmount ? addCreditAmount : 0)}</span>
            </div>
            <button onClick={initiatePayment} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Pay Amount</button>
          </div>
        </div>
      </div>

      {paymentModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setPaymentModal({ ...paymentModal, show: false })}>
              &times;
            </button>
            <div className="text-center">
              {paymentModal.success ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-4">{paymentModal.message}</p>
                  <p className="text-sm text-gray-500">Credits have been added to the account.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Failed</h3>
                  <p className="text-gray-600 mb-4">{paymentModal.message}</p>
                  <p className="text-sm text-gray-500">Please try again or contact support.</p>
                </>
              )}
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold" onClick={() => setPaymentModal({ ...paymentModal, show: false })}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
