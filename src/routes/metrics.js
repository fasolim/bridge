const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/MetricsController');

// ===== ENDPOINTS PARA BUG METRICS =====

// Criar nova métrica de bug
router.post('/bugs', metricsController.createBug.bind(metricsController));

// Adicionar tentativa de resolução
router.post('/bugs/:bugId/attempts', metricsController.addAttempt.bind(metricsController));

// Atualizar status do bug
router.patch('/bugs/:bugId/status', metricsController.updateBugStatus.bind(metricsController));

// Buscar bug por ID do Notion
router.get('/bugs/notion/:notionBugId', metricsController.getBugByNotionId.bind(metricsController));

// Listar bugs com filtros
router.get('/bugs', metricsController.listBugs.bind(metricsController));

// ===== ENDPOINTS PARA RELATÓRIOS =====

// Gerar relatório
router.post('/reports', metricsController.generateReport.bind(metricsController));

// Buscar relatórios
router.get('/reports', metricsController.getReports.bind(metricsController));

// ===== ENDPOINTS PARA ML CONFIG =====

// Buscar configuração de ML ativa
router.get('/ml-config', metricsController.getMLConfig.bind(metricsController));

// Atualizar configuração de ML
router.put('/ml-config', metricsController.updateMLConfig.bind(metricsController));

// Executar aprendizado de máquina
router.post('/ml-learning', metricsController.runMLLearning.bind(metricsController));

// ===== ENDPOINTS PARA ESTATÍSTICAS =====

// Dashboard de estatísticas
router.get('/dashboard', metricsController.getDashboard.bind(metricsController));

module.exports = router;
