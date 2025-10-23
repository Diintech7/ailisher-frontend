import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '../../config';
import {
  FaBuilding,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEllipsisV,
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaShieldAlt
} from "react-icons/fa";
import LoginForm from "../Auth/SuperAdminLoginForm";

const ClientManagement = ({ onClientLogin }) => {
  const [clients, setClients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [showClientLoginModal, setShowClientLoginModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    websiteUrl: '',
    city: '',
    pincode: '',
    gstNo: '',
    panNo: '',
    aadharNo: ''
  });

  const getClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getclients`
      );
      const data = await response.json();
      console.log(data);
      setClients(data.data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const deleteclient = async(id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/deleteclient/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete client');
      }

      setShowDeleteClientModal(false);
      setClientToDelete(null);
      await getClients();
      alert('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(error.message || 'Failed to delete client. Please try again.');
    }
  };

  const confirmDeleteClient = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteClientModal(true);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      if (newClient.password !== newClient.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/superadmin/registerclient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          password: newClient.password,
          businessName: newClient.businessName,
          websiteUrl: newClient.websiteUrl,
          city: newClient.city,
          pincode: newClient.pincode,
          gstNo: newClient.gstNo,
          panNo: newClient.panNo,
          aadharNo: newClient.aadharNo
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create client');
      }

      setShowAddClientModal(false);
      setNewClient({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        websiteUrl: '',
        city: '',
        pincode: '',
        gstNo: '',
        panNo: '',
        aadharNo: ''
      });
      await getClients();
      alert('Client created successfully');
    } catch (error) {
      console.error('Error creating client:', error);
      alert(error.message || 'Failed to create client. Please try again.');
    }
  };

  // Handle client login
  const handleClientLogin = (loginData) => {
    // Close the modal
    setShowClientLoginModal(false);
    
    // Call the parent's login handler
    onClientLogin(loginData);
  };

  // Open login modal for a specific client
  const openClientLogin = (clientId, clientEmail, clientName) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setShowClientLoginModal(true);
    
    // Store the client email in sessionStorage for the login form to use
    if (clientEmail) {
      sessionStorage.setItem('tempClientEmail', clientEmail);
    }
  };

  const handleDropdownClick = (itemId, action, itemData) => {
    setShowDropdownMenu(null);
    if (action === 'edit') {
      // Handle edit action
      console.log('Edit item:', itemId, itemData);
    } else if (action === 'delete') {
      confirmDeleteClient(itemId);
    } else if (action === 'view') {
      // Handle view action
      console.log('View item:', itemId, itemData);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients ? 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    getClients();
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

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaPlus className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Add New Client</h2>
                    <p className="text-blue-100 text-sm">Register a new client account</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-blue-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowAddClientModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddClient} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUserShield className="mr-2 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter client's full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="Enter client's email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter secure password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.password}
                        onChange={(e) => setNewClient({...newClient, password: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Confirm the password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.confirmPassword}
                        onChange={(e) => setNewClient({...newClient, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBuilding className="mr-2 text-blue-600" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter business name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.businessName}
                        onChange={(e) => setNewClient({...newClient, businessName: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.websiteUrl}
                        onChange={(e) => setNewClient({...newClient, websiteUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter city"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.city}
                        onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter pincode"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.pincode}
                        onChange={(e) => setNewClient({...newClient, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaShieldAlt className="mr-2 text-blue-600" />
                    Legal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter GST number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.gstNo}
                        onChange={(e) => setNewClient({...newClient, gstNo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter PAN number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.panNo}
                        onChange={(e) => setNewClient({...newClient, panNo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhar Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter Aadhar number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={newClient.aadharNo}
                        onChange={(e) => setNewClient({...newClient, aadharNo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Client Login Modal */}
      {showClientLoginModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaBuilding className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Client Login</h2>
                    <p className="text-blue-100 text-sm">Access client account</p>
                  </div>
                </div>
                <button 
                  className="text-white hover:text-blue-200 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                  onClick={() => setShowClientLoginModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedClientName && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaBuilding className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Logging in as:</p>
                      <p className="text-blue-600 font-medium">{selectedClientName}</p>
                    </div>
                  </div>
                </div>
              )}
              <LoginForm userType="client" onLogin={handleClientLogin} switchToRegister={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {showDeleteClientModal && (
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
                    <p className="text-red-600 text-sm">Are you sure you want to delete this client? This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteClientModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteclient(clientToDelete)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Management Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Client Management</h3>
              <p className="text-gray-600">Manage and monitor client accounts</p>
            </div>
            <button 
              className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              onClick={() => setShowAddClientModal(true)}
            >
              <FaPlus className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-semibold">Add Client</span>
            </button>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search clients by name, email, or business..."
              className="pl-12 w-full pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading clients...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait while we fetch the data</p>
            </div>
          ) : !clients || clients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaBuilding className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No clients found</p>
              <p className="text-gray-400 text-sm mt-1">Get started by adding your first client</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredClients.map((client, index) => (
                  <div key={index} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{client.name}</h4>
                          <p className="text-gray-600">{client.email}</p>
                          <p className="text-sm text-gray-500">Client since {formatDate(client.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{client.businessName}</p>
                          <p className="text-xs text-gray-500">{client.city}, {client.pinCode}</p>
                        </div>
                        
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Active
                        </span>
                        
                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdownMenu(showDropdownMenu === client._id ? null : client._id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <FaEllipsisV />
                          </button>
                          
                          {showDropdownMenu === client._id && (
                            <div className="dropdown-menu absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => handleDropdownClick(client._id, 'view', {type: 'client', data: client})}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaEye className="text-blue-500" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => openClientLogin(client._id, client.email, client.name)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaBuilding className="text-blue-500" />
                                <span>Login as Client</span>
                              </button>
                              <button
                                onClick={() => handleDropdownClick(client._id, 'edit', {type: 'client', data: client})}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FaEdit className="text-green-500" />
                                <span>Edit Client</span>
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => handleDropdownClick(client._id, 'delete', {type: 'client', data: client})}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <FaTrash className="text-red-500" />
                                <span>Delete Client</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional client details */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Business:</span>
                          <p className="font-medium text-gray-800">{client.businessName}</p>
                          {client.websiteUrl && (
                            <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Visit Website
                            </a>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium text-gray-800">{client.businessAddress}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Mobile No:</span>
                          <p className="font-medium text-gray-800">{client.businessMobileNumber}</p>
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

export default ClientManagement;

