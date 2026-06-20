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
  "content-bootstrap.js",
  "content-options.js",
  "content-theme.js",
  "content-core.js",
  "content-mini-chat.js",
  "content-guest-chat.js",
  "content-chat-annotate.js",
  "content-runtime.js",
  "content.css",
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

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($resolvedZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
$stagePrefix = $resolvedStageRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

try {
  Get-ChildItem -LiteralPath $resolvedStageRoot -Recurse -File |
    Sort-Object FullName |
    ForEach-Object {
      $relativePath = $_.FullName.Substring($stagePrefix.Length).Replace([System.IO.Path]::DirectorySeparatorChar, "/")
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip,
        $_.FullName,
        $relativePath,
        [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
} finally {
  $zip.Dispose()
}

Write-Host "Created package: $resolvedZipPath"
Write-Host "Upload this zip in the Chrome Web Store or Microsoft Edge Add-ons dashboard."
