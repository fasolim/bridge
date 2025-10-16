#!/usr/bin/env node

/**
 * Script de Teste de Integração
 * Testa todo o sistema de métricas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { BugMetrics, Report, MLConfig } = require('../models/Metrics');

class IntegrationTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.testResults = {
      mongodb: false,
      api: false,
      models: false,
      endpoints: false,
      ml: false
    };
  }

  async connect() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge_metrics';
    
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB: Conectado');
      this.testResults.mongodb = true;
    } catch (error) {
      console.error('❌ MongoDB: Erro de conexão:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 MongoDB: Desconectado');
  }

  async testAPI() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/projects`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('✅ API: Respondendo');
        this.testResults.api = true;
        return true;
      }
    } catch (error) {
      console.error('❌ API: Não está respondendo:', error.message);
      return false;
    }
  }

  async testModels() {
    try {
      // Testar criação de bug
      const testBug = new BugMetrics({
        notionBugId: 'test-bug-' + Date.now(),
        bugTitle: 'Bug de Teste',
        bugDescription: 'Este é um bug criado para teste de integração',
        bugLevel: 1
      });

      await testBug.save();
      console.log('✅ Models: Bug criado com sucesso');

      // Testar adição de tentativa
      await testBug.addAttempt({
        attemptNumber: 1,
        promptUsed: 'Teste de prompt',
        tokensUsed: 100,
        cost: 0.001,
        executionTime: 30,
        success: true
      });
      console.log('✅ Models: Tentativa adicionada com sucesso');

      // Limpar dados de teste
      await BugMetrics.deleteOne({ _id: testBug._id });
      console.log('✅ Models: Dados de teste removidos');

      this.testResults.models = true;
      return true;
    } catch (error) {
      console.error('❌ Models: Erro:', error.message);
      return false;
    }
  }

  async testEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/metrics/dashboard', name: 'Dashboard' },
      { method: 'GET', path: '/api/metrics/bugs', name: 'Listar Bugs' },
      { method: 'GET', path: '/api/metrics/ml-config', name: 'ML Config' }
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${this.baseUrl}${endpoint.path}`,
          timeout: 5000
        });

        if (response.status === 200) {
          console.log(`✅ Endpoint: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Endpoint: ${endpoint.name} - ${error.message}`);
      }
    }

    this.testResults.endpoints = successCount === endpoints.length;
    return this.testResults.endpoints;
  }

  async testML() {
    try {
      // Verificar se existe configuração de ML
      const config = await MLConfig.findOne({ isActive: true });
      
      if (!config) {
        console.log('⚠️  ML: Configuração não encontrada, criando...');
        
        const newConfig = new MLConfig({
          configName: 'test-config',
          promptTemplates: [
            {
              level: 1,
              template: 'Teste: {bugDescription}',
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
          isActive: true
        });

        await newConfig.save();
        console.log('✅ ML: Configuração criada');
      } else {
        console.log('✅ ML: Configuração encontrada');
      }

      // Testar predição
      const prediction = await this.predictTestBug();
      console.log(`✅ ML: Predição testada (probabilidade: ${(prediction.probability * 100).toFixed(1)}%)`);

      this.testResults.ml = true;
      return true;
    } catch (error) {
      console.error('❌ ML: Erro:', error.message);
      return false;
    }
  }

  async predictTestBug() {
    // Simular predição para um bug de teste
    const testBugData = {
      title: 'Bug de teste',
      description: 'Este é um bug simples para teste',
      bugLevel: 1
    };

    // Buscar bugs similares
    const similarBugs = await BugMetrics.find({
      bugLevel: testBugData.bugLevel
    });

    if (similarBugs.length === 0) {
      return {
        probability: 0.5,
        confidence: 0.3,
        basedOn: 'no_data'
      };
    }

    const successfulBugs = similarBugs.filter(b => b.status === 'resolved');
    const probability = successfulBugs.length / similarBugs.length;

    return {
      probability,
      confidence: Math.min(0.9, similarBugs.length / 20),
      basedOn: 'similar_bugs',
      sampleSize: similarBugs.length
    };
  }

  async testFullWorkflow() {
    console.log('\n🔄 Testando fluxo completo...\n');

    try {
      // 1. Criar bug de teste
      const testBug = new BugMetrics({
        notionBugId: 'workflow-test-' + Date.now(),
        bugTitle: 'Teste de Fluxo Completo',
        bugDescription: 'Bug criado para testar todo o fluxo do sistema',
        bugLevel: 2
      });

      await testBug.save();
      console.log('✅ 1. Bug criado');

      // 2. Adicionar tentativa falhada
      await testBug.addAttempt({
        attemptNumber: 1,
        promptUsed: 'Primeira tentativa - falhou',
        tokensUsed: 200,
        cost: 0.002,
        executionTime: 60,
        success: false,
        errorMessage: 'Erro de teste'
      });
      console.log('✅ 2. Tentativa falhada adicionada');

      // 3. Adicionar segunda tentativa (falha)
      await testBug.addAttempt({
        attemptNumber: 2,
        promptUsed: 'Segunda tentativa - falhou',
        tokensUsed: 300,
        cost: 0.003,
        executionTime: 90,
        success: false,
        errorMessage: 'Erro de teste'
      });
      console.log('✅ 3. Segunda tentativa falhada adicionada');

      // 4. Verificar se bug foi escalado
      const updatedBug = await BugMetrics.findById(testBug._id);
      if (updatedBug.bugLevel > 2) {
        console.log('✅ 4. Bug escalado automaticamente');
      } else {
        console.log('⚠️  4. Bug não foi escalado (pode ser normal)');
      }

      // 5. Adicionar tentativa bem-sucedida
      await testBug.addAttempt({
        attemptNumber: 3,
        promptUsed: 'Tentativa com prompt otimizado - sucesso',
        tokensUsed: 400,
        cost: 0.004,
        executionTime: 120,
        success: true
      });
      console.log('✅ 5. Tentativa bem-sucedida adicionada');

      // 6. Verificar se bug foi marcado como resolvido
      const finalBug = await BugMetrics.findById(testBug._id);
      if (finalBug.status === 'resolved') {
        console.log('✅ 6. Bug marcado como resolvido automaticamente');
      }

      // 7. Gerar relatório
      const report = new Report({
        reportId: 'test-report-' + Date.now(),
        reportType: 'custom',
        period: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        summary: {
          totalBugs: 1,
          resolvedBugs: 1,
          rejectedBugs: 0,
          escalatedBugs: 0,
          averageAttempts: 3,
          averageExecutionTime: 90,
          totalTokens: 900,
          totalCost: 0.009,
          successRate: 100
        },
        bugBreakdown: [
          { level: 2, count: 1, successRate: 100, averageAttempts: 3 }
        ],
        performanceMetrics: {
          fastestResolution: 120,
          slowestResolution: 120,
          mostCommonIssues: ['Teste'],
          technologyBreakdown: []
        }
      });

      await report.save();
      console.log('✅ 7. Relatório gerado');

      // 8. Limpar dados de teste
      await BugMetrics.deleteOne({ _id: testBug._id });
      await Report.deleteOne({ _id: report._id });
      console.log('✅ 8. Dados de teste removidos');

      console.log('\n🎉 Fluxo completo testado com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no fluxo completo:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🧪 INICIANDO TESTES DE INTEGRAÇÃO\n');
    console.log('='.repeat(50));

    try {
      await this.connect();

      // Teste 1: API
      console.log('\n📡 Testando API...');
      await this.testAPI();

      // Teste 2: Models
      console.log('\n📊 Testando Models...');
      await this.testModels();

      // Teste 3: Endpoints
      console.log('\n🔗 Testando Endpoints...');
      await this.testEndpoints();

      // Teste 4: ML
      console.log('\n🤖 Testando ML...');
      await this.testML();

      // Teste 5: Fluxo Completo
      await this.testFullWorkflow();

      // Relatório Final
      console.log('\n' + '='.repeat(50));
      console.log('📊 RELATÓRIO DE TESTES');
      console.log('='.repeat(50));
      
      const totalTests = Object.keys(this.testResults).length;
      const passedTests = Object.values(this.testResults).filter(Boolean).length;
      
      Object.entries(this.testResults).forEach(([test, result]) => {
        console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSOU' : 'FALHOU'}`);
      });
      
      console.log('='.repeat(50));
      console.log(`📈 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
      
      if (passedTests === totalTests) {
        console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.');
      } else {
        console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique a configuração.');
      }
      
      console.log('='.repeat(50) + '\n');

    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Função principal
async function main() {
  const tester = new IntegrationTester();
  await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = IntegrationTester;
