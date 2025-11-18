import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailsPage.css";
import { urlConfig } from "../../config";
import { itemsApi } from "../../api/itemsApi";

function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  
  // User points state
  const [userPoints, setUserPoints] = useState(null);
  const [monthlyRequestCount, setMonthlyRequestCount] = useState(0);
  const [monthlyRequestLimit, setMonthlyRequestLimit] = useState(5);
  
  // Get current user from session
  const currentUserEmail = sessionStorage.getItem('email');
  const authToken = sessionStorage.getItem('auth-token');
  const userRole = sessionStorage.getItem('role');

  useEffect(() => {
    async function fetchGift() {
      try {
        // Use the new items API endpoint
        const data = await itemsApi.getItemById(id);
        setGift(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch item details");
        setLoading(false);
      }
    }
    fetchGift();
  }, [id]);

  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.giftPoints);
        setMonthlyRequestCount(data.monthlyRequestCount);
        setMonthlyRequestLimit(data.monthlyRequestLimit);
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
    }
  };

  // Fetch user points when modal opens (only for receivers)
  useEffect(() => {
    if (showRequestModal && userRole === 'receiver' && authToken) {
      fetchUserPoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRequestModal, userRole, authToken]);

  // Handle Request Item
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setRequestError("Please provide a reason for your request");
      return;
    }

    setRequestLoading(true);
    setRequestError("");

    try {
      await itemsApi.requestItem(id, reason);
      alert("Request submitted successfully! The donor will review your request.");
      setShowRequestModal(false);
      setReason("");
      // Refresh item data to show updated status
      const updatedData = await itemsApi.getItemById(id);
      setGift(updatedData);
    } catch (err) {
      setRequestError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  // Determine if user can request this item
  // Loading state
  if (loading) {
    return (
      <div className="details-page-wrapper">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading item details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="details-page-wrapper">
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="details-page-wrapper">
      <div className="details-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="details-card">
          <div className="image-section">
            {gift?.image ? (
              <img src={gift.image} alt={gift.name} className="product-image-large" />
            ) : (
              <div className="no-image-available-large">No Image Available</div>
            )}
          </div>
          
          <div className="details-content">
            <div className="details-header">
              <h2 className="details-title">{gift?.name}</h2>
              <div className="badge-group">
                {gift?.isLegacy && (
                  <span className="legacy-badge">
                    📦 Legacy Item
                  </span>
                )}
                <span className={`status-badge status-${gift?.status?.toLowerCase()}`}>
                  {gift?.status || 'AVAILABLE'}
                </span>
              </div>
            </div>

            <div className="details-info">
              <div className="info-item">
                <span className="info-label">Donated by:</span>
                <span className="info-value">{gift?.donorName || gift?.donorEmail?.split('@')[0] || 'Anonymous'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Category:</span>
                <span className="info-value">{gift?.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Condition:</span>
                <span className="info-value condition-badge condition-{gift?.condition?.toLowerCase().replace(' ', '-')}">
                  {gift?.condition}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Zipcode:</span>
                <span className="info-value">{gift?.zipcode}</span>
              </div>
              <div className="info-item description">
                <span className="info-label">Description:</span>
                <p className="info-value">{gift?.description}</p>
              </div>
            </div>

            {/* Request Button - Show based on auth and availability */}
            {gift?.status === 'AVAILABLE' && (
              <div className="action-section">
                {authToken && gift.donorEmail !== currentUserEmail ? (
                  <>
                    <button 
                      className="btn-request" 
                      onClick={() => setShowRequestModal(true)}
                    >
                      Request This Item
                    </button>
                    <p className="request-hint">
                      📝 You'll need to provide a reason for your request
                    </p>
                  </>
                ) : !authToken ? (
                  <>
                    <button 
                      className="btn-request btn-login" 
                      onClick={() => navigate('/app/login')}
                    >
                      🔒 Login to Request Item
                    </button>
                    <p className="request-hint">
                      Please login as a Receiver to request this item
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {/* Show message if item is not available */}
            {gift?.status === 'REQUESTED' && (
              <div className="status-message info">
                This item has been requested and is pending donor approval.
              </div>
            )}
            {gift?.status === 'APPROVED' && (
              <div className="status-message success">
                This item has been approved for pickup.
              </div>
            )}
            {gift?.status === 'COMPLETED' && (
              <div className="status-message completed">
                This item has been successfully donated.
              </div>
            )}
            {gift?.isLegacy && (
              <div className="status-message info">
                ℹ️ This is a legacy item from our previous system. You can request it just like any other item!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Item</h3>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body">
                <p className="modal-description">
                  Please explain why you need this item. Your request will be sent to the donor for approval.
                </p>

                {/* Points Information */}
                {userPoints !== null && (
                  <div className="points-info-box">
                    <div className="points-cost">
                      <span className="cost-label">Request Cost:</span>
                      <span className="cost-value">⭐ 10 Points</span>
                    </div>
                    <div className="points-balance">
                      <span className="balance-label">Your Balance:</span>
                      <span className="balance-value">⭐ {userPoints} Points</span>
                    </div>
                    <div className="points-remaining">
                      <span className="remaining-label">After Request:</span>
                      <span className="remaining-value">⭐ {userPoints - 10} Points</span>
                    </div>
                    <div className="monthly-limit">
                      <span className="limit-label">Monthly Requests:</span>
                      <span className="limit-value">{monthlyRequestCount} / {monthlyRequestLimit}</span>
                    </div>
                    {userPoints < 10 && (
                      <div className="insufficient-points-warning">
                        ⚠️ Insufficient points! You need at least 10 points to make a request.
                      </div>
                    )}
                    {monthlyRequestCount >= monthlyRequestLimit && (
                      <div className="insufficient-points-warning">
                        ⚠️ Monthly limit reached! You've used all your requests for this month.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="reason" className="form-label">
                    Reason for Request <span className="required">*</span>
                  </label>
                  <textarea
                    id="reason"
                    className="form-textarea"
                    placeholder="Explain why you need this item and how it will help you..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="5"
                    required
                  />
                </div>

                {requestError && (
                  <div className="alert-error">
                    {requestError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowRequestModal(false)}
                  disabled={requestLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={requestLoading || (userPoints !== null && (userPoints < 10 || monthlyRequestCount >= monthlyRequestLimit))}
                >
                  {requestLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailsPage;
