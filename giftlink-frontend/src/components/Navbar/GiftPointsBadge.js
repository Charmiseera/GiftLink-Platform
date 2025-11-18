import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './GiftPointsBadge.css';

export default function GiftPointsBadge() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
    // Refresh points every 30 seconds
    const interval = setInterval(fetchPoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPoints = async () => {
    try {
      const token = sessionStorage.getItem('auth-token');
      const role = sessionStorage.getItem('role');
      
      // Only fetch points for receivers
      if (role !== 'receiver' || !token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${urlConfig.backendUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.giftPoints || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gift points:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (points === null) {
    return null;
  }

  // Color based on points balance
  const getPointsClass = () => {
    if (points >= 50) return 'points-high';
    if (points >= 20) return 'points-medium';
    return 'points-low';
  };

  return (
    <div 
      className={`gift-points-badge ${getPointsClass()}`} 
      title="Click to view points history"
      onClick={() => navigate('/app/points-history')}
    >
      ⭐ {points} Points
    </div>
  );
}
