#!/usr/bin/env node

/**
 * Sistema de Métricas Simplificado (sem MongoDB)
 * Usa arquivos JSON para armazenar métricas temporariamente
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_API_BASE = 'https://api.notion.com/v1';
const METRICS_DIR = path.join(__dirname, '..', 'metrics-data');

// Headers para requisições ao Notion
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

class SimpleMetrics {
  constructor() {
    this.ensureMetricsDir();
  }

  ensureMetricsDir() {
    if (!fs.existsSync(METRICS_DIR)) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
    }
  }

  getMetricsFile() {
    return path.join(METRICS_DIR, 'metrics.json');
  }

  loadMetrics() {
    const file = this.getMetricsFile();
    if (fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        return { bugs: [], reports: [], mlConfig: this.getDefaultMLConfig() };
      }
    }
    return { bugs: [], reports: [], mlConfig: this.getDefaultMLConfig() };
  }

  saveMetrics(metrics) {
    const file = this.getMetricsFile();
    fs.writeFileSync(file, JSON.stringify(metrics, null, 2));
  }

  getDefaultMLConfig() {
    return {
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
        },
        {
          condition: 'attempts > 5',
          action: 'human_review',
          parameters: { notify: true }
        }
      ],
      learningRate: 0.1,
      lastUpdated: new Date().toISOString()
    };
  }

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

  async fetchBugsFromNotion(databaseId) {
    try {
      console.log(`🔍 Buscando bugs no Notion (Database: ${databaseId})...`);
      
      const response = await axios.post(
        `${NOTION_API_BASE}/databases/${databaseId}/query`,
        {
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

  async syncBugs(databaseId) {
    console.log('\n🚀 INICIANDO SINCRONIZAÇÃO SIMPLIFICADA\n');
    
    try {
      const notionBugs = await this.fetchBugsFromNotion(databaseId);
      const metrics = this.loadMetrics();
      
      let syncedCount = 0;
      let updatedCount = 0;
      
      for (const notionBug of notionBugs) {
        const existingBug = metrics.bugs.find(b => b.notionBugId === notionBug.notionBugId);
        
        if (existingBug) {
          // Atualizar bug existente
          existingBug.title = notionBug.title;
          existingBug.description = notionBug.description;
          existingBug.bugLevel = notionBug.bugLevel;
          existingBug.updatedAt = new Date().toISOString();
          updatedCount++;
          console.log(`🔄 Bug atualizado: ${notionBug.title}`);
        } else {
          // Criar novo bug
          const newBug = {
            id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            notionBugId: notionBug.notionBugId,
            notionUrl: notionBug.notionUrl,
            title: notionBug.title,
            description: notionBug.description,
            bugLevel: notionBug.bugLevel,
            status: this.mapNotionStatusToInternal(notionBug.status),
            attempts: [],
            totalAttempts: 0,
            totalTokens: 0,
            totalCost: 0,
            totalExecutionTime: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null
          };
          
          metrics.bugs.push(newBug);
          syncedCount++;
          console.log(`✅ Bug sincronizado: ${notionBug.title} (Nível ${notionBug.bugLevel})`);
        }
      }
      
      this.saveMetrics(metrics);
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RELATÓRIO DE SINCRONIZAÇÃO');
      console.log('='.repeat(60));
      console.log(`✅ Bugs sincronizados: ${syncedCount}`);
      console.log(`🔄 Bugs atualizados: ${updatedCount}`);
      console.log(`📈 Total de bugs: ${metrics.bugs.length}`);
      console.log('='.repeat(60) + '\n');
      
      return { syncedCount, updatedCount, totalBugs: metrics.bugs.length };
      
    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
      throw error;
    }
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

  addAttempt(bugId, attemptData) {
    const metrics = this.loadMetrics();
    const bug = metrics.bugs.find(b => b.id === bugId || b.notionBugId === bugId);
    
    if (!bug) {
      throw new Error('Bug não encontrado');
    }
    
    const attempt = {
      attemptNumber: bug.totalAttempts + 1,
      promptUsed: attemptData.promptUsed,
      tokensUsed: attemptData.tokensUsed || 0,
      cost: attemptData.cost || 0,
      executionTime: attemptData.executionTime || 0,
      success: attemptData.success || false,
      errorMessage: attemptData.errorMessage || null,
      timestamp: new Date().toISOString()
    };
    
    bug.attempts.push(attempt);
    bug.totalAttempts += 1;
    bug.totalTokens += attempt.tokensUsed;
    bug.totalCost += attempt.cost;
    bug.totalExecutionTime += attempt.executionTime;
    
    if (attempt.success) {
      bug.status = 'resolved';
      bug.resolvedAt = new Date().toISOString();
    } else if (bug.totalAttempts > 2) {
      bug.bugLevel = Math.min(bug.bugLevel + 1, 5);
      bug.status = 'escalated';
    }
    
    bug.updatedAt = new Date().toISOString();
    
    this.saveMetrics(metrics);
    
    return bug;
  }

  generateReport() {
    const metrics = this.loadMetrics();
    const bugs = metrics.bugs;
    
    const report = {
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalBugs: bugs.length,
        resolvedBugs: bugs.filter(b => b.status === 'resolved').length,
        pendingBugs: bugs.filter(b => b.status === 'pending').length,
        inProgressBugs: bugs.filter(b => b.status === 'in_progress').length,
        escalatedBugs: bugs.filter(b => b.status === 'escalated').length,
        rejectedBugs: bugs.filter(b => b.status === 'rejected').length
      },
      bugsByLevel: {},
      performanceMetrics: {
        totalTokens: bugs.reduce((sum, b) => sum + b.totalTokens, 0),
        totalCost: bugs.reduce((sum, b) => sum + b.totalCost, 0),
        totalExecutionTime: bugs.reduce((sum, b) => sum + b.totalExecutionTime, 0),
        averageAttempts: bugs.length > 0 ? bugs.reduce((sum, b) => sum + b.totalAttempts, 0) / bugs.length : 0
      }
    };
    
    // Breakdown por nível
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const resolvedBugs = levelBugs.filter(b => b.status === 'resolved');
      
      report.bugsByLevel[level] = {
        total: levelBugs.length,
        resolved: resolvedBugs.length,
        successRate: levelBugs.length > 0 ? resolvedBugs.length / levelBugs.length : 0,
        averageAttempts: levelBugs.length > 0 ? levelBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / levelBugs.length : 0
      };
    }
    
    return report;
  }

  getPromptForLevel(level) {
    const metrics = this.loadMetrics();
    const template = metrics.mlConfig.promptTemplates.find(t => t.level === level);
    return template ? template.template : `Analise e corrija o bug: {bugDescription}`;
  }

  updateMLConfig() {
    const metrics = this.loadMetrics();
    const bugs = metrics.bugs;
    
    // Atualizar taxas de sucesso dos templates
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      const successRate = levelBugs.length > 0 ? successfulBugs.length / levelBugs.length : 0;
      
      const template = metrics.mlConfig.promptTemplates.find(t => t.level === level);
      if (template) {
        template.successRate = successRate;
        template.usageCount = levelBugs.length;
      }
    }
    
    metrics.mlConfig.lastUpdated = new Date().toISOString();
    this.saveMetrics(metrics);
    
    console.log('🤖 Configuração de ML atualizada');
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const databaseId = args[1];
  
  if (!command || !databaseId) {
    console.log('❌ Uso: node simple-metrics.js <command> <database_id>');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  sync        - Sincronizar bugs do Notion');
    console.log('  report      - Gerar relatório de métricas');
    console.log('  ml          - Atualizar configuração de ML');
    console.log('');
    console.log('Exemplos:');
    console.log('  node simple-metrics.js sync abc123def456');
    console.log('  node simple-metrics.js report abc123def456');
    process.exit(1);
  }
  
  const metrics = new SimpleMetrics();
  
  try {
    switch (command) {
      case 'sync':
        await metrics.syncBugs(databaseId);
        break;
        
      case 'report':
        const report = metrics.generateReport();
        console.log('\n📊 RELATÓRIO DE MÉTRICAS\n');
        console.log(JSON.stringify(report, null, 2));
        break;
        
      case 'ml':
        metrics.updateMLConfig();
        break;
        
      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        process.exit(1);
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

module.exports = SimpleMetrics;
