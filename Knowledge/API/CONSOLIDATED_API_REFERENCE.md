# ShareDo Consolidated API Reference

This document consolidates all ShareDo API documentation from multiple sources.

## Document Sources
- API-REGISTRY.md - API usage tracking and registry
- API_KNOWLEDGE_BASE.md - Response structures and endpoints
- SHAREDO_API_KNOWLEDGE_BASE.md - ShareDo-specific patterns
- SHAREDO-API-BEST-PRACTICES.md - Best practices guide

## Quick Navigation
- [API Categories](#api-categories)
- [Common Endpoints](#common-endpoints)
- [Response Structures](#response-structures)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)

---

> **Note**: For detailed information, refer to the individual source documents in this folder.
> The external knowledge base at `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB` contains the most comprehensive API documentation.

## API Categories

### Public APIs (/api/v1/public/)
These are the official, supported APIs that should be used for all new development.

### Private APIs (/api/private/)
Legacy APIs that should be avoided in new code. Use only when no public alternative exists.

## Common Endpoints

### Work Item APIs
- `GET /api/v1/public/workItem/{id}` - Get work item details
- `GET /api/v1/public/workItem/{id}/attributes` - Get work item attributes
- `PUT /api/v1/public/workItem/{id}/attributes` - Update work item attributes
- `GET /api/v1/public/workItem/{id}/children` - Get child work items
- `POST /api/v1/public/workItem/{id}/children` - Create child work item
- `PUT /api/v1/public/workItem/{id}/phase` - Change work item phase

### Participant APIs
- `GET /api/v1/public/workItem/{id}/participants` - Get work item participants
- `POST /api/v1/public/workItem/{id}/participants` - Add participant
- `PUT /api/v1/public/participant/{id}` - Update participant

### Search APIs
- `POST /api/v1/public/search/workItems` - Search work items
- `GET /api/v1/public/search/participants` - Search participants

## Response Structures

### Standard Success Response
```json
{
    "success": true,
    "body": {
        // Response data
    },
    "status": 200
}
```

### Standard Error Response
```json
{
    "success": false,
    "status": 400,
    "error": {
        "message": "Error description",
        "code": "ERROR_CODE"
    }
}
```

## Best Practices

### 1. Always Use ShareDo HTTP Client
```javascript
// CORRECT
let result = sharedo.http.get("/api/v1/public/workItem/" + workItemId);

// INCORRECT - Don't use fetch or jQuery.ajax directly
fetch("/api/v1/public/workItem/" + workItemId);  // ❌
```

### 2. Check Response Success
```javascript
let result = sharedo.http.get(url);
if (result.success) {
    // Process result.body
} else {
    // Handle error
    log.Error(`API call failed: ${result.status}`);
}
```

### 3. Use Public APIs
Always prefer `/api/v1/public/` endpoints over `/api/private/` endpoints.

### 4. Handle Null/Undefined Attributes
```javascript
let attributes = result.body || {};
let value = attributes["attribute_name"];
if (value === null || value === undefined) {
    // Handle missing attribute
}
```

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Handling Pattern
```javascript
try {
    let result = sharedo.http.get(url);
    if (!result.success) {
        // Log error
        log.Error(`API call failed: ${result.status}`);
        
        // Set error message if configured
        if (errorVariable) {
            ctx[errorVariable] = `API error: ${result.status}`;
        }
        
        // Branch to error path
        if (errorConnection) {
            trigger.SubProcess(errorConnection).Now();
        }
    }
} catch (ex) {
    log.Error(`Exception calling API: ${ex.message}`);
}
```

## Workflow Context

In workflow templates, always use context variables:
```javascript
// Access context variables
let workItemId = ctx["workItemIdVariable"];

// Set context variables
ctx["resultVariable"] = result.body;
```

## Additional Resources

For more detailed information, see:
- Individual API documentation files in this folder
- External KB: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`
- Swagger definitions: `/swaggers/workItemSwagger.json`