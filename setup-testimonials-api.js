const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'server/models');
const routesDir = path.join(__dirname, 'server/routes');

const testimonialModelCode = `
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for now, can be false if admin moderation needed
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
`;

const testimonialRoutesCode = `
const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');

// @route   POST /api/testimonials
// @desc    Submit a new testimonial
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { username, rating, content } = req.body;

    if (!username || !rating || !content) {
      return res.status(400).json({ error: 'Please provide all fields.' });
    }

    const testimonial = new Testimonial({
      username,
      rating,
      content,
    });

    await testimonial.save();
    res.status(201).json({ message: 'Testimonial submitted successfully!', testimonial });
  } catch (error) {
    console.error('Error saving testimonial:', error);
    res.status(500).json({ error: 'Server error while saving testimonial.' });
  }
});

// @route   GET /api/testimonials
// @desc    Get top testimonials for landing page
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Fetch up to 9 latest approved testimonials with 4 or 5 stars
    const testimonials = await Testimonial.find({ isApproved: true, rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(9);
    
    res.status(200).json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Server error while fetching testimonials.' });
  }
});

module.exports = router;
`;

fs.writeFileSync(path.join(modelsDir, 'Testimonial.js'), testimonialModelCode.trim());
fs.writeFileSync(path.join(routesDir, 'testimonialRoutes.js'), testimonialRoutesCode.trim());

console.log('Backend Testimonial files created.');
