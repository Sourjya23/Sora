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