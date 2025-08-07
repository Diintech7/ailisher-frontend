import axios from "axios";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const CreditAccount = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [addCreditAmount, setAddCreditAmount] = useState('');
  const [addCreditLoading, setAddCreditLoading] = useState(false);
  const [addCreditError, setAddCreditError] = useState('');
  const [addCreditSuccess, setAddCreditSuccess] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchCreditAccount = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/credit-account",
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("admintoken")}`,
          },
        }
      );
      setAccounts(response.data.data || []);
    } catch (error) {
      setAccounts([]);
    }
    setLoading(false);
  };

  const fetchAccountDetails = async (accountId) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/credit-account/${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("admintoken")}`,
          },
        }
      );
      console.log(response.data.data);
      setAccountDetails(response.data.data);
    } catch (error) {
      console.error('Failed to fetch account details:', error);
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    fetchCreditAccount();
  }, []);

  // Filter and search function
  useEffect(() => {
    let filtered = accounts;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(account => 
        account.userId?.name?.toLowerCase().includes(searchLower) ||
        account.mobile?.toLowerCase().includes(searchLower) ||
        account.client?.businessName?.toLowerCase().includes(searchLower) ||
        account._id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(account => account.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.userId?.name || '';
          bValue = b.userId?.name || '';
          break;
        case 'client':
          aValue = a.client?.businessName || '';
          bValue = b.client?.businessName || '';
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'balance':
          aValue = a.balance || 0;
          bValue = b.balance || 0;
          break;
        default:
          aValue = a.userId?.name || '';
          bValue = b.userId?.name || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleRowClick = async (account) => {
    setSelectedAccount(account);
    setAddCreditAmount('');
    setAddCreditError('');
    setAddCreditSuccess('');
    setAdminMessage('');
    await fetchAccountDetails(account._id);
  };
  console.log("accountDetails",accountDetails);

  const handleAddCredit = async () => {
    if (!addCreditAmount || isNaN(addCreditAmount) || addCreditAmount <= 0) {
      setAddCreditError('Please enter a valid credit amount');
      setAddCreditSuccess('');
      return;
    }
    setAddCreditLoading(true);
    setAddCreditError('');
    setAddCreditSuccess('');
    try {
      await axios.post(
        "http://localhost:5000/api/admin/add-credit",
        {
          userId: selectedAccount.userId.userId,
          credits: Number(addCreditAmount),
          adminMessage: adminMessage
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("admintoken")}`,
          },
        }
      );
      setAddCreditSuccess('Credits added successfully!');
      setAddCreditAmount('');
      setAdminMessage('');
      setShowAddCreditModal(false);
      await fetchAccountDetails(selectedAccount._id);
      fetchCreditAccount();
    } catch (error) {
      setAddCreditError('Failed to add credits');
    }
    setAddCreditLoading(false);
  };

  return (
    <div className="w-full mx-auto p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center justify-between">
        Credit Accounts
      </h1>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
      ) : selectedAccount ? (
        <div className="w-full mx-auto bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <button
              className="text-blue-700 hover:underline flex items-center gap-1 font-medium"
              onClick={() => {
                setSelectedAccount(null);
                setAccountDetails(null);
              }}
            >
              &larr; Back to all accounts
            </button>
            
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold shadow"
              onClick={() => setShowAddCreditModal(true)}
            >
              Add Credit
            </button>
          </div>
          {loadingDetails ? (
            <div className="text-center py-8 text-gray-500">Loading account details...</div>
          ) : (
            <>
              {/* Header with Name and Date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{accountDetails.userId.name}</h3>
                  <p className="text-sm text-gray-600">Created: {new Date(accountDetails.createdAt).toLocaleDateString()} at {new Date(accountDetails.createdAt).toLocaleTimeString()}</p>
                </div>
                {/* <div className="flex items-center gap-4 mt-3 sm:mt-0"> */}
            {/* <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accountDetails.status === 'active'}
                        onChange={async (e) => {
                          try {
                            const newStatus = e.target.checked ? 'active' : 'suspended';
                            await axios.patch(
                              `http://localhost:5000/api/admin/credit-account/${accountDetails._id}/status`,
                              { status: newStatus },
                              {
                                headers: {
                                  Authorization: `Bearer ${Cookies.get("admintoken")}`,
                                },
                              }
                            );
                            // Update local state
                            setAccountDetails({...accountDetails, status: newStatus});
                            fetchCreditAccount(); // Refresh the main list
                          } catch (error) {
                            console.error('Failed to update status:', error);
                          }
                        }}
                        className="sr-only"
                      />
                      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        accountDetails.status === 'active' ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          accountDetails.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </span>
                    </label>
                    <span className={`text-sm font-medium ${
                      accountDetails.status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {accountDetails.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
            </div> */}
                  {/* Balance Display */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Balance</div>
                    <div className="text-4xl font-bold text-green-600">₹{accountDetails.balance}</div>
                  </div>
                </div>
              {/* </div> */}
              {/* Account Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Credit ID</div>
                  <div className="font-mono text-sm text-blue-800 bg-blue-50 rounded px-2 py-1 break-all">{accountDetails._id}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Mobile</div>
                  <div className="font-medium text-gray-800">{accountDetails.mobile}</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Client</div>
                  <div className="font-medium text-gray-800">{accountDetails.client?.businessName || 'N/A'}</div>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  Transaction History
                </h3>
                {accountDetails && accountDetails.transactions && accountDetails.transactions.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full bg-white text-xs sm:text-sm">
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
                        {accountDetails.transactions.map((transaction, index) => {
                          const isCredit = transaction.type === 'credit';
                          const isAdminCredit = transaction.category === 'admin_adjustment';
                          const isDebit = transaction.type === 'debit';
                          
                          let rowClass = '';
                          if (isAdminCredit) {
                            rowClass = 'bg-orange-50 hover:bg-orange-100';
                          } else if (isCredit) {
                            rowClass = 'bg-green-50 hover:bg-green-100';
                          } else if (isDebit) {
                            rowClass = 'bg-red-50 hover:bg-red-100';
                          } else {
                            rowClass = 'hover:bg-gray-50';
                          }

                          return (
                            <tr key={transaction._id} className={`border-b ${rowClass}`}>
                              <td className="py-2 px-3 text-gray-600">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                                <br />
                                <span className="text-xs text-gray-400">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  isAdminCredit 
                                    ? 'bg-orange-200 text-orange-800' 
                                    : isCredit 
                                      ? 'bg-green-200 text-green-800' 
                                      : 'bg-red-200 text-red-800'
                                }`}>
                                  {isAdminCredit ? 'Admin Credit' : transaction.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="text-gray-800">
                                  {transaction.description}
                                  {transaction.adminMessage && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      "{transaction.adminMessage}"
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className={`font-semibold ${
                                  isCredit ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {isCredit ? '+' : '-'}₹{transaction.amount}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-gray-600">
                                ₹{transaction.balanceAfter}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  transaction.status === 'completed' 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-yellow-200 text-yellow-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {transaction.addedBy ? transaction.addedBy.name : 'System'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No transactions found for this account.
                  </div>
                )}
              </div>
            </>
          )}
          {/* Add Credit Modal */}
          {showAddCreditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  onClick={() => setShowAddCreditModal(false)}
                >
                  &times;
                </button>
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  Add Credits
                </h3>
                <div className="flex flex-col gap-3 mb-2">
                  <input
                    type="number"
                    min="1"
                    className="border rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-200"
                    value={addCreditAmount}
                    onChange={(e) => setAddCreditAmount(e.target.value)}
                    placeholder="Amount"
                    disabled={addCreditLoading}
                  />
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-200"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Admin message (optional)"
                    disabled={addCreditLoading}
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold shadow mt-2"
                    onClick={handleAddCredit}
                    disabled={addCreditLoading}
                  >
                    {addCreditLoading ? 'Adding...' : 'Add Credit'}
                  </button>
                </div>
                {addCreditError && <div className="text-red-600 mb-2 text-sm">{addCreditError}</div>}
                {addCreditSuccess && <div className="text-green-600 mb-2 text-sm">{addCreditSuccess}</div>}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Table View
        <div className="overflow-x-auto rounded-lg shadow">
          {/* Search and Filter Section */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search Input */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, mobile, client, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex-shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex-shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="client">Sort by Client</option>
                    <option value="date">Sort by Date</option>
                    <option value="balance">Sort by Balance</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                    <svg className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 flex-shrink-0">
                {filteredAccounts.length} of {accounts.length} accounts
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc') && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('name');
                    setSortOrder('asc');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          <table className="min-w-full bg-white text-xs sm:text-sm md:text-base table-fixed">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Name</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Mobile</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap">Credit ID</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Client</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-right">Balance</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Status</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Date</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    No credit accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const userName = account.userId.name;
                  const dateObj = new Date(account.createdAt);
                  const date = dateObj.toLocaleDateString();
                  const time = dateObj.toLocaleTimeString();
                  return (
                    <tr
                      key={account._id}
                      className="border-b hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleRowClick(account)}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{userName}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{account.mobile}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap">{account._id}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">{account.client.businessName}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">{account.balance}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span
                          className={
                            account.status === "active"
                              ? "text-green-600 font-semibold"
                              : account.status === "suspended"
                              ? "text-yellow-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">{date}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">{time}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreditAccount;
