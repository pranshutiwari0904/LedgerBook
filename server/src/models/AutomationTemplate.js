import mongoose from 'mongoose';

const automationTemplateSchema = new mongoose.Schema(
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
    cadence: {
      type: String,
      enum: ['daily', 'every_2_days', 'weekly', 'monthly'],
      default: 'weekly'
    },
    nextRunAt: {
      type: Date,
      required: true
    },
    lastRunAt: {
      type: Date,
      default: null
    },
    timesTriggered: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
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

automationTemplateSchema.index({ groupCode: 1, active: 1, nextRunAt: 1 });

const AutomationTemplate = mongoose.model('AutomationTemplate', automationTemplateSchema);

export default AutomationTemplate;
