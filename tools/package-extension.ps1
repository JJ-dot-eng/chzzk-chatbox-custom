$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$manifestPath = Join-Path $repoRoot "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 -Path $manifestPath | ConvertFrom-Json
$packageName = "chzzk-chat-ui-settings-$($manifest.version)"
$distRoot = Join-Path $repoRoot "dist"
$stageRoot = Join-Path $distRoot $packageName
$zipPath = Join-Path $distRoot "$packageName.zip"

function Get-ResolvedFullPath {
  param([string]$Path)

  return [System.IO.Path]::GetFullPath($Path)
}

function Assert-PathInsideRepo {
  param([string]$Path)

  $resolvedRepo = Get-ResolvedFullPath -Path $repoRoot
  $resolvedPath = Get-ResolvedFullPath -Path $Path

  if (-not $resolvedPath.StartsWith($resolvedRepo, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write outside repository: $resolvedPath"
  }

  return $resolvedPath
}

$resolvedDistRoot = Assert-PathInsideRepo -Path $distRoot
$resolvedStageRoot = Assert-PathInsideRepo -Path $stageRoot
$resolvedZipPath = Assert-PathInsideRepo -Path $zipPath

New-Item -ItemType Directory -Force -Path $resolvedDistRoot | Out-Null

$icon128 = Join-Path $repoRoot "icons/icon-128.png"
if (-not (Test-Path -LiteralPath $icon128)) {
  & (Join-Path $scriptRoot "generate-icons.ps1")
}

if (Test-Path -LiteralPath $resolvedStageRoot) {
  Remove-Item -LiteralPath $resolvedStageRoot -Recurse -Force
}

if (Test-Path -LiteralPath $resolvedZipPath) {
  Remove-Item -LiteralPath $resolvedZipPath -Force
}

New-Item -ItemType Directory -Force -Path $resolvedStageRoot | Out-Null

$filesToCopy = @(
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "README.md"
)

foreach ($file in $filesToCopy) {
  $source = Join-Path $repoRoot $file

  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing required package file: $file"
  }

  Copy-Item -LiteralPath $source -Destination $resolvedStageRoot
}

$iconsSource = Join-Path $repoRoot "icons"
$iconsTarget = Join-Path $resolvedStageRoot "icons"

if (-not (Test-Path -LiteralPath $iconsSource)) {
  throw "Missing icons directory."
}

Copy-Item -LiteralPath $iconsSource -Destination $iconsTarget -Recurse

Compress-Archive -Path (Join-Path $resolvedStageRoot "*") -DestinationPath $resolvedZipPath -Force

Write-Host "Created package: $resolvedZipPath"
Write-Host "Upload this zip in the Chrome Web Store or Microsoft Edge Add-ons dashboard."
