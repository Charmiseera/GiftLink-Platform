const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const connectToDatabase = require('../models/db');

dotenv.config();

const router = express.Router();
const logger = pino();

// ✅ REGISTER ENDPOINT
router.post('/register', async (req, res) => {
    try {
        // Connect to giftsdb
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if email already exists
        const existingUser = await usersCollection.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);

        // Save new user
        await usersCollection.insertOne({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hash,
        });

        // Generate JWT
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
        // Task 1: Connect to MongoDB
        const db = await connectToDatabase();

        // Task 2: Access the users collection
        const usersCollection = db.collection('users');

        const { email, password } = req.body;

        // Task 3: Check if the user exists
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ error: 'User not found. Please register first.' });
        }

        // Task 4: Validate the password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
        }

        // Task 5: Extract user details
        const userName = user.firstName;
        const userEmail = user.email;

        // Task 6: Create JWT token
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

module.exports = router;
