const express = require('express');
const router = express.Router();
const lostItemController = require('../controllers/lostItemController');
const { verifyUser } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Public endpoints
router.get('/', lostItemController.getLostItems);
router.get('/:id', lostItemController.getLostItemById);

// Protected endpoints
router.post('/', verifyUser, upload.single('image'), lostItemController.createLostItem);
router.put('/:id', verifyUser, upload.single('image'), lostItemController.updateLostItem);
router.patch('/:id/status', verifyUser, lostItemController.updateLostItemStatus);
router.delete('/:id', verifyUser, lostItemController.deleteLostItem);

module.exports = router;
