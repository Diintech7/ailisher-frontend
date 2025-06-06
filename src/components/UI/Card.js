import React from 'react';

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`p-6 border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-2xl font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};

export const CardDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pt-0 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};