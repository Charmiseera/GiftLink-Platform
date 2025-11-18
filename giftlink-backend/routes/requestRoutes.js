/*jshint esversion: 8 */
const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();
const connectToDatabase = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const pino = require('pino');

const logger = pino();

// ========================================
// GET /api/requests/me - Get logged-in user's requests (PROTECTED)
// ========================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const requestsCollection = db.collection('requests');

    // Get all requests made by this user
    const requests = await requestsCollection
      .find({ requesterId: new ObjectId(req.user.id) })
      .sort({ requestDate: -1 })
      .toArray();

    logger.info(`Fetched ${requests.length} requests for user: ${req.user.email}`);
    res.json(requests);

  } catch (error) {
    logger.error('Error fetching user requests:', error);
    res.status(500).json({ error: 'Error fetching requests' });
  }
});

// ========================================
// GET /api/requests/item/:itemId - Get all requests for a specific item (PROTECTED)
// ========================================
router.get('/item/:itemId', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const requestsCollection = db.collection('requests');
    const itemsCollection = db.collection('items');
    const { itemId } = req.params;

    // Validate item ID
    if (!ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Check if item exists and user is the donor
    const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.donorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        error: 'Only the donor can view requests for this item' 
      });
    }

    // Get all requests for this item
    const requests = await requestsCollection
      .find({ itemId: new ObjectId(itemId) })
      .sort({ requestDate: -1 })
      .toArray();

    logger.info(`Fetched ${requests.length} requests for item: ${itemId}`);
    res.json(requests);

  } catch (error) {
    logger.error('Error fetching item requests:', error);
    res.status(500).json({ error: 'Error fetching item requests' });
  }
});

module.exports = router;
