# ========================================
# Quick Stress Test Script
# Provides one-click common test scenarios
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Scenario = "menu",  # menu, light, normal, high, stress, spike, endurance
    
    [Parameter(Mandatory=$false)]
    [string]$Url = "http://47.238.240.231:3000/",
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoReport,
    
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

# Show banner
function Show-Banner {
    Clear-Host
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "    Quick Stress Test Tool v1.0" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "Target: $Url" "Yellow"
    Write-ColorOutput "========================================" "Cyan"
    Write-Host ""
}

# Show test scenario menu
function Show-ScenarioMenu {
    Write-ColorOutput "Available Test Scenarios:" "Yellow"
    Write-Host ""
    Write-ColorOutput "1. Light Load Test      (5 concurrent, 30s)" "Green"
    Write-ColorOutput "2. Normal Load Test     (20 concurrent, 120s)" "Green"
    Write-ColorOutput "3. High Load Test       (50 concurrent, 300s)" "Yellow"
    Write-ColorOutput "4. Stress Test          (100 concurrent, 600s)" "Red"
    Write-ColorOutput "5. Spike Test           (200 concurrent, 60s)" "Magenta"
    Write-ColorOutput "6. Endurance Test       (30 concurrent, 1800s)" "Blue"
    Write-ColorOutput "7. API Interface Test   (25 concurrent, 180s)" "Cyan"
    Write-Host ""
    Write-ColorOutput "0. Exit" "Red"
    Write-Host ""
}

# Get test configuration
function Get-TestConfig {
    param([string]$ScenarioType)
    
    $configs = @{
        "light" = @{
            Name = "Light Load Test"
            Concurrent = 5
            Duration = 30
            Description = "Basic load test for initial validation"
        }
        "normal" = @{
            Name = "Normal Load Test"
            Concurrent = 20
            Duration = 120
            Description = "Standard load test for typical usage"
        }
        "high" = @{
            Name = "High Load Test"
            Concurrent = 50
            Duration = 300
            Description = "High load test for peak traffic simulation"
        }
        "stress" = @{
            Name = "Stress Test"
            Concurrent = 100
            Duration = 600
            Description = "Stress test to find system limits"
        }
        "spike" = @{
            Name = "Spike Test"
            Concurrent = 200
            Duration = 60
            Description = "Spike test for sudden traffic bursts"
        }
        "endurance" = @{
            Name = "Endurance Test"
            Concurrent = 30
            Duration = 1800
            Description = "Long-duration test for stability validation"
        }
        "api" = @{
            Name = "API Interface Test"
            Concurrent = 25
            Duration = 180
            Description = "API endpoint performance test"
        }
    }
    
    return $configs[$ScenarioType]
}

# Execute stress test
function Execute-StressTest {
    param(
        [string]$TestUrl,
        [int]$Concurrent,
        [int]$Duration,
        [string]$TestName,
        [bool]$GenerateReport = $false
    )
    
    Write-ColorOutput "`nStarting $TestName..." "Green"
    Write-ColorOutput "Target URL: $TestUrl" "White"
    Write-ColorOutput "Concurrent Users: $Concurrent" "White"
    Write-ColorOutput "Duration: $Duration seconds" "White"
    Write-Host ""
    
    # Build stress test command parameters
    $stressTestParams = @{
        Url = $TestUrl
        Concurrent = $Concurrent
        Duration = $Duration
        ShowProgress = $true
    }
    
    if ($VerboseOutput) {
        $stressTestParams.VerboseOutput = $true
    }
    
    try {
        # Execute stress test
        & ".\stress-test.ps1" @stressTestParams
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "`n[OK] Test completed successfully!" "Green"
            
            # Generate report if requested
            if ($GenerateReport) {
                Write-ColorOutput "Generating HTML report..." "Blue"
                
                # Find the latest result file
                $resultFiles = Get-ChildItem -Path "." -Filter "stress_test_result_*.json" | Sort-Object LastWriteTime -Descending
                if ($resultFiles.Count -gt 0) {
                    $latestResult = $resultFiles[0].FullName
                    $reportFile = "quick_test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').html"
                    
                    & ".\analyze-results.ps1" -ResultFile $latestResult -OutputFormat "html" -OutputFile $reportFile
                    
                    if (Test-Path $reportFile) {
                        Write-ColorOutput "[OK] Report generated: $reportFile" "Green"
                    }
                } else {
                    Write-ColorOutput "[WARNING] No result file found for report generation" "Yellow"
                }
            }
        } else {
            Write-ColorOutput "[ERROR] Test failed with exit code: $LASTEXITCODE" "Red"
        }
    } catch {
        Write-ColorOutput "[ERROR] Failed to execute test: $($_.Exception.Message)" "Red"
    }
}

# Interactive menu mode
function Start-InteractiveMode {
    do {
        Show-Banner
        Show-ScenarioMenu
        
        $choice = Read-Host "Please select a test scenario (0-7)"
        
        switch ($choice) {
            "1" {
                $config = Get-TestConfig -ScenarioType "light"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "2" {
                $config = Get-TestConfig -ScenarioType "normal"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "3" {
                $config = Get-TestConfig -ScenarioType "high"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "4" {
                $config = Get-TestConfig -ScenarioType "stress"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "5" {
                $config = Get-TestConfig -ScenarioType "spike"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "6" {
                $config = Get-TestConfig -ScenarioType "endurance"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "7" {
                $config = Get-TestConfig -ScenarioType "api"
                Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
            }
            "0" {
                Write-ColorOutput "Exiting..." "Yellow"
                return
            }
            default {
                Write-ColorOutput "Invalid selection. Please choose 0-7." "Red"
                Start-Sleep -Seconds 2
            }
        }
        
        if ($choice -ne "0") {
            Write-Host ""
            Write-ColorOutput "Press any key to continue..." "Yellow"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    } while ($choice -ne "0")
}

# Direct scenario execution
function Execute-DirectScenario {
    param([string]$ScenarioType)
    
    $config = Get-TestConfig -ScenarioType $ScenarioType
    
    if ($config) {
        Show-Banner
        Write-ColorOutput "Executing: $($config.Name)" "Green"
        Write-ColorOutput "Description: $($config.Description)" "White"
        Write-Host ""
        
        Execute-StressTest -TestUrl $Url -Concurrent $config.Concurrent -Duration $config.Duration -TestName $config.Name -GenerateReport $AutoReport
    } else {
        Write-ColorOutput "Unknown scenario: $ScenarioType" "Red"
        Write-ColorOutput "Available scenarios: light, normal, high, stress, spike, endurance, api" "Yellow"
    }
}

# Custom configuration mode
function Start-CustomConfig {
    Show-Banner
    Write-ColorOutput "Custom Test Configuration" "Yellow"
    Write-Host ""
    
    # Get custom parameters
    $customUrl = Read-Host "Target URL (default: $Url)"
    if ([string]::IsNullOrWhiteSpace($customUrl)) {
        $customUrl = $Url
    }
    
    $customConcurrent = Read-Host "Concurrent users (default: 20)"
    if ([string]::IsNullOrWhiteSpace($customConcurrent)) {
        $customConcurrent = 20
    } else {
        $customConcurrent = [int]$customConcurrent
    }
    
    $customDuration = Read-Host "Test duration in seconds (default: 120)"
    if ([string]::IsNullOrWhiteSpace($customDuration)) {
        $customDuration = 120
    } else {
        $customDuration = [int]$customDuration
    }
    
    $generateReport = Read-Host "Generate HTML report? (y/N)"
    $shouldGenerateReport = $generateReport -eq "y" -or $generateReport -eq "Y"
    
    # Execute custom test
    Execute-StressTest -TestUrl $customUrl -Concurrent $customConcurrent -Duration $customDuration -TestName "Custom Test" -GenerateReport $shouldGenerateReport
}

# Main function
function Main {
    # Check if stress-test.ps1 exists
    if (!(Test-Path ".\stress-test.ps1")) {
        Write-ColorOutput "[ERROR] stress-test.ps1 not found in current directory" "Red"
        Write-ColorOutput "Please ensure stress-test.ps1 is in the same directory as this script" "Yellow"
        return
    }
    
    # Check if analyze-results.ps1 exists (for report generation)
    if ($AutoReport -and !(Test-Path ".\analyze-results.ps1")) {
        Write-ColorOutput "[WARNING] analyze-results.ps1 not found. Report generation will be skipped" "Yellow"
    }
    
    if ($Scenario -eq "menu") {
        Start-InteractiveMode
    } elseif ($Scenario -eq "custom") {
        Start-CustomConfig
    } else {
        Execute-DirectScenario -ScenarioType $Scenario
    }
}

# Show help
function Show-Help {
    Write-Host @"
Quick Stress Test Tool v1.0

Usage:
    .\quick-test.ps1 [parameters]

Parameters:
    -Scenario <string>     Test scenario: light, normal, high, stress, spike, endurance, api      
    -Url <string>          Target URL (default: http://47.238.240.231:3000/)
    -AutoReport           Auto-generate HTML report
    -VerboseOutput        Show detailed output

Test Scenario Descriptions:
    light      - Light load test (5 concurrent, 30s)
    normal     - Normal load test (20 concurrent, 120s)
    high       - High load test (50 concurrent, 300s)
    stress     - Stress test (100 concurrent, 600s)
    spike      - Spike test (200 concurrent, 60s)
    endurance  - Endurance test (30 concurrent, 1800s)
    api        - API interface test (25 concurrent, 180s)

Examples:
    # Interactive menu
    .\quick-test.ps1
    
    # Direct light load test
    .\quick-test.ps1 -Scenario light
    
    # Execute stress test with auto report
    .\quick-test.ps1 -Scenario stress -AutoReport     
    
    # Test different URL
    .\quick-test.ps1 -Scenario normal -Url "https://example.com"
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

Write-ColorOutput "Quick test completed" "Green"