# PowerShell script to reorganize AdviceManagement components
# This script preserves existing functionality while organizing by type

Write-Host "Starting AdviceManagement reorganization..." -ForegroundColor Green

# Base path
$basePath = "C:\GitHub\AlterspectiveIDE\_IDE\Alt\AdviceManagement"

# Copy blade.js
Copy-Item "$basePath\AdvicePauseResumeBlade\blade.js" "$basePath\Blades\PauseResume\blade.js" -Force
Write-Host "✓ Copied blade.js"

# Move Foundation components
Copy-Item "$basePath\AdvicePauseResumeBlade\models\OngoingAdviceModel.js" "$basePath\Foundation\Models\OngoingAdviceModel.js" -Force
Copy-Item "$basePath\AdvicePauseResumeBlade\services\AttributeApiService.js" "$basePath\Foundation\Services\AttributeService.js" -Force
Copy-Item "$basePath\AdvicePauseResumeBlade\helpers\namespace.js" "$basePath\Foundation\Helpers\namespace.js" -Force
Write-Host "✓ Copied Foundation components"

# Copy other services to Foundation
Copy-Item "$basePath\services\UserService.js" "$basePath\Foundation\Services\UserService.js" -Force
Copy-Item "$basePath\AdviceStatusController\services\AdviceService.js" "$basePath\Foundation\Services\AdviceService.js" -Force

# Copy common folder to Foundation
Copy-Item "$basePath\common\*" "$basePath\Foundation\" -Recurse -Force
Write-Host "✓ Copied common components to Foundation"

# Move widgets
Copy-Item "$basePath\AdvicePausedWidget\*" "$basePath\Widgets\PausedNotification\" -Recurse -Force
Copy-Item "$basePath\AdviceSummaryCard\*" "$basePath\Widgets\SummaryCard\" -Recurse -Force  
Copy-Item "$basePath\AdviceBulkManager\*" "$basePath\Widgets\BulkManager\" -Recurse -Force
Write-Host "✓ Moved widgets"

# Move workflows
Copy-Item "$basePath\AdviceStatusChecker\*" "$basePath\Workflows\StatusChecker\" -Recurse -Force
Copy-Item "$basePath\AdviceStatusController\*" "$basePath\Workflows\StatusController\" -Recurse -Force
Write-Host "✓ Moved workflows"

# Move documentation
$docFiles = @(
    "DETAILED_IMPLEMENTATION.md",
    "END_USER_GUIDE.md", 
    "EVENTBUS_EXPLANATION.md",
    "EVENTBUS_VS_SHAREDO_ANALYSIS.md",
    "EVENT_SYSTEM_TESTING.md",
    "KNOWLEDGE_BASE_EVENT_SYSTEMS.md",
    "MIGRATION_SUMMARY.md",
    "REENGINEERING_PLAN.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path "$basePath\$doc") {
        Copy-Item "$basePath\$doc" "$basePath\Documentation\$doc" -Force
    }
}
Write-Host "✓ Moved documentation"

# Move tests
if (Test-Path "$basePath\AdviceStatusController\tests") {
    Copy-Item "$basePath\AdviceStatusController\tests\*" "$basePath\Tests\" -Recurse -Force
}
Write-Host "✓ Moved tests"

# Create component-specific READMEs
Copy-Item "$basePath\AdvicePauseResumeBlade\INSTRUCTIONS.md" "$basePath\Blades\PauseResume\README.md" -Force
Copy-Item "$basePath\AdviceStatusController\INTEGRATION-GUIDE.md" "$basePath\Workflows\StatusController\README.md" -Force
Copy-Item "$basePath\AdviceStatusChecker\README.md" "$basePath\Workflows\StatusChecker\README.md" -Force

Write-Host "✓ Component reorganization complete!" -ForegroundColor Green
Write-Host "Next: Update JSON configuration files with new paths" -ForegroundColor Yellow