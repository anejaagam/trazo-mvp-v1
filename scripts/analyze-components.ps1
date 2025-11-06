# Component Import Analysis Script
# Analyzes usage of all components in /components/ui/

$componentsPath = "d:\TrazoMVP\trazo-mvp-v1\components\ui"
$searchPaths = @(
    "d:\TrazoMVP\trazo-mvp-v1\app",
    "d:\TrazoMVP\trazo-mvp-v1\components"
)

# Exclude patterns
$excludePatterns = @(
    "*\Prototypes\*",
    "*\archive\*",
    "*\node_modules\*",
    "*.test.tsx",
    "*.test.ts",
    "*\components\ui\*"  # Don't count internal imports within ui folder
)

Write-Host "=== COMPONENT IMPORT ANALYSIS ===" -ForegroundColor Cyan
Write-Host ""

# Get all UI components
$components = Get-ChildItem -Path $componentsPath -Filter "*.tsx" | ForEach-Object {
    $_.BaseName
}

$results = @()

foreach ($component in $components) {
    $pattern = "@/components/ui/$component"
    
    # Count imports across all search paths
    $allMatches = @()
    foreach ($searchPath in $searchPaths) {
        $matches = Select-String -Path "$searchPath\**\*.tsx","$searchPath\**\*.ts" `
            -Pattern $pattern `
            -ErrorAction SilentlyContinue |
            Where-Object {
                $exclude = $false
                foreach ($excludePattern in $excludePatterns) {
                    if ($_.Path -like $excludePattern) {
                        $exclude = $true
                        break
                    }
                }
                -not $exclude
            }
        $allMatches += $matches
    }
    
    $count = ($allMatches | Measure-Object).Count
    $files = ($allMatches | Select-Object -ExpandProperty Path -Unique | Measure-Object).Count
    
    $results += [PSCustomObject]@{
        Component = $component
        Imports = $count
        Files = $files
        Status = if ($count -eq 0) { "UNUSED" } elseif ($count -lt 3) { "LOW" } else { "ACTIVE" }
    }
}

# Display results sorted by usage
Write-Host "Components sorted by usage:" -ForegroundColor Yellow
$results | Sort-Object Imports -Descending | Format-Table -AutoSize

# Summary statistics
$totalComponents = $results.Count
$unusedComponents = ($results | Where-Object { $_.Imports -eq 0 }).Count
$lowUseComponents = ($results | Where-Object { $_.Imports -gt 0 -and $_.Imports -lt 3 }).Count
$activeComponents = ($results | Where-Object { $_.Imports -ge 3 }).Count

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Components: $totalComponents"
Write-Host "Active (3+ imports): $activeComponents" -ForegroundColor Green
Write-Host "Low Use (1-2 imports): $lowUseComponents" -ForegroundColor Yellow
Write-Host "Unused (0 imports): $unusedComponents" -ForegroundColor Red

Write-Host ""
Write-Host "=== UNUSED COMPONENTS ===" -ForegroundColor Red
$results | Where-Object { $_.Imports -eq 0 } | Select-Object Component | Format-Table -HideTableHeaders

Write-Host ""
Write-Host "=== LOW USE COMPONENTS ===" -ForegroundColor Yellow
$results | Where-Object { $_.Imports -gt 0 -and $_.Imports -lt 3 } | Format-Table -AutoSize

# Export to CSV for further analysis
$csvPath = "d:\TrazoMVP\trazo-mvp-v1\docs\archived_docs\component-usage-analysis.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "Full results exported to: $csvPath" -ForegroundColor Green
