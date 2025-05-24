import React from 'react';
import { Home, Bot, BookOpen, Book, ClipboardList, Video, Settings } from 'lucide-react';

const UserMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const menuItems = [
    { path: '/dashboard', name: 'Home', icon: <Home size={20} /> },
    { path: '/ai', name: 'AI', icon: <Bot size={20} /> },
    { path: '/my-library', name: 'My Library', icon: <BookOpen size={20} /> },
    { path: '/ai-books', name: 'AI Books', icon: <Book size={20} /> },
    { path: '/tests', name: 'Tests', icon: <ClipboardList size={20} /> },
    { path: '/lectures', name: 'Lectures', icon: <Video size={20} /> },
    { path: '/settings', name: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="mt-6 mb-20">
      {menuItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center py-3 px-4 cursor-pointer transition-colors duration-200 ${
            currentPath === item.path 
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

export default UserMenu;