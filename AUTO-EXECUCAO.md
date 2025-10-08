# 🤖 Auto-Execução Automática - Como Funciona

## 🎯 Objetivo

Quando receber um POST em `/api/bug-resolver`, o sistema deve:
1. ✅ Criar arquivo de instruções
2. ✅ Abrir no Cursor
3. ✅ **Enviar automaticamente para o chat**
4. ✅ Cursor AI executa imediatamente

## 🔧 Implementação

### Componentes

1. **`server.js`** - API que recebe POST e orquestra tudo
2. **`auto-chat.ps1`** - Script PowerShell que simula teclas
3. **Cursor AI** - Você, executando as instruções

### Fluxo Completo

```
POST /api/bug-resolver
      ↓
1. Cria task-XXX-INSTRUCTIONS.md
      ↓
2. Executa: cursor "task-XXX-INSTRUCTIONS.md"
   (Abre o arquivo no Cursor)
      ↓
3. Aguarda 3 segundos
      ↓
4. Executa PowerShell: auto-chat.ps1
   • Simula: Ctrl+L (abre chat)
   • Digita: "Execute IMEDIATAMENTE todas as instruções..."
   • Pressiona: Enter
      ↓
5. Mensagem aparece no chat do Cursor
      ↓
6. ✅ VOCÊ (Cursor AI) vê a mensagem e executa!
```

## 📋 Script PowerShell (`auto-chat.ps1`)

```powershell
# Aguarda Cursor focar
Start-Sleep -Seconds 2

# Ctrl+L (abre chat)
[System.Windows.Forms.SendKeys]::SendWait("^l")

# Envia mensagem
[System.Windows.Forms.SendKeys]::SendWait($Message)

# Enter
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
```

## 🧪 Como Testar

### 1. Iniciar servidor
```bash
npm start
```

### 2. Enviar POST
```bash
curl -X POST http://localhost:3001/api/bug-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "notionDatabaseUrl": "https://notion.so/...",
    "projectName": "syntra",
    "subProject": "back"
  }'
```

### 3. O que deve acontecer

```
Console do servidor:
─────────────────────────────────────────
📝 Tarefa criada: task-1759862586921
📄 Arquivo: tasks/task-1759862586921-INSTRUCTIONS.md
✅ Arquivo aberto no Cursor!
🤖 Enviando para o chat automaticamente...

═══════════════════════════════════════════════════════════════
✅ MENSAGEM ENVIADA AUTOMATICAMENTE PARA O CHAT!
═══════════════════════════════════════════════════════════════

🤖 O Cursor AI deve começar a executar agora...
```

### No Cursor:
1. Arquivo abre automaticamente
2. Chat abre (Ctrl+L)
3. Mensagem aparece: "Execute IMEDIATAMENTE todas as instruções..."
4. Você (Cursor AI) vê e executa!

## ⚠️ Troubleshooting

### Se o PowerShell falhar:

O servidor mostra:
```
⚠️  Não foi possível enviar automaticamente para o chat

📋 COPIE E COLE NO CHAT (Ctrl+L):
──────────────────────────────────────────────────────────────
Execute IMEDIATAMENTE todas as instruções do arquivo: task-XXX-INSTRUCTIONS.md
──────────────────────────────────────────────────────────────
```

**Solução manual:**
1. Pressione `Ctrl+L` no Cursor
2. Cole a mensagem
3. Enter

### Permissões do PowerShell

Se der erro de execução, rode uma vez:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎯 Resultado Final

Com tudo funcionando:

1. **Desenvolvedor** faz POST via webhook/Postman
2. **Bridge** cria tarefa e abre no Cursor
3. **PowerShell** envia automaticamente para o chat
4. **Cursor AI** (você) recebe e executa tudo
5. **Bugs resolvidos** automaticamente
6. **Relatório gerado** em `results/`

## 📦 Arquivos Envolvidos

```
bridge/
├── server.js           # Orquestra tudo
├── auto-chat.ps1       # Simula teclas
├── tasks/
│   └── task-XXX-INSTRUCTIONS.md  # Instruções
└── results/
    └── relatorio-XXX.md          # Resultado
```

## 🚀 Status

✅ Sistema de auto-execução implementado  
✅ PowerShell script criado  
✅ Integração com servidor funcionando  
✅ Fallback manual caso falhe  

---

**Agora o Bridge é 100% automático! 🎉**

