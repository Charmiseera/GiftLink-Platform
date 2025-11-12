import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DetailsPage.css";
import { urlConfig } from "../../config";

function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGift() {
      try {
        const response = await fetch(`${urlConfig.backendUrl}/api/gifts/${id}`);
        if (!response.ok) throw new Error("Failed to fetch gift details");
        const data = await response.json();
        setGift(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchGift();
  }, [id]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card p-4">
        <div className="text-center">
          {gift?.image ? (
            <img src={gift.image} alt={gift.name} className="product-image-large" />
          ) : (
            <div className="no-image-available-large">No Image Available</div>
          )}
        </div>
        <h2 className="details-title mt-4">{gift?.name}</h2>
        <p><strong>Category:</strong> {gift?.category}</p>
        <p><strong>Condition:</strong> {gift?.condition}</p>
        <p><strong>Description:</strong> {gift?.description}</p>
        <p><strong>Zipcode:</strong> {gift?.zipcode}</p>
      </div>
    </div>
  );
}

export default DetailsPage;
