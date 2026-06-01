const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, trackVisit, incrementProfileView } = require('../controllers/adminController');
const { requireAuth, checkRole } = require('../middleware/authMiddleware');

// Public route for tracking global visits
router.post('/track-visit', trackVisit);
router.post('/profile-view/:id', incrementProfileView);

// Protected Admin routes
router.use(requireAuth);
router.use(checkRole(['admin']));

router.get('/stats', getStats);
router.get('/users', getAllUsers);

module.exports = router;
