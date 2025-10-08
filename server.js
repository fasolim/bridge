require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { getPromptForStrategy, getStrategyInfo, listStrategies } = require('./prompt-templates');

const app = express();
app.use(express.json());

// Servir arquivos estáticos da interface web
app.use(express.static(path.join(__dirname, 'public')));

// Configuração
const TASKS_DIR = path.join(__dirname, 'tasks');
const RESULTS_DIR = path.join(__dirname, 'results');
const PROJECTS_DIR = path.join(__dirname, 'projects');

// Cria diretórios necessários
if (!fs.existsSync(TASKS_DIR)) fs.mkdirSync(TASKS_DIR);
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR);

// Helper: Busca projeto na pasta projects/
function findProjectPath(projectName) {
  if (!projectName) return null;
  
  const cleanName = projectName.toLowerCase().trim();
  
  // Lista projetos principais
  const mainProjects = fs.readdirSync(PROJECTS_DIR)
    .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory());
  
  // Busca projeto principal
  let mainFound = mainProjects.find(p => p.toLowerCase() === cleanName || p.toLowerCase().includes(cleanName));
  
  if (!mainFound) return null;
  
  return path.join(PROJECTS_DIR, mainFound);
}

// Helper: Abre arquivo no Cursor e envia automaticamente para o chat
async function openInCursor(filePath, strategy = 'todos-pendentes') {
  return new Promise((resolve) => {
    const cursorCommand = `cursor "${filePath}"`;
    
    exec(cursorCommand, (error) => {
      if (error) {
        console.log('⚠️  Não foi possível abrir automaticamente no Cursor');
        console.log('👉 Abra manualmente:', filePath);
        resolve(false);
      } else {
        console.log('✅ Arquivo aberto no Cursor!');
        console.log('🤖 Enviando para o chat automaticamente...');
        
        // Aguarda 3 segundos para o Cursor carregar
        setTimeout(() => {
          // Mensagem de chat ajustada para mencionar a estratégia
          const strategyInfo = getStrategyInfo(strategy);
          const strategyName = strategyInfo ? strategyInfo.name : strategy;
          
          const chatMessage = `Execute as instruções do arquivo ${path.basename(filePath)} usando a estratégia "${strategyName}". Não peça confirmação, apenas execute agora de forma autônoma e completa seguindo todas as etapas definidas.`;
          
          // Tenta enviar via PowerShell
          const psScript = path.join(__dirname, 'auto-chat.ps1');
          const psCommand = `powershell -ExecutionPolicy Bypass -File "${psScript}" -Message "${chatMessage.replace(/"/g, '\\"')}"`;
          
          exec(psCommand, (psError) => {
            if (psError) {
              console.log('');
              console.log('⚠️  Não foi possível enviar automaticamente para o chat');
              console.log('');
              console.log('📋 COPIE E COLE NO CHAT (Ctrl+L):');
              console.log('─'.repeat(70));
              console.log(chatMessage);
              console.log('─'.repeat(70));
              console.log('');
            } else {
              console.log('');
              console.log('═'.repeat(70));
              console.log('✅ MENSAGEM ENVIADA AUTOMATICAMENTE PARA O CHAT!');
              console.log('═'.repeat(70));
              console.log('');
              console.log('🤖 O Cursor AI deve começar a executar agora...');
              console.log('');
            }
          });
        }, 3000);
        
        resolve(true);
      }
    });
  });
}

// Helper: Lista todos os projetos e subprojetos disponíveis
function listAvailableProjects() {
  try {
    const projects = [];
    const mainDirs = fs.readdirSync(PROJECTS_DIR)
      .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory());
    
    mainDirs.forEach(main => {
      const mainPath = path.join(PROJECTS_DIR, main);
      projects.push({ name: main, path: mainPath, type: 'main' });
      
      // Lista subprojetos
      try {
        const subDirs = fs.readdirSync(mainPath)
          .filter(f => fs.statSync(path.join(mainPath, f)).isDirectory());
        
        subDirs.forEach(sub => {
          projects.push({
            name: `${main}/${sub}`,
            path: path.join(mainPath, sub),
            type: 'sub',
            parent: main
          });
        });
      } catch (err) {
        // Ignora se não conseguir ler subpastas
      }
    });
    
    return projects;
  } catch {
    return [];
  }
}

// Função para gerar um arquivo de tarefa para o Cursor processar
function createTaskFile(taskData) {
  const taskId = `task-${Date.now()}`;
  const taskFile = path.join(TASKS_DIR, `${taskId}.json`);
  
  const taskContent = {
    id: taskId,
    timestamp: new Date().toISOString(),
    status: 'pending',
    data: taskData,
    instructions: generateInstructions(taskData)
  };
  
  fs.writeFileSync(taskFile, JSON.stringify(taskContent, null, 2));
  
  // Cria arquivo de instrução em markdown para o Cursor ler
  const instructionFile = path.join(TASKS_DIR, `${taskId}-INSTRUCTIONS.md`);
  
  // Cria conteúdo com trigger para auto-execução
  const autoExecuteContent = `# 🚨 EXECUÇÃO AUTOMÁTICA DETECTADA

${taskContent.instructions}

---



---`;

  fs.writeFileSync(instructionFile, autoExecuteContent);
  
  console.log(`📝 Tarefa criada: ${taskId}`);
  console.log(`📄 Arquivo: ${instructionFile}`);
  
  // Cria arquivo .cursorignore temporário para forçar detecção
  const cursorTrigger = path.join(TASKS_DIR, '.cursor-auto-execute');
  fs.writeFileSync(cursorTrigger, `${taskId}\n${new Date().toISOString()}`);
  
  return { taskId, taskFile, instructionFile };
}

// Gera as instruções completas para o Cursor executar usando templates dinâmicos
function generateInstructions(data) {
  const strategy = data.strategy || 'todos-pendentes';
  
  try {
    // Usa o sistema de templates para gerar o prompt específico da estratégia
    const prompt = getPromptForStrategy(strategy, data);
    return prompt;
  } catch (error) {
    console.error('❌ Erro ao gerar prompt:', error);
    // Fallback para prompt genérico
    return generateFallbackPrompt(data);
  }
}

// Prompt de fallback caso haja erro no sistema de templates
function generateFallbackPrompt(data) {
  const { notionDatabaseUrl, projectPath, githubRepo, autoCommit } = data;
  
  return `# 🤖 TAREFA AUTOMÁTICA - BUG RESOLVER

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${projectPath}
${githubRepo ? `**Repositório**: ${githubRepo}` : ''}

**IMPORTANTE**: 
- Você DEVE usar o MCP do Notion para interagir com o database de bugs
- Consulte a pasta \`Docs\` dentro do projeto para entender a arquitetura e padrões
- Se não conseguir extrair todo o conteúdo do card, prossiga com o que conseguiu obter

---

## 🎯 MISSÃO

Você deve executar automaticamente os seguintes passos:

### PASSO 1: Buscar Bugs no Notion

Use o MCP do Notion para buscar bugs pendentes no banco de dados:

\`\`\`
Database URL: ${notionDatabaseUrl}
\`\`\`

### PASSO 2: Para Cada Bug Encontrado

Execute o fluxo completo de resolução seguindo a arquitetura documentada no projeto.

### PASSO 3: Relatório Final

Crie um arquivo em \`results/relatorio-${Date.now()}.md\`.

---

## 🚀 EXECUTE AGORA

Boa sorte! 🎯
`;
}

// Função principal que processa a requisição
async function processBugResolverRequest(requestData) {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 BUG RESOLVER - PROCESSAMENTO AUTOMÁTICO');
  console.log('='.repeat(70));
  console.log(`\n📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);
  
  let {
    notionDatabaseUrl,
    projectPath,
    projectName,
    githubRepo,
    autoCommit = true,
    strategy = 'todos-pendentes',
    customFilter = null
  } = requestData;
  
  // Validações
  if (!notionDatabaseUrl) {
    throw new Error('notionDatabaseUrl é obrigatório');
  }
  
  // Se não passou projectPath, tenta buscar pelo nome
  if (!projectPath && projectName) {
    projectPath = findProjectPath(projectName);
    if (!projectPath) {
      const available = listAvailableProjects();
      throw new Error(`Projeto "${projectName}" não encontrado. Disponíveis: ${available.map(p => p.name).join(', ')}`);
    }
    console.log(`✅ Projeto encontrado: ${projectPath}`);
  }
  
  if (!projectPath) {
    const available = listAvailableProjects();
    throw new Error(`projectPath ou projectName é obrigatório. Projetos disponíveis: ${available.map(p => p.name).join(', ')}`);
  }
  
  // Obtém informações sobre a estratégia
  const strategyInfo = getStrategyInfo(strategy);
  
  console.log('📋 Configuração recebida:');
  console.log(`   📊 Notion Database: ${notionDatabaseUrl}`);
  console.log(`   📁 Projeto: ${projectPath}`);
  console.log(`   🎯 Estratégia: ${strategyInfo ? strategyInfo.name : strategy}`);
  console.log(`   🔄 Auto Commit: ${autoCommit ? 'Sim' : 'Não'}`);
  if (githubRepo) console.log(`   🌐 GitHub: ${githubRepo}`);
  if (customFilter) console.log(`   🔍 Filtro Customizado: ${customFilter}`);
  
  // Cria arquivo de tarefa
  console.log('\n📝 Criando tarefa para execução automática...\n');
  const task = createTaskFile(requestData);
  
  console.log('✅ Tarefa criada com sucesso!');
  console.log('\n🤖 Abrindo automaticamente no Cursor...\n');
  
  // Tenta abrir automaticamente no Cursor passando a estratégia
  const opened = await openInCursor(task.instructionFile, strategy);
  
  return {
    success: true,
    taskId: task.taskId,
    instructionFile: task.instructionFile,
    autoOpened: opened,
    message: opened 
      ? '✅ Tarefa criada e aberta no Cursor!' 
      : '✅ Tarefa criada! Abra manualmente no Cursor.',
    nextSteps: opened 
      ? [
          '✅ Arquivo aberto no Cursor',
          'Aguarde a execução automática',
          'Verifique o relatório em results/'
        ]
      : [
          `Abra o arquivo: ${task.instructionFile}`,
          'Execute as instruções automaticamente',
          'Verifique o relatório em results/'
        ]
  };
}

// Endpoint principal para iniciar resolução de bugs
app.post('/api/bug-resolver', async (req, res) => {
  try {
    // Aceita tanto os novos parâmetros quanto os antigos (compatibilidade)
    const requestData = {
      notionDatabaseUrl: req.body.notionDatabaseUrl || req.body.databaseUrl,
      projectPath: req.body.projectPath,
      projectName: req.body.projectName,
      githubRepo: req.body.githubRepo,
      autoCommit: req.body.autoCommit !== false,
      strategy: req.body.strategy || 'todos-pendentes',
      customFilter: req.body.customFilter || null
    };
    
    const result = await processBugResolverRequest(requestData);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      help: 'Verifique se notionDatabaseUrl e projectPath foram fornecidos'
    });
  }
});

// Endpoint para listar tarefas
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = fs.readdirSync(TASKS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf8');
        return JSON.parse(content);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      total: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para ver relatórios
app.get('/api/results', (req, res) => {
  try {
    const results = fs.readdirSync(RESULTS_DIR)
      .map(f => ({
        name: f,
        path: path.join(RESULTS_DIR, f),
        created: fs.statSync(path.join(RESULTS_DIR, f)).birthtime
      }))
      .sort((a, b) => b.created - a.created);
    
    res.json({
      success: true,
      total: results.length,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para listar projetos disponíveis
app.get('/api/projects', (req, res) => {
  try {
    const projects = listAvailableProjects();
    
    res.json({
      success: true,
      total: projects.length,
      projects: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para listar estratégias disponíveis
app.get('/api/strategies', (req, res) => {
  try {
    const strategies = listStrategies();
    
    res.json({
      success: true,
      total: strategies.length,
      strategies: strategies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Aceita conexões de qualquer IP

// Função para obter o IP local da máquina
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Pula endereços internos e não-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Bug Resolver API está rodando!');
  console.log('='.repeat(70));
  console.log(`\n📡 URLs disponíveis:\n`);
  console.log(`   Local:    http://localhost:${PORT}/api/bug-resolver`);
  console.log(`   Rede:     http://${localIP}:${PORT}/api/bug-resolver`);
  console.log(`\n📌 Use o endereço de REDE para acessar de outros computadores`);
  console.log('='.repeat(70) + '\n');
});