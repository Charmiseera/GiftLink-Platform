/*jshint esversion: 8 */
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { manualMonthlyReset } = require('../services/cronJobs');
const pino = require('pino');

const logger = pino();

// ========================================
// GET /api/admin/users - Get all users with filters (ADMIN ONLY)
// ========================================
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const { role, isBlocked, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users
    const users = await usersCollection
      .find(filter)
      .project({ password: 0 }) // Exclude password
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get total count
    const totalUsers = await usersCollection.countDocuments(filter);
    
    logger.info(`Admin ${req.user.email} fetched ${users.length} users`);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        usersPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// ========================================
// GET /api/admin/stats - Get platform statistics (ADMIN ONLY)
// ========================================
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const itemsCollection = db.collection('items');
    const requestsCollection = db.collection('requests');
    
    // Get counts
    const totalUsers = await usersCollection.countDocuments();
    const totalDonors = await usersCollection.countDocuments({ role: 'donor' });
    const totalReceivers = await usersCollection.countDocuments({ role: 'receiver' });
    const blockedUsers = await usersCollection.countDocuments({ isBlocked: true });
    
    const totalItems = await itemsCollection.countDocuments();
    const availableItems = await itemsCollection.countDocuments({ status: 'AVAILABLE' });
    const requestedItems = await itemsCollection.countDocuments({ status: 'REQUESTED' });
    const completedItems = await itemsCollection.countDocuments({ status: 'COMPLETED' });
    
    const totalRequests = await requestsCollection.countDocuments();
    
    logger.info(`Admin ${req.user.email} fetched platform stats`);
    
    res.json({
      users: {
        total: totalUsers,
        donors: totalDonors,
        receivers: totalReceivers,
        blocked: blockedUsers
      },
      items: {
        total: totalItems,
        available: availableItems,
        requested: requestedItems,
        completed: completedItems
      },
      requests: {
        total: totalRequests
      }
    });
    
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// ========================================
// PATCH /api/admin/users/:id/block - Block a user (ADMIN ONLY)
// ========================================
router.patch('/users/:id/block', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent blocking admins
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot block admin users' });
    }
    
    // Block user
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: req.user.email
        } 
      }
    );
    
    logger.info(`Admin ${req.user.email} blocked user ${user.email}`);
    
    res.json({ 
      message: 'User blocked successfully',
      userId: id 
    });
    
  } catch (error) {
    logger.error('Error blocking user:', error);
    res.status(500).json({ error: 'Error blocking user' });
  }
});

// ========================================
// PATCH /api/admin/users/:id/unblock - Unblock a user (ADMIN ONLY)
// ========================================
router.patch('/users/:id/unblock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Unblock user
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isBlocked: false 
        },
        $unset: {
          blockedAt: "",
          blockedBy: ""
        }
      }
    );
    
    logger.info(`Admin ${req.user.email} unblocked user ${user.email}`);
    
    res.json({ 
      message: 'User unblocked successfully',
      userId: id 
    });
    
  } catch (error) {
    logger.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Error unblocking user' });
  }
});

// ========================================
// PATCH /api/admin/users/:id/verify - Verify a user (ADMIN ONLY)
// ========================================
router.patch('/users/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }
    
    // Calculate new gift points balance
    const newBalance = (user.giftPoints || 0) + 50;
    
    // Verify user - update isVerified, add needScore, add gift points bonus, increase monthly limit
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user.email,
          monthlyRequests: 0,
          monthlyRequestLimit: 10,  // Verified users get higher limit
          giftPoints: newBalance
        },
        $inc: {
          needScore: 20  // Add 20 needScore points for verification
        },
        $push: {
          pointsHistory: {
            action: 'verification',
            amount: 50,
            balance: newBalance,
            reason: `Verification bonus awarded by ${req.user.email}`,
            timestamp: new Date()
          }
        }
      }
    );
    
    logger.info(`Admin ${req.user.email} verified user ${user.email}`);
    
    res.json({ 
      message: 'User verified successfully',
      userId: id 
    });
    
  } catch (error) {
    logger.error('Error verifying user:', error);
    res.status(500).json({ error: 'Error verifying user' });
  }
});

// ========================================
// GET /api/admin/items - Get all items for moderation (ADMIN ONLY)
// ========================================
router.get('/items', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const usersCollection = db.collection('users');
    
    const { page = 1, limit = 20, status, category } = req.query;
    
    // Build filter - exclude deleted items
    const filter = { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get items
    const items = await itemsCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .toArray();
    
    // Enrich with donor info
    const enrichedItems = await Promise.all(items.map(async (item) => {
      let donorInfo = { name: 'Unknown', email: 'N/A' };
      
      if (item.donorEmail) {
        const donor = await usersCollection.findOne({ email: item.donorEmail });
        if (donor) {
          donorInfo = {
            name: `${donor.firstName} ${donor.lastName}`,
            email: donor.email
          };
        }
      }
      
      return {
        ...item,
        donorInfo
      };
    }));
    
    // Get total count
    const totalItems = await itemsCollection.countDocuments(filter);
    
    logger.info(`Admin ${req.user.email} fetched ${enrichedItems.length} items`);
    
    res.json({
      items: enrichedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching items:', error);
    res.status(500).json({ error: 'Error fetching items' });
  }
});

// ========================================
// DELETE /api/admin/items/:id - Soft delete an item (ADMIN ONLY)
// ========================================
router.delete('/items/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const itemsCollection = db.collection('items');
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Get item
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Soft delete
    await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.email
        } 
      }
    );
    
    logger.info(`Admin ${req.user.email} deleted item ${id}`);
    
    res.json({ 
      message: 'Item deleted successfully',
      itemId: id 
    });
    
  } catch (error) {
    logger.error('Error deleting item:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

// ========================================
// GET /api/admin/reports - Get all reports (ADMIN ONLY)
// ========================================
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const reportsCollection = db.collection('reports');
    const usersCollection = db.collection('users');
    
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reports
    const reports = await reportsCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .toArray();
    
    // Enrich with user info
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reporter = await usersCollection.findOne({ _id: new ObjectId(report.reporterId) });
      const reportedUser = await usersCollection.findOne({ _id: new ObjectId(report.reportedUserId) });
      
      return {
        ...report,
        reporterInfo: reporter ? {
          name: `${reporter.firstName} ${reporter.lastName}`,
          email: reporter.email
        } : { name: 'Unknown', email: 'N/A' },
        reportedUserInfo: reportedUser ? {
          name: `${reportedUser.firstName} ${reportedUser.lastName}`,
          email: reportedUser.email
        } : { name: 'Unknown', email: 'N/A' }
      };
    }));
    
    // Get total count
    const totalReports = await reportsCollection.countDocuments(filter);
    
    logger.info(`Admin ${req.user.email} fetched ${enrichedReports.length} reports`);
    
    res.json({
      reports: enrichedReports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / parseInt(limit)),
        totalReports,
        reportsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// ========================================
// PATCH /api/admin/reports/:id/resolve - Resolve a report (ADMIN ONLY)
// ========================================
router.patch('/reports/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const reportsCollection = db.collection('reports');
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    
    // Get report
    const report = await reportsCollection.findOne({ _id: new ObjectId(id) });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if already resolved
    if (report.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Report is already resolved' });
    }
    
    // Resolve report
    await reportsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user.email
        } 
      }
    );
    
    logger.info(`Admin ${req.user.email} resolved report ${id}`);
    
    res.json({ 
      message: 'Report resolved successfully',
      reportId: id 
    });
    
  } catch (error) {
    logger.error('Error resolving report:', error);
    res.status(500).json({ error: 'Error resolving report' });
  }
});

// ========================================
// POST /api/admin/reset-monthly - Manually trigger monthly reset (ADMIN ONLY - Testing)
// ========================================
router.post('/reset-monthly', authenticateToken, requireAdmin, async (req, res) => {
  try {
    logger.info(`Admin ${req.user.email} triggered manual monthly reset`);
    
    const result = await manualMonthlyReset();
    
    res.json({ 
      message: 'Monthly reset completed successfully',
      modifiedCount: result.modifiedCount,
      resetDate: result.resetDate
    });
    
  } catch (error) {
    logger.error('Error in manual monthly reset:', error);
    res.status(500).json({ error: 'Error performing monthly reset' });
  }
});

module.exports = router;
