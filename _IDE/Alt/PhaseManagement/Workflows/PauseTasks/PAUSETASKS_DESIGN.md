# PauseTasks Workflow Action - Detailed Design

## Overview
The PauseTasks workflow action finds and pauses child tasks based on work type and phase criteria.

## Core Functionality

### 1. Task Discovery
- Query child work items of parent work item
- Filter by base work type (e.g., "AbstractAdvice")
- Include derived types if configured
- Exclude already paused/completed tasks

### 2. Phase Resolution
Priority order for determining target phase:
1. Use `targetPhaseSystemName` if specified
2. Use `targetPhaseFeature` to find phase with feature
3. Default to "Paused" phase feature

### 3. State Preservation
Before pausing, save:
- Original phase system name
- Current due date
- Current assignments
- Timestamp of pause
- User/workflow that initiated pause

### 4. Phase Transition
- Use ShareDo jump API for phase changes
- Support suppression of events/guards
- Handle transition failures gracefully

## Template Structure

```javascript
// PauseTasks-template.js structure
log.Information("====================================");
log.Information("Starting PauseTasks Workflow Action");
log.Information("====================================");

// 1. Input validation
let workItemId = ctx["$model.Configuration.workItemIdVariable"];
if (!workItemId) {
    // Handle error
}

// 2. Configuration
let config = {
    baseWorkType: "$model.Configuration.baseWorkType" || "AbstractAdvice",
    targetPhaseFeature: "$model.Configuration.targetPhaseFeature" || "Paused",
    targetPhaseSystemName: "$model.Configuration.targetPhaseSystemName",
    saveOriginalState: $model.Configuration.saveOriginalState !== false,
    excludePhases: $model.Configuration.excludePhases || ["Completed", "Cancelled", "Removed"]
};

// 3. Find tasks to pause
let findRequest = {
    search: {
        parentId: workItemId,
        workTypeSystemName: config.baseWorkType,
        includeSubTypes: true
    }
};

// 4. Process each task
for (let task of tasks) {
    // Check if eligible
    // Save state
    // Determine target phase
    // Execute phase change
    // Track results
}

// 5. Set output variables and branch
```

## Configuration Schema

```json
{
    "Configuration": {
        "workItemIdVariable": {
            "type": "variable",
            "required": true,
            "description": "Variable containing parent work item ID"
        },
        "baseWorkType": {
            "type": "string",
            "default": "AbstractAdvice",
            "description": "Base work type to search for"
        },
        "targetPhaseFeature": {
            "type": "string",
            "default": "Paused",
            "description": "Phase feature for paused state"
        },
        "targetPhaseSystemName": {
            "type": "string",
            "required": false,
            "description": "Specific phase system name (overrides feature)"
        },
        "saveOriginalState": {
            "type": "boolean",
            "default": true,
            "description": "Save original phase for restoration"
        },
        "excludePhases": {
            "type": "array",
            "default": ["Completed", "Cancelled", "Removed"],
            "description": "Phases to exclude from pausing"
        }
    }
}
```

## API Calls Required

### 1. Find Child Tasks
```javascript
POST /api/v1/public/workItem/findByQuery
{
    "search": {
        "workItemIds": [parentId],
        "workTypeSystemName": baseWorkType
    },
    "enrich": [
        {"path": "id"},
        {"path": "title"},
        {"path": "phase.systemName"},
        {"path": "type.systemName"},
        {"path": "dueDate"}
    ]
}
```

### 2. Get Phase by Feature
```javascript
GET /api/featureframework/flags/{feature}/{type}/enabledPhases
```

### 3. Save State to Attributes
```javascript
PUT /api/v1/public/workItem/{id}/attributes
{
    "phase_pause_original": "InProgress",
    "phase_pause_date": "2024-01-20T10:00:00Z",
    "phase_pause_by": "workflow"
}
```

### 4. Jump to Phase
```javascript
POST /api/sharedo/{workItemId}/phase/jumpTo
{
    "toPhaseSystemName": "Paused",
    "description": "Paused by workflow",
    "suppressEvents": false,
    "suppressGuards": false
}
```

## Error Handling

| Error Type | Handling | User Feedback |
|------------|----------|---------------|
| No work item ID | Stop execution | "Work item ID required" |
| API failure | Log and continue | "Failed to process task X" |
| Phase not found | Skip task | "No paused phase for type Y" |
| Transition denied | Skip task | "Cannot pause task Z" |

## Logging Strategy

```javascript
// Start
log.Information("Starting PauseTasks for work item: " + workItemId);

// Discovery
log.Information("Found " + tasks.length + " tasks to process");

// Per task
log.Information("Processing task: " + task.id + " (" + task.title + ")");
log.Information("  Current phase: " + task.phase);
log.Information("  Target phase: " + targetPhase);

// Results
log.Information("Results: " + pausedCount + " paused, " + errorCount + " errors");

// End
log.Information("PauseTasks completed");
```

## Performance Considerations

1. **Batch Processing**
   - Process up to 50 tasks at once
   - Use pagination for larger sets

2. **Timeouts**
   - 30 second timeout per task
   - 5 minute total execution limit

3. **Optimization**
   - Cache phase feature lookups
   - Minimize API calls
   - Parallel processing where safe

## Testing Requirements

### Unit Tests
1. Find tasks by work type
2. Phase feature resolution
3. State preservation
4. Error handling

### Integration Tests
1. End-to-end pause operation
2. Multiple task types
3. Permission scenarios
4. API failure recovery

### User Acceptance Tests
1. Pause advice tasks
2. Pause with custom phase
3. Partial success scenarios
4. Logging verification