const User = require('../models/User');
const SiteMetrics = require('../models/SiteMetrics');
const Meeting = require('../models/Meeting');

// Initialize SiteMetrics singleton if it doesn't exist
const getMetrics = async () => {
  let metrics = await SiteMetrics.findOneAndUpdate(
    { isSingleton: true },
    { $setOnInsert: { isSingleton: true, totalVisits: 0, registeredVisits: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return metrics;
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const candidateUsers = await User.countDocuments({ role: 'candidate' });
    const interviewerUsers = await User.countDocuments({ role: 'interviewer' });

    // Aggregate total profile views
    const profileViewsAgg = await User.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$profileViews' } } }
    ]);
    const totalProfileViews = profileViewsAgg.length > 0 ? profileViewsAgg[0].totalViews : 0;

    const metrics = await getMetrics();

    res.json({
      totalUsers,
      candidateUsers,
      interviewerUsers,
      totalProfileViews,
      siteMetrics: metrics
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.trackVisit = async (req, res) => {
  try {
    const { isRegistered } = req.body;
    const metrics = await getMetrics();

    metrics.totalVisits += 1;
    if (isRegistered) {
      metrics.registeredVisits += 1;
    }
    
    await metrics.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking site visit:', error);
    res.status(500).json({ message: 'Error tracking visit' });
  }
};

exports.incrementProfileView = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.profileViews = (user.profileViews || 0) + 1;
    await user.save();
    
    res.json({ success: true, profileViews: user.profileViews });
  } catch (error) {
    console.error('Error incrementing profile view:', error);
    res.status(500).json({ message: 'Error incrementing profile view' });
  }
};

exports.getCompletedMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ status: { $in: ['completed', 'approved', 'rejected'] } })
      .populate('candidateId', 'name email')
      .populate('interviewerId', 'name email')
      .sort({ updatedAt: -1 });
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching completed meetings:', error);
    res.status(500).json({ message: 'Error fetching meetings' });
  }
};
