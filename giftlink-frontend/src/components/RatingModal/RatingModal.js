import React, { useState } from 'react';
import { urlConfig } from '../../config';
import './RatingModal.css';

const RatingModal = ({ show, onClose, itemId, ratedUserId, ratedUserName, userRole }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          ratedUserId,
          rating,
          review: review.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      alert('Rating submitted successfully!');
      onClose(true); // Pass true to indicate successful submission
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getRoleText = () => {
    return userRole === 'donor' ? 'receiver' : 'donor';
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rating-modal-header">
          <h3>Rate {getRoleText()}</h3>
          <button className="rating-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-modal-body">
            <p className="rating-subtitle">
              How was your experience with <strong>{ratedUserName}</strong>?
            </p>

            {/* Star Rating */}
            <div className="star-rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="rating-text">
                {rating === 1 && '😞 Poor'}
                {rating === 2 && '😐 Fair'}
                {rating === 3 && '🙂 Good'}
                {rating === 4 && '😊 Very Good'}
                {rating === 5 && '🤩 Excellent'}
              </p>
            )}

            {/* Review Text */}
            <div className="form-group">
              <label htmlFor="review">Review (Optional)</label>
              <textarea
                id="review"
                className="form-textarea"
                placeholder="Share your experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows="4"
                maxLength="500"
              />
              <small className="char-count">{review.length}/500 characters</small>
            </div>

            {error && (
              <div className="rating-error">
                {error}
              </div>
            )}
          </div>

          <div className="rating-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
