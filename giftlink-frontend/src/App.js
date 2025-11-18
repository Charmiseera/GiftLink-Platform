import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar from './components/Navbar/Navbar';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import DetailsPage from './components/DetailsPage/DetailsPage';
import SearchPage from './components/SearchPage/SearchPage';
import Profile from './components/Profile/Profile';
import AddItem from './components/AddItem/AddItem';
import MyDonations from './components/MyDonations/MyDonations';
import MyRequests from './components/MyRequests/MyRequests';
import PointsHistory from './components/PointsHistory/PointsHistory';
import AdminLayout from './pages/admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';


function App() {
  const location = useLocation();
  
  // Redirect to home.html for root path
  React.useEffect(() => {
    if (location.pathname === '/') {
      window.location.href = '/home.html';
    }
  }, [location.pathname]);
  
  // Hide navbar on landing, login, register, and admin pages
  const hideNavbarRoutes = ['/app/login', '/app/register'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname) && !location.pathname.startsWith('/app/admin');

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/app/login" element={<LoginPage />} />
        <Route path="/app/register" element={<RegisterPage />} />
        
        {/* Public Routes - No login required for browsing */}
        <Route path="/app" element={<MainPage />} />
        <Route path="/app/search" element={<SearchPage />} />
        <Route path="/app/details/:id" element={<DetailsPage />} />
        
        {/* Protected Routes - Require Login */}
        <Route path="/app/add-item" element={
          <ProtectedRoute>
            <AddItem />
          </ProtectedRoute>
        } />
        <Route path="/app/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/app/my-donations" element={
          <ProtectedRoute>
            <MyDonations />
          </ProtectedRoute>
        } />
        <Route path="/app/my-requests" element={
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        } />
        <Route path="/app/points-history" element={
          <ProtectedRoute>
            <PointsHistory />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/app/admin/*" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } />

      </Routes>
    </>
  );
}

export default App;
