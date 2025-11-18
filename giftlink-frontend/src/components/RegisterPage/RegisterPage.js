import React, { useState } from 'react';
import './RegisterPage.css';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AuthContext';

function RegisterPage() {
  // ✅ State variables
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); // 'donor' or 'receiver'
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { setIsLoggedIn, setUserName } = useAppContext();

  // ✅ Handle Registration with role
  const handleRegister = async () => {
    // Clear previous errors
    setErrorMessage('');

    // Validate all fields
    if (!firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }
    if (firstName.length < 2 || firstName.length > 50) {
      setErrorMessage('First name must be 2-50 characters');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(firstName)) {
      setErrorMessage('First name can only contain letters');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Last name is required');
      return;
    }
    if (lastName.length < 2 || lastName.length > 50) {
      setErrorMessage('Last name must be 2-50 characters');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(lastName)) {
      setErrorMessage('Last name can only contain letters');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErrorMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (!selectedRole) {
      setErrorMessage('Please select whether you are a Donor or Receiver');
      return;
    }

    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Step 2: Save user details in session storage
        sessionStorage.setItem('auth-token', data.authtoken);
        sessionStorage.setItem('name', data.userName);
        sessionStorage.setItem('email', data.email);
        sessionStorage.setItem('role', data.role);

        // ✅ Update global auth context
        setIsLoggedIn(true);
        setUserName(data.userName);

        // ✅ Redirect to Main Page
        navigate('/app');
      } else {
        // Handle validation errors from backend
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(err => err.message).join('. ');
          setErrorMessage(errorMessages);
        } else {
          setErrorMessage(data.error || 'Registration failed, please try again.');
        }
      }
    } catch (e) {
      console.error('Error registering:', e);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join GiftLink and start making a difference</p>

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

        {/* First Name */}
        <div className="form-group mb-3">
          <label htmlFor="firstName" className="form-label">First Name</label>
          <input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name */}
        <div className="form-group mb-3">
          <label htmlFor="lastName" className="form-label">Last Name</label>
          <input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="form-group mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Register Button */}
        <button 
          className="btn btn-primary" 
          onClick={handleRegister}
          style={{
            background: selectedRole === 'receiver' ? '#28a745' : '#5469d4',
            borderColor: selectedRole === 'receiver' ? '#28a745' : '#5469d4'
          }}
        >
          Register {selectedRole && `as ${selectedRole === 'donor' ? 'Donor' : 'Receiver'}`}
        </button>

        {/* Error Message */}
        {errorMessage && (
          <div className="alert">
            {errorMessage}
          </div>
        )}

        <p>
          Already have an account?{' '}
          <a href="/app/login">
            Login Here
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
