# ShareDo API Knowledge Base

## CRITICAL: Always Check This Document Before Making API Calls

This document contains the accurate API response structures and endpoints for the ShareDo platform.

## Attributes API

### GET /api/v1/public/workItem/{workItemId}/attributes

**Response Structure:** The response is the attributes object DIRECTLY, not wrapped.

```javascript
// CORRECT Usage
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {  // 'attributes' is the direct response
        var adviceStatus = attributes['AdviceStatus'];
        var pausedDate = attributes['AdvicePausedDate'];
        var pausedReason = attributes['AdvicePausedReason'];
    });

// WRONG - DO NOT DO THIS
.then(function(response) {
    var adviceStatus = response.attributes['AdviceStatus'];  // WRONG!
});
```

### GET /api/v1/public/workItem/{workItemId}/attributes/{attributeName}

**Response Structure:** Returns an object with a `value` property.

```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes/AdviceStatus')
    .then(function(response) {
        var status = response.value;  // Access via .value property
    });
```

### POST /api/v1/public/workItem/{workItemId}/attributes/{attributeName}

**Request Structure:** Expects an object with a `value` property.

```javascript
$ajax.api.post('/api/v1/public/workItem/' + workItemId + '/attributes/AdviceStatus', {
    value: 'paused'  // Must wrap in value property
});
```

### GET /api/v1/public/workItem/{workItemId}/attributesCollection

**Response Structure:** Returns an array of attribute objects.

```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributesCollection')
    .then(function(attributes) {
        // attributes is an array
        attributes.forEach(function(attr) {
            console.log(attr.attribute, attr.value);
        });
    });
```

## Work Item API

### GET /api/v1/public/workItem/{workItemId}

**Response Structure:** Returns the work item object directly.

```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId)
    .then(function(workItem) {
        var title = workItem.title;
        var id = workItem.id;
        var assignee = workItem.assignee;
    });
```

### POST /api/v1/public/workItem/findByQuery

**Request Structure:**
```javascript
$ajax.api.post('/api/v1/public/workItem/findByQuery', {
    query: {
        attributes: {
            'AdviceStatus': { $exists: true }
        },
        workType: 'Legal Matter'  // Optional
    },
    limit: 50,
    includeAttributes: true
});
```

**Response Structure:**
```javascript
{
    items: [
        {
            id: '12345',
            title: 'Work Item Title',
            attributes: {
                'AdviceStatus': 'active',
                'AdvicePausedDate': '2024-01-01T00:00:00Z'
            }
        }
    ]
}
```

### PUT /api/v1/public/workItem/{workItemId}/attributes

**Request Structure:** Bulk update attributes
```javascript
$ajax.api.put('/api/v1/public/workItem/' + workItemId + '/attributes', {
    attributes: {
        'AdviceStatus': 'paused',
        'AdvicePausedDate': new Date().toISOString(),
        'AdvicePausedReason': 'Client request'
    }
});
```

## Non-Existent Endpoints (DO NOT USE)

These endpoints do not exist and should not be called:

- ❌ `/api/v1/public/workItem/{id}/history` - Does not exist
- ❌ `/api/v1/public/workItem/{id}/timeline` - Does not exist
- ❌ `/api/v1/public/workItem/{id}/events` - Does not exist

## Common Patterns

### Checking Advice Status

```javascript
// Get all attributes and check status
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {
        if (attributes['AdviceStatus'] === 'paused') {
            // Handle paused state
            var reason = attributes['AdvicePausedReason'];
            var date = attributes['AdvicePausedDate'];
        }
    })
    .catch(function(error) {
        if (error.status === 404) {
            // Attributes don't exist yet - treat as default state
            return {};
        }
        throw error;
    });
```

### Setting Multiple Attributes

```javascript
// Update multiple attributes at once
$ajax.api.put('/api/v1/public/workItem/' + workItemId + '/attributes', {
    attributes: {
        'AdviceStatus': 'active',
        'AdviceResumedDate': new Date().toISOString(),
        'AdviceResumedBy': userId
    }
});
```

### Error Handling

Always handle 404 errors gracefully as attributes may not exist:

```javascript
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {
        // Process attributes
    })
    .catch(function(error) {
        if (error.status === 404) {
            // No attributes exist - use defaults
            return processDefaults();
        }
        // Re-throw other errors
        console.error('API Error:', error);
        throw error;
    });
```

## Authentication

The `$ajax.api` service handles authentication automatically. You don't need to add auth headers manually.

## Important Notes

1. **Always use $ajax.api** for API calls - it handles auth and error processing
2. **Check response structure** - Many endpoints return data directly, not wrapped
3. **Handle 404s gracefully** - Attributes may not exist for all work items
4. **Use ISO strings for dates** - Always use `.toISOString()` for date values
5. **Cache responses** when appropriate to reduce API calls

## Testing API Calls

Before implementing, test in browser console:

```javascript
// Test getting attributes
$ajax.api.get('/api/v1/public/workItem/YOUR_ID/attributes')
    .then(console.log)
    .catch(console.error);
```

---

**Last Updated:** 2024
**Platform:** ShareDo
**API Version:** v1