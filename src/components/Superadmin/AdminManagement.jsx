import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '../../config';
import {
  FaUserShield,
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEllipsisV,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp
} from "react-icons/fa";
import LoginForm from "../Auth/SuperAdminLoginForm";

const AdminManagement = ({ onAdminLogin }) => {
  const [admins, setAdmins] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedAdminName, setSelectedAdminName] = useState('');
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const getAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getadmins`
      );
      const data = await response.json();
      console.log(data);
      setAdmins(data.data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const deleteadmin = async(id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/deleteadmin/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete admin');
      }

      setShowDeleteAdminModal(false);
      setAdminToDelete(null);
      await getAdmins();
      alert('Admin deleted successfully');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert(error.message || 'Failed to delete admin. Please try again.');
    }
  };

  const confirmDeleteAdmin = (adminId) => {
    setAdminToDelete(adminId);
    setShowDeleteAdminModal(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      if (newAdmin.password !== newAdmin.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/superadmin/registeradmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin');
      }

      setShowAddAdminModal(false);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      await getAdmins();
      alert('Admin created successfully');
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.message || 'Failed to create admin. Please try again.');
    }
  };

  // Handle admin login
  const handleAdminLogin = (loginData) => {
    // Close the modal
    setShowLoginModal(false);
    
    // Call the parent's login handler
    onAdminLogin(loginData);
  };

  // Open login modal for a specific admin
  const openAdminLogin = (adminId, adminEmail, adminName) => {
    setSelectedAdminId(adminId);
    setSelectedAdminName(adminName);
    setShowLoginModal(true);
    
    // Store the admin email in sessionStorage for the login form to use
    if (adminEmail) {
      sessionStorage.setItem('tempadminEmail', adminEmail);
    }
  };

  const handleDropdownClick = (itemId, action, itemData) => {
    setShowDropdownMenu(null);
    if (action === 'edit') {
      // Handle edit action
      console.log('Edit item:', itemId, itemData);
    } else if (action === 'delete') {
      confirmDeleteAdmin(itemId);
    } else if (action === 'view') {
      // Handle view action
      console.log('View item:', itemId, itemData);
    }
  };

  // Filter admins based on search term
  const filteredAdmins = admins ? 
    admins.filter(admin => 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    getAdmins();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdownMenu && !event.target.closest('.dropdown-menu')) {
        setShowDropdownMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownMenu]);

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaUserPlus className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Add New Admin</h2>
                    <p className="text-purple-100 text-sm">Create a new admin account</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-purple-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowAddAdminModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddAdmin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter admin's full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter admin's email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm the password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={newAdmin.confirmPassword}
                    onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaUserShield className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Admin Login</h2>
                    <p className="text-purple-100 text-sm">Access admin account</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-purple-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowLoginModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedAdminName && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaUserShield className="text-purple-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">Logging in as:</p>
                      <p className="text-purple-600 font-medium">{selectedAdminName}</p>
                    </div>
                  </div>
                </div>
              )}
              <LoginForm userType="admin" onLogin={handleAdminLogin} switchToRegister={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {showDeleteAdminModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FaExclamationTriangle className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirm Delete</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <FaTrash className="text-red-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Warning</p>
                    <p className="text-red-600 text-sm">Are you sure you want to delete this admin? This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteAdminModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteadmin(adminToDelete)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b border-purple-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Admin Management</h3>
              <p className="text-gray-600">Manage and monitor admin users</p>
            </div>
            <button 
              className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              onClick={() => setShowAddAdminModal(true)}
            >
              <FaUserPlus className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-semibold">Add Admin</span>
            </button>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search admins by name or email..."
              className="pl-12 w-full pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <FaSearch className="text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading admins...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait while we fetch the data</p>
            </div>
          ) : !admins || admins.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaUserShield className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No admins found</p>
              <p className="text-gray-400 text-sm mt-1">Get started by adding your first admin</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredAdmins.map((admin, index) => (
                  <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{admin.name}</h4>
                          <p className="text-gray-600">{admin.email}</p>
                          <p className="text-sm text-gray-500">Admin since {formatDate(admin.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Active
                        </span>
                        
                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdownMenu(showDropdownMenu === admin._id ? null : admin._id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <FaEllipsisV />
                          </button>
                          
                          {showDropdownMenu === admin._id && (
                            <div className="dropdown-menu absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => handleDropdownClick(admin._id, 'view', {type: 'admin', data: admin})}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaEye className="text-blue-500" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => openAdminLogin(admin._id, admin.email, admin.name)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaUserShield className="text-purple-500" />
                                <span>Login as Admin</span>
                              </button>
                              <button
                                onClick={() => handleDropdownClick(admin._id, 'edit', {type: 'admin', data: admin})}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaEdit className="text-green-500" />
                                <span>Edit Admin</span>
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleDropdownClick(admin._id, 'delete', {type: 'admin', data: admin})}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <FaTrash className="text-red-500" />
                                <span>Delete Admin</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminManagement;

