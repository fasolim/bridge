# 🌐 Configuração de Rede Local - Bridge API

## ✅ Mudanças Implementadas

O servidor agora está configurado para aceitar conexões de **qualquer computador na rede local**.

### O que foi alterado:

- **Antes**: `app.listen(PORT)` → Escutava apenas em `localhost`
- **Agora**: `app.listen(PORT, '0.0.0.0')` → Escuta em todas as interfaces de rede

---

## 🚀 Como Usar

### 1. Inicie o servidor

```bash
npm start
```

Você verá algo assim:

```
======================================================================
🚀 Bug Resolver API está rodando!
======================================================================

📡 URLs disponíveis:

   Local:    http://localhost:3001/api/bug-resolver
   Rede:     http://192.168.1.100:3001/api/bug-resolver

📌 Use o endereço de REDE para acessar de outros computadores
======================================================================
```

### 2. Copie o endereço de REDE

O IP mostrado (ex: `192.168.1.100`) é o endereço IP do seu computador na rede local.

### 3. Configure o Notion para fazer POST para este IP

No seu webhook do Notion, use o endereço de REDE:

```
http://192.168.1.100:3001/api/bug-resolver
```

---

## 🔥 Configuração do Firewall do Windows

**IMPORTANTE**: O Windows Firewall pode bloquear conexões externas. Você precisa liberar a porta.

### Método 1: Via PowerShell (Recomendado - Rápido)

Execute como **Administrador**:

```powershell
New-NetFirewallRule -DisplayName "Bridge API - Rede Local" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
```

### Método 2: Via Interface Gráfica (Passo a Passo)

1. **Abra o Firewall do Windows**
   - Pressione `Win + R`
   - Digite: `wf.msc`
   - Pressione Enter

2. **Crie Nova Regra**
   - Clique em "Regras de Entrada" (Inbound Rules)
   - No menu direito, clique em "Nova Regra..." (New Rule)

3. **Configure a Regra**
   - Tipo: **Porta** (Port)
   - Protocolo: **TCP**
   - Porta: **3001**
   - Ação: **Permitir a conexão** (Allow the connection)
   - Perfis: Marque apenas **Privado** (Private)
   - Nome: `Bridge API - Rede Local`

4. **Finalize**
   - Clique em "Concluir" (Finish)

---

## 🧪 Testando a Conexão

### Método 1: Script Automatizado (Recomendado)

De **outro computador** na rede, execute:

```powershell
.\test-connection.ps1 -ServerIP 192.168.1.100
```

Este script testará automaticamente:
- ✅ Conectividade de rede (ping)
- ✅ Porta TCP aberta
- ✅ API respondendo
- ✅ Endpoint POST funcionando

### Método 2: Testes Manuais

#### Do próprio computador (local):

```bash
curl http://localhost:3001/api/projects
```

#### De outro computador na rede:

```bash
curl http://192.168.1.100:3001/api/projects
```

Substitua `192.168.1.100` pelo IP que apareceu quando você iniciou o servidor.

---

## 🔍 Descobrindo seu IP Manualmente

Se precisar verificar seu IP:

### Windows (PowerShell):

```powershell
ipconfig | findstr IPv4
```

### Windows (CMD):

```cmd
ipconfig
```

Procure por "Endereço IPv4" na sua interface de rede ativa (Wi-Fi ou Ethernet).

---

## 📨 Exemplo de POST de outro computador

### Com cURL:

```bash
curl -X POST http://192.168.1.100:3001/api/bug-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "notionDatabaseUrl": "https://www.notion.so/seu-database-id",
    "projectName": "syntra",
    "subProject": "back",
    "projectContext": "Backend NestJS",
    "autoCommit": true
  }'
```

### Com PowerShell (de outro PC Windows):

```powershell
$body = @{
    notionDatabaseUrl = "https://www.notion.so/seu-database-id"
    projectName = "syntra"
    subProject = "back"
    projectContext = "Backend NestJS"
    autoCommit = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://192.168.1.100:3001/api/bug-resolver" -Body $body -ContentType "application/json"
```

### Com Python:

```python
import requests

url = "http://192.168.1.100:3001/api/bug-resolver"
payload = {
    "notionDatabaseUrl": "https://www.notion.so/seu-database-id",
    "projectName": "syntra",
    "subProject": "back",
    "projectContext": "Backend NestJS",
    "autoCommit": True
}

response = requests.post(url, json=payload)
print(response.json())
```

---

## 🛡️ Segurança

### ⚠️ Importante:

- Esta configuração expõe o servidor na rede **LOCAL** apenas
- Computadores fora da sua rede local **NÃO** podem acessar
- Se precisar acesso externo (internet), precisará de:
  - Configuração de Port Forwarding no roteador
  - IP público ou serviço de DNS dinâmico
  - **Recomendado**: Use um túnel seguro (ngrok, cloudflare tunnel, etc.)

### 🔒 Melhorando a Segurança (Opcional):

Se quiser adicionar autenticação básica, podemos adicionar um token de API:

1. Crie um `.env` com:
   ```
   API_TOKEN=seu-token-secreto-aqui
   ```

2. Adicione middleware no `server.js`:
   ```javascript
   app.use('/api', (req, res, next) => {
     const token = req.headers['authorization'];
     if (token !== `Bearer ${process.env.API_TOKEN}`) {
       return res.status(401).json({ error: 'Não autorizado' });
     }
     next();
   });
   ```

---

## 📊 Verificando se está funcionando

### 1. Verifique se o servidor está rodando:

```bash
npm start
```

### 2. Do outro computador, teste se consegue alcançar:

```bash
# Teste básico de conectividade
ping 192.168.1.100

# Teste o endpoint
curl http://192.168.1.100:3001/api/projects
```

---

## ❌ Troubleshooting

### Problema: "Não consigo acessar de outro PC"

**Possíveis causas:**

1. ✅ **Firewall bloqueando** → Siga as instruções de configuração do firewall acima
2. ✅ **Servidor não está rodando** → Verifique se executou `npm start`
3. ✅ **IP errado** → Confirme o IP correto com `ipconfig`
4. ✅ **Redes diferentes** → Ambos PCs precisam estar na **mesma rede Wi-Fi/Ethernet**
5. ✅ **VPN ativa** → Desative VPNs temporariamente para testar

### Problema: "Connection refused"

- O servidor não está rodando ou está em outra porta
- Verifique se o servidor iniciou corretamente

### Problema: "Timeout" ou "Network unreachable"

- Firewall está bloqueando
- Os computadores estão em redes diferentes
- Verifique cabos/conexão Wi-Fi

---

## 🎯 Resumo Rápido

1. ✅ Código modificado → Servidor agora aceita conexões externas
2. 🔥 Configure o Firewall → Libere a porta 3001
3. 🚀 Inicie o servidor → `npm start`
4. 📋 Copie o IP da rede → Exibido ao iniciar
5. 📨 Use esse IP de outros PCs → `http://SEU_IP:3001/api/bug-resolver`

---

**Pronto!** Agora outros computadores na sua rede podem enviar requisições para o Bridge API! 🎉

