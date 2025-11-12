import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';

function MainPage() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch all gifts from backend
  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const response = await fetch(`${urlConfig.backendUrl}/api/gifts`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        setGifts(data);
      } catch (error) {
        console.error('Error fetching gifts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGifts();
  }, []);

  // ✅ Navigate to details page
  const goToDetailsPage = (productId) => {
    navigate(`/app/details/${productId}`);
  };

  // ✅ Format timestamp safely
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date available';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('default', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ✅ Badge color based on condition
  const getConditionClass = (condition) => {
    if (condition === 'New') return 'badge bg-success';
    if (condition === 'Like New') return 'badge bg-info';
    return 'badge bg-warning text-dark';
  };

  // ✅ Show loading indicator
  if (loading) {
    return <div className="text-center mt-5">Loading gifts...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row g-4">
        {gifts.length > 0 ? (
          gifts.map((gift) => (
            <div key={gift._id || gift.id} className="col-md-4">
              <div className="card product-card shadow-sm">

                {/* ✅ Gift Image */}
                {gift.image ? (
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="text-center p-5 text-muted">
                    No Image Available
                  </div>
                )}

                {/* ✅ Gift Details */}
                <div className="card-body">
                  <h5 className="card-title">{gift.name || 'Unnamed Gift'}</h5>

                  <p className="card-text">
                    <span className={getConditionClass(gift.condition)}>
                      {gift.condition || 'Unknown'}
                    </span>
                  </p>

                  <p className="card-text text-muted">
                    Added on: {formatDate(gift.date_added)}
                  </p>

                  <button
                    onClick={() => goToDetailsPage(gift._id || gift.id)}
                    className="btn btn-primary w-100"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted mt-5 w-100">
            <h5>No gifts found.</h5>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;
