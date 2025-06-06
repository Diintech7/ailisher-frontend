import React from 'react';

const QRCodeColorSelector = ({ selectedColor, onSelectColor }) => {
  // Define color options with names and hex values
  const colorOptions = [
    { name: 'Black', value: '#000000', bgClass: 'bg-black' },
    { name: 'Blue', value: '#3949ab', bgClass: 'bg-blue-700' },
    { name: 'Red', value: '#e53935', bgClass: 'bg-red-600' },
    { name: 'Green', value: '#2e7d32', bgClass: 'bg-green-700' },
    { name: 'Purple', value: '#8e24aa', bgClass: 'bg-purple-700' },
    { name: 'Orange', value: '#f57c00', bgClass: 'bg-orange-600' },
  ];

  return (
    <div className="mb-4">
      <p className="text-gray-700 mb-2">Choose QR Code Color:</p>
      <div className="flex flex-wrap gap-2">
        {colorOptions.map((color) => (
          <button
            key={color.value}
            onClick={() => onSelectColor(color.value)}
            className={`w-8 h-8 rounded-full ${color.bgClass} flex items-center justify-center transition-transform ${
              selectedColor === color.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
            }`}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          >
            {selectedColor === color.value && (
              <span className="text-white text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QRCodeColorSelector;