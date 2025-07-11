# Migration script to replace CDN links with self-hosted resources
Write-Host "Starting migration from CDN to self-hosted resources..." -ForegroundColor Green

# Get all HTML files
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Replace CDN links with self-hosted versions
    # Note: Paths are relative to the HTML file location
    
    # Calculate relative path to assets
    $relativePath = ""
    $depth = (($file.DirectoryName.Split('\') | Measure-Object).Count) - (($PWD.Path.Split('\') | Measure-Object).Count)
    for ($i = 0; $i < $depth; $i++) {
        $relativePath += "../"
    }
    $relativePath += "assets/"
    
    # Replace TailwindCSS CDN
    if ($content -match 'script src="https://cdn\.tailwindcss\.com"') {
        $content = $content -replace 'script src="https://cdn\.tailwindcss\.com"', 'link rel="stylesheet" href="' + $relativePath + 'css/tailwind.css"'
        $modified = $true
        Write-Host "  - Replaced TailwindCSS CDN" -ForegroundColor Cyan
    }
    
    # Replace Chart.js CDN
    if ($content -match 'script src="https://cdn\.jsdelivr\.net/npm/chart\.js"') {
        $content = $content -replace 'script src="https://cdn\.jsdelivr\.net/npm/chart\.js"', 'script src="' + $relativePath + 'js/chart.js"'
        $modified = $true
        Write-Host "  - Replaced Chart.js CDN" -ForegroundColor Cyan
    }
    
    # Replace MathJax CDN
    if ($content -match 'script id="MathJax-script" async src="https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-mml-chtml\.js"') {
        $content = $content -replace 'script id="MathJax-script" async src="https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-mml-chtml\.js"', 'script src="' + $relativePath + 'js/mathjax.js" async'
        $modified = $true
        Write-Host "  - Replaced MathJax CDN" -ForegroundColor Cyan
    }
    
    # Replace html2canvas CDN
    if ($content -match 'script src="https://cdnjs\.cloudflare\.com/ajax/libs/html2canvas/1\.4\.1/html2canvas\.min\.js"') {
        $content = $content -replace 'script src="https://cdnjs\.cloudflare\.com/ajax/libs/html2canvas/1\.4\.1/html2canvas\.min\.js"', 'script src="' + $relativePath + 'js/html2canvas.min.js"'
        $modified = $true
        Write-Host "  - Replaced html2canvas CDN" -ForegroundColor Cyan
    }
    
    # Replace jsPDF CDN
    if ($content -match 'script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf/2\.5\.1/jspdf\.umd\.min\.js"') {
        $content = $content -replace 'script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf/2\.5\.1/jspdf\.umd\.min\.js"', 'script src="' + $relativePath + 'js/jspdf.umd.min.js"'
        $modified = $true
        Write-Host "  - Replaced jsPDF CDN" -ForegroundColor Cyan
    }
    
    # Replace Google Fonts CDN
    if ($content -match 'link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"') {
        $content = $content -replace 'link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"', 'link rel="stylesheet" href="' + $relativePath + 'css/shared.css"'
        $modified = $true
        Write-Host "  - Replaced Google Fonts CDN" -ForegroundColor Cyan
    }
    
    # Replace Google Fonts @import
    if ($content -match '@import url\(''https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;600;700&display=swap''\)') {
        $content = $content -replace '@import url\(''https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;600;700&display=swap''\)', '@import url("' + $relativePath + 'css/shared.css")'
        $modified = $true
        Write-Host "  - Replaced Google Fonts @import" -ForegroundColor Cyan
    }
    
    # Add shared.js if not present and if other scripts are being used
    if ($content -match 'chart\.js' -or $content -match 'mathjax' -or $content -match 'switchContent') {
        if ($content -notmatch 'shared\.js') {
            # Find the first script tag and add shared.js before it
            $content = $content -replace '(script)', 'script src="' + $relativePath + 'js/shared.js"' + "`n" + '<$1'
            $modified = $true
            Write-Host "  - Added shared.js" -ForegroundColor Cyan
        }
    }
    
    # Remove MathJax configuration if it exists (now in shared.js)
    if ($content -match 'window\.MathJax = \{') {
        $content = $content -replace '(?s)window\.MathJax = \{.*?\};', ''
        $modified = $true
        Write-Host "  - Removed MathJax configuration (now in shared.js)" -ForegroundColor Cyan
    }
    
    # Save the modified content if changes were made
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated file" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`nMigration complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test all HTML files to ensure they load correctly" -ForegroundColor White
Write-Host "2. Check that charts, MathJax, and interactive features work" -ForegroundColor White
Write-Host "3. Verify that styles are applied correctly" -ForegroundColor White
Write-Host "4. Test in different browsers" -ForegroundColor White
Write-Host "5. Check the browser's network tab to confirm no external requests" -ForegroundColor White 