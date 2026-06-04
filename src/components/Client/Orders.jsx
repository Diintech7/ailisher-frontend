import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, AlertTriangle, ShoppingCart, Filter, ArrowRight, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../config';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required. Please login.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/client/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching client orders:', err);
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  // Sorting logic
  const sortedOrders = useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        let av = a[sortConfig.key];
        let bv = b[sortConfig.key];

        // Custom path sorting if key is deep
        if (sortConfig.key === 'customerName') {
          av = a.customerName || '';
          bv = b.customerName || '';
        } else if (sortConfig.key === 'createdAt') {
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
        } else if (sortConfig.key === 'amount') {
          av = Number(a.amount) || 0;
          bv = Number(b.amount) || 0;
        }

        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  // Filtering logic
  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(order => {
      const name = (order.customerName || '').toLowerCase();
      const email = (order.customerEmail || '').toLowerCase();
      const phone = (order.customerPhone || '').toLowerCase();
      const orderId = (order.orderId || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        orderId.includes(search);

      const matchesStatus = !statusFilter || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedOrders, searchTerm, statusFilter]);

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={16} className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ?
      <ChevronUp size={16} className="text-green-600" /> :
      <ChevronDown size={16} className="text-green-600" />;
  };

  // Status styling classes
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Item purchased renderer
  const getPurchasedItem = (order) => {
    if (order.planId && order.planId.name) {
      return order.planId.name;
    }
    if (order.workbookIds && order.workbookIds.length > 0) {
      return order.workbookIds.map(w => w.name || 'Workbook').join(', ');
    }
    return 'Credit Recharge';
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalAmt = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    orders.forEach(o => {
      if (o.status === 'SUCCESS') {
        totalAmt += Number(o.amount) || 0;
        successCount++;
      } else if (o.status === 'PENDING') {
        pendingCount++;
      } else {
        failedCount++;
      }
    });

    return {
      totalRevenue: totalAmt.toFixed(2),
      successCount,
      pendingCount,
      failedCount,
      totalOrders: orders.length
    };
  }, [orders]);

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Orders Management</h1>
        <p className="text-slate-600">Track all transaction attempts, payment statuses, and user purchases.</p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Revenue (Success)</div>
          <div className="text-3xl font-bold text-slate-900">₹{metrics.totalRevenue}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">Successful Orders</div>
          <div className="text-3xl font-bold text-emerald-600">{metrics.successCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">Pending Attempts</div>
          <div className="text-3xl font-bold text-amber-600">{metrics.pendingCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">Failed/Cancelled</div>
          <div className="text-3xl font-bold text-rose-600">{metrics.failedCount}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-semibold text-red-800 text-lg mb-1">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <ShoppingCart size={64} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No orders found</h3>
          <p className="text-slate-600">There are no transactions in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Search & Filters */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, email, phone or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-all text-sm"
                />
              </div>

              {/* Status filter dropdown */}
              <div className="relative w-full lg:w-56">
                <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white appearance-none transition-all text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Reset button */}
              {(searchTerm || statusFilter) && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('customerName')}>
                    <div className="flex items-center gap-1">
                      Customer
                      {getSortIcon('customerName')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('amount')}>
                    <div className="flex items-center gap-1">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Purchased Item</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Date
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedOrders.map((order) => {
                  const targetUserId = order.userId?._id || order.userId;
                  const targetClientId = order.userId?.clientId || order.clientId || '';

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Customer name / avatar link */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {targetUserId && targetClientId ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/client/users/${targetUserId}?clientId=${encodeURIComponent(targetClientId)}`)}
                            className="group flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl p-1"
                          >
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                              {order.customerName?.charAt(0)?.toUpperCase() || <User size={16} />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                                {order.customerName}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                View profile <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
                              {order.customerName?.charAt(0)?.toUpperCase() || <User size={16} />}
                            </div>
                            <div className="text-sm font-semibold text-slate-900">{order.customerName}</div>
                          </div>
                        )}
                      </td>

                      {/* Contact details */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{order.customerEmail}</div>
                        <div className="text-xs text-slate-400">{order.customerPhone}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        ₹{Number(order.amount).toFixed(2)}
                      </td>

                      {/* Purchased Item details */}
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                        {getPurchasedItem(order)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Payment mode details */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{order.paymentMode || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{order.gatewayName || 'PAYTM'}</div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredOrders.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
