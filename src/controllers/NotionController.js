const notionService = require('../services/NotionService');
const metricsService = require('../services/MetricsService');
const notionConfig = require('../config/notion');

class NotionController {
  /**
   * Testar conexão com Notion
   */
  async testConnection(req, res) {
    try {
      const result = await notionConfig.testConnection();
      
      res.json({
        success: true,
        message: 'Conexão com Notion OK',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro na conexão com Notion',
        error: error.message
      });
    }
  }

  /**
   * Listar databases disponíveis
   */
  async listDatabases(req, res) {
    try {
      const databases = await notionService.listDatabases();
      
      res.json({
        success: true,
        data: databases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar databases',
        error: error.message
      });
    }
  }

  /**
   * Buscar informações de um database
   */
  async getDatabaseInfo(req, res) {
    try {
      const { databaseId } = req.params;
      const databaseInfo = await notionService.fetchDatabaseInfo(databaseId);
      
      res.json({
        success: true,
        data: databaseInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar informações do database',
        error: error.message
      });
    }
  }

  /**
   * Sincronizar bugs de um database
   */
  async syncDatabase(req, res) {
    try {
      const { databaseId } = req.params;
      
      // Buscar informações do database
      const databaseInfo = await notionService.fetchDatabaseInfo(databaseId);
      
      // Buscar todas as páginas
      const pages = await notionService.fetchAllPages(databaseId);
      
      let syncedCount = 0;
      let updatedCount = 0;
      const errors = [];
      
      // Processar cada página
      for (const page of pages) {
        try {
          // Extrair propriedades da página
          const properties = {};
          Object.keys(page.properties).forEach(key => {
            properties[key] = {
              type: page.properties[key].type,
              value: notionService.extractTextFromProperty(page.properties[key])
            };
          });
          
          // Buscar blocos da página
          const blocks = await notionService.fetchPageBlocks(page.id);
          
          const bugData = {
            notionBugId: page.id,
            bugTitle: properties.Title?.value || properties.Name?.value || 'Sem título',
            bugDescription: properties.Description?.value || properties.Details?.value || '',
            status: properties.Status?.value || 'pending',
            priority: properties.Priority?.value || 'medium',
            assignee: properties.Assignee?.value || '',
            tags: properties.Tags?.value || '',
            rawData: {
              ...page,
              properties,
              blocks
            }
          };
          
          // Verificar se bug já existe
          const existingBug = await metricsService.findBugByNotionId(page.id);
          
          if (existingBug) {
            // Atualizar bug existente
            existingBug.bugTitle = bugData.bugTitle;
            existingBug.bugDescription = bugData.bugDescription;
            existingBug.status = metricsService.mapNotionStatusToInternal(bugData.status);
            existingBug.rawData = bugData.rawData;
            existingBug.updatedAt = new Date();
            
            await existingBug.save();
            updatedCount++;
          } else {
            // Criar novo bug
            await metricsService.createBug(bugData);
            syncedCount++;
          }
          
        } catch (error) {
          errors.push({
            pageId: page.id,
            error: error.message
          });
        }
      }
      
      res.json({
        success: true,
        message: 'Sincronização concluída',
        data: {
          database: databaseInfo,
          totalPages: pages.length,
          syncedCount,
          updatedCount,
          errors: errors.length,
          errorDetails: errors
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro durante sincronização',
        error: error.message
      });
    }
  }

  /**
   * Consumir dados completos de um database
   */
  async consumeDatabase(req, res) {
    try {
      const { databaseId } = req.params;
      
      // Buscar informações do database
      const databaseInfo = await notionService.fetchDatabaseInfo(databaseId);
      
      // Buscar todas as páginas
      const pages = await notionService.fetchAllPages(databaseId);
      
      const consumedData = {
        database: databaseInfo,
        pages: [],
        metadata: {
          consumedAt: new Date().toISOString(),
          totalPages: pages.length,
          totalBlocks: 0
        }
      };
      
      // Processar cada página com blocos
      for (const page of pages) {
        const properties = {};
        Object.keys(page.properties).forEach(key => {
          properties[key] = {
            type: page.properties[key].type,
            value: notionService.extractTextFromProperty(page.properties[key])
          };
        });
        
        const blocks = await notionService.fetchPageBlocks(page.id);
        
        const pageData = {
          id: page.id,
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          properties,
          blocks
        };
        
        consumedData.pages.push(pageData);
        consumedData.metadata.totalBlocks += blocks.length;
      }
      
      res.json({
        success: true,
        message: 'Database consumido com sucesso',
        data: consumedData
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao consumir database',
        error: error.message
      });
    }
  }
}

module.exports = new NotionController();
