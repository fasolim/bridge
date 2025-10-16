const metricsService = require('../services/MetricsService');
const mlService = require('../services/MLService');

class MetricsController {
  /**
   * Criar nova métrica de bug
   */
  async createBug(req, res) {
    try {
      const {
        notionBugId,
        bugTitle,
        bugDescription,
        bugLevel,
        mlData = {}
      } = req.body;

      const existingBug = await metricsService.findBugByNotionId(notionBugId);
      if (existingBug) {
        return res.status(400).json({
          success: false,
          message: 'Bug já existe no sistema',
          bugId: existingBug._id
        });
      }

      const bugMetrics = await metricsService.createBug({
        notionBugId,
        bugTitle,
        bugDescription,
        bugLevel,
        mlData
      });

      res.status(201).json({
        success: true,
        message: 'Métrica de bug criada com sucesso',
        data: bugMetrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar métrica de bug',
        error: error.message
      });
    }
  }

  /**
   * Adicionar tentativa de resolução
   */
  async addAttempt(req, res) {
    try {
      const { bugId } = req.params;
      const {
        promptUsed,
        tokensUsed = 0,
        cost = 0,
        executionTime = 0,
        success = false,
        errorMessage = null
      } = req.body;

      const bug = await metricsService.addAttempt(bugId, {
        promptUsed,
        tokensUsed,
        cost,
        executionTime,
        success,
        errorMessage
      });

      res.json({
        success: true,
        message: 'Tentativa adicionada com sucesso',
        data: bug
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar tentativa',
        error: error.message
      });
    }
  }

  /**
   * Atualizar status do bug
   */
  async updateBugStatus(req, res) {
    try {
      const { bugId } = req.params;
      const { status, feedback } = req.body;

      const bug = await metricsService.updateBugStatus(bugId, status, feedback);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: bug
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message
      });
    }
  }

  /**
   * Buscar bug por ID do Notion
   */
  async getBugByNotionId(req, res) {
    try {
      const { notionBugId } = req.params;
      const bug = await metricsService.findBugByNotionId(notionBugId);
      
      if (!bug) {
        return res.status(404).json({
          success: false,
          message: 'Bug não encontrado'
        });
      }

      res.json({
        success: true,
        data: bug
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar bug',
        error: error.message
      });
    }
  }

  /**
   * Listar bugs com filtros
   */
  async listBugs(req, res) {
    try {
      const {
        status,
        bugLevel,
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await metricsService.listBugs({}, {
        status,
        bugLevel,
        limit,
        skip,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.bugs,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar bugs',
        error: error.message
      });
    }
  }

  /**
   * Gerar relatório
   */
  async generateReport(req, res) {
    try {
      const {
        reportType,
        startDate,
        endDate,
        customFilters = {}
      } = req.body;

      const report = await metricsService.generateReport({
        reportType,
        startDate,
        endDate,
        customFilters
      });

      res.status(201).json({
        success: true,
        message: 'Relatório gerado com sucesso',
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: error.message
      });
    }
  }

  /**
   * Buscar relatórios
   */
  async getReports(req, res) {
    try {
      const { reportType, limit = 20, skip = 0 } = req.query;
      
      const result = await metricsService.getReports({}, {
        reportType,
        limit,
        skip
      });

      res.json({
        success: true,
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar relatórios',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de estatísticas
   */
  async getDashboard(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      const result = await metricsService.getDashboard(period);

      res.json({
        success: true,
        data: result.stats,
        period: result.period
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message
      });
    }
  }

  /**
   * Buscar configuração de ML ativa
   */
  async getMLConfig(req, res) {
    try {
      const config = await mlService.getActiveConfig();
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuração de ML não encontrada'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar configuração de ML',
        error: error.message
      });
    }
  }

  /**
   * Atualizar configuração de ML
   */
  async updateMLConfig(req, res) {
    try {
      const config = await mlService.updateConfig(req.body);

      res.json({
        success: true,
        message: 'Configuração de ML atualizada com sucesso',
        data: config
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração de ML',
        error: error.message
      });
    }
  }

  /**
   * Executar aprendizado de máquina
   */
  async runMLLearning(req, res) {
    try {
      const result = await mlService.runLearningCycle();

      res.json({
        success: true,
        message: 'Aprendizado de máquina executado com sucesso',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao executar aprendizado de máquina',
        error: error.message
      });
    }
  }
}

module.exports = new MetricsController();
