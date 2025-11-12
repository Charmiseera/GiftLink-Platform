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
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { setIsLoggedIn, setUserName } = useAppContext();

  // ✅ Handle Registration
  const handleRegister = async () => {
    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Step 2: Save user details in session storage
        sessionStorage.setItem('auth-token', data.authtoken);
        sessionStorage.setItem('name', firstName);
        sessionStorage.setItem('email', email);

        // ✅ Update global auth context
        setIsLoggedIn(true);
        setUserName(firstName);

        // ✅ Redirect to Main Page
        navigate('/app');
      } else {
        setErrorMessage(data.error || 'Registration failed, please try again.');
      }
    } catch (e) {
      console.error('Error registering:', e);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="register-card p-4 border rounded shadow-sm bg-white">
            <h2 className="text-center mb-4 fw-bold">Create Account</h2>

            {/* ✅ Form Inputs */}
            <input
              type="text"
              placeholder="First Name"
              className="form-control mb-3"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Last Name"
              className="form-control mb-3"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* ✅ Register Button */}
            <button className="btn btn-primary w-100" onClick={handleRegister}>
              Register
            </button>

            {/* ✅ Error Message */}
            {errorMessage && (
              <div className="alert alert-danger mt-3 text-center">
                {errorMessage}
              </div>
            )}

            <p className="mt-4 text-center">
              Already a member?{' '}
              <a href="/app/login" className="text-primary">
                Login Here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
