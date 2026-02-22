import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'disputed'],
      default: 'pending'
    },
    actedAt: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const changeSchema = new mongoose.Schema(
  {
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    version: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    },
    changes: [changeSchema]
  },
  { _id: false }
);

const ledgerEntrySchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    entryDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['normal', 'correction'],
      default: 'normal'
    },
    linkedEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LedgerEntry',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'disputed'],
      default: 'pending'
    },
    approvals: {
      buyer: {
        type: approvalSchema,
        default: () => ({ status: 'pending' })
      },
      seller: {
        type: approvalSchema,
        default: () => ({ status: 'pending' })
      }
    },
    version: {
      type: Number,
      default: 1
    },
    history: {
      type: [historySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

export default LedgerEntry;
