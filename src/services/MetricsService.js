const BugMetrics = require('../models/BugMetrics');
const Report = require('../models/Report');
const MLConfig = require('../models/MLConfig');

class MetricsService {
  constructor() {
    this.bugMetrics = BugMetrics;
    this.report = Report;
    this.mlConfig = MLConfig;
  }

  /**
   * Determina o nível do bug baseado em critérios
   */
  determineBugLevel(bugData) {
    const title = bugData.title.toLowerCase();
    const description = bugData.description.toLowerCase();
    
    const level1Keywords = ['typo', 'texto', 'label', 'button', 'style', 'css'];
    const level2Keywords = ['function', 'method', 'component', 'validation', 'form'];
    const level3Keywords = ['api', 'database', 'integration', 'service', 'logic'];
    const level4Keywords = ['architecture', 'performance', 'security', 'scalability'];
    const level5Keywords = ['critical', 'urgent', 'system', 'infrastructure', 'complex'];
    
    if (level5Keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return 5;
    }
    if (level4Keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return 4;
    }
    if (level3Keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return 3;
    }
    if (level2Keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return 2;
    }
    
    return 1;
  }

  /**
   * Mapeia status do Notion para status interno
   */
  mapNotionStatusToInternal(notionStatus) {
    const statusMap = {
      'pending': 'pending',
      'in progress': 'in_progress',
      'resolved': 'resolved',
      'closed': 'resolved',
      'rejected': 'rejected',
      'escalated': 'escalated',
      'blocked': 'escalated'
    };
    
    return statusMap[notionStatus?.toLowerCase()] || 'pending';
  }

  /**
   * Cria um novo bug
   */
  async createBug(bugData) {
    const bug = new this.bugMetrics({
      notionBugId: bugData.notionBugId,
      bugTitle: bugData.bugTitle,
      bugDescription: bugData.bugDescription,
      bugLevel: bugData.bugLevel || this.determineBugLevel(bugData),
      status: this.mapNotionStatusToInternal(bugData.status || 'pending'),
      mlData: bugData.mlData || {}
    });

    return await bug.save();
  }

  /**
   * Busca bug por ID do Notion
   */
  async findBugByNotionId(notionBugId) {
    return await this.bugMetrics.findOne({ notionBugId });
  }

  /**
   * Lista bugs com filtros
   */
  async listBugs(filters = {}, options = {}) {
    const {
      status,
      bugLevel,
      limit = 50,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const filter = {};
    if (status) filter.status = status;
    if (bugLevel) filter.bugLevel = parseInt(bugLevel);

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bugs = await this.bugMetrics.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await this.bugMetrics.countDocuments(filter);

    return {
      bugs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: (parseInt(skip) + parseInt(limit)) < total
      }
    };
  }

  /**
   * Adiciona tentativa de resolução
   */
  async addAttempt(bugId, attemptData) {
    const bug = await this.bugMetrics.findById(bugId);
    if (!bug) {
      throw new Error('Bug não encontrado');
    }

    const attempt = {
      attemptNumber: bug.totalAttempts + 1,
      promptUsed: attemptData.promptUsed,
      tokensUsed: attemptData.tokensUsed || 0,
      cost: attemptData.cost || 0,
      executionTime: attemptData.executionTime || 0,
      success: attemptData.success || false,
      errorMessage: attemptData.errorMessage || null,
      timestamp: new Date()
    };

    await bug.addAttempt(attempt);

    // Verificar escalação
    if (!attempt.success && bug.totalAttempts > 2) {
      await bug.escalateBug();
    }

    return bug;
  }

  /**
   * Atualiza status do bug
   */
  async updateBugStatus(bugId, status, feedback = null) {
    const bug = await this.bugMetrics.findById(bugId);
    if (!bug) {
      throw new Error('Bug não encontrado');
    }

    bug.status = status;
    if (feedback) {
      bug.mlData.feedback = feedback;
    }
    if (status === 'resolved') {
      bug.resolvedAt = new Date();
    }

    return await bug.save();
  }

  /**
   * Gera relatório de métricas
   */
  async generateReport(reportData) {
    const {
      reportType,
      startDate,
      endDate,
      customFilters = {}
    } = reportData;

    const reportId = `report_${Date.now()}`;
    const period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    // Buscar bugs no período
    const bugs = await this.bugMetrics.find({
      createdAt: {
        $gte: period.startDate,
        $lte: period.endDate
      },
      ...customFilters
    });

    // Calcular estatísticas
    const totalBugs = bugs.length;
    const resolvedBugs = bugs.filter(b => b.status === 'resolved').length;
    const rejectedBugs = bugs.filter(b => b.status === 'rejected').length;
    const escalatedBugs = bugs.filter(b => b.status === 'escalated').length;

    const averageAttempts = bugs.reduce((sum, b) => sum + b.totalAttempts, 0) / totalBugs || 0;
    const averageExecutionTime = bugs.reduce((sum, b) => sum + b.totalExecutionTime, 0) / totalBugs || 0;
    const totalTokens = bugs.reduce((sum, b) => sum + b.totalTokens, 0);
    const totalCost = bugs.reduce((sum, b) => sum + b.totalCost, 0);
    const successRate = totalBugs > 0 ? (resolvedBugs / totalBugs) * 100 : 0;

    // Breakdown por nível
    const bugBreakdown = [];
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const levelResolved = levelBugs.filter(b => b.status === 'resolved').length;
      const levelSuccessRate = levelBugs.length > 0 ? (levelResolved / levelBugs.length) * 100 : 0;
      const levelAvgAttempts = levelBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / levelBugs.length || 0;

      bugBreakdown.push({
        level,
        count: levelBugs.length,
        successRate: levelSuccessRate,
        averageAttempts: levelAvgAttempts
      });
    }

    // Métricas de performance
    const executionTimes = bugs.map(b => b.totalExecutionTime).filter(t => t > 0);
    const fastestResolution = executionTimes.length > 0 ? Math.min(...executionTimes) : 0;
    const slowestResolution = executionTimes.length > 0 ? Math.max(...executionTimes) : 0;

    const report = new this.report({
      reportId,
      reportType,
      period,
      summary: {
        totalBugs,
        resolvedBugs,
        rejectedBugs,
        escalatedBugs,
        averageAttempts,
        averageExecutionTime,
        totalTokens,
        totalCost,
        successRate
      },
      bugBreakdown,
      performanceMetrics: {
        fastestResolution,
        slowestResolution,
        mostCommonIssues: ['Syntax Error', 'Logic Error', 'Performance Issue', 'Integration Error'],
        technologyBreakdown: []
      }
    });

    return await report.save();
  }

  /**
   * Busca relatórios
   */
  async getReports(filters = {}, options = {}) {
    const { reportType, limit = 20, skip = 0 } = options;
    
    const filter = {};
    if (reportType) filter.reportType = reportType;

    const reports = await this.report.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await this.report.countDocuments(filter);

    return {
      reports,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: (parseInt(skip) + parseInt(limit)) < total
      }
    };
  }

  /**
   * Gera dashboard de estatísticas
   */
  async getDashboard(period = '30d') {
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const bugs = await this.bugMetrics.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      totalBugs: bugs.length,
      resolvedBugs: bugs.filter(b => b.status === 'resolved').length,
      pendingBugs: bugs.filter(b => b.status === 'pending').length,
      inProgressBugs: bugs.filter(b => b.status === 'in_progress').length,
      escalatedBugs: bugs.filter(b => b.status === 'escalated').length,
      averageAttempts: bugs.reduce((sum, b) => sum + b.totalAttempts, 0) / bugs.length || 0,
      totalTokens: bugs.reduce((sum, b) => sum + b.totalTokens, 0),
      totalCost: bugs.reduce((sum, b) => sum + b.totalCost, 0),
      successRate: bugs.length > 0 ? (bugs.filter(b => b.status === 'resolved').length / bugs.length) * 100 : 0,
      bugsByLevel: [1, 2, 3, 4, 5].map(level => ({
        level,
        count: bugs.filter(b => b.bugLevel === level).length
      }))
    };

    return {
      stats,
      period: { startDate, endDate }
    };
  }
}

module.exports = new MetricsService();
