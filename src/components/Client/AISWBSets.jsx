import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import BulkUploadAISWBModal from './BulkUploadAISWBModal';

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

  useEffect(() => {
    fetchSets();
  }, [topicId]);

  const fetchSets = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
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

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSetName.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setSets(prevSets => [...prevSets, data.set]);
        setNewSetName('');
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
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets/${setToDelete}`, {
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
      setShowAddSetModal(true);
    }
  };

  const handleUpdateSet = async () => {
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/aiswb/topic/${topicId}/sets/${editingSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSetName.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setSets(prevSets => prevSets.map(set => 
          set.id === editingSet.id ? data.set : set
        ));
        setNewSetName('');
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
              </div>
              <div className="flex items-center space-x-2">
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
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddSetModal(false);
                  setEditingSet(null);
                  setNewSetName('');
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
