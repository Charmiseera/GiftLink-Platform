// Test MongoDB connection
require('dotenv').config();
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL;

console.log('Testing MongoDB connection...');
console.log('Connection URL (password hidden):', url.replace(/:[^:@]+@/, ':****@'));

const client = new MongoClient(url, {
  serverSelectionTimeoutMS: 10000,
});

async function testConnection() {
  try {
    console.log('\n1. Attempting to connect...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    console.log('\n2. Listing databases...');
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('Databases:', dbs.databases.map(db => db.name));
    
    console.log('\n3. Testing giftdb database...');
    const db = client.db('giftdb');
    const collections = await db.listCollections().toArray();
    console.log('Collections in giftdb:', collections.map(c => c.name));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.cause) {
      console.error('\nRoot cause:', error.cause.message || error.cause);
    }
    
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('2. Verify your username and password are correct');
    console.log('3. Check if the cluster is accessible');
    console.log('4. Try updating Node.js or MongoDB driver');
    
  } finally {
    await client.close();
    console.log('\nConnection closed.');
  }
}

testConnection();
