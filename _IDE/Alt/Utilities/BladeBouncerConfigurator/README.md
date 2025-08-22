# BladeBouncer Configurator Widget

A visual configuration builder for creating BladeBouncer configurations without writing JSON manually.

## Features

### Three Configuration Modes

1. **Simple Mode** - Quick configuration for basic blade routing
   - Target blade selection with autocomplete
   - Common settings toggles
   - Minimal complexity

2. **Advanced Mode** - Full control over tokens and variables
   - Input variable management
   - Target configuration builder
   - Token source selection
   - Value type helpers (static, token, variable, expression)

3. **Conditional Mode** - Rule-based routing
   - Visual rule builder
   - Multiple condition operators
   - Default blade fallback
   - Drag-and-drop rule ordering (future enhancement)

### Smart Features

- **Blade Discovery** - Searches for available blades in the system
- **Template Library** - Pre-configured templates for common scenarios
- **Live Preview** - Real-time JSON configuration preview
- **Configuration Testing** - Test configurations directly from the builder
- **Import/Export** - Save and load configurations as JSON files
- **Local Storage** - Saves configurations for later use

## Installation

### As a Portal Widget

1. Place the widget files in your portal widgets directory:
   ```
   _IDE/Alt/Utilities/BladeBouncerConfigurator/
   ├── widget.html
   ├── widget.js
   ├── widget.css
   └── widget.panel.json
   ```

2. Add to your portal page configuration:
   ```javascript
   {
       "widget": "Alt.Utilities.BladeBouncerConfigurator",
       "configuration": {
           "showTemplates": true,
           "allowExport": true
       }
   }
   ```

### As a Standalone Page

Include the widget in any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="widget.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
    <div id="configurator"></div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/knockout/3.5.1/knockout-min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="widget.js"></script>
    <script>
        // Initialize the configurator
        var element = document.getElementById('configurator');
        var configurator = new Alt.Utilities.BladeBouncerConfigurator(element, {});
        ko.applyBindings(configurator, element);
        configurator.loadAndBind();
    </script>
</body>
</html>
```

## Usage Guide

### Creating a Simple Configuration

1. Select **Simple Mode**
2. Enter the target blade name
3. Configure basic settings (auto-redirect, debug mode, etc.)
4. Click **Save Configuration**

### Building Advanced Configurations

1. Select **Advanced Mode**
2. Add input variables:
   - Click "Add Variable"
   - Enter variable name and value
3. Configure target blade parameters:
   - Click "Add Configuration"
   - Enter property name
   - Select value type (static, token, variable, expression)
   - Enter the value
4. Select token sources
5. Preview and save

### Setting Up Conditional Rules

1. Select **Conditional Mode**
2. Add rules:
   - Click "Add Rule"
   - Enter the data path to check
   - Select operator (equals, contains, exists, etc.)
   - Enter expected value
   - Specify target blade
3. Set default blade for non-matching cases
4. Test with debug mode enabled

## Templates

### Available Templates

- **Edit Client** - Quick edit for client entities
- **Create Task** - Task creation with smart defaults
- **ODS Type Routing** - Conditional routing based on entity type
- **Create Document** - Document creation with templates

### Creating Custom Templates

Templates can be added to the widget.js file:

```javascript
BladeBouncerConfigurator.prototype.loadCustomTemplate = function() {
    var self = this;
    
    // Set mode
    self.model.mode('advanced');
    
    // Configure settings
    self.model.configName('My Custom Template');
    self.model.targetBlade('My.Custom.Blade');
    
    // Add configurations...
};
```

## Value Types Explained

### Static Values
Plain text or numbers that don't change:
```
"high" → "high"
123 → 123
```

### Token References
Data paths wrapped in brackets:
```
[workItem.matter.id] → Fetches matter ID from workItem
[workItem.roles.client.name] → Gets client name
```

### Variable Substitution
Input variables wrapped in braces:
```
{roleSystemName} → Replaced with input variable value
{priority} → Substituted at runtime
```

### JavaScript Expressions
Dynamic expressions wrapped in $[...]:
```
$[$ui.pageContext.sharedoId()] → Current ShareDo ID
$[new Date().toISOString()] → Current timestamp
$[formatDate(new Date(), 'YYYY-MM-DD')] → Formatted date
```

## Conditional Operators

| Operator | Description | Example |
|----------|-------------|---------|
| equals | Exact match | `type.name` equals `"people"` |
| contains | String contains | `description` contains `"urgent"` |
| exists | Field is present | `roles.client` exists |
| greaterThan | Numeric comparison | `amount` > `10000` |
| in | Value in array | `status` in `["active", "pending"]` |

## Configuration Storage

Configurations are saved in browser localStorage:
- Key: `bladeBouncerConfigs`
- Format: JSON object with named configurations

## Troubleshooting

### Blade Search Not Working
- Ensure API endpoint `/api/v1/public/panel/list` is available
- Falls back to common blade suggestions if API unavailable

### Configuration Not Applying
- Check browser console for errors
- Enable debug mode to see detailed information
- Verify JSON syntax in preview

### Export Not Working
- Check browser supports Blob and download APIs
- Try different browser if issues persist

## Advanced Customization

### Custom Blade Suggestions

Edit the `commonBlades` array in widget.js:

```javascript
self.commonBlades = [
    'Your.Custom.Blade.One',
    'Your.Custom.Blade.Two',
    // Add more...
];
```

### Custom Styling

Override CSS classes in your portal theme:

```css
.blade-bouncer-configurator {
    /* Your custom styles */
}

.mode-btn.active {
    background: #your-color;
}
```

## API Integration

The widget can integrate with your system's API:

```javascript
// In widget.js
searchBlades: function() {
    // Custom blade discovery logic
    $ajax.get('/your/api/blades').then(function(blades) {
        self.model.bladeSuggestions(blades);
    });
}
```

## Best Practices

1. **Start Simple** - Use Simple Mode for basic configurations
2. **Test First** - Always test with debug mode before deploying
3. **Use Templates** - Build from templates to save time
4. **Document Rules** - Add descriptive names to configurations
5. **Export Backups** - Export important configurations as JSON

## Support

For issues or questions:
1. Check the BladeBouncer documentation
2. Enable debug mode for detailed error information
3. Review the console for JavaScript errors
4. Test with a minimal configuration first