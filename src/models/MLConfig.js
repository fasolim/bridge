const mongoose = require('mongoose');

const MLConfigSchema = new mongoose.Schema({
  configName: {
    type: String,
    required: true,
    unique: true
  },
  promptTemplates: [{
    level: Number,
    template: String,
    successRate: Number,
    usageCount: Number
  }],
  escalationRules: [{
    condition: String,
    action: String,
    parameters: mongoose.Schema.Types.Mixed
  }],
  learningRate: {
    type: Number,
    default: 0.1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

MLConfigSchema.index({ configName: 1 }, { unique: true });
MLConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('MLConfig', MLConfigSchema);
