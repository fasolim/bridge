#!/usr/bin/env node

/**
 * Script de Sincronização Automatizada
 * Integra Notion → MongoDB → ML Learning
 */

require('dotenv').config();
const NotionToMongoSync = require('./notion-to-mongodb');
const MLLearningEngine = require('./ml-learning');
const { BugMetrics, MLConfig } = require('../models/Metrics');

class AutomatedSync {
  constructor() {
    this.sync = new NotionToMongoSync();
    this.ml = new MLLearningEngine();
    this.isRunning = false;
  }

  async connect() {
    await this.sync.connect();
    await this.ml.connect();
  }

  async disconnect() {
    await this.sync.disconnect();
    await this.ml.disconnect();
  }

  /**
   * Executa sincronização completa
   */
  async runFullSync(databaseId, options = {}) {
    if (this.isRunning) {
      console.log('⚠️  Sincronização já em andamento...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n🚀 INICIANDO SINCRONIZAÇÃO AUTOMATIZADA\n');
      console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

      // 1. Sincronizar dados do Notion
      console.log('📥 FASE 1: Sincronizando dados do Notion...');
      await this.sync.syncAllBugs(databaseId, options.filter || {});
      
      // 2. Executar aprendizado de máquina
      console.log('\n🤖 FASE 2: Executando aprendizado de máquina...');
      const mlResults = await this.ml.runLearningCycle();
      
      // 3. Gerar relatório de métricas
      console.log('\n📊 FASE 3: Gerando relatório de métricas...');
      const metrics = await this.generateMetricsReport();
      
      // 4. Aplicar otimizações
      console.log('\n⚡ FASE 4: Aplicando otimizações...');
      await this.applyOptimizations(mlResults);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('\n' + '='.repeat(70));
      console.log('🎉 SINCRONIZAÇÃO AUTOMATIZADA CONCLUÍDA');
      console.log('='.repeat(70));
      console.log(`⏱️  Duração: ${duration.toFixed(1)} segundos`);
      console.log(`📊 Bugs sincronizados: ${this.sync.syncedCount}`);
      console.log(`🔄 Bugs atualizados: ${this.sync.updatedCount}`);
      console.log(`❌ Erros: ${this.sync.errorCount}`);
      console.log('='.repeat(70) + '\n');
      
      return {
        success: true,
        duration,
        syncStats: {
          synced: this.sync.syncedCount,
          updated: this.sync.updatedCount,
          errors: this.sync.errorCount
        },
        mlResults,
        metrics
      };
      
    } catch (error) {
      console.error('❌ Erro durante sincronização automatizada:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Gera relatório de métricas atual
   */
  async generateMetricsReport() {
    const bugs = await BugMetrics.find({});
    const config = await MLConfig.findOne({ isActive: true });
    
    const report = {
      totalBugs: bugs.length,
      bugsByStatus: {},
      bugsByLevel: {},
      performanceMetrics: {},
      mlMetrics: {}
    };
    
    // Bugs por status
    ['pending', 'in_progress', 'resolved', 'rejected', 'escalated'].forEach(status => {
      report.bugsByStatus[status] = bugs.filter(b => b.status === status).length;
    });
    
    // Bugs por nível
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      report.bugsByLevel[level] = {
        total: levelBugs.length,
        resolved: levelBugs.filter(b => b.status === 'resolved').length,
        successRate: levelBugs.length > 0 ? 
          levelBugs.filter(b => b.status === 'resolved').length / levelBugs.length : 0
      };
    }
    
    // Métricas de performance
    const resolvedBugs = bugs.filter(b => b.status === 'resolved');
    if (resolvedBugs.length > 0) {
      report.performanceMetrics = {
        avgAttempts: resolvedBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / resolvedBugs.length,
        avgExecutionTime: resolvedBugs.reduce((sum, b) => sum + b.totalExecutionTime, 0) / resolvedBugs.length,
        avgTokens: resolvedBugs.reduce((sum, b) => sum + b.totalTokens, 0) / resolvedBugs.length,
        avgCost: resolvedBugs.reduce((sum, b) => sum + b.totalCost, 0) / resolvedBugs.length,
        totalCost: bugs.reduce((sum, b) => sum + b.totalCost, 0),
        totalTokens: bugs.reduce((sum, b) => sum + b.totalTokens, 0)
      };
    }
    
    // Métricas de ML
    if (config) {
      report.mlMetrics = {
        promptTemplates: config.promptTemplates.map(t => ({
          level: t.level,
          successRate: t.successRate,
          usageCount: t.usageCount
        })),
        escalationRules: config.escalationRules.length,
        lastUpdated: config.lastUpdated
      };
    }
    
    console.log('📈 Relatório de métricas gerado:');
    console.log(`   Total de bugs: ${report.totalBugs}`);
    console.log(`   Bugs resolvidos: ${report.bugsByStatus.resolved}`);
    console.log(`   Taxa de sucesso geral: ${((report.bugsByStatus.resolved / report.totalBugs) * 100).toFixed(1)}%`);
    console.log(`   Custo total: $${report.performanceMetrics.totalCost?.toFixed(4) || 0}`);
    
    return report;
  }

  /**
   * Aplica otimizações baseadas no aprendizado
   */
  async applyOptimizations(mlResults) {
    console.log('⚡ Aplicando otimizações...');
    
    const config = await MLConfig.findOne({ isActive: true });
    if (!config) {
      console.log('⚠️  Configuração de ML não encontrada');
      return;
    }
    
    // Otimizar regras de escalação baseadas nos resultados
    const { escalation } = mlResults;
    if (escalation && escalation.escalationStats) {
      const newRules = [...config.escalationRules];
      
      // Adicionar regras baseadas em dados reais
      Object.entries(escalation.escalationStats).forEach(([level, stats]) => {
        if (stats.successRate > 0.7 && stats.total > 5) {
          const ruleExists = newRules.some(rule => 
            rule.condition.includes(`level_${level}`)
          );
          
          if (!ruleExists) {
            newRules.push({
              condition: `level_${level}_high_success`,
              action: 'auto_escalate',
              parameters: { 
                level: parseInt(level),
                minSuccessRate: 0.7,
                minSamples: 5
              }
            });
          }
        }
      });
      
      config.escalationRules = newRules;
      await config.save();
      
      console.log(`✅ ${newRules.length} regras de escalação ativas`);
    }
    
    // Otimizar learning rate baseado na estabilidade dos dados
    const { patterns } = mlResults;
    if (patterns) {
      const totalBugs = Object.values(patterns).reduce((sum, p) => sum + p.totalBugs, 0);
      
      if (totalBugs > 100) {
        // Dados estáveis, reduzir learning rate
        config.learningRate = Math.max(0.05, config.learningRate * 0.9);
        console.log(`📉 Learning rate reduzido para ${config.learningRate.toFixed(3)} (dados estáveis)`);
      } else if (totalBugs < 50) {
        // Poucos dados, aumentar learning rate
        config.learningRate = Math.min(0.2, config.learningRate * 1.1);
        console.log(`📈 Learning rate aumentado para ${config.learningRate.toFixed(3)} (poucos dados)`);
      }
      
      await config.save();
    }
    
    console.log('✅ Otimizações aplicadas');
  }

  /**
   * Monitora mudanças em tempo real (para uso futuro)
   */
  async startMonitoring(databaseId, intervalMinutes = 30) {
    console.log(`🔄 Iniciando monitoramento (intervalo: ${intervalMinutes} min)`);
    
    const interval = setInterval(async () => {
      try {
        console.log(`\n⏰ Executando sincronização agendada...`);
        await this.runFullSync(databaseId);
      } catch (error) {
        console.error('❌ Erro na sincronização agendada:', error);
      }
    }, intervalMinutes * 60 * 1000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Parando monitoramento...');
      clearInterval(interval);
      this.disconnect().then(() => process.exit(0));
    });
    
    return interval;
  }

  /**
   * Executa análise de tendências
   */
  async analyzeTrends(days = 30) {
    console.log(`📈 Analisando tendências dos últimos ${days} dias...`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const recentBugs = await BugMetrics.find({
      createdAt: { $gte: startDate }
    });
    
    const trends = {
      period: { start: startDate, end: new Date(), days },
      totalBugs: recentBugs.length,
      resolutionRate: 0,
      avgResolutionTime: 0,
      costTrend: 0,
      levelDistribution: {},
      topTechnologies: []
    };
    
    if (recentBugs.length > 0) {
      const resolvedBugs = recentBugs.filter(b => b.status === 'resolved');
      trends.resolutionRate = resolvedBugs.length / recentBugs.length;
      
      if (resolvedBugs.length > 0) {
        trends.avgResolutionTime = resolvedBugs.reduce((sum, b) => {
          const resolutionTime = b.resolvedAt ? 
            (b.resolvedAt - b.createdAt) / (1000 * 60 * 60) : 0; // em horas
          return sum + resolutionTime;
        }, 0) / resolvedBugs.length;
      }
      
      // Distribuição por nível
      for (let level = 1; level <= 5; level++) {
        trends.levelDistribution[level] = recentBugs.filter(b => b.bugLevel === level).length;
      }
      
      // Tecnologias mais comuns
      const allTechnologies = recentBugs.flatMap(b => 
        b.mlData?.features?.technologyStack || []
      );
      const techCount = {};
      allTechnologies.forEach(tech => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
      
      trends.topTechnologies = Object.entries(techCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tech, count]) => ({ technology: tech, count }));
    }
    
    console.log('📊 Tendências identificadas:');
    console.log(`   Taxa de resolução: ${(trends.resolutionRate * 100).toFixed(1)}%`);
    console.log(`   Tempo médio de resolução: ${trends.avgResolutionTime.toFixed(1)} horas`);
    console.log(`   Tecnologias mais comuns: ${trends.topTechnologies.map(t => t.technology).join(', ')}`);
    
    return trends;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const databaseId = args[1];
  
  if (!command || !databaseId) {
    console.log('❌ Uso: node automated-sync.js <command> <database_id> [options]');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  sync        - Executa sincronização completa');
    console.log('  monitor     - Inicia monitoramento contínuo');
    console.log('  trends      - Analisa tendências');
    console.log('  ml-only     - Executa apenas aprendizado de máquina');
    console.log('');
    console.log('Exemplos:');
    console.log('  node automated-sync.js sync abc123def456');
    console.log('  node automated-sync.js monitor abc123def456 60');
    console.log('  node automated-sync.js trends abc123def456 30');
    process.exit(1);
  }
  
  const sync = new AutomatedSync();
  
  try {
    await sync.connect();
    
    switch (command) {
      case 'sync':
        await sync.runFullSync(databaseId);
        break;
        
      case 'monitor':
        const interval = parseInt(args[2]) || 30;
        await sync.startMonitoring(databaseId, interval);
        break;
        
      case 'trends':
        const days = parseInt(args[2]) || 30;
        await sync.analyzeTrends(days);
        break;
        
      case 'ml-only':
        await sync.ml.runLearningCycle();
        break;
        
      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    if (command !== 'monitor') {
      await sync.disconnect();
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = AutomatedSync;
