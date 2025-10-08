# 🌐 Interface Web do Bridge

A nova interface web do Bridge permite configurar e executar tarefas de resolução de bugs sem precisar usar o Postman ou fazer requisições manuais!

## 🚀 Como Acessar

1. **Inicie o servidor:**
   ```bash
   npm start
   ```

2. **Acesse no navegador:**
   - Local: `http://localhost:3001`
   - Rede: `http://SEU_IP:3001`

A interface web será aberta automaticamente!

## 🎯 Estratégias Disponíveis

A interface oferece 6 estratégias diferentes para resolução de bugs:

### 1. 🚀 Bugs Não Iniciados
- **Descrição**: Resolve todos os bugs com status "Não Iniciado"
- **Ideal para**: Começar a trabalhar em bugs novos
- **Ação**: Busca bugs não iniciados, implementa correções e marca como "Pronto para Teste"

### 2. 🔄 Bugs Reprovados
- **Descrição**: Retrabalha bugs que foram reprovados em testes
- **Ideal para**: Corrigir bugs que não passaram nos testes
- **Ação**: Analisa o motivo da reprovação, corrige e reenvia para teste
- **Diferencial**: Lê TODOS os comentários para entender o feedback dos testadores

### 3. ⚡ Bugs Em Andamento
- **Descrição**: Continua bugs que já foram iniciados
- **Ideal para**: Finalizar trabalhos incompletos
- **Ação**: Analisa o progresso atual e completa a implementação

### 4. 🔥 Alta Prioridade
- **Descrição**: Foca apenas em bugs críticos e urgentes
- **Ideal para**: Resolver problemas críticos rapidamente
- **Ação**: Prioriza bugs marcados como "Crítica" ou "Alta" prioridade
- **Diferencial**: Tratamento especial para bugs críticos com validação rigorosa

### 5. 📋 Todos os Pendentes
- **Descrição**: Resolve todos os bugs não concluídos
- **Ideal para**: Fazer uma varredura completa no backlog
- **Ação**: Processa TODOS os bugs que não estão com status "Concluído"
- **Diferencial**: Organiza por prioridade e status automaticamente

### 6. ⚙️ Personalizado
- **Descrição**: Define filtros customizados no Notion
- **Ideal para**: Necessidades específicas
- **Ação**: Permite definir filtros Notion personalizados
- **Exemplo**: `Status = "Em Revisão" AND Prioridade = "Média"`

## 📋 Como Usar

### Passo 1: Selecione a Estratégia
Clique na estratégia desejada. A card ficará destacada em roxo quando selecionada.

### Passo 2: Configure o Projeto

#### Campos Obrigatórios:
- **URL do Database do Notion**: Cole a URL completa do seu database de bugs
- **Projeto**: Selecione o projeto da lista (carregada automaticamente)

#### Campos Opcionais:
- **Sub-projeto**: Se seu projeto tem sub-pastas (ex: backend/frontend), selecione aqui
- **Contexto do Projeto**: Informações sobre tecnologias, padrões, arquitetura
- **Repositório GitHub**: URL do repositório (para referência)
- **Filtro Personalizado**: Apenas visível quando a estratégia "Personalizado" está selecionada

#### Checkbox:
- **Fazer commit automático no GitHub**: Marque para fazer commits automaticamente após cada correção

### Passo 3: Execute!
Clique em **"Iniciar Resolução Automática"** e aguarde!

## 📊 Visualização de Resultados

Após enviar a requisição, você verá:

### ✅ Sucesso
- Confirmação de tarefa criada
- ID da tarefa gerada
- Próximos passos (automaticamente o Cursor será aberto)

### 📋 Tarefas Recentes
A seção "Tarefas Recentes" mostra as últimas 10 tarefas executadas com:
- ID da tarefa
- Status (Pendente, Em Progresso, Concluído)
- Projeto/Sub-projeto
- Data e hora

## 🎨 Recursos da Interface

### Design Moderno
- Interface dark mode profissional
- Cores gradientes e animações suaves
- Responsivo (funciona em mobile)

### Indicador de Status
- Bolinha verde pulsante: Conectado
- Bolinha amarela: Conectado com erros
- Bolinha vermelha: Desconectado

### Atualização Automática
- Botão "🔄 Atualizar" para recarregar tarefas
- Verificação de conexão a cada 30 segundos

## 🔧 Diferenças dos Prompts

Cada estratégia usa um **prompt diferente e otimizado** para seu propósito:

### Bugs Não Iniciados
```
- Foca em iniciar bugs do zero
- Prioriza por criticidade
- Atualiza status de "Não Iniciado" → "Em Andamento" → "Pronto para Teste"
```

### Bugs Reprovados
```
- Lê TODO o histórico de comentários
- Analisa o motivo da reprovação
- Se necessário, muda completamente a abordagem
- Documenta o que mudou em relação à versão anterior
```

### Alta Prioridade
```
- Processa PRIMEIRO os críticos, depois os altos
- Validação extra rigorosa
- Usa branches do tipo hotfix/ para críticos
- Enfatiza comunicação e urgência
```

### Todos os Pendentes
```
- Organiza bugs por prioridade E status
- Processa em fases (Críticos → Em Andamento → Novos)
- Gera relatório completo com estatísticas
```

## 📡 API Endpoints

A interface web usa os seguintes endpoints:

```bash
GET  /                          # Interface web
GET  /api/projects              # Lista projetos disponíveis
GET  /api/strategies            # Lista estratégias disponíveis
GET  /api/tasks                 # Lista tarefas executadas
GET  /api/results               # Lista relatórios gerados
POST /api/bug-resolver          # Cria nova tarefa de resolução
```

## 🔄 Compatibilidade com Postman

A API continua compatível com requisições via Postman! Agora com suporte ao campo `strategy`:

```json
{
  "notionDatabaseUrl": "https://notion.so/workspace/database-id",
  "projectName": "syntra",
  "subProject": "back",
  "projectContext": "Backend NestJS",
  "strategy": "nao-iniciado",
  "autoCommit": true
}
```

**Valores possíveis para `strategy`:**
- `nao-iniciado`
- `reprovado`
- `em-andamento`
- `prioridade-alta`
- `todos-pendentes`
- `custom` (requer campo `customFilter`)

## 🎯 Dicas de Uso

### Para Começar um Sprint
Use **"Bugs Não Iniciados"** para pegar os bugs novos do backlog.

### Para Retrabalho
Use **"Bugs Reprovados"** para corrigir bugs que não passaram no teste.

### Para Emergências
Use **"Alta Prioridade"** para focar apenas em bugs críticos.

### Para Limpar o Backlog
Use **"Todos os Pendentes"** no final da sprint para resolver tudo que ficou pendente.

### Para Casos Específicos
Use **"Personalizado"** com filtros Notion customizados.

## 📝 Estrutura de Arquivos

```
bridge/
├── public/                    # Interface Web
│   ├── index.html            # HTML principal
│   ├── styles.css            # Estilos
│   └── app.js                # JavaScript frontend
├── prompt-templates/          # Sistema de Templates
│   └── index.js              # Templates de prompts por estratégia
├── server.js                 # Servidor Express
└── tasks/                    # Tarefas geradas
    └── task-XXX-INSTRUCTIONS.md
```

## 🚀 Próximos Passos

Após clicar em "Iniciar Resolução Automática":

1. ✅ **Servidor cria a tarefa** com o prompt adequado à estratégia
2. 🤖 **Cursor abre automaticamente** o arquivo de instruções
3. 💬 **Mensagem é enviada** automaticamente para o chat (via PowerShell)
4. ⚡ **Cursor AI executa** de forma autônoma seguindo as instruções
5. 📊 **Relatório é gerado** em `results/` ao final

## 🎉 Pronto!

Agora você tem uma interface profissional para gerenciar a resolução automática de bugs!

**Não precisa mais usar Postman ou fazer requisições manuais!** 🚀

