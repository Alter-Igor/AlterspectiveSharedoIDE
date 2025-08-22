# Phase Management Workflow Actions

## Overview
Two complementary workflow actions for managing task phases in ShareDo:
- **PauseTasks** - Pause child tasks by moving them to a paused phase
- **ResumeTasks** - Resume paused tasks by restoring their original phase

## Quick Start

### PauseTasks
Finds all child tasks of a specified work type and moves them to a paused state.

**Key Features:**
- Finds tasks derived from base work type (default: "AbstractAdvice")
- Moves to phase with "Paused" feature or specified phase
- Saves original phase for later restoration
- Excludes completed/cancelled tasks

**Example Usage:**
```javascript
// In workflow configuration
{
  "workItemIdVariable": "parentWorkItemId",
  "baseWorkType": "AbstractAdvice",
  "targetPhaseFeature": "Paused",
  "saveOriginalState": true
}
```

### ResumeTasks
Finds paused tasks and restores them to their original phase with optional due date updates.

**Key Features:**
- Finds tasks in paused phase
- Restores to original saved phase or default
- Updates due dates (optional)
- Clears pause metadata

**Example Usage:**
```javascript
// In workflow configuration
{
  "workItemIdVariable": "parentWorkItemId",
  "baseWorkType": "AbstractAdvice",
  "sourcePhaseFeature": "Paused",
  "restoreFromSaved": true,
  "newDueDateVariable": "newDueDate"
}
```

## How It Works

### Phase Features vs Phase System Names
Both actions support two ways to identify phases:

1. **Phase Features** (Recommended)
   - More flexible - works across different work types
   - Example: `targetPhaseFeature: "Paused"`
   - System finds the phase with this feature for each work type

2. **Phase System Names** (Direct)
   - Specific phase by exact name
   - Example: `targetPhaseSystemName: "OnHold"`
   - Less flexible but more precise

### State Preservation
When pausing tasks, the system saves:
- Original phase system name
- Pause timestamp
- User/workflow that initiated pause

This allows full restoration when resuming.

## Architecture

```
PhaseManagement/
└── Workflows/
    ├── PauseTasks/
    │   ├── PauseTasks-template.js         # Core logic
    │   ├── PauseTasks-factory.js          # Factory
    │   ├── PauseTasks.wf-action.json      # Config
    │   └── Designer/                      # UI
    └── ResumeTasks/
        ├── ResumeTasks-template.js        # Core logic
        ├── ResumeTasks-factory.js         # Factory
        ├── ResumeTasks.wf-action.json     # Config
        └── Designer/                      # UI
```

## Implementation Status

### ✅ Completed
- Directory structure created
- Design documentation complete
- Implementation plan ready

### 🚧 Next Steps
1. Review and approve design
2. Implement PauseTasks template
3. Implement ResumeTasks template
4. Create designer UIs
5. Testing and refinement

## Key Design Decisions

1. **Work Type Inheritance**
   - Actions work with derived types
   - "AbstractAdvice" finds all advice subtypes

2. **Phase Feature Priority**
   - Phase features preferred over system names
   - More flexible across work types

3. **State Management**
   - State saved in work item attributes
   - Allows full restoration

4. **Error Handling**
   - Partial success supported
   - Comprehensive logging
   - Graceful failure recovery

## API Integration

### Core APIs Used
- `/api/v1/public/workItem/findByQuery` - Find tasks
- `/api/featureframework/flags/{feature}/{type}/enabledPhases` - Get phase features
- `/api/sharedo/{id}/phase/jumpTo` - Change phases
- `/api/v1/public/workItem/{id}/attributes` - Save/restore state

## Documentation

- [Full Design and Implementation Plan](DESIGN_AND_IMPLEMENTATION_PLAN.md)
- [PauseTasks Detailed Design](PauseTasks/PAUSETASKS_DESIGN.md)
- [ResumeTasks Detailed Design](ResumeTasks/RESUMETASKS_DESIGN.md)

## Questions for Review

Before implementation begins, please review:

1. **Default Values**
   - Is "AbstractAdvice" the correct default work type?
   - Is "Paused" the correct default phase feature?
   - Is "InProgress" the correct default resume phase?

2. **Features**
   - Should we support pausing across multiple parents?
   - Do we need scheduled auto-resume?
   - Should we preserve assignments/ownership?

3. **Performance**
   - What's the maximum number of tasks to process?
   - Should we support async/background processing?

4. **Audit**
   - What audit trail requirements exist?
   - Should operations be reversible?

## Contact

For questions or issues, please review the design documents or contact the development team.