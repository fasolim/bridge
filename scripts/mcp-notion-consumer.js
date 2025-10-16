#!/usr/bin/env node

/**
 * Script para consumir dados do Notion usando MCP
 * Integra com o sistema de métricas do Bridge
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'notion-data');

class MCPNotionConsumer {
  constructor() {
    this.ensureDataDir();
    this.consumedData = {
      database: null,
      pages: [],
      blocks: [],
      metadata: {
        consumedAt: new Date().toISOString(),
        totalPages: 0,
        totalBlocks: 0,
        method: 'mcp'
      }
    };
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Simula dados do MCP (quando o MCP estiver disponível)
   */
  async simulateMCPData(databaseId) {
    console.log('🔄 Simulando dados do MCP...');
    
    // Dados simulados baseados na URL fornecida
    const simulatedData = {
      database: {
        id: databaseId,
        title: 'Database de Bugs - Bridge',
        description: 'Database para gerenciamento de bugs do sistema Bridge',
        url: `https://www.notion.so/${databaseId}`,
        properties: [
          { name: 'Title', type: 'title' },
          { name: 'Description', type: 'rich_text' },
          { name: 'Status', type: 'select' },
          { name: 'Priority', type: 'select' },
          { name: 'Assignee', type: 'people' },
          { name: 'Tags', type: 'multi_select' },
          { name: 'Created', type: 'created_time' },
          { name: 'Updated', type: 'last_edited_time' }
        ]
      },
      pages: [
        {
          id: `${databaseId}-page-1`,
          url: `https://www.notion.so/${databaseId}-page-1`,
          properties: {
            Title: { value: 'Botão de login não funciona', type: 'title' },
            Description: { value: 'O botão de login na página principal não responde quando clicado. Usuários não conseguem fazer login no sistema.', type: 'rich_text' },
            Status: { value: 'In Progress', type: 'select' },
            Priority: { value: 'High', type: 'select' },
            Assignee: { value: 'Bug Resolver', type: 'people' },
            Tags: { value: 'frontend,login,ui', type: 'multi_select' },
            Created: { value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'created_time' },
            Updated: { value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'last_edited_time' }
          },
          blocks: [
            {
              id: `${databaseId}-block-1`,
              type: 'paragraph',
              content: {
                text: 'Este é um bug crítico que afeta a funcionalidade principal do sistema. O botão de login está localizado no canto superior direito da página principal.'
              }
            },
            {
              id: `${databaseId}-block-2`,
              type: 'bulleted_list_item',
              content: {
                text: 'Usuários não conseguem fazer login'
              }
            },
            {
              id: `${databaseId}-block-3`,
              type: 'bulleted_list_item',
              content: {
                text: 'Botão não responde a cliques'
              }
            },
            {
              id: `${databaseId}-block-4`,
              type: 'code',
              content: {
                code: 'function handleLogin() {\n  // Código do botão de login\n  console.log("Login clicked");\n}',
                language: 'javascript'
              }
            }
          ]
        },
        {
          id: `${databaseId}-page-2`,
          url: `https://www.notion.so/${databaseId}-page-2`,
          properties: {
            Title: { value: 'Erro na validação de formulário', type: 'title' },
            Description: { value: 'O formulário de cadastro não valida corretamente os campos obrigatórios. Permite submissão com dados inválidos.', type: 'rich_text' },
            Status: { value: 'Pending', type: 'select' },
            Priority: { value: 'Medium', type: 'select' },
            Assignee: { value: '', type: 'people' },
            Tags: { value: 'validation,form,backend', type: 'multi_select' },
            Created: { value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'created_time' },
            Updated: { value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'last_edited_time' }
          },
          blocks: [
            {
              id: `${databaseId}-block-5`,
              type: 'paragraph',
              content: {
                text: 'O formulário de cadastro está localizado em /register e contém os seguintes campos:'
              }
            },
            {
              id: `${databaseId}-block-6`,
              type: 'numbered_list_item',
              content: {
                text: 'Nome (obrigatório)'
              }
            },
            {
              id: `${databaseId}-block-7`,
              type: 'numbered_list_item',
              content: {
                text: 'Email (obrigatório)'
              }
            },
            {
              id: `${databaseId}-block-8`,
              type: 'numbered_list_item',
              content: {
                text: 'Senha (obrigatório)'
              }
            }
          ]
        },
        {
          id: `${databaseId}-page-3`,
          url: `https://www.notion.so/${databaseId}-page-3`,
          properties: {
            Title: { value: 'Falha na integração com API externa', type: 'title' },
            Description: { value: 'A integração com a API de pagamento está falhando. Transações não são processadas corretamente.', type: 'rich_text' },
            Status: { value: 'Escalated', type: 'select' },
            Priority: { value: 'Critical', type: 'select' },
            Assignee: { value: 'Senior Developer', type: 'people' },
            Tags: { value: 'api,payment,integration', type: 'multi_select' },
            Created: { value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'created_time' },
            Updated: { value: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'last_edited_time' }
          },
          blocks: [
            {
              id: `${databaseId}-block-9`,
              type: 'paragraph',
              content: {
                text: 'Este é um bug crítico que afeta o processamento de pagamentos. A integração com a API externa está retornando erros 500.'
              }
            },
            {
              id: `${databaseId}-block-10`,
              type: 'code',
              content: {
                code: 'POST /api/payments\n{\n  "amount": 100,\n  "currency": "USD"\n}\n\nResponse: 500 Internal Server Error',
                language: 'json'
              }
            },
            {
              id: `${databaseId}-block-11`,
              type: 'paragraph',
              content: {
                text: 'Logs do servidor mostram:'
              }
            },
            {
              id: `${databaseId}-block-12`,
              type: 'code',
              content: {
                code: 'ERROR: Connection timeout to payment API\nERROR: Failed to process payment\nERROR: Transaction rolled back',
                language: 'text'
              }
            }
          ]
        }
      ]
    };

    return simulatedData;
  }

  /**
   * Consome dados usando MCP
   */
  async consumeWithMCP(databaseId) {
    console.log('\n🚀 CONSUMINDO DADOS COM MCP\n');
    console.log(`📊 Database ID: ${databaseId}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

    try {
      // Simular dados do MCP (quando o MCP estiver disponível, substituir por chamada real)
      const mcpData = await this.simulateMCPData(databaseId);
      
      // Processar dados
      this.consumedData.database = mcpData.database;
      this.consumedData.pages = mcpData.pages;
      
      // Contar blocos
      this.consumedData.metadata.totalBlocks = mcpData.pages.reduce((total, page) => 
        total + (page.blocks ? page.blocks.length : 0), 0);
      this.consumedData.metadata.totalPages = mcpData.pages.length;

      // Salvar dados
      await this.saveData(databaseId);
      
      // Converter para formato MongoDB
      const mongoData = this.convertToMongoFormat();
      await this.saveMongoFormat(databaseId, mongoData);
      
      // Gerar relatório
      this.generateReport();

      console.log('\n' + '='.repeat(70));
      console.log('🎉 CONSUMO COM MCP FINALIZADO!');
      console.log('='.repeat(70));
      console.log(`📊 Database: ${this.consumedData.database.title}`);
      console.log(`📄 Páginas: ${this.consumedData.metadata.totalPages}`);
      console.log(`🧱 Blocos: ${this.consumedData.metadata.totalBlocks}`);
      console.log(`📁 Arquivo: ${this.getDataFile(databaseId)}`);
      console.log('='.repeat(70) + '\n');

      return this.consumedData;

    } catch (error) {
      console.error('❌ Erro durante consumo com MCP:', error);
      throw error;
    }
  }

  /**
   * Salva os dados em arquivo JSON
   */
  async saveData(databaseId) {
    const filename = `mcp_database_${databaseId}_${Date.now()}.json`;
    const filepath = path.join(DATA_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.consumedData, null, 2));
    
    // Também salva um arquivo com nome fixo para facilitar acesso
    const latestFile = path.join(DATA_DIR, `latest_mcp_database_${databaseId}.json`);
    fs.writeFileSync(latestFile, JSON.stringify(this.consumedData, null, 2));
    
    console.log(`✅ Dados MCP salvos em: ${filepath}`);
    console.log(`✅ Arquivo mais recente: ${latestFile}`);
  }

  /**
   * Converte dados para formato MongoDB
   */
  convertToMongoFormat() {
    const mongoData = {
      bugs: [],
      reports: [],
      mlConfig: {
        promptTemplates: [
          {
            level: 1,
            template: 'Analise e corrija o seguinte bug: {bugDescription}. Forneça uma solução simples e direta.',
            successRate: 0.0,
            usageCount: 0
          },
          {
            level: 2,
            template: 'Este é um bug de nível intermediário. Analise cuidadosamente: {bugDescription}. Considere múltiplas abordagens e escolha a melhor.',
            successRate: 0.0,
            usageCount: 0
          },
          {
            level: 3,
            template: 'Bug complexo detectado: {bugDescription}. Realize análise detalhada, identifique dependências e forneça solução robusta.',
            successRate: 0.0,
            usageCount: 0
          },
          {
            level: 4,
            template: 'Bug crítico de alto nível: {bugDescription}. Análise arquitetural necessária. Considere impacto em todo o sistema.',
            successRate: 0.0,
            usageCount: 0
          },
          {
            level: 5,
            template: 'Bug extremamente complexo: {bugDescription}. Requer análise profunda, refatoração e testes extensivos. Abordagem sistemática necessária.',
            successRate: 0.0,
            usageCount: 0
          }
        ],
        escalationRules: [
          {
            condition: 'attempts > 2',
            action: 'increase_level',
            parameters: { increment: 1 }
          }
        ],
        learningRate: 0.1,
        lastUpdated: new Date().toISOString()
      }
    };

    // Converter páginas para formato de bugs
    this.consumedData.pages.forEach(page => {
      const bug = {
        id: `bug_${page.id}`,
        notionBugId: page.id,
        notionUrl: page.url,
        title: page.properties.Title?.value || 'Sem título',
        description: page.properties.Description?.value || '',
        bugLevel: this.determineBugLevel({
          title: page.properties.Title?.value || '',
          description: page.properties.Description?.value || ''
        }),
        status: this.mapNotionStatusToInternal(page.properties.Status?.value || 'pending'),
        priority: page.properties.Priority?.value || 'medium',
        assignee: page.properties.Assignee?.value || '',
        tags: page.properties.Tags?.value || '',
        attempts: [],
        totalAttempts: 0,
        totalTokens: 0,
        totalCost: 0,
        totalExecutionTime: 0,
        createdAt: page.properties.Created?.value || new Date().toISOString(),
        updatedAt: page.properties.Updated?.value || new Date().toISOString(),
        resolvedAt: null,
        rawData: page, // Manter dados originais para referência
        blocks: page.blocks || [] // Incluir blocos para análise detalhada
      };

      mongoData.bugs.push(bug);
    });

    return mongoData;
  }

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
   * Salva dados em formato MongoDB
   */
  async saveMongoFormat(databaseId, mongoData) {
    const mongoFile = path.join(DATA_DIR, `mongo_mcp_${databaseId}_${Date.now()}.json`);
    fs.writeFileSync(mongoFile, JSON.stringify(mongoData, null, 2));
    
    // Também salva um arquivo com nome fixo
    const latestMongoFile = path.join(DATA_DIR, `latest_mongo_mcp_${databaseId}.json`);
    fs.writeFileSync(latestMongoFile, JSON.stringify(mongoData, null, 2));
    
    console.log(`✅ Dados em formato MongoDB salvos em: ${mongoFile}`);
    console.log(`✅ Arquivo MongoDB mais recente: ${latestMongoFile}`);
    
    return mongoData;
  }

  /**
   * Gera relatório dos dados consumidos
   */
  generateReport() {
    const report = {
      database: this.consumedData.database,
      summary: this.consumedData.metadata,
      bugsByLevel: {},
      bugsByStatus: {},
      bugsByPriority: {},
      blocksByType: {}
    };

    // Analisar bugs por nível
    this.consumedData.pages.forEach(page => {
      const bugLevel = this.determineBugLevel({
        title: page.properties.Title?.value || '',
        description: page.properties.Description?.value || ''
      });
      report.bugsByLevel[bugLevel] = (report.bugsByLevel[bugLevel] || 0) + 1;
    });

    // Analisar bugs por status
    this.consumedData.pages.forEach(page => {
      const status = this.mapNotionStatusToInternal(page.properties.Status?.value || 'pending');
      report.bugsByStatus[status] = (report.bugsByStatus[status] || 0) + 1;
    });

    // Analisar bugs por prioridade
    this.consumedData.pages.forEach(page => {
      const priority = page.properties.Priority?.value || 'medium';
      report.bugsByPriority[priority] = (report.bugsByPriority[priority] || 0) + 1;
    });

    // Analisar tipos de blocos
    this.consumedData.pages.forEach(page => {
      if (page.blocks) {
        page.blocks.forEach(block => {
          report.blocksByType[block.type] = (report.blocksByType[block.type] || 0) + 1;
        });
      }
    });

    const reportFile = path.join(DATA_DIR, `mcp_report_${this.consumedData.database.id}_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('📊 Relatório MCP gerado:');
    console.log(`   🎯 Bugs por nível:`, report.bugsByLevel);
    console.log(`   📊 Bugs por status:`, report.bugsByStatus);
    console.log(`   ⚡ Bugs por prioridade:`, report.bugsByPriority);
    console.log(`   🧱 Blocos por tipo:`, Object.entries(report.blocksByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => `${type} (${count})`)
      .join(', '));
  }

  getDataFile(databaseId) {
    return path.join(DATA_DIR, `latest_mcp_database_${databaseId}.json`);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const databaseId = args[0];
  
  if (!databaseId) {
    console.log('❌ Uso: node mcp-notion-consumer.js <DATABASE_ID>');
    console.log('');
    console.log('Exemplo:');
    console.log('  node mcp-notion-consumer.js 28ecd984590f806eaa85ceb72a6e816c');
    process.exit(1);
  }
  
  const consumer = new MCPNotionConsumer();
  
  try {
    await consumer.consumeWithMCP(databaseId);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MCPNotionConsumer;
