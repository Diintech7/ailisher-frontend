import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";

const CreditAccount = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const navigate = useNavigate();

  const fetchCreditAccount = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://aipbbackend-c5ed.onrender.com/api/admin/credit-account",
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

  useEffect(()=>{
    fetchCreditAccount()
  },[])
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
    // Navigate to detail page
    navigate(`/admin/credit-account/${account._id}`);
  };
 

  return (
    <div className="w-full mx-auto p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center justify-between">
        Credit Accounts
      </h1>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
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
                  const userName = account.userId?.name || "No Name";
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
