# ResumeTasks Workflow Action - Detailed Design

## Overview
The ResumeTasks workflow action finds paused tasks and restores them to their original or specified phases with optional due date updates.

## Core Functionality

### 1. Task Discovery
- Query child work items in paused state
- Filter by base work type
- Identify by phase feature or system name
- Check for saved pause metadata

### 2. State Restoration
Priority order for target phase:
1. Saved original phase (if available)
2. Specified default phase
3. "InProgress" as fallback

### 3. Due Date Management
Options for due date handling:
- Set specific new due date
- Adjust by number of days
- Calculate based on pause duration
- Keep original due date

### 4. Metadata Cleanup
After resuming:
- Clear pause metadata attributes
- Update resume tracking info
- Log restoration details

## Template Structure

```javascript
// ResumeTasks-template.js structure
log.Information("====================================");
log.Information("Starting ResumeTasks Workflow Action");
log.Information("====================================");

// 1. Input validation
let workItemId = ctx["$model.Configuration.workItemIdVariable"];
if (!workItemId) {
    // Handle error
}

// 2. Configuration
let config = {
    baseWorkType: "$model.Configuration.baseWorkType" || "AbstractAdvice",
    sourcePhaseFeature: "$model.Configuration.sourcePhaseFeature" || "Paused",
    sourcePhaseSystemName: "$model.Configuration.sourcePhaseSystemName",
    restoreFromSaved: $model.Configuration.restoreFromSaved !== false,
    defaultPhase: "$model.Configuration.defaultPhase" || "InProgress",
    newDueDate: ctx["$model.Configuration.newDueDateVariable"]
};

// 3. Find paused tasks
let findRequest = {
    search: {
        parentId: workItemId,
        workTypeSystemName: config.baseWorkType,
        phaseSystemName: pausedPhase
    }
};

// 4. Process each task
for (let task of pausedTasks) {
    // Retrieve saved state
    // Determine target phase
    // Calculate new due date
    // Execute phase change
    // Clear metadata
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
        "sourcePhaseFeature": {
            "type": "string",
            "default": "Paused",
            "description": "Phase feature to find paused tasks"
        },
        "sourcePhaseSystemName": {
            "type": "string",
            "required": false,
            "description": "Specific paused phase name"
        },
        "restoreFromSaved": {
            "type": "boolean",
            "default": true,
            "description": "Restore to saved original phase"
        },
        "defaultPhase": {
            "type": "string",
            "default": "InProgress",
            "description": "Default phase if no saved state"
        },
        "newDueDateVariable": {
            "type": "variable",
            "required": false,
            "description": "Variable with new due date"
        },
        "adjustDueDateBy": {
            "type": "number",
            "required": false,
            "description": "Days to adjust due date"
        },
        "clearPauseMetadata": {
            "type": "boolean",
            "default": true,
            "description": "Clear pause-related attributes"
        }
    }
}
```

## API Calls Required

### 1. Find Paused Tasks
```javascript
POST /api/v1/public/workItem/findByQuery
{
    "search": {
        "workItemIds": [parentId],
        "workTypeSystemName": baseWorkType,
        "phaseSystemName": pausedPhase
    },
    "enrich": [
        {"path": "id"},
        {"path": "title"},
        {"path": "phase.systemName"},
        {"path": "type.systemName"},
        {"path": "dueDate"},
        {"path": "attributes"}
    ]
}
```

### 2. Get Saved State
```javascript
GET /api/v1/public/workItem/{id}/attributes
// Look for:
// - phase_pause_original
// - phase_pause_date
// - phase_pause_by
```

### 3. Update Due Date
```javascript
PUT /api/v1/public/workItem/{id}
{
    "dueDate": "2024-02-01T00:00:00Z"
}
```

### 4. Jump to Original Phase
```javascript
POST /api/sharedo/{workItemId}/phase/jumpTo
{
    "toPhaseSystemName": originalPhase,
    "description": "Resumed by workflow",
    "suppressEvents": false,
    "suppressGuards": false
}
```

### 5. Clear Metadata
```javascript
PUT /api/v1/public/workItem/{id}/attributes
{
    "phase_pause_original": null,
    "phase_pause_date": null,
    "phase_pause_by": null,
    "phase_resume_date": "2024-01-21T10:00:00Z",
    "phase_resume_by": "workflow"
}
```

## Due Date Calculation Logic

```javascript
function calculateNewDueDate(task, config) {
    // Priority order:
    
    // 1. Explicit new date
    if (config.newDueDate) {
        return config.newDueDate;
    }
    
    // 2. Adjust by days
    if (config.adjustDueDateBy) {
        let date = new Date(task.dueDate || new Date());
        date.setDate(date.getDate() + config.adjustDueDateBy);
        return date.toISOString();
    }
    
    // 3. Adjust by pause duration
    if (config.adjustByPauseDuration && task.pauseDate) {
        let pauseDuration = Date.now() - new Date(task.pauseDate);
        let newDate = new Date(task.originalDueDate);
        newDate.setTime(newDate.getTime() + pauseDuration);
        return newDate.toISOString();
    }
    
    // 4. Keep original
    return task.dueDate;
}
```

## Error Handling

| Error Type | Handling | User Feedback |
|------------|----------|---------------|
| No work item ID | Stop execution | "Work item ID required" |
| No paused tasks | Success branch | "No tasks to resume" |
| Missing saved state | Use default phase | "Using default phase" |
| Invalid due date | Keep original | "Invalid date, keeping original" |
| Transition denied | Skip task | "Cannot resume task X" |

## Logging Strategy

```javascript
// Start
log.Information("Starting ResumeTasks for work item: " + workItemId);

// Discovery
log.Information("Found " + pausedTasks.length + " paused tasks");

// Per task
log.Information("Processing task: " + task.id + " (" + task.title + ")");
log.Information("  Current phase: Paused");
log.Information("  Original phase: " + savedPhase);
log.Information("  Target phase: " + targetPhase);
log.Information("  New due date: " + newDueDate);

// State restoration
log.Information("  Restored from saved state: " + (savedPhase ? "Yes" : "No"));

// Results
log.Information("Results: " + resumedCount + " resumed, " + errorCount + " errors");

// End
log.Information("ResumeTasks completed");
```

## Performance Considerations

1. **Batch Operations**
   - Retrieve all attributes in single call
   - Batch metadata updates where possible
   - Cache phase lookups

2. **Optimization**
   - Skip tasks already in target phase
   - Parallel processing for independent tasks
   - Minimize redundant API calls

3. **Limits**
   - 100 tasks per execution
   - 30 second timeout per task
   - 5 minute total limit

## Testing Requirements

### Unit Tests
1. Find paused tasks
2. State restoration logic
3. Due date calculations
4. Metadata cleanup

### Integration Tests
1. End-to-end resume operation
2. Resume without saved state
3. Due date adjustments
4. Permission handling

### User Acceptance Tests
1. Resume advice tasks
2. Resume with new due dates
3. Resume to different phases
4. Verify metadata cleanup

## Special Considerations

### Concurrent Modifications
- Check task hasn't been modified
- Handle race conditions
- Use optimistic locking

### Audit Trail
- Log all phase changes
- Track who resumed tasks
- Maintain history in attributes

### Rollback Support
- Save resume operation details
- Support re-pausing if needed
- Maintain operation history