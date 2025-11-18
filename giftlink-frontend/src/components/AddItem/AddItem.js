import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsApi } from '../../api/itemsApi';
import './AddItem.css';

const AddItem = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    condition: '',
    description: '',
    zipcode: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const categories = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image must be less than 5MB'
        }));
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.condition) {
      newErrors.condition = 'Please select a condition';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'Zipcode is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipcode)) {
      newErrors.zipcode = 'Invalid zipcode format (e.g., 12345 or 12345-6789)';
    }

    // Image is optional for now (will be required when Cloudinary is integrated)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('category', formData.category);
      submitData.append('condition', formData.condition);
      submitData.append('description', formData.description);
      submitData.append('zipcode', formData.zipcode);
      
      // Add image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const newItem = await itemsApi.createItem(submitData);
      console.log('Item created successfully:', newItem);
      
      // Redirect to My Donations page or Main page
      navigate('/app');
      
    } catch (error) {
      console.error('Error creating item:', error);
      setSubmitError(error.message || 'Failed to create item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/app');
  };

  return (
    <div className="add-item-container">
      <div className="add-item-card">
        <h2>Add New Item</h2>
        <p className="subtitle">List an item you'd like to donate</p>

        {submitError && (
          <div className="error-message">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Item Name */}
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Dining Table, Sofa, Desk Lamp"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {/* Condition */}
          <div className="form-group">
            <label htmlFor="condition">Condition *</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className={errors.condition ? 'error' : ''}
            >
              <option value="">Select condition</option>
              {conditions.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
            {errors.condition && <span className="error-text">{errors.condition}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about the item (minimum 10 characters)"
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {/* Zipcode */}
          <div className="form-group">
            <label htmlFor="zipcode">Zipcode *</label>
            <input
              type="text"
              id="zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
              placeholder="e.g., 12345 or 12345-6789"
              className={errors.zipcode ? 'error' : ''}
            />
            {errors.zipcode && <span className="error-text">{errors.zipcode}</span>}
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Item Image (Optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className={errors.image ? 'error' : ''}
            />
            {errors.image && <span className="error-text">{errors.image}</span>}
            <small className="help-text">
              Upload an image of your item (Max 5MB, JPG/PNG)
            </small>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
