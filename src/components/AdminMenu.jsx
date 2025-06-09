import React from 'react';
import { Home, Users, User, MessageCircle, TicketCheck, DollarSign, Lightbulb, Bot, ClipboardCheck } from 'lucide-react';

const AdminMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const menuItems = [
    { path: '/admin/dashboard', name: 'Overview', icon: <Home size={20} /> },
    { path: '/admin/clients', name: 'Clients', icon: <Users size={20} /> },
    { path: '/admin/evaluators', name: 'Evaluators', icon: <ClipboardCheck size={20} /> },
    { path: '/admin/users', name: 'Users', icon: <User size={20} /> },
    { path: '/admin/ai-agents', name: 'AI Agents', icon: <Bot size={20} /> },
    { path: '/admin/conversations', name: 'Conversations', icon: <MessageCircle size={20} /> },
    { path: '/admin/tickets', name: 'Tickets', icon: <TicketCheck size={20} /> },
    { path: '/admin/payments', name: 'Payments', icon: <DollarSign size={20} /> },
    { path: '/admin/tips', name: 'Tips', icon: <Lightbulb size={20} /> },
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

export default AdminMenu;