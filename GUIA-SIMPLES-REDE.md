# 🚀 Guia Super Simples - Acessar de Outro PC

## Passo 1: Descubra seu IP

No PC onde o servidor vai rodar, abra o CMD ou PowerShell:

```bash
ipconfig
```

Procure por **"Endereço IPv4"** (algo como `192.168.x.x`)

**Exemplo:**
```
Adaptador de Rede sem Fio Wi-Fi:
   Endereço IPv4. . . . . . . . . : 192.168.1.100
```

Copie esse número! 📋

---

## Passo 2: Teste se os PCs se "veem"

**Do outro PC**, faça ping para esse IP:

```bash
ping 192.168.1.100
```

### ✅ Se funcionar:
```
Resposta de 192.168.1.100: bytes=32 tempo=4ms TTL=128
```

**Ótimo! Os PCs se veem.** Pule para o Passo 3.

### ❌ Se NÃO funcionar:
```
Esgotado o tempo limite do pedido.
```

**Problema de rede básico.** Verifique:
- Ambos estão na **mesma rede Wi-Fi**?
- Ou ambos conectados por cabo no **mesmo roteador**?

Se não funcionar, nem adianta continuar. Resolva isso primeiro.

---

## Passo 3: Libere a porta no Firewall

No PC do servidor, execute **como Administrador**:

```powershell
New-NetFirewallRule -DisplayName "Bridge API" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
```

**Ou use o script:**
```powershell
.\configure-firewall.ps1
```

---

## Passo 4: Inicie o servidor

```bash
npm start
```

Copie o endereço de **Rede** que aparecer.

---

## Passo 5: Teste do outro PC

**Do outro PC**, teste se a API responde:

```bash
curl http://192.168.1.100:3001/api/projects
```

**Ou abra no navegador:**
```
http://192.168.1.100:3001/api/projects
```

### ✅ Se funcionar:
Você verá um JSON com a lista de projetos. **Pronto!** 🎉

### ❌ Se NÃO funcionar:
- O servidor está rodando? (`npm start`)
- A porta 3001 está liberada no firewall? (Passo 3)
- O ping funcionou? (Passo 2)

---

## 🎯 Resumo Rápido

1. **Descubra o IP**: `ipconfig`
2. **Teste ping**: `ping 192.168.1.100`
3. **Libere firewall**: Execute o comando ou script
4. **Inicie servidor**: `npm start`
5. **Teste API**: Acesse do outro PC

---

## 💡 Ordem de Testes (do mais simples pro mais complexo)

1. ✅ **Ping funciona?** → Se não, problema de rede básica
2. ✅ **Servidor rodando?** → Se não, execute `npm start`
3. ✅ **Firewall liberado?** → Se não, execute o script
4. ✅ **API responde?** → Se sim, tudo certo! 🎉

---

**Dica:** Sempre comece com o ping. Se ele não funcionar, nada mais vai funcionar!

