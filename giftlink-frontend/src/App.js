import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import DetailsPage from './components/DetailsPage/DetailsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/Navbar/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Main Page routes */}
        <Route path="/" element={<MainPage />} />
        <Route path="/app" element={<MainPage />} />

        {/* Auth routes */}
        <Route path="/app/login" element={<LoginPage />} />
        <Route path="/app/register" element={<RegisterPage />} />

        {/* Details page */}
        <Route path="/app/details/:id" element={<DetailsPage />} />
      </Routes>
    </>
  );
}

export default App;
