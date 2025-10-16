const MLConfig = require('../models/MLConfig');
const BugMetrics = require('../models/BugMetrics');

class MLService {
  constructor() {
    this.mlConfig = MLConfig;
    this.bugMetrics = BugMetrics;
    this.learningRate = 0.1;
    this.minSamplesForLearning = 10;
  }

  /**
   * Analisa padrões de sucesso por nível de bug
   */
  async analyzeSuccessPatterns() {
    const bugs = await this.bugMetrics.find({});
    const patterns = {};
    
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      
      if (levelBugs.length < this.minSamplesForLearning) {
        continue;
      }
      
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      const successRate = successfulBugs.length / levelBugs.length;
      
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
    }
    
    return patterns;
  }

  /**
   * Otimiza templates de prompt baseado nos dados
   */
  async optimizePromptTemplates() {
    const config = await this.mlConfig.findOne({ isActive: true });
    if (!config) {
      throw new Error('Configuração de ML não encontrada');
    }
    
    const bugs = await this.bugMetrics.find({});
    const optimizedTemplates = [...config.promptTemplates];
    
    for (let level = 1; level <= 5; level++) {
      const levelBugs = bugs.filter(b => b.bugLevel === level);
      const successfulBugs = levelBugs.filter(b => b.status === 'resolved');
      
      if (levelBugs.length < this.minSamplesForLearning) {
        continue;
      }
      
      const template = optimizedTemplates.find(t => t.level === level);
      if (!template) continue;
      
      const newSuccessRate = successfulBugs.length / levelBugs.length;
      const oldSuccessRate = template.successRate;
      
      template.successRate = oldSuccessRate + this.learningRate * (newSuccessRate - oldSuccessRate);
      template.usageCount = levelBugs.length;
    }
    
    config.promptTemplates = optimizedTemplates;
    config.lastUpdated = new Date();
    await config.save();
    
    return config;
  }

  /**
   * Prediz probabilidade de sucesso para um novo bug
   */
  async predictSuccessProbability(bugData) {
    const { title, description, bugLevel } = bugData;
    
    const similarBugs = await this.bugMetrics.find({
      bugLevel: bugLevel,
      $or: [
        { bugTitle: { $regex: this.extractKeywords(title).join('|'), $options: 'i' } },
        { bugDescription: { $regex: this.extractKeywords(description).join('|'), $options: 'i' } }
      ]
    });
    
    if (similarBugs.length === 0) {
      const levelBugs = await this.bugMetrics.find({ bugLevel });
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
      confidence: Math.min(0.9, similarBugs.length / 20),
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
      .slice(0, 10);
  }

  /**
   * Obtém prompt otimizado para um nível
   */
  async getOptimizedPrompt(level) {
    const config = await this.mlConfig.findOne({ isActive: true });
    if (!config) {
      return this.getDefaultPrompt(level);
    }
    
    const template = config.promptTemplates.find(t => t.level === level);
    return template ? template.template : this.getDefaultPrompt(level);
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
   * Executa ciclo completo de aprendizado
   */
  async runLearningCycle() {
    try {
      const patterns = await this.analyzeSuccessPatterns();
      const optimizedConfig = await this.optimizePromptTemplates();
      
      return {
        patterns,
        optimizedConfig,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Erro durante ciclo de aprendizado: ${error.message}`);
    }
  }

  /**
   * Obtém configuração de ML ativa
   */
  async getActiveConfig() {
    return await this.mlConfig.findOne({ isActive: true });
  }

  /**
   * Atualiza configuração de ML
   */
  async updateConfig(configData) {
    const { configName = 'default', ...updateData } = configData;
    
    const config = await this.mlConfig.findOneAndUpdate(
      { configName },
      { ...updateData, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    return config;
  }
}

module.exports = new MLService();
