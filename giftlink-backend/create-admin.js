/*jshint esversion: 8 */
const bcryptjs = require('bcryptjs');
const connectToDatabase = require('./models/db');

async function createAdminUser() {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const adminEmail = 'admin@giftlink.com';

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to admin
      await usersCollection.updateOne(
        { email: adminEmail },
        { $set: { role: 'admin', updatedAt: new Date() } }
      );
      console.log('✅ Existing user updated to admin role');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Create new admin user
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash('Admin@123', salt);

    const adminUser = {
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: hash,
      role: 'admin',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@giftlink.com');
    console.log('Password: Admin@123');
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
