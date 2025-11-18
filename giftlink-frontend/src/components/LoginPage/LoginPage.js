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
  const [selectedRole, setSelectedRole] = useState(''); // 'donor' or 'receiver'
  // ✅ Task 4: Include a state for incorrect password / error message
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ Task 5: Create local variables for navigate, bearerToken, and setIsLoggedIn
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserName } = useAppContext();
  const bearerToken = sessionStorage.getItem('auth-token');

  // ✅ Task 6: If bearerToken exists, navigate to MainPage
  React.useEffect(() => {
    if (bearerToken) {
      navigate('/app');
    }
  }, [bearerToken, navigate]);

  // ✅ handleLogin function with role validation
  const handleLogin = async () => {
    // Check if it's admin login (admin@giftlink.com doesn't need role selection)
    const isAdminEmail = email.toLowerCase() === 'admin@giftlink.com';
    
    // Validate role selection for non-admin users
    if (!selectedRole && !isAdminEmail) {
      setErrorMessage('Please select whether you are a Donor or Receiver');
      return;
    }

    try {
      // Step 1: Implement API call with role (optional for admin)
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: isAdminEmail ? undefined : selectedRole 
        })
      });

      // ✅ Step 2: Access and process data
      const data = await response.json(); // Task 1: Access data

      if (response.ok) {
        // Task 2: Set user details in session storage
        sessionStorage.setItem('auth-token', data.authtoken);
        sessionStorage.setItem('name', data.userName);
        sessionStorage.setItem('email', data.userEmail);
        sessionStorage.setItem('role', data.role);

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
    <div className="login-page-wrapper">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to continue to GiftLink</p>

        {/* Role Selection */}
        <div className="role-selection-login">
          <label className="form-label">I am a:</label>
          <div className="role-options">
            <div 
              className={`role-option ${selectedRole === 'donor' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('donor')}
            >
              <div className="role-icon">🎁</div>
              <div className="role-info">
                <h4>Donor</h4>
                <p>I want to donate items</p>
              </div>
              <div className="radio-indicator">
                {selectedRole === 'donor' && '✓'}
              </div>
            </div>

            <div 
              className={`role-option ${selectedRole === 'receiver' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('receiver')}
            >
              <div className="role-icon">🙏</div>
              <div className="role-info">
                <h4>Receiver</h4>
                <p>I need to request items</p>
              </div>
              <div className="radio-indicator">
                {selectedRole === 'receiver' && '✓'}
              </div>
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div className="form-group mb-3">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="form-group mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button 
          className="btn btn-primary" 
          onClick={handleLogin}
          style={{
            background: selectedRole === 'receiver' ? '#28a745' : '#5469d4',
            borderColor: selectedRole === 'receiver' ? '#28a745' : '#5469d4'
          }}
        >
          Login {selectedRole && `as ${selectedRole === 'donor' ? 'Donor' : 'Receiver'}`}
        </button>

        {/* Error Message */}
        {errorMessage && (
          <div className="alert">
            {errorMessage}
          </div>
        )}

        <p>
          New here?{' '}
          <a href="/app/register">
            Register Here
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
