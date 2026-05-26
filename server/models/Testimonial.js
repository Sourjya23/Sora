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