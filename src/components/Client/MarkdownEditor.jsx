import React from 'react';
import MDEditor from '@uiw/react-md-editor';

const MarkdownEditor = ({ value, onChange, placeholder, label }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div >
        <MDEditor
          value={value}
          onChange={onChange}
          preview="edit"
          height={200}
          className="border border-gray-300 rounded-md"
          data-color-mode="light"
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;