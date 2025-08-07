# AdvicePauseResumeBlade - Configuration Instructions

## Overview

The AdvicePauseResumeBlade receives configuration through the `configuration` parameter when opened. This configuration is passed as JSON when setting up commands, buttons, or menu items in ShareDo.

## Configuration Schema

The blade expects the following configuration structure:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "workItemTitle": "{{sharedoTitle}}",
    "workTypeSystemName": "{{sharedoTypeSystemName}}",
    "workTypeName": "{{sharedoTypeName}}",
    "phaseSystemName": "{{phaseSystemName}}",
    "phaseName": "{{phaseName}}"
}
```

## Configuration Examples

### 1. Basic Configuration (Minimal)

When adding a button or menu item to open this blade, use this minimal configuration:

```json
{
    "workItemId": "{{sharedoId}}"
}
```

### 2. Full Work Item Context

For complete work item information:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "workItemTitle": "{{sharedoTitle}}",
    "workTypeSystemName": "{{sharedoTypeSystemName}}",
    "workTypeName": "{{sharedoTypeName}}",
    "phaseSystemName": "{{phaseSystemName}}",
    "phaseName": "{{phaseName}}"
}
```

### 3. With Participant Context

If opening from a participant context:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "participantId": "{{participantId}}",
    "participantOdsId": "{{participantOdsId}}",
    "participantTypeSystemName": "{{participantTypeSystemName}}"
}
```

### 4. With Participant Role Context

If opening from a participant role context:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "participantId": "{{participantId}}",
    "participantRoleId": "{{participantRoleId}}",
    "participantRoleSystemName": "{{participantRoleSystemName}}"
}
```

### 5. With Custom Settings

You can also pass custom settings that the blade can use:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "autoRefresh": true,
    "refreshInterval": 30000,
    "showDebugInfo": false,
    "defaultReason": "Business requirement"
}
```

## How to Use These Configurations

### In ShareDo Designer

1. **Add a Command/Button/Menu Item**
2. **Set the Action Type** to "Open Blade"
3. **Set the Blade ID** to: `Alt.AdviceManagement.AdvicePauseResumeBlade`
4. **In the Configuration JSON field**, paste one of the above configurations

### In Custom Code

```javascript
// Open the blade programmatically
$ui.stacks.openPanel("Alt.AdviceManagement.AdvicePauseResumeBlade", {
    workItemId: "{{sharedoId}}",
    workItemReference: "{{sharedoReference}}",
    workItemTitle: "{{sharedoTitle}}"
}, {
    closing: function(result) {
        // Handle blade closing
        if (result && result.action === "Saved") {
            console.log("Advice status was changed");
        }
    }
});
```

### In Workflow Actions

When configuring a workflow action to open this blade:

```json
{
    "action": "openBlade",
    "bladeId": "Alt.AdviceManagement.AdvicePauseResumeBlade",
    "configuration": {
        "workItemId": "{{sharedoId}}",
        "workItemReference": "{{sharedoReference}}",
        "workTypeSystemName": "{{sharedoTypeSystemName}}"
    }
}
```

## Available Tokens

### Work Item Context Tokens
- `{{sharedoId}}` - The ID of the work item (REQUIRED)
- `{{sharedoReference}}` - The reference of the work item
- `{{sharedoTitle}}` - The title of the work item
- `{{sharedoTypeSystemName}}` - The system name of the work type
- `{{sharedoTypeName}}` - The title of the work type
- `{{phaseSystemName}}` - The system name of the phase
- `{{phaseName}}` - The name of the phase

### Participant Context Tokens
- `{{participantId}}` - The ID of the participant
- `{{participantOdsId}}` - The ODS entity ID of the participant
- `{{participantTypeSystemName}}` - The system name of the participant type

### Participant Role Context Tokens
- `{{participantRoleId}}` - The ID of the participant role
- `{{participantRoleSystemName}}` - The system name of the participant role

## Important Notes

1. **workItemId is Required**: The blade requires at least `workItemId` to function properly
2. **Tokens are Resolved at Runtime**: ShareDo replaces tokens with actual values when opening the blade
3. **Context Matters**: Tokens are only available if the blade is opened from the appropriate context
4. **Fallback Handling**: The blade attempts to get workItemId from multiple sources if not provided directly

## Troubleshooting

### Blade Opens but Shows "No work item ID provided"

**Solution**: Ensure you're passing `{{sharedoId}}` in the configuration:

```json
{
    "workItemId": "{{sharedoId}}"
}
```

### Tokens Not Being Replaced

**Possible Causes**:
- Opening blade from wrong context (e.g., using participant tokens from work item context)
- Typo in token name (tokens are case-sensitive)
- Token not available in current context

### Configuration Not Being Received

**Check**:
- JSON syntax is valid
- Configuration is being passed in the correct parameter
- Blade ID matches exactly: `Alt.AdviceManagement.AdvicePauseResumeBlade`

## Example: Adding to Work Item Menu

To add this blade to a work item's action menu:

1. Go to ShareDo Designer
2. Navigate to Work Type configuration
3. Add new Action/Command
4. Configure as follows:

```json
{
    "id": "pauseResumeAdvice",
    "title": "Manage Ongoing Advice",
    "icon": "fa-clock-o",
    "action": "openBlade",
    "bladeId": "Alt.AdviceManagement.AdvicePauseResumeBlade",
    "configuration": {
        "workItemId": "{{sharedoId}}",
        "workItemReference": "{{sharedoReference}}",
        "workItemTitle": "{{sharedoTitle}}",
        "workTypeSystemName": "{{sharedoTypeSystemName}}"
    },
    "visibility": {
        "condition": "{{sharedoTypeSystemName}} == 'Advice' || {{sharedoTypeSystemName}} == 'OngoingAdvice'"
    }
}
```

This configuration:
- Adds a menu item called "Manage Ongoing Advice"
- Opens the AdvicePauseResumeBlade when clicked
- Passes full work item context
- Only shows for Advice or OngoingAdvice work types