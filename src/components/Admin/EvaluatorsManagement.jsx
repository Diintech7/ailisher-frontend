import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Cookies from 'js-cookie';

const EvaluatorsManagement = () => {
  const [evaluators, setEvaluators] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subjectMatterExpert: '',
    examFocus: '',
    experience: '',
    grade: '',
    clientAccess: []
  });

  useEffect(() => {
    fetchEvaluators();
    fetchClients();
  }, []);

  const fetchEvaluators = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/evaluators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch evaluators');
      }

      const data = await response.json();
      if (data.success && data.evaluators) {
        setEvaluators(data.evaluators);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching evaluators:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      if (data.success && data.clients) {
        setClients(data.clients);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleClientSelection = (clientId) => {
    const selectedClient = clients.find(client => client._id === clientId);
    if (!selectedClient) return;

    setFormData(prev => {
      const isSelected = prev.clientAccess.some(client => client.id === clientId);
      if (isSelected) {
        return {
          ...prev,
          clientAccess: prev.clientAccess.filter(client => client.id !== clientId)
        };
      } else {
        return {
          ...prev,
          clientAccess: [...prev.clientAccess, {
            id: clientId,
            name: selectedClient.businessName
          }]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/evaluators', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create evaluator');
      }

      if (data.success) {
        await fetchEvaluators(); // Refresh the list
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          subjectMatterExpert: '',
          examFocus: '',
          experience: '',
          grade: '',
          clientAccess: []
        });
      }
    } catch (error) {
      console.error('Error adding evaluator:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evaluatorId) => {
    if (window.confirm('Are you sure you want to delete this evaluator?')) {
      try {
        setLoading(true);
        const token = Cookies.get('admintoken');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/evaluators/${evaluatorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete evaluator');
        }

        if (data.success) {
          await fetchEvaluators(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting evaluator:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (evaluator) => {
    setSelectedEvaluator(evaluator);
    setFormData({
      name: evaluator.name,
      email: evaluator.email,
      phoneNumber: evaluator.phoneNumber,
      subjectMatterExpert: evaluator.subjectMatterExpert,
      examFocus: evaluator.examFocus,
      experience: evaluator.experience,
      grade: evaluator.grade,
      clientAccess: evaluator.clientAccess
    });
    setShowAddModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/evaluators/${selectedEvaluator._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update evaluator');
      }

      if (data.success) {
        await fetchEvaluators(); // Refresh the list
        setShowAddModal(false);
        setSelectedEvaluator(null);
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          subjectMatterExpert: '',
          examFocus: '',
          experience: '',
          grade: '',
          clientAccess: []
        });
      }
    } catch (error) {
      console.error('Error updating evaluator:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluators = evaluators.filter(evaluator => {
    const searchTerm = searchQuery.toLowerCase().trim();
    if (!searchTerm) return true;
    
    return (
      evaluator.name.toLowerCase().includes(searchTerm) ||
      evaluator.email.toLowerCase().includes(searchTerm) ||
      evaluator.subjectMatterExpert.toLowerCase().includes(searchTerm) ||
      evaluator.examFocus.toLowerCase().includes(searchTerm) ||
      evaluator.grade.toLowerCase().includes(searchTerm)
    );
  });

  if (loading && !evaluators.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Evaluators Management</h1>
        <button
          onClick={() => {
            setSelectedEvaluator(null);
            setFormData({
              name: '',
              email: '',
              phoneNumber: '',
              subjectMatterExpert: '',
              examFocus: '',
              experience: '',
              grade: '',
              clientAccess: []
            });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Add Evaluator
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, email, subject, exam focus or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Matter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Access</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvaluators.map((evaluator) => (
              <tr key={evaluator._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{evaluator.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{evaluator.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{evaluator.subjectMatterExpert}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{evaluator.grade}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {evaluator.clientAccess.map(client => (
                      <span 
                        key={client.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {client.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(evaluator)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(evaluator._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedEvaluator ? 'Edit Evaluator' : 'Add New Evaluator'}
            </h2>
            <form onSubmit={selectedEvaluator ? handleUpdate : handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {formData.phoneNumber && formData.phoneNumber.length !== 10 && (
                    <p className="mt-1 text-sm text-red-600">Please enter a valid 10-digit mobile number</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Matter Expert</label>
                  <input
                    type="text"
                    name="subjectMatterExpert"
                    value={formData.subjectMatterExpert}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Focus</label>
                  <input
                    type="text"
                    name="examFocus"
                    value={formData.examFocus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Grade</option>
                    <option value="1st grade">1st Grade</option>
                    <option value="2nd grade">2nd Grade</option>
                    <option value="3rd grade">3rd Grade</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Access</label>
                <div className="grid grid-cols-3 gap-2">
                  {clients.map((client) => (
                    <label key={client._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.clientAccess.some(c => c.id === client._id)}
                        onChange={() => handleClientSelection(client._id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{client.businessName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedEvaluator(null);
                    setFormData({
                      name: '',
                      email: '',
                      phoneNumber: '',
                      subjectMatterExpert: '',
                      examFocus: '',
                      experience: '',
                      grade: '',
                      clientAccess: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedEvaluator ? 'Update Evaluator' : 'Add Evaluator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluatorsManagement; 