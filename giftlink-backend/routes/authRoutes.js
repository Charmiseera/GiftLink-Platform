/*jshint esversion: 8 */
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const connectToDatabase = require('../models/db');
const { body, validationResult } = require('express-validator'); // ✅ Task 1: Import validators

dotenv.config();

const router = express.Router();
const logger = pino();

// ✅ REGISTER ENDPOINT
router.post('/register', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);

    await usersCollection.insertOne({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
    });

    const authtoken = jwt.sign(
      { email: req.body.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("User registered successfully");
    return res.json({ authtoken, email: req.body.email });

  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal server error");
  }
});


// ✅ LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }

    const userName = user.firstName;
    const userEmail = user.email;

    const authtoken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info("User logged in successfully");
    return res.status(200).json({ authtoken, userName, userEmail });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).send('Internal server error');
  }
});


// ✅ UPDATE ENDPOINT
router.put(
  '/update',
  [
    // Task 1: Validation rules
    body('name', 'Name is required').trim().notEmpty(),
    body('email', 'Valid email is required').isEmail(),
  ],
  async (req, res) => {
    // Task 2: Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
