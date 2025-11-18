/*jshint esversion: 8 */
const { ObjectId } = require('mongodb');

/**
 * Request Model Schema Definition
 * 
 * This defines the structure for item requests in the GiftLink donation platform.
 * Tracks the history of who requested what item and the status of that request.
 */

const RequestSchema = {
  itemId: ObjectId,         // Reference to the Item being requested
  itemName: String,         // Item name for easier display
  requesterId: ObjectId,    // User ID who is requesting the item
  requesterEmail: String,   // Requester's email
  requesterName: String,    // Requester's name for display
  donorId: ObjectId,        // User ID of the item's donor
  donorEmail: String,       // Donor's email
  donorName: String,        // Donor's name for display
  reason: String,           // Why the requester needs this item (required)
  status: String,           // Request status: PENDING, APPROVED, REJECTED
  requestDate: Date,        // When the request was made
  approvalDate: Date,       // When donor approved/rejected the request
  createdAt: Date,          // Record creation timestamp
  updatedAt: Date           // Last update timestamp
};

/**
 * Request Status Enum
 * Defines the possible states a request can be in
 */
const RequestStatus = {
  PENDING: 'PENDING',       // Request submitted, waiting for donor decision
  APPROVED: 'APPROVED',     // Donor approved the request
  REJECTED: 'REJECTED'      // Donor rejected the request
};

/**
 * Create a new request document
 * @param {Object} item - Item being requested
 * @param {Object} requester - User making the request
 * @param {String} reason - Reason for needing the item
 * @returns {Object} Formatted request document ready for insertion
 */
function createRequestDocument(item, requester, reason) {
  const now = new Date();
  
  return {
    itemId: new ObjectId(item._id),
    itemName: item.name,
    requesterId: new ObjectId(requester.id),
    requesterEmail: requester.email,
    requesterName: requester.name || `${requester.firstName} ${requester.lastName}`,
    donorId: new ObjectId(item.donorId),
    donorEmail: item.donorEmail,
    donorName: item.donorName,
    reason: reason,
    status: RequestStatus.PENDING,
    requestDate: now,
    approvalDate: null,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Validate request data
 * @param {Object} requestData - Request data to validate
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateRequest(requestData) {
  const errors = [];

  if (!requestData.reason || requestData.reason.trim().length === 0) {
    errors.push('Reason for requesting is required');
  }

  if (requestData.reason && requestData.reason.trim().length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }

  if (requestData.reason && requestData.reason.trim().length > 500) {
    errors.push('Reason cannot exceed 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Update request status (approve or reject)
 * @param {Object} request - Current request document
 * @param {String} newStatus - New status (APPROVED or REJECTED)
 * @returns {Object} Update object for MongoDB
 */
function updateRequestStatus(request, newStatus) {
  const now = new Date();
  
  return {
    $set: {
      status: newStatus,
      approvalDate: now,
      updatedAt: now
    }
  };
}

/**
 * Check if a user has already requested an item
 * @param {Array} requests - Array of existing requests
 * @param {String} itemId - Item ID
 * @param {String} userId - User ID
 * @returns {Boolean} True if user has already requested this item
 */
function hasUserRequestedItem(requests, itemId, userId) {
  return requests.some(req => 
    req.itemId.toString() === itemId.toString() && 
    req.requesterId.toString() === userId.toString() &&
    req.status === RequestStatus.PENDING
  );
}

/**
 * Get user's request for a specific item
 * @param {Array} requests - Array of requests
 * @param {String} itemId - Item ID
 * @param {String} userId - User ID
 * @returns {Object|null} Request document or null
 */
function getUserRequestForItem(requests, itemId, userId) {
  return requests.find(req => 
    req.itemId.toString() === itemId.toString() && 
    req.requesterId.toString() === userId.toString()
  ) || null;
}

module.exports = {
  RequestSchema,
  RequestStatus,
  createRequestDocument,
  validateRequest,
  updateRequestStatus,
  hasUserRequestedItem,
  getUserRequestForItem
};
