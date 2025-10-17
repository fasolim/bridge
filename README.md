# 🚀 Bridge - Sistema de Métricas e Integração Notion

Sistema automatizado de ponte entre Notion e projetos locais via Cursor AI, com foco em métricas de bugs e aprendizado de máquina.

## 📋 Funcionalidades

- ✅ **Integração Notion**: Extração automática de bugs via MCP
- ✅ **Métricas ML**: Análise de complexidade e predição de sucesso
- ✅ **Dashboard**: Interface web para visualização de métricas
- ✅ **API REST**: Endpoints para integração e automação
- ✅ **MongoDB**: Armazenamento estruturado de dados

## 🏗️ Estrutura do Projeto

```
bridge/
├── src/                    # Código fonte principal
│   ├── config/            # Configurações (database, notion)
│   ├── controllers/       # Controladores da API
│   ├── middleware/        # Middlewares (error, logger)
│   ├── models/           # Modelos MongoDB (BugMetrics, MLConfig, Report)
│   ├── routes/           # Rotas da API
│   ├── services/         # Serviços (Metrics, ML, Notion)
│   ├── app.js            # Configuração Express
│   └── server.js         # Servidor principal
├── scripts/              # Scripts de processamento
│   ├── process-notion-bugs.js    # Processamento de bugs do Notion
│   ├── git-metrics-collector.js  # Coleta de métricas Git
│   └── ml-learning-system.js     # Sistema de ML
├── public/               # Interface web
│   ├── index.html        # Página principal
│   ├── app.js           # JavaScript frontend
│   └── styles.css       # Estilos CSS
├── mongo-init/          # Inicialização MongoDB
│   └── init-metrics.js  # Script de setup do banco
├── notion-data/         # Dados extraídos do Notion
│   └── extracted-bugs-report.md  # Relatório de bugs
├── results/             # Relatórios gerados
│   └── relatorio-integracao-notion-*.md
├── docker-compose.yml   # Configuração Docker
├── Dockerfile          # Imagem Docker
└── package.json        # Dependências e scripts
```

## 🚀 Instalação e Uso

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env`:
```env
NOTION_TOKEN=seu_token_notion
MONGODB_URI=mongodb://bridge_user:bridge_password@localhost:27017/bridge_metrics
PORT=3001
HOST=0.0.0.0
```

### 3. Iniciar com Docker
```bash
npm run docker:up
```

### 4. Iniciar Localmente
```bash
npm run dev
```

## 📊 Scripts Disponíveis

- `npm start` - Iniciar servidor em produção
- `npm run dev` - Iniciar servidor em desenvolvimento
- `npm run process:notion` - Processar bugs do Notion
- `npm run collect:git` - Coletar métricas Git
- `npm run ml:learn` - Executar aprendizado de máquina
- `npm run docker:up` - Subir containers Docker
- `npm run docker:down` - Parar containers Docker
- `npm run docker:logs` - Ver logs dos containers

## 🌐 API Endpoints

### Notion
- `GET /api/notion/test` - Testar conexão com Notion
- `GET /api/notion/databases` - Listar databases disponíveis
- `POST /api/notion/process-link` - Processar link do Notion

### Métricas
- `GET /api/metrics/bugs` - Listar todos os bugs
- `GET /api/metrics/dashboard` - Dashboard de métricas
- `GET /api/health` - Status da API

## 🎯 Interface Web

Acesse `http://localhost:3001` para:
- Testar integração com Notion
- Visualizar métricas em tempo real
- Executar testes do sistema
- Monitorar dashboard de bugs

## 🧠 Machine Learning

O sistema inclui:
- **Análise de Complexidade**: Determinação automática de níveis de bug
- **Predição de Sucesso**: Algoritmos para prever resolução
- **Otimização de Prompts**: Melhoria baseada em histórico
- **Escalação Automática**: Identificação de bugs críticos

## 📈 Métricas Coletadas

- **Bugs**: Título, descrição, status, nível de complexidade
- **Tentativas**: Prompts usados, tokens, custo, tempo de execução
- **Git**: Commits, PRs, branches relacionadas
- **ML**: Features, probabilidade de sucesso, histórico de aprendizado

## 🔧 Configuração MongoDB

O sistema cria automaticamente:
- Database: `bridge_metrics`
- Collections: `bugmetrics`, `reports`, `mlconfigs`
- Usuário: `bridge_user` com senha `bridge_password`
- Índices otimizados para performance

## 📝 Licença

MIT License - Bridge Team

---

**Versão**: 2.0.0  
**Última Atualização**: 2025-10-17