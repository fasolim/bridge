# Script para testar conexão com a Bridge API de outro computador
# Execute este script no OUTRO computador (não no servidor)

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 3001
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 Teste de Conectividade - Bridge API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://${ServerIP}:${Port}"

Write-Host "🎯 Servidor alvo: $baseUrl`n" -ForegroundColor Yellow

# Teste 1: Ping básico
Write-Host "[1/4] Testando conectividade de rede (ping)..." -ForegroundColor Cyan
try {
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
    if ($pingResult) {
        Write-Host "   ✅ Ping OK - Servidor alcançável`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ping falhou - Servidor não responde`n" -ForegroundColor Red
        Write-Host "   👉 Verifique se:" -ForegroundColor Yellow
        Write-Host "      - O servidor está ligado" -ForegroundColor White
        Write-Host "      - Ambos estão na mesma rede" -ForegroundColor White
        Write-Host "      - O IP está correto`n" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ⚠️  Erro ao fazer ping`n" -ForegroundColor Yellow
}

# Teste 2: Porta TCP
Write-Host "[2/4] Testando se a porta $Port está aberta..." -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect($ServerIP, $Port, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($wait -and $tcpClient.Connected) {
        Write-Host "   ✅ Porta $Port está aberta e aceitando conexões`n" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "   ❌ Porta $Port não está acessível`n" -ForegroundColor Red
        Write-Host "   👉 Possíveis causas:" -ForegroundColor Yellow
        Write-Host "      - Servidor não está rodando" -ForegroundColor White
        Write-Host "      - Firewall bloqueando a porta" -ForegroundColor White
        Write-Host "      - Porta incorreta`n" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ❌ Não foi possível conectar à porta $Port`n" -ForegroundColor Red
    exit 1
}

# Teste 3: Endpoint /api/projects
Write-Host "[3/4] Testando endpoint GET /api/projects..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/projects" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ API respondendo corretamente`n" -ForegroundColor Green
        
        $data = $response.Content | ConvertFrom-Json
        if ($data.projects) {
            Write-Host "   📁 Projetos disponíveis: $($data.projects.Count)" -ForegroundColor Cyan
            foreach ($project in $data.projects) {
                Write-Host "      - $($project.name)" -ForegroundColor White
            }
        }
        Write-Host ""
    }
} catch {
    Write-Host "   ❌ Erro ao acessar API: $_`n" -ForegroundColor Red
    Write-Host "   👉 Verifique se o servidor está rodando com 'npm start'`n" -ForegroundColor Yellow
    exit 1
}

# Teste 4: POST de exemplo
Write-Host "[4/4] Testando endpoint POST /api/bug-resolver..." -ForegroundColor Cyan
Write-Host "   ⚠️  Este é apenas um teste de conectividade (payload inválido proposital)`n" -ForegroundColor Yellow

$testPayload = @{
    test = "connection_test"
    timestamp = (Get-Date).ToString("o")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/bug-resolver" -Method Post -Body $testPayload -ContentType "application/json" -TimeoutSec 5
    Write-Host "   ✅ Endpoint POST acessível`n" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 500) {
        Write-Host "   ✅ Endpoint POST acessível (erro esperado no payload)`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao acessar endpoint POST: $_`n" -ForegroundColor Red
    }
}

# Resumo final
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "🎉 Você pode enviar requisições para:" -ForegroundColor Cyan
Write-Host "   $baseUrl/api/bug-resolver`n" -ForegroundColor White

Write-Host "📋 Exemplo de payload válido:" -ForegroundColor Cyan
Write-Host @"
{
    "notionDatabaseUrl": "https://notion.so/seu-database",
    "projectName": "syntra",
    "subProject": "back",
    "projectContext": "Backend NestJS",
    "autoCommit": true
}
"@ -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exemplo de cURL
Write-Host "💡 Exemplo de requisição com cURL:" -ForegroundColor Yellow
Write-Host @"
curl -X POST $baseUrl/api/bug-resolver \
  -H "Content-Type: application/json" \
  -d '{
    "notionDatabaseUrl": "https://notion.so/...",
    "projectName": "syntra",
    "subProject": "back"
  }'
"@ -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

