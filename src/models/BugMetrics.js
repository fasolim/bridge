const mongoose = require('mongoose');

const BugMetricsSchema = new mongoose.Schema({
  // Identificação do bug
  notionBugId: {
    type: String,
    required: true,
    index: true
  },
  bugTitle: {
    type: String,
    required: true
  },
  bugDescription: {
    type: String,
    required: true
  },
  
  // Nível do bug (para aprendizado de máquina)
  bugLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  
  // Status do bug
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected', 'escalated'],
    default: 'pending'
  },
  
  // Tentativas de resolução
  attempts: [{
    attemptNumber: {
      type: Number,
      required: true
    },
    promptUsed: {
      type: String,
      required: true
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    executionTime: {
      type: Number,
      default: 0
    },
    success: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Total de tentativas
  totalAttempts: {
    type: Number,
    default: 0
  },
  
  // Métricas de custo
  totalTokens: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  totalExecutionTime: {
    type: Number,
    default: 0
  },
  
  // Git metrics
  gitMetrics: {
    commits: [{
      commitHash: String,
      commitMessage: String,
      commitDate: Date,
      filesChanged: [String],
      linesAdded: Number,
      linesDeleted: Number
    }],
    pullRequests: [{
      prNumber: Number,
      prTitle: String,
      prDescription: String,
      prStatus: String,
      prCreatedAt: Date,
      prMergedAt: Date,
      prUrl: String
    }],
    branches: [{
      branchName: String,
      branchType: String,
      createdAt: Date,
      mergedAt: Date
    }]
  },
  
  // Passo a passo da resolução
  resolutionSteps: [{
    stepNumber: Number,
    stepDescription: String,
    stepType: String,
    stepDuration: Number,
    stepSuccess: Boolean,
    stepDetails: String
  }],
  
  // Aprendizado de máquina
  mlData: {
    features: {
      bugComplexity: Number,
      codebaseSize: Number,
      numberOfFiles: Number,
      technologyStack: [String],
      estimatedDifficulty: Number
    },
    predictions: {
      successProbability: Number,
      estimatedTime: Number,
      recommendedPrompt: String,
      confidence: Number
    },
    feedback: {
      userApproval: Boolean,
      qualityScore: Number,
      improvementSuggestions: String
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

// Middleware para atualizar updatedAt
BugMetricsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para performance
BugMetricsSchema.index({ notionBugId: 1, createdAt: -1 });
BugMetricsSchema.index({ status: 1, bugLevel: 1 });
BugMetricsSchema.index({ createdAt: -1 });

// Métodos do modelo
BugMetricsSchema.methods.addAttempt = function(attemptData) {
  this.attempts.push(attemptData);
  this.totalAttempts += 1;
  this.totalTokens += attemptData.tokensUsed || 0;
  this.totalCost += attemptData.cost || 0;
  this.totalExecutionTime += attemptData.executionTime || 0;
  
  if (attemptData.success) {
    this.status = 'resolved';
    this.resolvedAt = new Date();
  }
  
  return this.save();
};

BugMetricsSchema.methods.escalateBug = function() {
  this.bugLevel = Math.min(this.bugLevel + 1, 5);
  this.status = 'escalated';
  return this.save();
};

module.exports = mongoose.model('BugMetrics', BugMetricsSchema);
