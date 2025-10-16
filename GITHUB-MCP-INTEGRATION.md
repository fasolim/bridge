# 🔗 Integração GitHub MCP - Automação Completa

## 🎯 Objetivo

Automatizar completamente o fluxo de correção de bugs incluindo:
- ✅ Criar branches automaticamente
- ✅ Fazer commits com mensagens padronizadas
- ✅ Push para o repositório remoto
- ✅ Criar Pull Requests automaticamente

## 🔧 Configuração do MCP GitHub no Cursor

### 1. Verificar se o MCP do GitHub está Disponível

No Cursor AI, verifique se você tem acesso aos comandos MCP do GitHub:

```
MCP disponíveis:
- mcp_github_create_branch
- mcp_github_commit
- mcp_github_push
- mcp_github_create_pull_request
- mcp_github_get_repository_info
```

### 2. Configurar Token do GitHub

O MCP do GitHub precisa de um token de acesso pessoal com as seguintes permissões:

**Permissões Necessárias:**
- ✅ `repo` (acesso completo a repositórios privados)
- ✅ `workflow` (atualizar GitHub Actions workflows)
- ✅ `write:packages` (se usar GitHub Packages)

**Como Criar o Token:**

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione as permissões acima
4. Copie o token gerado

**Configurar no Cursor:**

O token geralmente é configurado automaticamente pelo MCP, mas você pode precisar configurá-lo manualmente na primeira vez que usar.

### 3. Estrutura de Comandos MCP GitHub

#### 3.1. Criar Branch

```javascript
// Criar uma nova branch a partir da branch atual
mcp_github_create_branch({
  repository: "owner/repo-name",
  branch_name: "fix/nome-do-bug",
  base_branch: "main" // ou "develop"
})
```

#### 3.2. Fazer Commit

```javascript
// Fazer commit das alterações
mcp_github_commit({
  repository: "owner/repo-name",
  message: "fix: descrição da correção",
  description: "Descrição detalhada\n\n- Arquivos modificados\n- Padrões seguidos",
  files: ["path/to/file1.js", "path/to/file2.js"]
})
```

#### 3.3. Push para Remoto

```javascript
// Push da branch para o repositório remoto
mcp_github_push({
  repository: "owner/repo-name",
  branch: "fix/nome-do-bug"
})
```

#### 3.4. Criar Pull Request

```javascript
// Criar PR automaticamente
mcp_github_create_pull_request({
  repository: "owner/repo-name",
  title: "fix: nome do bug",
  body: `## 🐛 Bug
  
  Descrição do problema
  
  ## ✅ Solução
  
  O que foi implementado
  
  ## 📁 Arquivos Alterados
  
  - file1.js
  - file2.js
  
  ## 🔗 Notion Card
  
  [Link do card]`,
  base: "main",
  head: "fix/nome-do-bug",
  labels: ["bug", "auto-fix"]
})
```

## 🤖 Como o Bridge Usa o GitHub MCP

Quando você envia um POST para `/api/bug-resolver`, o sistema:

1. **Cria arquivo de instrução** com comandos MCP incluídos
2. **Abre no Cursor** automaticamente
3. **Envia mensagem para o chat** instruindo uso de MCP
4. **Cursor AI (você) executa** os comandos MCP automaticamente

## 📋 Fluxo Completo de Automação

```
POST /api/bug-resolver
      ↓
[1] Criar task-XXX-INSTRUCTIONS.md
    (com instruções de usar MCP GitHub)
      ↓
[2] Abrir arquivo no Cursor
      ↓
[3] Enviar mensagem automática para chat
    "Execute IMEDIATAMENTE... use MCP GitHub para branches, commits e PRs"
      ↓
[4] Cursor AI (VOCÊ) recebe e executa:
    ├─ Busca bugs no Notion (MCP Notion)
    ├─ Analisa código do projeto
    ├─ Implementa correções
    ├─ Cria branch (MCP GitHub)
    ├─ Faz commit (MCP GitHub)
    ├─ Push para remoto (MCP GitHub)
    ├─ Cria Pull Request (MCP GitHub)
    └─ Atualiza Notion com link do PR (MCP Notion)
      ↓
[5] Gera relatório em results/
```

## 🎯 Exemplo de Uso no Prompt

Os prompts gerados automaticamente agora incluem seções como esta:

```markdown
#### 3.7. Automação Git/GitHub (OBRIGATÓRIO)

**ATENÇÃO**: Você DEVE usar o MCP do GitHub para automatizar completamente:

1. **Criar Branch de Fix:**
   - Use o comando MCP do GitHub para criar branch
   - Nome da branch: `fix/[nome-do-bug-kebab-case]`

2. **Commit das Alterações:**
   - Adicione TODOS os arquivos modificados ao stage
   - Mensagem do commit no formato:
     ```
     fix: [nome do bug resumido]
     
     - Descrição detalhada da correção
     - Arquivos modificados: [lista]
     - Padrões dos Docs seguidos: [quais]
     
     Closes: [link do card do Notion]
     ```

3. **Push para Repositório:**
   - Push da branch para o repositório remoto
   - Use MCP do GitHub: `github-push`

4. **Criar Pull Request Automático:**
   - Use MCP do GitHub para criar PR
   - Título: `fix: [nome do bug]`
   - Labels: `bug`, `auto-fix`

**COMANDOS MCP GITHUB QUE VOCÊ DEVE USAR:**
- `mcp_github_create_branch` - Criar branch
- `mcp_github_commit` - Fazer commit
- `mcp_github_push` - Push para remoto
- `mcp_github_create_pull_request` - Criar PR

**NÃO use comandos git do terminal - use APENAS o MCP do GitHub!**
```

## ⚙️ Configuração por Projeto

No POST, você pode especificar o repositório GitHub:

```json
{
  "notionDatabaseUrl": "https://notion.so/...",
  "projectPath": "C:/projetos/meu-projeto",
  "githubRepo": "username/repository-name",
  "autoCommit": true,
  "strategy": "nao-iniciado"
}
```

## 🔐 Segurança

- ✅ Token do GitHub é gerenciado pelo MCP do Cursor
- ✅ Não é necessário expor token em arquivos
- ✅ Permissões limitadas ao escopo necessário
- ✅ Cada commit é assinado automaticamente

## 🚨 Modo de Execução Automática

**IMPORTANTE**: Quando o Cursor AI recebe as instruções, ele deve:

❌ **NÃO FAZER:**
- Pedir confirmação para começar
- Perguntar se deve criar branch
- Perguntar se deve fazer commit
- Perguntar se deve criar PR
- Esperar aprovação em qualquer etapa

✅ **FAZER:**
- Executar TUDO automaticamente
- Criar branch automaticamente usando MCP
- Fazer commits automaticamente usando MCP
- Criar PRs automaticamente usando MCP
- Atualizar Notion automaticamente usando MCP
- Gerar relatório final

## 📊 Benefícios da Integração

### Antes (Sem MCP GitHub)
```
1. Cursor AI corrige código ✅
2. VOCÊ precisa:
   - Criar branch manualmente
   - Fazer git add/commit manualmente
   - Push manualmente
   - Abrir PR manualmente no GitHub
3. Atualizar Notion manualmente
```

### Depois (Com MCP GitHub)
```
1. POST para API ✅
2. TUDO acontece automaticamente:
   - Cursor AI corrige código ✅
   - Cursor AI cria branch ✅
   - Cursor AI faz commit ✅
   - Cursor AI faz push ✅
   - Cursor AI cria PR ✅
   - Cursor AI atualiza Notion ✅
3. Você só revisa o PR!
```

## 🧪 Testando a Integração

### 1. Teste Simples

```bash
curl -X POST http://localhost:3001/api/bug-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "notionDatabaseUrl": "https://notion.so/...",
    "projectName": "seu-projeto",
    "githubRepo": "username/repo-name",
    "autoCommit": true,
    "strategy": "nao-iniciado"
  }'
```

### 2. Verificar Logs

O Cursor AI deve:
1. ✅ Buscar bugs no Notion
2. ✅ Corrigir o código
3. ✅ Executar comandos MCP do GitHub (você verá nos logs)
4. ✅ Atualizar Notion com link do PR
5. ✅ Gerar relatório com links

### 3. Validar no GitHub

Verifique no repositório:
- ✅ Nova branch criada: `fix/nome-do-bug`
- ✅ Commit com mensagem padronizada
- ✅ PR aberto automaticamente
- ✅ Labels aplicadas: `bug`, `auto-fix`

## 🔧 Troubleshooting

### Problema: MCP GitHub não está disponível

**Solução:**
1. Verifique se o Cursor está atualizado
2. Verifique se o MCP do GitHub está habilitado nas configurações
3. Reinicie o Cursor

### Problema: Erro de permissões

**Solução:**
1. Verifique se o token tem permissões `repo`
2. Recrie o token com permissões corretas
3. Reconfigure o MCP

### Problema: PR não é criado

**Solução:**
1. Verifique se o push foi bem-sucedido
2. Verifique se a branch base existe
3. Verifique os logs do Cursor AI

## 📝 Notas Importantes

1. **Branches Existentes**: Se uma branch já existe, o sistema adiciona novo commit na mesma branch
2. **PRs Existentes**: Se um PR já existe, o sistema adiciona um comentário explicando o novo commit
3. **Conflitos**: Se houver conflitos, o sistema documenta no Notion e pede revisão manual
4. **Testes**: Se testes falharem, commits não são feitos (garantia de qualidade)

## 🎉 Resultado Final

Com a integração completa:

```
1. Você faz POST via Notion Automation/Webhook
2. Bridge recebe e cria instruções
3. Cursor AI executa TUDO automaticamente
4. Você recebe notificação de PR criado
5. Você só precisa revisar e mergear!
```

**100% AUTOMÁTICO - 0% INTERVENÇÃO MANUAL!**

---

**Sistema de Automação Bridge + GitHub MCP - CONFIGURADO ✅**

**Última Atualização:** ${new Date().toISOString()}

