$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$iconDir = Join-Path $repoRoot "icons"
$sourcePath = Join-Path $scriptRoot "assets/icon-source.png"

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Missing source icon: $sourcePath"
}

New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

function Save-ResizedIcon {
  param(
    [System.Drawing.Image]$Source,
    [int]$Size
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($Source, 0, 0, $Size, $Size)

    $outputPath = Join-Path $iconDir "icon-$Size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated $outputPath"
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$source = [System.Drawing.Image]::FromFile($sourcePath)

try {
  foreach ($size in @(16, 32, 48, 128)) {
    Save-ResizedIcon -Source $source -Size $size
  }
} finally {
  $source.Dispose()
}
