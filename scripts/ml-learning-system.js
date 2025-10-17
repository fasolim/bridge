#!/usr/bin/env node

/**
 * Sistema de Aprendizado de Máquina para Otimização de Prompts
 * Implementa o sistema de "mini aprendizagem de máquina" descrito:
 * - Se bug é reprovado, sobe de nível
 * - Nova tentativa com prompt diferente
 * - Aprende com sucessos e falhas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const BugMetrics = require('../src/models/BugMetrics');
const MLConfig = require('../src/models/MLConfig');

class MLLearningSystem {
  constructor() {
    this.learningRate = 0.1;
    this.minSamplesForLearning = 5;
    this.maxLevel = 5;
    this.retryThreshold = 2; // Número de tentativas antes de escalar
  }

  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://bridge_user:bridge_password@localhost:27017/bridge_metrics';
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
   * Processa feedback de uma tentativa de resolução
   */
  async processAttemptFeedback(bugId, attemptData) {
    console.log(`🔄 Processando feedback para bug ${bugId}...`);
    
    const bug = await BugMetrics.findById(bugId);
    if (!bug) {
      throw new Error('Bug não encontrado');
    }

    const {
      success,
      tokensUsed,
      cost,
      executionTime,
      promptUsed,
      errorMessage,
      userFeedback
    } = attemptData;

    // Adicionar tentativa
    const attempt = {
      attemptNumber: bug.totalAttempts + 1,
      promptUsed,
      tokensUsed: tokensUsed || 0,
      cost: cost || 0,
      executionTime: executionTime || 0,
      success: success || false,
      errorMessage: errorMessage || null,
      timestamp: new Date()
    };

    await bug.addAttempt(attempt);

    // Se não foi bem-sucedido e atingiu threshold de retry, escalar
    if (!success && bug.totalAttempts >= this.retryThreshold) {
      await this.escalateBug(bug);
    }

    // Se foi bem-sucedido, aprender com o sucesso
    if (success) {
      await this.learnFromSuccess(bug, attempt);
    } else {
      await this.learnFromFailure(bug, attempt);
    }

    // Atualizar configuração de ML
    await this.updateMLConfig();

    console.log(`✅ Feedback processado para bug ${bugId}`);
    return bug;
  }

  /**
   * Escala bug para próximo nível
   */
  async escalateBug(bug) {
    if (bug.bugLevel < this.maxLevel) {
      const oldLevel = bug.bugLevel;
      bug.bugLevel = Math.min(bug.bugLevel + 1, this.maxLevel);
      bug.status = 'escalated';
      
      await bug.save();
      
      console.log(`📈 Bug ${bug.bugTitle} escalado do nível ${oldLevel} para ${bug.bugLevel}`);
      
      // Obter novo prompt otimizado para o nível escalado
      const newPrompt = await this.getOptimizedPrompt(bug.bugLevel);
      
      return {
        escalated: true,
        newLevel: bug.bugLevel,
        newPrompt: newPrompt,
        reason: `Escalado após ${bug.totalAttempts} tentativas sem sucesso`
      };
    }
    
    return {
      escalated: false,
      reason: 'Bug já está no nível máximo (5)'
    };
  }

  /**
   * Aprende com sucesso
   */
  async learnFromSuccess(bug, attempt) {
    console.log(`🎉 Aprendendo com sucesso do bug nível ${bug.bugLevel}...`);
    
    const config = await MLConfig.findOne({ isActive: true });
    if (!config) return;

    const template = config.promptTemplates.find(t => t.level === bug.bugLevel);
    if (!template) return;

    // Aumentar taxa de sucesso do template usado
    const successIncrement = this.learningRate * (1 - template.successRate);
    template.successRate = Math.min(1.0, template.successRate + successIncrement);
    template.usageCount = (template.usageCount || 0) + 1;

    // Atualizar métricas de performance
    if (!template.avgExecutionTime) template.avgExecutionTime = 0;
    if (!template.avgTokens) template.avgTokens = 0;
    if (!template.avgCost) template.avgCost = 0;

    template.avgExecutionTime = (template.avgExecutionTime + attempt.executionTime) / 2;
    template.avgTokens = (template.avgTokens + attempt.tokensUsed) / 2;
    template.avgCost = (template.avgCost + attempt.cost) / 2;

    config.lastUpdated = new Date();
    await config.save();

    console.log(`✅ Template nível ${bug.bugLevel} otimizado (Taxa de sucesso: ${(template.successRate * 100).toFixed(1)}%)`);
  }

  /**
   * Aprende com falha
   */
  async learnFromFailure(bug, attempt) {
    console.log(`📉 Aprendendo com falha do bug nível ${bug.bugLevel}...`);
    
    const config = await MLConfig.findOne({ isActive: true });
    if (!config) return;

    const template = config.promptTemplates.find(t => t.level === bug.bugLevel);
    if (!template) return;

    // Diminuir taxa de sucesso do template usado
    const failureDecrement = this.learningRate * template.successRate;
    template.successRate = Math.max(0.1, template.successRate - failureDecrement);
    template.usageCount = (template.usageCount || 0) + 1;

    // Registrar padrões de falha
    if (!template.failurePatterns) template.failurePatterns = [];
    template.failurePatterns.push({
      errorType: this.categorizeError(attempt.errorMessage),
      timestamp: new Date(),
      tokensUsed: attempt.tokensUsed,
      executionTime: attempt.executionTime
    });

    // Manter apenas os últimos 20 padrões de falha
    if (template.failurePatterns.length > 20) {
      template.failurePatterns = template.failurePatterns.slice(-20);
    }

    config.lastUpdated = new Date();
    await config.save();

    console.log(`⚠️  Template nível ${bug.bugLevel} ajustado (Taxa de sucesso: ${(template.successRate * 100).toFixed(1)}%)`);
  }

  /**
   * Categoriza tipo de erro
   */
  categorizeError(errorMessage) {
    if (!errorMessage) return 'unknown';
    
    const error = errorMessage.toLowerCase();
    
    if (error.includes('syntax') || error.includes('parse')) return 'syntax';
    if (error.includes('type') || error.includes('undefined')) return 'type';
    if (error.includes('import') || error.includes('module')) return 'import';
    if (error.includes('permission') || error.includes('access')) return 'permission';
    if (error.includes('timeout') || error.includes('connection')) return 'network';
    if (error.includes('memory') || error.includes('stack')) return 'resource';
    
    return 'logic';
  }

  /**
   * Obtém prompt otimizado para um nível
   */
  async getOptimizedPrompt(level) {
    const config = await MLConfig.findOne({ isActive: true });
    if (!config) {
      return this.getDefaultPrompt(level);
    }

    const template = config.promptTemplates.find(t => t.level === level);
    if (!template) {
      return this.getDefaultPrompt(level);
    }

    // Se a taxa de sucesso é baixa, tentar variação do prompt
    if (template.successRate < 0.3 && template.usageCount > 5) {
      return this.generatePromptVariation(template.template, level);
    }

    return template.template;
  }

  /**
   * Gera variação de prompt baseada em falhas
   */
  generatePromptVariation(baseTemplate, level) {
    const variations = {
      1: [
        'Corrija este bug simples: {bugDescription}. Seja direto e objetivo.',
        'Resolva rapidamente: {bugDescription}. Foque na solução mais simples.',
        'Bug básico detectado: {bugDescription}. Implemente correção imediata.'
      ],
      2: [
        'Bug intermediário: {bugDescription}. Analise o contexto e implemente solução robusta.',
        'Problema de nível médio: {bugDescription}. Considere edge cases e validações.',
        'Correção necessária: {bugDescription}. Teste a solução antes de finalizar.'
      ],
      3: [
        'Bug complexo: {bugDescription}. Análise detalhada requerida. Identifique dependências.',
        'Problema arquitetural: {bugDescription}. Considere impacto em todo o sistema.',
        'Correção avançada: {bugDescription}. Implemente com testes e documentação.'
      ],
      4: [
        'Bug crítico: {bugDescription}. Análise profunda necessária. Considere refatoração.',
        'Problema de alto impacto: {bugDescription}. Avalie alternativas e escolha a melhor.',
        'Correção urgente: {bugDescription}. Implemente com máxima qualidade e testes.'
      ],
      5: [
        'Bug extremamente complexo: {bugDescription}. Requer análise sistemática e refatoração.',
        'Problema crítico: {bugDescription}. Abordagem metódica e testes extensivos necessários.',
        'Correção de emergência: {bugDescription}. Implemente com máxima precisão e robustez.'
      ]
    };

    const levelVariations = variations[level] || variations[1];
    const randomIndex = Math.floor(Math.random() * levelVariations.length);
    
    return levelVariations[randomIndex];
  }

  /**
   * Prompt padrão para um nível
   */
  getDefaultPrompt(level) {
    const prompts = {
      1: 'Analise e corrija o seguinte bug: {bugDescription}. Forneça uma solução simples e direta.',
      2: 'Este é um bug de nível intermediário. Analise cuidadosamente: {bugDescription}. Considere múltiplas abordagens e escolha a melhor.',
      3: 'Bug complexo detectado: {bugDescription}. Realize análise detalhada, identifique dependências e forneça solução robusta.',
      4: 'Bug crítico de alto nível: {bugDescription}. Análise arquitetural necessária. Considere impacto em todo o sistema.',
      5: 'Bug extremamente complexo: {bugDescription}. Requer análise profunda, refatoração e testes extensivos. Abordagem sistemática necessária.'
    };
    
    return prompts[level] || prompts[1];
  }

  /**
   * Atualiza configuração de ML baseada em todos os dados
   */
  async updateMLConfig() {
    console.log('🤖 Atualizando configuração de ML...');
    
    const bugs = await BugMetrics.find({});
    const config = await MLConfig.findOne({ isActive: true });
    
    if (!config) {
      console.log('⚠️  Configuração de ML não encontrada');
      return;
    }

    // Recalcular taxas de sucesso baseadas em todos os dados
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      
      const template = config.promptTemplates.find(t => t.level === level);
      if (!template) continue;

      if (levelBugs.length >= this.minSamplesForLearning) {
        const actualSuccessRate = successfulBugs.length / levelBugs.length;
        
        // Aplicar learning rate para suavizar mudanças
        template.successRate = template.successRate + 
          this.learningRate * (actualSuccessRate - template.successRate);
        
        template.usageCount = levelBugs.length;
        
        console.log(`📊 Nível ${level}: ${levelBugs.length} bugs, ${(template.successRate * 100).toFixed(1)}% sucesso`);
      }
    }

    config.lastUpdated = new Date();
    await config.save();
    
    console.log('✅ Configuração de ML atualizada');
  }

  /**
   * Analisa padrões de sucesso e falha
   */
  async analyzePatterns() {
    console.log('🔍 Analisando padrões de sucesso e falha...');
    
    const bugs = await BugMetrics.find({});
    const patterns = {
      byLevel: {},
      byErrorType: {},
      byExecutionTime: {},
      recommendations: []
    };

    // Análise por nível
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      
      patterns.byLevel[level] = {
        total: levelBugs.length,
        successful: successfulBugs.length,
        successRate: levelBugs.length > 0 ? successfulBugs.length / levelBugs.length : 0,
        avgAttempts: levelBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / levelBugs.length || 0,
        avgExecutionTime: levelBugs.reduce((sum, b) => sum + b.totalExecutionTime, 0) / levelBugs.length || 0,
        avgTokens: levelBugs.reduce((sum, b) => sum + b.totalTokens, 0) / levelBugs.length || 0
      };
    }

    // Análise por tipo de erro
    const allAttempts = bugs.flatMap(b => b.attempts);
    const failedAttempts = allAttempts.filter(a => !a.success);
    
    failedAttempts.forEach(attempt => {
      const errorType = this.categorizeError(attempt.errorMessage);
      if (!patterns.byErrorType[errorType]) {
        patterns.byErrorType[errorType] = 0;
      }
      patterns.byErrorType[errorType]++;
    });

    // Gerar recomendações
    patterns.recommendations = this.generateRecommendations(patterns);

    return patterns;
  }

  /**
   * Gera recomendações baseadas nos padrões
   */
  generateRecommendations(patterns) {
    const recommendations = [];

    // Recomendações por nível
    Object.entries(patterns.byLevel).forEach(([level, data]) => {
      if (data.successRate < 0.5 && data.total > 5) {
        recommendations.push({
          type: 'level_optimization',
          level: parseInt(level),
          message: `Nível ${level} tem baixa taxa de sucesso (${(data.successRate * 100).toFixed(1)}%). Considere ajustar prompts.`,
          priority: 'high'
        });
      }
    });

    // Recomendações por tipo de erro
    Object.entries(patterns.byErrorType).forEach(([errorType, count]) => {
      if (count > 10) {
        recommendations.push({
          type: 'error_pattern',
          errorType,
          message: `Erro tipo '${errorType}' ocorre frequentemente (${count} vezes). Desenvolva estratégia específica.`,
          priority: 'medium'
        });
      }
    });

    return recommendations;
  }

  /**
   * Executa ciclo completo de aprendizado
   */
  async runLearningCycle() {
    try {
      console.log('🚀 Iniciando ciclo de aprendizado...\n');
      
      await this.updateMLConfig();
      const patterns = await this.analyzePatterns();
      
      console.log('\n📊 PADRÕES IDENTIFICADOS:');
      console.log('='.repeat(50));
      
      Object.entries(patterns.byLevel).forEach(([level, data]) => {
        console.log(`Nível ${level}: ${data.total} bugs, ${(data.successRate * 100).toFixed(1)}% sucesso`);
      });
      
      console.log('\n🔍 TIPOS DE ERRO MAIS COMUNS:');
      Object.entries(patterns.byErrorType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([errorType, count]) => {
          console.log(`${errorType}: ${count} ocorrências`);
        });
      
      console.log('\n💡 RECOMENDAÇÕES:');
      patterns.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
      
      console.log('\n✅ Ciclo de aprendizado concluído!');
      
      return patterns;
    } catch (error) {
      console.error('❌ Erro durante ciclo de aprendizado:', error);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const mlSystem = new MLLearningSystem();
  
  try {
    await mlSystem.connect();
    await mlSystem.runLearningCycle();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await mlSystem.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MLLearningSystem;
