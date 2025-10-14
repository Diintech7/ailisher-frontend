import React from 'react';
import { Home, Users, CreditCard, Settings, UserPlus } from 'lucide-react';

const OrgMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const menuItems = [
    { path: '/organization/dashboard', name: 'Overview', icon: <Home size={20} /> },
    { path: '/organization/members', name: 'Members', icon: <UserPlus size={20} /> },
    { path: '/organization/clients', name: 'Clients', icon: <Users size={20} /> },
    { path: '/organization/billing', name: 'Billing', icon: <CreditCard size={20} /> },
    // { path: '/organization/settings', name: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="mt-6 mb-20">
      {menuItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center py-3 px-4 cursor-pointer transition-colors duration-200 ${
            currentPath.includes(item.path)
              ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex-shrink-0">{item.icon}</div>
          {isExpanded && (
            <span className="ml-4 text-sm font-medium">{item.name}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrgMenu;


