# 🏗️ Arquitetura Bridge - Padrão MVC

## 📋 Visão Geral

O Bridge segue uma arquitetura MVC (Model-View-Controller) bem definida e modular, facilitando manutenção e escalabilidade.

## 📁 Estrutura de Pastas

```
bridge/
├── app/                    # 🎯 Aplicação Principal
│   ├── models/            # 📊 Modelos de Dados (MongoDB)
│   │   ├── BugMetrics.js  # Modelo de métricas de bugs
│   │   ├── MLConfig.js    # Configurações de ML
│   │   └── Report.js      # Modelo de relatórios
│   ├── views/             # 🖥️ Views (Frontend)
│   │   ├── index.html     # Página principal
│   │   ├── app.js         # JavaScript frontend
│   │   └── styles.css     # Estilos CSS
│   ├── controllers/       # 🎮 Controladores
│   │   ├── MetricsController.js  # Lógica de métricas
│   │   └── NotionController.js   # Lógica do Notion
│   ├── services/          # ⚙️ Serviços de Negócio
│   │   ├── MetricsService.js     # Serviço de métricas
│   │   ├── MLService.js          # Serviço de ML
│   │   └── NotionService.js      # Serviço do Notion
│   ├── middleware/        # 🔧 Middlewares
│   │   ├── errorHandler.js       # Tratamento de erros
│   │   └── logger.js             # Sistema de logs
│   ├── config/            # ⚙️ Configurações
│   │   ├── database.js           # Config do MongoDB
│   │   └── notion.js             # Config do Notion
│   ├── routes/            # 🛣️ Rotas da API
│   │   ├── metrics.js            # Rotas de métricas
│   │   └── notion.js             # Rotas do Notion
│   ├── app.js             # 🚀 Configuração Express
│   └── index.js           # 📦 Índice de exportações
├── scripts/               # 📜 Scripts de Processamento
│   ├── process-notion-bugs.js    # Processar bugs do Notion
│   ├── git-metrics-collector.js  # Coletar métricas Git
│   └── ml-learning-system.js     # Sistema de ML
├── mongo-init/           # 🗄️ Inicialização MongoDB
│   └── init-metrics.js   # Script de setup do banco
├── notion-data/          # 📊 Dados do Notion
│   └── extracted-bugs-report.md
├── results/              # 📈 Relatórios
│   └── relatorio-*.md
├── server.js             # 🌐 Servidor Principal
├── docker-compose.yml    # 🐳 Configuração Docker
├── Dockerfile           # 🐳 Imagem Docker
└── package.json         # 📦 Dependências
```

## 🎯 Padrão MVC

### **Model (Modelos)**
- **Localização**: `app/models/`
- **Responsabilidade**: Definição de schemas e validações
- **Tecnologia**: Mongoose (MongoDB ODM)

```javascript
// Exemplo: BugMetrics.js
const BugMetricsSchema = new mongoose.Schema({
  notionBugId: { type: String, required: true },
  bugTitle: { type: String, required: true },
  bugDescription: { type: String, required: true },
  // ... outros campos
});
```

### **View (Views)**
- **Localização**: `app/views/`
- **Responsabilidade**: Interface do usuário
- **Tecnologia**: HTML, CSS, JavaScript

```javascript
// Exemplo: app.js (Frontend)
async function testNotionIntegration() {
  const response = await fetch('/api/notion/process-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notionUrl, options })
  });
}
```

### **Controller (Controladores)**
- **Localização**: `app/controllers/`
- **Responsabilidade**: Lógica de controle e coordenação
- **Padrão**: Classes com métodos específicos

```javascript
// Exemplo: NotionController.js
class NotionController {
  async testConnection(req, res) {
    try {
      const result = await notionConfig.testConnection();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

## ⚙️ Camada de Serviços

### **Services**
- **Localização**: `app/services/`
- **Responsabilidade**: Lógica de negócio complexa
- **Padrão**: Classes com métodos especializados

```javascript
// Exemplo: MetricsService.js
class MetricsService {
  async createBug(bugData) {
    const bugLevel = this.determineBugLevel(bugData);
    const bug = new BugMetrics({ ...bugData, bugLevel });
    return await bug.save();
  }
}
```

## 🔧 Middleware

### **Middleware**
- **Localização**: `app/middleware/`
- **Responsabilidade**: Processamento de requisições
- **Exemplos**: Logging, tratamento de erros, autenticação

```javascript
// Exemplo: logger.js
const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};
```

## 🛣️ Rotas

### **Routes**
- **Localização**: `app/routes/`
- **Responsabilidade**: Definição de endpoints
- **Padrão**: Módulos Express com rotas específicas

```javascript
// Exemplo: metrics.js
router.get('/bugs', metricsController.listBugs.bind(metricsController));
router.post('/bugs', metricsController.createBug.bind(metricsController));
```

## ⚙️ Configurações

### **Config**
- **Localização**: `app/config/`
- **Responsabilidade**: Configurações da aplicação
- **Exemplos**: Database, APIs externas, variáveis de ambiente

```javascript
// Exemplo: database.js
const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado ao MongoDB');
};
```

## 📦 Índice Centralizado

### **app/index.js**
Centraliza todas as exportações para facilitar imports:

```javascript
module.exports = {
  models: { BugMetrics, MLConfig, Report },
  controllers: { MetricsController, NotionController },
  services: { MetricsService, MLService, NotionService },
  middleware: { errorHandler, logger },
  config: { database, notion },
  routes: { metrics, notion }
};
```

## 🚀 Fluxo de Requisição

```
1. Cliente → server.js
2. server.js → app/app.js
3. app.js → app/routes/
4. routes → app/controllers/
5. controllers → app/services/
6. services → app/models/
7. models → MongoDB
8. Resposta ← (mesmo caminho)
```

## 🎯 Benefícios da Arquitetura

### **✅ Separação de Responsabilidades**
- Cada camada tem uma responsabilidade específica
- Fácil manutenção e debugging
- Código mais limpo e organizado

### **✅ Modularidade**
- Componentes independentes
- Fácil reutilização
- Testes unitários simplificados

### **✅ Escalabilidade**
- Fácil adição de novas funcionalidades
- Estrutura preparada para crescimento
- Padrões bem definidos

### **✅ Manutenibilidade**
- Código organizado e documentado
- Imports centralizados
- Estrutura consistente

## 🔄 Convenções

### **Nomenclatura**
- **Models**: PascalCase (ex: `BugMetrics.js`)
- **Controllers**: PascalCase + Controller (ex: `MetricsController.js`)
- **Services**: PascalCase + Service (ex: `NotionService.js`)
- **Routes**: camelCase (ex: `metrics.js`)
- **Middleware**: camelCase (ex: `errorHandler.js`)

### **Imports**
- Sempre usar caminhos relativos
- Usar o índice centralizado quando possível
- Manter consistência nos imports

### **Estrutura de Classes**
- Sempre usar classes para Controllers e Services
- Métodos assíncronos para operações de banco
- Tratamento de erros consistente

---

**Esta arquitetura garante um código limpo, organizado e fácil de manter!** 🎯
