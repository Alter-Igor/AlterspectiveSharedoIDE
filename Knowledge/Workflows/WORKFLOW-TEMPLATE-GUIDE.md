# ShareDo Workflow Template Guide

## Critical Rules for ShareDo Workflow Templates

This guide documents the correct patterns for creating ShareDo workflow templates that use conditional compilation directives.

## ⚠️ CRITICAL: Variable Declaration Rules

### ❌ INCORRECT - Never declare the same variable in multiple branches
```javascript
// THIS WILL CAUSE ERRORS!
// $ifNotNull.Configuration.someVariable
let myVar = "$model.Configuration.someVariable";
// $else
let myVar = "defaultValue";  // ERROR: Cannot redeclare 'myVar'
// $endif
```

### ✅ CORRECT - Declare once, assign conditionally
```javascript
// Declare the variable once
let myVar;
// $ifNotNull.Configuration.someVariable
myVar = "$model.Configuration.someVariable";
// $else
myVar = "defaultValue";
// $endif
```

## Common Patterns

### 1. Getting Configuration Variables with Defaults
```javascript
// Pattern for optional configuration with default value
let pauseReason;
// $ifNotNull.Configuration.pauseReasonVariable
pauseReason = ctx["$model.Configuration.pauseReasonVariable"];
// $else
pauseReason = "Default reason text";
// $endif
```

### 2. Conditional Variable Assignment Inside Loops
```javascript
for (let item of items) {
    let targetValue;
    // $ifNotNull.Configuration.targetConfig
    targetValue = "$model.Configuration.targetConfig";
    // $else
    targetValue = "defaultTarget";
    // $endif
    
    // Use targetValue here
}
```

### 3. Optional Configuration Values
```javascript
// For truly optional values (no else branch needed)
// $ifNotNull.Configuration.optionalValue
let optionalValue = ctx["$model.Configuration.optionalValue"];
// $endif
```

### 4. Conditional Branching
```javascript
// $ifNotNull.Connections.success
trigger.SubProcess("$model.Connections.success.step").Now();
// $else
// $ifNotNull.Connections.fallback
trigger.SubProcess("$model.Connections.fallback.step").Now();
// $endif
// $endif
```

## ShareDo Template Directives

### Available Directives
- `// $ifNotNull.path` - Checks if configuration path exists and is not null
- `// $ifNull.path` - Checks if configuration path is null or doesn't exist
- `// $else` - Alternative branch
- `// $endif` - Ends conditional block

### Path References
- `$model.Configuration.propertyName` - Access configuration properties
- `$model.Connections.connectionName` - Access workflow connections
- `ctx["variableName"]` - Access workflow context variables

## Complete Example

```javascript
// Advice Workflow Action - ShareDo Template
log.Information("Starting workflow action");

// Declare all variables that will be conditionally assigned
let workItemId;
let actionReason;
let targetPhase;

// Get work item ID - required
// $ifNotNull.Configuration.workItemIdVariable
workItemId = ctx["$model.Configuration.workItemIdVariable"];

// Get action reason - optional with default
// $ifNotNull.Configuration.reasonVariable
actionReason = ctx["$model.Configuration.reasonVariable"];
// $else
actionReason = "Action performed by workflow";
// $endif

if (!workItemId) {
    // Handle error
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "No work item ID provided";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $endif
} else {
    try {
        // Make API call
        let apiUrl = "/api/v1/public/workItem/" + workItemId;
        let result = sharedo.http.get(apiUrl);
        
        if (result.success) {
            // Conditional target phase
            // $ifNotNull.Configuration.targetPhase
            targetPhase = "$model.Configuration.targetPhase";
            // $else
            targetPhase = "Default";
            // $endif
            
            // Process result...
            
            // $ifNotNull.Connections.success
            trigger.SubProcess("$model.Connections.success.step").Now();
            // $endif
        } else {
            // $ifNotNull.Connections.error
            trigger.SubProcess("$model.Connections.error.step").Now();
            // $endif
        }
    } catch (ex) {
        log.Error(`Error: ${ex.message}`);
        // $ifNotNull.Connections.error
        trigger.SubProcess("$model.Connections.error.step").Now();
        // $endif
    }
}
// $endif
```

## Testing Your Templates

1. **Validate Variable Declarations**: Ensure no variable is declared (`let` or `const`) more than once
2. **Check Conditional Paths**: Verify all `$if` directives have matching `$endif`
3. **Test Both Branches**: Consider what happens when configuration is present vs absent
4. **Review Generated Code**: The template processor will generate different code based on configuration

## Common Mistakes to Avoid

1. **Duplicate Declarations**: Never use `let` or `const` in both branches of a conditional
2. **Missing $endif**: Always close conditional blocks
3. **Incorrect Path Syntax**: Use dots for nested paths (e.g., `Configuration.nested.value`)
4. **Forgetting ctx[]**: Context variables must be accessed through `ctx["name"]`
5. **Hardcoding Values**: Use configuration variables instead of hardcoded strings where possible

## References

- See `AdviceStatusChecker-template.js` for a complete working example
- Review `SHAREDO-BLADE-STRUCTURE-GUIDE.md` for blade implementation patterns
- Check workflow action JSON files for configuration structure

## Knowledge Base Resources

For comprehensive ShareDo documentation, examples, and best practices, refer to our knowledge base:

**Path**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

This knowledge base contains:
- Complete ShareDo API documentation
- Workflow engine specifications
- Blade development patterns
- Widget implementation guides
- Code examples and templates
- Best practices and troubleshooting guides

### For AI Assistants (Claude, Codex, etc.)
When working on ShareDo-related tasks, you should reference this knowledge base for:
- API endpoint documentation
- ShareDo-specific patterns and conventions
- Workflow template syntax and directives
- Blade and widget architecture details
- Configuration schema definitions
- Historical implementation examples

The knowledge base provides authoritative information about ShareDo's architecture and should be consulted when implementing new features or debugging existing ones.