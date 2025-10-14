import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { API_BASE_URL } from '../../config'
import AddClientModal from './AddClientModal'
import { MoreVertical } from 'lucide-react'

export default function ClientManagement() {
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    businessName: '',
    businessOwnerName: '',
    email: '',
    businessNumber: '',
    businessGSTNumber: '',
    businessPANNumber: '',
    businessMobileNumber: '',
    businessCategory: '',
    businessAddress: '',
    city: '',
    pinCode: '',
    businessLogo: '',
    businessWebsite: '',
    businessYoutubeChannel: '',
    turnOverRange: ''
  })

  useEffect(() => {
    const orgData = Cookies.get('organization')
    if (orgData) {
      try {
        setOrg(JSON.parse(orgData))
      } catch (e) {
        setOrg(null)
      }
    }
  }, [])

  useEffect(() => {
    if (org) fetchClients()
  }, [org])

  const fetchClients = async () => {
    setLoading(true)
    setError('')
    try {
      const token = Cookies.get('orgtoken')
      const res = await fetch(`${API_BASE_URL}/api/organizations/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load clients')
      setClients(Array.isArray(data.data) ? data.data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const token = Cookies.get('orgtoken')
      const res = await fetch(`${API_BASE_URL}/api/organizations/clients/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create client')
      // Refresh list
      await fetchClients()
      // Reset form
      setCreateForm({
        businessName: '',
        businessOwnerName: '',
        email: '',
        businessNumber: '',
        businessGSTNumber: '',
        businessPANNumber: '',
        businessMobileNumber: '',
        businessCategory: '',
        businessAddress: '',
        city: '',
        pinCode: '',
        businessLogo: '',
        businessWebsite: '',
        businessYoutubeChannel: '',
        turnOverRange: ''
      })
      // Close modal on success
      setIsAddModalOpen(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleClientAdded = () => {
    fetchClients();
  };

  const handleUpdateClient = async (clientId, updates) => {
    setError('')
    try {
      const token = Cookies.get('orgtoken')
      const res = await fetch(`${API_BASE_URL}/api/organizations/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update client')
      await fetchClients()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRemoveClient = async (clientId) => {
    setError('')
    try {
      const token = Cookies.get('orgtoken')
      const res = await fetch(`${API_BASE_URL}/api/organizations/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove client')
      await fetchClients()
    } catch (e) {
      setError(e.message)
    }
  }

  const setField = (field, value) => setCreateForm((p) => ({ ...p, [field]: value }))

  const openEditModal = (client) => {
    setEditingClient({
      businessName: client.businessName || client.name || '',
      businessOwnerName: client.businessOwnerName || '',
      email: client.email || '',
      businessNumber: client.businessNumber || '',
      businessGSTNumber: client.businessGSTNumber || '',
      businessPANNumber: client.businessPANNumber || '',
      businessMobileNumber: client.businessMobileNumber || '',
      businessCategory: client.businessCategory || '',
      businessAddress: client.businessAddress || '',
      city: client.city || '',
      pinCode: client.pinCode || '',
      businessLogo: client.businessLogo || '',
      businessWebsite: client.businessWebsite || '',
      businessYoutubeChannel: client.businessYoutubeChannel || '',
      turnOverRange: client.turnOverRange || ''
    })
    setIsAddModalOpen(true)
  }

  const closeModal = () => {
    setIsAddModalOpen(false)
    setEditingClient(null)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Clients</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchClients}
              className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Add Client
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-600">Loading clients...</div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Business</th>
                  <th className="px-4 py-2 text-left font-medium">Contact</th>
                  <th className="px-4 py-2 text-left font-medium">City</th>
                  <th className="px-4 py-2 text-left font-medium">Role</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={6}>No clients yet</td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.clientId} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-800">{c.businessName || c.name}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-2">{c.businessMobileNumber || '-'}</td>
                    <td className="px-4 py-2">{c.city || '-'}</td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded-md border px-2 py-1 text-xs"
                        value={c.role || 'member'}
                        onChange={(e) => handleUpdateClient(c.clientId, { role: e.target.value })}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded-md border px-2 py-1 text-xs"
                        value={c.status || 'active'}
                        onChange={(e) => handleUpdateClient(c.clientId, { status: e.target.value })}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </td>
                <td className="px-4 py-2 text-right relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === c.clientId ? null : c.clientId)}
                    className="inline-flex items-center rounded-md border px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpenId === c.clientId && (
                    <div className="absolute right-0 mt-2 w-32 rounded-md border bg-white shadow-md z-10">
                      <button
                        onClick={() => { setMenuOpenId(null); openEditModal(c); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setMenuOpenId(null); handleRemoveClient(c.clientId); }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        onClientAdded={handleClientAdded}
        mode={editingClient ? 'edit' : 'create'}
        initialData={editingClient || undefined}
        clientId={editingClient ? (clients.find(c => c.email === editingClient.email)?.clientId || null) : null}
      />
    </div>
  )
}
