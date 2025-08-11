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

## ShareDo Logging Best Practices

### CRITICAL: Logging Context Determines Method Case

#### **Server-Side Logging (Workflows, Actions) - Use `log` (lowercase)**
**In workflow actions and server-side contexts, use lowercase `log`:**

```javascript
// ✅ CORRECT - Server-side workflow actions use lowercase 'log'
log.Information("Message: " + variable);
log.Information("User " + userId + " performed action " + actionName);
log.Warning("Error occurred in " + methodName + ": " + errorMessage);
log.Error("Failed to process item " + itemId);

// ❌ INCORRECT - Do NOT use uppercase 'Log' in workflow actions
Log.Information("Message: " + variable);  // This will NOT work in workflows
```

**Available methods in server-side workflow contexts:**
- `log.Information(message)` - General information logging
- `log.Warning(message)` - Warning messages  
- `log.Error(message)` - Error messages
- `log.Debug(message)` - Debug information (if debug mode enabled)

#### **Alternative Server-Side Logging - Use `Log` (uppercase)**
**In some server-side contexts outside workflows, uppercase `Log` may be available:**
- `Log.Information(message)` - General information logging
- `Log.Warning(message)` - Warning messages
- `Log.Error(message)` - Error messages
- `Log.Debug(message)` - Debug information

### Client-Side/UI Logging
**Available via `$ui.log` in frontend components (blades, widgets, UI):**
```javascript
// ✅ Frontend logging methods
$ui.log.debug("Debug message: " + details);
$ui.log.warning("Warning message: " + issue);
$ui.log.error("Error message: " + error);

// Log level can be controlled via URL parameter: ?ui-log-level=debug
```

**Log Levels (from lowest to highest):**
- `debug: 1` - Detailed debugging information
- `warning: 2` - Warning messages
- `error: 3` - Error messages only
- `none: 100` - No logging

**Usage in UI Components:**
```javascript
// In blades, widgets, or other UI components
if ($ui && $ui.log && $ui.log.debug) {
    $ui.log.debug("Widget initialized with config: " + JSON.stringify(config));
}

if ($ui && $ui.log && $ui.log.warning) {
    $ui.log.warning("Validation warning: " + validationMessage);
}

if ($ui && $ui.log && $ui.log.error) {
    $ui.log.error("API call failed: " + errorMessage);
}
```

**Enabling Debug Logging:**
Add `?ui-log-level=debug` to the URL to see debug messages in browser console.

### Workflow Template Logging
In workflow action templates, always use string concatenation:
```javascript
// ✅ CORRECT in workflow templates
"Log.Information('Starting step for Work Item: ' + workItemId);"
"Log.Information('Result: ' + JSON.stringify(result));"

// ❌ INCORRECT in workflow templates  
"Log.Information('Starting step for Work Item: {WorkItemId}', workItemId);"
```

### Best Practices
1. **Always check for Log availability**: `if (typeof Log !== 'undefined' && Log.Information)`
2. **Use meaningful messages**: Include context like component name and work item ID
3. **Log before critical operations**: Status checks, API calls, branch decisions
4. **Log variable mappings**: Show what values are being assigned to which variables
5. **Include error details**: When logging errors, include full error messages and context

## Advice Lifecycle Management

### Comprehensive Advice Pause/Resume System
The advice management system now supports comprehensive lifecycle management with the following architecture:

#### **Workflow-Based Approach (Recommended)**
```javascript
// Pause advice with workflow management
adviceService.pauseAdvice(workItemId, reason, {
    useWorkflowApproach: true,
    abstractAdviceTypeSystemName: 'AbstractAdvice',
    pausedPhase: 'Removed'
}, callback);

// Resume advice with workflow management
adviceService.resumeAdvice(workItemId, newDueDate, {
    useWorkflowApproach: true,
    abstractAdviceTypeSystemName: 'AbstractAdvice',
    defaultAdviceTypeSystemName: 'StandardAdvice'
}, callback);
```

#### **Advice Lifecycle Components**

**1. Configuration Management**
- `AdviceLifecycleConfig.js` - Centralized configuration for advice types, phases, and workflows
- Supports configurable abstract advice types and default advice types
- Manages phase transitions and API endpoint configurations

**2. Lifecycle Service** 
- `AdviceLifecycleService.js` - Core service for advice discovery, state management, and operations
- Handles advice discovery using findByQuery API
- Manages advice state serialization/deserialization
- Provides phase transition capabilities

**3. Workflow Actions**
- `AdvicePauseManager` - Comprehensive pause workflow action
- `AdviceResumeManager` - Comprehensive resume workflow action
- Both support full logging and branching for workflow integration

#### **Pause Process**
1. **Discovery**: Find all active advice items inheriting from abstract advice type
2. **Detail Retrieval**: Get complete advice information including attributes
3. **State Preservation**: Serialize advice state to work item attributes
4. **Phase Transition**: Move advice items to 'Removed' or configured paused phase

#### **Resume Process**
1. **State Check**: Look for saved advice state in work item attributes
2. **Restoration Path**: If saved state exists, restore all previous advice items
3. **Creation Path**: If no saved state, create default advice of configured type
4. **Date Management**: Handle due dates (preserve original, use new date, or default offset)
5. **Cleanup**: Clear saved state after successful restoration

#### **Configuration Options**

**Advice Types**
- `abstractAdviceTypeSystemName`: Base type all advice inherits from (e.g., "AbstractAdvice")
- `defaultAdviceTypeSystemName`: Default advice type for new advice (e.g., "StandardAdvice")

**Phase Management**
- `activePhase`: Phase for active advice (default: "Active")
- `pausedPhase`: Phase for paused advice (default: "Removed")

**State Attributes**
- `alt_ongoing_advice_saved_state`: JSON serialized advice state
- `alt_ongoing_advice_saved_count`: Number of saved advice items
- `alt_ongoing_advice_paused_types`: Comma-separated advice type names

**Date Handling**
- `preserveOriginalDates`: Whether to restore original due dates
- `defaultAdviceOffsetDays`: Days to add for new advice (default: 30)

#### **API Integration**
- Uses ShareDo findByQuery API to discover advice items
- Uses workItem/{id}/phase API to move advice between phases
- Uses workItem/{id}/attributes API for state persistence
- Uses workItem POST API to create new advice items

#### **Fallback Support**
Both enhanced pause/resume methods maintain backward compatibility with simple attribute-based approach when workflow components are not available.

## Development Guidelines & Knowledge Base References

### **When Creating Workflow Actions**

#### **CRITICAL: Always Read These Instructions First**
Before creating or editing workflow actions, Claude must:

1. **Read ShareDo Knowledge Base**: Refer to `C:\GitHub\LearnSD\KB` for:
   - **WORKFLOW-001**: Visual Workflow Development patterns
   - **WORKFLOW-002**: Workflow Implementation Patterns  
   - **WORKFLOW-003**: Advanced SmartPlan Patterns
   - **DEV-001**: ShareDo Development Overview
   - **QUICK_REFERENCE.md**: Essential patterns and code snippets

2. **Follow Workflow Action Development Rules**:
   - **Logging**: Use `log.Information()` (lowercase) in workflow actions, NOT `Log.Information()`
   - **Error Handling**: Always include try/catch with detailed error logging
   - **Validation**: Validate all inputs and configuration before processing
   - **Timeouts**: Implement timeout handling for long-running operations
   - **Branch Logic**: Provide clear branches for success/failure/different outcomes

#### **Workflow Action File Structure**
When creating workflow actions, always create:
```
WorkflowActionName/
├── WorkflowActionName.js                    # Main action logic (use log.Information)
├── WorkflowActionName.action.json          # ShareDo workflow action definition
├── WorkflowActionName.wf-action.json       # Visual workflow designer definition  
├── WorkflowActionName-factory.js           # Visual designer model factory
├── WorkflowActionName-template.js          # Code generation template
├── WorkflowActionName.html                 # Display template
├── WorkflowActionName.css                  # Styling
└── WorkflowActionNameDesigner.widget.json  # Configuration designer widget
    WorkflowActionNameDesigner.js           # Designer logic
    WorkflowActionNameDesigner.html         # Designer UI
    WorkflowActionNameDesigner.css          # Designer styles
```

#### **Required Logging Pattern for Workflow Actions**
```javascript
// ✅ CORRECT - Workflow action logging pattern
if (typeof log !== 'undefined' && log.Information) {
    log.Information("ComponentName - Action description");
    log.Information("  Key details: " + details);
    log.Information("  Duration: " + duration + "ms");
}

// ✅ CORRECT - Error logging in workflows
if (typeof log !== 'undefined' && log.Error) {
    log.Error("ComponentName - Error description: " + errorMessage);
}

// ❌ INCORRECT - Do NOT use uppercase Log in workflows
if (typeof Log !== 'undefined' && Log.Information) {
    Log.Information("This will not work in workflow actions");
}
```

#### **When Creating UI Components (Blades, Widgets)**
Refer to these knowledge base articles:
- **DEV-002**: Widget Development Guide
- **ARCH-003**: Component Architecture
- **CONFIG-004B**: Form Validation patterns

Use `$ui.log.debug()` for client-side logging.

#### **When Working with APIs**
Refer to these knowledge base articles:
- **DEV-004**: API Development patterns
- **INT-001**: REST API Integration
- **REF-004**: Error Codes and handling

#### **When Implementing Business Logic**
Refer to these knowledge base articles:
- **CONFIG-007**: Business Rules Engine
- **ARCH-004**: Event-Driven Architecture
- **DEV-005**: Advanced Widget Patterns

### **Quality Checklist for Workflow Actions**
Before completing workflow action development, ensure:

✅ **Logging**: Uses `log.Information()` (lowercase) consistently  
✅ **Error Handling**: Comprehensive try/catch with detailed logging  
✅ **Validation**: Input/configuration validation with clear error messages  
✅ **Performance**: Timing logs for operations > 100ms  
✅ **Timeout**: Proper timeout handling with state preservation  
✅ **Branching**: Clear success/failure/edge case branches  
✅ **Documentation**: Inline comments explaining complex logic  
✅ **Testing**: Edge cases and error conditions considered  

### **Claude Development Protocol**
When tasked with creating workflow actions, Claude must:
1. **First**: Read relevant LearnSD\KB articles
2. **Second**: Follow the workflow action file structure above
3. **Third**: Use correct logging patterns (`log` not `Log`)
4. **Fourth**: Implement comprehensive error handling
5. **Fifth**: Add performance and debug logging
6. **Sixth**: Validate against the quality checklist

## ShareDo Knowledge Base Reference

### Comprehensive ShareDo Documentation
**Location**: `C:\GitHub\LearnSD\KB`

This folder contains extensive ShareDo platform documentation that provides detailed guidance for development, configuration, and architecture patterns. Key resources include:

#### Development Guides
- **DEV-001**: ShareDo Development Overview - Technology stack (.NET, Nancy, SQL Server, jQuery)
- **DEV-002**: Widget Development Guide - Comprehensive widget architecture and lifecycle
- **DEV-003**: Plugin Development - Custom plugin creation patterns
- **DEV-004**: API Development - RESTful API integration patterns
- **DEV-005**: Advanced Widget Patterns - Complex widget scenarios

#### Architecture References  
- **ARCH-001**: ShareDo Architecture Overview - Core platform architecture
- **ARCH-003**: Component Architecture - Widget, blade, and component patterns
- **ARCH-004**: Event-Driven Architecture - Event processing and notifications
- **ARCH-005**: Data Architecture - Data models, relationships, and storage

#### Configuration Patterns
- **CONFIG-004B**: Form Validation - Validation rules and patterns
- **CONFIG-005**: Key Dates Configuration - Date handling and scheduling
- **CONFIG-006**: Document Templates - Template generation patterns
- **CONFIG-007**: Business Rules Engine - Rule configuration and execution

#### Quick References
- **QUICK_REFERENCE.md**: Essential patterns, code snippets, and common tasks
- **QUICK-001**: Configurator Quick Start Guide
- **QUICK-002**: Developer Quick Start Guide

#### Integration Guides
- **INT-001**: REST API Integration - External API integration patterns
- **INT-002**: Event Bus Integration - Event-driven communication
- **INT-003**: ElasticSearch Integration - Search functionality
- **INT-004**: Mobile Development Guide - Mobile-specific patterns

#### Workflow Development
- **WORKFLOW-001**: Visual Workflow Development - Visual workflow designer patterns
- **WORKFLOW-002**: Workflow Implementation Patterns - Common workflow scenarios
- **WORKFLOW-003**: Advanced SmartPlan Patterns - Complex workflow automation

### Key ShareDo Development Patterns
Based on LearnSD\KB documentation:

1. **Widget Architecture**: HTML templates + JavaScript controllers + CSS + JSON configuration
2. **Blade Development**: Panel-based UI components with ribbon bars and validation
3. **Event-Driven Design**: Comprehensive event bus for component communication  
4. **Configuration-Driven**: Highly configurable platform with JSON-based configuration
5. **Plugin System**: Extensible architecture supporting custom plugins
6. **API Integration**: RESTful APIs with standardized patterns and error handling

### Usage Guidelines
- **Always reference LearnSD\KB** when implementing ShareDo-specific functionality
- **Follow established patterns** documented in the knowledge base
- **Use configuration examples** from CONFIG-EXAMPLES-001.md
- **Implement proper error handling** as documented in REF-004-Error-Codes.md
- **Follow security patterns** from administration/security-configuration.md

### Development Workflow Integration
The knowledge base provides:
- **Code snippets** for common ShareDo development tasks
- **Configuration examples** for various ShareDo components  
- **Best practices** for widget, blade, and workflow development
- **Troubleshooting guides** for common development issues
- **Performance optimization** patterns and techniques

## Notes
- This module appears to be part of a legal practice management system
- The "blade" terminology suggests integration with a portal or dashboard framework
- Ongoing advice likely refers to continuous legal counsel or advisory services
- Widgets follow ShareDo portal widget patterns with KnockoutJS for data binding
- All widgets integrate with the AdvicePauseResumeBlade for detailed operations
- Workflow actions integrate with visual workflow designer for drag-and-drop configuration
- **Always consult LearnSD\KB for ShareDo-specific implementation guidance**