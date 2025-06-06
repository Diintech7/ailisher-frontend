import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, Edit, Trash2, AlertCircle, ChevronRight, Activity, MessageCircle, FileText, ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    conversationsCount: 0,
    documentsCount: 0,
    lastActiveDate: null
  });

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get admin token from cookies
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/admin/clients/${clientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }

      const data = await response.json();
      setClient(data.client);
      
      // Set mock stats for now - in a real app, this would come from the API
      setStats({
        conversationsCount: Math.floor(Math.random() * 50),
        documentsCount: Math.floor(Math.random() * 20),
        lastActiveDate: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError(err.message || 'Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsClient = async () => {
    try {
      // Get admin token from cookies
      const token = Cookies.get('admintoken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/admin/login-as-client/${clientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to login as client');
      }

      const data = await response.json();
      
      // Store client token in a separate cookie
      Cookies.set('clienttoken', data.token, { path: '/' });
      Cookies.set('clientUser', JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: 'client'
      }), { path: '/' });

      // Open client dashboard in a new window
      window.open('/client/dashboard', '_blank');
    } catch (err) {
      console.error('Error logging in as client:', err);
      setError(err.message || 'Failed to login as client. Please try again.');
    }
  };

  const handleEditClient = () => {
    navigate(`/admin/clients/edit/${clientId}`);
  };

  const handleDeleteClient = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      // Implement delete functionality
      console.log('Delete client:', clientId);
      // After successful deletion, navigate back to clients list
      navigate('/admin/clients');
    }
  };

  const handleBack = () => {
    navigate('/admin/clients');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button 
          className="mt-4 px-4 py-2 text-blue-600 flex items-center hover:underline"
          onClick={handleBack}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Clients
        </button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-yellow-500 mr-2" />
            <p className="text-yellow-700">Client not found</p>
          </div>
        </div>
        <button 
          className="mt-4 px-4 py-2 text-blue-600 flex items-center hover:underline"
          onClick={handleBack}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-8">
      {/* Back button */}
      <button 
        className="mb-6 px-4 py-2 text-blue-600 flex items-center hover:underline"
        onClick={handleBack}
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Clients
      </button>

      {/* Client Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-medium">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
              <div className="flex items-center text-gray-600">
                <Mail size={16} className="mr-2" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Calendar size={16} className="mr-2" />
                <span>Client since: {new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleLoginAsClient}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center hover:bg-green-700 transition-colors"
              title="Login as Client"
            >
              <ArrowRight size={20} className="mr-2" />
              Login as Client
            </button>
            <button
              onClick={handleEditClient}
              className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Edit Client"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleDeleteClient}
              className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete Client"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Conversations</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.conversationsCount}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageCircle size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.documentsCount}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FileText size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Active</p>
              <h3 className="text-lg font-bold text-gray-800">
                {stats.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString() : 'Never'}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="p-6">
          {/* Mock activity list - in a real app, this would come from the API */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="mb-4 last:mb-0">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <MessageCircle size={18} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-800">Started a new conversation: "Project Discussion {item}"</p>
                  <p className="text-sm text-gray-500">
                    {new Date(Date.now() - item * 86400000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-4 text-right">
            <button className="text-blue-600 flex items-center hover:underline ml-auto">
              View all activity
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;