import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/app/login');
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>🛡️ Admin Panel</h2>
        <p>GiftLink Management</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/app/admin" 
          end
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📊 Dashboard
        </NavLink>

        <NavLink 
          to="/app/admin/users" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          👥 Manage Users
        </NavLink>

        <NavLink 
          to="/app/admin/items" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          🎁 Manage Items
        </NavLink>

        <NavLink 
          to="/app/admin/reports" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📝 Manage Reports
        </NavLink>

        <div className="nav-divider"></div>

        <NavLink 
          to="/app" 
          className="nav-link"
        >
          🏠 Back to Main Site
        </NavLink>

        <button 
          onClick={handleLogout}
          className="nav-link logout-btn"
        >
          🚪 Logout
        </button>
      </nav>

      <div className="sidebar-footer">
        <small>Admin Control Panel v1.0</small>
      </div>
    </div>
  );
}
