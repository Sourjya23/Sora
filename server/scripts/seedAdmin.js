const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const email = 'tickmelodie@gmail.com';
    const password = 'Tithi@1256';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists! Updating role to admin just in case.');
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.profileStatus = 'approved';
      await existingAdmin.save();
      console.log('Admin role ensured.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        name: 'Sora Founder',
        email: email,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        profileCompleted: true,
        profileStatus: 'approved',
      });
      console.log('Successfully created the Founder Admin account!');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
