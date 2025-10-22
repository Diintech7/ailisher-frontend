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
import AdminManagement from "./AdminManagement";
import ClientManagement from "./ClientManagement";
import OrgManagement from "./OrgManagement";
import axios from "axios";

const SuperAdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const [admincount, setadmincount] = useState(null);
  const [clientcount, setclientcount] = useState(null);
  const [organizationscount, setOrganizationscount] = useState(null);
  const token = localStorage.getItem('superadmintoken')
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
    // setShowDropdownMenu(null); // Close any open dropdown
    // Close sidebar automatically on mobile after clicking a tab
    if (isMobile) {
      setIsSidebarOpen(false);
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
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getadmins`
      );
      const data = await response.json();
      console.log(data);
      setadmincount(data.count)
    } catch (error) {
      console.log(error);
    }
  };

  const getClients = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/getclients`
      );
      const data = await response.json();
      console.log(data);
      setclientcount(data.count);
    } catch (error) {
      console.log(error);
    }
  };

  const getOrganizations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/superadmin/organizations`
      ,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log(data);
      setOrganizationscount(data.count);
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    console.log(activeTab);
    if(activeTab === "Overview"){
      getAdmins();
      getClients();
      getOrganizations();
    }
  }, [activeTab]);

  useEffect(() => {
    updateStatsData();
  }, [admincount, clientcount, organizationscount]);

  // Handle admin login
  const handleAdminLogin = (loginData) => {
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
  
  // Handle organization login
  const handleOrgLogin = (loginData) => {
    onLogout(); // First logout from super admin
    
    // Small delay to ensure logout completes before login
    setTimeout(() => {
      window.location.href = "/"; // Redirect to root where the auth state will be checked
      
      // Store login data for the auth flow to pick up
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('userType', 'organization');
      localStorage.setItem('userId', loginData.user._id || loginData.user.id);
    }, 100);
  };

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
                    onClick={() => handleTabClick("Admin Management")}
                    className="group flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border border-purple-200"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <FaUserPlus className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Manage Admins</p>
                      <p className="text-sm text-gray-600">View and manage admin users</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleTabClick("Client Management")}
                    className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border border-blue-200"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <FaPlus className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Manage Clients</p>
                      <p className="text-sm text-gray-600">View and manage client accounts</p>
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

          {/* Admin Management */}
          {activeTab === "Admin Management" && (
            <AdminManagement onAdminLogin={handleAdminLogin} />
          )}

          {/* Client Management */}
          {activeTab === "Client Management" && (
            <ClientManagement onClientLogin={handleClientLogin} />
          )}

          {/* Organization Management */}
          {activeTab === "Org Management" && (
            <OrgManagement onOrgLogin={handleOrgLogin} />
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