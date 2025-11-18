import React, { useEffect, useState } from 'react';
import { urlConfig } from '../../config';
import './UserRatings.css';

const UserRatings = ({ userId, userName }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(`${urlConfig.backendUrl}/api/ratings/user/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRatings(data.ratings);
          
          // Calculate average
          if (data.ratings.length > 0) {
            const avg = data.ratings.reduce((sum, r) => sum + r.rating, 0) / data.ratings.length;
            setAverageRating(avg.toFixed(1));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchRatings();
    }
  }, [userId]);

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="ratings-loading">Loading ratings...</div>;
  }

  if (ratings.length === 0) {
    return (
      <div className="ratings-container">
        <h3 className="ratings-title">User Ratings</h3>
        <div className="no-ratings">
          <p>No ratings yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ratings-container">
      <div className="ratings-header">
        <h3 className="ratings-title">User Ratings</h3>
        <div className="average-rating">
          <span className="rating-stars">{renderStars(Math.round(averageRating))}</span>
          <span className="rating-value">{averageRating}</span>
          <span className="rating-count">({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})</span>
        </div>
      </div>

      <div className="ratings-list">
        {ratings.map((rating, index) => (
          <div key={index} className="rating-card">
            <div className="rating-card-header">
              <div className="rating-info">
                <span className="rating-stars">{renderStars(rating.rating)}</span>
                <span className="rating-number">{rating.rating}.0</span>
              </div>
              <span className="rating-date">{formatDate(rating.createdAt)}</span>
            </div>
            
            {rating.review && (
              <p className="rating-review">{rating.review}</p>
            )}
            
            <div className="rating-footer">
              <span className="rating-author">— {rating.raterName}</span>
              {rating.itemName && (
                <span className="rating-item">for "{rating.itemName}"</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRatings;
