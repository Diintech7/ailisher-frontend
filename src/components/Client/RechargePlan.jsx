import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  ClipboardList, 
  Users, 
  Star, 
  Clock, 
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  X
} from 'lucide-react';

export default function RechargePlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  const navigate = useNavigate();
  const token = Cookies.get('usertoken');
  const baseHeaders = { 'Content-Type': 'application/json' };
  const authHeaders = token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans`, {
        method: 'GET',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load plans');
      setPlans(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePlan(planId) {
    if (!window.confirm('Delete this plan and its items?')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete plan');
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      if (detailOpen && detailPlan && detailPlan._id === planId) setDetailOpen(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function openPlanDetails(planId) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailPlan(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/client/credit-recharge-plans/${planId}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load plan');
      setDetailPlan(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function DiscountBadge({ mrp, offer }) {
    const discount = mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
    if (discount <= 0) return null;
    return (
      <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{discount}% off</span>
    );
  }

  function getItemIcon(itemType) {
    switch (itemType?.toLowerCase()) {
      case 'book':
        return <BookOpen className="w-5 h-5" />;
      case 'workbook':
        return <FileText className="w-5 h-5" />;
      case 'test':
      case 'objective test':
      case 'subjective test':
        return <ClipboardList className="w-5 h-5" />;
      case 'user':
        return <Users className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  }

  function getItemTypeColor(itemType) {
    switch (itemType?.toLowerCase()) {
      case 'book':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'workbook':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'test':
      case 'objective test':
      case 'subjective test':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'user':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Premium':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'Enterprise':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  }

  function getItemImageUrl(item) {
    console.log('Getting image for item:', {
      name: item.name,
      itemType: item.itemType,
      imageUrl: item.imageUrl,
      referencedItemImageUrl: item.referencedItemImageUrl,
      hasReferencedItem: !!item.referencedItem,
      referencedItem: item.referencedItem
    });
    
    // Priority order: referencedItemImageUrl > imageUrl > placeholder
    if (item.referencedItemImageUrl) {
      console.log('Using referencedItemImageUrl:', item.referencedItemImageUrl);
      return item.referencedItemImageUrl;
    }
    
    if (item.imageUrl) {
      console.log('Using imageUrl:', item.imageUrl);
      return item.imageUrl;
    }
    
    // Fallback to placeholder
    console.log('Using placeholder for:', item.name);
    return 'https://via.placeholder.com/200x150/cccccc/666666?text=' + encodeURIComponent(item.name || 'No+Image');
  }

  function getItemTitle(item) {
    // Use referenced item title if available, otherwise use plan item name
    if (item.referencedItem && item.referencedItem.title) {
      return item.referencedItem.title;
    }
    return item.name;
  }

  function getItemDescription(item) {
    // Use referenced item description if available, otherwise use plan item description
    if (item.referencedItem && item.referencedItem.description) {
      return item.referencedItem.description;
    }
    return item.description;
  }

  function getItemAuthor(item) {
    // Get author from referenced item if available
    if (item.referencedItem && item.referencedItem.author) {
      return item.referencedItem.author;
    }
    return null;
  }

  function getItemPublisher(item) {
    // Get publisher from referenced item if available
    if (item.referencedItem && item.referencedItem.publisher) {
      return item.referencedItem.publisher;
    }
    return null;
  }

  function getItemRating(item) {
    // Get rating from referenced item if available
    if (item.referencedItem && item.referencedItem.rating) {
      return item.referencedItem.rating;
    }
    return null;
  }

  function getItemCategory(item) {
    // Get category information from referenced item if available
    if (item.referencedItem) {
      const category = item.referencedItem.mainCategory;
      const subCategory = item.referencedItem.subCategory;
      if (category && subCategory && subCategory !== 'Other') {
        return `${category} - ${subCategory}`;
      } else if (category) {
        return category;
      }
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Recharge Plans</h1>
            <p className="text-lg text-gray-600">Manage your credit recharge plans and bundled items</p>
          </div>
          <button 
            onClick={() => navigate('/plan/create')}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Plan
          </button>
      </div>

        {/* Error Message */}
      {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </div>
      )}

        {/* Loading State */}
      {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading plans...</span>
          </div>
        ) : (
          /* Plans Grid */
          plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans yet</h3>
              <p className="text-gray-600 mb-6">Create your first recharge plan to get started</p>
              <button 
                onClick={() => navigate('/plan/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-8">
            {plans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
                  {/* Plan Header */}
                  <div className="relative">
                    <div className={`h-2 ${getCategoryColor(plan.category)}`}></div>
                    <div className="p-6 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(plan.category)}`}>
                              {plan.category || 'Basic'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              plan.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {plan.status}
                            </span>
                    </div>
                          <p className="text-gray-600 text-lg leading-relaxed">{plan.description}</p>
                </div>

                        {/* Price Section */}
                        <div className="flex flex-col items-end">
                          <div className="text-right mb-2">
                            <div className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                              ₹{plan.offerPrice}
                        <DiscountBadge mrp={plan.MRP} offer={plan.offerPrice} />
                            </div>
                            <div className="text-lg text-gray-500 line-through">₹{plan.MRP}</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {plan.credits} credits
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {plan.duration} days
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="p-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Bundled Items ({(plan.items || []).length})
                      </h3>
                      <button 
                        onClick={() => openPlanDetails(plan._id)}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>

                    {(plan.items || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <Star className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>No items in this plan yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(plan.items || []).map((item) => (
                          <div key={item._id} className="group relative bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                            {/* Item Image Placeholder */}
                            <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                              {getItemImageUrl(item) ? (
                                <img 
                                  src={getItemImageUrl(item)} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full rounded-lg flex items-center justify-center ${getItemImageUrl(item) ? 'hidden' : 'flex'}`}>
                                <div className={`p-3 rounded-full ${getItemTypeColor(item.itemType)}`}>
                                  {getItemIcon(item.itemType)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Item Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getItemTypeColor(item.itemType)}`}>
                                  {item.itemType}
                                </span>
                                {item.expiresWithPlan && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                    Expires with plan
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{getItemTitle(item)}</h4>
                              {getItemDescription(item) && (
                                <p className="text-xs text-gray-600 line-clamp-2">{getItemDescription(item)}</p>
                              )}
                              {getItemAuthor(item) && (
                                <p className="text-xs text-gray-500 mt-1">by {getItemAuthor(item)}</p>
                              )}
                              {getItemCategory(item) && (
                                <p className="text-xs text-blue-600 mt-1">{getItemCategory(item)}</p>
                              )}
                              {getItemRating(item) && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">{getItemRating(item)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate(`/plan/${plan._id}/edit`)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan._id)}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

        {/* Plan Details Modal */}
      {detailOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Plan Details</h2>
                  <button 
                    onClick={() => setDetailOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
            </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-lg text-gray-600">Loading plan details...</span>
                  </div>
              ) : detailPlan ? (
                  <div className="space-y-6">
                    {/* Plan Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-2xl font-bold text-gray-900">{detailPlan.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(detailPlan.category)}`}>
                              {detailPlan.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detailPlan.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {detailPlan.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-lg leading-relaxed">{detailPlan.description}</p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="text-right mb-2">
                            <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                              ₹{detailPlan.offerPrice}
                              <DiscountBadge mrp={detailPlan.MRP} offer={detailPlan.offerPrice} />
                            </div>
                            <div className="text-lg text-gray-500 line-through">₹{detailPlan.MRP}</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {detailPlan.credits} credits
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {detailPlan.duration} days
                            </div>
                          </div>
                        </div>
                    </div>
                    </div>

                    {/* Items Section */}
                  <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                        Bundled Items ({(detailPlan.items || []).length})
                      </h4>
                      
                    {(detailPlan.items || []).length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                            <Star className="w-8 h-8 text-gray-400" />
                          </div>
                          <h5 className="text-lg font-medium text-gray-900 mb-2">No items in this plan</h5>
                          <p className="text-gray-600">Add items to make this plan more valuable</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {detailPlan.items.map((item) => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                              {/* Item Image */}
                              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                                {getItemImageUrl(item) ? (
                                  <img 
                                    src={getItemImageUrl(item)} 
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full rounded-lg flex items-center justify-center ${getItemImageUrl(item) ? 'hidden' : 'flex'}`}>
                                  <div className={`p-4 rounded-full ${getItemTypeColor(item.itemType)}`}>
                                    {getItemIcon(item.itemType)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Item Details */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getItemTypeColor(item.itemType)}`}>
                                    {item.itemType}
                                  </span>
                                  {item.expiresWithPlan && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                      Expires with plan
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-semibold text-gray-900 mb-2">{getItemTitle(item)}</h5>
                                {getItemDescription(item) && (
                                  <p className="text-sm text-gray-600 line-clamp-3">{getItemDescription(item)}</p>
                                )}
                                {getItemAuthor(item) && (
                                  <p className="text-sm text-gray-500 mt-2">by {getItemAuthor(item)}</p>
                                )}
                                {getItemPublisher(item) && (
                                  <p className="text-sm text-gray-500">Published by {getItemPublisher(item)}</p>
                                )}
                                {getItemCategory(item) && (
                                  <p className="text-sm text-blue-600 mt-2">{getItemCategory(item)}</p>
                                )}
                                {getItemRating(item) && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600">{getItemRating(item)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    )}
                  </div>
                </div>
              ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load plan</h3>
                    <p className="text-gray-600">There was an error loading the plan details</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
