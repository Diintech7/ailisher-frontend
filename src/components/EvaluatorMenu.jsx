import React from 'react';
import { Home, Book, FileText, Database, Bot, MessageSquare, MessageCircle, ClipboardList, Users, CreditCard, UserRoundPen } from 'lucide-react';

const EvaluatorMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const menuItems = [
    { path: '/evaluator/dashboard', name: 'Overview', icon: <Home size={20} /> },
    { name: 'Credit', icon: <CreditCard size={20} /> },
    { name: 'Profile', icon: <UserRoundPen size={20} /> },
  ];

  return (
    <div className="mt-6 mb-20">
      {menuItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center py-3 px-4 cursor-pointer transition-colors duration-200 ${
            currentPath === item.path 
              ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
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

export default EvaluatorMenu;