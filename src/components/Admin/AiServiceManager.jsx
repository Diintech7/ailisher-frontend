import React, { useState, useEffect } from 'react';
import { Bot, Settings, Eye, EyeOff, Edit3, Save, X, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, Key } from 'lucide-react';

const AiServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [actualApiKeys, setActualApiKeys] = useState({});
  const [loadingApiKeys, setLoadingApiKeys] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  const taskTypes = ['text_extraction', 'analysis', 'evaluation'];
  const serviceTypes = ['openai', 'gemini', 'agentic'];

  const [newService, setNewService] = useState({
    serviceName: '',
    displayName: '',
    apiKey: '',
    apiUrl: '',
    isActive: true,
    supportedTasks: [],
    taskPreferences: {
      text_extraction: false,
      analysis: false,
      evaluation: false
    },
    serviceConfig: {
      timeout: 480,
      includeMarginalia: true,
      includeMetadataInMarkdown: true,
      pages: null
    }
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://aipbbackend-yxnh.onrender.com/api/ai');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      } else {
        setError(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKey = async (serviceName) => {
    try {
      setLoadingApiKeys(prev => ({ ...prev, [serviceName]: true }));
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}/apikey`);
      const data = await response.json();
      
      if (data.success) {
        setActualApiKeys(prev => ({ ...prev, [serviceName]: data.data.apiKey }));
      } else {
        setError(data.message || 'Failed to fetch API key');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoadingApiKeys(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  const handleCreateService = async () => {
    try {
      const response = await fetch('https://aipbbackend-yxnh.onrender.com/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${newService.serviceName} service created successfully`);
        setShowAddForm(false);
        setNewService({
          serviceName: '',
          displayName: '',
          apiKey: '',
          apiUrl: '',
          isActive: true,
          supportedTasks: [],
          taskPreferences: {
            text_extraction: false,
            analysis: false,
            evaluation: false
          },
          serviceConfig: {
            timeout: 480,
            includeMarginalia: true,
            includeMetadataInMarkdown: true,
            pages: null
          }
        });
        fetchServices();
      } else {
        setError(data.message || 'Failed to create service');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleUpdateApiKey = async (serviceName, newApiKey) => {
    try {
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}/apikey`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: newApiKey }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${serviceName} API key updated successfully`);
        setActualApiKeys(prev => ({ ...prev, [serviceName]: newApiKey }));
        fetchServices();
      } else {
        setError(data.message || 'Failed to update API key');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleUpdateTaskPreferences = async (serviceName, taskPreferences) => {
    try {
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskPreferences }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${serviceName} task preferences updated successfully`);
        fetchServices();
      } else {
        setError(data.message || 'Failed to update task preferences');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleUpdateServiceConfig = async (serviceName, serviceConfig) => {
    try {
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceConfig }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${serviceName} service configuration updated successfully`);
        fetchServices();
      } else {
        setError(data.message || 'Failed to update service configuration');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleToggleService = async (serviceName) => {
    try {
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}/toggle`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchServices();
      } else {
        setError(data.message || 'Failed to toggle service');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleDeleteService = async (serviceName) => {
    if (!window.confirm(`Are you sure you want to delete ${serviceName} service?`)) {
      return;
    }

    try {
      const response = await fetch(`https://aipbbackend-yxnh.onrender.com/api/ai/${serviceName}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${serviceName} service deleted successfully`);
        fetchServices();
      } else {
        setError(data.message || 'Failed to delete service');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const toggleApiKeyVisibility = async (serviceName) => {
    const isCurrentlyVisible = showApiKeys[serviceName];
    
    if (!isCurrentlyVisible && !actualApiKeys[serviceName]) {
      // Need to fetch the API key first
      await fetchApiKey(serviceName);
    }
    
    setShowApiKeys(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const ApiKeyEditor = ({ service, onSave }) => {
    const [tempApiKey, setTempApiKey] = useState(actualApiKeys[service.serviceName] || '');

    const handleSave = () => {
      if (tempApiKey.trim().length < 10) {
        setError('API key must be at least 10 characters long');
        return;
      }
      onSave(service.serviceName, tempApiKey.trim());
      setEditingService(null);
    };

    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h4 className="font-semibold mb-3">Edit API Key</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="text"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm font-mono"
              placeholder="Enter new API key..."
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={() => setEditingService(null)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  };

  const TaskPreferenceEditor = ({ service, onSave }) => {
    const [tempPreferences, setTempPreferences] = useState({ ...service.taskPreferences });

    const handleSave = () => {
      onSave(service.serviceName, tempPreferences);
      setEditingService(null);
    };

    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h4 className="font-semibold mb-3">Edit Task Preferences</h4>
        <div className="space-y-3">
          {taskTypes.map(task => (
            <div key={task} className="flex items-center justify-between">
              <span className="capitalize text-sm font-medium">
                {task.replace('_', ' ')}
              </span>
              <button
                onClick={() => setTempPreferences(prev => ({
                  ...prev,
                  [task]: !prev[task]
                }))}
                className={`p-1 rounded transition-colors ${
                  tempPreferences[task] 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                {tempPreferences[task] ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={() => setEditingService(null)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  };

  const ServiceConfigEditor = ({ service, onSave }) => {
    const [tempConfig, setTempConfig] = useState({ ...service.serviceConfig });

    const handleSave = () => {
      onSave(service.serviceName, tempConfig);
      setEditingService(null);
    };

    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h4 className="font-semibold mb-3">Edit Service Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
            <input
              type="number"
              value={tempConfig.timeout}
              onChange={(e) => setTempConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded text-sm"
              min="1"
              max="600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pages</label>
            <input
              type="text"
              value={tempConfig.pages || ''}
              onChange={(e) => setTempConfig(prev => ({ ...prev, pages: e.target.value || null }))}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="e.g., 0,1,2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Include Marginalia</span>
            <button
              onClick={() => setTempConfig(prev => ({ ...prev, includeMarginalia: !prev.includeMarginalia }))}
              className={`p-1 rounded transition-colors ${
                tempConfig.includeMarginalia 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              {tempConfig.includeMarginalia ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Include Metadata</span>
            <button
              onClick={() => setTempConfig(prev => ({ ...prev, includeMetadataInMarkdown: !prev.includeMetadataInMarkdown }))}
              className={`p-1 rounded transition-colors ${
                tempConfig.includeMetadataInMarkdown 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              {tempConfig.includeMetadataInMarkdown ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={() => setEditingService(null)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">AI Service Configuration</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Add New AI Service</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service Name</label>
              <select
                value={newService.serviceName}
                onChange={(e) => setNewService(prev => ({ ...prev, serviceName: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Service</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={newService.displayName}
                onChange={(e) => setNewService(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                value={newService.apiKey}
                onChange={(e) => setNewService(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API URL</label>
              <input
                type="url"
                value={newService.apiUrl}
                onChange={(e) => setNewService(prev => ({ ...prev, apiUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Supported Tasks</label>
            <div className="flex gap-4">
              {taskTypes.map(task => (
                <label key={task} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newService.supportedTasks.includes(task)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewService(prev => ({
                          ...prev,
                          supportedTasks: [...prev.supportedTasks, task]
                        }));
                      } else {
                        setNewService(prev => ({
                          ...prev,
                          supportedTasks: prev.supportedTasks.filter(t => t !== task)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="capitalize text-sm">{task.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateService}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Service
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {services.map((service) => (
          <div key={service._id} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${service.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{service.displayName}</h3>
                  <p className="text-sm text-gray-600 capitalize">{service.serviceName}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleService(service.serviceName)}
                  className={`p-2 rounded hover:bg-gray-100 ${
                    service.isActive ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={`${service.isActive ? 'Deactivate' : 'Activate'} service`}
                >
                  {service.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => handleDeleteService(service.serviceName)}
                  className="p-2 rounded hover:bg-red-50 text-red-600"
                  title="Delete service"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Service Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">API URL:</span>
                    <span className="font-mono text-xs">{service.apiUrl}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">API Key:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {showApiKeys[service.serviceName] 
                          ? (loadingApiKeys[service.serviceName] 
                              ? 'Loading...' 
                              : actualApiKeys[service.serviceName] || 'No API key found')
                          : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleApiKeyVisibility(service.serviceName)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loadingApiKeys[service.serviceName]}
                      >
                        {loadingApiKeys[service.serviceName] ? (
                          <div className="animate-spin h-4 w-4 border-b-2 border-gray-400 rounded-full"></div>
                        ) : showApiKeys[service.serviceName] ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingService({ type: 'apikey', service })}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit API key"
                      >
                        <Key size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supported Tasks:</span>
                    <span className="text-xs">
                      {service.supportedTasks.map(task => task.replace('_', ' ')).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Task Preferences</h4>
                  <button
                    onClick={() => setEditingService({ type: 'preferences', service })}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Edit task preferences"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {taskTypes.map(task => (
                    <div key={task} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-600">{task.replace('_', ' ')}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        service.taskPreferences[task] ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {service.serviceName === 'agentic' && service.serviceConfig && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Service Configuration</h4>
                  <button
                    onClick={() => setEditingService({ type: 'config', service })}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Edit service configuration"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Timeout:</span>
                    <div className="font-medium">{service.serviceConfig.timeout}s</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Marginalia:</span>
                    <div className={`font-medium ${service.serviceConfig.includeMarginalia ? 'text-green-600' : 'text-red-600'}`}>
                      {service.serviceConfig.includeMarginalia ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Metadata:</span>
                    <div className={`font-medium ${service.serviceConfig.includeMetadataInMarkdown ? 'text-green-600' : 'text-red-600'}`}>
                      {service.serviceConfig.includeMetadataInMarkdown ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Pages:</span>
                    <div className="font-medium">{service.serviceConfig.pages || 'All'}</div>
                  </div>
                </div>
              </div>
            )}

            {editingService?.service._id === service._id && (
              <>
                {editingService.type === 'apikey' && (
                  <ApiKeyEditor 
                    service={service} 
                    onSave={handleUpdateApiKey}
                  />
                )}
                {editingService.type === 'preferences' && (
                  <TaskPreferenceEditor 
                    service={service} 
                    onSave={handleUpdateTaskPreferences}
                  />
                )}
                {editingService.type === 'config' && (
                  <ServiceConfigEditor 
                    service={service} 
                    onSave={handleUpdateServiceConfig}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Bot size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No AI services configured yet.</p>
          <p className="text-sm text-gray-500">Click "Add Service" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default AiServiceManager;