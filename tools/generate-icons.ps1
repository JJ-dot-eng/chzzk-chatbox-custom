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
    $dark = [System.Drawing.Color]::FromArgb(255, 12, 24, 21)
    $lineDark = [System.Drawing.Color]::FromArgb(255, 19, 45, 38)
    $muted = [System.Drawing.Color]::FromArgb(255, 204, 220, 214)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $softWhite = [System.Drawing.Color]::FromArgb(235, 255, 255, 255)

    $background = New-ScaledRectanglePath -Scale $scale -X 6 -Y 6 -Width 116 -Height 116 -Radius 28
    $backgroundBrush = [System.Drawing.SolidBrush]::new($dark)
    $graphics.FillPath($backgroundBrush, $background)
    $backgroundBrush.Dispose()

    $borderPen = [System.Drawing.Pen]::new($green, [Math]::Max(1.0, 4 * $scale))
    $graphics.DrawPath($borderPen, $background)
    $borderPen.Dispose()
    $background.Dispose()

    $bubbleShadow = New-ScaledRectanglePath -Scale $scale -X 20 -Y 28 -Width 78 -Height 62 -Radius 16
    $bubbleShadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
    $graphics.FillPath($bubbleShadowBrush, $bubbleShadow)
    $bubbleShadowBrush.Dispose()
    $bubbleShadow.Dispose()

    $bubble = New-ScaledRectanglePath -Scale $scale -X 19 -Y 24 -Width 78 -Height 62 -Radius 16
    $bubbleBrush = [System.Drawing.SolidBrush]::new($white)
    $graphics.FillPath($bubbleBrush, $bubble)

    $tail = @(
      (New-PointF -Scale $scale -X 37 -Y 82),
      (New-PointF -Scale $scale -X 52 -Y 82),
      (New-PointF -Scale $scale -X 32 -Y 101)
    )
    $graphics.FillPolygon($bubbleBrush, $tail)
    $bubbleBrush.Dispose()
    $bubble.Dispose()

    $chip = New-ScaledRectanglePath -Scale $scale -X 31 -Y 40 -Width 17 -Height 8 -Radius 4
    $chipBrush = [System.Drawing.SolidBrush]::new($muted)
    $graphics.FillPath($chipBrush, $chip)
    $chipBrush.Dispose()
    $chip.Dispose()

    $linePen = [System.Drawing.Pen]::new($lineDark, [Math]::Max(2.0, 6 * $scale))
    $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $graphics.DrawLine($linePen, 55 * $scale, 44 * $scale, 80 * $scale, 44 * $scale)
    $graphics.DrawLine($linePen, 31 * $scale, 61 * $scale, 77 * $scale, 61 * $scale)
    $graphics.DrawLine($linePen, 31 * $scale, 76 * $scale, 67 * $scale, 76 * $scale)
    $linePen.Dispose()

    $badgeBrush = [System.Drawing.SolidBrush]::new($green)
    $badgePen = [System.Drawing.Pen]::new($dark, [Math]::Max(1.5, 4 * $scale))
    $graphics.FillEllipse($badgeBrush, 68 * $scale, 67 * $scale, 40 * $scale, 40 * $scale)
    $graphics.DrawEllipse($badgePen, 68 * $scale, 67 * $scale, 40 * $scale, 40 * $scale)
    $badgeBrush.Dispose()
    $badgePen.Dispose()

    $eyePen = [System.Drawing.Pen]::new($white, [Math]::Max(1.3, 3.5 * $scale))
    $eyePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $eyePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $eyePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $eyePath.AddBezier(
      77 * $scale,
      87 * $scale,
      82 * $scale,
      80 * $scale,
      94 * $scale,
      80 * $scale,
      99 * $scale,
      87 * $scale
    )
    $eyePath.AddBezier(
      99 * $scale,
      87 * $scale,
      94 * $scale,
      94 * $scale,
      82 * $scale,
      94 * $scale,
      77 * $scale,
      87 * $scale
    )
    $graphics.DrawPath($eyePen, $eyePath)
    $eyePath.Dispose()

    $pupilBrush = [System.Drawing.SolidBrush]::new($white)
    $graphics.FillEllipse($pupilBrush, 86 * $scale, 84 * $scale, 5 * $scale, 5 * $scale)
    $pupilBrush.Dispose()

    $graphics.DrawLine($eyePen, 78 * $scale, 99 * $scale, 99 * $scale, 76 * $scale)
    $eyePen.Dispose()

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
