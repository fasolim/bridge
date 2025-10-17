const express = require('express');
const router = express.Router();
const notionController = require('../controllers/NotionController');

// ===== ENDPOINTS PARA NOTION =====

// Testar conexão com Notion
router.get('/test', notionController.testConnection.bind(notionController));

// Listar databases disponíveis
router.get('/databases', notionController.listDatabases.bind(notionController));

// Buscar informações de um database
router.get('/databases/:databaseId', notionController.getDatabaseInfo.bind(notionController));

// Sincronizar bugs de um database
router.post('/databases/:databaseId/sync', notionController.syncDatabase.bind(notionController));

// Consumir dados completos de um database
router.post('/databases/:databaseId/consume', notionController.consumeDatabase.bind(notionController));

// Processar link do Notion e sincronizar dados
router.post('/process-link', (req, res) => notionController.processNotionLink(req, res));

module.exports = router;
