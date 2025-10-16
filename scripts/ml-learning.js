#!/usr/bin/env node

/**
 * Script de Aprendizado de Máquina para o Bridge
 * Analisa padrões nos bugs e otimiza prompts automaticamente
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { BugMetrics, MLConfig } = require('../models/Metrics');

class MLLearningEngine {
  constructor() {
    this.learningRate = 0.1;
    this.minSamplesForLearning = 10;
  }

  async connect() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge_metrics';
    
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Conectado ao MongoDB para ML');
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
   * Analisa padrões de sucesso por nível de bug
   */
  async analyzeSuccessPatterns() {
    console.log('🔍 Analisando padrões de sucesso...');
    
    const bugs = await BugMetrics.find({});
    const patterns = {};
    
    // Agrupar por nível
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      
      if (levelBugs.length < this.minSamplesForLearning) {
        console.log(`⚠️  Nível ${level}: Poucos dados (${levelBugs.length} bugs)`);
        continue;
      }
      
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      const successRate = successfulBugs.length / levelBugs.length;
      
      // Analisar tentativas bem-sucedidas
      const successfulAttempts = successfulBugs.flatMap(b => b.attempts.filter(a => a.success));
      const avgAttempts = successfulBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / successfulBugs.length;
      const avgExecutionTime = successfulBugs.reduce((sum, b) => sum + b.totalExecutionTime, 0) / successfulBugs.length;
      
      patterns[level] = {
        totalBugs: levelBugs.length,
        successRate,
        avgAttempts,
        avgExecutionTime,
        avgTokens: successfulBugs.reduce((sum, b) => sum + b.totalTokens, 0) / successfulBugs.length,
        avgCost: successfulBugs.reduce((sum, b) => sum + b.totalCost, 0) / successfulBugs.length
      };
      
      console.log(`📊 Nível ${level}: ${(successRate * 100).toFixed(1)}% sucesso, ${avgAttempts.toFixed(1)} tentativas médias`);
    }
    
    return patterns;
  }

  /**
   * Identifica características de bugs bem-sucedidos
   */
  async identifySuccessCharacteristics() {
    console.log('🎯 Identificando características de sucesso...');
    
    const successfulBugs = await BugMetrics.find({ status: 'resolved' });
    const failedBugs = await BugMetrics.find({ 
      status: { $in: ['rejected', 'escalated'] },
      totalAttempts: { $gte: 3 } // Pelo menos 3 tentativas
    });
    
    const characteristics = {
      successful: this.extractCharacteristics(successfulBugs),
      failed: this.extractCharacteristics(failedBugs)
    };
    
    // Calcular diferenças
    const differences = {};
    Object.keys(characteristics.successful).forEach(key => {
      const successAvg = characteristics.successful[key];
      const failedAvg = characteristics.failed[key] || 0;
      differences[key] = successAvg - failedAvg;
    });
    
    console.log('📈 Características que levam ao sucesso:');
    Object.entries(differences)
      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 5)
      .forEach(([key, diff]) => {
        console.log(`   ${key}: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}`);
      });
    
    return { characteristics, differences };
  }

  /**
   * Extrai características dos bugs
   */
  extractCharacteristics(bugs) {
    if (bugs.length === 0) return {};
    
    return {
      avgBugLevel: bugs.reduce((sum, b) => sum + b.bugLevel, 0) / bugs.length,
      avgAttempts: bugs.reduce((sum, b) => sum + b.totalAttempts, 0) / bugs.length,
      avgExecutionTime: bugs.reduce((sum, b) => sum + b.totalExecutionTime, 0) / bugs.length,
      avgTokens: bugs.reduce((sum, b) => sum + b.totalTokens, 0) / bugs.length,
      avgCost: bugs.reduce((sum, b) => sum + b.totalCost, 0) / bugs.length,
      titleLength: bugs.reduce((sum, b) => sum + (b.bugTitle?.length || 0), 0) / bugs.length,
      descriptionLength: bugs.reduce((sum, b) => sum + (b.bugDescription?.length || 0), 0) / bugs.length
    };
  }

  /**
   * Otimiza templates de prompt baseado nos dados
   */
  async optimizePromptTemplates() {
    console.log('🚀 Otimizando templates de prompt...');
    
    const config = await MLConfig.findOne({ isActive: true });
    if (!config) {
      console.log('❌ Configuração de ML não encontrada');
      return;
    }
    
    const bugs = await BugMetrics.find({});
    const optimizedTemplates = [...config.promptTemplates];
    
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      
      if (levelBugs.length < this.minSamplesForLearning) {
        console.log(`⚠️  Nível ${level}: Dados insuficientes para otimização`);
        continue;
      }
      
      const template = optimizedTemplates.find(t => t.level === level);
      if (!template) continue;
      
      // Analisar prompts que funcionaram
      const successfulAttempts = successfulBugs.flatMap(b => 
        b.attempts.filter(a => a.success)
      );
      
      if (successfulAttempts.length > 0) {
        // Calcular nova taxa de sucesso
        const newSuccessRate = successfulBugs.length / levelBugs.length;
        const oldSuccessRate = template.successRate;
        
        // Aplicar learning rate
        template.successRate = oldSuccessRate + this.learningRate * (newSuccessRate - oldSuccessRate);
        template.usageCount = levelBugs.length;
        
        // Sugerir melhorias no template baseado nos dados
        const avgAttempts = successfulBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / successfulBugs.length;
        
        if (avgAttempts > 2) {
          console.log(`💡 Nível ${level}: Considerar template mais específico (${avgAttempts.toFixed(1)} tentativas médias)`);
        }
        
        console.log(`📊 Nível ${level}: Taxa de sucesso atualizada de ${(oldSuccessRate * 100).toFixed(1)}% para ${(template.successRate * 100).toFixed(1)}%`);
      }
    }
    
    config.promptTemplates = optimizedTemplates;
    config.lastUpdated = new Date();
    await config.save();
    
    console.log('✅ Templates otimizados e salvos');
  }

  /**
   * Gera recomendações de escalação
   */
  async generateEscalationRecommendations() {
    console.log('📈 Gerando recomendações de escalação...');
    
    const bugs = await BugMetrics.find({});
    const recommendations = [];
    
    // Analisar bugs que foram escalados com sucesso
    const escalatedBugs = bugs.filter(b => b.status === 'escalated' && b.bugLevel > 1);
    
    for (const bug of escalatedBugs) {
      const attemptsBeforeEscalation = bug.attempts.filter(a => a.attemptNumber <= 2);
      const attemptsAfterEscalation = bug.attempts.filter(a => a.attemptNumber > 2);
      
      if (attemptsAfterEscalation.length > 0) {
        const successAfterEscalation = attemptsAfterEscalation.some(a => a.success);
        
        if (successAfterEscalation) {
          recommendations.push({
            bugId: bug.notionBugId,
            originalLevel: bug.bugLevel - 1,
            escalatedLevel: bug.bugLevel,
            successAfterEscalation: true,
            attemptsBeforeEscalation: attemptsBeforeEscalation.length,
            attemptsAfterEscalation: attemptsAfterEscalation.length
          });
        }
      }
    }
    
    console.log(`📊 ${recommendations.length} bugs se beneficiaram da escalação`);
    
    // Calcular taxa de sucesso por nível após escalação
    const escalationStats = {};
    for (let level = 2; level <= 5; level++) {
      const levelBugs = escalatedBugs.filter(b => b.bugLevel === level);
      const successfulAfterEscalation = levelBugs.filter(b => 
        b.attempts.some(a => a.attemptNumber > 2 && a.success)
      );
      
      escalationStats[level] = {
        total: levelBugs.length,
        successful: successfulAfterEscalation.length,
        successRate: levelBugs.length > 0 ? successfulAfterEscalation.length / levelBugs.length : 0
      };
    }
    
    console.log('📈 Taxa de sucesso após escalação:');
    Object.entries(escalationStats).forEach(([level, stats]) => {
      console.log(`   Nível ${level}: ${(stats.successRate * 100).toFixed(1)}% (${stats.successful}/${stats.total})`);
    });
    
    return { recommendations, escalationStats };
  }

  /**
   * Prediz probabilidade de sucesso para um novo bug
   */
  async predictSuccessProbability(bugData) {
    const { title, description, bugLevel } = bugData;
    
    // Buscar bugs similares
    const similarBugs = await BugMetrics.find({
      bugLevel: bugLevel,
      $or: [
        { bugTitle: { $regex: this.extractKeywords(title).join('|'), $options: 'i' } },
        { bugDescription: { $regex: this.extractKeywords(description).join('|'), $options: 'i' } }
      ]
    });
    
    if (similarBugs.length === 0) {
      // Usar dados gerais do nível
      const levelBugs = await BugMetrics.find({ bugLevel });
      const successRate = levelBugs.length > 0 ? 
        levelBugs.filter(b => b.status === 'resolved').length / levelBugs.length : 0.5;
      
      return {
        probability: successRate,
        confidence: 0.3,
        basedOn: 'level_average',
        sampleSize: levelBugs.length
      };
    }
    
    const successfulSimilar = similarBugs.filter(b => b.status === 'resolved');
    const probability = successfulSimilar.length / similarBugs.length;
    
    return {
      probability,
      confidence: Math.min(0.9, similarBugs.length / 20), // Máximo 90% de confiança
      basedOn: 'similar_bugs',
      sampleSize: similarBugs.length,
      similarBugs: similarBugs.length
    };
  }

  /**
   * Extrai palavras-chave do texto
   */
  extractKeywords(text) {
    if (!text) return [];
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 palavras
  }

  /**
   * Executa ciclo completo de aprendizado
   */
  async runLearningCycle() {
    console.log('\n🤖 INICIANDO CICLO DE APRENDIZADO DE MÁQUINA\n');
    
    try {
      // 1. Analisar padrões de sucesso
      const patterns = await this.analyzeSuccessPatterns();
      
      // 2. Identificar características de sucesso
      const characteristics = await this.identifySuccessCharacteristics();
      
      // 3. Otimizar templates
      await this.optimizePromptTemplates();
      
      // 4. Gerar recomendações de escalação
      const escalation = await this.generateEscalationRecommendations();
      
      // 5. Salvar insights
      await this.saveInsights({
        patterns,
        characteristics,
        escalation,
        timestamp: new Date()
      });
      
      console.log('\n✅ CICLO DE APRENDIZADO CONCLUÍDO\n');
      
      return {
        patterns,
        characteristics,
        escalation
      };
      
    } catch (error) {
      console.error('❌ Erro durante ciclo de aprendizado:', error);
      throw error;
    }
  }

  /**
   * Salva insights do aprendizado
   */
  async saveInsights(insights) {
    try {
      const config = await MLConfig.findOne({ isActive: true });
      if (config) {
        config.insights = insights;
        await config.save();
        console.log('💾 Insights salvos na configuração de ML');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar insights:', error);
    }
  }
}

// Função principal
async function main() {
  const engine = new MLLearningEngine();
  
  try {
    await engine.connect();
    await engine.runLearningCycle();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await engine.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MLLearningEngine;
