# AdviceStatusChecker Workflow Action

A ShareDo visual workflow action that checks the ongoing advice status for a work item and returns detailed advice information with two clear outcomes: "Advice Running" or "Advice Paused".

## Overview

This workflow action provides a straightforward way to check advice status in ShareDo workflows without performing any modifications. It simply retrieves the current advice status and all related information, then branches to one of two outcomes based on whether advice is currently active or paused.

## Usage

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workItemId` | string | Yes | The ID of the work item to check |

### Output Parameters

The action returns comprehensive advice information that can be mapped to workflow data fields:

| Parameter | Type | Description |
|-----------|------|-------------|
| `isEnabled` | boolean | Whether advice is currently enabled/running |
| `status` | string | Current status as text ("active" or "paused") |
| `pausedDate` | string | ISO date when advice was paused (null if never paused) |
| `pausedBy` | string | Name of user who paused advice |
| `pauseReason` | string | Reason provided when advice was paused |
| `resumedDate` | string | ISO date when advice was last resumed |
| `resumedBy` | string | Name of user who resumed advice |
| `resumeReason` | string | Reason provided when advice was resumed |
| `nextAdviceDate` | string | ISO date when next advice is scheduled |
| `success` | boolean | Whether the status check completed successfully |
| `errorMessage` | string | Error message if the check failed |

### Branch Outcomes

The workflow action has three possible outcomes:

1. **Advice Running** (`adviceRunning`) - Green
   - Advice is currently active/enabled
   - Next actions might include scheduling tasks or notifications

2. **Advice Paused** (`advicePaused`) - Yellow  
   - Advice is currently paused/disabled
   - Next actions might include reminder notifications or escalations

3. **Error** (`error`) - Red
   - Failed to check advice status
   - Could be due to invalid work item ID, permissions, or system issues

## Example Workflow Usage

### Basic Status Check
```
[Work Item Context] → [AdviceStatusChecker] → [Advice Running] → [Schedule Advice Task]
                                           → [Advice Paused] → [Send Reminder Email]
                                           → [Error] → [Log Error]
```

### Data Field Mapping
You can map any of the output parameters to workflow data fields for use in subsequent actions:

- Map `status` to a text field for display in emails
- Map `pausedBy` to track who made changes
- Map `nextAdviceDate` to schedule follow-up actions
- Map `pauseReason` to include context in notifications

### Conditional Logic Examples

1. **Send different emails based on status**:
   - Running: "Advice is active - next review due on {nextAdviceDate}"
   - Paused: "Advice was paused by {pausedBy} - reason: {pauseReason}"

2. **Create different tasks based on status**:
   - Running: Schedule review task for {nextAdviceDate}
   - Paused: Create reminder task for manager

3. **Log different audit entries**:
   - Running: "Advice status check - currently active"
   - Paused: "Advice status check - paused since {pausedDate}"

## Technical Details

### API Integration
- Uses ShareDo's `/api/v1/public/workItem/{workItemId}/attributes` endpoint
- Handles legacy work-types where advice attributes may not exist
- Provides graceful error handling and timeout management

### Legacy Compatibility
- If `alt_ongoing_advice_enabled` attribute is null or undefined, defaults to `true` (active)
- This ensures compatibility with legacy work-types that didn't have advice management

### Performance
- Simple read-only operation with minimal processing
- 15-second timeout to prevent workflow delays
- Caches attribute lookups for efficiency

## Error Handling

Common error scenarios and their handling:

1. **Invalid Work Item ID**: Returns error branch with descriptive message
2. **Missing Permissions**: API error passed through to error branch
3. **Network Issues**: Timeout handling with clear error message
4. **Missing Attributes**: Graceful defaults for legacy work-types

## Installation

1. Deploy the workflow action files to ShareDo
2. Register the action in the workflow designer
3. The action will be available in the "Advice Management" category

## Files

- `AdviceStatusChecker.wf-action.json` - ShareDo workflow action configuration
- `AdviceStatusChecker-factory.js` - Workflow action factory for model creation
- `AdviceStatusChecker-template.js` - Code generation template
- `services/AdviceStatusService.js` - Service for API integration
- `Designer/` - Visual designer widget for configuration

## Version History

- v1.0.0 - Initial release with basic status checking and comprehensive output parameters