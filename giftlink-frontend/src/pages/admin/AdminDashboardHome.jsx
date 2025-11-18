import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './AdminPages.css';

export default function AdminDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/app');
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-home" style={{ padding: '40px' }}>
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-home" style={{ padding: '40px' }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-home" style={{ padding: '40px' }}>
      <div className="page-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Welcome to the GiftLink Admin Control Panel</p>
      </div>

      {/* User Statistics */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
          👥 User Statistics
        </h2>
        <div className="stats-grid">
          <div className="stat-card stat-users">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats?.users?.total || 0}</h3>
              <p>Total Users</p>
              <small>All registered users</small>
            </div>
          </div>

          <div className="stat-card stat-users">
            <div className="stat-icon">🎁</div>
            <div className="stat-info">
              <h3>{stats?.users?.donors || 0}</h3>
              <p>Donors</p>
              <small>Users donating items</small>
            </div>
          </div>

          <div className="stat-card stat-users">
            <div className="stat-icon">🙏</div>
            <div className="stat-info">
              <h3>{stats?.users?.receivers || 0}</h3>
              <p>Receivers</p>
              <small>Users requesting items</small>
            </div>
          </div>

          <div className="stat-card stat-blocked">
            <div className="stat-icon">🚫</div>
            <div className="stat-info">
              <h3>{stats?.users?.blocked || 0}</h3>
              <p>Blocked Users</p>
              <small>Currently blocked</small>
            </div>
          </div>
        </div>
      </section>

      {/* Item Statistics */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
          🎁 Item Statistics
        </h2>
        <div className="stats-grid">
          <div className="stat-card stat-items">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{stats?.items?.total || 0}</h3>
              <p>Total Items</p>
              <small>All donated items</small>
            </div>
          </div>

          <div className="stat-card stat-items">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats?.items?.available || 0}</h3>
              <p>Available</p>
              <small>Ready for requests</small>
            </div>
          </div>

          <div className="stat-card stat-requests">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>{stats?.items?.requested || 0}</h3>
              <p>Requested</p>
              <small>Pending approval</small>
            </div>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon">🎉</div>
            <div className="stat-info">
              <h3>{stats?.items?.completed || 0}</h3>
              <p>Completed</p>
              <small>Successfully delivered</small>
            </div>
          </div>
        </div>
      </section>

      {/* Request Statistics */}
      <section>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
          📨 Request Statistics
        </h2>
        <div className="stats-grid">
          <div className="stat-card stat-requests">
            <div className="stat-icon">📨</div>
            <div className="stat-info">
              <h3>{stats?.requests?.total || 0}</h3>
              <p>Total Requests</p>
              <small>All item requests</small>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/app/admin/users')}
            style={{ padding: '16px', fontSize: '15px' }}
          >
            👥 Manage Users
          </button>
          <button
            className="btn btn-success"
            onClick={() => navigate('/app/admin/items')}
            style={{ padding: '16px', fontSize: '15px' }}
          >
            🎁 Manage Items
          </button>
          <button
            className="btn btn-info"
            onClick={() => navigate('/app/admin/reports')}
            style={{ padding: '16px', fontSize: '15px' }}
          >
            📝 Manage Reports
          </button>
        </div>
      </section>
    </div>
  );
}
