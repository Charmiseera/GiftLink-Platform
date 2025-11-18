/*jshint esversion: 8 */
const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();
const connectToDatabase = require('../models/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { validateObjectId } = require('../middleware/validation');
const { 
  createItemDocument, 
  validateItem, 
  ItemStatus,
  canRequestItem,
  canApproveRequest,
  canCompleteItem,
  createHistoryEntry
} = require('../models/Item');
const { 
  createRequestDocument,
  validateRequest,
  RequestStatus,
  updateRequestStatus,
  hasUserRequestedItem
} = require('../models/Request');
const pino = require('pino');

const logger = pino();

// ========================================
// GET /api/items - Get all available items with pagination and filtering
// ========================================
router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const giftsCollection = db.collection('gifts');

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter parameters
    const status = req.query.status || ItemStatus.AVAILABLE;
    const category = req.query.category;
    const condition = req.query.condition;
    const zipcode = req.query.zipcode;
    
    // Build query for items collection
    const query = { isDeleted: { $ne: true } }; // Exclude soft-deleted items
    
    if (status) {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (condition) {
      query.condition = condition;
    }
    if (zipcode) {
      query.zipcode = zipcode;
    }

    // Get total count for pagination
    const totalItems = await itemsCollection.countDocuments(query);
    
    // Get items from items collection (new schema) with pagination
    const items = await itemsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get gifts from gifts collection (old schema) and transform them
    const gifts = await giftsCollection.find({}).toArray();
    
    // Look up legacy donor's user ID once for all legacy items
    const usersCollection = db.collection('users');
    const legacyDonor = await usersCollection.findOne({ email: 'charmiseera07@gmail.com' });
    const legacyDonorId = legacyDonor ? legacyDonor._id : new ObjectId('000000000000000000000000');
    
    // Transform old gifts to match new item schema
    const transformedGifts = gifts.map(gift => ({
      _id: gift._id,
      name: gift.name || 'Unnamed Item',
      category: gift.category || 'Other',
      condition: gift.condition || 'Good',
      description: gift.description || 'No description available',
      image: gift.image || '',
      zipcode: gift.zipcode || '00000',
      donorId: legacyDonorId,
      donorEmail: 'charmiseera07@gmail.com', // Legacy items donor
      donorName: 'Charmi',
      status: ItemStatus.AVAILABLE, // All old gifts are available
      requestedBy: null,
      reason: null,
      createdAt: gift.date_added ? new Date(gift.date_added * 1000) : new Date(),
      updatedAt: gift.date_added ? new Date(gift.date_added * 1000) : new Date(),
      isLegacy: true // Flag to identify old gifts
    }));

    // Merge both collections - items first, then legacy gifts (only for page 1)
    let allItems = items;
    if (page === 1 && status === ItemStatus.AVAILABLE) {
      allItems = [...items, ...transformedGifts];
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Fetched ${items.length} new items and ${transformedGifts.length} legacy gifts`);
    
    res.json({
      items: allItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      }
    });

  } catch (error) {
    logger.error('Error fetching items:', error);
    res.status(500).json({ error: 'Error fetching items' });
  }
});

// ========================================
// GET /api/items/donor/me - Get logged-in user's donations (PROTECTED)
// NOTE: This must come BEFORE /:id route to avoid conflicts
// ========================================
router.get('/donor/me', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');

    // Get all items donated by this user (exclude soft-deleted)
    const items = await itemsCollection
      .find({ 
        donorId: new ObjectId(req.user.id),
        isDeleted: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .toArray();

    logger.info(`Fetched ${items.length} donations for user: ${req.user.email}`);
    res.json(items);

  } catch (error) {
    logger.error('Error fetching user donations:', error);
    res.status(500).json({ error: 'Error fetching donations' });
  }
});

// ========================================
// GET /api/items/:id - Get item by ID
// ========================================
router.get('/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const giftsCollection = db.collection('gifts');
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Try to find in items collection first
    let item = await itemsCollection.findOne({ _id: new ObjectId(id) });

    // If not found, check gifts collection (legacy data)
    if (!item) {
      const gift = await giftsCollection.findOne({ _id: new ObjectId(id) });
      
      if (gift) {
        // Look up legacy donor's user ID
        const usersCollection = db.collection('users');
        const legacyDonor = await usersCollection.findOne({ email: 'charmiseera07@gmail.com' });
        const legacyDonorId = legacyDonor ? legacyDonor._id : new ObjectId('000000000000000000000000');
        
        // Transform legacy gift to item format
        item = {
          _id: gift._id,
          name: gift.name || 'Unnamed Item',
          category: gift.category || 'Other',
          condition: gift.condition || 'Good',
          description: gift.description || 'No description available',
          image: gift.image || '',
          zipcode: gift.zipcode || '00000',
          donorId: legacyDonorId,
          donorEmail: 'charmiseera07@gmail.com',
          donorName: 'Charmi',
          status: ItemStatus.AVAILABLE,
          requestedBy: null,
          reason: null,
          createdAt: gift.date_added ? new Date(gift.date_added * 1000) : new Date(),
          updatedAt: gift.date_added ? new Date(gift.date_added * 1000) : new Date(),
          isLegacy: true
        };
      }
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);

  } catch (error) {
    logger.error('Error fetching item:', error);
    res.status(500).json({ error: 'Error fetching item' });
  }
});

// ========================================
// POST /api/items - Add new item (PROTECTED)
// ========================================
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Validate item data
    const validation = validateItem(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Get user details from database
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(req.user.id) 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create item document
    const donor = {
      id: req.user.id,
      email: req.user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Add Cloudinary image URL if uploaded
    const itemData = { ...req.body };
    if (req.file) {
      itemData.image = req.file.path; // Cloudinary URL
    }

    const itemDocument = createItemDocument(itemData, donor);

    // Insert item
    const itemsCollection = db.collection('items');
    const result = await itemsCollection.insertOne(itemDocument);

    // Return created item
    const createdItem = await itemsCollection.findOne({ 
      _id: result.insertedId 
    });

    logger.info(`Item created: ${createdItem.name} by ${donor.email}`);
    res.status(201).json(createdItem);

  } catch (error) {
    logger.error('Error creating item:', error);
    res.status(500).json({ error: 'Error creating item' });
  }
});

// ========================================
// POST /api/items/:id/request - Request an item (PROTECTED)
// ========================================
router.post('/:id/request', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const requestsCollection = db.collection('requests');
    const usersCollection = db.collection('users');
    const giftsCollection = db.collection('gifts');
    const { id } = req.params;
    const { reason } = req.body;

    logger.info(`[REQUEST] Item ID received: ${id}, User: ${req.user.email}`);

    // Validate item ID
    if (!ObjectId.isValid(id)) {
      logger.error(`[REQUEST] Invalid ObjectId format: ${id}`);
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Validate reason
    const validation = validateRequest({ reason });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Get item - check both items and gifts (legacy) collections
    let itemObjectId;
    try {
      itemObjectId = new ObjectId(id);
    } catch (err) {
      logger.error(`[REQUEST] Error creating ObjectId from ${id}: ${err.message}`);
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    
    let item = await itemsCollection.findOne({ _id: itemObjectId });
    logger.info(`[REQUEST] Item found in items collection: ${!!item}`);
    
    // If not found in items, check legacy gifts collection
    if (!item) {
      logger.info(`[REQUEST] Checking gifts collection for legacy item: ${id}`);
      let legacyGift = await giftsCollection.findOne({ _id: itemObjectId });
      
      // If not found by _id, try searching by the original 'id' field
      if (!legacyGift) {
        logger.info(`[REQUEST] Trying to find gift by 'id' field: ${id}`);
        legacyGift = await giftsCollection.findOne({ id: id });
      }
      
      logger.info(`[REQUEST] Legacy gift found: ${!!legacyGift}, Name: ${legacyGift?.name || 'N/A'}`);
      
      if (legacyGift) {
        // Look up the legacy donor's user ID
        const usersCollection = db.collection('users');
        const legacyDonor = await usersCollection.findOne({ email: 'charmiseera07@gmail.com' });
        const legacyDonorId = legacyDonor ? legacyDonor._id : null;
        
        if (!legacyDonorId) {
          logger.error('[REQUEST] Legacy donor not found in database');
          return res.status(500).json({ error: 'Legacy donor account not found' });
        }
        
        // Transform legacy gift to item format
        item = {
          _id: legacyGift._id,
          name: legacyGift.name || 'Unnamed Item',
          category: legacyGift.category || 'Other',
          condition: legacyGift.condition || 'Used',
          description: legacyGift.description || 'No description available',
          image: legacyGift.image || '',
          zipcode: legacyGift.zipcode || '00000',
          donorId: legacyDonorId,
          donorEmail: 'charmiseera07@gmail.com',
          donorName: 'Charmi',
          status: ItemStatus.AVAILABLE,
          requestedBy: null,
          reason: null,
          createdAt: legacyGift.date_added ? new Date(legacyGift.date_added * 1000) : new Date(),
          updatedAt: legacyGift.date_added ? new Date(legacyGift.date_added * 1000) : new Date(),
          isLegacy: true,
          history: []
        };
        
        // Migrate legacy item to items collection for future requests
        try {
          await itemsCollection.insertOne(item);
          logger.info(`Migrated legacy item ${item.name} to items collection`);
        } catch (insertError) {
          // If duplicate key error (item already migrated), just continue
          if (insertError.code === 11000) {
            logger.info(`Legacy item ${item.name} already migrated, continuing...`);
            // Re-fetch from items collection to get the migrated version
            item = await itemsCollection.findOne({ _id: new ObjectId(id) });
          } else {
            throw insertError;
          }
        }
      } else {
        return res.status(404).json({ error: 'Item not found' });
      }
    }

    // Check if user can request this item
    const canRequest = canRequestItem(item, req.user.id);
    if (!canRequest.canRequest) {
      return res.status(403).json({ error: canRequest.reason });
    }

    // Check if user already has a pending request for this item
    const existingRequests = await requestsCollection
      .find({ itemId: new ObjectId(id) })
      .toArray();
    
    if (hasUserRequestedItem(existingRequests, id, req.user.id)) {
      return res.status(400).json({ 
        error: 'You have already requested this item' 
      });
    }

    // Get requester details
    const requester = await usersCollection.findOne({ 
      _id: new ObjectId(req.user.id) 
    });

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ========================================
    // GIFT POINTS VALIDATION AND DEDUCTION
    // ========================================
    const POINTS_COST = 10;
    const currentPoints = requester.giftPoints || 0;
    const monthlyCount = requester.monthlyRequestCount || 0;
    const monthlyLimit = requester.monthlyRequestLimit || 5;

    // Check if user has sufficient points
    if (currentPoints < POINTS_COST) {
      return res.status(403).json({ 
        error: `Insufficient points. You need at least ${POINTS_COST} points to request an item.`,
        currentPoints,
        requiredPoints: POINTS_COST
      });
    }

    // Check monthly request limit
    if (monthlyCount >= monthlyLimit) {
      return res.status(403).json({ 
        error: `Monthly request limit reached. You can make ${monthlyLimit} requests per month.`,
        currentCount: monthlyCount,
        limit: monthlyLimit,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      });
    }

    // Deduct points immediately and increment monthly counter
    const newBalance = currentPoints - POINTS_COST;
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          giftPoints: newBalance 
        },
        $inc: {
          monthlyRequestCount: 1
        },
        $push: {
          pointsHistory: {
            action: 'request',
            amount: -POINTS_COST,
            balance: newBalance,
            itemId: id,
            itemName: item.name,
            reason: `Requested item: ${item.name}`,
            timestamp: new Date()
          }
        }
      }
    );

    logger.info(`Points deducted: User ${req.user.email} spent ${POINTS_COST} points. New balance: ${newBalance}`);

    const requesterInfo = {
      id: req.user.id,
      email: req.user.email,
      firstName: requester.firstName,
      lastName: requester.lastName
    };

    logger.info(`[REQUEST] Creating request document with requesterInfo:`, JSON.stringify(requesterInfo));

    // Create request document
    const requestDocument = createRequestDocument(item, requesterInfo, reason);
    
    logger.info(`[REQUEST] Request document created, inserting...`);

    // Insert request
    const requestInsertResult = await requestsCollection.insertOne(requestDocument);
    
    logger.info(`[REQUEST] Request inserted successfully with ID: ${requestInsertResult.insertedId}`);

    // Add history entry
    logger.info(`[REQUEST] Creating history entry with user:`, JSON.stringify({ id: req.user.id, email: req.user.email }));
    
    const historyEntry = createHistoryEntry(
      'requested',
      { id: req.user.id, email: req.user.email, name: `${requester.firstName} ${requester.lastName}` },
      `Item requested by ${requester.firstName} ${requester.lastName}`
    );
    
    logger.info(`[REQUEST] History entry created:`, JSON.stringify(historyEntry));

    // Update item status to REQUESTED
    const now = new Date();
    
    // Build update operations
    logger.info(`[REQUEST] Building update operations for item ${id}`);
    logger.info(`[REQUEST] req.user.id type: ${typeof req.user.id}, value: ${req.user.id}`);
    logger.info(`[REQUEST] Item history exists: ${!!item.history}, isArray: ${Array.isArray(item.history)}`);
    
    const updateOps = {
      $set: { 
        status: ItemStatus.REQUESTED,
        requestedBy: new ObjectId(req.user.id),
        requesterEmail: requester.email,
        requesterName: `${requester.firstName} ${requester.lastName}`,
        reason: reason,
        requestedAt: now,
        updatedAt: now
      }
    };
    
    // Initialize history array if it doesn't exist, then push
    if (!item.history || !Array.isArray(item.history)) {
      logger.info(`[REQUEST] Setting history as new array`);
      updateOps.$set.history = [historyEntry];
    } else {
      logger.info(`[REQUEST] Pushing to existing history array`);
      updateOps.$push = { history: historyEntry };
    }
    
    logger.info(`[REQUEST] Update operations prepared:`, JSON.stringify(updateOps, null, 2));
    logger.info(`[REQUEST] Attempting to update item in database...`);
    
    const updateResult = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateOps
    );
    
    logger.info(`[REQUEST] Item update result:`, JSON.stringify(updateResult));

    logger.info(`Item requested: ${item.name} by ${requester.email}`);
    res.status(200).json({ 
      message: 'Item requested successfully',
      itemId: id,
      status: ItemStatus.REQUESTED
    });

  } catch (error) {
    const { id } = req.params; // Get id from params for error logging
    logger.error('Error requesting item:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      userId: req.user?.id,
      itemId: id
    });
    
    // Refund points if request failed after deduction
    try {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { 
          $inc: { 
            giftPoints: 10,
            monthlyRequestCount: -1
          }
        }
      );
      logger.info(`Points refunded due to error for user: ${req.user.email}`);
    } catch (refundError) {
      logger.error('Failed to refund points:', refundError);
    }
    
    res.status(500).json({ error: error.message || 'Error requesting item' });
  }
});

// ========================================
// PATCH /api/items/:id/approve - Approve request (PROTECTED - Donor only)
// ========================================
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const requestsCollection = db.collection('requests');
    const { id } = req.params;

    // Validate item ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get item
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user can approve
    const canApprove = canApproveRequest(item, req.user.id);
    if (!canApprove.canApprove) {
      return res.status(403).json({ error: canApprove.reason });
    }

    // ========================================
    // REWARD POINTS TO REQUESTER ON APPROVAL
    // ========================================
    const usersCollection = db.collection('users');
    const POINTS_REWARD = 5;
    
    if (item.requestedBy) {
      const requester = await usersCollection.findOne({ _id: new ObjectId(item.requestedBy) });
      if (requester) {
        const currentPoints = requester.giftPoints || 0;
        const newBalance = currentPoints + POINTS_REWARD;
        
        await usersCollection.updateOne(
          { _id: new ObjectId(item.requestedBy) },
          { 
            $set: { giftPoints: newBalance },
            $push: {
              pointsHistory: {
                action: 'approval_reward',
                amount: POINTS_REWARD,
                balance: newBalance,
                itemId: id,
                itemName: item.name,
                reason: `Request approved - reward for: ${item.name}`,
                timestamp: new Date()
              }
            }
          }
        );
        logger.info(`Approval reward: ${POINTS_REWARD} points given to ${requester.email}. New balance: ${newBalance}`);
      }
    }

    // Add history entry
    const historyEntry = createHistoryEntry(
      'approved',
      { id: req.user.id, email: req.user.email, name: 'Donor' },
      `Request approved for ${item.requesterName}`
    );

    // Update item status to APPROVED
    const now = new Date();
    await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: ItemStatus.APPROVED,
          approvedAt: now,
          updatedAt: now
        },
        $push: { history: historyEntry }
      }
    );

    // Update request status
    await requestsCollection.updateOne(
      { 
        itemId: new ObjectId(id),
        status: RequestStatus.PENDING
      },
      updateRequestStatus({}, RequestStatus.APPROVED)
    );

    logger.info(`Item approved: ${item.name}`);
    res.json({ 
      message: 'Request approved successfully',
      itemId: id,
      status: ItemStatus.APPROVED
    });

  } catch (error) {
    logger.error('Error approving request:', error);
    res.status(500).json({ error: 'Error approving request' });
  }
});

// ========================================
// PATCH /api/items/:id/reject - Reject request (PROTECTED - Donor only)
// ========================================
router.patch('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const requestsCollection = db.collection('requests');
    const { id } = req.params;

    // Validate item ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get item
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user can approve (same permission for reject)
    const canApprove = canApproveRequest(item, req.user.id);
    if (!canApprove.canApprove) {
      return res.status(403).json({ error: canApprove.reason });
    }

    // ========================================
    // REFUND POINTS TO REQUESTER ON REJECTION
    // ========================================
    const usersCollection = db.collection('users');
    const POINTS_REFUND = 10;
    
    if (item.requestedBy) {
      const requester = await usersCollection.findOne({ _id: new ObjectId(item.requestedBy) });
      if (requester) {
        const currentPoints = requester.giftPoints || 0;
        const newBalance = currentPoints + POINTS_REFUND;
        
        await usersCollection.updateOne(
          { _id: new ObjectId(item.requestedBy) },
          { 
            $set: { giftPoints: newBalance },
            $inc: { monthlyRequestCount: -1 },
            $push: {
              pointsHistory: {
                action: 'refund',
                amount: POINTS_REFUND,
                balance: newBalance,
                itemId: id,
                itemName: item.name,
                reason: `Request rejected - refund for: ${item.name}`,
                timestamp: new Date()
              }
            }
          }
        );
        logger.info(`Points refunded: ${POINTS_REFUND} points returned to ${requester.email}. New balance: ${newBalance}`);
      }
    }

    // Add history entry
    const historyEntry = createHistoryEntry(
      'rejected',
      { id: req.user.id, email: req.user.email, name: 'Donor' },
      `Request rejected for ${item.requesterName}`
    );

    // Reset item to AVAILABLE status
    const now = new Date();
    await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: ItemStatus.AVAILABLE,
          requestedBy: null,
          requesterEmail: null,
          requesterName: null,
          reason: null,
          requestedAt: null,
          updatedAt: now
        },
        $push: { history: historyEntry }
      }
    );

    // Update request status to REJECTED
    await requestsCollection.updateOne(
      { 
        itemId: new ObjectId(id),
        status: RequestStatus.PENDING
      },
      updateRequestStatus({}, RequestStatus.REJECTED)
    );

    logger.info(`Item request rejected: ${item.name}`);
    res.json({ 
      message: 'Request rejected successfully',
      itemId: id,
      status: ItemStatus.AVAILABLE
    });

  } catch (error) {
    logger.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Error rejecting request' });
  }
});

// ========================================
// PATCH /api/items/:id/complete - Mark as completed (PROTECTED - Donor only)
// ========================================
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const { id } = req.params;

    // Validate item ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get item
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user can complete
    const canComplete = canCompleteItem(item, req.user.id);
    if (!canComplete.canComplete) {
      return res.status(403).json({ error: canComplete.reason });
    }

    // ========================================
    // REWARD POINTS TO RECEIVER FOR SUCCESSFUL COMPLETION
    // ========================================
    const usersCollection = db.collection('users');
    const POINTS_REWARD = 5;
    
    if (item.requestedBy) {
      const receiver = await usersCollection.findOne({ _id: new ObjectId(item.requestedBy) });
      if (receiver) {
        const newBalance = (receiver.giftPoints || 0) + POINTS_REWARD;
        await usersCollection.updateOne(
          { _id: new ObjectId(item.requestedBy) },
          { 
            $set: { giftPoints: newBalance },
            $push: {
              pointsHistory: {
                action: 'reward',
                amount: POINTS_REWARD,
                balance: newBalance,
                itemId: id,
                itemName: item.name,
                reason: `Reward for successfully receiving: ${item.name}`,
                timestamp: new Date()
              }
            }
          }
        );
        logger.info(`Points rewarded: ${POINTS_REWARD} points given to ${receiver.email}. New balance: ${newBalance}`);
      }
    }

    // Add history entry
    const historyEntry = createHistoryEntry(
      'completed',
      { id: req.user.id, email: req.user.email, name: 'Donor' },
      `Item marked as completed for ${item.requesterName}`
    );

    // Update item status to COMPLETED
    const now = new Date();
    await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: ItemStatus.COMPLETED,
          completedAt: now,
          updatedAt: now
        },
        $push: { history: historyEntry }
      }
    );

    logger.info(`Item completed: ${item.name}`);
    res.json({ 
      message: 'Item marked as completed successfully',
      itemId: id,
      status: ItemStatus.COMPLETED
    });

  } catch (error) {
    logger.error('Error completing item:', error);
    res.status(500).json({ error: 'Error completing item' });
  }
});

// ========================================
// DELETE /api/items/:id - Delete item (PROTECTED - Donor only, AVAILABLE items only)
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const { id } = req.params;

    // Validate item ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get item
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user is the donor
    if (item.donorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        error: 'Only the donor can delete their items' 
      });
    }

    // Only allow deletion of AVAILABLE items
    if (item.status !== ItemStatus.AVAILABLE) {
      return res.status(400).json({ 
        error: 'Can only delete items that are AVAILABLE (no pending requests)' 
      });
    }

    // Add history entry
    const historyEntry = createHistoryEntry(
      'deleted',
      { id: req.user.id, email: req.user.email, name: 'Donor' },
      'Item removed by donor'
    );

    // Soft delete item instead of hard delete
    const now = new Date();
    await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: now,
          deletedBy: new ObjectId(req.user.id),
          updatedAt: now
        },
        $push: { history: historyEntry }
      }
    );

    logger.info(`Item soft deleted: ${item.name} by ${req.user.email}`);
    res.json({ 
      message: 'Item deleted successfully',
      itemId: id
    });

  } catch (error) {
    logger.error('Error deleting item:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

module.exports = router;
