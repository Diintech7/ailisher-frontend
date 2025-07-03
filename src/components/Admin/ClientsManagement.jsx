import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  UserX,
  LogIn,
  SettingsIcon,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import AddClientModal from "./AddClientModal";
import { useNavigate } from 'react-router-dom';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loginLoading, setLoginLoading] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const navigate = useNavigate();

  const handleconfig = (id) => {
    navigate(`/admin/configuration/${id}`);
  };
  
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("admintoken");
      const response = await axios.get(
        "https://aipbbackend-c5ed.onrender.com/api/admin/clients",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClients(response.data.clients);
      setError(null);
    } catch (err) {
      setError("Failed to fetch clients");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      const token = Cookies.get("admintoken");
      await axios.delete(
        `https://aipbbackend-c5ed.onrender.com/api/admin/clients/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClients(clients.filter((client) => client._id !== id));
      setConfirmDelete(null);
      setDropdownOpen(null);
    } catch (err) {
      setError("Failed to delete client");
      console.error("Error deleting client:", err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = Cookies.get("admintoken");
      const response = await axios.put(
        `https://aipbbackend-c5ed.onrender.com/api/admin/clients/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClients(
        clients.map((client) =>
          client._id === id ? response.data.client : client
        )
      );
    } catch (err) {
      setError("Failed to update client status");
      console.error("Error updating client status:", err);
    }
  };

  const handleClientLogin = async (id) => {
    try {
      setLoginLoading(id);
      const adminToken = Cookies.get("admintoken");

      const response = await axios.post(
        `https://aipbbackend-c5ed.onrender.com/api/admin/clients/${id}/login-token`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (response.data.success) {
        const clientToken = response.data.token;
        const clientData = {
          role: response.data.user.role,
          name: response.data.user.name,
        };

        const newTab = window.open("", "_blank");

        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <title>Redirecting to client dashboard...</title>
              </head>
              <body>
                <p>Redirecting to client dashboard...</p>
                <script>
                  document.cookie = "usertoken=${clientToken}; path=/; max-age=3600";
                  document.cookie = "user=${encodeURIComponent(
                    JSON.stringify(clientData)
                  )}; path=/; max-age=3600";
                  window.location.href = 'https://www.ailisher.com/dashboard';
                </script>
              </body>
            </html>
          `);
          newTab.document.close();
        }
      }
    } catch (err) {
      setError("Failed to login as client");
      console.error("Error logging in as client:", err);
    } finally {
      setLoginLoading(null);
    }
  };

  const handleClientAdded = () => {
    fetchClients();
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const filteredClients = clients
    .filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  if (loading)
    return <div className="flex justify-center p-8">Loading clients...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
          onClick={() => setShowAddClientModal(true)}
        >
          <UserPlus size={16} className="mr-2" />
          Add New Client
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search clients by name or email"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Business Name {getSortIcon("name")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email {getSortIcon("email")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center">
                  Created On {getSortIcon("createdAt")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status {getSortIcon("status")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.businessName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === "active"
                          ? "bg-green-100 text-green-800"
                          : client.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {client.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {client._id === confirmDelete ? (
                        <>
                          <button
                            onClick={() => handleDeleteClient(client._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Confirm delete"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-4 py-2 text-black rounded-md transition-colors"
                            onClick={() => handleconfig(client._id)}
                          >
                            <SettingsIcon size={18}/>
                          </button>
                          <button
                            onClick={() => handleClientLogin(client._id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            disabled={loginLoading === client._id}
                            title="Login as client"
                          >
                            {loginLoading === client._id ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <LogIn size={18} />
                            )}
                          </button>
                          <div className="relative inline-block text-left">
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1"
                              onClick={() => toggleDropdown(client._id)}
                            >
                              <MoreVertical size={18} />
                            </button>
                            {dropdownOpen === client._id && (
                              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                  <button
                                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left flex items-center"
                                    title="Edit client"
                                  >
                                    <Edit size={16} className="mr-2" />
                                    Edit Client
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmDelete(client._id);
                                      setDropdownOpen(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Client
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
};

export default ClientManagement;
