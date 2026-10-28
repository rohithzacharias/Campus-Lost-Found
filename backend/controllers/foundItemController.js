const mongoose = require('mongoose');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const { uploadImageCloudinary, deleteImageCloudinary } = require('../utils/uploadImage');

// Helper to escape regex special characters safely
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Get all found items with search, filter, and pagination
 * GET /api/found
 */
async function getFoundItems(req, res, next) {
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
      query.foundLocation = { $regex: safeLoc, $options: 'i' };
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNumber - 1) * pageSize;

    const [items, totalItems] = await Promise.all([
      FoundItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('reportedBy', 'name email'),
      FoundItem.countDocuments(query)
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
 * Create a new found item report
 * POST /api/found
 */
async function createFoundItem(req, res, next) {
  try {
    const {
      itemName,
      category,
      description,
      distinguishingFeatures,
      foundLocation,
      foundDate,
      contactName,
      contactEmail,
      contactPhone,
      matchedLostItemId
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
    if (!foundLocation || !foundLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Found location is required' });
    }
    if (!foundDate) {
      return res.status(400).json({ success: false, message: 'Date found is required' });
    }
    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name is required' });
    }
    if ((!contactEmail || !contactEmail.trim()) && (!contactPhone || !contactPhone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one contact method (email or phone)'
      });
    }

    let imageUrl = '';
    let imagePublicId = '';

    // Handle image upload if a file was attached
    if (req.file) {
      const uploadResult = await uploadImageCloudinary(req.file.buffer, 'campusfind/found', req);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const newReport = await FoundItem.create({
      itemName: itemName.trim(),
      category,
      description: description.trim(),
      distinguishingFeatures: (distinguishingFeatures || '').trim(),
      imageUrl,
      imagePublicId,
      foundLocation: foundLocation.trim(),
      foundDate: new Date(foundDate),
      contactName: contactName.trim(),
      contactEmail: (contactEmail || '').trim().toLowerCase(),
      contactPhone: (contactPhone || '').trim(),
      status: 'open',
      reportedBy: req.user._id,
      matchedLostItemId:
        matchedLostItemId && mongoose.Types.ObjectId.isValid(matchedLostItemId)
          ? matchedLostItemId
          : null,
      statusHistory: [
        {
          status: 'open',
          changedBy: req.user._id,
          changedAt: new Date()
        }
      ]
    });

    // If linked to a lost report, update the lost item status to 'matched'
    if (matchedLostItemId && mongoose.Types.ObjectId.isValid(matchedLostItemId)) {
      const lostItem = await LostItem.findById(matchedLostItemId);
      if (lostItem) {
        lostItem.status = 'matched';
        lostItem.matchedFoundItemId = newReport._id;
        lostItem.statusHistory.push({
          status: 'matched',
          changedBy: req.user._id,
          changedAt: new Date()
        });
        await lostItem.save();
      }
    }

    const populated = await newReport.populate('reportedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Found item report submitted successfully',
      item: populated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single found item by ID
 * GET /api/found/:id
 */
async function getFoundItemById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid found item ID format' });
    }

    const item = await FoundItem.findById(id)
      .populate('reportedBy', 'name email')
      .populate('statusHistory.changedBy', 'name');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item report not found' });
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
 * Update an existing found item report (owner only)
 * PUT /api/found/:id
 */
async function updateFoundItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid found item ID format' });
    }

    const item = await FoundItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item report not found' });
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
      foundLocation,
      foundDate,
      contactName,
      contactEmail,
      contactPhone,
      matchedLostItemId
    } = req.body;

    if (itemName) item.itemName = itemName.trim();
    if (category) item.category = category;
    if (description) item.description = description.trim();
    if (distinguishingFeatures !== undefined) {
      item.distinguishingFeatures = distinguishingFeatures.trim();
    }
    if (foundLocation) item.foundLocation = foundLocation.trim();
    if (foundDate) item.foundDate = new Date(foundDate);
    if (contactName) item.contactName = contactName.trim();
    if (contactEmail !== undefined) item.contactEmail = contactEmail.trim().toLowerCase();
    if (contactPhone !== undefined) item.contactPhone = contactPhone.trim();

    // Optional replacement image upload
    if (req.file) {
      const uploadResult = await uploadImageCloudinary(req.file.buffer, 'campusfind/found', req);
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
      message: 'Found item report updated successfully',
      item: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update found item status (owner only)
 * PATCH /api/found/:id/status
 */
async function updateFoundItemStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid found item ID format' });
    }

    const allowedStatuses = ['open', 'matched', 'returned'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const item = await FoundItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item report not found' });
    }

    // Ownership check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only change status for your own reports'
      });
    }

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
      message: `Found item report marked as '${status}'`,
      item: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a found item report (owner only)
 * DELETE /api/found/:id
 */
async function deleteFoundItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid found item ID format' });
    }

    const item = await FoundItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item report not found' });
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

    await FoundItem.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Found item report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFoundItems,
  createFoundItem,
  getFoundItemById,
  updateFoundItem,
  updateFoundItemStatus,
  deleteFoundItem
};
