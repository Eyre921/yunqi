# ========================================
# Stress Test Results Analysis Tool
# Used to analyze stress test results and generate reports
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ResultFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "html",  # html, csv, json
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$CompareWith = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowCharts,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Color output function
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color.ToLower()) {
        "red" { Write-Host $Message -ForegroundColor Red }
        "green" { Write-Host $Message -ForegroundColor Green }
        "yellow" { Write-Host $Message -ForegroundColor Yellow }
        "blue" { Write-Host $Message -ForegroundColor Blue }
        "cyan" { Write-Host $Message -ForegroundColor Cyan }
        "magenta" { Write-Host $Message -ForegroundColor Magenta }
        default { Write-Host $Message -ForegroundColor White }
    }
}

# Load test results
function Load-TestResult {
    param([string]$FilePath)
    
    if (!(Test-Path $FilePath)) {
        Write-ColorOutput "Error: Cannot find result file $FilePath" "Red"
        return $null
    }
    
    try {
        $content = Get-Content $FilePath -Raw | ConvertFrom-Json
        return $content
    } catch {
        Write-ColorOutput "Error: Failed to parse result file: $($_.Exception.Message)" "Red"
        return $null
    }
}

# Calculate statistics
function Calculate-Statistics {
    param([object]$TestResult)
    
    $responseTimes = $TestResult.Results | Where-Object { $_.ResponseTime -gt 0 } | ForEach-Object { $_.ResponseTime }
    $errors = $TestResult.Results | Where-Object { $_.Error -ne $null -and $_.Error -ne "" }
    
    if ($responseTimes.Count -eq 0) {
        return @{
            TotalRequests = $TestResult.Results.Count
            SuccessfulRequests = 0
            FailedRequests = $TestResult.Results.Count
            SuccessRate = 0
            AverageResponseTime = 0
            MinResponseTime = 0
            MaxResponseTime = 0
            MedianResponseTime = 0
            P95ResponseTime = 0
            P99ResponseTime = 0
            RequestsPerSecond = 0
            ErrorRate = 100
            Errors = $errors
        }
    }
    
    $sortedTimes = $responseTimes | Sort-Object
    $totalRequests = $TestResult.Results.Count
    $successfulRequests = $responseTimes.Count
    $failedRequests = $totalRequests - $successfulRequests
    
    # Calculate percentiles
    $p50Index = [Math]::Floor($sortedTimes.Count * 0.5)
    $p95Index = [Math]::Floor($sortedTimes.Count * 0.95)
    $p99Index = [Math]::Floor($sortedTimes.Count * 0.99)
    
    $median = if ($sortedTimes.Count % 2 -eq 0) {
        ($sortedTimes[$p50Index - 1] + $sortedTimes[$p50Index]) / 2
    } else {
        $sortedTimes[$p50Index]
    }
    
    $duration = if ($TestResult.Duration) { $TestResult.Duration } else { 60 }
    $rps = if ($duration -gt 0) { $totalRequests / $duration } else { 0 }
    
    return @{
        TotalRequests = $totalRequests
        SuccessfulRequests = $successfulRequests
        FailedRequests = $failedRequests
        SuccessRate = [Math]::Round(($successfulRequests / $totalRequests) * 100, 2)
        AverageResponseTime = [Math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
        MinResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
        MaxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
        MedianResponseTime = [Math]::Round($median, 2)
        P95ResponseTime = [Math]::Round($sortedTimes[$p95Index], 2)
        P99ResponseTime = [Math]::Round($sortedTimes[$p99Index], 2)
        RequestsPerSecond = [Math]::Round($rps, 2)
        ErrorRate = [Math]::Round(($failedRequests / $totalRequests) * 100, 2)
        Errors = $errors
    }
}

# Generate HTML report
function Generate-HtmlReport {
    param(
        [object]$TestResult,
        [object]$Analysis,
        [string]$OutputPath
    )
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Stress Test Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .stats-table { border-collapse: collapse; width: 100%; }
        .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .stats-table th { background-color: #f2f2f2; }
        .error { color: red; }
        .success { color: green; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Stress Test Analysis Report</h1>
        <p>Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Test URL: $($TestResult.Url)</p>
        <p>Test Duration: $($TestResult.Duration) seconds</p>
        <p>Concurrent Users: $($TestResult.Concurrent)</p>
    </div>
    
    <div class="section">
        <h2>Performance Summary</h2>
        <table class="stats-table">
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Requests</td><td>$($Analysis.TotalRequests)</td></tr>
            <tr><td>Successful Requests</td><td class="success">$($Analysis.SuccessfulRequests)</td></tr>
            <tr><td>Failed Requests</td><td class="error">$($Analysis.FailedRequests)</td></tr>
            <tr><td>Success Rate</td><td>$($Analysis.SuccessRate)%</td></tr>
            <tr><td>Requests Per Second</td><td>$($Analysis.RequestsPerSecond)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Response Time Statistics</h2>
        <table class="stats-table">
            <tr><th>Metric</th><th>Value (ms)</th></tr>
            <tr><td>Average</td><td>$($Analysis.AverageResponseTime)</td></tr>
            <tr><td>Minimum</td><td>$($Analysis.MinResponseTime)</td></tr>
            <tr><td>Maximum</td><td>$($Analysis.MaxResponseTime)</td></tr>
            <tr><td>Median (50th percentile)</td><td>$($Analysis.MedianResponseTime)</td></tr>
            <tr><td>95th percentile</td><td>$($Analysis.P95ResponseTime)</td></tr>
            <tr><td>99th percentile</td><td>$($Analysis.P99ResponseTime)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Error Analysis</h2>
        <p>Error Rate: <span class="error">$($Analysis.ErrorRate)%</span></p>
        <p>Total Errors: $($Analysis.Errors.Count)</p>
"@

    if ($Analysis.Errors.Count -gt 0) {
        $html += "<h3>Error Details:</h3><ul>"
        $errorGroups = $Analysis.Errors | Group-Object -Property Error
        foreach ($group in $errorGroups) {
            $html += "<li>$($group.Name): $($group.Count) occurrences</li>"
        }
        $html += "</ul>"
    }
    
    $html += @"
    </div>
</body>
</html>
"@
    
    $html | Out-File -FilePath $OutputPath -Encoding UTF8
}

# Generate CSV report
function Generate-CsvReport {
    param(
        [object]$TestResult,
        [object]$Analysis,
        [string]$OutputPath
    )
    
    $csvData = @()
    $csvData += [PSCustomObject]@{
        Metric = "Total Requests"
        Value = $Analysis.TotalRequests
    }
    $csvData += [PSCustomObject]@{
        Metric = "Successful Requests"
        Value = $Analysis.SuccessfulRequests
    }
    $csvData += [PSCustomObject]@{
        Metric = "Failed Requests"
        Value = $Analysis.FailedRequests
    }
    $csvData += [PSCustomObject]@{
        Metric = "Success Rate (%)"
        Value = $Analysis.SuccessRate
    }
    $csvData += [PSCustomObject]@{
        Metric = "Requests Per Second"
        Value = $Analysis.RequestsPerSecond
    }
    $csvData += [PSCustomObject]@{
        Metric = "Average Response Time (ms)"
        Value = $Analysis.AverageResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "Min Response Time (ms)"
        Value = $Analysis.MinResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "Max Response Time (ms)"
        Value = $Analysis.MaxResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "Median Response Time (ms)"
        Value = $Analysis.MedianResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "95th Percentile (ms)"
        Value = $Analysis.P95ResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "99th Percentile (ms)"
        Value = $Analysis.P99ResponseTime
    }
    $csvData += [PSCustomObject]@{
        Metric = "Error Rate (%)"
        Value = $Analysis.ErrorRate
    }
    
    $csvData | Export-Csv -Path $OutputPath -NoTypeInformation -Encoding UTF8
}

# Generate JSON report
function Generate-JsonReport {
    param(
        [object]$TestResult,
        [object]$Analysis,
        [string]$OutputPath
    )
    
    $report = @{
        GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TestConfiguration = @{
            Url = $TestResult.Url
            Duration = $TestResult.Duration
            Concurrent = $TestResult.Concurrent
            Method = $TestResult.Method
        }
        Statistics = $Analysis
        RawResults = $TestResult.Results
    }
    
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
}

# Show console report
function Show-ConsoleReport {
    param(
        [object]$TestResult,
        [object]$Analysis
    )
    
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput "STRESS TEST ANALYSIS REPORT" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    
    Write-ColorOutput "`nTest Configuration:" "Yellow"
    Write-ColorOutput "  URL: $($TestResult.Url)" "White"
    Write-ColorOutput "  Duration: $($TestResult.Duration) seconds" "White"
    Write-ColorOutput "  Concurrent Users: $($TestResult.Concurrent)" "White"
    Write-ColorOutput "  HTTP Method: $($TestResult.Method)" "White"
    
    Write-ColorOutput "`nPerformance Summary:" "Yellow"
    Write-ColorOutput "  Total Requests: $($Analysis.TotalRequests)" "White"
    
    if ($Analysis.SuccessRate -ge 95) {
        Write-ColorOutput "  Successful Requests: $($Analysis.SuccessfulRequests)" "Green"
        Write-ColorOutput "  Success Rate: $($Analysis.SuccessRate)%" "Green"
    } elseif ($Analysis.SuccessRate -ge 90) {
        Write-ColorOutput "  Successful Requests: $($Analysis.SuccessfulRequests)" "Yellow"
        Write-ColorOutput "  Success Rate: $($Analysis.SuccessRate)%" "Yellow"
    } else {
        Write-ColorOutput "  Successful Requests: $($Analysis.SuccessfulRequests)" "Red"
        Write-ColorOutput "  Success Rate: $($Analysis.SuccessRate)%" "Red"
    }
    
    Write-ColorOutput "  Failed Requests: $($Analysis.FailedRequests)" "Red"
    Write-ColorOutput "  Requests Per Second: $($Analysis.RequestsPerSecond)" "White"
    
    Write-ColorOutput "`nResponse Time Statistics (ms):" "Yellow"
    Write-ColorOutput "  Average: $($Analysis.AverageResponseTime)" "White"
    Write-ColorOutput "  Minimum: $($Analysis.MinResponseTime)" "White"
    Write-ColorOutput "  Maximum: $($Analysis.MaxResponseTime)" "White"
    Write-ColorOutput "  Median (50th): $($Analysis.MedianResponseTime)" "White"
    Write-ColorOutput "  95th Percentile: $($Analysis.P95ResponseTime)" "White"
    Write-ColorOutput "  99th Percentile: $($Analysis.P99ResponseTime)" "White"
    
    Write-ColorOutput "`nError Analysis:" "Yellow"
    if ($Analysis.ErrorRate -eq 0) {
        Write-ColorOutput "  Error Rate: $($Analysis.ErrorRate)%" "Green"
        Write-ColorOutput "  No errors detected!" "Green"
    } else {
        Write-ColorOutput "  Error Rate: $($Analysis.ErrorRate)%" "Red"
        Write-ColorOutput "  Total Errors: $($Analysis.Errors.Count)" "Red"
        
        if ($Analysis.Errors.Count -gt 0) {
            Write-ColorOutput "`n  Error Breakdown:" "Red"
            $errorGroups = $Analysis.Errors | Group-Object -Property Error
            foreach ($group in $errorGroups) {
                Write-ColorOutput "    $($group.Name): $($group.Count) occurrences" "Red"
            }
        }
    }
    
    Write-ColorOutput "`n========================================" "Cyan"
}

# Main function
function Main {
    Write-ColorOutput "Stress Test Results Analysis Tool v1.0" "Cyan"
    
    # Check if ResultFile is provided
    if ([string]::IsNullOrWhiteSpace($ResultFile)) {
        Write-ColorOutput "[ERROR] ResultFile parameter is required" "Red"
        Write-ColorOutput "Use -Help to see usage information" "Yellow"
        return
    }
    
    # Load test results
    if ($VerboseOutput) {
        Write-ColorOutput "Loading test results from: $ResultFile" "Blue"
    }
    
    $testResult = Load-TestResult -FilePath $ResultFile
    if ($testResult -eq $null) {
        return
    }
    
    # Generate analysis
    Write-ColorOutput "Analyzing test results..." "Blue"
    $analysis = Calculate-Statistics -TestResult $testResult
    
    # Show console report
    Show-ConsoleReport -TestResult $testResult -Analysis $analysis
    
    # Generate output file
    if ($OutputFile -eq "") {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $OutputFile = "stress_test_analysis_$timestamp.$OutputFormat"
    }
    
    if ($VerboseOutput) {
        Write-ColorOutput "Generating $OutputFormat format report..." "Blue"
    }
    
    try {
        switch ($OutputFormat.ToLower()) {
            "html" {
                Generate-HtmlReport -TestResult $testResult -Analysis $analysis -OutputPath $OutputFile
                Write-ColorOutput "[OK] HTML report generated: $OutputFile" "Green"
            }
            "csv" {
                Generate-CsvReport -TestResult $testResult -Analysis $analysis -OutputPath $OutputFile
                Write-ColorOutput "[OK] CSV report generated: $OutputFile" "Green"
            }
            "json" {
                Generate-JsonReport -TestResult $testResult -Analysis $analysis -OutputPath $OutputFile
                Write-ColorOutput "[OK] JSON report generated: $OutputFile" "Green"
            }
            default {
                Write-ColorOutput "Unsupported output format: $OutputFormat" "Red"
            }
        }
    } catch {
        Write-ColorOutput "Error generating report: $($_.Exception.Message)" "Red"
    }
}

# Show help
function Show-Help {
    Write-Host @"
Stress Test Results Analysis Tool v1.0

Usage:
    .\analyze-results.ps1 -ResultFile <file_path> [parameters]

Parameters:
    -ResultFile <string>    Test result file path (required)
    -OutputFormat <string>  Output format: html, csv, json (default: html)
    -OutputFile <string>    Output file path (optional)
    -CompareWith <string>   Compare file path (optional)
    -ShowCharts            Show charts (optional)
    -VerboseOutput         Detailed output (optional)

Examples:
    # Generate HTML report
    .\analyze-results.ps1 -ResultFile "test_results.json"
    
    # Generate CSV report
    .\analyze-results.ps1 -ResultFile "test_results.json" -OutputFormat csv
    
    # Specify output file
    .\analyze-results.ps1 -ResultFile "test_results.json" -OutputFile "my_report.html"
"@
}

# Check help parameter
if ($Help -or $args -contains "--help" -or $args -contains "/?" -or $args -contains "-h") {
    Show-Help
    return
}

# Run main program
try {
    Main
} catch {
    Write-ColorOutput "Program execution error: $($_.Exception.Message)" "Red"
    if ($VerboseOutput) {
        Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Red"
    }
}

Write-ColorOutput "Analysis completed" "Green"