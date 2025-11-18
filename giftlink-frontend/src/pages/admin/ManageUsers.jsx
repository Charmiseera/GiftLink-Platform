import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './AdminPages.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isBlocked: '',
    isVerified: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      
      // Build query params
      let url = `${urlConfig.backendUrl}/api/admin/users?page=${pagination.currentPage}&limit=20`;
      if (filters.role) url += `&role=${filters.role}`;
      if (filters.isBlocked) url += `&isBlocked=${filters.isBlocked}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      // Filter verified users on client side if needed
      let filteredUsers = data.users;
      if (filters.isVerified !== '') {
        filteredUsers = filteredUsers.filter(user => {
          const isVerified = user.isVerified || false;
          return filters.isVerified === 'true' ? isVerified : !isVerified;
        });
      }
      
      setUsers(filteredUsers);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    if (!window.confirm('Are you sure you want to verify this user?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify user');
      }

      setSuccess('User verified successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user? They will not be able to log in.')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to block user');
      }

      setSuccess('User blocked successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/users/${userId}/unblock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user');
      }

      setSuccess('User unblocked successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="manage-users-container">
      <div className="page-header">
        <h1>👥 Manage Users</h1>
        <p>Verify, block, or unblock users</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-section">
        <h2>Filters</h2>
        <div className="filters">
          <select 
            value={filters.role} 
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="donor">Donor</option>
            <option value="receiver">Receiver</option>
            <option value="admin">Admin</option>
          </select>

          <select 
            value={filters.isBlocked} 
            onChange={(e) => setFilters({ ...filters, isBlocked: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          <select 
            value={filters.isVerified} 
            onChange={(e) => setFilters({ ...filters, isVerified: e.target.value })}
          >
            <option value="">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Requests</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.isVerified ? (
                          <span className="badge badge-success">✓ Verified</span>
                        ) : (
                          <span className="badge badge-warning">Unverified</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${user.isBlocked ? 'blocked' : 'active'}`}>
                          {user.isBlocked ? '🚫 Blocked' : '✓ Active'}
                        </span>
                      </td>
                      <td>{user.needScore || 0}</td>
                      <td>{user.monthlyRequests || 0}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          {!user.isVerified && user.role !== 'admin' && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleVerifyUser(user._id)}
                              title="Verify User"
                            >
                              ✓ Verify
                            </button>
                          )}
                          {user.role !== 'admin' && (
                            <>
                              {user.isBlocked ? (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleUnblockUser(user._id)}
                                >
                                  Unblock
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleBlockUser(user._id)}
                                >
                                  Block
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
