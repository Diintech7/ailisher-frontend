import React from 'react';
import { Home, Book, FileText, Database, ClipboardList, Users, Wrench, MessageCircleQuestionIcon, BookCheck, TvMinimalPlay} from 'lucide-react';

const ClientMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const menuItems = [
    { path: '/dashboard', name: 'Overview', icon: <Home size={20} /> },
    { path: '/ai-books', name: 'AI Books', icon: <Book size={20} /> },
    { path: '/ai-workbook', name: 'AI Workbook', icon: <FileText size={20} /> },
    { path: '/ai-tests', name: 'AI Tests', icon: <BookCheck size={20} /> },
    { path: '/ai-courses', name: 'AI Courses', icon: <TvMinimalPlay size={20} /> },
    { path: '/question-bank', name: 'Question Bank', icon: <MessageCircleQuestionIcon size={20} /> },
    { path: '/datastore', name: 'Datastore', icon: <Database size={20} /> },
    { path: '/tools', name: 'Tools', icon: <Wrench size={20} /> },  

    // { path: '/ai-agent', name: 'AI Agent', icon: <Bot size={20} /> },
    // { path: '/chats', name: 'Chats', icon: <MessageSquare size={20} /> },
    // { path: '/conversations', name: 'Conversations', icon: <MessageCircle size={20} /> },
    { path: '/plans', name: 'Plans', icon: <ClipboardList size={20} /> },
    { path: '/users', name: 'Users', icon: <Users size={20} /> },
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

export default ClientMenu;