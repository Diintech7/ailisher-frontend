import React from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-2xl rounded-lg shadow-xl">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "" }) => {
  return (
    <div className={`p-6 space-y-6 bg-white text-gray-900 border border-gray-200 rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className = "" }) => {
  return (
    <div className={`pb-4 mb-6 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};

export const DialogFooter = ({ children, className = "" }) => {
  return (
    <div className={`flex justify-end space-x-4 mt-6 border-t border-gray-200 pt-6 ${className}`}>
      {children}
    </div>
  );
};