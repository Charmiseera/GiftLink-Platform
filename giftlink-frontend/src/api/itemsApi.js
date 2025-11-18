import { urlConfig } from '../config';

const API_URL = urlConfig.backendUrl;

/**
 * Get authentication token from session storage
 */
const getAuthToken = () => {
  return sessionStorage.getItem('auth-token');
};

/**
 * Get authentication headers
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Items API Service
 */
const itemsApi = {
  /**
   * Get all available items
   * @param {String} status - Optional status filter (AVAILABLE, REQUESTED, APPROVED, COMPLETED)
   * @param {Number} page - Page number (default: 1)
   * @param {Number} limit - Items per page (default: 20)
   * @param {String} category - Optional category filter
   * @param {String} condition - Optional condition filter
   * @param {String} zipcode - Optional zipcode filter
   */
  getAllItems: async (status = 'AVAILABLE', page = 1, limit = 20, category = null, condition = null, zipcode = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page);
      params.append('limit', limit);
      if (category) params.append('category', category);
      if (condition) params.append('condition', condition);
      if (zipcode) params.append('zipcode', zipcode);
      
      const url = `${API_URL}/api/items?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  /**
   * Get item by ID
   * @param {String} id - Item ID
   */
  getItemById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  },

  /**
   * Create a new item (requires authentication)
   * @param {FormData|Object} itemData - Item data (FormData for image upload or Object)
   */
  createItem: async (itemData) => {
    try {
      const token = getAuthToken();
      
      // Check if itemData is FormData (for image upload)
      const isFormData = itemData instanceof FormData;
      
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Only set Content-Type for JSON, let browser set it for FormData
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: headers,
        body: isFormData ? itemData : JSON.stringify(itemData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  /**
   * Request an item (requires authentication)
   * @param {String} itemId - Item ID to request
   * @param {String} reason - Reason for requesting the item
   */
  requestItem: async (itemId, reason) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to request item';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error requesting item:', error);
      throw error;
    }
  },

  /**
   * Approve a request (requires authentication, donor only)
   * @param {String} itemId - Item ID to approve
   */
  approveRequest: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  },

  /**
   * Reject a request (requires authentication, donor only)
   * @param {String} itemId - Item ID to reject
   */
  rejectRequest: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  },

  /**
   * Mark item as completed (requires authentication, donor only)
   * @param {String} itemId - Item ID to mark as completed
   */
  completeItem: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/complete`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing item:', error);
      throw error;
    }
  },

  /**
   * Get current user's donations (requires authentication)
   */
  getMyDonations: async () => {
    try {
      const response = await fetch(`${API_URL}/api/items/donor/me`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching donations:', error);
      throw error;
    }
  },

  /**
   * Delete an item (requires authentication, donor only, AVAILABLE items only)
   * @param {String} itemId - Item ID to delete
   */
  deleteItem: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }
};

/**
 * Requests API Service
 */
const requestsApi = {
  /**
   * Get current user's requests (requires authentication)
   */
  getMyRequests: async () => {
    try {
      const response = await fetch(`${API_URL}/api/requests/me`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  /**
   * Get requests for a specific item (requires authentication, donor only)
   * @param {String} itemId - Item ID
   */
  getItemRequests: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/item/${itemId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch item requests');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching item requests:', error);
      throw error;
    }
  }
};

export { itemsApi, requestsApi };
