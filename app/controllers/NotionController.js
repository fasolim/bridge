const axios = require('axios');
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
        message: `Encontrados ${databases.length} databases`,
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
          
          // Buscar blocos da página diretamente da API
          let blocks = [];
          let description = '';
          
          try {
            const blocksResponse = await axios.get(`https://api.notion.com/v1/blocks/${page.id}/children`, {
              headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28'
              }
            });
            
            blocks = blocksResponse.data.results;
            
            // Extrair descrição dos blocos
            if (blocks && blocks.length > 0) {
              // Pegar o primeiro bloco de parágrafo como descrição
              const firstParagraph = blocks.find(block => block.type === 'paragraph');
              if (firstParagraph && firstParagraph.paragraph && firstParagraph.paragraph.rich_text) {
                description = firstParagraph.paragraph.rich_text.map(text => text.plain_text).join('').trim();
              }
            }
          } catch (blockError) {
            console.log(`⚠️  Erro ao buscar blocos da página ${page.id}: ${blockError.message}`);
          }
          
          // Se não encontrou descrição nos blocos, usar uma descrição padrão
          if (!description) {
            description = `Bug reportado no módulo ${properties.Módulo?.value || 'N/A'}`;
          }
          
          const bugData = {
            notionBugId: page.id,
            bugTitle: properties.Título?.value || properties.Title?.value || properties.Name?.value || 'Sem título',
            bugDescription: description,
            status: metricsService.mapNotionStatusToInternal(properties.Status?.value || 'pending'),
            priority: properties.Prioridade?.value || properties.Priority?.value || 'medium',
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
            existingBug.status = bugData.status; // Já mapeado acima
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
   * Extrair database ID de um link do Notion
   */
  extractDatabaseIdFromUrl(url) {
    try {
      // Padrões de URL do Notion (suporta UUIDs com hífens)
      const patterns = [
        /notion\.so\/([a-f0-9-]{36})/i,
        /notion\.site\/([a-f0-9-]{36})/i,
        /notion\.so\/[^\/]+\/([a-f0-9-]{36})/i,
        /notion\.site\/[^\/]+\/([a-f0-9-]{36})/i,
        // Padrões antigos sem hífens
        /notion\.so\/([a-f0-9]{32})/i,
        /notion\.site\/([a-f0-9]{32})/i,
        /notion\.so\/[^\/]+\/([a-f0-9]{32})/i,
        /notion\.site\/[^\/]+\/([a-f0-9]{32})/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      // Se não encontrou, assumir que o parâmetro é o próprio ID
      if (/^[a-f0-9-]{36}$/i.test(url) || /^[a-f0-9]{32}$/i.test(url)) {
        return url;
      }
      
      throw new Error('URL do Notion inválida. Formato esperado: https://notion.so/[DATABASE_ID]');
    } catch (error) {
      throw new Error(`Erro ao extrair database ID: ${error.message}`);
    }
  }

  /**
   * Processar link do Notion e sincronizar dados
   */
  async processNotionLink(req, res) {
    try {
      const { notionUrl, options = {} } = req.body;
      
      if (!notionUrl) {
        return res.status(400).json({
          success: false,
          message: 'URL do Notion é obrigatória',
          example: {
            notionUrl: 'https://notion.so/abc123def456...',
            options: {
              includeBlocks: true,
              syncToDatabase: true
            }
          }
        });
      }

      console.log(`🔗 Processando link do Notion: ${notionUrl}`);
      
      // Extrair database ID
      const databaseId = this.extractDatabaseIdFromUrl(notionUrl);
      console.log(`📊 Database ID extraído: ${databaseId}`);
      
      // Buscar informações do database
      const databaseInfo = await notionService.fetchDatabaseInfo(databaseId);
      console.log(`✅ Database encontrado: ${databaseInfo.title}`);
      
      // Buscar todas as páginas
      const pages = await notionService.fetchAllPages(databaseId);
      console.log(`📄 Encontradas ${pages.length} páginas`);
      
      let syncedCount = 0;
      let updatedCount = 0;
      const errors = [];
      const processedBugs = [];
      
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
          
          // Buscar blocos se solicitado
          let blocks = [];
          if (options.includeBlocks) {
            blocks = await notionService.fetchPageBlocks(page.id);
          }
          
          const bugData = {
            notionBugId: page.id,
            bugTitle: properties.Title?.value || properties.Name?.value || 'Sem título',
            bugDescription: properties.Description?.value || properties.Details?.value || '',
            status: properties.Status?.value || 'pending',
            priority: properties.Priority?.value || 'medium',
            assignee: properties.Assignee?.value || '',
            tags: properties.Tags?.value || '',
            notionUrl: page.url,
            rawData: {
              ...page,
              properties,
              blocks: options.includeBlocks ? blocks : []
            }
          };
          
          // Sincronizar com banco se solicitado
          if (options.syncToDatabase !== false) {
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
          }
          
          processedBugs.push({
            id: page.id,
            title: bugData.bugTitle,
            description: bugData.bugDescription,
            status: bugData.status,
            priority: bugData.priority,
            assignee: bugData.assignee,
            tags: bugData.tags,
            notionUrl: page.url,
            hasBlocks: blocks.length > 0,
            blockCount: blocks.length
          });
          
        } catch (error) {
          errors.push({
            pageId: page.id,
            error: error.message
          });
        }
      }
      
      const result = {
        success: true,
        message: 'Link do Notion processado com sucesso',
        data: {
          notionUrl,
          databaseId,
          database: {
            id: databaseId,
            title: databaseInfo.title,
            description: databaseInfo.description,
            url: databaseInfo.url
          },
          processing: {
            totalPages: pages.length,
            syncedCount,
            updatedCount,
            errors: errors.length,
            processedAt: new Date().toISOString()
          },
          bugs: processedBugs,
          errorDetails: errors
        }
      };
      
      console.log(`✅ Processamento concluído: ${syncedCount} novos, ${updatedCount} atualizados, ${errors.length} erros`);
      
      res.json(result);
      
    } catch (error) {
      console.error('❌ Erro ao processar link do Notion:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar link do Notion',
        error: error.message,
        details: error.stack
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
