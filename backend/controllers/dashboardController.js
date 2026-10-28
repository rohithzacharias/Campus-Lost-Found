const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

/**
 * Get live dashboard metrics and recent reports
 * GET /api/dashboard/stats
 */
async function getDashboardStats(req, res, next) {
  try {
    const [
      activeLostCount,
      matchedLostCount,
      resolvedLostCount,
      totalLostCount,
      activeFoundCount,
      matchedFoundCount,
      returnedFoundCount,
      totalFoundCount,
      recentLostItems,
      recentFoundItems
    ] = await Promise.all([
      LostItem.countDocuments({ status: 'open' }),
      LostItem.countDocuments({ status: 'matched' }),
      LostItem.countDocuments({ status: 'resolved' }),
      LostItem.countDocuments({}),
      FoundItem.countDocuments({ status: 'open' }),
      FoundItem.countDocuments({ status: 'matched' }),
      FoundItem.countDocuments({ status: 'returned' }),
      FoundItem.countDocuments({}),
      LostItem.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('reportedBy', 'name email'),
      FoundItem.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('reportedBy', 'name email')
    ]);

    let userReportCount = 0;
    if (req.user && req.user._id) {
      const [userLost, userFound] = await Promise.all([
        LostItem.countDocuments({ reportedBy: req.user._id }),
        FoundItem.countDocuments({ reportedBy: req.user._id })
      ]);
      userReportCount = userLost + userFound;
    }

    const totalReclaimed = resolvedLostCount + returnedFoundCount;

    return res.status(200).json({
      success: true,
      stats: {
        activeLost: activeLostCount,
        matchedLost: matchedLostCount,
        resolvedLost: resolvedLostCount,
        totalLost: totalLostCount,
        activeFound: activeFoundCount,
        matchedFound: matchedFoundCount,
        returnedFound: returnedFoundCount,
        totalFound: totalFoundCount,
        totalReclaimed,
        totalProcessed: totalLostCount + totalFoundCount,
        userReportCount
      },
      recentLost: recentLostItems,
      recentFound: recentFoundItems
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats
};
