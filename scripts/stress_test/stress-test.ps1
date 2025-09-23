# ========================================
# Yunqi Platform Stress Testing Script (Windows PowerShell)
# Target: http://47.238.240.231:3000/
# Author: AI Assistant
# Version: 1.0
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Url = "http://47.238.240.231:3000/",
    
    [Parameter(Mandatory=$false)]
    [int]$Concurrent = 10,
    
    [Parameter(Mandatory=$false)]
    [int]$Duration = 60,
    
    [Parameter(Mandatory=$false)]
    [int]$Requests = 0,
    
    [Parameter(Mandatory=$false)]
    [string]$Method = "GET",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowProgress,
    
    [Parameter(Mandatory=$false)]
    [string]$TestMode = "duration",  # duration, requests, ramp-up
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Global variables
$Global:TestResults = @()
$Global:StartTime = Get-Date
$Global:TotalRequests = 0
$Global:SuccessfulRequests = 0
$Global:FailedRequests = 0
$Global:ResponseTimes = @()
$Global:ErrorMessages = @()
$Global:IsRunning = $true

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

# Display banner
function Show-Banner {
    Clear-Host
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "    Yunqi Platform Stress Test Tool v1.0" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "Target URL: $Url" "Yellow"
    Write-ColorOutput "Concurrent: $Concurrent" "Yellow"
    Write-ColorOutput "Test Mode: $TestMode" "Yellow"
    
    if ($TestMode -eq "duration") {
        Write-ColorOutput "Duration: $Duration seconds" "Yellow"
    } elseif ($TestMode -eq "requests") {
        Write-ColorOutput "Total Requests: $Requests" "Yellow"
    }
    
    Write-ColorOutput "HTTP Method: $Method" "Yellow"
    Write-ColorOutput "========================================" "Cyan"
    Write-Host ""
}

# Check URL connectivity
function Test-UrlConnectivity {
    param([string]$TestUrl)
    
    if ($VerboseOutput) {
        Write-ColorOutput "Checking target URL connectivity..." "Yellow"
    }
    
    try {
        $response = Invoke-WebRequest -Uri $TestUrl -Method HEAD -TimeoutSec 10 -UseBasicParsing
        if ($VerboseOutput) {
            Write-ColorOutput "[OK] URL connectivity check passed" "Green"
        }
        return $true
    } catch {
        if ($VerboseOutput) {
            Write-ColorOutput "[ERROR] URL connectivity check failed: $($_.Exception.Message)" "Red"
        }
        return $false
    }
}

# Single HTTP request function
function Invoke-SingleRequest {
    param(
        [string]$RequestUrl,
        [string]$RequestMethod = "GET",
        [int]$RequestId
    )
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $result = @{
        RequestId = $RequestId
        Success = $false
        StatusCode = 0
        ResponseTime = 0
        ErrorMessage = ""
        Timestamp = Get-Date
    }
    
    try {
        $response = Invoke-WebRequest -Uri $RequestUrl -Method $RequestMethod -TimeoutSec 30 -UseBasicParsing
        $stopwatch.Stop()
        
        $result.Success = $true
        $result.StatusCode = $response.StatusCode
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        
        $Global:SuccessfulRequests++
        $Global:ResponseTimes += $result.ResponseTime
        
        if ($Verbose) {
            Write-ColorOutput "Request #$RequestId - Success ($($result.StatusCode)) - $($result.ResponseTime)ms" "Green"
        }
    }
    catch {
        $stopwatch.Stop()
        $result.ErrorMessage = $_.Exception.Message
        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        
        $Global:FailedRequests++
        $Global:ErrorMessages += $result.ErrorMessage
        
        if ($Verbose) {
            Write-ColorOutput "Request #$RequestId - Failed - $($result.ErrorMessage)" "Red"
        }
    }
    
    $Global:TotalRequests++
    return $result
}

# Concurrent request executor
function Start-ConcurrentRequests {
    param(
        [int]$ConcurrentCount,
        [int]$TestDuration,
        [int]$MaxRequests
    )
    
    $jobs = New-Object System.Collections.ArrayList
    $requestCounter = 0
    $endTime = (Get-Date).AddSeconds($TestDuration)
    
    Write-ColorOutput "Starting stress test..." "Green"
    Write-Host ""
    
    # Create progress display task
    if ($ShowProgress) {
        $progressJob = Start-Job -ScriptBlock {
            param($Duration)
            $start = Get-Date
            while ((Get-Date) -lt $start.AddSeconds($Duration)) {
                $elapsed = ((Get-Date) - $start).TotalSeconds
                $progress = [math]::Min(($elapsed / $Duration) * 100, 100)
                Write-Progress -Activity "Stress test in progress" -Status "Running for $([math]::Round($elapsed, 1)) seconds" -PercentComplete $progress
                Start-Sleep -Milliseconds 500
            }
        } -ArgumentList $TestDuration
    }
    
    while ($Global:IsRunning) {
        # Check stop conditions
        if ($TestMode -eq "duration" -and (Get-Date) -gt $endTime) {
            break
        }
        if ($TestMode -eq "requests" -and $requestCounter -ge $MaxRequests) {
            break
        }
        
        # Clean up completed jobs
        $runningJobs = $jobs | Where-Object { $_.State -eq "Running" }
        $jobs.Clear()
        if ($runningJobs) {
            foreach ($job in $runningJobs) {
                $jobs.Add($job) | Out-Null
            }
        }
        
        # Start new concurrent requests
        while ($jobs.Count -lt $ConcurrentCount -and $Global:IsRunning) {
            if ($TestMode -eq "requests" -and $requestCounter -ge $MaxRequests) {
                break
            }
            
            $requestCounter++
            $job = Start-Job -ScriptBlock {
                param($Url, $Method, $RequestId, $VerboseMode)
                
                $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                $result = @{
                    RequestId = $RequestId
                    Success = $false
                    StatusCode = 0
                    ResponseTime = 0
                    ErrorMessage = ""
                    Timestamp = Get-Date
                }
                
                try {
                    $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 30 -UseBasicParsing
                    $stopwatch.Stop()
                    
                    $result.Success = $true
                    $result.StatusCode = $response.StatusCode
                    $result.ResponseTime = $stopwatch.ElapsedMilliseconds
                }
                catch {
                    $stopwatch.Stop()
                    $result.ErrorMessage = $_.Exception.Message
                    $result.ResponseTime = $stopwatch.ElapsedMilliseconds
                }
                
                return $result
            } -ArgumentList $Url, $Method, $requestCounter, $VerboseOutput
            
            $jobs.Add($job) | Out-Null
        }
        
        # Collect completed results
        $completedJobs = $jobs | Where-Object { $_.State -eq "Completed" }
        foreach ($job in $completedJobs) {
            $result = Receive-Job -Job $job
            Remove-Job -Job $job
            
            if ($result.Success) {
                $Global:SuccessfulRequests++
                $Global:ResponseTimes += $result.ResponseTime
            } else {
                $Global:FailedRequests++
                $Global:ErrorMessages += $result.ErrorMessage
            }
            
            $Global:TotalRequests++
            $Global:TestResults += $result
        }
        
        # Real-time statistics display
        if ($ShowProgress -and ($Global:TotalRequests % 10 -eq 0)) {
            $elapsed = ((Get-Date) - $Global:StartTime).TotalSeconds
            $rps = if ($elapsed -gt 0) { [math]::Round($Global:TotalRequests / $elapsed, 2) } else { 0 }
            $successRate = if ($Global:TotalRequests -gt 0) { [math]::Round(($Global:SuccessfulRequests / $Global:TotalRequests) * 100, 2) } else { 0 }
            
            Write-Host "`rCompleted: $($Global:TotalRequests) | Success Rate: $successRate% | RPS: $rps" -NoNewline
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    # Wait for all jobs to complete
    Write-ColorOutput "`nWaiting for remaining requests to complete..." "Yellow"
    $jobs | Wait-Job | Out-Null
    
    # Collect remaining results
    foreach ($job in $jobs) {
        $result = Receive-Job -Job $job
        Remove-Job -Job $job
        
        if ($result.Success) {
            $Global:SuccessfulRequests++
            $Global:ResponseTimes += $result.ResponseTime
        } else {
            $Global:FailedRequests++
            $Global:ErrorMessages += $result.ErrorMessage
        }
        
        $Global:TotalRequests++
        $Global:TestResults += $result
    }
    
    # Clean up progress display task
    if ($ShowProgress -and $progressJob) {
        Stop-Job -Job $progressJob
        Remove-Job -Job $progressJob
    }
}

# Calculate statistics
function Get-TestStatistics {
    $endTime = Get-Date
    $totalDuration = ($endTime - $Global:StartTime).TotalSeconds
    
    $stats = @{
        TotalRequests = $Global:TotalRequests
        SuccessfulRequests = $Global:SuccessfulRequests
        FailedRequests = $Global:FailedRequests
        SuccessRate = if ($Global:TotalRequests -gt 0) { ($Global:SuccessfulRequests / $Global:TotalRequests) * 100 } else { 0 }
        TotalDuration = $totalDuration
        RequestsPerSecond = if ($totalDuration -gt 0) { $Global:TotalRequests / $totalDuration } else { 0 }
        AvgResponseTime = if ($Global:ResponseTimes.Count -gt 0) { ($Global:ResponseTimes | Measure-Object -Average).Average } else { 0 }
        MinResponseTime = if ($Global:ResponseTimes.Count -gt 0) { ($Global:ResponseTimes | Measure-Object -Minimum).Minimum } else { 0 }
        MaxResponseTime = if ($Global:ResponseTimes.Count -gt 0) { ($Global:ResponseTimes | Measure-Object -Maximum).Maximum } else { 0 }
        MedianResponseTime = 0
        P95ResponseTime = 0
        P99ResponseTime = 0
    }
    
    # Calculate percentiles
    if ($Global:ResponseTimes.Count -gt 0) {
        $sortedTimes = $Global:ResponseTimes | Sort-Object
        $count = $sortedTimes.Count
        
        $stats.MedianResponseTime = $sortedTimes[[math]::Floor($count * 0.5)]
        $stats.P95ResponseTime = $sortedTimes[[math]::Floor($count * 0.95)]
        $stats.P99ResponseTime = $sortedTimes[[math]::Floor($count * 0.99)]
    }
    
    return $stats
}

# Display test results
function Show-TestResults {
    param($Statistics)
    
    Write-Host ""
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "           Test Results Summary" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    
    Write-ColorOutput "Total Requests: $($Statistics.TotalRequests)" "White"
    Write-ColorOutput "Successful Requests: $($Statistics.SuccessfulRequests)" "Green"
    Write-ColorOutput "Failed Requests: $($Statistics.FailedRequests)" "Red"
    Write-ColorOutput "Success Rate: $([math]::Round($Statistics.SuccessRate, 2))%" "Yellow"
    Write-ColorOutput "Test Duration: $([math]::Round($Statistics.TotalDuration, 2)) seconds" "White"
    Write-ColorOutput "Average RPS: $([math]::Round($Statistics.RequestsPerSecond, 2))" "Yellow"
    
    Write-Host ""
    Write-ColorOutput "Response Time Statistics (milliseconds):" "Cyan"
    Write-ColorOutput "  Average: $([math]::Round($Statistics.AvgResponseTime, 2))" "White"
    Write-ColorOutput "  Minimum: $($Statistics.MinResponseTime)" "Green"
    Write-ColorOutput "  Maximum: $($Statistics.MaxResponseTime)" "Red"
    Write-ColorOutput "  Median: $($Statistics.MedianResponseTime)" "White"
    Write-ColorOutput "  95th Percentile: $($Statistics.P95ResponseTime)" "Yellow"
    Write-ColorOutput "  99th Percentile: $($Statistics.P99ResponseTime)" "Yellow"
    
    # Display error statistics
    if ($Global:ErrorMessages.Count -gt 0) {
        Write-Host ""
        Write-ColorOutput "Error Statistics:" "Red"
        $errorGroups = $Global:ErrorMessages | Group-Object | Sort-Object Count -Descending
        foreach ($group in $errorGroups) {
            Write-ColorOutput "  $($group.Name): $($group.Count) times" "Red"
        }
    }
    
    Write-ColorOutput "========================================" "Cyan"
}

# Save results to file
function Save-TestResults {
    param(
        [string]$FilePath,
        $Statistics
    )
    
    if ([string]::IsNullOrEmpty($FilePath)) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $FilePath = "stress_test_result_$timestamp.json"
    }
    
    $reportData = @{
        TestConfiguration = @{
            Url = $Url
            Concurrent = $Concurrent
            Duration = $Duration
            Requests = $Requests
            Method = $Method
            TestMode = $TestMode
        }
        Statistics = $Statistics
        DetailedResults = $Global:TestResults
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        $reportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $FilePath -Encoding UTF8
        Write-ColorOutput "Test results saved to: $FilePath" "Green"
    }
    catch {
        Write-ColorOutput "Failed to save results: $($_.Exception.Message)" "Red"
    }
}

# Load configuration file
function Load-ConfigFile {
    param([string]$ConfigPath)
    
    if ([string]::IsNullOrEmpty($ConfigPath) -or !(Test-Path $ConfigPath)) {
        return $null
    }
    
    try {
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        Write-ColorOutput "Configuration file loaded: $ConfigPath" "Green"
        return $config
    }
    catch {
        Write-ColorOutput "Failed to load configuration file: $($_.Exception.Message)" "Red"
        return $null
    }
}

# Signal handler (Ctrl+C)
function Register-SignalHandler {
    [Console]::TreatControlCAsInput = $false
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        $Global:IsRunning = $false
        Write-ColorOutput "`nStop signal received, exiting safely..." "Yellow"
    }
}

# Main function
function Main {
    # Register signal handler
    Register-SignalHandler
    
    # Display banner
    Show-Banner
    
    # Load configuration file
    if (![string]::IsNullOrEmpty($ConfigFile)) {
        $config = Load-ConfigFile -ConfigPath $ConfigFile
        if ($config) {
            # Apply configuration file settings
            if ($config.Url) { $Script:Url = $config.Url }
            if ($config.Concurrent) { $Script:Concurrent = $config.Concurrent }
            if ($config.Duration) { $Script:Duration = $config.Duration }
            if ($config.Requests) { $Script:Requests = $config.Requests }
            if ($config.Method) { $Script:Method = $config.Method }
            if ($config.TestMode) { $Script:TestMode = $config.TestMode }
        }
    }
    
    # Validate parameters
    if ($TestMode -eq "requests" -and $Requests -le 0) {
        Write-ColorOutput "Error: Valid request count must be specified in request mode" "Red"
        return
    }
    
    # Check URL connectivity
    if (!(Test-UrlConnectivity -TestUrl $Url)) {
        Write-ColorOutput "Cannot connect to target URL, test terminated" "Red"
        return
    }
    
    Write-Host ""
    Write-ColorOutput "Press Ctrl+C to stop the test at any time" "Yellow"
    Write-Host ""
    
    # Start stress test
    $Global:StartTime = Get-Date
    
    if ($TestMode -eq "duration") {
        Start-ConcurrentRequests -ConcurrentCount $Concurrent -TestDuration $Duration -MaxRequests 0
    } elseif ($TestMode -eq "requests") {
        Start-ConcurrentRequests -ConcurrentCount $Concurrent -TestDuration 3600 -MaxRequests $Requests
    }
    
    # Calculate and display results
    $statistics = Get-TestStatistics
    Show-TestResults -Statistics $statistics
    
    # Save results
    if (![string]::IsNullOrEmpty($OutputFile) -or $Global:TotalRequests -gt 0) {
        Save-TestResults -FilePath $OutputFile -Statistics $statistics
    }
}

# Display help information
function Show-Help {
    Write-ColorOutput @"
Yunqi Platform Stress Test Tool v1.0

Usage:
    .\stress-test.ps1 [parameters]

Parameters:
    -Url <string>           Target URL (default: http://47.238.240.231:3000/)
    -Concurrent <int>       Concurrent users (default: 10)
    -Duration <int>         Test duration in seconds (default: 60)
    -Requests <int>         Total requests (for request mode)
    -Method <string>        HTTP method (default: GET)
    -TestMode <string>      Test mode: duration, requests (default: duration)
    -ConfigFile <string>    Configuration file path
    -OutputFile <string>    Result output file path
    -VerboseOutput         Show detailed output
    -ShowProgress          Show real-time progress
    -Help                  Show this help information

Examples:
    # Basic stress test (10 concurrent, 60 seconds)
    .\stress-test.ps1
    
    # High concurrency short test
    .\stress-test.ps1 -Concurrent 50 -Duration 30 -ShowProgress
    
    # Fixed request count test
    .\stress-test.ps1 -TestMode requests -Requests 1000 -Concurrent 20
    
    # Using configuration file
    .\stress-test.ps1 -ConfigFile "test-config.json" -OutputFile "result.json"
    
    # Verbose mode
.\stress-test.ps1 -Concurrent 5 -Duration 10 -VerboseOutput -ShowProgress

"@ "Cyan"
}

# Check if help should be displayed
if ($Help) {
    Show-Help
    return
}

# Run main program
try {
    Main
}
catch {
    Write-ColorOutput "Program execution error: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Red"
}
finally {
    # Clean up resources
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "`nTest completed." "Green"
}