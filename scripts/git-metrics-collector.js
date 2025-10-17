#!/usr/bin/env node

/**
 * Script para coletar métricas de Git e integrar com o sistema de métricas
 * Captura: commits, PRs, branches, retries, tokens, preço, tempo de execução
 */

require('dotenv').config();
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const BugMetrics = require('../src/models/BugMetrics');
const fs = require('fs');
const path = require('path');

class GitMetricsCollector {
  constructor() {
    this.projectRoot = process.cwd();
    this.collectedMetrics = {
      commits: 0,
      pullRequests: 0,
      branches: 0,
      totalRetries: 0,
      totalTokens: 0,
      totalCost: 0,
      totalExecutionTime: 0
    };
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
   * Executa comando git e retorna resultado
   */
  executeGitCommand(command) {
    try {
      const result = execSync(command, { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      return result.trim();
    } catch (error) {
      console.warn(`⚠️  Comando git falhou: ${command}`, error.message);
      return null;
    }
  }

  /**
   * Coleta informações de commits recentes
   */
  collectCommits(limit = 50) {
    console.log('📊 Coletando informações de commits...');
    
    const gitLogCommand = `git log --oneline --pretty=format:"%H|%s|%an|%ad|%d" --date=iso --max-count=${limit}`;
    const gitLogResult = this.executeGitCommand(gitLogCommand);
    
    if (!gitLogResult) return [];

    const commits = gitLogResult.split('\n').map(line => {
      const [hash, message, author, date, refs] = line.split('|');
      return {
        commitHash: hash,
        commitMessage: message,
        commitDate: new Date(date),
        author: author,
        refs: refs ? refs.trim() : '',
        filesChanged: this.getCommitFiles(hash),
        linesChanged: this.getCommitStats(hash)
      };
    });

    this.collectedMetrics.commits = commits.length;
    console.log(`✅ Coletados ${commits.length} commits`);
    return commits;
  }

  /**
   * Obtém arquivos modificados em um commit
   */
  getCommitFiles(commitHash) {
    const command = `git show --name-only --pretty=format: ${commitHash}`;
    const result = this.executeGitCommand(command);
    return result ? result.split('\n').filter(file => file.trim()) : [];
  }

  /**
   * Obtém estatísticas de linhas modificadas
   */
  getCommitStats(commitHash) {
    const command = `git show --stat --pretty=format: ${commitHash}`;
    const result = this.executeGitCommand(command);
    
    if (!result) return { linesAdded: 0, linesDeleted: 0 };
    
    const lines = result.split('\n');
    let linesAdded = 0;
    let linesDeleted = 0;
    
    lines.forEach(line => {
      if (line.includes('insertion') || line.includes('deletion')) {
        const match = line.match(/(\d+) insertion|(\d+) deletion/);
        if (match) {
          if (match[1]) linesAdded += parseInt(match[1]);
          if (match[2]) linesDeleted += parseInt(match[2]);
        }
      }
    });
    
    return { linesAdded, linesDeleted };
  }

  /**
   * Coleta informações de branches
   */
  collectBranches() {
    console.log('🌿 Coletando informações de branches...');
    
    const localBranches = this.executeGitCommand('git branch --format="%(refname:short)|%(committerdate:iso)"');
    const remoteBranches = this.executeGitCommand('git branch -r --format="%(refname:short)|%(committerdate:iso)"');
    
    const branches = [];
    
    if (localBranches) {
      localBranches.split('\n').forEach(line => {
        const [name, date] = line.split('|');
        if (name && name !== 'HEAD') {
          branches.push({
            branchName: name,
            branchType: 'local',
            createdAt: new Date(date),
            mergedAt: null
          });
        }
      });
    }
    
    if (remoteBranches) {
      remoteBranches.split('\n').forEach(line => {
        const [name, date] = line.split('|');
        if (name && !name.includes('HEAD') && !name.includes('origin/main') && !name.includes('origin/master')) {
          branches.push({
            branchName: name,
            branchType: 'remote',
            createdAt: new Date(date),
            mergedAt: null
          });
        }
      });
    }
    
    this.collectedMetrics.branches = branches.length;
    console.log(`✅ Coletados ${branches.length} branches`);
    return branches;
  }

  /**
   * Coleta informações de Pull Requests (se disponível via GitHub CLI)
   */
  collectPullRequests() {
    console.log('🔀 Coletando informações de Pull Requests...');
    
    try {
      // Tentar usar GitHub CLI se disponível
      const ghCommand = 'gh pr list --json number,title,body,state,createdAt,mergedAt,url --limit 50';
      const result = this.executeGitCommand(ghCommand);
      
      if (result) {
        const prs = JSON.parse(result).map(pr => ({
          prNumber: pr.number,
          prTitle: pr.title,
          prDescription: pr.body || '',
          prStatus: pr.state,
          prCreatedAt: new Date(pr.createdAt),
          prMergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
          prUrl: pr.url
        }));
        
        this.collectedMetrics.pullRequests = prs.length;
        console.log(`✅ Coletados ${prs.length} Pull Requests`);
        return prs;
      }
    } catch (error) {
      console.log('⚠️  GitHub CLI não disponível, pulando coleta de PRs');
    }
    
    return [];
  }

  /**
   * Atualiza métricas de Git nos bugs existentes
   */
  async updateBugGitMetrics() {
    console.log('🔄 Atualizando métricas de Git nos bugs...');
    
    const commits = this.collectCommits();
    const branches = this.collectBranches();
    const pullRequests = this.collectPullRequests();
    
    // Buscar bugs que precisam de atualização
    const bugs = await BugMetrics.find({
      $or: [
        { 'gitMetrics.commits': { $exists: false } },
        { 'gitMetrics.commits': { $size: 0 } }
      ]
    });
    
    console.log(`📝 Atualizando ${bugs.length} bugs com métricas de Git...`);
    
    for (const bug of bugs) {
      // Filtrar commits relacionados ao bug (baseado em mensagens de commit)
      const relatedCommits = commits.filter(commit => 
        commit.commitMessage.toLowerCase().includes('fix') ||
        commit.commitMessage.toLowerCase().includes('bug') ||
        commit.commitMessage.toLowerCase().includes(bug.bugTitle.toLowerCase().substring(0, 20))
      );
      
      // Filtrar branches relacionadas
      const relatedBranches = branches.filter(branch =>
        branch.branchName.toLowerCase().includes('bug') ||
        branch.branchName.toLowerCase().includes('fix') ||
        branch.branchName.toLowerCase().includes(bug.notionBugId.substring(0, 8))
      );
      
      // Filtrar PRs relacionados
      const relatedPRs = pullRequests.filter(pr =>
        pr.prTitle.toLowerCase().includes('fix') ||
        pr.prTitle.toLowerCase().includes('bug') ||
        pr.prDescription.toLowerCase().includes(bug.bugTitle.toLowerCase().substring(0, 20))
      );
      
      // Atualizar métricas de Git do bug
      bug.gitMetrics = {
        commits: relatedCommits,
        pullRequests: relatedPRs,
        branches: relatedBranches
      };
      
      await bug.save();
      console.log(`✅ Bug ${bug.bugTitle} atualizado com métricas de Git`);
    }
    
    console.log(`🎉 ${bugs.length} bugs atualizados com métricas de Git`);
  }

  /**
   * Coleta métricas de retry e custo dos bugs
   */
  async collectRetryAndCostMetrics() {
    console.log('💰 Coletando métricas de retry e custo...');
    
    const bugs = await BugMetrics.find({});
    
    let totalRetries = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let totalExecutionTime = 0;
    
    bugs.forEach(bug => {
      totalRetries += bug.totalAttempts;
      totalTokens += bug.totalTokens;
      totalCost += bug.totalCost;
      totalExecutionTime += bug.totalExecutionTime;
    });
    
    this.collectedMetrics.totalRetries = totalRetries;
    this.collectedMetrics.totalTokens = totalTokens;
    this.collectedMetrics.totalCost = totalCost;
    this.collectedMetrics.totalExecutionTime = totalExecutionTime;
    
    console.log('📊 Métricas de Retry e Custo:');
    console.log(`   🔄 Total de Retries: ${totalRetries}`);
    console.log(`   🎯 Total de Tokens: ${totalTokens}`);
    console.log(`   💰 Custo Total: $${totalCost.toFixed(4)}`);
    console.log(`   ⏱️  Tempo Total de Execução: ${(totalExecutionTime / 1000 / 60).toFixed(2)} minutos`);
    
    return {
      totalRetries,
      totalTokens,
      totalCost,
      totalExecutionTime
    };
  }

  /**
   * Gera relatório de métricas
   */
  generateMetricsReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE MÉTRICAS DE GIT');
    console.log('='.repeat(60));
    console.log(`📝 Commits coletados: ${this.collectedMetrics.commits}`);
    console.log(`🔀 Pull Requests: ${this.collectedMetrics.pullRequests}`);
    console.log(`🌿 Branches: ${this.collectedMetrics.branches}`);
    console.log(`🔄 Total de Retries: ${this.collectedMetrics.totalRetries}`);
    console.log(`🎯 Total de Tokens: ${this.collectedMetrics.totalTokens}`);
    console.log(`💰 Custo Total: $${this.collectedMetrics.totalCost.toFixed(4)}`);
    console.log(`⏱️  Tempo Total: ${(this.collectedMetrics.totalExecutionTime / 1000 / 60).toFixed(2)} min`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Executa coleta completa de métricas
   */
  async collectAllMetrics() {
    try {
      console.log('🚀 Iniciando coleta completa de métricas de Git...\n');
      
      await this.updateBugGitMetrics();
      await this.collectRetryAndCostMetrics();
      this.generateMetricsReport();
      
      console.log('✅ Coleta de métricas concluída com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro durante coleta de métricas:', error);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const collector = new GitMetricsCollector();
  
  try {
    await collector.connect();
    await collector.collectAllMetrics();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await collector.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = GitMetricsCollector;
