const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const { connectToDatabase } = require('../models/db');


dotenv.config();

const router = express.Router();
const logger = pino();

// REGISTER ENDPOINT
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

module.exports = router;
