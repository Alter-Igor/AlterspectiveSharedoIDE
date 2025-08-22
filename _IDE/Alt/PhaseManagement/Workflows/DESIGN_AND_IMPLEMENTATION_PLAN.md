# Phase Management Workflow Actions - Design and Implementation Plan

## Overview
This document outlines the design and implementation plan for two complementary workflow actions:
1. **PauseTasks** - Moves open tasks to a paused state
2. **ResumeTasks** - Restores paused tasks to their original state

## 1. PauseTasks Workflow Action

### Purpose
Finds all open tasks derived from a specified work type and moves them to a paused phase, preserving their original state for later restoration.

### Key Features
- Find tasks by work type (derived from specified base type)
- Support both phase feature and phase system name targeting
- Save original phase information for restoration
- Bulk processing with error handling
- Comprehensive logging

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| workItemIdVariable | String | Required | Variable containing parent work item ID |
| baseWorkType | String | "AbstractAdvice" | Base work type to search for |
| targetPhaseFeature | String | "Paused" | Phase feature to move tasks to |
| targetPhaseSystemName | String | null | Alternative: specific phase system name |
| saveOriginalState | Boolean | true | Save original phase for restoration |
| includeSubTypes | Boolean | true | Include types derived from base type |
| excludePhases | Array | ["Completed", "Cancelled", "Removed"] | Phases to exclude from pausing |
| suppressEvents | Boolean | false | Suppress ShareDo events during phase change |
| suppressGuards | Boolean | false | Suppress phase guards/checks |
| enableLogging | Boolean | true | Enable detailed logging |
| successVariable | String | null | Variable to store success status |
| pausedCountVariable | String | null | Variable to store count of paused items |
| errorMessageVariable | String | null | Variable to store error messages |

### Workflow Connections
- **success** - All tasks processed successfully
- **partial** - Some tasks paused, some failed
- **noTasks** - No tasks found to pause
- **error** - Critical error occurred

### Implementation Logic

```javascript
// Pseudo-code overview
1. Validate input (work item ID required)
2. Query for child work items of specified type
3. For each eligible task:
   a. Check if already in target phase
   b. Save original phase if configured
   c. Determine target phase (by feature or system name)
   d. Move to target phase
   e. Update attributes with pause metadata
4. Return results and branch accordingly
```

## 2. ResumeTasks Workflow Action

### Purpose
Finds paused tasks and restores them to their original phases, optionally updating due dates.

### Key Features
- Find tasks in paused state
- Restore to original phase (if saved) or default phase
- Update due dates if specified
- Support batch operations
- Comprehensive error handling

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| workItemIdVariable | String | Required | Variable containing parent work item ID |
| baseWorkType | String | "AbstractAdvice" | Base work type to search for |
| sourcePhaseFeature | String | "Paused" | Phase feature to find paused tasks |
| sourcePhaseSystemName | String | null | Alternative: specific phase system name |
| restoreFromSaved | Boolean | true | Restore to saved original phase |
| defaultPhase | String | "InProgress" | Default phase if no saved state |
| newDueDateVariable | String | null | Variable with new due date |
| adjustDueDateBy | Number | null | Days to adjust due date |
| clearPauseMetadata | Boolean | true | Clear pause-related attributes |
| suppressEvents | Boolean | false | Suppress ShareDo events |
| suppressGuards | Boolean | false | Suppress phase guards/checks |
| enableLogging | Boolean | true | Enable detailed logging |
| successVariable | String | null | Variable to store success status |
| resumedCountVariable | String | null | Variable to store count of resumed items |
| errorMessageVariable | String | null | Variable to store error messages |

### Workflow Connections
- **success** - All tasks processed successfully
- **partial** - Some tasks resumed, some failed  
- **noTasks** - No tasks found to resume
- **error** - Critical error occurred

### Implementation Logic

```javascript
// Pseudo-code overview
1. Validate input (work item ID required)
2. Query for child work items in paused state
3. For each paused task:
   a. Retrieve saved original phase (if exists)
   b. Determine target phase (saved, default, or specified)
   c. Update due date if configured
   d. Move to target phase
   e. Clear pause metadata if configured
4. Return results and branch accordingly
```

## Technical Implementation Details

### API Endpoints to Use

1. **Find Work Items by Query**
   ```
   POST /api/v1/public/workItem/findByQuery
   ```

2. **Get Phase Features**
   ```
   GET /api/featureframework/flags/{feature}/{type}/enabledPhases
   ```

3. **Jump to Phase**
   ```
   POST /api/sharedo/{workItemId}/phase/jumpTo
   ```

4. **Update Work Item Attributes**
   ```
   PUT /api/v1/public/workItem/{id}/attributes
   ```

### Data Storage for Pause State

Store pause metadata in work item attributes:
```json
{
  "phase_pause_original_phase": "InProgress",
  "phase_pause_date": "2024-01-20T10:00:00Z",
  "phase_pause_by": "workflow",
  "phase_pause_reason": "Parent paused"
}
```

### Error Handling Strategy

1. **Validation Errors** - Return immediately with error message
2. **API Failures** - Log error, continue with next item, track failures
3. **Phase Transition Errors** - Log warning, continue processing
4. **Partial Success** - Track success/failure counts, use partial branch

## File Structure

```
_IDE/Alt/PhaseManagement/Workflows/
├── PauseTasks/
│   ├── PauseTasks-template.js         # Workflow template
│   ├── PauseTasks-factory.js          # Factory function
│   ├── PauseTasks.wf-action.json      # Action configuration
│   └── Designer/
│       ├── PauseTasksDesigner.js      # Designer UI logic
│       ├── PauseTasksDesigner.html    # Designer UI template
│       ├── PauseTasksDesigner.css     # Designer styles
│       └── PauseTasksDesigner.widget.json
└── ResumeTasks/
    ├── ResumeTasks-template.js        # Workflow template
    ├── ResumeTasks-factory.js         # Factory function
    ├── ResumeTasks.wf-action.json     # Action configuration
    └── Designer/
        ├── ResumeTasksDesigner.js     # Designer UI logic
        ├── ResumeTasksDesigner.html   # Designer UI template
        ├── ResumeTasksDesigner.css    # Designer styles
        └── ResumeTasksDesigner.widget.json
```

## Development Phases

### Phase 1: Core Implementation
1. Create PauseTasks template with basic functionality
2. Create ResumeTasks template with basic functionality
3. Implement factory functions
4. Create action configuration files

### Phase 2: Designer UI
1. Create designer components for PauseTasks
2. Create designer components for ResumeTasks
3. Add configuration validation
4. Implement preview functionality

### Phase 3: Testing & Refinement
1. Unit test core logic
2. Integration testing with ShareDo
3. Error handling improvements
4. Performance optimization

### Phase 4: Documentation
1. User documentation
2. Technical documentation
3. Example workflows
4. Troubleshooting guide

## Key Considerations

### Performance
- Use batch operations where possible
- Implement pagination for large result sets
- Add configurable timeouts
- Consider async processing for large batches

### Security
- Validate permissions before phase changes
- Audit trail for all operations
- Respect ShareDo security model

### Compatibility
- Support multiple ShareDo versions
- Handle missing phase features gracefully
- Backward compatibility with existing workflows

### Monitoring
- Comprehensive logging at all steps
- Performance metrics
- Error tracking and reporting
- Success/failure statistics

## Testing Scenarios

1. **Happy Path**
   - Pause 5 tasks successfully
   - Resume same 5 tasks successfully

2. **Edge Cases**
   - No tasks to pause/resume
   - Tasks already in target phase
   - Missing phase features
   - Invalid work types

3. **Error Scenarios**
   - API failures
   - Permission denied
   - Invalid phase transitions
   - Concurrent modifications

4. **Performance Tests**
   - 100+ tasks
   - Complex work type hierarchies
   - Multiple phase features

## Success Criteria

1. Successfully pause and resume tasks based on work type
2. Preserve and restore original phase information
3. Handle errors gracefully with partial success
4. Provide clear logging and debugging information
5. Integrate seamlessly with ShareDo workflow engine
6. Support both phase features and system names
7. Maintain data integrity throughout operations

## Next Steps

1. **Review and Approval** - Review this design document
2. **Implementation** - Begin with PauseTasks core template
3. **Testing** - Create test workflows
4. **Documentation** - Create user guides
5. **Deployment** - Package and deploy to ShareDo

## Questions for Review

1. Should we support pausing tasks across multiple parent work items?
2. Do we need to preserve more state than just the phase (e.g., assignments)?
3. Should pause/resume operations be reversible/undoable?
4. What audit trail requirements exist?
5. Should we support scheduled resume (auto-resume after X days)?