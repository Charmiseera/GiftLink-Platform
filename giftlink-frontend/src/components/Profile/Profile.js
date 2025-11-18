import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { urlConfig } from "../../config";
import { useAppContext } from "../../context/AuthContext";

const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const [updatedDetails, setUpdatedDetails] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [changed, setChanged] = useState("");
  const [pointsData, setPointsData] = useState(null);
  const navigate = useNavigate();
  const { setUserName } = useAppContext();
  
  const userRole = sessionStorage.getItem('role');

  useEffect(() => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
    } else {
      fetchUserProfile();
      if (userRole === 'receiver') {
        fetchPointsData();
      }
    }
  }, [navigate, userRole]);

  // ✅ Fetch user profile details from session
  const fetchUserProfile = () => {
    try {
      const name = sessionStorage.getItem("name");
      const email = sessionStorage.getItem("email");
      const storedUserDetails = { name, email };
      setUserDetails(storedUserDetails);
      setUpdatedDetails(storedUserDetails);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Fetch gift points data for receivers
  const fetchPointsData = async () => {
    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authtoken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPointsData(data);
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    }
  };

  // Calculate next monthly reset date
  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleEdit = () => setEditMode(true);

  const handleInputChange = (e) => {
    setUpdatedDetails({
      ...updatedDetails,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email");

      if (!authtoken || !email) {
        navigate("/app/login");
        return;
      }

      const payload = { email, name: updatedDetails.name };

      // ✅ Step 1: API call
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/update`, {
        method: "PUT", // ✅ Task 1: Method
        headers: {
          "Content-Type": "application/json", // ✅ Task 2: Headers
          "auth-token": authtoken,
        },
        body: JSON.stringify(payload), // ✅ Task 3: Body
      });

      if (response.ok) {
        // ✅ Step 4: Update AppContext + session
        sessionStorage.setItem("name", updatedDetails.name);
        setUserName(updatedDetails.name);

        // ✅ Step 5: Update UI
        setUserDetails(updatedDetails);
        setEditMode(false);
        setChanged("Name Changed Successfully!");

        setTimeout(() => {
          setChanged("");
          navigate("/app");
        }, 1000);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  return (
    <div className="profile-container">
      {editMode ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={userDetails.email}
              disabled
              className="form-control mb-3"
            />
          </label>

          <label>
            Name
            <input
              type="text"
              name="name"
              value={updatedDetails.name}
              onChange={handleInputChange}
              className="form-control mb-3"
            />
          </label>

          <button type="submit" className="btn btn-primary w-100">
            Save Changes
          </button>
        </form>
      ) : (
        <div className="profile-details text-center">
          <h2 className="fw-bold">Hi, {userDetails.name}</h2>
          <p>
            <b>Email:</b> {userDetails.email}
          </p>
          <button
            onClick={handleEdit}
            className="btn btn-outline-primary mt-2"
          >
            Edit Profile
          </button>

          {changed && (
            <span
              style={{
                color: "green",
                display: "block",
                fontStyle: "italic",
                fontSize: "13px",
                marginTop: "10px",
              }}
            >
              {changed}
            </span>
          )}
        </div>
      )}

      {/* Gift Points Summary for Receivers */}
      {userRole === 'receiver' && pointsData && (
        <div className="points-summary-section">
          <h3 className="points-summary-title">🎁 Gift Points Summary</h3>
          
          <div className="points-summary-grid">
            <div className="points-stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-label">Current Balance</div>
                <div className="stat-value">{pointsData.giftPoints} Points</div>
              </div>
            </div>

            <div className="points-stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Monthly Requests</div>
                <div className="stat-value">
                  {pointsData.monthlyRequestCount} / {pointsData.monthlyRequestLimit}
                </div>
              </div>
            </div>

            <div className="points-stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-label">Next Reset</div>
                <div className="stat-value-small">{getNextResetDate()}</div>
              </div>
            </div>

            {pointsData.isVerified && (
              <div className="points-stat-card verified-badge">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-label">Status</div>
                  <div className="stat-value-small">Verified User</div>
                </div>
              </div>
            )}
          </div>

          {pointsData.pointsHistory && pointsData.pointsHistory.length > 0 && (
            <div className="recent-transactions">
              <h4>Recent Transactions</h4>
              <div className="transactions-list">
                {pointsData.pointsHistory.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-info">
                      <span className={`transaction-type ${transaction.action}`}>
                        {transaction.action.charAt(0).toUpperCase() + transaction.action.slice(1)}
                      </span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-outline-secondary btn-sm mt-3"
                onClick={() => navigate('/app/points-history')}
              >
                View Full History →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
