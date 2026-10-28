const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

/**
 * Get all lost and found reports created by the currently authenticated user
 * GET /api/users/me/reports
 */
async function getMyReports(req, res, next) {
  try {
    const userId = req.user._id;

    const [myLostItems, myFoundItems] = await Promise.all([
      LostItem.find({ reportedBy: userId }).sort({ createdAt: -1 }),
      FoundItem.find({ reportedBy: userId }).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      myLostItems,
      myFoundItems,
      summary: {
        totalLost: myLostItems.length,
        totalFound: myFoundItems.length,
        totalReports: myLostItems.length + myFoundItems.length
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyReports
};
