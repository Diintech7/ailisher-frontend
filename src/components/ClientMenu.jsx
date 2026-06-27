import React, { useState, useEffect } from 'react';
import { Home, Book, FileText, Database, ClipboardList, Users, Wrench, MessageCircleQuestionIcon, BookCheck, TvMinimalPlay, School, ShoppingCart, ChevronDown, ChevronRight } from 'lucide-react';

const ClientMenu = ({ isExpanded, currentPath, handleNavigate, allowedFeatures }) => {
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);

  // Sync state if current path is one of the sub-items
  useEffect(() => {
    if (currentPath === '/classroom' || currentPath === '/ai-pyqs' || currentPath === '/ai-current-affairs' || currentPath === '/ai-classroom-test') {
      setIsClassroomOpen(true);
    }
  }, [currentPath]);

  const menuItems = [
    { path: '/dashboard', name: 'Overview', icon: <Home size={20} /> },
    { path: '/ai-books', name: 'AI Books', featureKey: 'aiBooks', icon: <Book size={20} /> },
    { path: '/ai-workbook', name: 'AI Workbook', featureKey: 'aiWorkbook', icon: <FileText size={20} /> },
    { path: '/ai-tests', name: 'AI Tests', featureKey: 'aiTests', icon: <BookCheck size={20} /> },
    { path: '/ai-courses', name: 'AI Courses', featureKey: 'aiCourses', icon: <TvMinimalPlay size={20} /> },
    { 
      name: 'AI Classroom', 
      featureKey: 'aiClassroom', 
      icon: <School size={20} />,
      isDropdown: true,
      subItems: [
        { path: '/classroom', name: 'AI Video' },
        { path: '/ai-pyqs', name: 'AI PYQs' },
        { path: '/ai-current-affairs', name: 'AI Current Affairs' },
        { path: '/ai-classroom-test', name: 'AI Test' }
      ]
    },
    { path: '/question-bank', name: 'Question Bank', featureKey: 'questionBank', icon: <MessageCircleQuestionIcon size={20} /> },
    { path: '/my-question', name: 'My Question', featureKey: 'myQuestion', icon: <MessageCircleQuestionIcon size={20} /> },
    { path: '/datastore', name: 'Datastore', featureKey: 'datastore', icon: <Database size={20} /> },
    { path: '/tools', name: 'Tools', featureKey: 'tools', icon: <Wrench size={20} /> },  
    { path: '/plans', name: 'Plans', icon: <ClipboardList size={20} /> },
    { path: '/orders', name: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/users', name: 'Users', icon: <Users size={20} /> },
  ];

  // Filter menu items based on allowedFeatures configuration (backward-compatible)
  const filteredItems = menuItems.filter(item => {
    if (!item.featureKey) return true; // Always show Overview, Plans, Orders, Users
    if (!allowedFeatures) return true; // Default to show everything if not loaded yet
    
    // Custom check for Tools item: show if at least one sub-tool is enabled
    if (item.featureKey === 'tools') {
      const toolSubKeys = [
        'toolMarketing', 'toolReels', 'toolChats', 'toolAiAgents',
        'toolWhatsapp', 'toolTelegram', 'toolImageGenerator',
        'toolCategoryManagement', 'toolNotification', 'toolAppBanners'
      ];
      return toolSubKeys.some(key => allowedFeatures[key] !== false);
    }
    
    return allowedFeatures[item.featureKey] !== false; // Hide only if explicitly set to false
  });

  return (
    <div className="mt-6 mb-6">
      {filteredItems.map((item) => {
        if (item.isDropdown) {
          const isChildActive = currentPath === '/classroom' || currentPath === '/ai-pyqs' || currentPath === '/ai-current-affairs' || currentPath === '/ai-classroom-test';
          return (
            <div key={item.name} className="flex flex-col">
              <div
                onClick={() => {
                  if (!isExpanded) {
                    handleNavigate('/classroom');
                  } else {
                    setIsClassroomOpen(!isClassroomOpen);
                  }
                }}
                className={`flex items-center justify-between py-3 px-4 cursor-pointer transition-colors duration-200 ${
                  isChildActive 
                    ? 'bg-green-50 text-green-600 border-r-4 border-green-600 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">{item.icon}</div>
                  {isExpanded && (
                    <span className="ml-4 text-sm font-medium">{item.name}</span>
                  )}
                </div>
                {isExpanded && (
                  <div className="text-gray-400">
                    {isClassroomOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
              </div>
              {isClassroomOpen && isExpanded && (
                <div className="flex flex-col bg-gray-50/40 border-l border-gray-100 ml-4 py-1">
                  {item.subItems.map((sub) => (
                    <div
                      key={sub.path}
                      onClick={() => handleNavigate(sub.path)}
                      className={`flex items-center py-2.5 pl-8 pr-4 cursor-pointer transition-colors duration-200 text-xs ${
                        currentPath === sub.path
                          ? 'text-green-600 font-bold bg-green-50/60'
                          : 'text-gray-600 hover:bg-gray-100/50'
                      }`}
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={`flex items-center py-3 px-4 cursor-pointer transition-colors duration-200 ${
              currentPath === item.path 
                ? 'bg-green-50 text-green-600 border-r-4 border-green-600 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            {isExpanded && (
              <span className="ml-4 text-sm font-medium">{item.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClientMenu;