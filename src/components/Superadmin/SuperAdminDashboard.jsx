import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../config';
import {
  FaChartBar,
  FaDatabase,
  FaRobot,
  FaComments,
  FaHeadset,
  FaCog,
  FaShieldAlt,
  FaQuestionCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaUsers,
  FaBuilding,
  FaTools,
  FaServer,
  FaNetworkWired,
  FaAngleLeft,
  FaEllipsisV,
  FaEye,
  FaUserPlus,
  FaPlus,
  FaBell,
  FaCrown,
  FaGlobe,
  FaShieldVirus,
  FaChartLine,
  FaCog as FaSettings,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaClipboardList,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from "react-icons/fa";
import LoginForm from "../Auth/SuperAdminLoginForm";
import axios from "axios";

const SuperAdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const [admins, setAdmins] = useState(null);
  const [clients, setClients] = useState(null);
  const [Organizations, setOrganizations] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedAdminName, setSelectedAdminName] = useState('');
  const [showClientLoginModal, setShowClientLoginModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [admincount, setadmincount] = useState(null);
  const [clientcount, setclientcount] = useState(null);
  const [organizationscount, setOrganizationscount] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const token = localStorage.getItem('superadmintoken')
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
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(null);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [statsData, setStatsData] = useState({
    totalAdmins: 0,
    totalClients: 0,
    totalOrganizations: 0,
    systemHealth: 99.8,
    newAdminsThisMonth: 0,
    clientGrowthRate: 0
  });

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setShowDropdownMenu(null); // Close any open dropdown
    // Close sidebar automatically on mobile after clicking a tab
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleDropdownClick = (itemId, action, itemData) => {
    setShowDropdownMenu(null);
    if (action === 'edit') {
      // Handle edit action
      console.log('Edit item:', itemId, itemData);
    } else if (action === 'delete') {
      if (itemData.type === 'admin') {
        confirmDeleteAdmin(itemId);
      } else if (itemData.type === 'client') {
        confirmDeleteClient(itemId);
      }
    } else if (action === 'view') {
      // Handle view action
      console.log('View item:', itemId, itemData);
    }
  };

  const updateStatsData = () => {
    setStatsData({
      totalAdmins: admincount || 0,
      totalClients: clientcount || 0,
      totalOrganizations: organizationscount || 0,
      systemHealth: 99.8,
      newAdminsThisMonth: Math.floor((admincount || 0) * 0.1),
      clientGrowthRate: 12
    });
  };

  const getAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getadmins`
      );
      const data = await response.json();
      console.log(data);
      setAdmins(data.data);
      setadmincount(data.count)
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const getClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getclients`
      );
      const data = await response.json();
      console.log(data);
      setClients(data.data);
      setclientcount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const getOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/organizations`
      ,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log(data);
      setOrganizations(data.data);
      setOrganizationscount(data.count);
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

  const confirmDeleteAdmin = (adminId) => {
    setAdminToDelete(adminId);
    setShowDeleteAdminModal(true);
  };

  const confirmDeleteClient = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteClientModal(true);
  };

  useEffect(() => {
    console.log(activeTab);
    if(activeTab === "Overview"){
      getAdmins();
      getClients();
      getOrganizations();
    }
    if (activeTab === "Admin Management") {
      getAdmins();
    } 
    if (activeTab === "Client Management") {
      getClients();
    }
    if (activeTab === "Org Management") {
      getOrganizations();
    }
  }, [activeTab]);

  useEffect(() => {
    updateStatsData();
  }, [admincount, clientcount, organizationscount]);

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

  // Handle admin login
  const handleAdminLogin = (loginData) => {
    // Close the modal
    setShowLoginModal(false);
    
    onLogout(); // First logout from super admin
    
    // Small delay to ensure logout completes before login
    setTimeout(() => {
      window.location.href = "/"; // Redirect to root where the auth state will be checked
      
      // Store login data for the auth flow to pick up
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('userId', loginData.user._id || loginData.user.id);
    }, 100);
  };
    // Handle client login
    const handleClientLogin = (loginData) => {
      // Close the modal
      setShowClientLoginModal(false);
      
      onLogout(); // First logout from super admin
      
      // Small delay to ensure logout completes before login
      setTimeout(() => {
        window.location.href = "/"; // Redirect to root where the auth state will be checked
        
        // Store login data for the auth flow to pick up
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('userType', 'client');
        localStorage.setItem('userId', loginData.user._id || loginData.user.id);
      }, 100);
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

   // Open login modal for a specific admin
   const openClientLogin = (clientId, clientEmail, clientName) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setShowClientLoginModal(true);
    
    // Store the admin email in sessionStorage for the login form to use
    if (clientEmail) {
      sessionStorage.setItem('tempClientEmail', clientEmail);
    }
  };

  // Filter admins based on search term
  const filteredAdmins = admins ? 
    admins.filter(admin => 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

      // Filter admins based on search term
  const filteredOrganizations = Organizations ? 
  Organizations.filter(Organizations => 
    Organizations.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Organizations.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  // Filter clients based on search term
  const filteredClients = clients ? 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  const navItems = [
    { name: "Overview", icon: <FaHome />, color: "text-blue-400" },
    { name: "Admin Management", icon: <FaUserShield />, color: "text-purple-400" },
    { name: "Org Management", icon: <FaGlobe />, color: "text-orange-400" },
    { name: "Client Management", icon: <FaBuilding />, color: "text-green-400" },
  ];

  const systemNavItems = [
    { name: "System Settings", icon: <FaSettings />, color: "text-gray-400" },
    { name: "Log out", icon: <FaSignOutAlt />, color: "text-red-400", action: "logout" },
  ];

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <div className="min-h-screen bg-gray-100">
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

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-72 translate-x-0"
              : "-translate-x-full w-72"
            : isSidebarOpen
            ? "w-72"
            : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-purple-800/30">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FaCrown className="text-white text-lg" />
              </div>
              <div>
                <h4 className="m-0 font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Super Admin
                </h4>
                <p className="text-xs text-purple-300 m-0">Control Panel</p>
              </div>
            </div>
          )}
          <button
            className="text-white hover:text-purple-300 focus:outline-none transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col px-4 py-6 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`group flex items-center w-full py-4 px-4 text-left rounded-xl transition-all duration-200 ${
                activeTab === item.name
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => handleTabClick(item.name)}
            >
              <span className={`mr-4 text-xl transition-colors duration-200 ${
                activeTab === item.name ? "text-white" : item.color
              }`}>
                {item.icon}
              </span>
              {(isSidebarOpen || isMobile) && (
                <span className="font-medium">{item.name}</span>
              )}
              {activeTab === item.name && (isSidebarOpen || isMobile) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* System Settings at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-800/30 bg-slate-900/50 backdrop-blur-sm">
          <div className="space-y-2">
            {systemNavItems.map((item, index) => (
              <button
                key={index}
                className={`group flex items-center w-full py-3 px-4 text-left rounded-xl transition-all duration-200 ${
                  activeTab === item.name
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => {
                  if (item.action === "logout") {
                    onLogout();
                  } else {
                    handleTabClick(item.name);
                  }
                }}
              >
                <span className={`mr-4 text-lg transition-colors duration-200 ${
                  activeTab === item.name ? "text-white" : item.color
                }`}>
                  {item.icon}
                </span>
                {(isSidebarOpen || isMobile) && (
                  <span className="font-medium">{item.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`${
          isMobile ? "ml-0" : isSidebarOpen ? "ml-72" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Mobile header with toggle button */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 bg-white shadow-sm">
            <button
              className="p-2 text-gray-600 hover:text-gray-800"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <h4 className="m-0 font-bold">Super Admin Panel</h4>
          </div>
        )}

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{activeTab}</h2>
                <nav className="text-sm text-gray-500 mt-1">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <a href="#" className="text-purple-600 hover:text-purple-700">
                        Dashboard
                      </a>
                    </li>
                    <li>/</li>
                    <li>{activeTab}</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          {/* Dashboard Content based on active tab */}
          {activeTab === "Overview" && (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Super Admin!</h1>
                    <p className="text-purple-100 text-lg">Here's what's happening with your system today.</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <FaCrown className="text-4xl text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Admins Card */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaUserShield className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm font-semibold">
                        <FaArrowUp className="mr-1" />
                        +{statsData.newAdminsThisMonth}
                      </div>
                      <p className="text-xs text-gray-500">this month</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{statsData.totalAdmins}</h3>
                  <p className="text-gray-600 font-medium">Total Admins</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>

                {/* Total Clients Card */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaBuilding className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm font-semibold">
                        <FaArrowUp className="mr-1" />
                        +{statsData.clientGrowthRate}%
                      </div>
                      <p className="text-xs text-gray-500">growth rate</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{statsData.totalClients}</h3>
                  <p className="text-gray-600 font-medium">Total Clients</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>

                {/* Total Organizations Card */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaGlobe className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Active
                      </div>
                      <p className="text-xs text-gray-500">all systems</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{statsData.totalOrganizations}</h3>
                  <p className="text-gray-600 font-medium">Organizations</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>

                {/* System Health Card */}
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaShieldVirus className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Excellent
                      </div>
                      <p className="text-xs text-gray-500">uptime</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">{statsData.systemHealth}%</h3>
                  <p className="text-gray-600 font-medium">System Health</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '99%'}}></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowAddAdminModal(true)}
                    className="group flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border border-purple-200"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <FaUserPlus className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Add Admin</p>
                      <p className="text-sm text-gray-600">Create new admin user</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setShowAddClientModal(true)}
                    className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border border-blue-200"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <FaPlus className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Add Client</p>
                      <p className="text-sm text-gray-600">Register new client</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleTabClick("System Settings")}
                    className="group flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <FaSettings className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">System Settings</p>
                      <p className="text-sm text-gray-600">Configure system</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Management Table */}
          {activeTab === "Admin Management" && (
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
          )}

          {/* Client Management Table */}
          {activeTab === "Client Management" && (
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
          )}

          {/* Organization Management Table */}
          {activeTab === "Org Management" && (
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
                    onClick={() => setShowAddAdminModal(true)}
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
                ) : !Organizations || Organizations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaGlobe className="text-2xl text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No organizations found</p>
                    <p className="text-gray-400 text-sm mt-1">Get started by adding your first organization</p>
                  </div>
                ) : (
                  <div className="p-6">
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
                                <p className="text-gray-600">{org.authEmail}</p>
                                <p className="text-sm text-gray-500">Organization since {formatDate(org.createdAt)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${
                                org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  org.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                }`}></div>
                                {org.status || 'Active'}
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
                                      onClick={() => handleDropdownClick(org._id, 'view', {type: 'organization', data: org})}
                                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <FaEye className="text-blue-500" />
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      onClick={() => openAdminLogin(org._id, org.authEmail, org.name)}
                                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <FaGlobe className="text-orange-500" />
                                      <span>Login as Organization</span>
                                    </button>
                                    <button
                                      onClick={() => handleDropdownClick(org._id, 'edit', {type: 'organization', data: org})}
                                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <FaEdit className="text-green-500" />
                                      <span>Edit Organization</span>
                                    </button>
                                    <hr className="my-1" />
                                    <button
                                      onClick={() => handleDropdownClick(org._id, 'delete', {type: 'organization', data: org})}
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
          )}

          {/* System Settings */}
          {activeTab === "System Settings" && (
            <div className="space-y-8">
              {/* System Overview */}
              <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
                    <p className="text-gray-200 text-lg">Monitor and configure system settings</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <FaSettings className="text-4xl text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaCheckCircle className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Online
                      </div>
                      <p className="text-xs text-gray-500">all services</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">99.9%</h3>
                  <p className="text-gray-600 font-medium">Uptime</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '99%'}}></div>
                  </div>
                </div>

                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaServer className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-blue-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Active
                      </div>
                      <p className="text-xs text-gray-500">servers</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">3/3</h3>
                  <p className="text-gray-600 font-medium">Servers</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>

                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaDatabase className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-purple-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Healthy
                      </div>
                      <p className="text-xs text-gray-500">database</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">2.1GB</h3>
                  <p className="text-gray-600 font-medium">Storage Used</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '42%'}}></div>
                  </div>
                </div>

                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaNetworkWired className="text-white text-xl" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 text-sm font-semibold">
                        <FaCheckCircle className="mr-1" />
                        Fast
                      </div>
                      <p className="text-xs text-gray-500">response time</p>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">45ms</h3>
                  <p className="text-gray-600 font-medium">Avg Response</p>
                  <div className="mt-4 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>

              {/* Configuration Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Email Settings */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <FaComments className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Email Configuration</h3>
                      <p className="text-gray-600">SMTP and notification settings</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">SMTP Server</span>
                      <span className="text-gray-800 font-semibold">smtp.example.com</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">SMTP Port</span>
                      <span className="text-gray-800 font-semibold">587</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">From Email</span>
                      <span className="text-gray-800 font-semibold">system@example.com</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Active</span>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <FaNetworkWired className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">API Configuration</h3>
                      <p className="text-gray-600">API settings and limits</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">API Version</span>
                      <span className="text-gray-800 font-semibold">v2.3.1</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Rate Limit</span>
                      <span className="text-gray-800 font-semibold">100/minute</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Timeout</span>
                      <span className="text-gray-800 font-semibold">30 seconds</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Active</span>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                      <FaShieldAlt className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Security Settings</h3>
                      <p className="text-gray-600">Security and access control</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Password Policy</span>
                      <span className="text-gray-800 font-semibold">Strong</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">2FA</span>
                      <span className="text-gray-800 font-semibold">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Session Timeout</span>
                      <span className="text-gray-800 font-semibold">30 minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Secure</span>
                    </div>
                  </div>
                </div>

                {/* Storage Settings */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <FaDatabase className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Storage Settings</h3>
                      <p className="text-gray-600">File storage and backup</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Provider</span>
                      <span className="text-gray-800 font-semibold">AWS S3</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Region</span>
                      <span className="text-gray-800 font-semibold">us-east-1</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Retention Policy</span>
                      <span className="text-gray-800 font-semibold">90 days</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard; 