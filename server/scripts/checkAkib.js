const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkAkib = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ name: /Akib/i });
    console.log("Akib Profiles:", users.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      profileCompleted: u.profileCompleted,
      profileStatus: u.profileStatus
    })));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

checkAkib();
