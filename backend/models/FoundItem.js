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

const validStatuses = ['open', 'matched', 'returned'];

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

const foundItemSchema = new mongoose.Schema(
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
    foundLocation: {
      type: String,
      required: [true, 'Found location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters']
    },
    foundDate: {
      type: Date,
      required: [true, 'Date found is required']
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [60, 'Contact name cannot exceed 60 characters']
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [
        /^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid contact email'
      ]
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    status: {
      type: String,
      enum: {
        values: validStatuses,
        message: '{VALUE} is not a valid found item status'
      },
      default: 'open'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported by user ID is required']
    },
    matchedLostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostItem',
      default: null
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
foundItemSchema.index({ status: 1, category: 1, createdAt: -1 });
foundItemSchema.index({ reportedBy: 1, createdAt: -1 });
foundItemSchema.index({ itemName: 'text', description: 'text', foundLocation: 'text' });

const FoundItem = mongoose.models.FoundItem || mongoose.model('FoundItem', foundItemSchema);

module.exports = FoundItem;
