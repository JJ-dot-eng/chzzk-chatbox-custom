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

function New-StarPath {
  param(
    [float]$Scale,
    [float]$CenterX,
    [float]$CenterY,
    [float]$OuterRadius,
    [float]$InnerRadius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $points = New-Object 'System.Drawing.PointF[]' 10

  for ($i = 0; $i -lt 10; $i++) {
    $angle = (-90 + ($i * 36)) * [Math]::PI / 180
    $radius = if ($i % 2 -eq 0) { $OuterRadius } else { $InnerRadius }
    $points[$i] = [System.Drawing.PointF]::new(
      ($CenterX + [Math]::Cos($angle) * $radius) * $Scale,
      ($CenterY + [Math]::Sin($angle) * $radius) * $Scale
    )
  }

  $path.AddPolygon($points)
  return $path
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
    $deepGreen = [System.Drawing.Color]::FromArgb(255, 0, 112, 76)
    $dark = [System.Drawing.Color]::FromArgb(255, 4, 58, 42)
    $starYellow = [System.Drawing.Color]::FromArgb(255, 255, 216, 77)
    $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $softWhite = [System.Drawing.Color]::FromArgb(210, 255, 255, 255)

    $background = New-ScaledRectanglePath -Scale $scale -X 6 -Y 6 -Width 116 -Height 116 -Radius 27
    $backgroundBrush = [System.Drawing.SolidBrush]::new($green)
    $graphics.FillPath($backgroundBrush, $background)
    $backgroundBrush.Dispose()
    $background.Dispose()

    $shadow = New-ScaledRectanglePath -Scale $scale -X 22 -Y 31 -Width 82 -Height 61 -Radius 17
    $bubbleShadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(70, 0, 66, 45))
    $graphics.FillPath($bubbleShadowBrush, $shadow)
    $bubbleShadowBrush.Dispose()
    $shadow.Dispose()

    $tailShadow = @(
      (New-PointF -Scale $scale -X 44 -Y 87),
      (New-PointF -Scale $scale -X 58 -Y 87),
      (New-PointF -Scale $scale -X 40 -Y 104)
    )
    $tailShadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(70, 0, 66, 45))
    $graphics.FillPolygon($tailShadowBrush, $tailShadow)
    $tailShadowBrush.Dispose()

    $bubble = New-ScaledRectanglePath -Scale $scale -X 19 -Y 26 -Width 82 -Height 61 -Radius 17
    $bubbleBrush = [System.Drawing.SolidBrush]::new($white)
    $graphics.FillPath($bubbleBrush, $bubble)
    $bubbleBrush.Dispose()

    $tail = @(
      (New-PointF -Scale $scale -X 41 -Y 82),
      (New-PointF -Scale $scale -X 56 -Y 82),
      (New-PointF -Scale $scale -X 37 -Y 101)
    )
    $tailBrush = [System.Drawing.SolidBrush]::new($white)
    $graphics.FillPolygon($tailBrush, $tail)
    $tailBrush.Dispose()
    $bubble.Dispose()

    $starShadow = New-StarPath -Scale $scale -CenterX 91 -CenterY 35 -OuterRadius 22 -InnerRadius 9
    $starShadowMatrix = [System.Drawing.Drawing2D.Matrix]::new()
    $starShadowMatrix.Translate(2 * $scale, 3 * $scale)
    $starShadow.Transform($starShadowMatrix)
    $starShadowMatrix.Dispose()
    $starShadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(75, 0, 66, 45))
    $graphics.FillPath($starShadowBrush, $starShadow)
    $starShadowBrush.Dispose()
    $starShadow.Dispose()

    $star = New-StarPath -Scale $scale -CenterX 91 -CenterY 35 -OuterRadius 22 -InnerRadius 9
    $starBrush = [System.Drawing.SolidBrush]::new($starYellow)
    $starPen = [System.Drawing.Pen]::new($deepGreen, [Math]::Max(1.0, 4 * $scale))
    $starPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $graphics.FillPath($starBrush, $star)
    $graphics.DrawPath($starPen, $star)
    $starBrush.Dispose()
    $starPen.Dispose()
    $star.Dispose()

    $linePen = [System.Drawing.Pen]::new($dark, [Math]::Max(2.0, 6 * $scale))
    $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($linePen, 37 * $scale, 48 * $scale, 72 * $scale, 48 * $scale)
    $graphics.DrawLine($linePen, 37 * $scale, 64 * $scale, 82 * $scale, 64 * $scale)
    $linePen.Dispose()

    $smallLinePen = [System.Drawing.Pen]::new($softWhite, [Math]::Max(1.0, 3 * $scale))
    $smallLinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $smallLinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($smallLinePen, 41 * $scale, 78 * $scale, 63 * $scale, 78 * $scale)
    $smallLinePen.Dispose()

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
