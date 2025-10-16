#!/usr/bin/env node

/**
 * Script para integrar dados do Notion com o sistema de métricas
 * Carrega dados consumidos e salva no formato MongoDB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'notion-data');
const METRICS_DIR = path.join(__dirname, '..', 'metrics-data');

class NotionMetricsIntegrator {
  constructor() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(METRICS_DIR)) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
    }
  }

  /**
   * Carrega dados do Notion consumidos
   */
  loadNotionData(databaseId) {
    const dataFile = path.join(DATA_DIR, `latest_mongo_mcp_${databaseId}.json`);
    
    if (!fs.existsSync(dataFile)) {
      throw new Error(`Dados do Notion não encontrados para database ${databaseId}. Execute primeiro o script de consumo.`);
    }
    
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  }

  /**
   * Carrega métricas existentes
   */
  loadExistingMetrics() {
    const metricsFile = path.join(METRICS_DIR, 'metrics.json');
    
    if (fs.existsSync(metricsFile)) {
      return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    }
    
    return {
      bugs: [],
      reports: [],
      mlConfig: this.getDefaultMLConfig()
    };
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

  /**
   * Integra dados do Notion com métricas existentes
   */
  integrateData(databaseId) {
    console.log('\n🔄 INTEGRANDO DADOS DO NOTION COM MÉTRICAS\n');
    console.log(`📊 Database ID: ${databaseId}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

    try {
      // Carregar dados
      console.log('📥 Carregando dados do Notion...');
      const notionData = this.loadNotionData(databaseId);
      console.log(`✅ ${notionData.bugs.length} bugs carregados do Notion`);

      console.log('📊 Carregando métricas existentes...');
      const existingMetrics = this.loadExistingMetrics();
      console.log(`✅ ${existingMetrics.bugs.length} bugs existentes nas métricas`);

      // Integrar bugs
      console.log('\n🔗 Integrando bugs...');
      let integratedCount = 0;
      let updatedCount = 0;

      notionData.bugs.forEach(notionBug => {
        const existingBug = existingMetrics.bugs.find(b => b.notionBugId === notionBug.notionBugId);
        
        if (existingBug) {
          // Atualizar bug existente
          existingBug.title = notionBug.title;
          existingBug.description = notionBug.description;
          existingBug.bugLevel = notionBug.bugLevel;
          existingBug.status = notionBug.status;
          existingBug.priority = notionBug.priority;
          existingBug.assignee = notionBug.assignee;
          existingBug.tags = notionBug.tags;
          existingBug.updatedAt = new Date().toISOString();
          existingBug.rawData = notionBug.rawData;
          existingBug.blocks = notionBug.blocks;
          
          updatedCount++;
          console.log(`🔄 Bug atualizado: ${notionBug.title}`);
        } else {
          // Adicionar novo bug
          const newBug = {
            ...notionBug,
            id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            attempts: [],
            totalAttempts: 0,
            totalTokens: 0,
            totalCost: 0,
            totalExecutionTime: 0,
            createdAt: notionBug.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null
          };
          
          existingMetrics.bugs.push(newBug);
          integratedCount++;
          console.log(`✅ Bug integrado: ${notionBug.title} (Nível ${notionBug.bugLevel})`);
        }
      });

      // Atualizar configuração de ML
      console.log('\n🤖 Atualizando configuração de ML...');
      existingMetrics.mlConfig = notionData.mlConfig;

      // Salvar métricas integradas
      console.log('\n💾 Salvando métricas integradas...');
      this.saveMetrics(existingMetrics);

      // Gerar relatório de integração
      console.log('\n📊 Gerando relatório de integração...');
      this.generateIntegrationReport(existingMetrics, integratedCount, updatedCount);

      console.log('\n' + '='.repeat(70));
      console.log('🎉 INTEGRAÇÃO CONCLUÍDA!');
      console.log('='.repeat(70));
      console.log(`✅ Bugs integrados: ${integratedCount}`);
      console.log(`🔄 Bugs atualizados: ${updatedCount}`);
      console.log(`📈 Total de bugs: ${existingMetrics.bugs.length}`);
      console.log(`📁 Arquivo: ${this.getMetricsFile()}`);
      console.log('='.repeat(70) + '\n');

      return existingMetrics;

    } catch (error) {
      console.error('❌ Erro durante integração:', error);
      throw error;
    }
  }

  /**
   * Salva métricas integradas
   */
  saveMetrics(metrics) {
    const metricsFile = this.getMetricsFile();
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`✅ Métricas salvas em: ${metricsFile}`);
  }

  getMetricsFile() {
    return path.join(METRICS_DIR, 'metrics.json');
  }

  /**
   * Gera relatório de integração
   */
  generateIntegrationReport(metrics, integratedCount, updatedCount) {
    const bugs = metrics.bugs;
    
    const report = {
      integrationId: `integration_${Date.now()}`,
      integratedAt: new Date().toISOString(),
      summary: {
        totalBugs: bugs.length,
        integratedBugs: integratedCount,
        updatedBugs: updatedCount,
        resolvedBugs: bugs.filter(b => b.status === 'resolved').length,
        pendingBugs: bugs.filter(b => b.status === 'pending').length,
        inProgressBugs: bugs.filter(b => b.status === 'in_progress').length,
        escalatedBugs: bugs.filter(b => b.status === 'escalated').length
      },
      bugsByLevel: {},
      bugsByStatus: {},
      bugsByPriority: {},
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

    // Breakdown por status
    ['pending', 'in_progress', 'resolved', 'rejected', 'escalated'].forEach(status => {
      report.bugsByStatus[status] = bugs.filter(b => b.status === status).length;
    });

    // Breakdown por prioridade
    const priorities = [...new Set(bugs.map(b => b.priority))];
    priorities.forEach(priority => {
      report.bugsByPriority[priority] = bugs.filter(b => b.priority === priority).length;
    });

    const reportFile = path.join(METRICS_DIR, `integration_report_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('📊 Relatório de integração:');
    console.log(`   📈 Total de bugs: ${report.summary.totalBugs}`);
    console.log(`   ✅ Bugs resolvidos: ${report.summary.resolvedBugs}`);
    console.log(`   ⏳ Bugs pendentes: ${report.summary.pendingBugs}`);
    console.log(`   🔄 Bugs em andamento: ${report.summary.inProgressBugs}`);
    console.log(`   📈 Bugs escalados: ${report.summary.escalatedBugs}`);
    console.log(`   💰 Custo total: $${report.performanceMetrics.totalCost.toFixed(4)}`);
    console.log(`   🎯 Bugs por nível:`, report.bugsByLevel);
    console.log(`   📊 Bugs por status:`, report.bugsByStatus);
    console.log(`   ⚡ Bugs por prioridade:`, report.bugsByPriority);
  }

  /**
   * Simula tentativas de resolução para bugs
   */
  simulateResolutionAttempts() {
    console.log('\n🎭 Simulando tentativas de resolução...');
    
    const metrics = JSON.parse(fs.readFileSync(this.getMetricsFile(), 'utf8'));
    const bugs = metrics.bugs;
    
    let simulatedCount = 0;
    
    bugs.forEach(bug => {
      if (bug.status === 'pending' || bug.status === 'in_progress') {
        // Simular tentativa
        const attempt = {
          attemptNumber: bug.totalAttempts + 1,
          promptUsed: this.getPromptForLevel(bug.bugLevel),
          tokensUsed: Math.floor(Math.random() * 2000) + 500,
          cost: Math.random() * 0.01,
          executionTime: Math.floor(Math.random() * 200) + 30,
          success: Math.random() > 0.3, // 70% de chance de sucesso
          errorMessage: null,
          timestamp: new Date().toISOString()
        };
        
        if (!attempt.success) {
          attempt.errorMessage = 'Erro simulado para demonstração';
        }
        
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
        simulatedCount++;
        
        console.log(`   🎭 ${attempt.success ? '✅' : '❌'} Bug "${bug.title}" - Tentativa ${attempt.attemptNumber} (${attempt.success ? 'Sucesso' : 'Falha'})`);
      }
    });
    
    // Salvar métricas atualizadas
    this.saveMetrics(metrics);
    
    console.log(`✅ ${simulatedCount} tentativas simuladas`);
  }

  getPromptForLevel(level) {
    const prompts = {
      1: 'Analise e corrija o seguinte bug: {bugDescription}. Forneça uma solução simples e direta.',
      2: 'Este é um bug de nível intermediário. Analise cuidadosamente: {bugDescription}. Considere múltiplas abordagens e escolha a melhor.',
      3: 'Bug complexo detectado: {bugDescription}. Realize análise detalhada, identifique dependências e forneça solução robusta.',
      4: 'Bug crítico de alto nível: {bugDescription}. Análise arquitetural necessária. Considere impacto em todo o sistema.',
      5: 'Bug extremamente complexo: {bugDescription}. Requer análise profunda, refatoração e testes extensivos. Abordagem sistemática necessária.'
    };
    
    return prompts[level] || prompts[1];
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const databaseId = args[1];
  
  if (!command || !databaseId) {
    console.log('❌ Uso: node integrate-notion-to-metrics.js <command> <database_id>');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  integrate    - Integrar dados do Notion com métricas');
    console.log('  simulate     - Simular tentativas de resolução');
    console.log('  full         - Integração completa + simulação');
    console.log('');
    console.log('Exemplos:');
    console.log('  node integrate-notion-to-metrics.js integrate 28ecd984590f806eaa85ceb72a6e816c');
    console.log('  node integrate-notion-to-metrics.js simulate 28ecd984590f806eaa85ceb72a6e816c');
    console.log('  node integrate-notion-to-metrics.js full 28ecd984590f806eaa85ceb72a6e816c');
    process.exit(1);
  }
  
  const integrator = new NotionMetricsIntegrator();
  
  try {
    switch (command) {
      case 'integrate':
        await integrator.integrateData(databaseId);
        break;
        
      case 'simulate':
        integrator.simulateResolutionAttempts();
        break;
        
      case 'full':
        await integrator.integrateData(databaseId);
        integrator.simulateResolutionAttempts();
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

module.exports = NotionMetricsIntegrator;
