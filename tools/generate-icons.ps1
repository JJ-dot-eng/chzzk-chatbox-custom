$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$iconDir = Join-Path $repoRoot "icons"

New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-ScaledRectanglePath {
  param(
    [float]$Scale,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  return New-RoundedRectanglePath `
    -X ($X * $Scale) `
    -Y ($Y * $Scale) `
    -Width ($Width * $Scale) `
    -Height ($Height * $Scale) `
    -Radius ($Radius * $Scale)
}

function New-PointF {
  param(
    [float]$Scale,
    [float]$X,
    [float]$Y
  )

  return [System.Drawing.PointF]::new($X * $Scale, $Y * $Scale)
}

function Draw-Icon {
  param([int]$Size)

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $scale = $Size / 128.0

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $green = [System.Drawing.Color]::FromArgb(255, 0, 196, 113)
    $dark = [System.Drawing.Color]::FromArgb(255, 4, 58, 42)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $softWhite = [System.Drawing.Color]::FromArgb(225, 255, 255, 255)

    $background = New-ScaledRectanglePath -Scale $scale -X 6 -Y 6 -Width 116 -Height 116 -Radius 26
    $backgroundBrush = [System.Drawing.SolidBrush]::new($green)
    $graphics.FillPath($backgroundBrush, $background)
    $backgroundBrush.Dispose()
    $background.Dispose()

    $bubble = New-ScaledRectanglePath -Scale $scale -X 24 -Y 27 -Width 80 -Height 58 -Radius 14
    $bubbleBrush = [System.Drawing.SolidBrush]::new($white)
    $graphics.FillPath($bubbleBrush, $bubble)
    $bubble.Dispose()

    $tail = @(
      (New-PointF -Scale $scale -X 44 -Y 80),
      (New-PointF -Scale $scale -X 55 -Y 80),
      (New-PointF -Scale $scale -X 42 -Y 98)
    )
    $graphics.FillPolygon($bubbleBrush, $tail)
    $bubbleBrush.Dispose()

    $linePen = [System.Drawing.Pen]::new($dark, [Math]::Max(2.0, 6 * $scale))
    $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $graphics.DrawLine($linePen, 42 * $scale, 45 * $scale, 84 * $scale, 45 * $scale)
    $graphics.DrawLine($linePen, 42 * $scale, 61 * $scale, 72 * $scale, 61 * $scale)
    $graphics.DrawLine($linePen, 42 * $scale, 77 * $scale, 90 * $scale, 77 * $scale)
    $linePen.Dispose()

    $knobBrush = [System.Drawing.SolidBrush]::new($green)
    $knobPen = [System.Drawing.Pen]::new($softWhite, [Math]::Max(1.0, 3 * $scale))
    $graphics.FillEllipse($knobBrush, 70 * $scale, 37 * $scale, 16 * $scale, 16 * $scale)
    $graphics.DrawEllipse($knobPen, 70 * $scale, 37 * $scale, 16 * $scale, 16 * $scale)
    $graphics.FillEllipse($knobBrush, 54 * $scale, 53 * $scale, 16 * $scale, 16 * $scale)
    $graphics.DrawEllipse($knobPen, 54 * $scale, 53 * $scale, 16 * $scale, 16 * $scale)
    $knobBrush.Dispose()
    $knobPen.Dispose()

    $outputPath = Join-Path $iconDir "icon-$Size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated $outputPath"
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

foreach ($size in @(16, 32, 48, 128)) {
  Draw-Icon -Size $size
}
