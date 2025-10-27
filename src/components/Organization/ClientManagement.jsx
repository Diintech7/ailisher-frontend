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
  ToggleRight,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import AddClientModal from "./AddClientModal";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loginLoading, setLoginLoading] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [selectedClient, setSelectedClient] = useState(null);
  const token = Cookies.get("orgtoken");
console.log("token",token)
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset selectedClient when modal closes
  useEffect(() => {
    if (!showAddClientModal) {
      setSelectedClient(null);
    }
  }, [showAddClientModal]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/organizations/clients`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("response",response.data);
      // Backend returns { success: true, data: [...] }
      setClients(Array.isArray(response.data?.data) ? response.data.data : []);
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
      const response = await axios.delete(
        `${API_BASE_URL}/api/organizations/clients/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("response",response.data);
      setClients((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (client) => client.id !== id
        )
      );
      if(response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
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
        `https://test.ailisher.com/api/admin/clients/${id}/status`,
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

  const handleToggleStatus = async (client) => {
    try {
      const newEnabled = !client.isEnabled;
      const response = await axios.patch(
        `${API_BASE_URL}/api/organizations/clients/${client.id}/toggle-status`,
        { isEnabled: newEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        // Update the client in the local state
        setClients(prevClients =>
          prevClients.map(c =>
            c.id === client.id
              ? { ...c, isEnabled: response.data.client.isEnabled }
              : c
          )
        );
        setError(null);
      }
    } catch (err) {
      setError("Failed to toggle client status");
      console.error("Error toggling client status:", err);
    }
  };

  const handleClientLogin = async (client) => {
    try {
      setLoginLoading(client.id);
      // Open tab synchronously to avoid popup blockers
      const newTab = window.open("about:blank", "_blank");

      const response = await axios.post(
        `${API_BASE_URL}/api/organizations/clients/${client.id}/login-token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response.data);

      if (response.data?.success) {
        const clientToken = response.data.token;
        const clientData = {
          role: response.data.user.role,
          name: response.data.user.name,
        };

        const dashboardUrl = `${window.location.origin}/dashboard`;

        if (newTab) {
          newTab.document.open();
          newTab.document.write(`
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to client dashboard...</title>
  </head>
  <body>
    <p>Redirecting to client dashboard...</p>
    <script>
      document.cookie = "usertoken=${clientToken}; path=/; max-age=18000";
      document.cookie = "user=${encodeURIComponent(JSON.stringify(clientData))}; path=/; max-age=18000";
      window.location.replace(${JSON.stringify(dashboardUrl)});
    <\/script>
  </body>
</html>
          `);
          newTab.document.close();
        } else {
          // Fallback if popup blocked
          document.cookie = `usertoken=${clientToken}; path=/; max-age=18000`;
          document.cookie = `user=${encodeURIComponent(JSON.stringify(clientData))}; path=/; max-age=18000`;
          window.location.replace(dashboardUrl);
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
    console.log(id)
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const normalizedClients = Array.isArray(clients) ? clients : [];
  const filteredClients = normalizedClients
    .filter((client) => {
      const name = (client.businessName || client.name || "").toLowerCase();
      const email = (client.email || "").toLowerCase();
      const term = (searchTerm || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    })
    .sort((a, b) => {
      let aVal;
      let bVal;
      switch (sortField) {
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        case "name":
          aVal = (a.businessName || a.name || "").toLowerCase();
          bVal = (b.businessName || b.name || "").toLowerCase();
          break;
        case "status":
          aVal = a.isEnabled === true ? "enabled" : a.isEnabled === false ? "disabled" : "pending";
          bVal = b.isEnabled === true ? "enabled" : b.isEnabled === false ? "disabled" : "pending";
          break;
        default:
          aVal = (a[sortField] ?? "").toString().toLowerCase();
          bVal = (b[sortField] ?? "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
console.log("clients",filteredClients)
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
    <div className="bg-white rounded-lg shadow-md p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
          onClick={() => {
            setModalMode("create");
            setSelectedClient(null);
            setShowAddClientModal(true);
          }}
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
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <select
            className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={`${sortField}:${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split(":");
              setSortField(field);
              setSortDirection(direction);
            }}
          >
            <option value="name:asc">A-Z</option>
            <option value="name:desc">Z-A</option>
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-screen">
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
                <tr key={client.clientId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden shadow-sm border border-gray-200">
  {client.businessLogo ? (
    <img
      src={client.businessLogo}
      alt={client.businessName || client.name || "Client"}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-lg font-semibold text-gray-700">
      {(client.businessName || client.name)?.charAt(0).toUpperCase()}
    </span>
  )}
</div>

                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.businessName || client.name || ""}
                          </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.isEnabled === true
                          ? "bg-green-100 text-green-800"
                          : client.isEnabled === false
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {client.isEnabled === true ? "Enabled" : client.isEnabled === false ? "Disabled" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {client.id === confirmDelete ? (
                        <>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
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
                            onClick={() => handleClientLogin(client)}
                            className="text-green-600 hover:text-green-900 p-1"
                            disabled={loginLoading === client.id}
                            title="Login as client"
                          >
                            {loginLoading === client.id ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <LogIn size={18} />
                            )}
                          </button>
                          
                          <div className="relative inline-block text-left">
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1"
                              onClick={() => toggleDropdown(client.id)}
                            >
                              <MoreVertical size={18} />
                            </button>
                            {dropdownOpen === client.id && (
                              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                  <button
                                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left flex items-center"
                                    title="Edit client"
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setModalMode("edit");
                                      setShowAddClientModal(true);
                                      setDropdownOpen(null);
                                    }}
                                  >
                                    <Edit size={16} className="mr-2" />
                                    Edit Client
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleStatus(client);
                                      setDropdownOpen(null);
                                    }}
                                    className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left flex items-center ${
                                      client.isEnabled === true
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}
                                    title={client.isEnabled === true ? 'Disable client' : 'Enable client'}
                                  >
                                    <ToggleRight size={16} className="mr-2" />
                                    {client.isEnabled === true ? 'Disable Client' : 'Enable Client'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmDelete(client.id);
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
        key={`${modalMode}-${selectedClient?.id || 'new'}`}
        isOpen={showAddClientModal}
        mode={modalMode}
        initialData={selectedClient}
        clientId={selectedClient?.id}
        onClose={() => {setShowAddClientModal(false);setSelectedClient(null);}}
        onClientAdded={handleClientAdded}
      />
      
    </div>
  );
};

export default ClientManagement;
