import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import BulkUploadAISWBModal from './BulkUploadAISWBModal';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const AISWBSets = ({ topicId, onSetSelect }) => {
  const [sets, setSets] = useState([]);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [editingSet, setEditingSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => {
    fetchSets();
  }, [topicId]);

  const toLocalInput = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const fetchSets = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`https://test.ailisher.com/api/aiswb/topic/${topicId}/sets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(data.sets);
        setSets(data.sets || []);
      } else {
        setError(data.message || 'Failed to fetch sets');
      }
    } catch (error) {
      console.error('Error fetching sets:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = async () => {
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }
    // Validate schedule
    if (startsAt && endsAt) {
      const s = new Date(startsAt);
      const e = new Date(endsAt);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        toast.error('Invalid date/time');
        return;
      }
      if (e <= s) {
        toast.error('End time must be after start time');
        return;
      }
    }

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://test.ailisher.com/api/aiswb/topic/${topicId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newSetName.trim(),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSets(prevSets => [...prevSets, data.set]);
        setNewSetName('');
        setStartsAt('');
        setEndsAt('');
        setShowAddSetModal(false);
        toast.success('Set created successfully');
      } else {
        toast.error(data.message || 'Failed to create set');
      }
    } catch (error) {
      console.error('Error creating set:', error);
      toast.error('Failed to connect to the server');
    }
  };

  const handleDeleteSet = (setId) => {
    setSetToDelete(setId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSet = async () => {
    if (!setToDelete) return;
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      const response = await fetch(`https://test.ailisher.com/api/aiswb/topic/${topicId}/sets/${setToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSets(prevSets => prevSets.filter(set => set.id !== setToDelete));
        toast.success('Set deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete set');
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error('Failed to connect to the server');
    } finally {
      setShowDeleteModal(false);
      setSetToDelete(null);
    }
  };

  const handleEditSet = (setId) => {
    const setToEdit = sets.find(set => set.id === setId);
    if (setToEdit) {
      setEditingSet(setToEdit);
      setNewSetName(setToEdit.name);
      setStartsAt(toLocalInput(setToEdit.startsAt));
      setEndsAt(toLocalInput(setToEdit.endsAt));
      setShowAddSetModal(true);
    }
  };

  const handleUpdateSet = async () => {
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }
    // Validate schedule
    if (startsAt && endsAt) {
      const s = new Date(startsAt);
      const e = new Date(endsAt);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        toast.error('Invalid date/time');
        return;
      }
      if (e <= s) {
        toast.error('End time must be after start time');
        return;
      }
    }

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://test.ailisher.com/api/aiswb/topic/${topicId}/sets/${editingSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newSetName.trim(),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSets(prevSets => prevSets.map(set => 
          set.id === editingSet.id ? data.set : set
        ));
        setNewSetName('');
        setStartsAt('');
        setEndsAt('');
        setShowAddSetModal(false);
        setEditingSet(null);
        toast.success('Set updated successfully');
      } else {
        toast.error(data.message || 'Failed to update set');
      }
    } catch (error) {
      console.error('Error updating set:', error);
      toast.error('Failed to connect to the server');
    }
  };

  const toggleEnable = async (id, nextEnabled) => {
    const token = Cookies.get('usertoken');
    // Optimistic update
    const prev = sets;
    setSets(prevSets => prevSets.map(s => s.id === id ? { ...s, isEnabled: nextEnabled } : s));
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/aiswb/topic/${topicId}/sets/${id}`,
        { isEnabled: nextEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data?.set || null;
      if (updated) {
        setSets(prevSets => prevSets.map(s => s.id === id ? updated : s));
      }
      toast.success(`Set ${nextEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle enable:', error);
      // rollback
      setSets(prev);
      toast.error('Failed to update set status');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Subjective Sets</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSet(null);
              setNewSetName('');
              setStartsAt('');
              setEndsAt('');
              setShowAddSetModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Add New Set</span>
          </button>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            <span>Bulk Upload from Excel</span>
          </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No sets created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <button
                  onClick={() => onSetSelect(set)}
                  className="flex items-center text-gray-800 hover:text-indigo-600 transition-colors"
                >
                  <ChevronRight size={20} className="mr-2" />
                  <span className="font-medium">{set.name}</span>
                </button>
                {(set.startsAt || set.endsAt) && (
                  <div className="ml-8 mt-1 text-xs text-gray-600">
                    {(() => {
                      const now = new Date();
                      const start = set.startsAt ? new Date(set.startsAt) : null;
                      const end = set.endsAt ? new Date(set.endsAt) : null;
                      const fmt = (d) => d ? new Date(d).toLocaleString() : null;
                      let badgeText = 'Always available';
                      let badgeClass = 'bg-gray-100 text-gray-700';
                      let details = '';

                      if (start && start > now) {
                        badgeText = 'Upcoming';
                        badgeClass = 'bg-yellow-100 text-yellow-800';
                        details = `Starts: ${fmt(start)}`;
                      } else if (end && end <= now) {
                        badgeText = 'Ended';
                        badgeClass = 'bg-red-100 text-red-800';
                        details = `Ended: ${fmt(end)}`;
                      } else if ((start ? start <= now : true) && (end ? end > now : true)) {
                        badgeText = 'Live';
                        badgeClass = 'bg-green-100 text-green-800';
                        details = `${start ? `From: ${fmt(start)}` : ''}${start && end ? ' · ' : ''}${end ? `Until: ${fmt(end)}` : ''}`;
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded ${badgeClass}`}>{badgeText}</span>
                          {details ? <span className="text-gray-600">{details}</span> : null}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer select-none">
                  <span className={`mr-2 text-xs px-2 py-0.5 rounded ${set.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                    {set.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={!!set.isEnabled}
                    onChange={(e) => toggleEnable(set.id, e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                    onClick={(ev) => ev.stopPropagation()}
                  />
                </label>
                <button
                  onClick={() => handleEditSet(set.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteSet(set.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingSet ? 'Edit Set' : 'Add New Set'}
            </h3>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Enter set name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Starts At</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ends At</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddSetModal(false);
                  setEditingSet(null);
                  setNewSetName('');
                  setStartsAt('');
                  setEndsAt('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingSet ? handleUpdateSet : handleAddSet}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingSet ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkUploadModal && (
        <BulkUploadAISWBModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          topicId={topicId}
          existingSets={sets}
          onUploadComplete={() => fetchSets()}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Set</h3>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this set? All questions in this set will be deleted.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSetToDelete(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSet}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISWBSets; 
