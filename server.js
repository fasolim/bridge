require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

// Configuração
const TASKS_DIR = path.join(__dirname, 'tasks');
const RESULTS_DIR = path.join(__dirname, 'results');
const PROJECTS_DIR = path.join(__dirname, 'projects');

// Cria diretórios necessários
if (!fs.existsSync(TASKS_DIR)) fs.mkdirSync(TASKS_DIR);
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR);

// Helper: Busca projeto/subprojeto na pasta projects/
function findProjectPath(projectName, subProject) {
  if (!projectName) return null;
  
  const cleanName = projectName.toLowerCase().trim();
  const cleanSub = subProject ? subProject.toLowerCase().trim() : null;
  
  // Lista projetos principais
  const mainProjects = fs.readdirSync(PROJECTS_DIR)
    .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory());
  
  // Busca projeto principal
  let mainFound = mainProjects.find(p => p.toLowerCase() === cleanName || p.toLowerCase().includes(cleanName));
  
  if (!mainFound) return null;
  
  const mainPath = path.join(PROJECTS_DIR, mainFound);
  
  // Se não tem subprojeto, retorna o principal
  if (!cleanSub) return mainPath;
  
  // Busca subprojeto dentro do principal
  try {
    const subProjects = fs.readdirSync(mainPath)
      .filter(f => fs.statSync(path.join(mainPath, f)).isDirectory());
    
    const subFound = subProjects.find(s => 
      s.toLowerCase() === cleanSub || 
      s.toLowerCase().includes(cleanSub) ||
      (cleanSub.includes('front') && s.toLowerCase().includes('front')) ||
      (cleanSub.includes('back') && s.toLowerCase().includes('back'))
    );
    
    if (subFound) return path.join(mainPath, subFound);
  } catch (err) {
    console.log('⚠️ Erro ao buscar subprojeto:', err.message);
  }
  
  // Se não encontrou subprojeto, retorna o principal
  return mainPath;
}

// Helper: Abre arquivo no Cursor e envia automaticamente para o chat
async function openInCursor(filePath) {
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
          const chatMessage = `Busque todos os bugs com Status 'Reprovado' e os  no database do Notion. Para cada bug: analise o problema, implemente a solução no código tanto back quanto front se necessário, faça commit no GitHub com mensagem 'fix: [título do bug]', e atualize o status do bug para 'Pronto para teste' no Notion com a solução implementada e o hash do commit. ${path.basename(filePath)}. Não peça confirmação, apenas execute agora de forma autônoma e completa.`;
          
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

## 💬 MENSAGEM AUTOMÁTICA PARA O CURSOR AI

**Busque todos os bugs com Status 'Reprovado' e os  no database do Notion. Para cada bug: analise o problema, implemente a solução no código tanto back quanto front se necessário, faça commit no GitHub com mensagem 'fix: [título do bug]', e atualize o status do bug para 'Pronto para teste' no Notion com a solução implementada e o hash do commit.**

**Não peça confirmação. Apenas execute agora.**

---`;

  fs.writeFileSync(instructionFile, autoExecuteContent);
  
  console.log(`📝 Tarefa criada: ${taskId}`);
  console.log(`📄 Arquivo: ${instructionFile}`);
  
  // Cria arquivo .cursorignore temporário para forçar detecção
  const cursorTrigger = path.join(TASKS_DIR, '.cursor-auto-execute');
  fs.writeFileSync(cursorTrigger, `${taskId}\n${new Date().toISOString()}`);
  
  return { taskId, taskFile, instructionFile };
}

// Gera as instruções completas para o Cursor executar
function generateInstructions(data) {
  const { notionDatabaseUrl, projectPath, projectContext, githubRepo, autoCommit } = data;
  
  return `# 🤖 TAREFA AUTOMÁTICA - BUG RESOLVER

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${projectPath}
**Tipo**: ${projectContext || 'Não especificado'}
${githubRepo ? `**Repositório**: ${githubRepo}` : ''}

---

## 🎯 MISSÃO

Você deve executar automaticamente os seguintes passos:

### PASSO 1: Buscar Bugs no Notion

Use o MCP do Notion para buscar todos os bugs com status "Pendente" no banco de dados:

\`\`\`
Database URL: ${notionDatabaseUrl}
\`\`\`

**Comando para você executar:**
- Use a ferramenta \`mcp_Notion_notion-search\` ou \`mcp_Notion_notion-fetch\`
- Busque por páginas com status = "Pendente"
- Extraia: ID, Nome, Descrição, Prioridade

### PASSO 2: Para Cada Bug Encontrado

Para cada bug pendente, execute:

#### 2.1. Análise do Bug
- Leia a descrição completa
- Identifique o tipo de problema
- Determine quais arquivos podem estar envolvidos

#### 2.2. Busca no Código
- Navegue até: \`${projectPath}\`
- Use \`codebase_search\` para encontrar código relacionado
- Identifique o arquivo e linha com problema

#### 2.3. Implementação da Correção
- Abra o arquivo problemático
- Analise o código atual
- Implemente a correção adequada
- Garanta que segue as boas práticas
- NÃO quebre funcionalidades existentes

#### 2.4. Validação
- Se houver testes, execute-os
- Verifique se a correção resolve o bug
- Confirme que não criou novos problemas

${autoCommit !== false ? `
#### 2.5. Commit (Automático)
- Faça commit das alterações com mensagem clara:
  - Formato: \`fix: [nome do bug]\`
  - Body: descrição da correção implementada
- Se configurado, faça push para o repositório
` : ''}

#### 2.6. Atualização no Notion
- Use o MCP do Notion para atualizar o bug
- Altere o status para "Resolvido"
- Adicione um comentário com:
  - Descrição da correção
  - Arquivos alterados
  ${autoCommit !== false ? '- Hash do commit' : ''}

### PASSO 3: Relatório Final

Crie um arquivo em \`results/relatorio-${Date.now()}.md\` com:
- Total de bugs processados
- Lista de bugs resolvidos
- Arquivos alterados
- Commits feitos (se houver)
- Bugs que não puderam ser resolvidos (com motivo)

---

## ⚠️ REGRAS IMPORTANTES

1. **SEMPRE** analise o código antes de fazer alterações
2. **NUNCA** delete código sem entender sua função
3. **SEMPRE** mantenha o estilo de código do projeto
4. **NUNCA** faça commit se os testes falharem
5. **SEMPRE** atualize o Notion após resolver um bug
6. **SE** não conseguir resolver um bug, marque como "Em Análise" e adicione comentário explicando o bloqueio

---

## 🚀 EXECUTE AGORA

**IMPORTANTE**: Você deve começar a executar IMEDIATAMENTE após ler este arquivo.

Não peça confirmação, não espere aprovação. Execute de forma autônoma e completa.

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
    subProject,
    projectContext,
    githubRepo,
    autoCommit = true
  } = requestData;
  
  // Validações
  if (!notionDatabaseUrl) {
    throw new Error('notionDatabaseUrl é obrigatório');
  }
  
  // Se não passou projectPath, tenta buscar pelo nome
  if (!projectPath && projectName) {
    projectPath = findProjectPath(projectName, subProject);
    if (!projectPath) {
      const available = listAvailableProjects();
      throw new Error(`Projeto "${projectName}${subProject ? '/' + subProject : ''}" não encontrado. Disponíveis: ${available.map(p => p.name).join(', ')}`);
    }
    console.log(`✅ Projeto encontrado: ${projectPath}`);
  }
  
  if (!projectPath) {
    const available = listAvailableProjects();
    throw new Error(`projectPath ou projectName é obrigatório. Projetos disponíveis: ${available.map(p => p.name).join(', ')}`);
  }
  
  console.log('📋 Configuração recebida:');
  console.log(`   📊 Notion Database: ${notionDatabaseUrl}`);
  console.log(`   📁 Projeto: ${projectPath}`);
  console.log(`   💡 Contexto: ${projectContext || 'Não especificado'}`);
  console.log(`   🔄 Auto Commit: ${autoCommit ? 'Sim' : 'Não'}`);
  if (githubRepo) console.log(`   🌐 GitHub: ${githubRepo}`);
  
  // Cria arquivo de tarefa
  console.log('\n📝 Criando tarefa para execução automática...\n');
  const task = createTaskFile(requestData);
  
  console.log('✅ Tarefa criada com sucesso!');
  console.log('\n🤖 Abrindo automaticamente no Cursor...\n');
  
  // Tenta abrir automaticamente no Cursor
  const opened = await openInCursor(task.instructionFile);
  
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
      subProject: req.body.subProject,
      projectContext: req.body.projectContext || req.body.prompt,
      githubRepo: req.body.githubRepo,
      autoCommit: req.body.autoCommit !== false
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