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
    navigate('/app');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <a className="navbar-brand" href="/home.html">GiftLink</a>
      <div className="collapse navbar-collapse justify-content-end">
        <ul className="navbar-nav">
          <li><Link className="nav-link" to="/app">Gifts</Link></li>
          <li><Link className="nav-link" to="/app/search">Search</Link></li>

          {isLoggedIn ? (
            <>
              <li className="nav-item"><span className="nav-link">Welcome, {userName}</span></li>
              <li className="nav-item"><button className="btn btn-link nav-link text-danger" onClick={handleLogout}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link className="nav-link" to="/app/login">Login</Link></li>
              <li><Link className="nav-link" to="/app/register">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

