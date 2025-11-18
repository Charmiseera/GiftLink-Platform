import React, { useState } from 'react';
import { urlConfig } from '../../config';
import './ReportModal.css';

const ReportModal = ({ show, onClose, reportedUserId, reportedUserName, itemId }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    'Fraudulent behavior',
    'Inappropriate content',
    'Abusive language',
    'Scam or spam',
    'Item not as described',
    'No-show for pickup',
    'Other'
  ];

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/ratings/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description: description.trim(),
          itemId: itemId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      alert('Report submitted successfully. Our team will review it shortly.');
      onClose(true); // Pass true to indicate successful submission
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setError('');
    onClose(false);
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>🚨 Report User</h3>
          <button className="report-modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-modal-body">
            <p className="report-subtitle">
              Report <strong>{reportedUserName}</strong> for inappropriate behavior
            </p>

            <div className="report-warning">
              ⚠️ False reports may result in action against your account
            </div>

            {/* Reason Selection */}
            <div className="form-group">
              <label htmlFor="reason">
                Reason <span className="required">*</span>
              </label>
              <select
                id="reason"
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason...</option>
                {reportReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Additional Details <span className="optional">(Optional)</span>
              </label>
              <textarea
                id="description"
                className="form-textarea"
                placeholder="Provide more details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="5"
                maxLength="1000"
              />
              <small className="char-count">{description.length}/1000 characters</small>
            </div>

            {error && (
              <div className="report-error">
                {error}
              </div>
            )}
          </div>

          <div className="report-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit btn-danger"
              disabled={loading || !reason}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
