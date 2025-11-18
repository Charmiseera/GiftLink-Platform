import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsApi } from '../../api/itemsApi';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { ToastContainer } from '../Toast/Toast';
import { useToast } from '../../hooks/useToast';
import './MainPage.css';

function MainPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();

  const categories = [
    { name: 'All', icon: '🏠' },
    { name: 'Living', icon: '🛋️' },
    { name: 'Bedroom', icon: '🛏️' },
    { name: 'Bathroom', icon: '🚿' },
    { name: 'Kitchen', icon: '🍳' },
    { name: 'Office', icon: '💼' }
  ];

  // Fetch all available items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await itemsApi.getAllItems('AVAILABLE', currentPage, 20, selectedCategory !== 'All' ? selectedCategory : null);
        
        // Handle both old format (array) and new format (object with items + pagination)
        if (Array.isArray(data)) {
          setItems(data);
          setFilteredItems(data);
          setPagination(null);
        } else {
          setItems(data.items || []);
          setFilteredItems(data.items || []);
          setPagination(data.pagination);
          if (currentPage === 1 && data.items.length > 0) {
            success(`Found ${data.pagination.totalItems} available items!`);
          }
        }
        setError('');
      } catch (error) {
        console.error('Error fetching items:', error);
        const errorMessage = error.response?.data?.error || 'Failed to load items. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [currentPage, selectedCategory, showError, success]);

  // Filter items by category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => item.category === selectedCategory);
      setFilteredItems(filtered);
    }
  }, [selectedCategory, items]);

  // Handle category filter change
  // Navigate to details page
  const goToDetailsPage = (itemId) => {
    navigate(`/app/details/${itemId}`);
  };

  // Badge color based on condition
  const getConditionClass = (condition) => {
    switch(condition) {
      case 'New': return 'badge-new';
      case 'Like New': return 'badge-like-new';
      case 'Good': return 'badge-good';
      case 'Fair': return 'badge-fair';
      default: return 'badge-default';
    }
  };

  return (
    <div className="main-page-container">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Page Header */}
      <div className="page-header">
        <h1>Available Items</h1>
        <p>Browse items available for donation</p>
        {pagination && (
          <span className="item-count-header">
            Showing {filteredItems.length} of {pagination.totalItems} items
          </span>
        )}
      </div>

      {/* Category Filters */}
      <div className="filter-section">
        <div className="filter-label">Filter by Category:</div>
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setCurrentPage(1); // Reset to page 1 when changing category
              }}
              className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
            >
              <span className="filter-icon">{cat.icon}</span>
              <span className="filter-text">{cat.name}</span>
              {pagination && selectedCategory === cat.name && (
                <span className="item-count">
                  ({pagination.totalItems})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && !loading && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonLoader count={6} />
      ) : (
        <>
          {/* Items Grid */}
          <div className="items-grid">
            {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item._id} className="item-card">
              
              {/* Item Image */}
              <div className="item-image">
                {item.isLegacy && (
                  <div className="legacy-ribbon">Legacy</div>
                )}
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="no-image">
                    <span>📦</span>
                    <p>No image</p>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="item-body">
                <h3 className="item-title">{item.name}</h3>
                
                <div className="item-meta">
                  <span className={`condition-badge ${getConditionClass(item.condition)}`}>
                    {item.condition}
                  </span>
                  <span className="category-tag">{item.category}</span>
                </div>

                <p className="item-description">
                  {item.description && item.description.length > 80
                    ? `${item.description.substring(0, 80)}...`
                    : item.description || 'No description available'}
                </p>

                <div className="item-footer">
                  <span className="item-date">
                    📍 {item.zipcode}
                  </span>
                  <button
                    onClick={() => goToDetailsPage(item._id)}
                    className="btn-view-details"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No items found</h3>
            <p>
              {selectedCategory === 'All'
                ? 'Check back later for new donations!'
                : `No items available in ${selectedCategory} category. Try another category.`}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredItems.length > 0 && pagination && (
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={!pagination.hasPrevPage}
            className="btn-pagination"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalItems} items total)
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!pagination.hasNextPage}
            className="btn-pagination"
          >
            Next →
          </button>
        </div>
      )}
    </>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default MainPage;
