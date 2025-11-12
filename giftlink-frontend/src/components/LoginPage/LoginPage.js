import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AuthContext';

function LoginPage() {
  // ✅ State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ Hooks
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserName } = useAppContext();

  // ✅ Handle Login
  const handleLogin = async () => {
    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Save user details in session storage
        sessionStorage.setItem('auth-token', data.authtoken);
        sessionStorage.setItem('name', data.userName);
        sessionStorage.setItem('email', data.userEmail);

        // ✅ Update global context
        setIsLoggedIn(true);
        setUserName(data.userName);

        // ✅ Redirect to main page
        navigate('/app');
      } else {
        setErrorMessage(data.error || 'Invalid credentials, please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="login-card p-4 border rounded shadow-sm bg-white">
            <h2 className="text-center mb-4 fw-bold">Welcome Back</h2>

            {/* ✅ Email Input */}
            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* ✅ Password Input */}
            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* ✅ Login Button */}
            <button className="btn btn-primary w-100" onClick={handleLogin}>
              Login
            </button>

            {/* ✅ Error Message */}
            {errorMessage && (
              <div className="alert alert-danger mt-3 text-center">
                {errorMessage}
              </div>
            )}

            <p className="mt-4 text-center">
              New here?{' '}
              <a href="/app/register" className="text-primary">
                Register Here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
