# BladeBouncer Utility

A powerful utility blade for ShareDo IDE that enables dynamic blade redirection with advanced token replacement capabilities.

## Overview

BladeBouncer acts as an intelligent intermediary that:
- Accepts configuration with tokens that need to be resolved
- Fetches required data from various sources (workItem, matter, participant, etc.)
- Replaces tokens with actual values
- Redirects to the target blade with the processed configuration
- Optionally closes itself after successful redirection

## Features

- **Token Replacement**: Supports multiple token patterns for dynamic value substitution
- **Variable Substitution**: Use variables from input configuration in token paths
- **Data Enrichment**: Automatically fetches required data from API endpoints
- **Conditional Routing**: Route to different blades based on data conditions
- **JavaScript Execution**: Safe execution of JavaScript expressions for dynamic values
- **Debug Mode**: Visual configuration preview and detailed console logging
- **Error Handling**: Comprehensive error messages with helpful suggestions
- **Flexible Configuration**: Control redirect timing, auto-close behavior, and more
- **Memory Management**: Automatic cleanup and request cancellation

## Token Patterns

### 1. Bracketed Tokens (Case-Insensitive)
```javascript
"[workItem.field.path]"    // Standard camelCase
"[workitem.field.path]"    // Lowercase - also supported
"[WorkItem.field.path]"    // Mixed case - also supported
"[workItem.matter.name]"
"[workItem.roles.client.displayName]"
```

### 2. Variable Substitution
```javascript
"{variableName}"  // Replaced with value from inputConfiguration
```

### 3. Combined Tokens
```javascript
"[workItem.roles.{roleSystemName}.ods.id]"  // Variable within token path
```

### 4. UI Context Expressions
```javascript
// Core context
"$ui.pageContext.sharedoId()"
"$ui.pageContext.sharedoType()"

// User context (nested observables)
"$ui.pageContext.user.userid()"
"$ui.pageContext.user.username()"
"$ui.pageContext.user.firstname()"
"$ui.pageContext.user.lastname()"
"$ui.pageContext.user.organisationId()"

// Page & Portal
"$ui.pageContext.pageSystemName()"
"$ui.pageContext.pageTitle()"
"$ui.pageContext.portalTitle()"

// Currency & Localization
"$ui.pageContext.contextCurrencyCode()"
"$ui.pageContext.contextCurrencySymbol()"

// Organization
"$ui.pageContext.defaultOrgId()"
```

### 5. JavaScript Execution (NEW)
```javascript
"$[javascript expression]"  // Safe JavaScript execution in sandboxed context
```

The `$[...]` pattern allows safe JavaScript execution with access to:
- **inputs**: Variables from inputConfiguration
- **data**: Enriched data from API calls
- **$ui.pageContext**: ShareDo UI context methods
- **Utility functions**: getValue, formatDate, concat, defaultValue
- **Standard objects**: Math, Date, JSON, String, Number, Boolean

Examples:
```javascript
// Dynamic timestamps
"$[new Date().toISOString()]"
"$[formatDate(new Date(), 'YYYY-MM-DD')]"

// Conditional logic
"$[inputs.priority === 'high' ? 100 : 50]"
"$[inputs.category === 'legal' ? 'LAW-' + data['workItem.id'] : 'GEN-' + data['workItem.id']]"

// Calculations
"$[Math.round(inputs.multiplier * 100)]"
"$[inputs.quantity * inputs.price]"

// String operations
"$[concat('USER-', $ui.pageContext.userId(), '-', Date.now())]"
"$[inputs.firstName + ' ' + inputs.lastName]"

// Safe data access
"$[getValue('workItem.roles.client.name', data)]"
"$[defaultValue(data['workItem.optional'], 'N/A')]"

// Random values
"$[toUpperCase(substring(Math.random().toString(36), 2, 9))]"
```

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `targetBlade` | string | No* | - | The blade ID to redirect to |
| `inputConfiguration` | array | No | [] | Variables for token substitution |
| `configForTargetBlade` | array | No | [] | Configuration to pass to target blade |
| `conditionalRules` | array | No | [] | Rules for conditional blade routing |
| `defaultTargetBlade` | string | No | - | Fallback blade when no rules match |
| `tokenSources` | array | No | ["workItem"] | Data sources to fetch |
| `debugMode` | boolean | No | false | Enable debug mode |
| `autoRedirect` | boolean | No | true | Auto-redirect on load |
| `redirectDelay` | number | No | 500 | Delay before redirect (ms) |
| `closeAfterRedirect` | boolean | No | true | Close bouncer after redirect |

*Either `targetBlade` or `conditionalRules` must be specified

## Usage Examples

### Basic Usage
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Sharedo.Core.Case.Dashboard",
    configForTargetBlade: [
        { caseId: "$ui.pageContext.sharedoId()" }
    ]
});
```

### With Variable Substitution
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Sharedo.Core.Case.Panels.Ods.AddEditPerson",
    inputConfiguration: [
        { roleSystemName: "client" }
    ],
    configForTargetBlade: [
        { id: "[workItem.roles.{roleSystemName}.ods.id]" },
        { sharedoId: "$ui.pageContext.sharedoId()" },
        { mode: "edit" }
    ]
});
```

### Complex Configuration
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Custom.Blades.ComplexEditor",
    inputConfiguration: [
        { roleType: "solicitor", documentSection: "header" }
    ],
    configForTargetBlade: [
        { primaryContact: "[workItem.roles.{roleType}.contact.id]" },
        { contactEmail: "[workItem.roles.{roleType}.contact.email]" },
        { documentConfig: {
            section: "{documentSection}",
            matterId: "[workItem.matter.id]"
        }}
    ],
    tokenSources: ["workItem", "matter"],
    debugMode: true,
    autoRedirect: true,
    redirectDelay: 750
});
```

### With JavaScript Execution
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Custom.Blades.TaskProcessor",
    inputConfiguration: [
        { priority: "high", multiplier: 1.5 }
    ],
    configForTargetBlade: [
        { 
            taskId: "$[concat('TASK-', Date.now())]",
            timestamp: "$[new Date().toISOString()]",
            priorityScore: "$[inputs.priority === 'high' ? 100 : 50]",
            calculatedValue: "$[Math.round(inputs.multiplier * 100)]",
            assignedTo: "$[$ui.pageContext.user.userid()]",
            status: "$[inputs.priority === 'high' ? 'URGENT' : 'NORMAL']",
            reference: "$[concat(data['workItem.matter.id'], '-', Math.random().toString(36).substring(7))]"
        }
    ],
    tokenSources: ["workItem"],
    debugMode: true
});
```

### With Full User Context
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Custom.UserDashboard",
    configForTargetBlade: [
        {
            // User information
            userId: "$ui.pageContext.user.userid()",
            userName: "$ui.pageContext.user.username()",
            fullName: "$[concat($ui.pageContext.user.firstname(), ' ', $ui.pageContext.user.lastname())]",
            orgId: "$ui.pageContext.user.organisationId()",
            
            // Context information
            currentPage: "$ui.pageContext.pageSystemName()",
            portalName: "$ui.pageContext.portalTitle()",
            sharedoId: "$ui.pageContext.sharedoId()",
            
            // Localization
            currency: "$ui.pageContext.contextCurrencyCode()",
            currencySymbol: "$ui.pageContext.contextCurrencySymbol()",
            country: "$[$ui.pageContext.localisation.defaultCountrySystemName()]",
            timezone: "$[$ui.pageContext.localisation.defaultTimeZone()]",
            
            // Dynamic values
            sessionId: "$[concat($ui.pageContext.user.userid(), '-', Date.now())]",
            displayName: "$[$ui.pageContext.user.firstname() + ' (' + $ui.pageContext.user.username() + ')']",
            priceDisplay: "$[concat($ui.pageContext.contextCurrencySymbol(), '1,000.00')]"
        }
    ],
    debugMode: false,
    autoRedirect: true
});
```

### Conditional Routing
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    inputConfiguration: [
        { roleSystemName: "client" }
    ],
    conditionalRules: [
        {
            condition: {
                path: "workItem.roles.{roleSystemName}.ods.type.name",
                operator: "equals",
                value: "people"
            },
            targetBlade: "Sharedo.Core.Case.Panels.Ods.AddEditPerson",
            configForTargetBlade: [
                { id: "[workItem.roles.{roleSystemName}.ods.id]" }
            ]
        },
        {
            condition: {
                path: "workItem.roles.{roleSystemName}.ods.type.name", 
                operator: "equals",
                value: "organisation"
            },
            targetBlade: "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation",
            configForTargetBlade: [
                { id: "[workItem.roles.{roleSystemName}.ods.id]" }
            ]
        }
    ],
    defaultTargetBlade: "Sharedo.Core.Case.Panels.Ods.ViewEntity",
    tokenSources: ["workItem"],
    debugMode: false,
    autoRedirect: true
});
```

### Debug Mode
```javascript
$ui.stacks.openPanel("Alt.Utilities.BladeBouncer", {
    targetBlade: "Test.Blade",
    configForTargetBlade: [
        { testToken: "[workItem.id]" }
    ],
    debugMode: true,        // Shows configuration preview
    autoRedirect: false,    // Manual trigger required
    closeAfterRedirect: false  // Keep bouncer open
});
```

## Error Handling

When errors occur, BladeBouncer provides:
1. **Detailed Console Output**: JSON-formatted error details
2. **Helpful Suggestions**: Context-aware error resolution tips
3. **Debug Information**: Full configuration dump when debugMode is enabled

Example error output:
```json
{
    "timestamp": "2024-01-15T10:30:00.000Z",
    "message": "Failed to enrich workItem tokens",
    "error": "API request failed",
    "blade": "Alt.Utilities.BladeBouncer",
    "configuration": { ... },
    "context": {
        "sharedoId": "12345",
        "userId": "user123"
    }
}
```

## Integration with Workflows

BladeBouncer can be integrated into workflow actions:

```javascript
// In a workflow action
function executeAction(context) {
    var config = {
        targetBlade: "Sharedo.Core.Tasks.EditTask",
        inputConfiguration: [
            { taskCategory: context.category }
        ],
        configForTargetBlade: [
            { taskId: "[workItem.customFields.currentTaskId]" },
            { category: "{taskCategory}" }
        ]
    };
    
    $ui.stacks.openPanel("Alt.Utilities.BladeBouncer", config);
}
```

## Troubleshooting

### Common Issues

1. **"Target blade is required"**
   - Solution: Ensure `targetBlade` property is included in configuration

2. **"Token not found in enriched data"**
   - Solution: Verify token path matches actual data structure
   - Enable debugMode to see available data

3. **"Failed to evaluate expression"**
   - Solution: Use only supported UI context methods

4. **"Invalid configuration structure"**
   - Solution: Ensure arrays are properly formatted
   - Refer to example-config.json

### Debug Tips

1. Enable `debugMode: true` to see:
   - Configuration preview in UI
   - Detailed console logging
   - Token extraction details

2. Check console for:
   - Error details in JSON format
   - Helpful suggestions
   - Stack traces (in debug mode)

3. Use example-config.json as reference for:
   - Valid configuration structures
   - Token pattern examples
   - Error scenarios and solutions

## Files

- `blade.js` - Main blade controller
- `blade.html` - UI template
- `blade.css` - Styling
- `blade.panel.json` - Blade registration
- `services/ConfigurationService.js` - Token processing service
- `example-config.json` - Configuration examples and documentation
- `README.md` - This documentation

## Support

For issues or questions, check:
1. The example-config.json file for configuration examples
2. Console error messages for detailed error information
3. Debug mode output for configuration details