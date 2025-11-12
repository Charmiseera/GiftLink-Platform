const express = require("express");
const { ObjectId } = require("mongodb"); // ✅ Import ObjectId for _id lookups
const router = express.Router();
const connectToDatabase = require("../models/db");

// ✅ GET all gifts
router.get('/', async (req, res) => {
  try {
    // Connect to MongoDB
    const db = await connectToDatabase();
    const collection = db.collection("gifts");

    // Fetch all gifts
    const gifts = await collection.find().toArray();

    // Return as JSON
    res.json(gifts);
  } catch (e) {
    console.error('Error fetching gifts:', e);
    res.status(500).send('Error fetching gifts');
  }
});

// ✅ GET gift by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gifts");

    const { id } = req.params;

    // Validate ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid gift ID" });
    }

    // Find gift by _id
    const gift = await collection.findOne({ _id: new ObjectId(id) });

    if (!gift) {
      return res.status(404).json({ error: "Gift not found" });
    }

    res.json(gift);
  } catch (e) {
    console.error('Error fetching gift:', e);
    res.status(500).json({ error: 'Error fetching gift' });
  }
});

// ✅ Add a new gift
router.post('/', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("gifts");

    const result = await collection.insertOne(req.body);

    // Return the inserted gift document
    res.status(201).json(result.ops ? result.ops[0] : req.body);
  } catch (e) {
    console.error('Error adding gift:', e);
    next(e);
  }
});

module.exports = router;
