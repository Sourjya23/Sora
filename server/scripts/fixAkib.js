const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const fixAkib = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'akib.reza23@gmail.com' });
    if (user) {
      user.profileCompleted = true;
      user.profileStatus = 'pending';
      if (!user.skills) user.skills = ['React', 'Node.js'];
      if (!user.intro) user.intro = 'Hi, I am Akib Reza.';
      if (!user.experienceLevel) user.experienceLevel = 'intermediate';
      if (!user.nationalId) user.nationalId = 'NID-000000';
      await user.save();
      console.log('Successfully pushed Akib Reza into the Pending Evaluations pipeline.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

fixAkib();
