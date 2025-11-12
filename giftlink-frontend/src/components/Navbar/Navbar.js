import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, userName, setUserName } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    const name = sessionStorage.getItem('name');

    if (token && name) {
      setIsLoggedIn(true);
      setUserName(name);
    } else {
      setIsLoggedIn(false);
      setUserName('');
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
                <Link className="nav-link" to="/app/login">Login</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/app/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
