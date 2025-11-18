import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './AdminPages.css';

export default function ManageItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/app');
    }
  }, [navigate]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      
      // Build query params
      let url = `${urlConfig.backendUrl}/api/admin/items?page=${pagination.currentPage}&limit=20`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.category) url += `&category=${filters.category}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const data = await response.json();
      setItems(data.items);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setSuccess('Item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchItems();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="manage-items-container">
      <div className="page-header">
        <h1>🎁 Manage Items</h1>
        <p>Monitor and moderate donated items</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-section">
        <h2>Filters</h2>
        <div className="filters">
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select 
            value={filters.category} 
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Furniture">Furniture</option>
            <option value="Books">Books</option>
            <option value="Toys">Toys</option>
            <option value="Sports">Sports</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table-container">
        {loading ? (
          <div className="loading">Loading items...</div>
        ) : (
          <>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Donor</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.image && item.image.length > 0 ? (
                          <img 
                            src={item.image[0]} 
                            alt={item.name}
                            className="item-thumbnail"
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        <br />
                        <small>{item.description?.substring(0, 50)}...</small>
                      </td>
                      <td>
                        {item.donorInfo?.name}
                        <br />
                        <small>{item.donorInfo?.email}</small>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{item.category}</span>
                      </td>
                      <td>{item.condition}</td>
                      <td>
                        <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.zipcode || 'N/A'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteItem(item._id)}
                          title="Delete Item"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-sm"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
