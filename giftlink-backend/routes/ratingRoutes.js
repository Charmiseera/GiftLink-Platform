/*jshint esversion: 8 */
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../logger');

// ========================================
// POST /api/ratings - Create a rating (PROTECTED)
// ========================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const ratingsCollection = db.collection('ratings');
    const itemsCollection = db.collection('items');
    const usersCollection = db.collection('users');
    
    const { itemId, rating, review, ratedUserId } = req.body;
    const raterId = req.user.id;
    const raterEmail = req.user.email;
    
    // Validation
    if (!itemId || !rating || !ratedUserId) {
      return res.status(400).json({ error: 'Item ID, rating, and rated user ID are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Validate ObjectIds
    if (!ObjectId.isValid(itemId) || !ObjectId.isValid(ratedUserId)) {
      return res.status(400).json({ error: 'Invalid item or user ID' });
    }
    
    // Check if item exists and is completed
    const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only rate completed transactions' });
    }
    
    // Check if user already rated this transaction
    const existingRating = await ratingsCollection.findOne({
      itemId: new ObjectId(itemId),
      raterId: new ObjectId(raterId)
    });
    
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this transaction' });
    }
    
    // Get rater and rated user details
    const rater = await usersCollection.findOne({ _id: new ObjectId(raterId) });
    const ratedUser = await usersCollection.findOne({ _id: new ObjectId(ratedUserId) });
    
    if (!rater || !ratedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create rating
    const newRating = {
      itemId: new ObjectId(itemId),
      itemName: item.name,
      raterId: new ObjectId(raterId),
      raterName: `${rater.firstName} ${rater.lastName}`,
      raterEmail: rater.email,
      ratedUserId: new ObjectId(ratedUserId),
      ratedUserName: `${ratedUser.firstName} ${ratedUser.lastName}`,
      ratedUserEmail: ratedUser.email,
      rating: parseInt(rating),
      review: review || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await ratingsCollection.insertOne(newRating);
    
    // Update user's average rating
    await updateUserAverageRating(usersCollection, ratingsCollection, ratedUserId);
    
    logger.info(`Rating created: ${rating} stars for user ${ratedUser.email} by ${rater.email}`);
    
    res.status(201).json({
      message: 'Rating submitted successfully',
      ratingId: result.insertedId
    });
    
  } catch (error) {
    logger.error('Error creating rating:', error);
    res.status(500).json({ error: 'Error creating rating' });
  }
});

// ========================================
// GET /api/ratings/user/:userId - Get ratings for a user
// ========================================
router.get('/user/:userId', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const ratingsCollection = db.collection('ratings');
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const ratings = await ratingsCollection
      .find({ ratedUserId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ratings, count: ratings.length });
    
  } catch (error) {
    logger.error('Error fetching user ratings:', error);
    res.status(500).json({ error: 'Error fetching ratings' });
  }
});

// ========================================
// POST /api/ratings/report - Create a report (PROTECTED)
// ========================================
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const reportsCollection = db.collection('reports');
    const usersCollection = db.collection('users');
    
    const { reportedUserId, reason, description, itemId } = req.body;
    const reporterId = req.user.id;
    
    // Validation
    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }
    
    if (!ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }
    
    // Get reporter and reported user details
    const reporter = await usersCollection.findOne({ _id: new ObjectId(reporterId) });
    const reportedUser = await usersCollection.findOne({ _id: new ObjectId(reportedUserId) });
    
    if (!reporter || !reportedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create report
    const newReport = {
      reporterId: new ObjectId(reporterId),
      reporterName: `${reporter.firstName} ${reporter.lastName}`,
      reporterEmail: reporter.email,
      reportedUserId: new ObjectId(reportedUserId),
      reportedUserName: `${reportedUser.firstName} ${reportedUser.lastName}`,
      reportedUserEmail: reportedUser.email,
      itemId: itemId ? new ObjectId(itemId) : null,
      reason: reason,
      description: description || '',
      status: 'pending', // pending, reviewed, resolved
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await reportsCollection.insertOne(newReport);
    
    logger.info(`Report created: ${reportedUser.email} reported by ${reporter.email} for ${reason}`);
    
    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: result.insertedId
    });
    
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({ error: 'Error creating report' });
  }
});

// ========================================
// GET /api/ratings/my-ratings - Get current user's received ratings (PROTECTED)
// ========================================
router.get('/my-ratings', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const ratingsCollection = db.collection('ratings');
    const userId = req.user.id;
    
    const ratings = await ratingsCollection
      .find({ ratedUserId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Calculate average
    const averageRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;
    
    res.json({ 
      ratings, 
      count: ratings.length,
      averageRating: parseFloat(averageRating)
    });
    
  } catch (error) {
    logger.error('Error fetching my ratings:', error);
    res.status(500).json({ error: 'Error fetching ratings' });
  }
});

// ========================================
// Helper function to update user's average rating
// ========================================
async function updateUserAverageRating(usersCollection, ratingsCollection, userId) {
  try {
    const ratings = await ratingsCollection
      .find({ ratedUserId: new ObjectId(userId) })
      .toArray();
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalRatings: ratings.length,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`Updated average rating for user: ${averageRating.toFixed(2)} (${ratings.length} ratings)`);
    
  } catch (error) {
    logger.error('Error updating user average rating:', error);
  }
}

module.exports = router;
