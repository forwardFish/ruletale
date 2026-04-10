$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$WebRoot = Join-Path $RepoRoot "apps\web"
$MiniRoot = Join-Path $RepoRoot "apps\mini"

function Invoke-Step {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "==> $Name"
  Push-Location $WorkingDirectory
  try {
    & $Command
  }
  finally {
    Pop-Location
  }
}

Invoke-Step "API tests" $RepoRoot { python -m pytest apps/api/tests -q }
Invoke-Step "Web tests" $WebRoot { npm test }
Invoke-Step "Web build" $WebRoot { npm run build }
Invoke-Step "Mini build:weapp" $MiniRoot { npm run build:weapp }
Invoke-Step "Mini/Web parity" $RepoRoot { node scripts/check_mini_web_parity.mjs }

$cliCandidates = @(
  "$env:ProgramFiles\Tencent\微信开发者工具\cli.bat",
  "${env:ProgramFiles(x86)}\Tencent\微信开发者工具\cli.bat",
  "$env:LOCALAPPDATA\微信开发者工具\cli.bat",
  "$env:LOCALAPPDATA\Programs\微信开发者工具\cli.bat"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

Write-Host ""
if ($cliCandidates.Count -gt 0) {
  Write-Host "WeChat DevTools CLI detected: $($cliCandidates[0])"
  Write-Host "Open manually if needed: & `"$($cliCandidates[0])`" open --project `"$MiniRoot`""
}
else {
  Write-Host "WeChat DevTools CLI not found. Acceptance falls back to Taro dist plus manual import of apps/mini."
}

Write-Host ""
Write-Host "Ruletale target validation passed."
