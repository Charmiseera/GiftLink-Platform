/*jshint esversion: 8 */
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const connectToDatabase = require('../models/db');
const { validateRegistration, validateLogin } = require('../middleware/validation');

dotenv.config();

const router = express.Router();
const logger = pino();

// ✅ REGISTER ENDPOINT - With Role Support
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate role
    const role = req.body.role || 'receiver'; // Default to receiver
    if (!['donor', 'receiver'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be donor or receiver.' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);

    const newUser = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
      role: role, // 'donor' or 'receiver'
      
      // Gift Points System - Initialize for receivers
      giftPoints: role === 'receiver' ? 100 : 0,
      monthlyRequestCount: 0,
      monthlyRequestLimit: 5, // Increases to 10 when verified
      lastMonthlyReset: new Date(),
      pointsHistory: role === 'receiver' ? [{
        action: 'registration',
        amount: 100,
        balance: 100,
        reason: 'Initial points on registration',
        timestamp: new Date()
      }] : [],
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    const authtoken = jwt.sign(
      { id: result.insertedId.toString(), email: req.body.email, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info(`User registered successfully as ${role}`);
    return res.json({ 
      authtoken, 
      email: req.body.email, 
      userName: req.body.firstName,
      role: role 
    });

  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal server error");
  }
});


// ✅ LOGIN ENDPOINT - With Role Support
router.post('/login', validateLogin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const { email, password, role } = req.body;

    // Find user
    const user = await usersCollection.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      logger.warn(`Blocked user attempted login: ${email}`);
      return res.status(403).json({ 
        error: 'Your account has been blocked by an administrator. Please contact support.' 
      });
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }

    // Check if user has the correct role (skip for admin users)
    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ 
        error: `This account is registered as a ${user.role}. Please use the ${user.role} login.` 
      });
    }

    const userName = user.firstName;
    const userEmail = user.email;
    const userRole = user.role || 'receiver'; // Fallback for old users

    const authtoken = jwt.sign(
      { id: user._id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info(`User logged in successfully as ${userRole}`);
    return res.status(200).json({ 
      authtoken, 
      userName, 
      userEmail, 
      role: userRole 
    });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).send('Internal server error');
  }
});


// ✅ PROFILE ENDPOINT - Get user profile with gift points
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      giftPoints: user.giftPoints || 0,
      monthlyRequestCount: user.monthlyRequestCount || 0,
      monthlyRequestLimit: user.monthlyRequestLimit || 5,
      isVerified: user.isVerified || false,
      isBlocked: user.isBlocked || false,
      pointsHistory: user.pointsHistory || []
    });

  } catch (e) {
    console.error('Profile error:', e);
    return res.status(500).send('Internal server error');
  }
});

// ✅ UPDATE ENDPOINT
router.put('/update', async (req, res) => {

    try {
      // Task 3: Check for email header
      const userEmail = req.body.email;
      if (!userEmail) {
        return res.status(400).json({ error: 'Email not provided' });
      }

      // Task 4: Connect to MongoDB
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Task 5: Find user
      const existingUser = await usersCollection.findOne({ email: userEmail });
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Task 6: Update user
      const updatedData = {
        firstName: req.body.name || existingUser.firstName,
        updatedAt: new Date(),
      };
      await usersCollection.updateOne({ email: userEmail }, { $set: updatedData });

      // Task 7: Create new JWT
      const authtoken = jwt.sign(
        { id: existingUser._id, email: existingUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      logger.info('User updated successfully');
      return res.json({ authtoken, message: 'Profile updated successfully' });

    } catch (e) {
      console.error('Update error:', e);
      return res.status(500).send('Internal server error');
    }
  }
);

module.exports = router;
