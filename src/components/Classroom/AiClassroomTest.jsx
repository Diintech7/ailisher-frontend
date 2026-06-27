import React from 'react';
import { BookCheck, Clock } from 'lucide-react';

const AiClassroomTest = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-150 p-8 shadow-xl relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Decorative subtle background gradient blur */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Center Icon */}
        <div className="mx-auto w-16 h-16 bg-indigo-55 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner animate-pulse">
          <BookCheck size={32} />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4 uppercase tracking-wider">
          <Clock size={12} />
          Coming Soon
        </span>

        {/* Content */}
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">AI Test Module</h1>
        <p className="text-gray-500 mt-3 text-sm leading-relaxed">
          We are currently building advanced classroom testing features. Students will soon be able to take custom, AI-evaluated mock tests and assessments based on their dynamic syllabus.
        </p>

        {/* Footer/Visual placeholder */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
          Stay tuned for updates &bull; Aishaala Portal
        </div>
      </div>
    </div>
  );
};

export default AiClassroomTest;
