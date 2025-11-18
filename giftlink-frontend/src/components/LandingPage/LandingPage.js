import React from 'react';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page-simple">
      <div className="content text-center">
        {/* Brand Title */}
        <h1 className="brand-title">GiftLink</h1>

        {/* Main Heading */}
        <h2 className="main-heading">Share Gifts and Joy!</h2>

        {/* Inspirational Quote */}
        <p className="quote">
          "Sharing is the essence of community. It is through giving that we enrich and
          perpetuate both our lives and the lives of others."
        </p>

        {/* Get Started Button */}
        <a href="/app/login" className="btn btn-primary btn-lg mt-4">
          Get Started
        </a>
      </div>
    </div>
  );
}

export default LandingPage;
