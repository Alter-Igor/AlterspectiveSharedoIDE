# Advice Status Controller - Workflow Designer Integration Guide

## Quick Start

### 1. Load the Integration
Add to your ShareDo page or workflow designer:
```html
<script src="/_ideFiles/Alt/AdviceManagement/AdviceStatusController/workflow-integration.js"></script>
```

### 2. Action Appears in Palette
Look for **"Advice Status Controller"** in the Advice Management category:
- Icon: Fork icon (fa-code-fork)
- Color: Teal (#17a2b8)
- Badge: NEW

### 3. Drag to Canvas
Simply drag the action from the palette onto your workflow canvas.

### 4. Configure
Double-click the action to configure:
- Set conditions (when status is X, then do Y)
- Define pause reasons
- Enable/disable retry logic

## Example: Auto-Pause Review Workflow

This workflow automatically pauses active advice for review:

```javascript
// Conditions Configuration
{
    "conditions": [
        {
            "when": "active",
            "then": "pause"
        },
        {
            "when": "paused", 
            "then": "resume"
        }
    ],
    "pauseReason": "Scheduled review required"
}
```

## Visual Workflow Example

```
[Start] → [Get Work Item] → [Advice Status Controller] → [Notify]
                                    ↓ (paused)
                                [Send Email]
                                    ↓ (resumed)
                                [Update Log]
                                    ↓ (error)
                                [Error Handler]
```

## Available Branches

The action provides 5 output branches:
- **success** - Action completed (any result)
- **paused** - Advice was paused
- **resumed** - Advice was resumed  
- **noAction** - No action was taken
- **error** - An error occurred

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| defaultAction | string | Action when no condition matches | "checkOnly" |
| conditions | array | When/then rules | [] |
| pauseReason | string | Reason for pausing | "Workflow pause" |
| requireConfirmation | boolean | Ask user before action | false |
| enableLogging | boolean | Log all actions | true |
| retryOnFailure | boolean | Retry on error | true |
| maxRetries | number | Max retry attempts | 3 |
| timeout | number | Action timeout (ms) | 30000 |

## Common Use Cases

### 1. Pause for Document Review
```json
{
    "conditions": [
        {"when": "active", "then": "pause"}
    ],
    "pauseReason": "Awaiting document review"
}
```

### 2. Auto-Resume After Hours
```json
{
    "conditions": [
        {"when": "paused", "then": "resume"}
    ]
}
```

### 3. Toggle Status
```json
{
    "conditions": [
        {"when": "*", "then": "toggle"}
    ]
}
```

## Testing

1. Import test workflow: `test-workflow.json`
2. Set a test work item ID
3. Run the workflow
4. Check logs for action results

## Troubleshooting

### Action Not Appearing
- Ensure `workflow-integration.js` is loaded
- Check browser console for errors
- Verify ShareDo.WorkflowDesigner is available

### Configuration Not Saving
- Validate all required fields
- Check for validation errors in designer
- Ensure proper JSON format

### Action Failing
- Check work item has advice attributes
- Verify API permissions
- Review action logs (if enableLogging: true)

## API Reference

### Input
```javascript
{
    workItemId: "WI-12345" // Required
}
```

### Output
```javascript
{
    success: true,
    actionTaken: "paused", // none|paused|resumed
    previousStatus: "active",
    currentStatus: "paused",
    message: "Advice paused successfully",
    errors: [],
    duration: 250
}
```

## Support

- Documentation: `/help/advice-status-controller`
- Issues: Contact system administrator
- Version: 1.0.0