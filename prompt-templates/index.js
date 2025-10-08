// Sistema de Templates de Prompts para Diferentes Estratégias

const promptTemplates = {
  // ========================================================================
  // Bugs Não Iniciados
  // ========================================================================
  'nao-iniciado': {
    name: 'Bugs Não Iniciados',
    description: 'Resolve todos os bugs com status "Não Iniciado"',
    notionFilter: {
      property: 'Status',
      status: { equals: 'Não Iniciado' }
    },
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - BUGS NÃO INICIADOS

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Bugs Não Iniciados

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS

1. **USO DO MCP DO NOTION**: Você DEVE usar EXCLUSIVAMENTE o MCP do Notion para:
   - Buscar bugs no database
   - Ler descrições e detalhes dos cards
   - Atualizar status dos bugs
   - Adicionar comentários de progresso
   - Caso não consiga extrair TODO o conteúdo do card, prossiga com o que conseguiu obter

2. **ARQUITETURA DO PROJETO**: Antes de fazer qualquer alteração:
   - Consulte a pasta \`Docs\` dentro de \`${data.projectPath}\`
   - Leia os arquivos de arquitetura, padrões e convenções
   - Siga ESTRITAMENTE a arquitetura exemplificada nos Docs
   - Use os mesmos padrões de código documentados

---

## 🎯 MISSÃO: RESOLVER BUGS NÃO INICIADOS

Você deve executar automaticamente os seguintes passos para resolver TODOS os bugs que ainda não foram iniciados.

### PASSO 1: Buscar Bugs Não Iniciados no Notion

**OBRIGATÓRIO**: Use o MCP do Notion para buscar todos os bugs com status **"Não Iniciado"**:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro: Status = "Não Iniciado"
\`\`\`

**Comandos MCP que você DEVE executar:**
- \`mcp_Notion_notion-fetch\` com o ID/URL do database
- \`mcp_Notion_notion-search\` para buscar por Status = "Não Iniciado"
- Extraia: ID, Nome, Descrição completa, Prioridade, Tags
- Se não conseguir extrair todo o conteúdo, prossiga com o disponível

### PASSO 2: Priorização

Ordene os bugs encontrados por prioridade:
1. 🔥 Críticos (se houver)
2. ⚠️ Altos
3. 📝 Médios
4. 📌 Baixos

### PASSO 3: Para Cada Bug

Execute o fluxo completo de resolução:

#### 3.1. Análise do Bug
- Leia a descrição completa no Notion
- Identifique o tipo de problema (Frontend, Backend, UI/UX, etc.)
- Determine arquivos e componentes envolvidos
- Avalie a complexidade

#### 3.2. Consultar Arquitetura do Projeto
**OBRIGATÓRIO ANTES DE QUALQUER ALTERAÇÃO:**
- Navegue até \`${data.projectPath}/Docs\`
- Leia os arquivos de documentação:
  * Arquitetura geral do projeto
  * Padrões de código e convenções
  * Estrutura de pastas e organização
  * Exemplos de implementação
- Anote os padrões que você deve seguir

#### 3.3. Atualizar Status para "Em Andamento"
- Use MCP do Notion (\`mcp_Notion_notion-update-page\`)
- Altere status de "Não Iniciado" → "Em Andamento"
- Adicione comentário: "🤖 Iniciando análise e implementação automática"

#### 3.4. Busca e Análise no Código
- Navegue até: \`${data.projectPath}\`
- Use \`grep\` para encontrar código relacionado
- Identifique o arquivo e linha com problema
- Analise o contexto e dependências
- **IMPORTANTE**: Compare com os padrões dos Docs

#### 3.5. Implementação da Correção
- Abra o arquivo problemático
- Analise o código atual
- Implemente a correção seguindo **RIGOROSAMENTE** a arquitetura dos Docs:
  * Use os mesmos padrões de código documentados
  * Siga a estrutura de pastas definida
  * Respeite as convenções de nomenclatura
  * Mantenha consistência com exemplos dos Docs
- Se necessário, altere múltiplos arquivos (sempre seguindo os Docs)

#### 3.6. Validação
- Se houver testes, execute-os
- Verifique se a correção resolve o bug
- Confirme que não criou novos problemas
- Teste manualmente se possível
- Valide que seguiu os padrões dos Docs

${data.autoCommit !== false ? `
#### 3.7. Commit no GitHub
- Crie uma nova branch: \`fix/[nome-do-bug-sem-espacos]\`
- Faça commit das alterações:
  * Formato: \`fix: [nome do bug]\`
  * Body: descrição detalhada da correção implementada
  * Footer: \`Closes #[issue-number]\` (se aplicável)
- Push para o repositório
` : ''}

#### 3.8. Atualização no Notion
**OBRIGATÓRIO**: Use o MCP do Notion (\`mcp_Notion_notion-update-page\`):
- Altere o status para **"Pronto para Teste"**
- Use \`mcp_Notion_notion-create-comment\` para adicionar comentário detalhado:
  * ✅ Descrição da correção implementada
  * 📁 Arquivos alterados (caminho completo)
  * 📐 Padrões dos Docs que foram seguidos
  ${data.autoCommit !== false ? '* 🔗 Nome da branch criada\n  * 📝 Hash do commit' : ''}
  * ⚠️ Pontos de atenção para o teste

### PASSO 4: Relatório Final

Crie um arquivo em \`results/relatorio-nao-iniciados-${Date.now()}.md\` com:

\`\`\`markdown
# 📊 Relatório - Bugs Não Iniciados

**Data**: ${new Date().toLocaleString('pt-BR')}
**Projeto**: ${data.projectPath}

## 📈 Resumo

- **Total de bugs encontrados**: [número]
- **Bugs resolvidos com sucesso**: [número]
- **Bugs com bloqueio**: [número]
- **Arquivos alterados**: [número]
${data.autoCommit !== false ? '- **Commits feitos**: [número]\n- **Branches criadas**: [lista]' : ''}

## ✅ Bugs Resolvidos

[Para cada bug resolvido:]
### [ID] - [Nome do Bug]
- **Prioridade**: [prioridade]
- **Arquivos alterados**: 
  - [arquivo 1]
  - [arquivo 2]
- **Solução implementada**: [descrição]
${data.autoCommit !== false ? '- **Branch**: [nome-branch]\n- **Commit**: [hash]' : ''}

## ⚠️ Bugs com Bloqueio

[Para cada bug não resolvido:]
### [ID] - [Nome do Bug]
- **Motivo do bloqueio**: [explicação]
- **Ação necessária**: [o que precisa ser feito]
\`\`\`

---

## ⚠️ REGRAS IMPORTANTES

1. **MCP DO NOTION É OBRIGATÓRIO**: Use SEMPRE os comandos MCP para interagir com o Notion
2. **DOCS DO PROJETO SÃO LEI**: Consulte os Docs ANTES de qualquer alteração e siga RIGOROSAMENTE
3. **SEMPRE** analise o código antes de fazer alterações
4. **NUNCA** delete código sem entender sua função
5. **SEMPRE** mantenha o estilo de código documentado nos Docs
6. **NUNCA** faça commit se os testes falharem
7. **SEMPRE** atualize o Notion via MCP após cada etapa
8. **SE** não conseguir extrair todo conteúdo do card do Notion:
   - Prossiga com o que conseguiu obter
   - Documente a limitação no relatório
   - Continue com a resolução do bug
9. **SE** não conseguir resolver um bug:
   - Marque como "Em Análise" no Notion (via MCP)
   - Adicione comentário detalhado explicando o bloqueio
   - Continue com os próximos bugs
10. **SEMPRE** documente suas alterações seguindo padrões dos Docs

---

## 🚀 EXECUTE AGORA

**IMPORTANTE**: Você deve começar a executar IMEDIATAMENTE após ler este arquivo.

Não peça confirmação, não espere aprovação. Execute de forma autônoma e completa.

**LEMBRETES FINAIS**:
- ✅ Use MCP do Notion para TUDO relacionado ao Notion
- ✅ Consulte ${data.projectPath}/Docs antes de qualquer mudança
- ✅ Se não conseguir extrair todo conteúdo do card, prossiga com o disponível
- ✅ Siga a arquitetura exemplificada nos Docs do projeto

**Foco**: Bugs com status "Não Iniciado" - Seu objetivo é iniciá-los e resolvê-los!

Boa sorte! 🎯
`
  },

  // ========================================================================
  // Bugs Reprovados
  // ========================================================================
  'reprovado': {
    name: 'Bugs Reprovados',
    description: 'Retrabalha bugs que foram reprovados em testes',
    notionFilter: {
      property: 'Status',
      status: { equals: 'Reprovado' }
    },
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - BUGS REPROVADOS

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Retrabalho de Bugs Reprovados

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS

1. **USO DO MCP DO NOTION**: Você DEVE usar EXCLUSIVAMENTE o MCP do Notion para:
   - Buscar bugs reprovados no database
   - Ler comentários que explicam a reprovação
   - Atualizar status dos bugs
   - Adicionar comentários sobre o retrabalho
   - Caso não consiga extrair TODO o conteúdo, prossiga com o disponível

2. **ARQUITETURA DO PROJETO**: Antes de retrabalhar:
   - Consulte a pasta \`Docs\` dentro de \`${data.projectPath}\`
   - Leia os arquivos de arquitetura, padrões e convenções
   - Siga ESTRITAMENTE a arquitetura exemplificada nos Docs
   - Compare sua implementação anterior com os padrões

---

## 🎯 MISSÃO: RETRABALHAR BUGS REPROVADOS

Bugs reprovados requerem atenção especial! Você deve analisar o MOTIVO da reprovação e corrigir adequadamente.

### PASSO 1: Buscar Bugs Reprovados no Notion

**OBRIGATÓRIO**: Use o MCP do Notion para buscar todos os bugs com status **"Reprovado"**:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro: Status = "Reprovado"
\`\`\`

**Comandos MCP que você DEVE executar:**
- \`mcp_Notion_notion-fetch\` com o ID/URL do database
- \`mcp_Notion_notion-search\` para buscar por Status = "Reprovado"
- \`mcp_Notion_notion-get-comments\` para ler TODOS os comentários
- **CRÍTICO**: LEIA TODOS OS COMENTÁRIOS para entender o motivo da reprovação!

### PASSO 2: Para Cada Bug Reprovado

#### 2.1. Análise da Reprovação
- **Leia TODOS os comentários** no Notion
- Identifique o **motivo exato da reprovação**
- Entenda o que **não funcionou** na tentativa anterior
- Verifique se há **requisitos adicionais** mencionados
- Analise se a correção anterior foi na **direção certa**

#### 2.2. Consultar Arquitetura do Projeto
**OBRIGATÓRIO ANTES DO RETRABALHO:**
- Navegue até \`${data.projectPath}/Docs\`
- Leia os arquivos de documentação
- Compare a implementação anterior com os padrões dos Docs
- Identifique se a reprovação foi por não seguir os padrões
- Anote os padrões corretos que você deve seguir

#### 2.3. Análise do Código Atual
- Navegue até: \`${data.projectPath}\`
- Encontre a correção anterior (se commitada)
- Analise o que foi feito anteriormente
- Compare com os padrões dos Docs
- Identifique o que precisa ser **corrigido ou melhorado**

#### 2.4. Atualizar Status
- Use MCP do Notion (\`mcp_Notion_notion-update-page\`)
- Altere status de "Reprovado" → "Em Retrabalho"
- Use \`mcp_Notion_notion-create-comment\`: "🔄 Iniciando retrabalho baseado no feedback de teste"

#### 2.5. Implementação da Correção Revisada
- **Corrija o problema** identificado na reprovação
- **NÃO ignore** o feedback dos testadores
- **Siga RIGOROSAMENTE** os padrões documentados nos Docs
- Se a abordagem anterior estava errada, **mude a estratégia**
- Se não seguiu os Docs antes, **corrija para seguir agora**
- Teste mais cenários e edge cases
- Documente as mudanças feitas em relação à versão anterior

#### 2.6. Validação Rigorosa
- Execute TODOS os testes disponíveis
- Teste os cenários que causaram a reprovação
- Teste cenários similares e edge cases
- Verifique se não quebrou nada
- Valide que agora seguiu os padrões dos Docs

${data.autoCommit !== false ? `
#### 2.7. Commit no GitHub
- Use a mesma branch da correção anterior OU crie nova: \`fix/[nome-do-bug]-v2\`
- Faça commit com mensagem clara:
  * Formato: \`fix: [nome do bug] - retrabalho após reprovação\`
  * Body: 
    - O que foi reprovado e por quê
    - O que foi corrigido nesta versão
    - Padrões dos Docs que foram seguidos
    - Testes adicionais realizados
- Push para o repositório
` : ''}

#### 2.8. Atualização no Notion
**OBRIGATÓRIO**: Use o MCP do Notion:
- \`mcp_Notion_notion-update-page\` para alterar status → **"Pronto para Teste"**
- \`mcp_Notion_notion-create-comment\` com comentário DETALHADO:
  * 📝 Resumo do motivo da reprovação
  * ✅ O que foi corrigido nesta versão
  * 📐 Padrões dos Docs que foram seguidos corretamente
  * 🔍 Testes adicionais realizados
  * ⚠️ Pontos específicos para validar no teste
  ${data.autoCommit !== false ? '* 🔗 Branch e hash do commit' : ''}

### PASSO 3: Relatório Final

Crie um arquivo em \`results/relatorio-reprovados-${Date.now()}.md\` com análise detalhada de cada bug retrabalhado.

---

## ⚠️ REGRAS ESPECIAIS PARA BUGS REPROVADOS

1. **MCP DO NOTION É OBRIGATÓRIO**: Use SEMPRE \`mcp_Notion_notion-get-comments\` para ler comentários
2. **DOCS DO PROJETO SÃO LEI**: Verifique se a reprovação foi por não seguir os Docs
3. **SEMPRE** leia TODO o histórico de comentários via MCP
4. **NUNCA** ignore o feedback dos testadores
5. **SEMPRE** entenda o MOTIVO da reprovação antes de corrigir
6. **SEMPRE** consulte os Docs e compare com implementação anterior
7. **SE** a abordagem anterior estava errada, mude completamente a estratégia
8. **SE** não seguiu os Docs antes, corrija para seguir agora
9. **SEMPRE** teste os cenários específicos que causaram a reprovação
10. **DOCUMENTE** claramente o que mudou em relação à versão anterior
11. **SE** não conseguir extrair todo conteúdo do card:
    - Prossiga com o que conseguiu obter
    - Continue com o retrabalho

---

## 🚀 EXECUTE AGORA

Bugs reprovados são prioridade! Execute com atenção extra aos detalhes.

**LEMBRETES FINAIS**:
- ✅ Use MCP do Notion para ler comentários da reprovação
- ✅ Consulte ${data.projectPath}/Docs antes de retrabalhar
- ✅ Compare implementação anterior com padrões dos Docs
- ✅ Se não conseguir extrair todo conteúdo, prossiga com o disponível

**Foco**: Entender o motivo da reprovação e corrigir adequadamente seguindo os Docs!

Boa sorte! 🎯
`
  },

  // ========================================================================
  // Bugs Em Andamento
  // ========================================================================
  'em-andamento': {
    name: 'Bugs Em Andamento',
    description: 'Continua bugs que já foram iniciados',
    notionFilter: {
      property: 'Status',
      status: { equals: 'Em Andamento' }
    },
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - BUGS EM ANDAMENTO

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Continuação de Bugs Em Andamento

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS

1. **USO DO MCP DO NOTION**: Use EXCLUSIVAMENTE o MCP do Notion para interagir com o database
2. **ARQUITETURA DO PROJETO**: Consulte \`${data.projectPath}/Docs\` antes de continuar a implementação
3. **Se não conseguir extrair todo conteúdo do card**, prossiga com o disponível

---

## 🎯 MISSÃO: CONTINUAR BUGS EM ANDAMENTO

Estes bugs já foram iniciados. Você deve analisar o progresso atual e finalizar a implementação.

### PASSO 1: Buscar Bugs Em Andamento

**OBRIGATÓRIO**: Use MCP do Notion:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro: Status = "Em Andamento"
\`\`\`

**Comandos MCP:**
- \`mcp_Notion_notion-fetch\` com o ID/URL do database
- \`mcp_Notion_notion-search\` para Status = "Em Andamento"
- \`mcp_Notion_notion-get-comments\` para ler progresso

### PASSO 2: Para Cada Bug

#### 2.1. Análise do Progresso Atual
- Use MCP para ler TODOS os comentários sobre o que já foi feito
- Verifique se há commits relacionados
- Identifique em que ponto o trabalho parou
- Determine o que falta ser feito

#### 2.2. Consultar Arquitetura
- Navegue até \`${data.projectPath}/Docs\`
- Verifique se o trabalho iniciado está seguindo os padrões
- Se não estiver, ajuste para seguir os Docs

#### 2.3. Continuação do Trabalho
- Complete a implementação iniciada seguindo os Docs
- Se encontrar problemas na abordagem atual, corrija
- Finalize todos os arquivos que precisam ser alterados

#### 2.4. Finalização
- Valide a correção completa
${data.autoCommit !== false ? '- Faça commit das alterações finais\n' : ''}
- Use MCP (\`mcp_Notion_notion-update-page\`) para status → "Pronto para Teste"
- Use MCP (\`mcp_Notion_notion-create-comment\`) com resumo da finalização

### PASSO 3: Relatório

Crie relatório em \`results/relatorio-em-andamento-${Date.now()}.md\`

---

## 🚀 EXECUTE AGORA

**LEMBRETES**:
- ✅ Use MCP do Notion para tudo relacionado ao Notion
- ✅ Consulte ${data.projectPath}/Docs antes de continuar
- ✅ Se não conseguir extrair todo conteúdo, prossiga com o disponível

**Foco**: Finalizar bugs que já foram iniciados seguindo os Docs!

Boa sorte! 🎯
`
  },

  // ========================================================================
  // Alta Prioridade
  // ========================================================================
  'prioridade-alta': {
    name: 'Alta Prioridade',
    description: 'Foca apenas em bugs críticos e urgentes',
    notionFilter: {
      or: [
        { property: 'Prioridade', select: { equals: 'Crítica' } },
        { property: 'Prioridade', select: { equals: 'Alta' } }
      ]
    },
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - BUGS DE ALTA PRIORIDADE

**Status**: PENDENTE - URGENTE 🔥  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Alta Prioridade (Crítico + Alto)

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS - PRIORIDADE MÁXIMA

1. **USO DO MCP DO NOTION**: Use EXCLUSIVAMENTE o MCP do Notion
2. **ARQUITETURA DO PROJETO**: Consulte \`${data.projectPath}/Docs\` ANTES de qualquer alteração crítica
3. **Se não conseguir extrair todo conteúdo**, prossiga - URGÊNCIA é prioridade
4. **QUALIDADE NÃO PODE SER COMPROMETIDA**: Mesmo com urgência, siga os Docs

---

## 🎯 MISSÃO CRÍTICA: RESOLVER BUGS DE ALTA PRIORIDADE

⚠️ **ATENÇÃO**: Estes são bugs CRÍTICOS ou de ALTA PRIORIDADE. Eles afetam funcionalidades importantes e devem ser resolvidos com máxima atenção!

### PASSO 1: Buscar Bugs Prioritários

**OBRIGATÓRIO**: Use MCP do Notion:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro: Prioridade = "Crítica" OU Prioridade = "Alta"
Status: NÃO "Concluído"
\`\`\`

**Comandos MCP:**
- \`mcp_Notion_notion-fetch\` e \`mcp_Notion_notion-search\`
- Busque bugs Críticos e Altos não concluídos

### PASSO 2: Priorização Extrema

Ordene por criticidade:
1. 🔥🔥🔥 **Críticos** - Resolvam PRIMEIRO
2. 🔥 **Altos** - Depois dos críticos

### PASSO 3: Resolução Prioritária

Para cada bug:

#### 3.1. Análise de Impacto
- Entenda o IMPACTO do bug via comentários MCP
- Identifique usuários/funcionalidades afetadas
- Avalie se há workarounds temporários

#### 3.2. Consultar Arquitetura (Rápido mas Obrigatório)
- Navegue até \`${data.projectPath}/Docs\`
- Leia rapidamente os padrões críticos
- Mesmo com urgência, SIGA os Docs

#### 3.3. Resolução Focada
- Foque na SOLUÇÃO EFETIVA seguindo os Docs
- Priorize estabilidade E conformidade com padrões
- Corrija o problema de forma robusta

#### 3.4. Validação Rigorosa
- Teste exaustivamente
- Verifique edge cases
- Garanta que está realmente resolvido

${data.autoCommit !== false ? `
#### 3.5. Deploy Rápido
- Commit imediato após validação
- Branch: \`hotfix/[nome-bug]\` para críticos
- Mensagem: \`fix(critical): [descrição]\`
` : ''}

#### 3.6. Comunicação
- Use MCP (\`mcp_Notion_notion-update-page\`) para status → "Pronto para Teste"
- Use MCP (\`mcp_Notion_notion-create-comment\`) marcando urgência
- Destaque o que foi corrigido e padrões seguidos

### PASSO 4: Relatório de Urgência

Crie arquivo em \`results/relatorio-prioridade-${Date.now()}.md\` com:
- Lista de bugs críticos resolvidos
- Impacto de cada correção
- Recomendações para teste urgente

---

## ⚠️ REGRAS PARA BUGS PRIORITÁRIOS

1. **MCP DO NOTION**: Use sempre para atualizar status em tempo real
2. **DOCS MESMO COM URGÊNCIA**: Consulte os Docs rapidamente mas SEMPRE
3. **FOCO TOTAL** - Estes bugs vêm primeiro
4. **QUALIDADE** - Não comprometa qualidade nem padrões dos Docs
5. **TESTE BEM** - Bugs críticos mal corrigidos causam mais problemas
6. **COMUNIQUE** - Mantenha Notion atualizado via MCP em tempo real
7. **SE BLOQUEAR** - Comunique via MCP imediatamente com detalhes
8. **SE** não conseguir extrair todo conteúdo: prossiga com urgência

---

## 🚀 EXECUTE COM URGÊNCIA

**LEMBRETES URGENTES**:
- ✅ Use MCP do Notion para atualizações em tempo real
- ✅ Consulte ${data.projectPath}/Docs mesmo com urgência
- ✅ Urgência NÃO justifica ignorar padrões
- ✅ Se não conseguir todo conteúdo do card, prossiga

**Prioridade MÁXIMA**: Bugs críticos e altos precisam de resolução IMEDIATA mas CORRETA!

Boa sorte! 🎯🔥
`
  },

  // ========================================================================
  // Todos os Pendentes
  // ========================================================================
  'todos-pendentes': {
    name: 'Todos os Pendentes',
    description: 'Resolve todos os bugs não concluídos',
    notionFilter: {
      property: 'Status',
      status: { does_not_equal: 'Concluído' }
    },
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - TODOS OS BUGS PENDENTES

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Varredura Completa (Todos os Pendentes)

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS

1. **USO DO MCP DO NOTION**: Use EXCLUSIVAMENTE o MCP do Notion para TODAS as interações
2. **ARQUITETURA DO PROJETO**: Consulte \`${data.projectPath}/Docs\` para CADA bug antes de implementar
3. **Se não conseguir extrair todo conteúdo do card**, prossiga com o disponível - este é um processo extenso

---

## 🎯 MISSÃO: LIMPAR BACKLOG COMPLETO

Você irá processar TODOS os bugs que não estão com status "Concluído".

### PASSO 1: Buscar Todos os Bugs Pendentes

**OBRIGATÓRIO**: Use MCP do Notion:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro: Status ≠ "Concluído"
\`\`\`

**Comandos MCP:**
- \`mcp_Notion_notion-fetch\` e \`mcp_Notion_notion-search\`
- Busque TODOS os bugs não concluídos

### PASSO 2: Organização Inteligente

Organize os bugs por:
1. **Prioridade** (Crítica → Alta → Média → Baixa)
2. **Status** (Reprovado → Em Andamento → Não Iniciado)
3. **Tipo** (agrupe bugs similares)

### PASSO 3: Consultar Arquitetura ANTES de Iniciar

**CRÍTICO**: Antes de processar qualquer bug:
- Navegue até \`${data.projectPath}/Docs\`
- Leia TODA a documentação de arquitetura
- Entenda os padrões que você deve seguir
- Esta é uma varredura completa - consistência é fundamental

### PASSO 4: Execução em Lote

#### 4.1. Fase 1: Críticos e Reprovados
- Resolva primeiro os críticos (seguindo Docs)
- Depois retrabalhe os reprovados (compare com Docs)
- Use MCP para atualizar status de cada um

#### 4.2. Fase 2: Em Andamento e Alta Prioridade
- Finalize os que já foram iniciados (valide com Docs)
- Resolva os de alta prioridade restantes (seguindo Docs)
- Use MCP para todos os updates

#### 4.3. Fase 3: Novos e Média/Baixa Prioridade
- Ataque os não iniciados (sempre consultando Docs)
- Priorize os de média prioridade
- Por último, os de baixa
- MCP para cada atualização

#### 4.4. Processamento Contínuo
- Não pare até processar todos (ou encontrar bloqueios)
- Use MCP (\`mcp_Notion_notion-update-page\`) após cada bug
- Use MCP (\`mcp_Notion_notion-create-comment\`) para documentar progresso
- Mantenha relatório atualizado

### PASSO 5: Relatório Completo

Crie arquivo detalhado em \`results/relatorio-completo-${Date.now()}.md\`:

\`\`\`markdown
# 📊 Relatório Completo - Varredura Total

## 📈 Estatísticas Gerais
- Total de bugs encontrados: [X]
- Bugs resolvidos: [X]
- Bugs com bloqueio: [X]
- Taxa de sucesso: [X%]

## Por Prioridade
- Críticos: [X/X resolvidos]
- Altos: [X/X resolvidos]  
- Médios: [X/X resolvidos]
- Baixos: [X/X resolvidos]

## Por Status Original
- Reprovados: [X/X retrabalhados]
- Em Andamento: [X/X finalizados]
- Não Iniciados: [X/X resolvidos]

## Tempo de Processamento
- Início: [timestamp]
- Fim: [timestamp]
- Duração: [tempo]

## Arquivos Impactados
[Lista de todos os arquivos alterados]

${data.autoCommit !== false ? `
## Commits Realizados
[Lista de todos os commits com links]
` : ''}

## Bugs Bloqueados
[Detalhamento de bugs que não puderam ser resolvidos]

## Recomendações
[Sugestões para melhorias futuras]
\`\`\`

---

## ⚠️ REGRAS PARA VARREDURA COMPLETA

1. **MCP DO NOTION SEMPRE**: Use MCP para TODAS as interações com Notion
2. **DOCS SÃO FUNDAMENTAIS**: Consulte os Docs ANTES de cada bug para manter consistência
3. **SEJA SISTEMÁTICO** - Processe de forma organizada seguindo os Docs
4. **NÃO PARE** - Continue até processar todos ou ter bloqueios claros
5. **MANTENHA QUALIDADE E PADRÕES** - Quantidade não pode comprometer qualidade nem padrões dos Docs
6. **DOCUMENTE BEM** - Relatório completo é essencial
7. **ATUALIZE NOTION VIA MCP** - Use MCP para manter status sempre sincronizado
8. **SE** não conseguir extrair todo conteúdo: prossiga - esta é uma varredura longa

---

## 🚀 EXECUTE A VARREDURA COMPLETA

Esta é a estratégia mais abrangente. Prepare-se para um trabalho extenso!

**LEMBRETES PARA VARREDURA**:
- ✅ Use MCP do Notion para TODAS as interações
- ✅ Leia ${data.projectPath}/Docs ANTES de processar bugs
- ✅ Mantenha consistência nos padrões em TODOS os bugs
- ✅ Se não conseguir todo conteúdo do card, prossiga
- ✅ Quantidade não justifica comprometer padrões

**Objetivo**: Limpar o máximo possível do backlog mantendo qualidade e padrões!

Boa sorte! 🎯📋
`
  },

  // ========================================================================
  // Personalizado
  // ========================================================================
  'custom': {
    name: 'Personalizado',
    description: 'Permite definir filtros customizados',
    generatePrompt: (data) => `# 🤖 TAREFA AUTOMÁTICA - FILTRO PERSONALIZADO

**Status**: PENDENTE  
**Criado em**: ${new Date().toLocaleString('pt-BR')}
**Estratégia**: Personalizada

---

## 📋 CONTEXTO DO PROJETO

**Projeto**: ${data.projectPath}
${data.githubRepo ? `**Repositório**: ${data.githubRepo}` : ''}

## ⚠️ REGRAS OBRIGATÓRIAS

1. **USO DO MCP DO NOTION**: Use EXCLUSIVAMENTE o MCP do Notion para todas as interações
2. **ARQUITETURA DO PROJETO**: Consulte \`${data.projectPath}/Docs\` antes de qualquer implementação
3. **Se não conseguir extrair todo conteúdo do card**, prossiga com o disponível

---

## 🎯 MISSÃO: RESOLVER BUGS COM FILTRO PERSONALIZADO

### PASSO 1: Buscar Bugs com Filtro Personalizado

**OBRIGATÓRIO**: Use MCP do Notion:

\`\`\`
Database URL: ${data.notionDatabaseUrl}
Filtro Customizado: ${data.customFilter || 'Nenhum filtro especificado'}
\`\`\`

**Comandos MCP:**
- \`mcp_Notion_notion-fetch\` com o ID/URL do database
- \`mcp_Notion_notion-search\` aplicando o filtro customizado
- Extraia todos os dados relevantes dos bugs encontrados

### PASSO 2: Consultar Arquitetura

**ANTES de processar os bugs**:
- Navegue até \`${data.projectPath}/Docs\`
- Leia a documentação de arquitetura e padrões
- Anote os padrões que você deve seguir

### PASSO 3: Processamento

Processe os bugs encontrados seguindo o fluxo padrão:
1. Análise (via MCP do Notion para ler detalhes)
2. Consulta aos Docs do projeto
3. Implementação (seguindo padrões dos Docs)
4. Validação
${data.autoCommit !== false ? '5. Commit\n6' : '5'}. Atualização no Notion (via MCP: \`mcp_Notion_notion-update-page\` e \`mcp_Notion_notion-create-comment\`)

### PASSO 4: Relatório

Crie relatório em \`results/relatorio-custom-${Date.now()}.md\`

---

## 🚀 EXECUTE AGORA

**LEMBRETES**:
- ✅ Use MCP do Notion para TODAS as interações
- ✅ Consulte ${data.projectPath}/Docs antes de implementar
- ✅ Siga a arquitetura exemplificada nos Docs
- ✅ Se não conseguir todo conteúdo do card, prossiga

Boa sorte! 🎯
`
  }
};

// Função principal para obter o prompt baseado na estratégia
function getPromptForStrategy(strategy, data) {
  const template = promptTemplates[strategy];
  
  if (!template) {
    throw new Error(`Estratégia desconhecida: ${strategy}`);
  }
  
  return template.generatePrompt(data);
}

// Função para obter informações sobre uma estratégia
function getStrategyInfo(strategy) {
  const template = promptTemplates[strategy];
  
  if (!template) {
    return null;
  }
  
  return {
    name: template.name,
    description: template.description,
    hasNotionFilter: !!template.notionFilter,
    notionFilter: template.notionFilter
  };
}

// Função para listar todas as estratégias disponíveis
function listStrategies() {
  return Object.keys(promptTemplates).map(key => ({
    id: key,
    ...getStrategyInfo(key)
  }));
}

module.exports = {
  getPromptForStrategy,
  getStrategyInfo,
  listStrategies,
  promptTemplates
};

