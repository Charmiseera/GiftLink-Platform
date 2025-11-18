/*jshint esversion: 8 */
const { ObjectId } = require('mongodb');

/**
 * Item/Gift Model Schema Definition
 * 
 * This defines the structure for items/gifts in the GiftLink donation platform.
 * Items follow a lifecycle: AVAILABLE → REQUESTED → APPROVED → COMPLETED
 */

const ItemSchema = {
  name: String,           // Item name (e.g., "Sofa", "Dining Table")
  category: String,       // Category: Living, Bedroom, Bathroom, Kitchen, Office
  condition: String,      // Item condition (e.g., "New", "Like New", "Good", "Fair")
  description: String,    // Detailed description of the item
  image: String,          // Image URL (will be Cloudinary URL)
  zipcode: String,        // Location zipcode for pickup
  donorId: ObjectId,      // Reference to the User who donated this item
  donorEmail: String,     // Donor's email for easier querying
  donorName: String,      // Donor's name for display
  status: String,         // Item status: AVAILABLE, REQUESTED, APPROVED, COMPLETED
  requestedBy: ObjectId,  // User ID who requested this item (null if not requested)
  requesterEmail: String, // Requester's email
  requesterName: String,  // Requester's name
  reason: String,         // Reason provided by requester for needing this item
  requestedAt: Date,      // Timestamp when item was requested
  approvedAt: Date,       // Timestamp when request was approved
  completedAt: Date,      // Timestamp when donation was completed
  isDeleted: Boolean,     // Soft delete flag (default: false)
  deletedAt: Date,        // Timestamp when item was deleted
  deletedBy: ObjectId,    // User who deleted the item
  history: Array,         // Timeline of all actions on this item
  createdAt: Date,        // Item creation timestamp
  updatedAt: Date         // Last update timestamp
};

/**
 * Item Status Enum
 * Defines the possible states an item can be in
 */
const ItemStatus = {
  AVAILABLE: 'AVAILABLE',     // Item is listed and available for requests
  REQUESTED: 'REQUESTED',     // Someone has requested this item (pending approval)
  APPROVED: 'APPROVED',       // Donor approved the request (waiting for pickup/completion)
  COMPLETED: 'COMPLETED'      // Item has been successfully donated and received
};

/**
 * Item Categories
 * Predefined categories for items
 */
const ItemCategories = {
  LIVING: 'Living',
  BEDROOM: 'Bedroom',
  BATHROOM: 'Bathroom',
  KITCHEN: 'Kitchen',
  OFFICE: 'Office'
};

/**
 * Item Conditions
 * Predefined condition states
 */
const ItemConditions = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair'
};

/**
 * Create a new item document with default values
 * @param {Object} itemData - Item data from request
 * @param {Object} donor - Donor user object
 * @returns {Object} Formatted item document ready for insertion
 */
function createItemDocument(itemData, donor) {
  const now = new Date();
  
  return {
    name: itemData.name,
    category: itemData.category,
    condition: itemData.condition,
    description: itemData.description,
    image: itemData.image || '',
    zipcode: itemData.zipcode,
    donorId: new ObjectId(donor.id),
    donorEmail: donor.email,
    donorName: donor.name || `${donor.firstName} ${donor.lastName}`,
    status: ItemStatus.AVAILABLE,
    requestedBy: null,
    requesterEmail: null,
    requesterName: null,
    reason: null,
    requestedAt: null,
    approvedAt: null,
    completedAt: null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    history: [
      {
        action: 'created',
        userId: new ObjectId(donor.id),
        userEmail: donor.email,
        userName: donor.name || `${donor.firstName} ${donor.lastName}`,
        timestamp: now,
        details: 'Item listed for donation'
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Validate item data
 * @param {Object} itemData - Item data to validate
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateItem(itemData) {
  const errors = [];

  if (!itemData.name || itemData.name.trim().length === 0) {
    errors.push('Item name is required');
  }

  if (!itemData.category || !Object.values(ItemCategories).includes(itemData.category)) {
    errors.push('Valid category is required (Living, Bedroom, Bathroom, Kitchen, Office)');
  }

  if (!itemData.condition || !Object.values(ItemConditions).includes(itemData.condition)) {
    errors.push('Valid condition is required (New, Like New, Good, Fair)');
  }

  if (!itemData.description || itemData.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!itemData.zipcode || !/^\d{5}(-\d{4})?$/.test(itemData.zipcode)) {
    errors.push('Valid zipcode is required (e.g., 12345 or 12345-6789)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if user can request an item
 * @param {Object} item - Item document
 * @param {String} userId - ID of user attempting to request
 * @returns {Object} { canRequest: boolean, reason: String }
 */
function canRequestItem(item, userId) {
  // Cannot request own item
  if (item.donorId.toString() === userId.toString()) {
    return { canRequest: false, reason: 'Cannot request your own item' };
  }

  // Can only request items with AVAILABLE status
  if (item.status !== ItemStatus.AVAILABLE) {
    return { canRequest: false, reason: 'Item is not available for requests' };
  }

  return { canRequest: true };
}

/**
 * Check if user can approve/reject a request
 * @param {Object} item - Item document
 * @param {String} userId - ID of user attempting to approve/reject
 * @returns {Object} { canApprove: boolean, reason: String }
 */
function canApproveRequest(item, userId) {
  // Only donor can approve
  if (item.donorId.toString() !== userId.toString()) {
    return { canApprove: false, reason: 'Only the donor can approve requests' };
  }

  // Can only approve items with REQUESTED status
  if (item.status !== ItemStatus.REQUESTED) {
    return { canApprove: false, reason: 'No pending request to approve' };
  }

  return { canApprove: true };
}

/**
 * Check if user can mark item as completed
 * @param {Object} item - Item document
 * @param {String} userId - ID of user attempting to complete
 * @returns {Object} { canComplete: boolean, reason: String }
 */
function canCompleteItem(item, userId) {
  // Only donor can mark as completed
  if (item.donorId.toString() !== userId.toString()) {
    return { canComplete: false, reason: 'Only the donor can mark items as completed' };
  }

  // Can only complete items with APPROVED status
  if (item.status !== ItemStatus.APPROVED) {
    return { canComplete: false, reason: 'Item must be approved before completion' };
  }

  return { canComplete: true };
}

/**
 * Add history entry to item
 * @param {String} action - Action performed (e.g., 'requested', 'approved', 'completed', 'deleted')
 * @param {Object} user - User who performed the action
 * @param {String} details - Additional details about the action
 * @returns {Object} History entry object
 */
function createHistoryEntry(action, user, details = '') {
  return {
    action: action,
    userId: new ObjectId(user.id),
    userEmail: user.email,
    userName: user.name || user.firstName || 'Unknown User',
    timestamp: new Date(),
    details: details
  };
}

module.exports = {
  ItemSchema,
  ItemStatus,
  ItemCategories,
  ItemConditions,
  createItemDocument,
  validateItem,
  canRequestItem,
  canApproveRequest,
  canCompleteItem,
  createHistoryEntry
};
