Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("public/assets/font4.png")
$bmp = new-object System.Drawing.Bitmap($img)
$color = $bmp.GetPixel(10,10)
$hex = "#{0:X2}{1:X2}{2:X2}" -f $color.R, $color.G, $color.B
Write-Host $hex
