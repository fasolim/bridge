#!/usr/bin/env node

/**
 * Script para testar a nova estrutura MVC
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class MVCStructureTester {
  constructor() {
    this.testResults = {
      health: false,
      metrics: false,
      notion: false,
      endpoints: false
    };
  }

  async testHealthEndpoint() {
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Health endpoint: OK');
        this.testResults.health = true;
        return true;
      }
    } catch (error) {
      console.error('❌ Health endpoint: Erro -', error.message);
      return false;
    }
  }

  async testMetricsEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/metrics/dashboard', name: 'Dashboard' },
      { method: 'GET', path: '/api/metrics/bugs', name: 'Listar Bugs' },
      { method: 'GET', path: '/api/metrics/reports', name: 'Listar Relatórios' },
      { method: 'GET', path: '/api/metrics/ml-config', name: 'ML Config' }
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.path}`,
          timeout: 5000
        });

        if (response.status === 200) {
          console.log(`✅ Metrics: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Metrics: ${endpoint.name} - ${error.response?.status || error.message}`);
      }
    }

    this.testResults.metrics = successCount === endpoints.length;
    return this.testResults.metrics;
  }

  async testNotionEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/notion/test', name: 'Test Connection' },
      { method: 'GET', path: '/api/notion/databases', name: 'List Databases' }
    ];

    let successCount = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.path}`,
          timeout: 5000
        });

        if (response.status === 200) {
          console.log(`✅ Notion: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Notion: ${endpoint.name} - ${error.response?.status || error.message}`);
      }
    }

    this.testResults.notion = successCount === endpoints.length;
    return this.testResults.notion;
  }

  async testCreateBug() {
    try {
      const testBug = {
        notionBugId: `test-bug-${Date.now()}`,
        bugTitle: 'Bug de Teste MVC',
        bugDescription: 'Este é um bug criado para testar a nova estrutura MVC',
        bugLevel: 1
      };

      const response = await axios.post(`${BASE_URL}/api/metrics/bugs`, testBug, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.status === 201 && response.data.success) {
        console.log('✅ Create Bug: Bug criado com sucesso');
        
        // Testar adição de tentativa
        const bugId = response.data.data._id;
        const attemptData = {
          promptUsed: 'Teste de prompt MVC',
          tokensUsed: 100,
          cost: 0.001,
          executionTime: 30,
          success: true
        };

        const attemptResponse = await axios.post(
          `${BASE_URL}/api/metrics/bugs/${bugId}/attempts`,
          attemptData,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          }
        );

        if (attemptResponse.status === 200 && attemptResponse.data.success) {
          console.log('✅ Add Attempt: Tentativa adicionada com sucesso');
          this.testResults.endpoints = true;
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Create Bug: Erro -', error.response?.data?.message || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🧪 TESTANDO ESTRUTURA MVC\n');
    console.log('='.repeat(50));

    try {
      // Teste 1: Health Check
      console.log('\n📡 Testando Health Check...');
      await this.testHealthEndpoint();

      // Teste 2: Endpoints de Métricas
      console.log('\n📊 Testando Endpoints de Métricas...');
      await this.testMetricsEndpoints();

      // Teste 3: Endpoints do Notion
      console.log('\n🔗 Testando Endpoints do Notion...');
      await this.testNotionEndpoints();

      // Teste 4: Criação de Bug
      console.log('\n🎯 Testando Criação de Bug...');
      await this.testCreateBug();

      // Relatório Final
      console.log('\n' + '='.repeat(50));
      console.log('📊 RELATÓRIO DE TESTES MVC');
      console.log('='.repeat(50));
      
      const totalTests = Object.keys(this.testResults).length;
      const passedTests = Object.values(this.testResults).filter(Boolean).length;
      
      Object.entries(this.testResults).forEach(([test, result]) => {
        console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSOU' : 'FALHOU'}`);
      });
      
      console.log('='.repeat(50));
      console.log(`📈 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
      
      if (passedTests === totalTests) {
        console.log('🎉 TODOS OS TESTES PASSARAM! Estrutura MVC funcionando perfeitamente.');
      } else {
        console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique a configuração.');
      }
      
      console.log('='.repeat(50) + '\n');

    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    }
  }
}

// Função principal
async function main() {
  const tester = new MVCStructureTester();
  await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MVCStructureTester;
