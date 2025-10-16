const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  summary: {
    totalBugs: Number,
    resolvedBugs: Number,
    rejectedBugs: Number,
    escalatedBugs: Number,
    averageAttempts: Number,
    averageExecutionTime: Number,
    totalTokens: Number,
    totalCost: Number,
    successRate: Number
  },
  bugBreakdown: [{
    level: Number,
    count: Number,
    successRate: Number,
    averageAttempts: Number
  }],
  performanceMetrics: {
    fastestResolution: Number,
    slowestResolution: Number,
    mostCommonIssues: [String],
    technologyBreakdown: [{
      technology: String,
      bugCount: Number,
      successRate: Number
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReportSchema.index({ reportType: 1, 'period.startDate': -1 });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
