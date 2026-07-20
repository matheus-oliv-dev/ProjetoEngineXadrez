# init.ps1 - Script de Verificação e Build (Harness Engineering)
# Este script deve ser executado pelo agente antes e depois de qualquer alteração de código.

Write-Host "=========================================="
Write-Host " Iniciando Verificação de Integridade (Harness)"
Write-Host "=========================================="

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

# 1. Checagem de ferramentas
Write-Host "[1/3] Verificando compilador WebAssembly..."
try {
    $emccVersion = emcc --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK! (Emscripten encontrado)" -ForegroundColor Green
    } else {
        throw "Compilador emcc não encontrado no PATH. Ative o EMSDK primeiro."
    }
} catch {
    Write-Host "  ERRO: Compilador emcc não encontrado no PATH. Ative o EMSDK primeiro." -ForegroundColor Red
    exit 1
}

# 2. Recompilar o C++ para WASM (Usando o compile.ps1)
Write-Host "[2/3] Compilando a lógica C++ para WebAssembly..."
try {
    # Usando Invoke-Expression ou rodando diretamente
    # Precisamos ter certeza que o script compile.ps1 passará
    & .\compile.ps1
    if ($LASTEXITCODE -ne 0) {
         throw "Falha na compilação do WebAssembly."
    }
    Write-Host "  OK! (Compilação bem-sucedida)" -ForegroundColor Green
} catch {
    Write-Host "  ERRO: Falha ao compilar o código fonte C++!" -ForegroundColor Red
    exit 1
}

# 3. Verificação de Arquivos Estáticos (Front-End)
Write-Host "[3/3] Checando existência de artefatos Front-End..."
$requiredFiles = @(
    "WebApp\engine.wasm",
    "WebApp\engine.js",
    "WebApp\index.html",
    "WebApp\script.js",
    "WebApp\style.css"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "  ERRO: Arquivo crítico ausente: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  OK! (Arquivos front-end intactos)" -ForegroundColor Green

$EndTime = Get-Date
$Duration = $EndTime - $StartTime
Write-Host "=========================================="
Write-Host " Tudo pronto! O projeto está ÍNTEGRO." -ForegroundColor Cyan
Write-Host " Tempo total: $($Duration.Seconds) segundos"
Write-Host "=========================================="
exit 0
