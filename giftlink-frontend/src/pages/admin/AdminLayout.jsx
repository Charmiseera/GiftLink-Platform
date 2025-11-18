import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminDashboardHome from './AdminDashboardHome';
import ManageUsers from './ManageUsers';
import ManageItems from './ManageItems';
import ManageReports from './ManageReports';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <Routes>
          <Route path="/" element={<AdminDashboardHome />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/items" element={<ManageItems />} />
          <Route path="/reports" element={<ManageReports />} />
        </Routes>
      </div>
    </div>
  );
}
