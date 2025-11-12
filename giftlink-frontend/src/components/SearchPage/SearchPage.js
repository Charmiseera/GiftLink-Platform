import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SearchPage.css';
import { urlConfig } from '../../config';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [ageRange, setAgeRange] = useState(5);
  const [searchResults, setSearchResults] = useState([]);
  const [allGifts, setAllGifts] = useState([]);

  const categories = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'];
  const conditions = ['New', 'Like New', 'Older'];

  const navigate = useNavigate();

  // ✅ Fetch all gifts initially
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = `${urlConfig.backendUrl}/api/gifts`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        setAllGifts(data);
        setSearchResults(data); // show all initially
      } catch (error) {
        console.error('Fetch error: ' + error.message);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Local filtering instead of /api/search
  const handleSearch = () => {
    const filtered = allGifts.filter((gift) => {
      const matchQuery = gift.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory ? gift.category === selectedCategory : true;
      const matchCondition = selectedCondition ? gift.condition === selectedCondition : true;
      const matchAge = gift.age ? gift.age <= ageRange : true;
      return matchQuery && matchCategory && matchCondition && matchAge;
    });
    setSearchResults(filtered);
  };

  // ✅ Navigate to details page
  const goToDetailsPage = (giftId) => {
    navigate(`/app/details/${giftId}`);
  };

  return (
    <div className="container mt-5 search-page-container">
      <div className="row justify-content-center">
        <div className="col-md-6">

          {/* ✅ Filters Section */}
          <div className="filter-section mb-4 p-4 border rounded">
            <h5 className="mb-3 fw-bold">Filters</h5>

            <label className="form-label">Category</label>
            <select
              className="dropdown-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="form-label mt-3">Condition</label>
            <select
              className="dropdown-filter"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="">All</option>
              {conditions.map((cond, i) => (
                <option key={i} value={cond}>{cond}</option>
              ))}
            </select>

            <label className="form-label mt-3">Less than {ageRange} years</label>
            <input
              type="range"
              className="age-range-slider"
              min="1"
              max="10"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            />
          </div>

          {/* ✅ Search Input + Button */}
          <div className="d-flex mb-4">
            <input
              type="text"
              className="search-input"
              placeholder="Search gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>

          {/* ✅ Results Section */}
          <div className="results-container">
            {searchResults.length > 0 ? (
              searchResults.map((gift) => (
                <div
                  key={gift._id}
                  className="search-results-card card p-3 mb-3"
                  onClick={() => goToDetailsPage(gift._id)}
                >
                  <img
                    src={gift.image || '/static/default-image.jpg'}
                    alt={gift.name}
                    className="card-img-top mb-3"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <h5>{gift.name}</h5>
                  <p className="text-muted">{gift.description}</p>
                  <small>Category: {gift.category}</small>
                </div>
              ))
            ) : (
              <div className="no-results-alert">No products found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
