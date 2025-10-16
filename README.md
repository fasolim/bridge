# 🚀 Bridge Metrics - Sistema de Métricas e ML

Sistema completo de métricas e aprendizado de máquina para otimização de resolução de bugs.

## 📁 Estrutura do Projeto (MVC)

```
bridge/
├── src/
│   ├── controllers/          # Controladores (lógica de negócio)
│   │   ├── MetricsController.js
│   │   └── NotionController.js
│   ├── models/              # Modelos de dados (MongoDB)
│   │   ├── BugMetrics.js
│   │   ├── Report.js
│   │   └── MLConfig.js
│   ├── routes/              # Rotas da API
│   │   ├── metrics.js
│   │   └── notion.js
│   ├── services/            # Serviços (lógica de negócio)
│   │   ├── MetricsService.js
│   │   ├── NotionService.js
│   │   └── MLService.js
│   ├── config/              # Configurações
│   │   ├── database.js
│   │   └── notion.js
│   ├── middleware/          # Middleware
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── app.js              # Configuração da aplicação
│   └── server.js           # Servidor principal
├── scripts/                # Scripts utilitários
├── public/                 # Arquivos estáticos
├── docker-compose.yml      # Configuração Docker
└── package.json
```

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env`:
```env
NOTION_TOKEN=seu_token_do_notion
MONGODB_URI=mongodb://localhost:27017/bridge_metrics
PORT=3001
HOST=0.0.0.0
```

### 3. Iniciar o Sistema
```bash
# Iniciar MongoDB
npm run docker:up

# Iniciar API
npm start
```

## 📊 Funcionalidades

### 🎯 Sistema de Métricas
- **Coleta automática** de dados do Notion
- **Classificação inteligente** de bugs (5 níveis)
- **Métricas detalhadas** (tokens, custos, tempo)
- **Relatórios completos** de performance

### 🤖 Aprendizado de Máquina
- **Otimização automática** de prompts
- **Escalação inteligente** de bugs
- **Predição de sucesso** baseada em histórico
- **Learning rate** adaptativo

### 🔄 Integração Notion
- **Sincronização automática** de databases
- **Consumo completo** de dados
- **Mapeamento inteligente** de propriedades
- **Suporte a blocos** e conteúdo rico

## 🌐 API Endpoints

### Métricas
- `GET /api/metrics/dashboard` - Dashboard de estatísticas
- `GET /api/metrics/bugs` - Listar bugs
- `POST /api/metrics/bugs` - Criar bug
- `POST /api/metrics/bugs/:id/attempts` - Adicionar tentativa
- `GET /api/metrics/reports` - Relatórios

### Notion
- `GET /api/notion/test` - Testar conexão
- `GET /api/notion/databases` - Listar databases
- `POST /api/notion/databases/:id/sync` - Sincronizar database
- `POST /api/notion/databases/:id/consume` - Consumir database

## 🎯 Como Usar

### 1. Testar Conexão
```bash
curl http://localhost:3001/api/notion/test
```

### 2. Sincronizar Database
```bash
curl -X POST http://localhost:3001/api/notion/databases/SEU_DATABASE_ID/sync
```

### 3. Ver Dashboard
```bash
curl http://localhost:3001/api/metrics/dashboard
```

## 🔧 Configuração

### Notion
1. Crie uma integração no Notion
2. Compartilhe seu database com a integração
3. Configure o token no `.env`

### MongoDB
- **Docker**: `docker-compose up -d`
- **Local**: Instale MongoDB localmente
- **Cloud**: Use MongoDB Atlas

## 📈 Sistema de Níveis

- **Nível 1**: Bugs simples (typos, estilos)
- **Nível 2**: Bugs intermediários (funções, validações)
- **Nível 3**: Bugs complexos (APIs, integrações)
- **Nível 4**: Bugs críticos (arquitetura, performance)
- **Nível 5**: Bugs extremamente complexos (sistema)

## 🚀 Scripts Disponíveis

```bash
npm start          # Iniciar servidor
npm run dev        # Modo desenvolvimento
npm run test       # Executar testes
npm run docker:up  # Iniciar MongoDB
npm run docker:down # Parar MongoDB
```

## 📊 Exemplo de Uso

```javascript
// Criar bug
const bug = await fetch('/api/metrics/bugs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notionBugId: 'bug-123',
    bugTitle: 'Botão não funciona',
    bugDescription: 'O botão de login não responde'
  })
});

// Adicionar tentativa
await fetch(`/api/metrics/bugs/${bug.id}/attempts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptUsed: 'Analise e corrija o bug...',
    tokensUsed: 1500,
    cost: 0.003,
    executionTime: 120,
    success: true
  })
});
```

## 🎉 Benefícios

- **Métricas detalhadas** de todos os bugs
- **Aprendizado contínuo** de padrões de sucesso
- **Otimização automática** de prompts
- **Escalação inteligente** de bugs complexos
- **Relatórios completos** de performance
- **Predição de custos** e tempo de resolução

---

**🚀 Sistema pronto para otimizar a resolução de bugs com aprendizado de máquina!**