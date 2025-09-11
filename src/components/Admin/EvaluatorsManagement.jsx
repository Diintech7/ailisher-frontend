import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import axios from 'axios';

const EvaluatorsManagement = () => {
  const [evaluators, setEvaluators] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const [formErrors, setFormErrors] = useState({});

  const [approveFormData, setApproveFormData] = useState({
    mobile: '',
    email: '',
    name: '',
    subjectMatterExpert: '',
    examFocus: '',
    experience: '',
    grade: '',
    clientAccess: []
  });

  useEffect(() => {
    fetchEvaluators();
    fetchClients();
    fetchUsers();
  }, []);

  const fetchEvaluators = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://test.ailisher.com/api/evaluators', {
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

      const response = await fetch('https://test.ailisher.com/api/admin/clients', {
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

  const fetchUsers = async () => {
    try {
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('https://test.ailisher.com/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    } else if (name === 'email') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase()
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must not exceed 50 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    
    if (!formData.subjectMatterExpert || formData.subjectMatterExpert.trim().length < 2) {
      errors.subjectMatterExpert = 'Subject matter expert must be at least 2 characters long';
    } else if (formData.subjectMatterExpert.trim().length > 100) {
      errors.subjectMatterExpert = 'Subject matter expert must not exceed 100 characters';
    }
    
    if (!formData.examFocus || formData.examFocus.trim().length < 2) {
      errors.examFocus = 'Exam focus must be at least 2 characters long';
    } else if (formData.examFocus.trim().length > 100) {
      errors.examFocus = 'Exam focus must not exceed 100 characters';
    }
    
    const experience = Number(formData.experience);
    if (!formData.experience || isNaN(experience)) {
      errors.experience = 'Experience is required';
    } else if (experience < 0) {
      errors.experience = 'Experience cannot be negative';
    } else if (experience > 50) {
      errors.experience = 'Experience cannot exceed 50 years';
    }
    
    if (!formData.grade || !['1st grade', '2nd grade', '3rd grade'].includes(formData.grade)) {
      errors.grade = 'Please select a valid grade';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const evaluatorData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        subjectMatterExpert: formData.subjectMatterExpert.trim(),
        examFocus: formData.examFocus.trim(),
        experience: Number(formData.experience),
        grade: formData.grade,
        clientAccess: formData.clientAccess.map(client => ({
          id: client.id,
          name: client.name
        })),
        status: 'PENDING'
      };

      const response = await fetch('https://test.ailisher.com/api/evaluators', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluatorData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
          const errors = data.errors.reduce((acc, err) => ({
            ...acc,
            [err.field]: err.message
          }), {});
          setFormErrors(errors);
          throw new Error('Validation error');
        }
        throw new Error(data.message || 'Failed to create evaluator');
      }

      if (data.success) {
        await fetchEvaluators();
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
        setFormErrors({});
        setError(null);
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

        const response = await fetch(`https://test.ailisher.com/api/evaluators/${evaluatorId}`, {
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
          await fetchEvaluators();
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

      const response = await fetch(`https://test.ailisher.com/api/evaluators/${selectedEvaluator._id}`, {
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
        await fetchEvaluators();
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

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Validate that either email or mobile is provided
      if (!approveFormData.email && !approveFormData.mobile) {
        setError('Please provide either email or mobile number');
        return;
      }

      // // Validate name
      // if (!approveFormData.name || approveFormData.name.trim().length === 0) {
      //   setError('Please provide the user\'s name');
      //   return;
      // }

      // Log the data being sent
      console.log('Sending data:', {
        // name: approveFormData.name.trim(),
        email: approveFormData.email ? approveFormData.email.toLowerCase() : '',
        mobile: approveFormData.mobile
      });

      const response = await fetch('https://test.ailisher.com/api/clients/CLI677117YN7N/mobile/evaluations/addexistinguserasevaluator', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // name: approveFormData.name.trim(),
          email: approveFormData.email ? approveFormData.email.toLowerCase() : '',
          mobile: approveFormData.mobile
        })
      });

      const data = await response.json();
      
      // Log the response data
      console.log('Response data:', data);
      
      if (!response.ok) {
        // Handle specific error cases
        if (data.message.includes('already exists')) {
          setError('This user is already registered as an evaluator');
        } else if (data.message.includes('not found')) {
          setError('User not found. Please ask them to sign up first');
        } else {
          setError(data.message || 'Failed to approve evaluator');
        }
        return;
      }

      if (data.success) {
        await fetchEvaluators();
        setShowApproveModal(false);
        setApproveFormData({
          mobile: '',
          email: '',
          // name: ''
        });
        toast.success('User approved as evaluator successfully');
      }
    } catch (error) {
      console.error('Error approving evaluator:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to approve evaluator');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
    setApproveFormData(prev => ({
      ...prev,
        userId: user._id
      }));
    }
  };

  const handleVerify = async (evaluatorId) => {
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://test.ailisher.com/api/evaluators/${evaluatorId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update evaluator status');
      }

      if (data.success) {
        toast.success(data.message);
        await fetchEvaluators(); // Refresh the list
        setShowVerifyModal(false);
        setSelectedEvaluator(null);
      }
    } catch (error) {
      console.error('Error updating evaluator status:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Verified
          </span>
        );
      case 'NOT_VERIFIED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Not Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
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

  const handleToggleStatus = async (evaluatorId, currentStatus) => {
    try {
      setLoading(true);
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://test.ailisher.com/api/evaluators/${evaluatorId}/togglestatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update evaluator status');
      }

      if (data.success) {
        toast.success(data.message);
        await fetchEvaluators(); // Refresh the list to get updated data
      }
    } catch (error) {
      console.error('Error toggling evaluator status:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Evaluators Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Existing User as Evaluator
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Evaluator
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search evaluators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEvaluators.map((evaluator) => (
              <tr key={evaluator._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{evaluator.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{evaluator.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{evaluator.phoneNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(evaluator.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={evaluator.enabled}
                      onChange={() => handleToggleStatus(evaluator._id, evaluator.enabled)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {(evaluator.status === 'PENDING' || evaluator.status === 'NOT_VERIFIED') && (
                      <button
                        onClick={() => {
                          setSelectedEvaluator(evaluator);
                          setShowVerifyModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Verify"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {evaluator.status === 'VERIFIED' && (
                      <button
                        onClick={() => {
                          setSelectedEvaluator(evaluator);
                          setShowVerifyModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Mark as Not Verified"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(evaluator)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(evaluator._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showVerifyModal && selectedEvaluator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">
              {selectedEvaluator.status === 'VERIFIED' ? 'Mark as Not Verified' : 'Verify Evaluator'}
            </h2>
            <p className="mb-4">
              Are you sure you want to {selectedEvaluator.status === 'VERIFIED' ? 'mark this evaluator as not verified' : 'verify this evaluator'}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedEvaluator(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(selectedEvaluator._id)}
                className={`px-4 py-2 rounded ${
                  selectedEvaluator.status === 'VERIFIED'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                disabled={loading}
              >
                {loading ? 'Processing...' : selectedEvaluator.status === 'VERIFIED' ? 'Mark as Not Verified' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedEvaluator ? 'Edit Evaluator' : 'Add New Evaluator'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                    maxLength={10}
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Matter Expert *</label>
                  <input
                    type="text"
                    name="subjectMatterExpert"
                    value={formData.subjectMatterExpert}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.subjectMatterExpert ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.subjectMatterExpert && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.subjectMatterExpert}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Focus *</label>
                  <input
                    type="text"
                    name="examFocus"
                    value={formData.examFocus}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.examFocus ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.examFocus && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.examFocus}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.experience ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                    min="0"
                    max="50"
                  />
                  {formErrors.experience && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.experience}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.grade ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="">Select Grade</option>
                    <option value="1st grade">1st Grade</option>
                    <option value="2nd grade">2nd Grade</option>
                    <option value="3rd grade">3rd Grade</option>
                  </select>
                  {formErrors.grade && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.grade}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Access</label>
                <div className="grid grid-cols-2 gap-2">
                  {clients.map(client => (
                    <div key={client._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`client-${client._id}`}
                        checked={formData.clientAccess.some(c => c.id === client._id)}
                        onChange={() => handleClientSelection(client._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`client-${client._id}`} className="ml-2 text-sm text-gray-700">
                        {client.businessName}
                    </label>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
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
                    setFormErrors({});
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (selectedEvaluator ? 'Update Evaluator' : 'Add Evaluator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Existing User as Evaluator</h2>
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={approveFormData.name}
                  onChange={(e) => setApproveFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border ${error && !approveFormData.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                  placeholder="Enter user's full name"
                />
                {error && !approveFormData.name && (
                  <p className="mt-1 text-sm text-red-600">Name is required</p>
                )}
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={approveFormData.email}
                  onChange={(e) => setApproveFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                  className={`w-full px-3 py-2 border ${error && !approveFormData.email && !approveFormData.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter user's email"
                />
              </div>

              <div className="text-center text-gray-500 font-medium">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={approveFormData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setApproveFormData(prev => ({ ...prev, mobile: value }));
                  }}
                  className={`w-full px-3 py-2 border ${error && !approveFormData.email && !approveFormData.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div className="text-sm text-gray-500 mt-2">
                * Please provide either email or mobile number along with name to find the user
              </div>

              {error && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setApproveFormData({
                      mobile: '',
                      email: '',
                      // name: ''
                    });
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (!approveFormData.email && !approveFormData.mobile)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Approving...' : 'Approve as Evaluator'}
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