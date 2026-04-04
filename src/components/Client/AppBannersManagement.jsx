import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layout, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import Cookies from 'js-cookie';
import BannerModal from './BannerModal';

const AppBannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('usertoken') || Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/banners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setBanners(result.data);
      } else {
        setError(result.message || 'Failed to fetch banners');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('An error occurred while loading banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const token = Cookies.get('usertoken') || Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        fetchBanners();
      } else {
        alert(result.message || 'Failed to delete banner');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete banner');
    }
  };

  const handleEdit = (banner) => {
    setSelectedBanner(banner);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  const BannerSection = ({ title, placement }) => {
    const sectionBanners = banners.filter(b => b.placement === placement);

    return (
      <div className="mb-8">
        <div className="flex items-center mb-4 border-b pb-2">
          <Layout className="text-blue-600 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800 capitalize">{title} Banners</h3>
          <span className="ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {sectionBanners.length} Active
          </span>
        </div>

        {sectionBanners.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-gray-500 text-sm italic">No {placement} banners configured yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionBanners.map((banner) => (
              <div key={banner._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-40 group">
                  <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  {!banner.isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Inactive</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(banner)}
                      className="p-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-blue-50"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(banner._id)}
                      className="p-2 bg-white text-red-600 rounded-full shadow-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Order: {banner.order}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {banner.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  {banner.redirectUrl && (
                    <p className="text-[10px] text-gray-500 mt-2 truncate max-w-full italic" title={banner.redirectUrl}>
                      🔗 {banner.redirectUrl}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center space-x-4 p-4">
          <button
            onClick={() => navigate('/tools')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Tools
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">App Banner Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage what banners show on your user app placements.</p>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            <span>Add New Banner</span>
          </button>
        </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center">
          <AlertCircle className="text-red-500 mr-3" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <BannerSection title="Top" placement="top" />
      <BannerSection title="Medium" placement="medium" />
      <BannerSection title="Bottom" placement="bottom" />

      <BannerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banner={selectedBanner}
        onBannerSaved={fetchBanners}
      />
    </div>
  </div>
);
};

export default AppBannersManagement;
