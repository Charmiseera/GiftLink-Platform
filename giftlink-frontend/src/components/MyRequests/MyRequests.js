import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../../api/itemsApi';
import './MyRequests.css';

const MyRequests = () => {
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's requests
  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const data = await requestsApi.getMyRequests();
      setRequests(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-default';
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'COMPLETED': return '🎉';
      default: return '📋';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-requests-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-requests-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>My Requests</h1>
        <p>Track the status of items you've requested</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Requests Yet</h3>
          <p>You haven't requested any items yet. Browse available items to get started!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/app')}
          >
            Browse Items
          </button>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              {/* Item Image */}
              <div className="request-image">
                {request.itemImage ? (
                  <img src={request.itemImage} alt={request.itemName} />
                ) : (
                  <div className="no-image-placeholder">
                    <span>📦</span>
                    <p>No image</p>
                  </div>
                )}
                {/* Status Icon Overlay */}
                <div className={`status-icon ${getStatusClass(request.status)}`}>
                  {getStatusIcon(request.status)}
                </div>
              </div>

              {/* Request Details */}
              <div className="request-details">
                <div className="request-header">
                  <h3 className="request-title">{request.itemName}</h3>
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                {/* Item Meta */}
                <div className="request-meta">
                  <span className="meta-item">
                    <strong>Category:</strong> {request.itemCategory}
                  </span>
                  <span className="meta-item">
                    <strong>Condition:</strong> {request.itemCondition}
                  </span>
                  <span className="meta-item">
                    <strong>Zipcode:</strong> {request.itemZipcode}
                  </span>
                </div>

                {/* Request Date */}
                <div className="request-date">
                  <span className="date-label">Requested on:</span>
                  <span className="date-value">
                    {new Date(request.requestDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Your Reason */}
                {request.reason && (
                  <div className="request-reason">
                    <strong>Your Reason:</strong>
                    <p>{request.reason}</p>
                  </div>
                )}

                {/* Donor Information - Show for Approved/Completed */}
                {(request.status === 'APPROVED' || request.status === 'COMPLETED') && (
                  <div className="donor-info">
                    <div className="donor-header">
                      <h4>📞 Donor Contact Information</h4>
                    </div>
                    <div className="donor-details">
                      <p>
                        <strong>Name:</strong> {request.donorFirstName} {request.donorLastName}
                      </p>
                      <p>
                        <strong>Email:</strong> 
                        <a href={`mailto:${request.donorEmail}`}> {request.donorEmail}</a>
                      </p>
                      <p className="contact-note">
                        💡 Please contact the donor to arrange pickup/delivery
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {request.status === 'PENDING' && (
                  <div className="status-message pending">
                    ⏳ Your request is pending review by the donor.
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className="status-message rejected">
                    ❌ This request was not approved by the donor.
                  </div>
                )}

                {request.status === 'APPROVED' && (
                  <div className="status-message approved">
                    ✅ Your request has been approved! Please contact the donor to arrange pickup.
                  </div>
                )}

                {request.status === 'COMPLETED' && (
                  <div className="status-message completed">
                    🎉 This donation has been completed. Thank you!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="request-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/app/details/${request.itemId}`)}
                  >
                    View Item Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
