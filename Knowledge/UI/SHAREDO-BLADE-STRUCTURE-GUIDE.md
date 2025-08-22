# ShareDo Blade Structure and Implementation Guide

## Core Blade Structure

Based on actual ShareDo blade HTML, the structure follows this pattern:

### Main Container Structure
```html
<div class="ui-stack root" style="width: 650px;">
    <!-- Modal Header -->
    <div class="modal-header add-edit-sharedo-header">
        <!-- Header content -->
    </div>
    
    <!-- Modal Body -->
    <div class="modal-body nano add-edit-sharedo-body">
        <div class="nano-content">
            <!-- Main blade content goes here -->
        </div>
    </div>
    
    <!-- Modal Footer -->
    <div class="modal-footer floating-footer add-edit-sharedo-footer">
        <!-- Footer navigation/actions -->
    </div>
</div>
```

## Blade JavaScript Implementation

The blade JavaScript constructor receives three parameters:

```javascript
YourCompany.YourBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Required lifecycle method
    self.afterInitialise = function() {
        // Called after blade is initialized
        // ShareDo handles Knockout binding automatically
    };
}
```

### Understanding Blade Parameters

1. **element**: The HTML DOM element where the blade is rendered
2. **configuration**: JSON object passed when opening the blade (contains context tokens)
3. **stackModel**: The blade stack model with metadata about the blade instance

## Blade Configuration and Context

### Configuration at Design Time

When configuring a blade to open (via buttons, menu items, or workflow actions), you provide a JSON configuration that gets passed to the blade constructor. ShareDo supports context tokens that are replaced with actual values at runtime.

### Available Context Tokens

#### Work Item Context
When opening a blade from a work item context, these tokens are available:

| Token | Description | Example Value |
|-------|-------------|---------------|
| `{{sharedoId}}` | The ID of the work item | "WI-12345" |
| `{{sharedoReference}}` | The reference of the work item | "ADV-2024-001" |
| `{{sharedoTitle}}` | The title of the work item | "Ongoing Advice Review" |
| `{{sharedoTypeSystemName}}` | The system name of the work type | "OngoingAdvice" |
| `{{sharedoTypeName}}` | The display name of the work type | "Ongoing Advice" |
| `{{phaseSystemName}}` | The system name of the current phase | "InProgress" |
| `{{phaseName}}` | The display name of the current phase | "In Progress" |

#### Participant Context
When opening from a participant context on a work item:

| Token | Description | Example Value |
|-------|-------------|---------------|
| `{{participantId}}` | The ID of the participant | "PART-789" |
| `{{participantOdsId}}` | The ODS entity ID of the participant | "ODS-456" |
| `{{participantTypeSystemName}}` | The system name of the participant type | "Client" |

#### Participant Role Context
When opening from a participant role context:

| Token | Description | Example Value |
|-------|-------------|---------------|
| `{{participantRoleId}}` | The ID of the participant role | "ROLE-123" |
| `{{participantRoleSystemName}}` | The system name of the participant role | "Adviser" |

### Configuration Examples

#### 1. Basic Work Item Context
```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}"
}
```

#### 2. Full Context with All Tokens
```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "workItemTitle": "{{sharedoTitle}}",
    "workTypeSystemName": "{{sharedoTypeSystemName}}",
    "workTypeName": "{{sharedoTypeName}}",
    "phaseSystemName": "{{phaseSystemName}}",
    "phaseName": "{{phaseName}}",
    "participantId": "{{participantId}}",
    "participantOdsId": "{{participantOdsId}}",
    "participantTypeSystemName": "{{participantTypeSystemName}}",
    "participantRoleId": "{{participantRoleId}}",
    "participantRoleSystemName": "{{participantRoleSystemName}}"
}
```

#### 3. Mixed Static and Dynamic Configuration
```json
{
    "workItemId": "{{sharedoId}}",
    "mode": "edit",
    "allowDelete": false,
    "customSetting": "value",
    "refreshInterval": 30000
}
```

### Accessing Configuration in Blade Code

```javascript
YourCompany.YourBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Configuration is the resolved object with tokens replaced
    console.log("Configuration received:", configuration);
    
    // Access specific values
    self.workItemId = configuration.workItemId || configuration.sharedoId;
    self.workItemReference = configuration.workItemReference || configuration.sharedoReference;
    self.participantId = configuration.participantId;
    
    // Handle optional/custom settings
    self.mode = configuration.mode || "view";
    self.refreshInterval = configuration.refreshInterval || 60000;
    
    // Fallback handling for missing context
    if (!self.workItemId) {
        console.warn("No work item ID provided in configuration");
        // Try alternative sources
        self.workItemId = stackModel && stackModel.sharedoId && stackModel.sharedoId();
    }
};
```

### Opening Blades Programmatically

When opening a blade from code, you can pass configuration directly:

```javascript
// With tokens (if in appropriate context)
$ui.stacks.openPanel("YourCompany.YourBlade", {
    workItemId: "{{sharedoId}}",
    workItemReference: "{{sharedoReference}}"
});

// With explicit values
$ui.stacks.openPanel("YourCompany.YourBlade", {
    workItemId: "WI-12345",
    workItemReference: "ADV-2024-001",
    customData: { foo: "bar" }
}, {
    // Optional callbacks
    closing: function(result) {
        console.log("Blade closing with result:", result);
    }
});
```

### Context Resolution Rules

1. **Tokens are only replaced when blade is opened from the appropriate context**
   - Work item tokens require work item context
   - Participant tokens require participant context
   - Role tokens require role context

2. **Unresolved tokens remain as strings**
   - If you use `{{participantId}}` from a work item context, it won't be replaced
   - Always check for token strings in your code

3. **Context inheritance**
   - Participant context includes work item context
   - Role context includes both participant and work item context

### Best Practices for Configuration

1. **Always validate required configuration**
```javascript
if (!configuration.workItemId) {
    throw new Error("workItemId is required");
}
```

2. **Provide sensible defaults**
```javascript
self.mode = configuration.mode || "view";
self.pageSize = configuration.pageSize || 20;
```

3. **Log configuration for debugging**
```javascript
console.log("Blade initialized with config:", configuration);
```

4. **Document expected configuration**
```javascript
/**
 * Expected configuration:
 * @param {string} workItemId - Required. The work item ID
 * @param {string} [mode=view] - Optional. "view" or "edit"
 * @param {boolean} [autoSave=false] - Optional. Enable auto-save
 */
```

## Key CSS Classes

### Container Classes
- `ui-stack` - Main stack container
- `modal-header` - Header section
- `modal-body` - Body section  
- `modal-footer` - Footer section
- `nano` - Scrollable container
- `nano-content` - Scrollable content area

### Form Layout Classes
- `form-horizontal` - Horizontal form layout
- `form-group` - Form field wrapper
- `col-sm-3` - Label column (3/12 width)
- `col-sm-9` - Input column (9/12 width)
- `control-label` - Label styling

### Widget Structure (Within Blades)
```html
<div class="widget">
    <div class="widget-title">
        <h3>
            <span class="fa fa-icon"></span>
            <span>Title</span>
        </h3>
        <nav class="widget-menu">
            <!-- Menu items -->
        </nav>
    </div>
    <div class="widget-body">
        <!-- Widget content -->
    </div>
</div>
```

### Card Components
```html
<div class="card">
    <div class="card-header">
        <!-- Header content -->
    </div>
    <div class="card-body">
        <!-- Body content -->
    </div>
</div>
```

### Alert/Message Classes
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

### Utility Classes
- `text-center` - Center text
- `text-danger` - Red/error text
- `text-success` - Green/success text
- `text-warning` - Orange/warning text
- `text-muted` - Muted/gray text
- `pull-left` - Float left
- `pull-right` - Float right
- `clearfix` - Clear floats

## Blade HTML Template Structure

Your blade HTML should follow this pattern:

```html
<div class="blade-container">
    <!-- Main form -->
    <form class="form-horizontal">
        
        <!-- Status/Loading States -->
        <div data-bind="visible: loading" class="text-center">
            <i class="fa fa-spinner fa-spin fa-2x"></i>
            <p>Loading...</p>
        </div>
        
        <!-- Error Messages -->
        <div data-bind="visible: hasError" class="alert alert-danger">
            <i class="fa fa-exclamation-triangle"></i>
            <span data-bind="text: errorMessage"></span>
        </div>
        
        <!-- Success Messages -->
        <div data-bind="visible: hasSuccess" class="alert alert-success">
            <i class="fa fa-check"></i>
            <span data-bind="text: successMessage"></span>
        </div>
        
        <!-- Main Content -->
        <div data-bind="visible: !loading()">
            
            <!-- Form Fields -->
            <div class="form-group">
                <label class="col-sm-3 control-label">Label:</label>
                <div class="col-sm-9">
                    <input class="form-control" data-bind="value: fieldValue">
                    <span class="text-danger" data-bind="visible: hasError, text: errorText"></span>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="form-group">
                <div class="col-sm-offset-3 col-sm-9">
                    <button type="button" class="btn btn-primary" data-bind="click: save">
                        <i class="fa fa-save"></i> Save
                    </button>
                    <button type="button" class="btn btn-default" data-bind="click: cancel">
                        <i class="fa fa-times"></i> Cancel
                    </button>
                </div>
            </div>
            
        </div>
    </form>
</div>
```

## Important Notes

1. **No Custom Widget Chrome**: Blades don't use `widgetChrome` binding - that's for widgets
2. **ShareDo Handles Binding**: Don't call `ko.applyBindings()` - ShareDo does this
3. **Use ShareDo Classes**: Stick to ShareDo's CSS classes for consistent theming
4. **Form Layout**: Use `form-horizontal` with `col-sm-3` / `col-sm-9` grid
5. **Loading States**: Always show loading spinners during async operations
6. **Error Handling**: Use alert classes for messages
7. **Icons**: Use Font Awesome classes (`fa fa-*`)

## Blade vs Widget

Key differences:
- **Blades**: Modal panels that slide out, have header/body/footer structure
- **Widgets**: Components that live on portal pages, use widget chrome
- **Navigation**: Blades can open other blades, widgets typically don't
- **Lifecycle**: Blades have `afterInitialise`, widgets have `initialize`

## Best Practices

1. Keep blade HTML clean and semantic
2. Use ShareDo's built-in classes (don't create custom CSS unless necessary)
3. Follow the form-horizontal pattern for all forms
4. Include proper loading and error states
5. Use data-bind for all dynamic content
6. Keep custom CSS to minimum - inherit ShareDo theming
7. Test in both light and dark themes
8. Ensure responsive design works

## Example Minimal Blade

```javascript
// blade.js
namespace("YourCompany.Blades");

YourCompany.Blades.SimpleBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Extract configuration with token support
    self.workItemId = configuration.workItemId || configuration.sharedoId;
    self.workItemReference = configuration.workItemReference || configuration.sharedoReference;
    
    // Log for debugging
    console.log("SimpleBlade initialized with config:", configuration);
    
    // Observables
    self.loading = ko.observable(false);
    self.data = ko.observable("");
    
    self.afterInitialise = function() {
        console.log("Blade initialized for work item:", self.workItemId);
    };
    
    self.save = function() {
        // Save logic
        $ui.stacks.close(self, { saved: true });
    };
    
    self.cancel = function() {
        $ui.stacks.cancel();
    };
};
```

### Configuration for the Example Blade

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "mode": "edit"
}
```

```html
<!-- blade.html -->
<div class="blade-simple">
    <form class="form-horizontal">
        <div class="form-group">
            <label class="col-sm-3 control-label">Data:</label>
            <div class="col-sm-9">
                <input class="form-control" data-bind="value: data">
            </div>
        </div>
        
        <div class="form-group">
            <div class="col-sm-offset-3 col-sm-9">
                <button type="button" class="btn btn-primary" data-bind="click: save">Save</button>
                <button type="button" class="btn btn-default" data-bind="click: cancel">Cancel</button>
            </div>
        </div>
    </form>
</div>
```

This structure ensures compatibility with ShareDo's theming and UI framework.
 
## Troubleshooting: "X is not a constructor" at blade load

If the browser console shows errors like:

- jQuery.Deferred exception: Alt.OngoingAdvice.Services.AttributeApiService is not a constructor

Root cause is almost always that one of your required scripts didn't load before the blade constructor ran. The most common culprit is incorrect or mis-cased URLs in your `*.panel.json` manifest, or wrong load order.

### Quick checklist
- Verify URLs in the `scripts` array are correct and reachable (no 404s) and match the server’s case-sensitive path conventions.
- Ensure load order: namespace -> models -> services -> blade (constructor last).
- Confirm the constructor name and namespace exactly match what the blade uses.
- Avoid duplicate/conflicting copies of the same service in multiple folders; point the manifest to the single, authoritative file.
- Watch for subtle path differences like `/_ideFiles/...` vs `/_idefiles/...` or `Alt/AdviceManagement` vs `alt/advicemanagement`.

### How to diagnose fast
1. Open DevTools > Network and filter by “.js”. Reload the blade and look for 404/failed requests among manifest scripts.
2. In Console, verify the symbol exists before the blade runs:
   
     ```javascript
     // Should be a function
     console.log(typeof Alt?.OngoingAdvice?.Services?.AttributeApiService);
     ```
3. If it’s `undefined`, fix the manifest path or load order. If it’s `object`, you probably instantiated it wrong; revisit the constructor name.

### Correct manifest example
Ensure your blade manifest points to the actual, published locations and orders dependencies correctly:

```json
{
    "id": "YourCompany.YourBlade",
    "priority": 6000,
    "width": 600,
    "scripts": [
        "/_ideFiles/Alt/AdviceManagement/Foundation/Helpers/namespace.js",
        "/_ideFiles/Alt/AdviceManagement/Foundation/Models/OngoingAdviceModel.js",
        "/_ideFiles/Alt/AdviceManagement/Foundation/Services/AttributeService.js",
        "/_ideFiles/Alt/AdviceManagement/Blades/AdvicePauseResume/blade.js"
    ],
    "styles": [],
    "templates": [
        "/_ideFiles/Alt/AdviceManagement/Blades/AdvicePauseResume/blade.html"
    ],
    "components": ["Sharedo.UI.Framework.Components.RibbonBar"]
}
```

Tip: Prefer absolute paths rooted at `/_ideFiles/` that mirror server-published casing. Keep all shared models/services under a single Foundation folder to avoid drift.