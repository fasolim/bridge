#!/usr/bin/env node

/**
 * Demonstração do Sistema de Métricas
 * Simula o funcionamento completo sem precisar do Notion
 */

const fs = require('fs');
const path = require('path');

const METRICS_DIR = path.join(__dirname, '..', 'metrics-data');

class DemoSystem {
  constructor() {
    this.ensureMetricsDir();
  }

  ensureMetricsDir() {
    if (!fs.existsSync(METRICS_DIR)) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
    }
  }

  getMetricsFile() {
    return path.join(METRICS_DIR, 'demo-metrics.json');
  }

  createDemoData() {
    const demoBugs = [
      {
        id: 'bug_001',
        notionBugId: 'demo-bug-001',
        title: 'Botão de login não funciona',
        description: 'O botão de login na página principal não responde quando clicado. Usuários não conseguem fazer login.',
        bugLevel: 1,
        status: 'resolved',
        attempts: [
          {
            attemptNumber: 1,
            promptUsed: 'Analise e corrija o seguinte bug: Botão de login não funciona...',
            tokensUsed: 800,
            cost: 0.0016,
            executionTime: 45,
            success: true,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ],
        totalAttempts: 1,
        totalTokens: 800,
        totalCost: 0.0016,
        totalExecutionTime: 45,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'bug_002',
        notionBugId: 'demo-bug-002',
        title: 'Erro na validação de formulário',
        description: 'O formulário de cadastro não valida corretamente os campos obrigatórios. Permite submissão com dados inválidos.',
        bugLevel: 2,
        status: 'resolved',
        attempts: [
          {
            attemptNumber: 1,
            promptUsed: 'Analise e corrija o seguinte bug: Erro na validação de formulário...',
            tokensUsed: 1200,
            cost: 0.0024,
            executionTime: 60,
            success: false,
            errorMessage: 'Validação incompleta',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            attemptNumber: 2,
            promptUsed: 'Este é um bug de nível intermediário. Analise cuidadosamente: Erro na validação...',
            tokensUsed: 1500,
            cost: 0.003,
            executionTime: 90,
            success: true,
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ],
        totalAttempts: 2,
        totalTokens: 2700,
        totalCost: 0.0054,
        totalExecutionTime: 150,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'bug_003',
        notionBugId: 'demo-bug-003',
        title: 'Falha na integração com API externa',
        description: 'A integração com a API de pagamento está falhando. Transações não são processadas corretamente.',
        bugLevel: 3,
        status: 'escalated',
        attempts: [
          {
            attemptNumber: 1,
            promptUsed: 'Analise e corrija o seguinte bug: Falha na integração com API externa...',
            tokensUsed: 2000,
            cost: 0.004,
            executionTime: 120,
            success: false,
            errorMessage: 'Timeout na API',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            attemptNumber: 2,
            promptUsed: 'Este é um bug de nível intermediário. Analise cuidadosamente: Falha na integração...',
            tokensUsed: 2500,
            cost: 0.005,
            executionTime: 150,
            success: false,
            errorMessage: 'Configuração incorreta',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            attemptNumber: 3,
            promptUsed: 'Bug complexo detectado: Falha na integração com API externa...',
            tokensUsed: 3000,
            cost: 0.006,
            executionTime: 180,
            success: false,
            errorMessage: 'Requer análise mais profunda',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ],
        totalAttempts: 3,
        totalTokens: 7500,
        totalCost: 0.015,
        totalExecutionTime: 450,
        createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'bug_004',
        notionBugId: 'demo-bug-004',
        title: 'Problema de performance no carregamento',
        description: 'A página principal está carregando muito lentamente. Tempo de resposta acima de 5 segundos.',
        bugLevel: 2,
        status: 'in_progress',
        attempts: [
          {
            attemptNumber: 1,
            promptUsed: 'Analise e corrija o seguinte bug: Problema de performance no carregamento...',
            tokensUsed: 1800,
            cost: 0.0036,
            executionTime: 100,
            success: false,
            errorMessage: 'Otimização insuficiente',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
          }
        ],
        totalAttempts: 1,
        totalTokens: 1800,
        totalCost: 0.0036,
        totalExecutionTime: 100,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    const mlConfig = {
      promptTemplates: [
        {
          level: 1,
          template: 'Analise e corrija o seguinte bug: {bugDescription}. Forneça uma solução simples e direta.',
          successRate: 0.8,
          usageCount: 5
        },
        {
          level: 2,
          template: 'Este é um bug de nível intermediário. Analise cuidadosamente: {bugDescription}. Considere múltiplas abordagens e escolha a melhor.',
          successRate: 0.6,
          usageCount: 8
        },
        {
          level: 3,
          template: 'Bug complexo detectado: {bugDescription}. Realize análise detalhada, identifique dependências e forneça solução robusta.',
          successRate: 0.3,
          usageCount: 3
        },
        {
          level: 4,
          template: 'Bug crítico de alto nível: {bugDescription}. Análise arquitetural necessária. Considere impacto em todo o sistema.',
          successRate: 0.1,
          usageCount: 1
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

    return {
      bugs: demoBugs,
      mlConfig: mlConfig,
      reports: []
    };
  }

  saveDemoData() {
    const data = this.createDemoData();
    fs.writeFileSync(this.getMetricsFile(), JSON.stringify(data, null, 2));
    console.log('✅ Dados de demonstração criados');
  }

  generateReport() {
    const data = JSON.parse(fs.readFileSync(this.getMetricsFile(), 'utf8'));
    const bugs = data.bugs;
    
    const report = {
      reportId: `demo_report_${Date.now()}`,
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
      },
      mlInsights: {
        promptEffectiveness: data.mlConfig.promptTemplates.map(t => ({
          level: t.level,
          successRate: t.successRate,
          usageCount: t.usageCount
        })),
        escalationPatterns: bugs.filter(b => b.status === 'escalated').length,
        costAnalysis: {
          totalCost: bugs.reduce((sum, b) => sum + b.totalCost, 0),
          averageCostPerBug: bugs.length > 0 ? bugs.reduce((sum, b) => sum + b.totalCost, 0) / bugs.length : 0,
          mostExpensiveBug: bugs.reduce((max, b) => b.totalCost > max.totalCost ? b : max, bugs[0])
        }
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
        averageAttempts: levelBugs.length > 0 ? levelBugs.reduce((sum, b) => sum + b.totalAttempts, 0) / levelBugs.length : 0,
        averageCost: levelBugs.length > 0 ? levelBugs.reduce((sum, b) => sum + b.totalCost, 0) / levelBugs.length : 0
      };
    }
    
    return report;
  }

  displayReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO DE MÉTRICAS - DEMONSTRAÇÃO');
    console.log('='.repeat(70));
    
    console.log('\n📈 RESUMO GERAL:');
    console.log(`   Total de bugs: ${report.summary.totalBugs}`);
    console.log(`   Bugs resolvidos: ${report.summary.resolvedBugs}`);
    console.log(`   Bugs em andamento: ${report.summary.inProgressBugs}`);
    console.log(`   Bugs escalados: ${report.summary.escalatedBugs}`);
    console.log(`   Taxa de sucesso: ${((report.summary.resolvedBugs / report.summary.totalBugs) * 100).toFixed(1)}%`);
    
    console.log('\n💰 MÉTRICAS DE CUSTO:');
    console.log(`   Total de tokens: ${report.performanceMetrics.totalTokens.toLocaleString()}`);
    console.log(`   Custo total: $${report.performanceMetrics.totalCost.toFixed(4)}`);
    console.log(`   Tempo total: ${(report.performanceMetrics.totalExecutionTime / 60).toFixed(1)} minutos`);
    console.log(`   Tentativas médias: ${report.performanceMetrics.averageAttempts.toFixed(1)}`);
    
    console.log('\n🎯 BREAKDOWN POR NÍVEL:');
    for (let level = 1; level <= 5; level++) {
      const levelData = report.bugsByLevel[level];
      if (levelData.total > 0) {
        console.log(`   Nível ${level}: ${levelData.total} bugs, ${(levelData.successRate * 100).toFixed(1)}% sucesso, $${levelData.averageCost.toFixed(4)} médio`);
      }
    }
    
    console.log('\n🤖 INSIGHTS DE ML:');
    console.log('   Efetividade dos prompts:');
    report.mlInsights.promptEffectiveness.forEach(prompt => {
      if (prompt.usageCount > 0) {
        console.log(`     Nível ${prompt.level}: ${(prompt.successRate * 100).toFixed(1)}% sucesso (${prompt.usageCount} usos)`);
      }
    });
    
    console.log(`   Bugs escalados: ${report.mlInsights.escalationPatterns}`);
    console.log(`   Bug mais caro: ${report.mlInsights.costAnalysis.mostExpensiveBug.title} ($${report.mlInsights.costAnalysis.mostExpensiveBug.totalCost.toFixed(4)})`);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 DEMONSTRAÇÃO CONCLUÍDA!');
    console.log('='.repeat(70) + '\n');
  }

  simulateNewBug() {
    const data = JSON.parse(fs.readFileSync(this.getMetricsFile(), 'utf8'));
    
    const newBug = {
      id: `bug_${Date.now()}`,
      notionBugId: `demo-bug-${Date.now()}`,
      title: 'Novo bug detectado',
      description: 'Este é um bug simulado para demonstrar o sistema de aprendizado de máquina.',
      bugLevel: 2,
      status: 'pending',
      attempts: [],
      totalAttempts: 0,
      totalTokens: 0,
      totalCost: 0,
      totalExecutionTime: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.bugs.push(newBug);
    fs.writeFileSync(this.getMetricsFile(), JSON.stringify(data, null, 2));
    
    console.log('✅ Novo bug simulado adicionado');
    return newBug;
  }

  simulateAttempt(bugId, success = false) {
    const data = JSON.parse(fs.readFileSync(this.getMetricsFile(), 'utf8'));
    const bug = data.bugs.find(b => b.id === bugId);
    
    if (!bug) {
      console.log('❌ Bug não encontrado');
      return;
    }
    
    const attempt = {
      attemptNumber: bug.totalAttempts + 1,
      promptUsed: `Tentativa ${bug.totalAttempts + 1} para: ${bug.title}`,
      tokensUsed: Math.floor(Math.random() * 2000) + 500,
      cost: Math.random() * 0.01,
      executionTime: Math.floor(Math.random() * 200) + 30,
      success: success,
      errorMessage: success ? null : 'Erro simulado',
      timestamp: new Date().toISOString()
    };
    
    bug.attempts.push(attempt);
    bug.totalAttempts += 1;
    bug.totalTokens += attempt.tokensUsed;
    bug.totalCost += attempt.cost;
    bug.totalExecutionTime += attempt.executionTime;
    
    if (success) {
      bug.status = 'resolved';
      bug.resolvedAt = new Date().toISOString();
    } else if (bug.totalAttempts > 2) {
      bug.bugLevel = Math.min(bug.bugLevel + 1, 5);
      bug.status = 'escalated';
    }
    
    bug.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(this.getMetricsFile(), JSON.stringify(data, null, 2));
    
    console.log(`✅ Tentativa simulada: ${success ? 'Sucesso' : 'Falha'}`);
    return bug;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const demo = new DemoSystem();
  
  switch (command) {
    case 'create':
      demo.saveDemoData();
      break;
      
    case 'report':
      demo.displayReport();
      break;
      
    case 'new-bug':
      const newBug = demo.simulateNewBug();
      console.log(`Novo bug criado: ${newBug.title} (ID: ${newBug.id})`);
      break;
      
    case 'attempt':
      const bugId = args[1];
      const success = args[2] === 'success';
      if (!bugId) {
        console.log('❌ Uso: node demo-system.js attempt <bug_id> [success|fail]');
        return;
      }
      demo.simulateAttempt(bugId, success);
      break;
      
    case 'full-demo':
      console.log('🎬 Iniciando demonstração completa...\n');
      demo.saveDemoData();
      demo.displayReport();
      break;
      
    default:
      console.log('❌ Uso: node demo-system.js <command>');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  create      - Criar dados de demonstração');
      console.log('  report      - Exibir relatório de métricas');
      console.log('  new-bug     - Simular novo bug');
      console.log('  attempt     - Simular tentativa de resolução');
      console.log('  full-demo   - Executar demonstração completa');
      console.log('');
      console.log('Exemplos:');
      console.log('  node demo-system.js full-demo');
      console.log('  node demo-system.js new-bug');
      console.log('  node demo-system.js attempt bug_001 success');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = DemoSystem;
