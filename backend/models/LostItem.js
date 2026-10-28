const mongoose = require('mongoose');

const validCategories = [
  'Electronics',
  'ID Cards',
  'Bags',
  'Keys',
  'Books',
  'Clothing',
  'Accessories',
  'Other'
];

const validStatuses = ['open', 'matched', 'resolved'];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: validStatuses,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const lostItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: validCategories,
        message: '{VALUE} is not a valid category'
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    distinguishingFeatures: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Distinguishing features cannot exceed 1000 characters']
    },
    imageUrl: {
      type: String,
      default: ''
    },
    imagePublicId: {
      type: String,
      default: ''
    },
    lastSeenLocation: {
      type: String,
      required: [true, 'Last seen location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters']
    },
    lastSeenDate: {
      type: Date,
      required: [true, 'Date last seen is required']
    },
    status: {
      type: String,
      enum: {
        values: validStatuses,
        message: '{VALUE} is not a valid lost item status'
      },
      default: 'open'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported by user ID is required']
    },
    matchedFoundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundItem',
      default: null
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
lostItemSchema.index({ status: 1, category: 1, createdAt: -1 });
lostItemSchema.index({ reportedBy: 1, createdAt: -1 });
lostItemSchema.index({ itemName: 'text', description: 'text', lastSeenLocation: 'text' });

const LostItem = mongoose.models.LostItem || mongoose.model('LostItem', lostItemSchema);

module.exports = LostItem;
