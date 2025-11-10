import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailsPage.css";

function DetailsPage() {
  const { id } = useParams(); // gift ID from URL
  const navigate = useNavigate();

  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("token");
    if (!isAuthenticated) {
      navigate("/app/login");
    }
  }, [navigate]);

  // 2. Fetch gift details
  useEffect(() => {
    async function fetchGift() {
      try {
        const response = await fetch(`http://localhost:3060/api/gifts/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch gift details");
        }

        const data = await response.json();
        setGift(data);
        setLoading(true);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchGift();
  }, [id]);

  // 3. Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 4. Handle back click
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={handleBack}>
        ← Back
      </button>

      <div className="card p-4">
        {/* Gift Image */}
        <div className="text-center">
          {gift?.image ? (
            <img
              src={gift.image}
              alt={gift.name}
              className="product-image-large"
            />
          ) : (
            <div className="no-image-available-large">
              No Image Available
            </div>
          )}
        </div>

        <h2 className="details-title mt-4">{gift?.name}</h2>

        <p><strong>Category:</strong> {gift?.category}</p>
        <p><strong>Condition:</strong> {gift?.condition}</p>
        <p><strong>Description:</strong> {gift?.description}</p>
        <p><strong>Zipcode:</strong> {gift?.zipcode}</p>

        {/* 7. Comments Section */}
        <div className="comments-section mt-4">
          <h4>Comments</h4>
          <p>No comments yet.</p>
        </div>
      </div>
    </div>
  );
}

export default DetailsPage;
