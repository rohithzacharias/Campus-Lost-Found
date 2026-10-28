const express = require('express');
const router = express.Router();
const foundItemController = require('../controllers/foundItemController');
const { verifyUser } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Public endpoints
router.get('/', foundItemController.getFoundItems);
router.get('/:id', foundItemController.getFoundItemById);

// Protected endpoints
router.post('/', verifyUser, upload.single('image'), foundItemController.createFoundItem);
router.put('/:id', verifyUser, upload.single('image'), foundItemController.updateFoundItem);
router.patch('/:id/status', verifyUser, foundItemController.updateFoundItemStatus);
router.delete('/:id', verifyUser, foundItemController.deleteFoundItem);

module.exports = router;
