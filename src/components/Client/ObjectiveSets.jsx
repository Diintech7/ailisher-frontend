import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const ObjectiveSets = ({ topicId, onSetSelect }) => {
  const [sets, setSets] = useState([]);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [editingSet, setEditingSet] = useState(null);

  const getLocalStorageKey = () => `objective_sets_${topicId}`;

  useEffect(() => {
    if (topicId) {
      try {
        const storedSets = localStorage.getItem(getLocalStorageKey());
        if (storedSets) {
          setSets(JSON.parse(storedSets));
        } else {
          setSets([]);
        }
      } catch (error) {
        console.error('Error fetching sets from local storage:', error);
        toast.error('Failed to load sets from local storage.');
        setSets([]);
      }
    }
  }, [topicId]);

  const saveSetsToLocalStorage = (updatedSets) => {
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedSets));
    } catch (error) {
      console.error('Error saving sets to local storage:', error);
      toast.error('Failed to save sets.');
    }
  };

  const handleAddSet = () => {
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }

    const newSet = {
      id: `set_${Date.now()}`,
      name: newSetName.trim(),
      createdAt: new Date().toISOString(),
      topicId: topicId,
    };

    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    saveSetsToLocalStorage(updatedSets);
    setNewSetName('');
    setShowAddSetModal(false);
    toast.success('Set created successfully');
  };

  const handleDeleteSet = (setId) => {
    if (window.confirm('Are you sure you want to delete this set? All questions in this set will be deleted.')) {
        const updatedSets = sets.filter(set => set.id !== setId);
        setSets(updatedSets);
        saveSetsToLocalStorage(updatedSets);
        
        try {
            localStorage.removeItem(`objective_questions_${setId}`);
        } catch (error) {
            console.error('Error deleting questions from local storage:', error);
            toast.error('Failed to delete questions for the set.');
        }
        
        toast.success('Set deleted successfully');
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

  const handleUpdateSet = () => {
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }

    const updatedSets = sets.map(set =>
      set.id === editingSet.id ? { ...set, name: newSetName.trim() } : set
    );

    setSets(updatedSets);
    saveSetsToLocalStorage(updatedSets);
    setNewSetName('');
    setShowAddSetModal(false);
    setEditingSet(null);
    toast.success('Set updated successfully');
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!topicId) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Please select a topic to see objective sets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Objective Sets</h2>
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
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No sets created yet for this topic.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-grow">
                <button
                  onClick={() => onSetSelect(set)}
                  className="flex items-center text-gray-800 hover:text-indigo-600 transition-colors w-full text-left"
                >
                  <ChevronRight size={20} className="mr-2" />
                  <div>
                    <span className="font-medium">{set.name}</span>
                    <p className="text-sm text-gray-500">{formatDate(set.createdAt)}</p>
                  </div>
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
    </div>
  );
};

export default ObjectiveSets; 