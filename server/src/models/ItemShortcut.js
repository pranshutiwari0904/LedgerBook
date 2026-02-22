import mongoose from 'mongoose';

const itemShortcutSchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'unit',
      trim: true
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: ''
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    timesUsed: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

itemShortcutSchema.index({ groupCode: 1, name: 1 });

const ItemShortcut = mongoose.model('ItemShortcut', itemShortcutSchema);

export default ItemShortcut;
