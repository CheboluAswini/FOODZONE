// Script to migrate existing users with 'admin' role to the admins collection
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/userModel');
const Admin = require('./models/adminModel');

async function migrateAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} users with admin role.`);

    for (let user of adminUsers) {
      const existingAdmin = await Admin.findOne({ email: user.email });
      if (!existingAdmin) {
        const newAdmin = new Admin({
          name: user.name,
          email: user.email,
          password: user.password,
          role: 'admin'
        });
        await newAdmin.save();
        console.log(`Migrated admin: ${user.email}`);

        // Now remove from User collection
        await User.deleteOne({ _id: user._id });
        console.log(`Removed standard user account for: ${user.email}`);
      } else {
        console.log(`Admin email ${user.email} already exists in admins collection.`);
        await User.deleteOne({ _id: user._id });
        console.log(`Removed standard user account for: ${user.email}`);
      }
    }

    console.log('Migration complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateAdmins();
