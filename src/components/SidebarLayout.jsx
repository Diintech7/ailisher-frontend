import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LogOut, User, Settings } from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import UserMenu from './UserMenu';
import ClientMenu from './ClientMenu';
import AdminMenu from './AdminMenu';

const SidebarLayout = ({ onLogout, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [username, setUsername] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  useEffect(() => {
    if (userRole === 'admin') {
      setUsername('Administrator');
      setBusinessName('Ailisher');
      return;
    }

    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        console.log(userData)
        setUsername(userData.name || (userRole === 'client' ? 'Client' : 'User'));
        
        // For clients, try to get business info from stored user data
        if (userRole === 'client') {
          setBusinessName(userData.businessName || 'Client Dashboard');
          setBusinessLogo(userData.businessLogo || '');
        } else {
          setBusinessName('Ailisher');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUsername(userRole === 'client' ? 'Client' : 'User');
        setBusinessName(userRole === 'client' ? 'Client Dashboard' : 'Ailisher');
      }
    }

    // If we don't have business info in cookies for client, fetch from API
    if (userRole === 'client' && (!businessName || businessName === 'Client Dashboard')) {
      fetchClientInfo();
    }
  }, [userRole, businessName]);

  const fetchClientInfo = async () => {
    try {
      const token = Cookies.get('usertoken');
      const response = await fetch('https://aipbbackend.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(response)
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setBusinessName(data.user.businessName || 'Client Dashboard');
          setBusinessLogo(data.user.businessLogo || '');
          
          // Update the user cookie with business info
          const currentUserData = JSON.parse(Cookies.get('user') || '{}');
          const updatedUserData = {
            ...currentUserData,
            businessName: data.user.businessName,
            businessLogo: data.user.businessLogo
          };
          Cookies.set('user', JSON.stringify(updatedUserData), { expires: 7 });
        }
      }
    } catch (error) {
      console.error('Error fetching client info:', error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setCurrentPath(path);
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  const handleProfileClick = () => {
    if (userRole === 'admin') {
      navigate('/admin/settings');
    } else if (userRole === 'client') {
      navigate('/profile');
    } else {
      navigate('/settings');
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const getPageTitle = () => {
    if (currentPath === '/dashboard' || currentPath === '/admin/dashboard') return 'Overview';
    if (currentPath.startsWith('/admin/')) {
      return currentPath.slice(7).split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return currentPath.slice(1).split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderLogo = () => {
    // For clients with business logo
    if (userRole === 'client' && businessLogo) {
      return (
        <img 
          src={businessLogo} 
          alt={`${businessName} Logo`} 
          className="w-10 h-10 object-contain rounded-lg"
          onError={(e) => {
            // Fallback to default logo if business logo fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    // Default Ailisher logo or fallback
    return (
      <>
        <img 
          src="/logo.png" 
          alt="Ailisher Logo" 
          className="w-10 h-10 object-contain"
          onError={(e) => {
            // Fallback if logo fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className={`w-10 h-10 ${
          userRole === 'client' ? 'bg-green-600' : 'bg-blue-600'
        } rounded-full hidden items-center justify-center overflow-hidden`}>
          <span className="text-white font-bold text-xl">
            {userRole === 'client' ? businessName.charAt(0).toUpperCase() : 'AI'}
          </span>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'} relative`}>
        <div className="flex items-center p-4 border-b border-gray-200">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate(userRole === 'admin' ? '/admin/dashboard' : '/dashboard')}
          >
            {renderLogo()}
            {/* Fallback div for business logo */}
            {userRole === 'client' && businessLogo && (
              <div className="w-10 h-10 bg-green-600 rounded-full hidden items-center justify-center overflow-hidden">
                <span className="text-white font-bold text-xl">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {isExpanded && (
            <span className="ml-3 font-bold text-2xl text-gray-700 animate-fade-in">
              {businessName || 'Ailisher'}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-8 rounded-full p-2 shadow-md transition-colors bg-white hover:bg-gray-100 text-gray-800"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {userRole === 'admin' && (
          <AdminMenu
            isExpanded={isExpanded}
            currentPath={currentPath}
            handleNavigate={handleNavigate}
          />
        )}

        {userRole === 'client' && (
          <ClientMenu
            isExpanded={isExpanded}
            currentPath={currentPath}
            handleNavigate={handleNavigate}
          />
        )}

        {userRole === 'user' && (
          <UserMenu
            isExpanded={isExpanded}
            currentPath={currentPath}
            handleNavigate={handleNavigate}
          />
        )}

        <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
          <div className="relative">
            <div 
              onClick={handleSettingsClick}
              className="flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-700 transition-colors duration-200 p-2 rounded-full"
            >
              <Settings size={20} />
              {isExpanded && (
                <span className="ml-4">Settings</span>
              )}
            </div>
            {showSettings && (
              <div className="absolute bottom-full left-0 w-48 mb-2 py-2 rounded-lg shadow-lg bg-white text-gray-900 border border-gray-200">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-gray-700"
                >
                  <User size={16} className="mr-2" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-red-600"
                >
                  <LogOut size={16} className="mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <span className="font-semibold text-gray-800">
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <div 
                onClick={handleProfileClick}
                className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 px-4"
              >
                <div className={`w-10 h-10 rounded-full ${
                  userRole === 'admin' ? 'bg-red-600' : 
                  userRole === 'client' ? 'bg-green-600' : 'bg-blue-600'
                } flex items-center justify-center text-white font-medium overflow-hidden mr-3`}>
                  {username ? username.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Logged in as</span>
                  <span className="font-medium text-gray-800">
                    {username} ({userRole})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8 text-gray-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;