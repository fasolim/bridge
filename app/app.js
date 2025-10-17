require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const metricsRoutes = require('./routes/metrics');
const notionRoutes = require('./routes/notion');

// Database
const databaseConfig = require('./config/database');

const app = express();

// Middleware de segurança e CORS
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use(logger);

// Servir arquivos estáticos (views)
app.use(express.static(path.join(__dirname, 'views')));

// Conectar ao banco de dados
databaseConfig.connect().catch(console.error);

// Rotas
app.use('/api/metrics', metricsRoutes);
app.use('/api/notion', notionRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bridge Metrics API está funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bridge Metrics API',
    version: '2.0.0',
    endpoints: {
      metrics: '/api/metrics',
      notion: '/api/notion',
      health: '/api/health'
    }
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

module.exports = app;
