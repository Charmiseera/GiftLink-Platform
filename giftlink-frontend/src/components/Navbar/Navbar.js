import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AuthContext';
import GiftPointsBadge from './GiftPointsBadge';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, userName, setUserName } = useAppContext();
  const navigate = useNavigate();
  const [userRole, setUserRole] = React.useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    const name = sessionStorage.getItem('name');
    const role = sessionStorage.getItem('role');

    if (token && name) {
      setIsLoggedIn(true);
      setUserName(name);
      setUserRole(role || 'receiver');
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('');
    }
  }, [setIsLoggedIn, setUserName]);

  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUserName('');
    navigate('/app');
  };

  const handleProfileClick = () => {
    navigate('/app/profile');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      {/* ✅ Home.html as main landing */}
      <a className="navbar-brand" href="/home.html">GiftLink</a>

      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul className="navbar-nav">

          {/* Common links */}
          <li className="nav-item">
            <Link className="nav-link" to="/app">Gifts</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/app/search">Search</Link>
          </li>

          {/* Show Add Item link only when logged in */}
          {isLoggedIn && (
            <>
              {/* Show Admin Dashboard for admin users */}
              {userRole === 'admin' && (
                <li className="nav-item">
                  <Link className="nav-link" to="/app/admin" style={{ 
                    color: '#dc3545', 
                    fontWeight: '600' 
                  }}>
                    🛡️ Admin Dashboard
                  </Link>
                </li>
              )}
              
              {/* Show Add Item and My Donations only for donors */}
              {userRole === 'donor' && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/app/add-item">Add Item</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/app/my-donations">My Donations</Link>
                  </li>
                </>
              )}
              
              {/* Show My Requests only for receivers */}
              {userRole === 'receiver' && (
                <li className="nav-item">
                  <Link className="nav-link" to="/app/my-requests">My Requests</Link>
                </li>
              )}
            </>
          )}

          {/* Show Gift Points Badge for receivers */}
          {isLoggedIn && userRole === 'receiver' && (
            <li className="nav-item d-flex align-items-center">
              <GiftPointsBadge />
            </li>
          )}

          {/* Conditional rendering based on login state */}
          {isLoggedIn ? (
            <>
              {/* ✅ Clickable username */}
              <li className="nav-item">
                <span
                  className="nav-link"
                  style={{
                    color: '#007bff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '500',
                  }}
                  onClick={handleProfileClick}
                >
                  Welcome, {userName}
                </span>
              </li>

              <li className="nav-item">
                <button
                  className="btn btn-link nav-link text-danger"
                  onClick={handleLogout}
                  style={{ textDecoration: 'none' }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link 
                  className="btn btn-outline-primary" 
                  to="/app/login"
                  style={{ 
                    marginRight: '8px',
                    padding: '6px 20px',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="btn btn-primary text-white" 
                  to="/app/register"
                  style={{ 
                    padding: '6px 20px',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
