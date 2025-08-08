# Advice Management Attribute Registry

## CRITICAL: This is the authoritative source for all advice-related attributes

**IMPORTANT:** Always check this registry before creating or using attributes. If you need a new attribute, first check if an existing one serves the purpose, then update this registry if a new one is truly needed.

## Registered Attributes

### Core Advice Status Attributes

| Attribute Name | Type | Description | Valid Values | Example |
|---------------|------|-------------|--------------|---------|
| `alt_ongoing_advice_enabled` | String (Boolean) | Whether ongoing advice is enabled/active | "true", "false" | "false" |
| `alt_ongoing_advice_pause_reason` | String | Reason for pausing advice | Free text (max 500 chars) | "Client requested pause" |
| `alt_ongoing_advice_resume_reason` | String/null | Reason for resuming advice | Free text (max 500 chars) or null | "Client ready to proceed" |

### Date/Time Tracking Attributes

| Attribute Name | Type | Description | Format | Example |
|---------------|------|-------------|--------|---------|
| `alt_ongoing_advice_paused_date` | String (ISO Date) | When advice was paused | ISO 8601 | "2025-08-08T02:57:11.301Z" |
| `alt_ongoing_advice_resumed_date` | String (ISO Date) | When advice was resumed | ISO 8601 | "2025-08-08T01:56:20.458Z" |
| `alt_ongoing_advice_next_date` | String (ISO Date) | Next scheduled advice date | ISO 8601 or empty string | "2025-09-08T00:00:00.000Z" |

### User Tracking Attributes

| Attribute Name | Type | Description | Format | Example |
|---------------|------|-------------|--------|---------|
| `alt_ongoing_advice_paused_by` | String | Name of user who paused advice | Text | "John Smith" |
| `alt_ongoing_advice_resumed_by` | String | Name of user who resumed advice | Text | "Jane Doe" |

## Deprecated/Incorrect Attribute Names

**DO NOT USE THESE** - They are not registered and should be replaced:

❌ `AdviceStatus` → Use `alt_ongoing_advice_enabled`
❌ `AdvicePausedDate` → Use `alt_ongoing_advice_paused_date`
❌ `AdvicePausedReason` → Use `alt_ongoing_advice_pause_reason`
❌ `AdviceResumedDate` → Use `alt_ongoing_advice_resumed_date`
❌ `AdvicePausedBy` → Use `alt_ongoing_advice_paused_by`
❌ `AdviceResumedBy` → Use `alt_ongoing_advice_resumed_by`
❌ `AdviceNextScheduledAction` → Use `alt_ongoing_advice_next_date`
❌ `AdviceStartDate` → Do not use - derive from work item creation
❌ `AdviceCompletionPercent` → Do not use - calculate from dates
❌ `AdvicePauseCount` → Do not use - calculate from history when available

## Usage Examples

### Checking if Advice is Paused

```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {
        var isEnabled = attributes['alt_ongoing_advice_enabled'];
        if (isEnabled === 'false') {
            // Advice is paused
            var pausedDate = attributes['alt_ongoing_advice_paused_date'];
            var pausedBy = attributes['alt_ongoing_advice_paused_by'];
            var pauseReason = attributes['alt_ongoing_advice_pause_reason'];
        }
    });
```

### Pausing Advice

```javascript
$ajax.api.put('/api/v1/public/workItem/' + workItemId + '/attributes', {
    attributes: {
        'alt_ongoing_advice_enabled': 'false',
        'alt_ongoing_advice_paused_date': new Date().toISOString(),
        'alt_ongoing_advice_paused_by': currentUserId,
        'alt_ongoing_advice_pause_reason': reason,
        'alt_ongoing_advice_next_date': '' // Clear next date when pausing
    }
});
```

### Resuming Advice

```javascript
$ajax.api.put('/api/v1/public/workItem/' + workItemId + '/attributes', {
    attributes: {
        'alt_ongoing_advice_enabled': 'true',
        'alt_ongoing_advice_resumed_date': new Date().toISOString(),
        'alt_ongoing_advice_resumed_by': currentUserId,
        'alt_ongoing_advice_resume_reason': reason,
        'alt_ongoing_advice_next_date': nextDate.toISOString()
    }
});
```

## Important Notes

1. **Boolean Values**: Store as strings "true" or "false", not actual booleans
2. **Dates**: Always use ISO 8601 format via `.toISOString()`
3. **User IDs**: Store as UUID strings
4. **Null Handling**: Use `null` or empty string `""` for missing values
5. **Attribute Prefix**: All attributes use `alt_ongoing_advice_` prefix for namespace isolation

## Validation Rules

- **pause_reason**: Optional, max 500 characters
- **resume_reason**: Optional, max 500 characters
- **enabled**: Required, must be "true" or "false"
- **dates**: Must be valid ISO 8601 format or empty
- **user IDs**: Must be valid UUIDs

## Adding New Attributes

Before adding a new attribute:

1. ✅ Check if an existing attribute can serve the purpose
2. ✅ Ensure the attribute follows the naming convention: `alt_ongoing_advice_[name]`
3. ✅ Document it in this registry with all details
4. ✅ Update all relevant code to use the new attribute
5. ✅ Test that the attribute works with the API

## Status Determination Logic

To determine if advice is paused or active:

```javascript
function isAdvicePaused(attributes) {
    // Primary check: the enabled flag
    return attributes['alt_ongoing_advice_enabled'] === 'false';
}

function getAdviceStatus(attributes) {
    if (attributes['alt_ongoing_advice_enabled'] === 'false') {
        return 'paused';
    }
    return 'active';
}
```

---

**Last Updated:** January 2025
**Module:** Alt.AdviceManagement
**Version:** 1.0