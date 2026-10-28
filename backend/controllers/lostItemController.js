const mongoose = require('mongoose');
const LostItem = require('../models/LostItem');
const { uploadImageCloudinary, deleteImageCloudinary } = require('../utils/uploadImage');

// Helper to escape regex special characters safely
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Get all lost items with search, filter, and pagination
 * GET /api/lost
 */
async function getLostItems(req, res, next) {
  try {
    const { q, category, location, status, page = 1, limit = 12 } = req.query;

    const query = {};

    // Keyword search in itemName and description
    if (q && q.trim()) {
      const safeKeyword = escapeRegex(q.trim());
      query.$or = [
        { itemName: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
        { distinguishingFeatures: { $regex: safeKeyword, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Location search
    if (location && location.trim()) {
      const safeLoc = escapeRegex(location.trim());
      query.lastSeenLocation = { $regex: safeLoc, $options: 'i' };
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNumber - 1) * pageSize;

    const [items, totalItems] = await Promise.all([
      LostItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('reportedBy', 'name email'),
      LostItem.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return res.status(200).json({
      success: true,
      items,
      totalItems,
      totalPages,
      currentPage: pageNumber,
      limit: pageSize
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new lost item report
 * POST /api/lost
 */
async function createLostItem(req, res, next) {
  try {
    const {
      itemName,
      category,
      description,
      distinguishingFeatures,
      lastSeenLocation,
      lastSeenDate
    } = req.body;

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (!lastSeenLocation || !lastSeenLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Last seen location is required' });
    }
    if (!lastSeenDate) {
      return res.status(400).json({ success: false, message: 'Date last seen is required' });
    }

    let imageUrl = '';
    let imagePublicId = '';

    // Handle image upload if a file was attached
    if (req.file) {
      const uploadResult = await uploadImageCloudinary(req.file.buffer, 'campusfind/lost', req);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const newReport = await LostItem.create({
      itemName: itemName.trim(),
      category,
      description: description.trim(),
      distinguishingFeatures: (distinguishingFeatures || '').trim(),
      imageUrl,
      imagePublicId,
      lastSeenLocation: lastSeenLocation.trim(),
      lastSeenDate: new Date(lastSeenDate),
      status: 'open',
      reportedBy: req.user._id,
      statusHistory: [
        {
          status: 'open',
          changedBy: req.user._id,
          changedAt: new Date()
        }
      ]
    });

    const populated = await newReport.populate('reportedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Lost item report submitted successfully',
      item: populated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single lost item by ID
 * GET /api/lost/:id
 */
async function getLostItemById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lost item ID format' });
    }

    const item = await LostItem.findById(id)
      .populate('reportedBy', 'name email')
      .populate('matchedFoundItemId', 'itemName foundLocation foundDate contactName contactEmail contactPhone status')
      .populate('statusHistory.changedBy', 'name');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Lost item report not found' });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing lost item report (owner only)
 * PUT /api/lost/:id
 */
async function updateLostItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lost item ID format' });
    }

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Lost item report not found' });
    }

    // Ownership authorization check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit reports created by your account'
      });
    }

    const {
      itemName,
      category,
      description,
      distinguishingFeatures,
      lastSeenLocation,
      lastSeenDate
    } = req.body;

    if (itemName) item.itemName = itemName.trim();
    if (category) item.category = category;
    if (description) item.description = description.trim();
    if (distinguishingFeatures !== undefined) {
      item.distinguishingFeatures = distinguishingFeatures.trim();
    }
    if (lastSeenLocation) item.lastSeenLocation = lastSeenLocation.trim();
    if (lastSeenDate) item.lastSeenDate = new Date(lastSeenDate);

    // Optional replacement image upload
    if (req.file) {
      const uploadResult = await uploadImageCloudinary(req.file.buffer, 'campusfind/lost', req);
      const oldPublicId = item.imagePublicId;

      item.imageUrl = uploadResult.secure_url;
      item.imagePublicId = uploadResult.public_id;

      // Safely delete old image after successful upload
      if (oldPublicId) {
        await deleteImageCloudinary(oldPublicId);
      }
    }

    await item.save();
    const updated = await item.populate('reportedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Lost item report updated successfully',
      item: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update lost item status (owner only)
 * PATCH /api/lost/:id/status
 */
async function updateLostItemStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lost item ID format' });
    }

    const allowedStatuses = ['open', 'matched', 'resolved'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Lost item report not found' });
    }

    // Ownership check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only change status for your own reports'
      });
    }

    // Validate lifecycle transition
    if (item.status === status) {
      return res.status(200).json({
        success: true,
        message: `Status is already '${status}'`,
        item
      });
    }

    item.status = status;
    item.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date()
    });

    await item.save();
    const updated = await item.populate('reportedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: `Lost item report marked as '${status}'`,
      item: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a lost item report (owner only)
 * DELETE /api/lost/:id
 */
async function deleteLostItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lost item ID format' });
    }

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Lost item report not found' });
    }

    // Ownership authorization check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete reports created by your account'
      });
    }

    // Clean up Cloudinary image if exists
    if (item.imagePublicId) {
      await deleteImageCloudinary(item.imagePublicId);
    }

    await LostItem.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Lost item report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLostItems,
  createLostItem,
  getLostItemById,
  updateLostItem,
  updateLostItemStatus,
  deleteLostItem
};
