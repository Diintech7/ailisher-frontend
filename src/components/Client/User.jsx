import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, AlertTriangle, User as UserIcon, Filter } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function User() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [activeWithinDays, setActiveWithinDays] = useState(10);
  const [onlyActive, setOnlyActive] = useState(false);
  const itemsPerPage = 50;

  // Helpers to extract derived fields safely
  const getCity = (u) => u?.city || u?.address?.city || u?.userId?.city || '';
  const getLastLoginDate = (u) => u?.lastLoginAt || u?.lastLogin || u?.userId?.lastLoginAt || u?.userId?.lastLogin || null;
  const formatCity = (city) => {
    if (!city) return '-';
    const trimmed = String(city).trim();
    if (!trimmed) return '-';
    const [firstWord, ...rest] = trimmed.split(/\s+/);
    return rest.length > 0 ? `${firstWord}...` : firstWord;
  };
  const parseDate = (d) => (d ? new Date(d) : null);
  const isActiveWithin = (u, days) => {
    const ll = parseDate(getLastLoginDate(u));
    if (!ll) return false;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return ll >= cutoff;
  };

  // Unique cities for filter
  const cityOptions = React.useMemo(() => {
    const set = new Set(users.map(getCity).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('https://test.ailisher.com/api/client/userprofile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof SyntaxError) {
        setError('Invalid response from server. Please try again later.');
      } else {
        setError(error.message || 'Failed to connect to the server');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sort users
  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        let av;
        let bv;
        if (sortConfig.key === 'userId.mobile') {
          av = a?.userId?.mobile || '';
          bv = b?.userId?.mobile || '';
          return sortConfig.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (sortConfig.key === 'city') {
          av = getCity(a) || '';
          bv = getCity(b) || '';
          return sortConfig.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (sortConfig.key === 'lastLoginAt') {
          av = parseDate(getLastLoginDate(a))?.getTime() || 0;
          bv = parseDate(getLastLoginDate(b))?.getTime() || 0;
          return sortConfig.direction === 'asc' ? av - bv : bv - av;
        }
        av = a[sortConfig.key];
        bv = b[sortConfig.key];
        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // Filter users based on search term and client ID
  const filteredUsers = React.useMemo(() => {
    return sortedUsers.filter(user => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId?.mobile?.includes(searchTerm) ||
        user.exams?.some(exam => exam.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCity = !selectedCity || getCity(user) === selectedCity;
      const matchesActive = !onlyActive || isActiveWithin(user, activeWithinDays);

      return matchesSearch && matchesCity && matchesActive;
    });
  }, [sortedUsers, searchTerm, selectedCity, onlyActive, activeWithinDays]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setOnlyActive(false);
    setActiveWithinDays(10);
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity, onlyActive, activeWithinDays]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={16} className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={16} className="text-indigo-600" /> : 
      <ChevronDown size={16} className="text-indigo-600" />;
  };

  // Overview metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => isActiveWithin(u, activeWithinDays)).length;
  const verifiedUsers = users.filter(u => u?.userId?.isVerified).length;
  const totalCities = cityOptions.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Profiles</h1>
        <p className="text-gray-600">Manage and analyze your users</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-semibold text-gray-900">{totalUsers}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Active (last {activeWithinDays} days)</div>
          <div className="text-2xl font-semibold text-gray-900">{activeUsers}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Verified</div>
          <div className="text-2xl font-semibold text-gray-900">{verifiedUsers}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500">Cities</div>
          <div className="text-2xl font-semibold text-gray-900">{totalCities}</div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <UserIcon size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No users found</h3>
          <p className="text-gray-600">There are no user profiles in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, mobile or exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* City Filter */}
              <div className="relative w-full xl:w-72">
                <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                >
                  <option value="">All Cities</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{formatCity(city)}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Active within N days */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  {/* <input type="checkbox" className="rounded" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> */}
                  <span className="text-sm text-gray-700">Active within</span>
                </label>
                <select
                  value={activeWithinDays}
                  onChange={(e) => setActiveWithinDays(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {[7, 10, 14, 30, 60, 90].map(d => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters Button */}
              {(searchTerm || selectedCity || onlyActive) && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('userId.mobile')}
                  >
                    <div className="flex items-center gap-2">
                      Mobile
                      {getSortIcon('userId.mobile')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('city')}
                  >
                    <div className="flex items-center gap-2">
                      City
                      {getSortIcon('city')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exams
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('lastLoginAt')}
                  >
                    <div className="flex items-center gap-2">
                      Last Login
                      {getSortIcon('lastLoginAt')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Joined Date
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const targetUserId = user.userId?._id || user.userId || user._id;
                          if (!targetUserId || !user.clientId) return;
                          navigate(`/client/users/${targetUserId}?clientId=${encodeURIComponent(user.clientId)}`);
                        }}
                        className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1"
                      >
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                          {user.name?.charAt(0)?.toUpperCase() || '-'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-indigo-600">View profile →</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.userId?.mobile}</div>
                      
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCity(getCity(user))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.exams?.map((exam, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                          >
                            {exam}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const ll = parseDate(getLastLoginDate(user));
                        if (!ll) return '-';
                        return (
                          <div>
                            <div>{ll.toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{ll.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const joined = new Date(user.createdAt);
                        return (
                          <div>
                            <div>{joined.toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{joined.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredUsers.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
