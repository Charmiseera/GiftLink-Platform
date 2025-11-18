import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsApi } from '../../api/itemsApi';
import './MyDonations.css';

const MyDonations = () => {
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Fetch donor's items
  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getMyDonations();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load your donations');
    } finally {
      setLoading(false);
    }
  };

  // Approve a request
  const handleApprove = async (itemId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [itemId]: 'approving' }));
    try {
      await itemsApi.approveRequest(itemId);
      alert('Request approved! The requester will be notified.');
      await fetchMyDonations(); // Refresh list
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  // Reject a request
  const handleReject = async (itemId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [itemId]: 'rejecting' }));
    try {
      await itemsApi.rejectRequest(itemId);
      alert('Request rejected. The item is now available again.');
      await fetchMyDonations(); // Refresh list
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  // Mark as completed
  const handleComplete = async (itemId) => {
    if (!window.confirm('Mark this item as completed? This confirms the item has been handed over.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [itemId]: 'completing' }));
    try {
      await itemsApi.completeItem(itemId);
      alert('Item marked as completed! Thank you for your donation.');
      await fetchMyDonations(); // Refresh list
    } catch (err) {
      alert(err.message || 'Failed to mark as completed');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  // Delete item
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This cannot be undone.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [itemId]: 'deleting' }));
    try {
      await itemsApi.deleteItem(itemId);
      alert('Item deleted successfully.');
      await fetchMyDonations(); // Refresh list
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'REQUESTED': return 'status-requested';
      case 'APPROVED': return 'status-approved';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-default';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'REQUESTED': return 'Pending Request';
      case 'APPROVED': return 'Approved';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-donations-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-donations-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>My Donations</h1>
        <p>Manage your donated items and requests</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Donations Yet</h3>
          <p>You haven't donated any items yet. Start sharing!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/app/add-item')}
          >
            Donate an Item
          </button>
        </div>
      ) : (
        <div className="donations-list">
          {items.map((item) => (
            <div key={item._id} className="donation-card">
              {/* Item Image */}
              <div className="donation-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="no-image-placeholder">
                    <span>📦</span>
                    <p>No image</p>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="donation-details">
                <div className="donation-header">
                  <h3 className="donation-title">{item.name}</h3>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>

                <div className="donation-meta">
                  <span className="meta-item">
                    <strong>Category:</strong> {item.category}
                  </span>
                  <span className="meta-item">
                    <strong>Condition:</strong> {item.condition}
                  </span>
                  <span className="meta-item">
                    <strong>Zipcode:</strong> {item.zipcode}
                  </span>
                </div>

                <p className="donation-description">
                  {item.description}
                </p>

                {/* Request Information */}
                {item.status === 'REQUESTED' && item.requestedBy && (
                  <div className="request-info">
                    <div className="request-header">
                      <h4>📬 Request Received</h4>
                    </div>
                    <div className="request-details">
                      <p><strong>From:</strong> {item.requesterName || item.requesterEmail}</p>
                      {item.reason && (
                        <p><strong>Reason:</strong> {item.reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {item.status === 'APPROVED' && item.requestedBy && (
                  <div className="request-info approved">
                    <div className="request-header">
                      <h4>✅ Request Approved</h4>
                    </div>
                    <div className="request-details">
                      <p><strong>Approved for:</strong> {item.requesterName || item.requesterEmail}</p>
                      <p className="help-text">Ready for pickup/handover</p>
                    </div>
                  </div>
                )}

                {item.status === 'COMPLETED' && (
                  <div className="request-info completed">
                    <div className="request-header">
                      <h4>🎉 Donation Completed</h4>
                    </div>
                    <p className="help-text">Thank you for your generosity!</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="donation-actions">
                  {/* Available Status - View Details & Delete */}
                  {item.status === 'AVAILABLE' && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/app/details/${item._id}`)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(item._id)}
                        disabled={actionLoading[item._id] === 'deleting'}
                      >
                        {actionLoading[item._id] === 'deleting' ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}

                  {/* Requested Status - Approve & Reject */}
                  {item.status === 'REQUESTED' && (
                    <>
                      <button
                        className="btn-success"
                        onClick={() => handleApprove(item._id)}
                        disabled={actionLoading[item._id]}
                      >
                        {actionLoading[item._id] === 'approving' ? 'Approving...' : 'Approve Request'}
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleReject(item._id)}
                        disabled={actionLoading[item._id]}
                      >
                        {actionLoading[item._id] === 'rejecting' ? 'Rejecting...' : 'Reject Request'}
                      </button>
                    </>
                  )}

                  {/* Approved Status - Mark as Completed */}
                  {item.status === 'APPROVED' && (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => handleComplete(item._id)}
                        disabled={actionLoading[item._id] === 'completing'}
                      >
                        {actionLoading[item._id] === 'completing' ? 'Completing...' : 'Mark as Completed'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/app/details/${item._id}`)}
                      >
                        View Details
                      </button>
                    </>
                  )}

                  {/* Completed Status - View Only */}
                  {item.status === 'COMPLETED' && (
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/app/details/${item._id}`)}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDonations;
