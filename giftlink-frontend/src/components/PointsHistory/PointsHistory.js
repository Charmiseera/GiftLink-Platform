import React, { useState, useEffect } from 'react';
import { urlConfig } from '../../config';
import './PointsHistory.css';

const PointsHistory = () => {
  const [history, setHistory] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPointsHistory();
  }, []);

  const fetchPointsHistory = async () => {
    try {
      const token = sessionStorage.getItem('auth-token');
      if (!token) {
        setError('Please login to view points history');
        setLoading(false);
        return;
      }

      const response = await fetch(`${urlConfig.backendUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch points history');
      }

      const data = await response.json();
      setCurrentPoints(data.giftPoints);
      
      // Sort history by date (newest first)
      const sortedHistory = [...(data.pointsHistory || [])].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setHistory(sortedHistory);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching points history:', err);
      setError('Failed to load points history. Please try again.');
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'initial':
        return '🎁';
      case 'request':
        return '📤';
      case 'refund':
        return '💰';
      case 'reward':
        return '🎉';
      case 'verification':
        return '✅';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'initial':
      case 'refund':
      case 'reward':
      case 'verification':
        return 'positive';
      case 'request':
        return 'negative';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="points-history-container">
        <div className="loading-spinner">Loading points history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="points-history-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="points-history-container">
      <div className="points-history-header">
        <h2>Gift Points History</h2>
        <div className="current-balance">
          <span className="balance-label">Current Balance:</span>
          <span className="balance-value">⭐ {currentPoints} Points</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="no-history">
          <p>No points history available yet.</p>
          <p>Start requesting items to see your points activity!</p>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={index} className="history-row">
                  <td className="date-cell">{formatDate(entry.date)}</td>
                  <td className="action-cell">
                    <span className={`action-badge ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)} {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                    </span>
                  </td>
                  <td className={`amount-cell ${entry.amount >= 0 ? 'positive' : 'negative'}`}>
                    {entry.amount >= 0 ? '+' : ''}{entry.amount}
                  </td>
                  <td className="balance-cell">{entry.balanceAfter}</td>
                  <td className="description-cell">{entry.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="points-info">
        <h3>How Points Work</h3>
        <ul>
          <li>🎁 <strong>Initial Points:</strong> You receive 100 points when you register</li>
          <li>📤 <strong>Request Cost:</strong> Each item request costs 10 points</li>
          <li>💰 <strong>Refund:</strong> If your request is rejected, you get 10 points back</li>
          <li>🎉 <strong>Reward:</strong> When you collect an item, you earn 5 points</li>
          <li>✅ <strong>Verification Bonus:</strong> Get verified by admin for 50 bonus points!</li>
        </ul>
        <p className="points-note">
          Points help ensure fairness. Verified users can make more requests per month!
        </p>
      </div>
    </div>
  );
};

export default PointsHistory;
