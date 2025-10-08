# Script PowerShell para enviar automaticamente para o chat do Cursor
param(
    [string]$Message
)

Add-Type -AssemblyName System.Windows.Forms

# Aguarda 2 segundos para o Cursor focar
Start-Sleep -Seconds 2

# Simula Ctrl+L (abre chat no Cursor)
[System.Windows.Forms.SendKeys]::SendWait("^l")

Start-Sleep -Milliseconds 500

# Envia a mensagem
[System.Windows.Forms.SendKeys]::SendWait($Message)

Start-Sleep -Milliseconds 300

# Pressiona Enter
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "✅ Mensagem enviada para o chat do Cursor!"

