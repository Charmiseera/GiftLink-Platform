import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { urlConfig } from '../../config';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ role: '', isBlocked: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/app');
    }
  }, [navigate]);

  // Fetch statistics
  useEffect(() => {
    fetchStats();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      const params = new URLSearchParams();
      if (filter.role) params.append('role', filter.role);
      if (filter.isBlocked) params.append('isBlocked', filter.isBlocked);

      const response = await fetch(`${urlConfig.backendUrl}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Error fetching users');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccessMessage('User blocked successfully');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to block user');
      }
    } catch (error) {
      setError('Error blocking user');
      console.error('Error:', error);
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

      if (response.ok) {
        setSuccessMessage('User unblocked successfully');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to unblock user');
      }
    } catch (error) {
      setError('Error unblocking user');
      console.error('Error:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilter(prev => ({ ...prev, [filterType]: value }));
  };

  const applyFilters = () => {
    fetchUsers();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Manage users and monitor platform activity</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-users">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.users.total}</h3>
              <p>Total Users</p>
              <small>{stats.users.donors} Donors • {stats.users.receivers} Receivers</small>
            </div>
          </div>

          <div className="stat-card stat-items">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{stats.items.total}</h3>
              <p>Total Items</p>
              <small>{stats.items.available} Available • {stats.items.completed} Completed</small>
            </div>
          </div>

          <div className="stat-card stat-requests">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>{stats.requests.total}</h3>
              <p>Total Requests</p>
            </div>
          </div>

          <div className="stat-card stat-blocked">
            <div className="stat-icon">🚫</div>
            <div className="stat-info">
              <h3>{stats.users.blocked}</h3>
              <p>Blocked Users</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Filters */}
      <div className="filters-section">
        <h2>User Management</h2>
        <div className="filters">
          <select value={filter.role} onChange={(e) => handleFilterChange('role', e.target.value)}>
            <option value="">All Roles</option>
            <option value="donor">Donors</option>
            <option value="receiver">Receivers</option>
          </select>

          <select value={filter.isBlocked} onChange={(e) => handleFilterChange('isBlocked', e.target.value)}>
            <option value="">All Users</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.isBlocked ? (
                      <span className="status-badge status-blocked">Blocked</span>
                    ) : (
                      <span className="status-badge status-active">Active</span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    {user.role !== 'admin' && (
                      user.isBlocked ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleUnblockUser(user._id)}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleBlockUser(user._id)}
                        >
                          Block
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
