import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
// import { apiRequest } from '../utils/api';

function ConfigTable({ data, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow border table-fixed overflow-y-auto">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="px-4 py-2 text-left">Source</th>
            <th className="px-4 py-2 text-left">Model</th>
            <th className="px-4 py-2 text-left" colSpan={2}>Key</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{row.sourcename}</td>
              <td className="px-4 py-2">{row.modelname}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-600" colSpan={2}>{row.key}</td>
              {/* <td className="px-4 py-2">{row.status || '-'}</td> */}
              <td className="px-4 py-2" >{row.description || '-'}</td>
              <td className="px-4 py-2 space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => onEdit(row)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => onDelete(row)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModelForm({ sourcetype, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial || { key: '', sourcename: '', modelname: '', status: '', description: '' }
  );
  useEffect(() => {
    setForm(initial || { key: '', sourcename: '', modelname: '', status: '', description: '' });
  }, [initial]);
  return (
    <form
      className="flex flex-wrap gap-2 mb-4 items-end"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <input
        className="border rounded px-2 py-1"
        placeholder="Key"
        value={form.key}
        onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
        required
        disabled={!!initial}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Source Name"
        value={form.sourcename}
        onChange={e => setForm(f => ({ ...f, sourcename: e.target.value }))}
        required
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Model Name"
        value={form.modelname}
        onChange={e => setForm(f => ({ ...f, modelname: e.target.value }))}
        required
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Status"
        value={form.status}
        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Description"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />
      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
        {initial ? 'Update' : 'Add'}
      </button>
      {onCancel && (
        <button type="button" className="bg-gray-300 px-3 py-1 rounded" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default function Configuration() {
  const [configData, setConfigData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addSection, setAddSection] = useState(null); // sourcetype for add form
  const [editModel, setEditModel] = useState(null); // { ...model, sourcetype }
  const [newSection, setNewSection] = useState('');

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = Cookies.get('admintoken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/config', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      const configs = Array.isArray(data) ? data : [data];
      const grouped = {};
      configs.forEach(cfg => {
        if (cfg && cfg.sourcetype && Array.isArray(cfg.models)) {
          grouped[cfg.sourcetype] = cfg.models;
        }
      });
      setConfigData(grouped);
    } catch (err) {
      setError(err.message || 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Add model
  const handleAdd = async (sourcetype, model) => {
    try {
      setLoading(true);
      await fetch('https://aipbbackend-c5ed.onrender.com/api/config/model', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...model, sourcetype })
      });
      setAddSection(null);
      await fetchConfig();
    } catch (err) {
      setError(err.message || 'Failed to add model');
    } finally {
      setLoading(false);
    }
  };

  // Edit model
  const handleEdit = (model, sourcetype) => {
    setEditModel({ ...model, sourcetype });
  };
  const handleUpdate = async (model) => {
    try {
      setLoading(true);
      await fetch(`https://aipbbackend-c5ed.onrender.com/api/config/model/${editModel.sourcetype}/${editModel.key}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(model)
      });
      setEditModel(null);
      await fetchConfig();
    } catch (err) {
      setError(err.message || 'Failed to update model');
    } finally {
      setLoading(false);
    }
  };

  // Delete model
  const handleDelete = async (model, sourcetype) => {
    if (!window.confirm(`Delete model ${model.modelname} (${model.key})?`)) return;
    try {
      setLoading(true);
      await fetch(`https://aipbbackend-c5ed.onrender.com/api/config/model/${sourcetype}/${model.key}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await fetchConfig();
    } catch (err) {
      setError(err.message || 'Failed to delete model');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    if (!newSection) return;
    setAddSection(newSection);
    setNewSection('');
  };

  return (
    <div className="w-full mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Configuration</h1>
      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      <div className="mb-6 flex gap-2 items-end">
        <input
          className="border rounded px-2 py-1"
          placeholder="Add new section (LLM, SST, TTS)"
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAddSection}>
          Add Section
        </button>
      </div>
      {!loading && !error && (
        <div className="space-y-8">
          {Object.entries(configData).map(([section, data]) => (
            <div key={section} className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-700">{section}</h2>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => setAddSection(section)}
                  disabled={!!addSection || !!editModel}
                >
                  Add Model
                </button>
              </div>
              {addSection === section && !editModel && (
                <ModelForm
                  sourcetype={section}
                  onSubmit={model => handleAdd(section, model)}
                  onCancel={() => setAddSection(null)}
                />
              )}
              {editModel && editModel.sourcetype === section && (
                <ModelForm
                  sourcetype={section}
                  initial={editModel}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditModel(null)}
                />
              )}
              <ConfigTable
                data={data}
                onEdit={model => handleEdit(model, section)}
                onDelete={model => handleDelete(model, section)}
              />
            </div>
          ))}
          {/* Add new section form */}
          {addSection && !configData[addSection] && !editModel && (
            <div className="bg-white rounded-xl shadow-lg p-6 border">
              <h2 className="text-xl font-semibold text-blue-700">{addSection}</h2>
              <ModelForm
                sourcetype={addSection}
                onSubmit={model => handleAdd(addSection, model)}
                onCancel={() => setAddSection(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
