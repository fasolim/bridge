#!/usr/bin/env node

/**
 * Script para consumir TODOS os dados de um database do Notion
 * Salva em formato JSON e prepara para MongoDB
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_API_BASE = 'https://api.notion.com/v1';
const DATA_DIR = path.join(__dirname, '..', 'notion-data');

// Headers para requisições ao Notion
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

class NotionDatabaseConsumer {
  constructor() {
    this.ensureDataDir();
    this.consumedData = {
      database: null,
      pages: [],
      blocks: [],
      users: [],
      metadata: {
        consumedAt: new Date().toISOString(),
        totalPages: 0,
        totalBlocks: 0,
        totalUsers: 0
      }
    };
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Extrai texto de propriedades do Notion
   */
  extractTextFromProperty(property) {
    if (!property) return '';
    
    if (property.type === 'title' && property.title) {
      return property.title.map(item => item.plain_text).join('');
    }
    
    if (property.type === 'rich_text' && property.rich_text) {
      return property.rich_text.map(item => item.plain_text).join('');
    }
    
    if (property.type === 'select' && property.select) {
      return property.select.name;
    }
    
    if (property.type === 'multi_select' && property.multi_select) {
      return property.multi_select.map(item => item.name).join(', ');
    }
    
    if (property.type === 'number') {
      return property.number;
    }
    
    if (property.type === 'checkbox') {
      return property.checkbox;
    }
    
    if (property.type === 'date' && property.date) {
      return property.date.start;
    }
    
    if (property.type === 'people' && property.people) {
      return property.people.map(person => person.name || person.id).join(', ');
    }
    
    if (property.type === 'files' && property.files) {
      return property.files.map(file => file.name || file.url).join(', ');
    }
    
    if (property.type === 'url' && property.url) {
      return property.url;
    }
    
    if (property.type === 'email' && property.email) {
      return property.email;
    }
    
    if (property.type === 'phone_number' && property.phone_number) {
      return property.phone_number;
    }
    
    return '';
  }

  /**
   * Extrai todos os dados de uma página
   */
  async extractPageData(page) {
    const pageData = {
      id: page.id,
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      created_by: page.created_by,
      last_edited_by: page.last_edited_by,
      parent: page.parent,
      archived: page.archived,
      properties: {},
      blocks: []
    };

    // Extrair propriedades
    if (page.properties) {
      Object.keys(page.properties).forEach(key => {
        pageData.properties[key] = {
          type: page.properties[key].type,
          value: this.extractTextFromProperty(page.properties[key])
        };
      });
    }

    // Buscar blocos da página
    try {
      const blocksResponse = await axios.get(
        `${NOTION_API_BASE}/blocks/${page.id}/children`,
        { headers: notionHeaders }
      );

      pageData.blocks = blocksResponse.data.results.map(block => ({
        id: block.id,
        type: block.type,
        created_time: block.created_time,
        last_edited_time: block.last_edited_time,
        has_children: block.has_children,
        content: this.extractBlockContent(block)
      }));

    } catch (error) {
      console.log(`⚠️  Não foi possível buscar blocos da página ${page.id}: ${error.message}`);
    }

    return pageData;
  }

  /**
   * Extrai conteúdo de um bloco
   */
  extractBlockContent(block) {
    const content = {
      type: block.type,
      text: '',
      url: '',
      caption: '',
      language: '',
      code: '',
      formula: '',
      table: null,
      children: []
    };

    switch (block.type) {
      case 'paragraph':
        if (block.paragraph?.rich_text) {
          content.text = block.paragraph.rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        if (block[block.type]?.rich_text) {
          content.text = block[block.type].rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'bulleted_list_item':
      case 'numbered_list_item':
        if (block[block.type]?.rich_text) {
          content.text = block[block.type].rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'code':
        if (block.code?.rich_text) {
          content.code = block.code.rich_text.map(item => item.plain_text).join('');
          content.language = block.code.language;
        }
        break;
      
      case 'image':
      case 'video':
      case 'file':
        if (block[block.type]?.url) {
          content.url = block[block.type].url;
        }
        if (block[block.type]?.caption) {
          content.caption = block[block.type].caption.map(item => item.plain_text).join('');
        }
        break;
      
      case 'table':
        if (block.table) {
          content.table = {
            table_width: block.table.table_width,
            has_column_header: block.table.has_column_header,
            has_row_header: block.table.has_row_header
          };
        }
        break;
      
      case 'formula':
        if (block.formula) {
          content.formula = block.formula.expression || '';
        }
        break;
    }

    return content;
  }

  /**
   * Busca informações do database
   */
  async fetchDatabaseInfo(databaseId) {
    try {
      console.log(`🔍 Buscando informações do database: ${databaseId}...`);
      
      const response = await axios.get(
        `${NOTION_API_BASE}/databases/${databaseId}`,
        { headers: notionHeaders }
      );

      const database = response.data;
      
      return {
        id: database.id,
        title: database.title?.map(item => item.plain_text).join('') || 'Sem título',
        description: database.description?.map(item => item.plain_text).join('') || '',
        url: database.url,
        created_time: database.created_time,
        last_edited_time: database.last_edited_time,
        properties: Object.keys(database.properties).map(key => ({
          name: key,
          type: database.properties[key].type,
          description: database.properties[key].description || ''
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao buscar informações do database:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Busca todas as páginas do database
   */
  async fetchAllPages(databaseId) {
    try {
      console.log(`📄 Buscando todas as páginas do database...`);
      
      let allPages = [];
      let hasMore = true;
      let startCursor = undefined;

      while (hasMore) {
        const requestBody = {
          page_size: 100
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await axios.post(
          `${NOTION_API_BASE}/databases/${databaseId}/query`,
          requestBody,
          { headers: notionHeaders }
        );

        const pages = response.data.results;
        allPages = allPages.concat(pages);
        
        hasMore = response.data.has_more;
        startCursor = response.data.next_cursor;

        console.log(`   📄 ${pages.length} páginas encontradas (total: ${allPages.length})`);
        
        // Pequena pausa para não sobrecarregar a API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Total de páginas encontradas: ${allPages.length}`);
      return allPages;
    } catch (error) {
      console.error('❌ Erro ao buscar páginas:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Consome todos os dados do database
   */
  async consumeDatabase(databaseId) {
    console.log('\n🚀 INICIANDO CONSUMO COMPLETO DO DATABASE\n');
    console.log(`📊 Database ID: ${databaseId}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

    try {
      // 1. Buscar informações do database
      console.log('📋 FASE 1: Buscando informações do database...');
      this.consumedData.database = await this.fetchDatabaseInfo(databaseId);
      console.log(`✅ Database: ${this.consumedData.database.title}`);

      // 2. Buscar todas as páginas
      console.log('\n📄 FASE 2: Buscando todas as páginas...');
      const pages = await this.fetchAllPages(databaseId);

      // 3. Extrair dados de cada página
      console.log('\n🔍 FASE 3: Extraindo dados das páginas...');
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        console.log(`   📄 Processando página ${i + 1}/${pages.length}: ${page.id}`);
        
        try {
          const pageData = await this.extractPageData(page);
          this.consumedData.pages.push(pageData);
          
          // Contar blocos
          this.consumedData.metadata.totalBlocks += pageData.blocks.length;
          
        } catch (error) {
          console.log(`   ⚠️  Erro ao processar página ${page.id}: ${error.message}`);
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 4. Atualizar metadados
      this.consumedData.metadata.totalPages = this.consumedData.pages.length;
      this.consumedData.metadata.consumedAt = new Date().toISOString();

      // 5. Salvar dados
      console.log('\n💾 FASE 4: Salvando dados...');
      await this.saveData(databaseId);

      // 6. Gerar relatório
      console.log('\n📊 FASE 5: Gerando relatório...');
      this.generateReport();

      console.log('\n' + '='.repeat(70));
      console.log('🎉 CONSUMO COMPLETO FINALIZADO!');
      console.log('='.repeat(70));
      console.log(`📊 Database: ${this.consumedData.database.title}`);
      console.log(`📄 Páginas: ${this.consumedData.metadata.totalPages}`);
      console.log(`🧱 Blocos: ${this.consumedData.metadata.totalBlocks}`);
      console.log(`📁 Arquivo: ${this.getDataFile(databaseId)}`);
      console.log('='.repeat(70) + '\n');

      return this.consumedData;

    } catch (error) {
      console.error('❌ Erro durante consumo do database:', error);
      throw error;
    }
  }

  /**
   * Salva os dados em arquivo JSON
   */
  async saveData(databaseId) {
    const filename = `database_${databaseId}_${Date.now()}.json`;
    const filepath = path.join(DATA_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.consumedData, null, 2));
    
    // Também salva um arquivo com nome fixo para facilitar acesso
    const latestFile = path.join(DATA_DIR, `latest_database_${databaseId}.json`);
    fs.writeFileSync(latestFile, JSON.stringify(this.consumedData, null, 2));
    
    console.log(`✅ Dados salvos em: ${filepath}`);
    console.log(`✅ Arquivo mais recente: ${latestFile}`);
  }

  /**
   * Gera relatório dos dados consumidos
   */
  generateReport() {
    const report = {
      database: this.consumedData.database,
      summary: this.consumedData.metadata,
      pagesByType: {},
      propertiesUsage: {},
      blocksByType: {}
    };

    // Analisar tipos de páginas
    this.consumedData.pages.forEach(page => {
      const pageType = page.parent?.type || 'unknown';
      report.pagesByType[pageType] = (report.pagesByType[pageType] || 0) + 1;
    });

    // Analisar uso de propriedades
    this.consumedData.pages.forEach(page => {
      Object.keys(page.properties).forEach(prop => {
        report.propertiesUsage[prop] = (report.propertiesUsage[prop] || 0) + 1;
      });
    });

    // Analisar tipos de blocos
    this.consumedData.pages.forEach(page => {
      page.blocks.forEach(block => {
        report.blocksByType[block.type] = (report.blocksByType[block.type] || 0) + 1;
      });
    });

    const reportFile = path.join(DATA_DIR, `report_${this.consumedData.database.id}_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('📊 Relatório gerado:');
    console.log(`   📄 Páginas por tipo:`, report.pagesByType);
    console.log(`   🏷️  Propriedades mais usadas:`, Object.entries(report.propertiesUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([prop, count]) => `${prop} (${count})`)
      .join(', '));
    console.log(`   🧱 Blocos por tipo:`, Object.entries(report.blocksByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => `${type} (${count})`)
      .join(', '));
  }

  getDataFile(databaseId) {
    return path.join(DATA_DIR, `latest_database_${databaseId}.json`);
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
        title: page.properties.Title?.value || page.properties.Name?.value || 'Sem título',
        description: page.properties.Description?.value || page.properties.Details?.value || '',
        bugLevel: this.determineBugLevel({
          title: page.properties.Title?.value || page.properties.Name?.value || '',
          description: page.properties.Description?.value || page.properties.Details?.value || ''
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
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        resolvedAt: null,
        rawData: page // Manter dados originais para referência
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
  async saveMongoFormat(databaseId) {
    const mongoData = this.convertToMongoFormat();
    const mongoFile = path.join(DATA_DIR, `mongo_format_${databaseId}_${Date.now()}.json`);
    fs.writeFileSync(mongoFile, JSON.stringify(mongoData, null, 2));
    
    console.log(`✅ Dados em formato MongoDB salvos em: ${mongoFile}`);
    return mongoData;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const databaseId = args[0];
  const format = args[1] || 'full';
  
  if (!databaseId) {
    console.log('❌ Uso: node consume-notion-database.js <DATABASE_ID> [format]');
    console.log('');
    console.log('Formatos disponíveis:');
    console.log('  full        - Dados completos (padrão)');
    console.log('  mongo       - Formato otimizado para MongoDB');
    console.log('  both        - Ambos os formatos');
    console.log('');
    console.log('Exemplos:');
    console.log('  node consume-notion-database.js 28ecd984590f806eaa85ceb72a6e816c');
    console.log('  node consume-notion-database.js 28ecd984590f806eaa85ceb72a6e816c mongo');
    process.exit(1);
  }
  
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN não encontrado no .env');
    process.exit(1);
  }
  
  const consumer = new NotionDatabaseConsumer();
  
  try {
    await consumer.consumeDatabase(databaseId);
    
    if (format === 'mongo' || format === 'both') {
      console.log('\n🔄 Convertendo para formato MongoDB...');
      await consumer.saveMongoFormat(databaseId);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NotionDatabaseConsumer;
