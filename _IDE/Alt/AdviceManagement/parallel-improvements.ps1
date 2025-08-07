# PowerShell Script for Parallel AI Improvements
# This script spawns multiple Claude instances to work on improvements in parallel

Write-Host "🚀 Starting Parallel Improvement Implementation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$baseDir = "C:\GitHub\AlterspectiveIDE\_IDE\Alt\AdviceManagement"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Task definitions for each AI instance
$tasks = @(
    @{
        Name = "UserExperienceBundle"
        Description = "Add status badges and keyboard shortcuts"
        Instructions = @"
Please implement the following improvements for the AdviceManagement module:

1. STATUS BADGES:
   - Add a badge to AdvicePausedWidget showing count of paused items
   - Add a badge to AdviceSummaryCard showing days paused
   - Use existing KnockoutJS patterns
   Location: Update existing widget files

2. KEYBOARD SHORTCUTS:
   - Space bar = pause/resume toggle
   - R = resume
   - P = pause
   - ESC = close panels
   Add to: AdvicePausedWidget, AdviceSummaryCard, AdviceBulkManager

Use the existing patterns in the codebase. Keep it simple.
Commit when done with message: "Add status badges and keyboard shortcuts"
"@
    },
    @{
        Name = "DeveloperBundle"
        Description = "Add debug mode and basic performance metrics"
        Instructions = @"
Please implement the following improvements for the AdviceManagement module:

1. DEBUG MODE:
   Create file: common/DebugMode.js
   - Toggle with Ctrl+Shift+D
   - Show performance metrics (API call times)
   - Log all events to console
   - Show current state in corner overlay

2. BASIC TESTS:
   Create file: tests/integration.test.js
   - Test widget loading
   - Test API service calls
   - Test event bus communication
   - Use existing Jasmine patterns

Keep it simple and maintainable.
Commit when done with message: "Add debug mode and integration tests"
"@
    }
)

# Function to create task file
function Create-TaskFile {
    param($task)
    
    $fileName = "$baseDir\tasks\$($task.Name)-$timestamp.md"
    
    # Create tasks directory if it doesn't exist
    if (!(Test-Path "$baseDir\tasks")) {
        New-Item -ItemType Directory -Path "$baseDir\tasks" | Out-Null
    }
    
    # Write task instructions
    Set-Content -Path $fileName -Value $task.Instructions
    
    Write-Host "✓ Created task file: $fileName" -ForegroundColor Green
    return $fileName
}

# Create task files
Write-Host "`nCreating task files..." -ForegroundColor Yellow
$taskFiles = @()
foreach ($task in $tasks) {
    $taskFiles += Create-TaskFile -task $task
}

# Display instructions
Write-Host "`n" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  PARALLEL EXECUTION INSTRUCTIONS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "`n"

Write-Host "The Foundation Bundle is being implemented by the current AI." -ForegroundColor Cyan
Write-Host "`nFor parallel execution, open 2 new Claude instances and provide:" -ForegroundColor Yellow
Write-Host "`n"

$i = 1
foreach ($task in $tasks) {
    Write-Host "INSTANCE $($i):" -ForegroundColor Green
    Write-Host "  Task: $($task.Description)" -ForegroundColor White
    $taskPath = "$baseDir\tasks\$($task.Name)-$timestamp.md"
    Write-Host "  Say: 'Please work on the task in: $taskPath'" -ForegroundColor Gray
    Write-Host ""
    $i++
}

Write-Host "Each AI will work independently and commit when complete." -ForegroundColor Cyan
Write-Host "`n"

# Create coordination file
$coordFile = "$baseDir\tasks\coordination-$timestamp.json"
@{
    Timestamp = $timestamp
    Tasks = @(
        @{Bundle = "Foundation"; Status = "in-progress"; AssignedTo = "Current-AI"}
        @{Bundle = "UserExperience"; Status = "pending"; AssignedTo = "AI-Instance-2"}
        @{Bundle = "Developer"; Status = "pending"; AssignedTo = "AI-Instance-3"}
    )
    StartTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Set-Content -Path $coordFile

Write-Host "Coordination file created: $coordFile" -ForegroundColor Green
Write-Host "Foundation Bundle implementation starting now..." -ForegroundColor Cyan

# Return success
exit 0