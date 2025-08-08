# AdviceManagement Module

## Overview
The AdviceManagement module is a component of the AlterspectiveIDE system that handles ongoing advice management functionality within a legal practice management context. This module provides UI components and services for pausing and resuming advice workflows.

## Module Structure

### Components

#### AdvicePauseResumeBlade
Main UI component for managing advice pause/resume operations
- **blade.html** - HTML template defining the UI structure
- **blade.js** - JavaScript controller handling business logic and user interactions
- **AdvicePauseResumeBlade.panel.json** - Panel configuration metadata

### Data Models

#### OngoingAdviceModel
- Located in `models/OngoingAdviceModel.js`
- Defines the data structure for ongoing advice entities
- Handles state management for advice workflow items

### Services

#### AttributeApiService
- Located in `services/AttributeApiService.js`
- Provides API integration for attribute management
- Handles communication with backend services for advice-related attributes

### Helpers

#### Namespace
- Located in `helpers/namespace.js`
- Provides namespace management utilities
- Ensures proper module isolation and prevents naming conflicts

## Development Guidelines

### Architecture Pattern
- Follows MVC-like separation of concerns
- HTML templates for view layer
- JavaScript controllers for business logic
- Service layer for API communication
- Model layer for data structures

### Key Responsibilities
1. **Advice Workflow Management**: Enable users to pause and resume ongoing advice workflows
2. **State Tracking**: Maintain accurate state of advice items
3. **API Integration**: Communicate with backend services for data persistence
4. **UI Interaction**: Provide intuitive interface for advice management operations

### Integration Points
- Integrates with the broader AlterspectiveIDE framework
- Utilizes shared services and utilities from the parent IDE system
- Follows established panel/blade UI patterns

### Testing Considerations
- Test pause/resume functionality with various advice states
- Validate API service error handling
- Ensure UI updates reflect backend state changes accurately
- Test namespace isolation to prevent conflicts

## Configuration
The module is configured through:
- `AdvicePauseResumeBlade.panel.json` - Defines panel settings and metadata
- Parent IDE configuration may affect module behavior

## Dependencies
- Parent AlterspectiveIDE framework
- Backend API services for advice management
- UI framework components (likely SharePoint or similar based on structure)

## Common Tasks

### Adding New Functionality
1. Update the model if new data fields are required
2. Extend the service layer for additional API endpoints
3. Modify the controller (blade.js) to handle new business logic
4. Update the HTML template for UI changes

### Debugging
- Check browser console for JavaScript errors
- Verify API service responses in network tab
- Ensure proper namespace initialization
- Validate panel configuration in JSON file

## Portal Widgets

### AdvicePausedWidget
A portal widget that displays a notification when work item advice has been paused.

#### Features
- **Auto-hide when active**: Widget only appears when advice is paused
- **Interactive notification**: Click to open the AdvicePauseResumeBlade for resuming
- **Auto-refresh**: Configurable automatic status checking at intervals
- **Visual feedback**: Animated pause icon with yellow warning theme
- **Reason display**: Optional display of why advice was paused
- **Responsive design**: Adapts to different widget sizes

#### Configuration Options
- `autoRefresh` (boolean): Enable/disable automatic status checking
- `checkInterval` (number): How often to check status in milliseconds (10s to 10min)
- `showReason` (boolean): Whether to display the pause reason if available

#### Widget Structure
```
AdvicePausedWidget/
├── AdvicePausedWidget.widget.json     (Widget configuration)
├── AdvicePausedWidget.html            (Template with KnockoutJS bindings)
├── AdvicePausedWidget.js              (Controller logic)
├── AdvicePausedWidget.css             (Styling)
└── designer/                          (Configuration designer)
    ├── AdvicePausedWidgetDesigner.widget.json
    ├── AdvicePausedWidgetDesigner.html
    ├── AdvicePausedWidgetDesigner.js
    └── AdvicePausedWidgetDesigner.css
```

#### Integration
- Reads work item attributes: `AdviceStatus`, `AdvicePausedDate`, `AdvicePausedReason`
- Opens `Alt.AdviceManagement.AdvicePauseResumeBlade` panel on click
- Subscribes to work item changes for real-time updates
- Uses ShareDo portal widget framework conventions

### AdviceSummaryCard
Compact card widget displaying current advice state with quick statistics and actions.

#### Features
- **Status indicator**: Visual active/paused status with color coding
- **Quick stats**: Days active, times paused, completion progress
- **Progress bar**: Visual completion percentage
- **Last/Next actions**: Track advice timeline
- **Quick actions**: Pause/Resume/Details buttons
- **Auto-refresh**: Configurable refresh interval

#### Configuration
- `refreshInterval` (number): Auto-refresh interval in milliseconds
- `showProgressBar` (boolean): Display progress bar
- `showStats` (boolean): Display statistics section
- `compactMode` (boolean): Compact display mode

### AdviceBulkManager
Comprehensive widget for managing multiple advice items with bulk operations.

#### Features
- **Bulk selection**: Select all/none with checkbox controls
- **Bulk actions**: 
  - Pause multiple items with reason
  - Resume multiple paused items
  - Export selected to CSV
  - Reassign items (placeholder for future)
- **Filtering**: Filter by status (All/Active/Paused)
- **Item table**: Display work items with status, last action, days active
- **Individual actions**: Pause/Resume/View details per item
- **Modal dialogs**: Bulk pause reason selection
- **CSV export**: Download selected items as CSV file

#### Configuration
- `pageSize` (number): Number of items to load (default: 50)
- `autoLoad` (boolean): Load items on widget initialization
- `showFilters` (boolean): Display filter controls

## Workflow Actions

### AdviceStatusController
Visual workflow action that checks work item advice status and performs conditional actions.

#### Features
- **Conditional Logic**: Define rules based on current advice status
- **Actions Available**:
  - Check Only (no action)
  - Pause advice with custom reason
  - Resume advice
  - Toggle status
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error tracking and recovery
- **Logging**: Detailed action logs for debugging
- **Branches**: Multiple workflow paths (success/paused/resumed/noAction/error)

#### Configuration Options
- `defaultAction`: Action when no conditions match
- `conditions`: Array of when/then rules
- `pauseReason`: Reason text for pause actions
- `requireConfirmation`: User confirmation before action
- `enableLogging`: Enable detailed logging
- `retryOnFailure`: Enable automatic retry
- `maxRetries`: Maximum retry attempts (1-10)
- `retryDelay`: Delay between retries in ms
- `timeout`: Maximum execution time in ms

#### Integration
- Works with ShareDo workflow engine
- Integrates with AdviceService for API calls
- Supports workflow context and user information
- Provides detailed output for downstream actions

## Services

### AdviceService
Centralized service for all advice-related API operations.

#### Features
- **Status Management**: Get/update advice status
- **Caching**: Performance optimization with TTL cache
- **Retry Logic**: Automatic retry for failed requests
- **Batch Operations**: Update multiple work items
- **Audit Trail**: Automatic action logging
- **Authentication**: Token-based auth support

## Attribute Registry

### CRITICAL: Only Use Registered Attributes
**See ATTRIBUTE_REGISTRY.md for the complete list of registered attributes.**

All advice-related attributes use the prefix `alt_ongoing_advice_` and include:
- `alt_ongoing_advice_enabled` - "true" or "false" string indicating if advice is active
- `alt_ongoing_advice_paused_date` - ISO date when paused
- `alt_ongoing_advice_paused_by` - UUID of user who paused
- `alt_ongoing_advice_pause_reason` - Text reason for pause
- `alt_ongoing_advice_resumed_date` - ISO date when resumed
- `alt_ongoing_advice_resumed_by` - UUID of user who resumed
- `alt_ongoing_advice_resume_reason` - Text reason for resume
- `alt_ongoing_advice_next_date` - ISO date for next scheduled advice

**DO NOT CREATE NEW ATTRIBUTES** without first checking the registry and updating it.

## API Response Structures

### IMPORTANT: Attributes Endpoint
The `/api/v1/public/workItem/{id}/attributes` endpoint returns the attributes object **directly**, not wrapped in a response object:

```javascript
// CORRECT - Response IS the attributes object
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {
        var adviceStatus = attributes['AdviceStatus'];  // Direct access
        var pausedDate = attributes['AdvicePausedDate'];
    });

// INCORRECT - Do NOT access response.attributes
// The response IS already the attributes object
```

### Work Item Endpoint
The `/api/v1/public/workItem/{id}` endpoint returns the work item object directly:
```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId)
    .then(function(workItem) {
        var title = workItem.title;
        var id = workItem.id;
    });
```

### History Endpoint (Not Available)
The `/api/v1/public/workItem/{id}/history` endpoint **does not exist** in the current API.
Do not attempt to call this endpoint. Use attributes or other means to track history.

## Notes
- This module appears to be part of a legal practice management system
- The "blade" terminology suggests integration with a portal or dashboard framework
- Ongoing advice likely refers to continuous legal counsel or advisory services
- Widgets follow ShareDo portal widget patterns with KnockoutJS for data binding
- All widgets integrate with the AdvicePauseResumeBlade for detailed operations
- Workflow actions integrate with visual workflow designer for drag-and-drop configuration