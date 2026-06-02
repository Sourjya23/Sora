const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'tickmelodie@gmail.com';
    const password = 'Tithi@1256';
    
    const user = await User.findOne({ email });
    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.isVerified = true;
      user.role = 'admin';
      await user.save();
      console.log('Password successfully reset to Tithi@1256 for', email);
    } else {
      console.log('User not found!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

resetAdminPassword();
