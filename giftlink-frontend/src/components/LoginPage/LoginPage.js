import React, { useState } from 'react';
import './LoginPage.css';
// ✅ Task 1: Import urlConfig
import { urlConfig } from '../../config';
// ✅ Task 2: Import useAppContext
import { useAppContext } from '../../context/AuthContext';
// ✅ Task 3: Import useNavigate
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  // ✅ State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ✅ Task 4: Include a state for incorrect password / error message
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ Task 5: Create local variables for navigate, bearerToken, and setIsLoggedIn
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserName } = useAppContext();
  const bearerToken = sessionStorage.getItem('auth-token');

  // ✅ Task 6: If bearerToken exists, navigate to MainPage
  if (bearerToken) {
    navigate('/app');
  }

  // ✅ handleLogin function with both steps implemented
  const handleLogin = async () => {
    try {
      // Step 1: Implement API call
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // ✅ Step 2: Access and process data
      const data = await response.json(); // Task 1: Access data

      if (response.ok) {
        // Task 2: Set user details in session storage
        sessionStorage.setItem('auth-token', data.authtoken);
        sessionStorage.setItem('name', data.userName);
        sessionStorage.setItem('email', data.userEmail);

        // Task 3: Update context to logged in
        setIsLoggedIn(true);
        setUserName(data.userName);

        // Task 4: Navigate to MainPage
        navigate('/app');
      } else {
        // Task 5: Clear input + show message if incorrect password
        setEmail('');
        setPassword('');
        setErrorMessage(data.error || 'Incorrect email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Task 6: Display generic error message
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="login-card p-4 border rounded shadow-sm bg-white">
            <h2 className="text-center mb-4 fw-bold">Welcome Back</h2>

            {/* Email Input */}
            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password Input */}
            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Login Button */}
            <button className="btn btn-primary w-100" onClick={handleLogin}>
              Login
            </button>

            {/* Error Message */}
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
