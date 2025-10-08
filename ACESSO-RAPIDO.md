# 🚀 Acesso Rápido - Interface Web do Bridge

## ⚡ Como Iniciar (2 comandos)

### 1. Abra o terminal nesta pasta e execute:
```bash
npm start
```

### 2. Abra o navegador em:
```
http://localhost:3001
```

**Pronto! A interface estará rodando! 🎉**

---

## 🌐 URLs de Acesso

### Local (apenas neste PC)
```
http://localhost:3001
```

### Rede Local (outros PCs na mesma rede)
```
http://SEU_IP:3001
```

*Para descobrir seu IP, veja no terminal quando iniciar o servidor*

---

## 📋 O Que Você Vai Ver

A interface tem:

1. **🎯 Seletor de Estratégias** (6 opções)
   - Clique na estratégia desejada

2. **⚙️ Formulário de Configuração**
   - URL do Notion Database
   - Projeto e Sub-projeto
   - Contexto e GitHub

3. **🚀 Botão "Iniciar Resolução Automática"**
   - Clique para executar!

4. **📊 Resultados**
   - Mostra o status da execução

5. **📋 Tarefas Recentes**
   - Histórico das últimas execuções

---

## 🎬 Primeiro Uso

### Exemplo Prático:

1. **Acesse:** `http://localhost:3001`

2. **Clique em:** 🚀 Bugs Não Iniciados

3. **Preencha:**
   ```
   URL do Database: https://notion.so/workspace/seu-database
   Projeto: syntra
   Sub-projeto: back
   Contexto: Backend NestJS
   ```

4. **Clique:** "Iniciar Resolução Automática"

5. **Aguarde:** Cursor abrirá automaticamente!

---

## 🛑 Como Parar o Servidor

### No terminal onde rodou `npm start`, pressione:
```
Ctrl + C
```

---

## 🔄 Reiniciar o Servidor

```bash
npm start
```

---

## 📱 Acesso Mobile

A interface é responsiva! Você pode acessar do celular:

1. Conecte o celular na **mesma rede WiFi**
2. Descubra o IP do PC (mostrado no terminal)
3. Acesse no celular: `http://IP_DO_PC:3001`

---

## 🎨 Interface Preview

```
┌─────────────────────────────────────────────────┐
│  🌉 Bridge                                      │
│  Sistema Automático de Resolução de Bugs    ● │
├─────────────────────────────────────────────────┤
│                                                 │
│  🎯 Estratégia de Resolução                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │🚀 Não    │ │🔄 Repro  │ │⚡ Em     │       │
│  │Iniciados │ │vados     │ │Andamento │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │🔥 Alta   │ │📋 Todos  │ │⚙️ Perso │       │
│  │Prioridade│ │Pendentes │ │nalizado  │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ⚙️ Configuração                               │
│  📊 URL do Database: [____________]            │
│  📁 Projeto: [▼ Selecione]                     │
│  📂 Sub-projeto: [▼ Opcional]                  │
│  💡 Contexto: [____________]                   │
│                                                 │
│     [🚀 Iniciar Resolução Automática]          │
│                                                 │
│  📋 Tarefas Recentes                           │
│  ┌─────────────────────────────────────┐      │
│  │ task-123456 | ✅ Concluído          │      │
│  │ 📁 syntra/back | 🕐 10:30          │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

---

## 💡 Atalhos Úteis

### Favoritar no Navegador
- Pressione `Ctrl + D` quando estiver em `localhost:3001`
- Salve como "Bridge - Bug Resolver"

### Abrir Rápido
- `Win + R` → digite `http://localhost:3001` → Enter

---

## 🆘 Problemas Comuns

### ❌ "Esta página não está disponível"
**Solução:** Certifique-se que rodou `npm start`

### ❌ "Projetos não carregam"
**Solução:** Verifique se tem projetos na pasta `projects/`

### ❌ "Cursor não abre automaticamente"
**Solução:** Abra manualmente o arquivo em `tasks/` no Cursor

---

## 📞 Endpoints da API (para referência)

```
GET  /                      → Interface Web
GET  /api/projects          → Lista projetos
GET  /api/strategies        → Lista estratégias
GET  /api/tasks             → Lista tarefas
POST /api/bug-resolver      → Cria tarefa
```

---

## 🎉 Divirta-se!

Agora você tem uma interface profissional para resolver bugs automaticamente!

**Não precisa mais usar Postman!** 🚀

---

**⚡ Acesso Rápido:** `http://localhost:3001`

