import React from 'react';
import { Home, Book, FileText, Database, Bot, MessageSquare, MessageCircle, ClipboardList, Users, CreditCard, UserRoundPen, ClipboardCheck, ChevronDown, ChevronRight, FileCheck } from 'lucide-react';

const EvaluatorMenu = ({ isExpanded, currentPath, handleNavigate }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    manualEvaluation: currentPath && (currentPath.includes('/evaluator/pending') || currentPath.includes('/evaluator/evaluated'))
  });

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const menuItems = [
    { path: '/evaluator/dashboard', name: 'Overview', icon: <Home size={20} /> },
    {
      name: 'New Evaluation',
      icon: <FileCheck size={20} />,
      sectionKey: 'manualEvaluation',
      subItems: [
        { path: '/evaluator/pending', name: 'Pending' },
        { path: '/evaluator/accepted', name: 'Accepted' },
        { path: '/evaluator/completed', name: 'Completed' },
      ],
    },
    { path: '/evaluator/review', name: 'Review Requests', icon: <ClipboardCheck size={20} /> },
    { path: '/evaluator/credit', name: 'Credit', icon: <CreditCard size={20} /> },
    { path: '/evaluator/profile', name: 'Profile', icon: <UserRoundPen size={20} /> },
  ];

  return (
    <div className="mt-6 mb-20">
      {menuItems.map((item) => (
        <React.Fragment key={item.name || item.path}>
          {item.subItems ? (
            <div className="mb-1">
              <div
                onClick={() => toggleSection(item.sectionKey)}
                className={`flex items-center justify-between py-3 px-4 cursor-pointer transition-all duration-200 rounded-lg mx-2 ${
                  currentPath && (currentPath.includes('/evaluator/pending') || currentPath.includes('/evaluator/evaluated'))
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">{item.icon}</div>
                  {isExpanded && (
                    <span className="ml-4 text-sm font-semibold">{item.name}</span>
                  )}
                </div>
                {isExpanded && (
                  <div className="flex-shrink-0 transition-transform duration-200">
                    {expandedSections[item.sectionKey] ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </div>
                )}
              </div>
              {isExpanded && expandedSections[item.sectionKey] && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.subItems.map((sub) => (
                    <div
                      key={sub.path}
                      onClick={() => handleNavigate(sub.path)}
                      className={`flex items-center py-2.5 px-4 cursor-pointer transition-all duration-200 text-sm rounded-lg mx-2 border-l-2 ${
                        currentPath === sub.path
                          ? 'bg-yellow-100 text-yellow-800 font-medium border-l-yellow-500 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-transparent hover:border-l-gray-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        currentPath === sub.path ? 'bg-yellow-500' : 'bg-gray-300'
                      }`} />
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => handleNavigate(item.path)}
              className={`flex items-center py-3 px-4 cursor-pointer transition-all duration-200 rounded-lg mx-2 mb-1 ${
                currentPath === item.path 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:shadow-sm'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {isExpanded && (
                <span className="ml-4 text-sm font-semibold">{item.name}</span>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default EvaluatorMenu;