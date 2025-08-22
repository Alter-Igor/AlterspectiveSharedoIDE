# ShareDo Panel Stack API Reference

## Overview
The `$ui.stacks` object is an instance of `UI.StackManager` that manages all panels/blades in ShareDo. It provides methods for opening, closing, and managing the lifecycle of panels in the application.

## Accessing the Stack Manager
```javascript
// Access via global $ui object
var stackManager = $ui.stacks;
```

## Core Properties

| Property | Type | Description |
|----------|------|-------------|
| `nextStackId` | number | The ID to be assigned to the next stack created |
| `stacks` | Array | Array of all active stacks in the UI |
| `nextOpenPanelRequestId` | number | The ID for the next panel open request |
| `openPanelRequestId` | number/null | Current active panel request ID |
| `animateDuration` | number | Duration of panel animations in milliseconds (default: 300) |
| `isDestroying` | boolean | Whether a panel is currently being destroyed |
| `destroyQueue` | Array | Queue of panels waiting to be destroyed |
| `uiQueue` | Array | Queue of UI operations |
| `popUpPanel` | object/null | Reference to currently open popup panel |

## Primary Methods

### Opening Panels

#### `openPanel(panelName, context, options, callback, errorCallback)`
Opens a panel in the main stack area.

```javascript
$ui.stacks.openPanel(
    'Alt.AdviceManagement.AdvicePauseResumeBlade',  // Panel name
    { workItemId: '123' },                           // Context data
    { width: 600 },                                  // Options
    function(panel) {                                // Success callback
        console.log('Panel opened:', panel);
    },
    function(error) {                                // Error callback
        console.error('Failed to open panel:', error);
    }
);
```

#### `openPanelAsPopup(panelName, context)`
Opens a panel as a popup/modal.

```javascript
$ui.stacks.openPanelAsPopup(
    'MyPanel.Name',
    { data: 'value' }
);
```

### Finding and Getting Panels

#### `find(predicate)`
Finds all panels matching a condition.

```javascript
var panels = $ui.stacks.find(function(panel) {
    return panel.name === 'MyPanel';
});
```

#### `findFirst(predicate)`
Finds the first panel matching a condition.

```javascript
var panel = $ui.stacks.findFirst(function(panel) {
    return panel.context.workItemId === '123';
});
```

#### `findLast(predicate)`
Finds the last panel matching a condition.

```javascript
var panel = $ui.stacks.findLast(function(panel) {
    return panel.isActive;
});
```

#### `findStack(predicate)`
Finds a stack matching a condition.

```javascript
var stack = $ui.stacks.findStack(function(stack) {
    return stack.id === 1;
});
```

#### `get(panelId)`
Gets a panel by its ID.

```javascript
var panel = $ui.stacks.get('panel-123');
```

#### `getTop()`
Gets the topmost panel.

```javascript
var topPanel = $ui.stacks.getTop();
```

### Panel Lifecycle Management

#### `create(element, panelConfig, context, options, callback, errorCallback)`
Creates a new panel programmatically.

```javascript
$ui.stacks.create(
    $('#container'),      // Container element
    panelConfig,          // Panel configuration
    context,              // Context data
    options,              // Panel options
    successCallback,      // Success callback
    errorCallback         // Error callback
);
```

#### `close(panel, skipAnimation, callback)`
Closes a specific panel.

```javascript
var panel = $ui.stacks.findFirst(function(p) { 
    return p.name === 'MyPanel'; 
});
if (panel) {
    $ui.stacks.close(panel, false, function() {
        console.log('Panel closed');
    });
}
```

#### `destroy(panel, skipAnimation, callback, force)`
Destroys a panel and removes it from the DOM.

```javascript
$ui.stacks.destroy(panel, false, function() {
    console.log('Panel destroyed');
}, false);
```

#### `destroyAll()`
Destroys all open panels.

```javascript
$ui.stacks.destroyAll();
```

### Panel Control Methods

#### `lock(panel, reason)`
Locks a panel to prevent user interaction.

```javascript
$ui.stacks.lock(panel, 'Processing data...');
```

#### `unlock(panel)`
Unlocks a previously locked panel.

```javascript
$ui.stacks.unlock(panel);
```

#### `resize(panel, size)`
Resizes a panel.

```javascript
$ui.stacks.resize(panel, { width: 800, height: 600 });
```

#### `toggleMaximise(panel)`
Toggles panel maximization.

```javascript
$ui.stacks.toggleMaximise(panel);
```

#### `setContent(panel, content)`
Sets the content of a panel.

```javascript
$ui.stacks.setContent(panel, '<div>New content</div>');
```

### Utility Methods

#### `cancel(panel, callback)`
Cancels panel operations.

```javascript
$ui.stacks.cancel(panel, function() {
    console.log('Cancelled');
});
```

#### `cancelAfter(milliseconds)`
Cancels operations after a delay.

```javascript
$ui.stacks.cancelAfter(5000); // Cancel after 5 seconds
```

#### `cancelAll()`
Cancels all pending operations.

```javascript
$ui.stacks.cancelAll();
```

#### `empty(panel)`
Empties the content of a panel.

```javascript
$ui.stacks.empty(panel);
```

#### `isPopUpOpen()`
Checks if a popup panel is currently open.

```javascript
if ($ui.stacks.isPopUpOpen()) {
    console.log('A popup is open');
}
```

#### `listOpen()`
Lists all open panels.

```javascript
var openPanels = $ui.stacks.listOpen();
console.log('Open panels:', openPanels);
```

### Advanced Methods

#### `loadBladeAndAssets(panelName, context, callback)`
Loads a blade/panel and its assets.

```javascript
$ui.stacks.loadBladeAndAssets(
    'MyPanel.Name',
    { data: 'value' },
    function(blade) {
        console.log('Blade loaded:', blade);
    }
);
```

#### `preCache(panelName, callback)`
Pre-caches a panel for faster loading.

```javascript
$ui.stacks.preCache('FrequentlyUsedPanel', function() {
    console.log('Panel pre-cached');
});
```

#### `restoreAllBlades()`
Restores all minimized or hidden blades.

```javascript
$ui.stacks.restoreAllBlades();
```

#### `marshallUiJob(job)`
Queues a UI job for execution.

```javascript
$ui.stacks.marshallUiJob(function() {
    // UI operation
});
```

#### `startWaitingFor(panel, message)`
Shows a waiting indicator for a panel.

```javascript
$ui.stacks.startWaitingFor(panel, 'Loading data...');
```

#### `stopWaitingFor(panel, message)`
Stops the waiting indicator.

```javascript
$ui.stacks.stopWaitingFor(panel, 'Complete');
```

## Debug Methods

#### `debugOpening()`
Enables debug mode for panel opening operations.

```javascript
$ui.stacks.debugOpening();
```

## Common Usage Patterns

### Opening a Panel with Context
```javascript
// Open advice management panel for a specific work item
$ui.stacks.openPanel(
    'Alt.AdviceManagement.AdvicePauseResumeBlade',
    { 
        workItemId: workItem.id,
        workItemTitle: workItem.title 
    },
    { 
        width: 600,
        height: 400 
    }
);
```

### Finding and Closing Panels
```javascript
// Find all panels for a specific work item
var panels = $ui.stacks.find(function(panel) {
    return panel.context && panel.context.workItemId === '123';
});

// Close them all
panels.forEach(function(panel) {
    $ui.stacks.close(panel);
});
```

### Checking Panel State
```javascript
// Check if a specific panel is open
var isOpen = $ui.stacks.findFirst(function(panel) {
    return panel.name === 'MyPanel.Name';
}) !== null;

if (isOpen) {
    console.log('Panel is already open');
}
```

### Working with Popups
```javascript
// Open as popup
$ui.stacks.openPanelAsPopup('ConfirmationDialog', {
    message: 'Are you sure?',
    onConfirm: function() {
        console.log('Confirmed');
    }
});

// Check if popup is open
if ($ui.stacks.isPopUpOpen()) {
    // Wait for popup to close
}
```

## Events and Callbacks

Most methods support callbacks for handling success and error states:

```javascript
$ui.stacks.openPanel(
    'PanelName',
    context,
    options,
    function(panel) {
        // Success - panel opened
        console.log('Panel ID:', panel.id);
        console.log('Panel Name:', panel.name);
        console.log('Panel Context:', panel.context);
    },
    function(error) {
        // Error - failed to open
        console.error('Error:', error);
    }
);
```

## Best Practices

1. **Always check if panel exists before operations**:
```javascript
var panel = $ui.stacks.findFirst(function(p) { 
    return p.name === 'MyPanel'; 
});
if (panel) {
    // Perform operations
}
```

2. **Use context to pass data between panels**:
```javascript
$ui.stacks.openPanel('DetailPanel', {
    parentPanel: currentPanel.id,
    data: selectedItem
});
```

3. **Clean up resources when closing panels**:
```javascript
$ui.stacks.close(panel, false, function() {
    // Clean up subscriptions, timers, etc.
    clearInterval(panel.refreshTimer);
});
```

4. **Handle errors gracefully**:
```javascript
$ui.stacks.openPanel(
    'PanelName',
    context,
    options,
    null, // No success callback needed
    function(error) {
        // Show user-friendly error
        $ui.showNotification('Unable to open panel', 'error');
    }
);
```

5. **Pre-cache frequently used panels**:
```javascript
// On application start
['Panel1', 'Panel2', 'Panel3'].forEach(function(panelName) {
    $ui.stacks.preCache(panelName);
});
```

## Integration with Other ShareDo Components

The Stack Manager works closely with:
- **$ui.pageContext**: For accessing current context
- **$ajax**: For loading panel data
- **EventBus**: For panel communication
- **KnockoutJS**: For data binding within panels

## Notes

- The Stack Manager handles panel lifecycle automatically
- Panels are loaded asynchronously
- Multiple panels can be open simultaneously
- Panels can be nested (panels opening other panels)
- The system supports both modal and non-modal panels
- Animations can be disabled for performance