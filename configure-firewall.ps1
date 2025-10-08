# Script de Configuração do Firewall para Bridge API
# Execute como Administrador

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔥 Configuração do Firewall - Bridge API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ruleName = "Bridge API - Rede Local"
$port = 3001

# Verifica se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERRO: Este script precisa ser executado como Administrador!`n" -ForegroundColor Red
    Write-Host "👉 Clique com botão direito no arquivo e selecione 'Executar como Administrador'`n" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Executando como Administrador`n" -ForegroundColor Green

# Remove regra existente (se houver)
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "🔍 Regra existente encontrada. Removendo...`n" -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $ruleName
}

# Cria nova regra
Write-Host "📝 Criando regra de firewall...`n" -ForegroundColor Cyan

try {
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Description "Permite conexões de entrada para a Bridge API na rede local" `
        -Direction Inbound `
        -LocalPort $port `
        -Protocol TCP `
        -Action Allow `
        -Profile Private `
        -Enabled True | Out-Null
    
    Write-Host "✅ Regra criada com sucesso!`n" -ForegroundColor Green
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "📋 Detalhes da regra:`n" -ForegroundColor Cyan
    Write-Host "   Nome:      $ruleName" -ForegroundColor White
    Write-Host "   Porta:     $port" -ForegroundColor White
    Write-Host "   Protocolo: TCP" -ForegroundColor White
    Write-Host "   Direção:   Entrada (Inbound)" -ForegroundColor White
    Write-Host "   Perfil:    Privado (Rede Local)" -ForegroundColor White
    Write-Host "   Status:    Ativo`n" -ForegroundColor White
    
    Write-Host "🚀 Agora você pode:" -ForegroundColor Yellow
    Write-Host "   1. Executar 'npm start' para iniciar o servidor" -ForegroundColor White
    Write-Host "   2. Acessar de outros PCs na rede usando o IP exibido`n" -ForegroundColor White
    
    # Mostra o IP local
    Write-Host "📡 Seu IP na rede local:" -ForegroundColor Cyan
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" }
    foreach ($ip in $ips) {
        Write-Host "   $($ip.InterfaceAlias): $($ip.IPAddress)" -ForegroundColor Green
    }
    Write-Host ""
    
} catch {
    Write-Host "❌ ERRO ao criar regra: $_`n" -ForegroundColor Red
    exit 1
}

Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

