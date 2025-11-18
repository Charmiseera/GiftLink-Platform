import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ count = 6 }) => {
  return (
    <div className="skeleton-grid">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image shimmer"></div>
          <div className="skeleton-body">
            <div className="skeleton-title shimmer"></div>
            <div className="skeleton-badges">
              <div className="skeleton-badge shimmer"></div>
              <div className="skeleton-badge shimmer"></div>
            </div>
            <div className="skeleton-text shimmer"></div>
            <div className="skeleton-text shimmer"></div>
            <div className="skeleton-footer">
              <div className="skeleton-date shimmer"></div>
              <div className="skeleton-button shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
