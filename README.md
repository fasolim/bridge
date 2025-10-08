# 🌉 Bridge

Ponte automática entre Notion e projetos locais via Cursor AI.

## ✨ NOVIDADE: Interface Web!

**Agora com interface visual completa!** Não precisa mais usar Postman! 🎉

Acesse: `http://localhost:3001` após iniciar o servidor.

### 🎯 6 Estratégias de Resolução:
- 🚀 **Bugs Não Iniciados** - Começa bugs novos do zero
- 🔄 **Bugs Reprovados** - Retrabalha bugs rejeitados
- ⚡ **Em Andamento** - Finaliza bugs iniciados
- 🔥 **Alta Prioridade** - Foca em bugs críticos
- 📋 **Todos Pendentes** - Limpa o backlog completo
- ⚙️ **Personalizado** - Filtros customizados

**👉 Guia rápido:** [QUICK-START.md](./QUICK-START.md)  
**📖 Documentação completa:** [INTERFACE-WEB.md](./INTERFACE-WEB.md)

## Setup

### Local
```bash
npm install
npm start
```

O servidor iniciará e mostrará dois endereços:
- **Local**: `http://localhost:3001` (apenas neste PC)
- **Rede**: `http://192.168.x.x:3001` (outros PCs na rede local)

### Docker
```bash
# Criar .env primeiro
echo "NOTION_TOKEN=seu_token" > .env

# Rodar
docker-compose up -d

# Logs
docker-compose logs -f bridge
```

### 🌐 Acesso na Rede Local

Para receber webhooks de outros computadores na rede:

1. **Configure o Firewall** (apenas uma vez):
   ```powershell
   # Execute como Administrador
   .\configure-firewall.ps1
   ```

2. **Inicie o servidor**:
   ```bash
   npm start
   ```

3. **Use o IP da rede** para webhooks:
   ```
   http://SEU_IP:3001/api/bug-resolver
   ```

> 📖 Veja detalhes completos em [`CONFIGURACAO-REDE-LOCAL.md`](./CONFIGURACAO-REDE-LOCAL.md)

## Estrutura

```
bridge/
├── projects/        # Seus repos clonados
│   └── syntra/
├── server.js        # API
├── tasks/           # Tarefas geradas
└── results/         # Relatórios
```

## API

### Interface Web (NOVO! 🎉)
**Acesse:** `http://localhost:3001`

Interface visual completa com seletor de estratégias e configuração facilitada!

### Endpoints REST

**POST /api/bug-resolver** - Inicia resolução de bugs

Exemplo com estratégia:
```json
{
  "notionDatabaseUrl": "https://notion.so/...",
  "projectName": "syntra",
  "subProject": "back",
  "projectContext": "Backend NestJS",
  "strategy": "nao-iniciado",
  "autoCommit": true
}
```

**GET /api/projects** - Lista projetos e subprojetos  
**GET /api/strategies** - Lista estratégias disponíveis (NOVO!)  
**GET /api/tasks** - Lista tarefas executadas  
**GET /api/results** - Lista relatórios gerados

### Estratégias Disponíveis:
- `nao-iniciado` - Bugs não iniciados
- `reprovado` - Bugs reprovados
- `em-andamento` - Bugs em andamento
- `prioridade-alta` - Apenas bugs críticos/altos
- `todos-pendentes` - Todos não concluídos
- `custom` - Filtro personalizado (requer `customFilter`)

## Fluxo

1. Bug criado no Notion → webhook → Bridge
2. Bridge cria tarefa e **abre automaticamente no Cursor**
3. Bridge **envia automaticamente para o chat** (via PowerShell)
4. Cursor AI executa e resolve automaticamente
5. Relatório gerado em `results/`

> **Auto-execução**: O sistema usa PowerShell para simular Ctrl+L e enviar a mensagem automaticamente!

## Estrutura de Projetos

```
projects/
└── syntra/
    ├── syntrafi-back/   # Backend
    └── syntrafi-front/  # Frontend
```

Para referenciar:
- **Projeto completo**: `"projectName": "syntra"`
- **Apenas backend**: `"projectName": "syntra", "subProject": "back"`
- **Apenas frontend**: `"projectName": "syntra", "subProject": "front"`

## Docker

```bash
# Build e start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

---

**Porta padrão**: 3001
