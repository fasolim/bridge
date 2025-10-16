#!/usr/bin/env node

/**
 * Script para sincronizar dados do Notion com MongoDB
 * Lê bugs do Notion e salva métricas no MongoDB
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const { BugMetrics, MLConfig } = require('../models/Metrics');

// Configuração
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge_metrics';
const NOTION_API_BASE = 'https://api.notion.com/v1';

// Headers para requisições ao Notion
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

class NotionToMongoSync {
  constructor() {
    this.syncedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Conectado ao MongoDB');
    } catch (error) {
      console.error('❌ Erro ao conectar ao MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
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
    
    return '';
  }

  /**
   * Determina o nível do bug baseado em critérios
   */
  determineBugLevel(bugData) {
    const title = bugData.title.toLowerCase();
    const description = bugData.description.toLowerCase();
    
    // Critérios para determinar nível
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
    
    return 1; // Default
  }

  /**
   * Busca bugs do Notion
   */
  async fetchBugsFromNotion(databaseId, filter = {}) {
    try {
      console.log(`🔍 Buscando bugs no Notion (Database: ${databaseId})...`);
      
      const response = await axios.post(
        `${NOTION_API_BASE}/databases/${databaseId}/query`,
        {
          filter: filter,
          sorts: [
            {
              property: 'Created',
              direction: 'descending'
            }
          ]
        },
        { headers: notionHeaders }
      );

      const bugs = response.data.results.map(page => {
        const properties = page.properties;
        
        return {
          notionBugId: page.id,
          notionUrl: page.url,
          title: this.extractTextFromProperty(properties.Title || properties.Name),
          description: this.extractTextFromProperty(properties.Description || properties.Details),
          status: this.extractTextFromProperty(properties.Status || properties.State),
          priority: this.extractTextFromProperty(properties.Priority || properties.Urgency),
          assignee: this.extractTextFromProperty(properties.Assignee || properties.Assigned),
          tags: this.extractTextFromProperty(properties.Tags || properties.Labels),
          createdAt: this.extractTextFromProperty(properties.Created || properties['Created time']),
          updatedAt: this.extractTextFromProperty(properties.Updated || properties['Last edited time']),
          bugLevel: this.determineBugLevel({
            title: this.extractTextFromProperty(properties.Title || properties.Name),
            description: this.extractTextFromProperty(properties.Description || properties.Details)
          })
        };
      });

      console.log(`📊 Encontrados ${bugs.length} bugs no Notion`);
      return bugs;
    } catch (error) {
      console.error('❌ Erro ao buscar bugs do Notion:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Sincroniza um bug individual
   */
  async syncBug(bugData) {
    try {
      // Verificar se o bug já existe
      const existingBug = await BugMetrics.findOne({ notionBugId: bugData.notionBugId });
      
      if (existingBug) {
        // Atualizar bug existente se necessário
        const needsUpdate = 
          existingBug.bugTitle !== bugData.title ||
          existingBug.bugDescription !== bugData.description ||
          existingBug.bugLevel !== bugData.bugLevel;
        
        if (needsUpdate) {
          existingBug.bugTitle = bugData.title;
          existingBug.bugDescription = bugData.description;
          existingBug.bugLevel = bugData.bugLevel;
          existingBug.updatedAt = new Date();
          
          await existingBug.save();
          this.updatedCount++;
          console.log(`🔄 Bug atualizado: ${bugData.title}`);
        }
        
        return existingBug;
      } else {
        // Criar novo bug
        const newBug = new BugMetrics({
          notionBugId: bugData.notionBugId,
          bugTitle: bugData.title,
          bugDescription: bugData.description,
          bugLevel: bugData.bugLevel,
          status: this.mapNotionStatusToInternal(bugData.status),
          mlData: {
            features: {
              bugComplexity: bugData.bugLevel,
              technologyStack: this.extractTechnologies(bugData.description),
              estimatedDifficulty: bugData.bugLevel
            },
            predictions: {
              successProbability: this.calculateInitialSuccessProbability(bugData.bugLevel),
              estimatedTime: this.estimateTime(bugData.bugLevel),
              confidence: 0.5
            }
          }
        });

        await newBug.save();
        this.syncedCount++;
        console.log(`✅ Bug sincronizado: ${bugData.title} (Nível ${bugData.bugLevel})`);
        
        return newBug;
      }
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Erro ao sincronizar bug ${bugData.title}:`, error.message);
      throw error;
    }
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
   * Extrai tecnologias mencionadas na descrição
   */
  extractTechnologies(description) {
    const technologies = [];
    const techKeywords = [
      'javascript', 'js', 'typescript', 'ts', 'react', 'vue', 'angular',
      'python', 'py', 'django', 'flask', 'fastapi',
      'java', 'spring', 'node', 'express',
      'c#', 'csharp', '.net', 'asp.net',
      'php', 'laravel', 'symfony',
      'ruby', 'rails', 'go', 'golang',
      'rust', 'swift', 'kotlin', 'scala'
    ];
    
    const lowerDesc = description.toLowerCase();
    techKeywords.forEach(tech => {
      if (lowerDesc.includes(tech)) {
        technologies.push(tech);
      }
    });
    
    return technologies;
  }

  /**
   * Calcula probabilidade inicial de sucesso baseada no nível
   */
  calculateInitialSuccessProbability(level) {
    const probabilities = {
      1: 0.9,  // 90% para bugs simples
      2: 0.8,  // 80% para bugs intermediários
      3: 0.6,  // 60% para bugs complexos
      4: 0.4,  // 40% para bugs muito complexos
      5: 0.2   // 20% para bugs extremamente complexos
    };
    
    return probabilities[level] || 0.5;
  }

  /**
   * Estima tempo de resolução baseado no nível
   */
  estimateTime(level) {
    const timeEstimates = {
      1: 15,   // 15 minutos
      2: 60,   // 1 hora
      3: 240,  // 4 horas
      4: 480,  // 8 horas
      5: 960   // 16 horas
    };
    
    return timeEstimates[level] || 60;
  }

  /**
   * Sincroniza todos os bugs
   */
  async syncAllBugs(databaseId, filter = {}) {
    try {
      console.log('\n🚀 Iniciando sincronização Notion → MongoDB\n');
      
      const bugs = await this.fetchBugsFromNotion(databaseId, filter);
      
      console.log(`\n📥 Processando ${bugs.length} bugs...\n`);
      
      for (const bug of bugs) {
        await this.syncBug(bug);
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RELATÓRIO DE SINCRONIZAÇÃO');
      console.log('='.repeat(60));
      console.log(`✅ Bugs sincronizados: ${this.syncedCount}`);
      console.log(`🔄 Bugs atualizados: ${this.updatedCount}`);
      console.log(`❌ Erros: ${this.errorCount}`);
      console.log(`📈 Total processado: ${this.syncedCount + this.updatedCount}`);
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
      throw error;
    }
  }

  /**
   * Atualiza configuração de ML baseada nos dados
   */
  async updateMLConfig() {
    try {
      console.log('🤖 Atualizando configuração de ML...');
      
      const bugs = await BugMetrics.find({});
      const config = await MLConfig.findOne({ isActive: true });
      
      if (!config) {
        console.log('⚠️  Configuração de ML não encontrada');
        return;
      }
      
      // Atualizar taxas de sucesso dos templates
      for (let level = 1; level <= 5; level++) {
        const levelBugs = bugs.filter(b => b.bugLevel === level);
        const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
        const successRate = levelBugs.length > 0 ? successfulBugs.length / levelBugs.length : 0;
        
        const template = config.promptTemplates.find(t => t.level === level);
        if (template) {
          template.successRate = successRate;
          template.usageCount = levelBugs.length;
        }
      }
      
      config.lastUpdated = new Date();
      await config.save();
      
      console.log('✅ Configuração de ML atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração de ML:', error);
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const databaseId = args[0];
  
  if (!databaseId) {
    console.error('❌ Uso: node notion-to-mongodb.js <DATABASE_ID> [filter]');
    console.error('   Exemplo: node notion-to-mongodb.js abc123def456');
    process.exit(1);
  }
  
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN não configurado no .env');
    process.exit(1);
  }
  
  const sync = new NotionToMongoSync();
  
  try {
    await sync.connect();
    await sync.syncAllBugs(databaseId);
    await sync.updateMLConfig();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await sync.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NotionToMongoSync;
