[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$manifestPath = Join-Path $repoRoot "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 -Path $manifestPath | ConvertFrom-Json

function Assert-ChromeManifestVersion {
  param([object]$Version)

  if ($Version -isnot [string]) {
    throw "manifest.version must be a string containing one to four dot-separated integers."
  }

  $parts = $Version.Split(".")

  if ($parts.Count -lt 1 -or $parts.Count -gt 4) {
    throw "Invalid Chrome extension version '$Version': expected one to four dot-separated integers."
  }

  $hasNonZeroPart = $false

  foreach ($part in $parts) {
    if ($part -notmatch '^(0|[1-9][0-9]*)$') {
      throw "Invalid Chrome extension version '$Version': version parts must be decimal integers without leading zeroes."
    }

    $partValue = 0

    if (-not [int]::TryParse($part, [ref]$partValue) -or $partValue -gt 65535) {
      throw "Invalid Chrome extension version '$Version': each version part must be between 0 and 65535."
    }

    if ($partValue -ne 0) {
      $hasNonZeroPart = $true
    }
  }

  if (-not $hasNonZeroPart) {
    throw "Invalid Chrome extension version '$Version': version parts cannot all be zero."
  }

  return $Version
}

$manifestVersion = Assert-ChromeManifestVersion -Version $manifest.version
$packageName = "chzzk-chat-ui-settings-$manifestVersion"
$distRoot = Join-Path $repoRoot "dist"
$stageRoot = Join-Path $distRoot $packageName
$zipPath = Join-Path $distRoot "$packageName.zip"

# Keep earlier packages intact when rebuilding the same version.
if ((Test-Path -LiteralPath $stageRoot) -or (Test-Path -LiteralPath $zipPath)) {
  $packageName += "-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
  $stageRoot = Join-Path $distRoot $packageName
  $zipPath = Join-Path $distRoot "$packageName.zip"
}

function Get-ResolvedFullPath {
  param([string]$Path)

  return [System.IO.Path]::GetFullPath($Path)
}

function Assert-PathInsideRepo {
  param([string]$Path)

  $resolvedRepo = (Get-ResolvedFullPath -Path $repoRoot).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar
  )
  $resolvedPath = Get-ResolvedFullPath -Path $Path
  $repoPrefix = $resolvedRepo + [System.IO.Path]::DirectorySeparatorChar

  if (
    $resolvedPath -ne $resolvedRepo -and
    -not $resolvedPath.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)
  ) {
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

New-Item -ItemType Directory -Path $resolvedStageRoot | Out-Null

Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $resolvedStageRoot "manifest.json")

$filesToCopy = @(
  "background.js",
  "content-bootstrap.js",
  "content-options.js",
  "content-theme.js",
  "content-core.js",
  "content-audio.js",
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
Write-Host "Unpacked extension: $resolvedStageRoot"
Write-Host "Upload this zip in the Chrome Web Store or Microsoft Edge Add-ons dashboard."
