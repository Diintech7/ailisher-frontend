import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '../../config';
import {
  FaGlobe,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEllipsisV,
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaShieldAlt,
  FaPlay,
  FaPause,
  FaCheckCircle
} from "react-icons/fa";
import axios from "axios";

const OrgManagement = ({ onOrgLogin }) => {
  const [organizations, setOrganizations] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [orgToEdit, setOrgToEdit] = useState(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(null);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    authEmail: '',
    authPassword: ''
  });
  const [editOrganization, setEditOrganization] = useState({
    name: '',
    authEmail: '',
    status: 'active'
  });
  const token = localStorage.getItem('superadmintoken');

  const getOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/organizations`
        ,{
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log(data);
      if (data.success) {
        setOrganizations(data.data);
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleOrgLogin = async (id) => {
    try {
      console.log("called")
      // Open tab synchronously to avoid popup blockers
      const newTab = window.open("about:blank", "_blank");

      const response = await axios.post(
        `${API_BASE_URL}/api/superadmin/organization/${id}/login-token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response.data);

      if (response.data?.success) {
        const orgtoken = response.data.token;
        const organization = {
          id: response.data.organization?.id || response.data.organization?._id,
          name: response.data.organization?.name,
          email: response.data.organization?.email
        };

        const dashboardUrl = `${window.location.origin}/organization/dashboard`;

        if (newTab) {
          newTab.document.open();
          newTab.document.write(`
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to client dashboard...</title>
  </head>
  <body>
    <p>Redirecting to client dashboard...</p>
    <script>
      document.cookie = "orgtoken=${orgtoken}; path=/; max-age=18000";
      document.cookie = "organization=${encodeURIComponent(JSON.stringify(organization))}; path=/; max-age=18000";
      window.location.replace(${JSON.stringify(dashboardUrl)});
    <\/script>
  </body>
</html>
          `);
          newTab.document.close();
        } else {
          // Fallback if popup blocked
          document.cookie = `orgtoken=${orgtoken}; path=/; max-age=18000`;
          document.cookie = `organization=${encodeURIComponent(JSON.stringify(organization))}; path=/; max-age=18000`;
          window.location.replace(dashboardUrl);
        }
      }
    } catch (err) {
      console.error("Error logging in as organization:", err);
    }
  };

  // Create organization
  const createOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newOrganization)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create organization');
      }

      setShowAddOrgModal(false);
      setNewOrganization({
        name: '',
        authEmail: '',
        authPassword: ''
      });
      await getOrganizations();
      alert('Organization created successfully');
    } catch (error) {
      console.error('Error creating organization:', error);
      alert(error.message || 'Failed to create organization. Please try again.');
    }
  };

  // Update organization
  const updateOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/organizations/${orgToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editOrganization)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update organization');
      }

      setShowEditOrgModal(false);
      setOrgToEdit(null);
      setEditOrganization({
        name: '',
        authEmail: '',
        status: 'active'
      });
      await getOrganizations();
      alert('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      alert(error.message || 'Failed to update organization. Please try again.');
    }
  };

  // Suspend organization
  const suspendOrganization = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/organizations/${id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to suspend organization');
      }

      await getOrganizations();
      alert('Organization suspended successfully');
    } catch (error) {
      console.error('Error suspending organization:', error);
      alert(error.message || 'Failed to suspend organization. Please try again.');
    }
  };

  // Restore organization
  const restoreOrganization = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/organizations/${id}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to restore organization');
      }

      await getOrganizations();
      alert('Organization restored successfully');
    } catch (error) {
      console.error('Error restoring organization:', error);
      alert(error.message || 'Failed to restore organization. Please try again.');
    }
  };

  // Delete organization (soft delete)
  const deleteOrganization = async(id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/organizations/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete organization');
      }

      setShowDeleteOrgModal(false);
      setOrgToDelete(null);
      await getOrganizations();
      alert('Organization deleted successfully');
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert(error.message || 'Failed to delete organization. Please try again.');
    }
  };

  const confirmDeleteOrganization = (orgId) => {
    setOrgToDelete(orgId);
    setShowDeleteOrgModal(true);
  };

  const openEditModal = (org) => {
    setOrgToEdit(org);
    setEditOrganization({
      name: org.name,
      authEmail: org.authEmail,
      status: org.status
    });
    setShowEditOrgModal(true);
  };

  const handleDropdownClick = (itemId, action, itemData) => {
    setShowDropdownMenu(null);
    if (action === 'edit') {
      openEditModal(itemData);
    } else if (action === 'delete') {
      confirmDeleteOrganization(itemId);
    } else if (action === 'suspend') {
      suspendOrganization(itemId);
    } else if (action === 'restore') {
      restoreOrganization(itemId);
    } else if (action === 'view') {
      // Handle view action
      console.log('View item:', itemId, itemData);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations ? 
    organizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.authEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    getOrganizations();
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

      {/* Add Organization Modal */}
      {showAddOrgModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaPlus className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Add New Organization</h2>
                    <p className="text-orange-100 text-sm">Create a new organization account</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-orange-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowAddOrgModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={createOrganization} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter organization name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={newOrganization.name}
                    onChange={(e) => setNewOrganization({...newOrganization, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Auth Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter organization email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={newOrganization.authEmail}
                    onChange={(e) => setNewOrganization({...newOrganization, authEmail: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Auth Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={newOrganization.authPassword}
                    onChange={(e) => setNewOrganization({...newOrganization, authPassword: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddOrgModal(false)}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrgModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaEdit className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Edit Organization</h2>
                    <p className="text-orange-100 text-sm">Update organization details</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-orange-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowEditOrgModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={updateOrganization} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter organization name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={editOrganization.name}
                    onChange={(e) => setEditOrganization({...editOrganization, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Auth Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter organization email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={editOrganization.authEmail}
                    onChange={(e) => setEditOrganization({...editOrganization, authEmail: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={editOrganization.status}
                    onChange={(e) => setEditOrganization({...editOrganization, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditOrgModal(false)}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Update Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Organization Confirmation Modal */}
      {showDeleteOrgModal && (
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
                    <p className="text-red-600 text-sm">Are you sure you want to delete this organization? This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteOrgModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrganization(orgToDelete)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organization Management Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Organization Management</h3>
              <p className="text-gray-600">Manage and monitor organization accounts</p>
            </div>
            <button 
              className="group bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              onClick={() => setShowAddOrgModal(true)}
            >
              <FaPlus className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-semibold">Add Organization</span>
            </button>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search organizations by name or email..."
              className="pl-12 w-full pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading organizations...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait while we fetch the data</p>
            </div>
          ) : !organizations || organizations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaGlobe className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No organizations found</p>
              <p className="text-gray-400 text-sm mt-1">Get started by adding your first organization</p>
            </div>
          ) : (
            <div className="p-6 h-screen">
              <div className="space-y-4">
                {filteredOrganizations.map((org, index) => (
                  <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{org.name}</h4>
                          <p className="text-gray-600">{org.authEmail || org.email}</p>
                          <p className="text-sm text-gray-500">Organization since {formatDate(org.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${
                          org.status === 'active' ? 'bg-green-100 text-green-800' : 
                          org.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            org.status === 'active' ? 'bg-green-500' : 
                            org.status === 'suspended' ? 'bg-yellow-500' : 
                            'bg-gray-500'
                          }`}></div>
                          {org.status === 'active' ? 'Active' : 
                           org.status === 'suspended' ? 'Suspended' : 
                           'Unknown'}
                        </span>
                        
                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdownMenu(showDropdownMenu === org._id ? null : org._id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <FaEllipsisV />
                          </button>
                          
                          {showDropdownMenu === org._id && (
                            <div className="dropdown-menu absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => handleOrgLogin(org._id)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaGlobe className="text-orange-500" />
                                <span>Login as Organization</span>
                              </button>
                              <button
                                onClick={() => handleDropdownClick(org._id, 'edit', org)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaEdit className="text-green-500" />
                                <span>Edit Organization</span>
                              </button>
                              {/* {org.status === 'active' ? (
                                <button
                                  onClick={() => handleDropdownClick(org._id, 'suspend', org)}
                                  className="w-full px-4 py-2 text-left text-yellow-600 hover:bg-yellow-50 flex items-center space-x-2"
                                >
                                  <FaPause className="text-yellow-500" />
                                  <span>Suspend Organization</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDropdownClick(org._id, 'restore', org)}
                                  className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                >
                                  <FaPlay className="text-green-500" />
                                  <span>Restore Organization</span>
                                </button>
                              )}
                              <hr className="my-1" /> */}
                              <button
                                onClick={() => handleDropdownClick(org._id, 'delete', org)}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <FaTrash className="text-red-500" />
                                <span>Delete Organization</span>
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

export default OrgManagement;
