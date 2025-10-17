/**
 * Bridge App - Índice Principal
 * 
 * Este arquivo centraliza todas as exportações da aplicação
 * para facilitar imports e manutenção
 */

// Models
const BugMetrics = require('./models/BugMetrics');
const MLConfig = require('./models/MLConfig');
const Report = require('./models/Report');

// Controllers
const MetricsController = require('./controllers/MetricsController');
const NotionController = require('./controllers/NotionController');

// Services
const MetricsService = require('./services/MetricsService');
const MLService = require('./services/MLService');
const NotionService = require('./services/NotionService');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Config
const databaseConfig = require('./config/database');
const notionConfig = require('./config/notion');

// Routes
const metricsRoutes = require('./routes/metrics');
const notionRoutes = require('./routes/notion');

module.exports = {
  // Models
  models: {
    BugMetrics,
    MLConfig,
    Report
  },
  
  // Controllers
  controllers: {
    MetricsController,
    NotionController
  },
  
  // Services
  services: {
    MetricsService,
    MLService,
    NotionService
  },
  
  // Middleware
  middleware: {
    errorHandler,
    logger
  },
  
  // Config
  config: {
    database: databaseConfig,
    notion: notionConfig
  },
  
  // Routes
  routes: {
    metrics: metricsRoutes,
    notion: notionRoutes
  }
};
