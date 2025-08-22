# Alt Common Services

This directory contains reusable services that can be used across all Alt solutions.

## Available Services

### ConfigurationService

A powerful configuration processing utility that handles token replacement, variable substitution, and safe JavaScript execution.

#### Features

- **Token Extraction**: Extract tokens from configuration arrays for processing
- **Variable Substitution**: Replace `{variable}` placeholders with actual values
- **Bracketed Tokens**: Replace `[source.path]` tokens with data from API calls
- **JavaScript Execution**: Safely execute JavaScript expressions using `$[expression]` syntax
- **UI Context Access**: Access ShareDo UI context data through `$ui.pageContext`
- **Configuration Validation**: Validate configuration structure
- **Configuration Merging**: Merge multiple configuration objects

#### Usage

```javascript
// Initialize the service
var configService = new Alt.Common.Services.ConfigurationService({
    debugMode: true // Enable debug logging
});

// Example configuration with various token types
var config = {
    inputConfiguration: [
        { roleType: "client", priority: "high" }
    ],
    configForTargetBlade: [
        {
            // Variable substitution
            role: "{roleType}",
            
            // Bracketed token with variable
            roleId: "[workItem.roles.{roleType}.id]",
            
            // JavaScript execution (recommended format)
            userId: "$[$ui.pageContext.user.userid()]",
            fullName: "$[concat($ui.pageContext.user.firstname(), ' ', $ui.pageContext.user.lastname())]",
            
            // Complex expression
            timestamp: "$[formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')]"
        }
    ]
};

// Process configuration
var processedConfig = configService.processConfiguration(
    config.configForTargetBlade,
    enrichedData, // Data from API calls
    config.inputConfiguration
);
```

#### Token Patterns

1. **Variable Substitution**: `{variableName}`
   - Replaced with values from inputConfiguration

2. **Bracketed Tokens**: `[source.path.to.field]`
   - Replaced with data from API responses
   - Can include variables: `[workItem.roles.{roleType}.id]`

3. **JavaScript Execution**: `$[expression]`
   - Safe sandboxed JavaScript execution
   - Access to `$ui.pageContext`, `inputs`, `data`, and utility functions
   - Recommended format for dynamic values

4. **Legacy Format**: `$ui.pageContext.method()` (deprecated)
   - Use `$[...]` format instead for better consistency

#### Available Context in JavaScript Expressions

When using `$[...]` expressions, the following context is available:

- **$ui.pageContext**: ShareDo UI context (user, page, portal, etc.)
- **inputs**: Variables from inputConfiguration
- **data**: Enriched data from API calls
- **Utility Functions**:
  - `getValue(path, obj)`: Safely get nested values
  - `formatDate(date, format)`: Format dates
  - `concat(...args)`: Concatenate strings
  - `defaultValue(value, default)`: Provide defaults
  - `toUpperCase(str)`, `toLowerCase(str)`, `trim(str)`, `substring(str, start, end)`

#### Security

The service includes built-in security features:
- Sandboxed JavaScript execution
- Dangerous patterns are blocked (eval, Function, require, etc.)
- Limited scope with only safe functions available
- No access to window, document, or other global objects

## Integration Example

### In a Blade

```javascript
namespace("YourCompany.YourBlade");

YourCompany.YourBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Initialize the common configuration service
    self.configService = new Alt.Common.Services.ConfigurationService({
        debugMode: configuration.debugMode || false
    });
    
    // Process your configuration
    var processedConfig = self.configService.processConfiguration(
        configuration.targetConfig,
        apiData,
        configuration.inputConfig
    );
};
```

### In a Workflow Action

```javascript
namespace("YourCompany.WorkflowAction");

YourCompany.WorkflowAction = function(model, cfg) {
    var self = this;
    
    // Use the configuration service for token processing
    var configService = new Alt.Common.Services.ConfigurationService();
    
    var processedData = configService.processConfiguration(
        cfg.dataMapping,
        workItemData,
        cfg.inputs
    );
};
```

## Best Practices

1. **Always use `$[...]` format** for JavaScript expressions instead of the deprecated direct method calls
2. **Enable debug mode** during development to see token processing details
3. **Validate configuration** before processing to catch errors early
4. **Use utility functions** for common operations like date formatting
5. **Handle null/undefined values** gracefully with `defaultValue()` function

## Contributing

When adding new common services:

1. Place them in this directory with clear namespacing
2. Document all public methods with JSDoc comments
3. Include usage examples in this README
4. Consider backward compatibility when updating existing services
5. Add unit tests where applicable