# AlterspectiveIDE Panel and Component Architecture Knowledge Base

## Overview
AlterspectiveIDE is a comprehensive legal practice management platform built on the ShareDo framework. It uses a modular architecture with panels (blades), widgets, and workflow actions as primary building blocks.

## Core Component Types

### 1. Panels (Blades)
Modal panels that slide out from the side, used for detailed forms and workflows.

#### Structure
- **Configuration**: `.panel.json` file defines metadata, dependencies, and resources
- **Controller**: JavaScript file implementing the blade logic
- **Template**: HTML file with KnockoutJS bindings
- **Styles**: Optional CSS file for custom styling

#### Example Structure
```
BladeFolder/
├── BladeName.panel.json     (Configuration)
├── BladeName.js             (Controller)
├── BladeName.html           (Template)
└── BladeName.css            (Optional styles)
```

#### Panel Configuration (.panel.json)
```json
{
    "id": "Namespace.BladeName",
    "priority": 6000,
    "width": 600,
    "scripts": ["/_ideFiles/path/to/BladeName.js"],
    "styles": ["/_ideFiles/path/to/BladeName.css"],
    "templates": ["/_ideFiles/path/to/BladeName.html"],
    "components": ["Sharedo.UI.Framework.Components.RibbonBar"]
}
```

#### JavaScript Controller Pattern
```javascript
namespace("YourCompany.YourModule");

YourCompany.YourModule.YourBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Extract configuration with token support
    self.workItemId = configuration.workItemId || configuration.sharedoId;
    
    // Create model
    self.model = {
        // KnockoutJS observables
        loading: ko.observable(false),
        data: ko.observable("")
    };
    
    // Create UI elements
    self.blade = {
        ribbon: self.createRibbonBar()
    };
};

// Required lifecycle methods
YourBlade.prototype.loadAndBind = function() {
    // Load data after binding
};

YourBlade.prototype.onDestroy = function() {
    // Cleanup on unload
};
```

### 2. Widgets
Components that live on portal pages, providing focused functionality.

#### Structure
```
WidgetFolder/
├── WidgetName.widget.json       (Configuration)
├── WidgetName.js                 (Controller)
├── WidgetName.html               (Template)
├── WidgetName.css                (Styles)
└── designer/                     (Optional designer)
    ├── WidgetNameDesigner.widget.json
    ├── WidgetNameDesigner.js
    ├── WidgetNameDesigner.html
    └── WidgetNameDesigner.css
```

#### Widget Configuration (.widget.json)
```json
{
    "id": "Namespace.WidgetName",
    "priority": 7000,
    "designer": {
        "allowInPortalDesigner": true,
        "title": "Widget Title",
        "icon": "fa-icon-name",
        "description": "Widget description",
        "categories": ["Category"],
        "isConfigurable": true,
        "configurationWidget": "Namespace.WidgetNameDesigner",
        "defaultConfigurationJson": {}
    },
    "scripts": ["/_ideFiles/path/to/WidgetName.js"],
    "styles": ["/_ideFiles/path/to/WidgetName.css"],
    "templates": ["/_ideFiles/path/to/WidgetName.html"],
    "components": []
}
```

#### Widget JavaScript Pattern
```javascript
namespace("YourCompany.YourModule");

YourCompany.YourModule.YourWidget = function(element, configuration, baseModel) {
    var self = this;
    
    // Store references
    self.element = element;
    self.configuration = configuration || {};
    self.baseModel = baseModel;
    
    // Setup model with KnockoutJS observables
    self.model = {
        data: ko.observable(""),
        loading: ko.observable(false)
    };
};

YourWidget.prototype.loadAndBind = function() {
    // Initialize widget
};

YourWidget.prototype.onDestroy = function() {
    // Cleanup
};
```

### 3. Workflow Actions
Visual workflow components for automation and process control.

#### Structure
```
ActionFolder/
├── ActionName.action.json       (Configuration)
├── ActionName.js                 (Implementation)
├── ActionName.html               (Optional UI)
├── ActionName.css                (Optional styles)
└── Designer/                     (Optional designer)
    ├── ActionNameDesigner.widget.json
    ├── ActionNameDesigner.js
    └── ActionNameDesigner.html
```

#### Action Configuration (.action.json)
```json
{
    "id": "Namespace.ActionName",
    "type": "workflowAction",
    "priority": 8000,
    "metadata": {
        "name": "Action Name",
        "description": "Action description",
        "category": "Category",
        "icon": "fa-icon"
    },
    "designer": {
        "allowInWorkflowDesigner": true,
        "configurable": true,
        "inputs": [],
        "outputs": [],
        "branches": []
    },
    "scripts": ["/_ideFiles/path/to/ActionName.js"]
}
```

## Component Communication Patterns

### 1. ShareDo UI EventManager (Pub/Sub System)

ShareDo provides a global event broadcasting system that allows widgets and components to communicate without direct dependencies. This is accessible via `$ui.eventManager`.

#### Core Concepts:
- **Publisher**: Any component that broadcasts an event
- **Subscriber**: Any component that listens for specific events
- **Event Name**: String identifier for the event type
- **Event Data**: Payload passed with the event

#### API Methods:

##### Subscribe to Events
```javascript
// Subscribe to an event
var subscriptionId = $ui.eventManager.subscribe(eventName, callback, thisScope);

// Example:
var myWidget = {
    initialize: function() {
        var self = this;
        
        // Subscribe to advice status changes
        self.subscriptionId = $ui.eventManager.subscribe(
            'advice:statusChanged',
            self.handleAdviceStatusChange,
            self  // 'this' context for callback
        );
    },
    
    handleAdviceStatusChange: function(data) {
        // data contains the event payload
        console.log('Advice status changed:', data.workItemId, data.status);
        this.updateDisplay(data);  // 'this' is preserved
    }
};
```

##### Broadcast Events
```javascript
// Broadcast an event to all subscribers
$ui.eventManager.broadcast(eventName, data);

// Example:
$ui.eventManager.broadcast('advice:statusChanged', {
    workItemId: 'WI-12345',
    status: 'paused',
    pausedBy: 'John Smith',
    pausedDate: new Date().toISOString(),
    reason: 'Client requested pause'
});
```

##### Unsubscribe from Events
```javascript
// Unsubscribe using the subscription ID
$ui.eventManager.unsubscribe(subscriptionId);

// Example in widget cleanup:
myWidget.onDestroy = function() {
    if (this.subscriptionId) {
        $ui.eventManager.unsubscribe(this.subscriptionId);
    }
};
```

##### Debug Events
```javascript
// Enable debug logging for all broadcasts
$ui.eventManager.debugBroadcasts(true);  // Shows all broadcasts
$ui.eventManager.debugBroadcasts(false); // Shows only subscribed broadcasts
```

#### Common Event Patterns:

##### Work Item Events
```javascript
// Work item updated
$ui.eventManager.broadcast('workItem:updated', {
    workItemId: 'WI-12345',
    changes: { title: 'New Title' }
});

// Work item phase changed
$ui.eventManager.broadcast('workItem:phaseChanged', {
    workItemId: 'WI-12345',
    oldPhase: 'Draft',
    newPhase: 'Review'
});
```

##### Advice Management Events
```javascript
// Advice paused
$ui.eventManager.broadcast('advice:paused', {
    workItemId: 'WI-12345',
    pausedBy: 'John Smith',
    pausedDate: new Date().toISOString(),
    reason: 'Client vacation'
});

// Advice resumed
$ui.eventManager.broadcast('advice:resumed', {
    workItemId: 'WI-12345',
    resumedBy: 'Jane Doe',
    resumedDate: new Date().toISOString(),
    nextAdviceDate: '2025-09-01T00:00:00Z'
});
```

##### Widget Communication
```javascript
// Widget A broadcasts data change
$ui.eventManager.broadcast('dataGrid:selectionChanged', {
    selectedItems: [1, 2, 3],
    source: 'MainGrid'
});

// Widget B listens and reacts
$ui.eventManager.subscribe('dataGrid:selectionChanged', function(data) {
    if (data.source === 'MainGrid') {
        this.loadDetails(data.selectedItems);
    }
}, this);
```

#### Best Practices:

1. **Always Unsubscribe**: Clean up subscriptions in onDestroy/cleanup methods
```javascript
Widget.prototype.onDestroy = function() {
    if (this.eventSubscriptions) {
        this.eventSubscriptions.forEach(function(id) {
            $ui.eventManager.unsubscribe(id);
        });
    }
};
```

2. **Use Namespaced Event Names**: Prevent collisions
```javascript
// Good
'advice:statusChanged'
'workItem:updated'
'myCompany.myModule:dataChanged'

// Bad
'changed'
'update'
'data'
```

3. **Document Event Contracts**: Define what data is expected
```javascript
/**
 * Event: advice:statusChanged
 * Data: {
 *   workItemId: string,
 *   status: 'active' | 'paused',
 *   changedBy: string,
 *   changedDate: ISO string,
 *   reason?: string
 * }
 */
```

4. **Store Subscription IDs**: For proper cleanup
```javascript
this.subscriptions = [];
this.subscriptions.push(
    $ui.eventManager.subscribe('event1', handler1, this)
);
this.subscriptions.push(
    $ui.eventManager.subscribe('event2', handler2, this)
);
```

5. **Handle Missing EventManager**: Defensive coding
```javascript
if (window.$ui && window.$ui.eventManager) {
    $ui.eventManager.broadcast('myEvent', data);
} else {
    console.warn('EventManager not available');
}
```

#### Implementation Example in AdviceManagement:

```javascript
// In AdvicePauseResumeBlade when status changes
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.toggleOngoingAdvice = function() {
    var self = this;
    
    self.apiService.toggleOngoingAdvice(self.workItemId, options)
        .done(function(result) {
            // Broadcast the change so other widgets can react
            if (window.$ui && window.$ui.eventManager) {
                $ui.eventManager.broadcast('advice:statusChanged', {
                    workItemId: self.workItemId,
                    status: result.newStatus ? 'active' : 'paused',
                    action: result.action,
                    changedBy: options.userName,
                    changedDate: new Date().toISOString(),
                    reason: options.reason
                });
            }
        });
};

// In AdvicePausedWidget listening for changes
Alt.AdviceManagement.AdvicePausedWidget = function(element, configuration, baseModel) {
    var self = this;
    
    // Subscribe to status changes
    if (window.$ui && window.$ui.eventManager) {
        self.statusChangeSubscription = $ui.eventManager.subscribe(
            'advice:statusChanged',
            function(data) {
                if (data.workItemId === self.model.workItemId()) {
                    // Refresh the widget display
                    self.checkAdviceStatus();
                }
            },
            self
        );
    }
};

// Clean up on destroy
Alt.AdviceManagement.AdvicePausedWidget.prototype.onDestroy = function() {
    if (this.statusChangeSubscription) {
        $ui.eventManager.unsubscribe(this.statusChangeSubscription);
    }
};
```

#### Technical Implementation Details:

The EventManager uses:
- **Handler Storage**: Array of event handlers, each containing event name and subscriber list
- **Subscriber IDs**: Auto-incrementing IDs for tracking subscriptions
- **Scope Preservation**: Callbacks are invoked with correct 'this' context
- **Debug Support**: Built-in debugging for event flow analysis

### 2. RibbonBar Integration
Used in blades for action buttons:
```javascript
createRibbonBar: function() {
    var self = this;
    var ribbon = new Components.Core.RibbonBar.Ribbon({
        alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
        sectionTitles: false
    });
    
    var section = ribbon.createAddSection("Actions", null, true);
    section.createAddButton("Save", self.save.bind(self), "btn-success", "fa-save");
    section.createAddButton("Close", self.close.bind(self), "btn-danger", "fa-times");
    
    return ribbon;
}
```

### 2. Context Token System
ShareDo provides context tokens replaced at runtime:

| Token | Description | Example |
|-------|-------------|---------|
| `{{sharedoId}}` | Work item ID | "WI-12345" |
| `{{sharedoReference}}` | Work item reference | "ADV-2024-001" |
| `{{sharedoTitle}}` | Work item title | "Client Advice" |
| `{{sharedoTypeSystemName}}` | Work type system name | "OngoingAdvice" |
| `{{participantId}}` | Participant ID | "PART-789" |
| `{{participantRoleId}}` | Participant role ID | "ROLE-123" |

### 3. Opening Panels Programmatically
```javascript
$ui.stacks.openPanel("Namespace.BladeName", {
    workItemId: "{{sharedoId}}",
    customData: { foo: "bar" }
}, {
    closing: function(result) {
        console.log("Blade closing with result:", result);
    }
});
```

### 4. API Integration Pattern
```javascript
// Using ShareDo's AJAX wrapper
$ajax.api.get('/api/v1/public/workItem/' + workItemId)
    .then(function(response) {
        // Handle response
    })
    .catch(function(error) {
        // Handle error
    });

// POST with data
$ajax.api.post('/api/v1/public/workItem/' + workItemId + '/attributes', {
    attributeName: 'value'
});
```

## Data Models

### Model Pattern with KnockoutJS
```javascript
namespace("YourCompany.Models");

YourCompany.Models.DataModel = function(initialData) {
    var self = this;
    var data = initialData || {};
    
    // Observable properties
    self.id = ko.observable(data.id || null);
    self.name = ko.observable(data.name || '');
    self.status = ko.observable(data.status || 'pending');
    
    // Computed properties
    self.isActive = ko.pureComputed(function() {
        return self.status() === 'active';
    });
    
    // Validation
    self.isValid = ko.pureComputed(function() {
        return self.name() && self.name().length > 0;
    });
};

// Model methods
DataModel.prototype.update = function(data) {
    var self = this;
    if (data.name) self.name(data.name);
    if (data.status) self.status(data.status);
};
```

## Services Layer

### Service Pattern
```javascript
namespace("YourCompany.Services");

YourCompany.Services.ApiService = function() {
    var self = this;
    self.baseUrl = '/api/v1/public';
};

ApiService.prototype.getWorkItem = function(workItemId) {
    return $ajax.api.get(this.baseUrl + '/workItem/' + workItemId);
};

ApiService.prototype.updateAttributes = function(workItemId, attributes) {
    return $ajax.api.post(this.baseUrl + '/workItem/' + workItemId + '/attributes', attributes);
};
```

## UI Components and Patterns

### 1. Loading States
```html
<div data-bind="visible: model.loading" class="text-center">
    <i class="fa fa-spinner fa-spin fa-3x"></i>
    <p>Loading...</p>
</div>
```

### 2. Alert Messages
```html
<!-- Error Message -->
<div data-bind="visible: model.hasError" class="alert alert-danger">
    <i class="fa fa-exclamation-triangle"></i>
    <span data-bind="text: model.errorMessage"></span>
</div>

<!-- Success Message -->
<div data-bind="visible: model.hasSuccess" class="alert alert-success">
    <i class="fa fa-check"></i>
    <span data-bind="text: model.successMessage"></span>
</div>
```

### 3. Form Layout
```html
<form class="form-horizontal">
    <div class="form-group">
        <label class="col-sm-3 control-label">Label:</label>
        <div class="col-sm-9">
            <input class="form-control" data-bind="value: model.fieldValue">
            <span class="help-block" data-bind="text: model.fieldHelp"></span>
        </div>
    </div>
</form>
```

### 4. Action Buttons
```html
<div class="form-group">
    <div class="col-sm-offset-3 col-sm-9">
        <button type="button" 
                class="btn btn-primary" 
                data-bind="click: save, enable: model.canSave">
            <i class="fa fa-save"></i> Save
        </button>
        <button type="button" 
                class="btn btn-default" 
                data-bind="click: cancel">
            <i class="fa fa-times"></i> Cancel
        </button>
    </div>
</div>
```

## CSS Classes Reference

### Container Classes
- `ui-stack` - Main stack container
- `modal-header` - Header section
- `modal-body` - Body section  
- `modal-footer` - Footer section
- `nano` - Scrollable container
- `nano-content` - Scrollable content area

### Form Classes
- `form-horizontal` - Horizontal form layout
- `form-group` - Form field wrapper
- `col-sm-3` - Label column (3/12 width)
- `col-sm-9` - Input column (9/12 width)
- `control-label` - Label styling
- `form-control` - Input styling
- `help-block` - Help text

### Alert Classes
- `alert` - Base alert class
- `alert-info` - Information message
- `alert-success` - Success message
- `alert-warning` - Warning message
- `alert-danger` - Error message

### Button Classes
- `btn` - Base button class
- `btn-default` - Default button
- `btn-primary` - Primary action
- `btn-success` - Success action
- `btn-warning` - Warning action
- `btn-danger` - Danger action
- `btn-sm` - Small button
- `btn-lg` - Large button

### Text Classes
- `text-center` - Center text
- `text-danger` - Red/error text
- `text-success` - Green/success text
- `text-warning` - Orange/warning text
- `text-muted` - Muted/gray text

## Best Practices

### 1. Namespace Management
- Always use proper namespacing to avoid conflicts
- Follow pattern: `Company.Module.Component`

### 2. Configuration Handling
- Always validate required configuration
- Provide sensible defaults
- Log configuration for debugging
- Document expected configuration

### 3. Error Handling
- Use try-catch for API calls
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry logic where appropriate

### 4. Performance
- Use KnockoutJS computed properties efficiently
- Implement caching for API responses
- Clean up subscriptions in onDestroy
- Use pureComputed for read-only computeds

### 5. UI/UX
- Always show loading states
- Provide clear feedback for actions
- Use consistent styling with ShareDo theme
- Ensure responsive design works

### 6. Testing Considerations
- Test with various work item states
- Validate API error handling
- Ensure UI updates reflect backend changes
- Test cleanup in onDestroy methods

## Common Patterns

### 1. Auto-refresh Pattern
```javascript
if (options.autoRefresh && options.refreshInterval > 0) {
    self.refreshIntervalId = setInterval(function() {
        self.refresh();
    }, options.refreshInterval);
}

// In onDestroy:
if (self.refreshIntervalId) {
    clearInterval(self.refreshIntervalId);
}
```

### 2. Subscription Pattern
```javascript
// Subscribe to changes
var subscription = someObservable.subscribe(function(newValue) {
    // Handle change
});

// In onDestroy:
subscription.dispose();
```

### 3. Cache Pattern
```javascript
// Check cache first
var cached = Cache.get('cacheKey', itemId);
if (cached) {
    return Promise.resolve(cached);
}

// Fetch and cache
return fetchData().then(function(data) {
    Cache.set('cacheKey', itemId, data, TTL);
    return data;
});
```

## Module Examples

### AdviceManagement Module
Complete implementation of ongoing advice management:
- **AdvicePauseResumeBlade**: Main panel for pausing/resuming advice
- **AdvicePausedWidget**: Notification widget for paused advice
- **AdviceSummaryCard**: Summary card widget
- **AdviceBulkManager**: Bulk operations widget
- **AdviceStatusController**: Workflow action for automation

Key features:
- Real-time status updates
- Bulk operations support
- Workflow integration
- Caching and performance optimization
- Comprehensive error handling

## Development Workflow

1. **Create component structure** (folder with appropriate files)
2. **Define configuration** (.panel.json, .widget.json, or .action.json)
3. **Implement JavaScript controller** with proper lifecycle methods
4. **Create HTML template** with KnockoutJS bindings
5. **Add styles** if needed (prefer ShareDo classes)
6. **Test thoroughly** in ShareDo environment
7. **Document configuration** and usage

## Integration Points

- **ShareDo Portal**: Widgets integrate with portal pages
- **Workflow Engine**: Actions integrate with visual workflow designer
- **API Layer**: All components use ShareDo API wrapper
- **Event System**: Components can publish/subscribe to events
- **Cache System**: Shared caching for performance
- **Authentication**: Handled by ShareDo framework

## Troubleshooting

### Common Issues
1. **Blade not opening**: Check panel ID matches constructor name
2. **Bindings not working**: Ensure KnockoutJS observables are used
3. **API calls failing**: Check authentication and permissions
4. **Styles not applied**: Verify CSS file is referenced in configuration
5. **Widget not appearing**: Check widget configuration and portal settings

### Debugging Tips
- Use browser developer console
- Check network tab for API calls
- Verify configuration JSON is valid
- Test with minimal configuration first
- Check ShareDo logs for server-side errors

## Resources

- ShareDo UI Framework documentation
- KnockoutJS documentation: https://knockoutjs.com
- Font Awesome icons: https://fontawesome.com
- Bootstrap CSS framework (ShareDo uses Bootstrap 3)