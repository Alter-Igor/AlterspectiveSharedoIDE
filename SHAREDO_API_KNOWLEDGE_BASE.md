# ShareDo API Knowledge Base

## Overview
ShareDo provides a comprehensive REST API for managing work items, users, notifications,
 and related data. All APIs require authentication via auth tokens execpt when calling from the ShareDo web application itself utalising the $ajax wrapper or from the sharedo workflows actions.

## Base URL
- **Production/Demo**: `https://demo-aus.sharedo.tech`
- **Scheme**: HTTPS only
- **Content-Type**: `application/json`

## API Versions and Endpoints

### 1. Users API (v2)
**Base Path**: `/api/public/v2/users`

#### Endpoints:
- `GET /{id}` - Get user details by ID
- `GET /{id}/avatar` - Get user's avatar/profile image

#### User Response Object:
```json
{
  "id": "string",
  "firstName": "string",
  "suname": "string",  // Note: typo in API - should be surname
  "dateOfBirth": {
    "year": integer,
    "month": integer,
    "day": integer
  },
  "isActive": boolean,
  "organisationId": "string",
  "primaryTeamId": "string",
  "profileImageId": "string",
  "shortName": "string",
  "reference": "string",
  "timeZone": "string",
  "availabilitySystemName": "string",
  "aspectData": object
}
```

#### Avatar Response:
```json
{
  "mimeType": "string",
  "content": "string"  // Base64-encoded image
}
```

### 2. Work Item Attributes API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Endpoints:

##### All Attributes:
- `GET /{workItemId}/attributes` - Get all attributes for a work item
- `POST /{workItemId}/attributes` - Add/Update attributes (merge)
- `POST /{workItemId}/attributes/replace` - Replace all attributes

##### Single Attribute:
- `GET /{workItemId}/attributes/{attributeName}` - Get single attribute
- `POST /{workItemId}/attributes/{attributeName}` - Add/Update single attribute
- `DELETE /{workItemId}/attributes/{attributeName}` - Remove attribute

#### Attribute Response Format:
```json
{
  "attributeName1": "value1",
  "attributeName2": "value2",
  // ... more key-value pairs
}
```

**Important**: The attributes endpoint returns the attributes object **directly**, not wrapped in a response object.

### 3. Work Item Management API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Core Work Item Operations:
- Create and update work items
- Manage work item lifecycle
- Handle work item references and titles

### 4. Work Item Search API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Features:
- Query work items by various criteria
- Search by title, reference, type
- Filter by status, phase, dates
- Support for complex queries

### 5. Comments API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Endpoints:
- `GET /{workItemId}/comments` - Get all comments
- `POST /{workItemId}/comments` - Add new comment
- `PUT /{workItemId}/comments/{commentId}` - Update comment
- `DELETE /{workItemId}/comments/{commentId}` - Delete comment

### 6. Audit Events API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Endpoints:
- `GET /{workItemId}/audit` - Get audit trail
- `POST /{workItemId}/audit` - Create audit event

#### Audit Event Structure:
```json
{
  "auditsource": "string",
  "title": "string",
  "description": "string",
  "timestamp": "ISO-8601 datetime",
  "userId": "string"
}
```

### 7. Phase Management API (v1)
**Base Path**: `/api/v1/public/workItem/`

#### Endpoints:
- `GET /{workItemId}/phase` - Get current phase
- `POST /{workItemId}/phase` - Transition to new phase

### 8. Notifications API (v1)
**Base Path**: `/api/public/v1/notifications`

#### Features:
- Send notifications to users
- Manage notification preferences
- Track notification history

### 9. Work Item Types API (v2)
**Base Path**: `/api/v2/public/types/`

#### Endpoints:
- `GET /` - List all work item types
- `GET /{typeSystemName}` - Get specific type details

### 10. My Work Items API (v2)
**Base Path**: `/api/public/v2/my/workitems`

#### Endpoints:
- `GET /` - Get current user's work items
- `GET /assigned` - Get work items assigned to current user
- `GET /watching` - Get work items user is watching

## Authentication

All API calls require authentication using an auth token. Include the token in request headers:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN',
  'Content-Type': 'application/json'
}
```

## Common Patterns

### 1. Using ShareDo's AJAX Wrapper
ShareDo provides a built-in AJAX wrapper that handles authentication:

```javascript
// GET request
$ajax.api.get('/api/v1/public/workItem/' + workItemId)
  .then(function(response) {
    // Handle response
  })
  .catch(function(error) {
    // Handle error
  });

// POST request
$ajax.api.post('/api/v1/public/workItem/' + workItemId + '/attributes', {
  'attribute_name': 'value'
});
```

### 2. Fetching User Information
To get user details from a UUID:

```javascript
// Get user details
$ajax.api.get('/api/public/v2/users/' + userId)
  .then(function(user) {
    var fullName = user.firstName + ' ' + user.suname;
    var displayName = user.shortName || fullName;
  });

// Get user avatar
$ajax.api.get('/api/public/v2/users/' + userId + '/avatar')
  .then(function(avatar) {
    var imageData = 'data:' + avatar.mimeType + ';base64,' + avatar.content;
  });
```

### 3. Working with Attributes
```javascript
// Get all attributes
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
  .then(function(attributes) {
    // attributes is the object directly, not wrapped
    var adviceStatus = attributes['AdviceStatus'];
  });

// Update specific attributes (merge)
$ajax.api.post('/api/v1/public/workItem/' + workItemId + '/attributes', {
  'AdviceStatus': 'paused',
  'AdvicePausedDate': new Date().toISOString(),
  'AdvicePausedBy': userId
});

// Get single attribute
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes/AdviceStatus')
  .then(function(response) {
    var status = response.value;
  });
```

## Attribute Naming Conventions

For ongoing advice attributes (as per ATTRIBUTE_REGISTRY.md):
- `alt_ongoing_advice_enabled` - "true" or "false" string
- `alt_ongoing_advice_paused_date` - ISO date string
- `alt_ongoing_advice_paused_by` - User UUID
- `alt_ongoing_advice_pause_reason` - Text string
- `alt_ongoing_advice_resumed_date` - ISO date string
- `alt_ongoing_advice_resumed_by` - User UUID
- `alt_ongoing_advice_resume_reason` - Text string
- `alt_ongoing_advice_next_date` - ISO date string

## Error Handling

APIs return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses typically include:
```json
{
  "error": "Error message",
  "details": "Additional information"
}
```

## Rate Limiting

- API calls may be rate-limited
- Implement exponential backoff for retries
- Cache responses where appropriate

## Best Practices

1. **Always check for null/undefined responses**
2. **Use proper error handling with try-catch or .catch()**
3. **Cache user information to avoid repeated API calls**
4. **Use batch operations where available**
5. **Minimize API calls by fetching all needed data at once**
6. **Store frequently used data in local variables**
7. **Use the ShareDo AJAX wrapper for automatic auth handling**

## Example: Resolving User Names from UUIDs

```javascript
// Service to resolve and cache user names
var UserResolver = {
  cache: {},
  
  getUserName: function(userId) {
    // Check cache first
    if (this.cache[userId]) {
      return Promise.resolve(this.cache[userId]);
    }
    
    // Fetch from API
    return $ajax.api.get('/api/public/v2/users/' + userId)
      .then(function(user) {
        var displayName = user.firstName + ' ' + user.suname;
        UserResolver.cache[userId] = displayName;
        return displayName;
      })
      .catch(function(error) {
        console.error('Failed to fetch user:', error);
        return userId; // Return UUID as fallback
      });
  }
};

// Usage
UserResolver.getUserName('75ab7c74-e377-4dd5-a300-9066e5f82245')
  .then(function(name) {
    console.log('User name:', name); // "John Smith"
  });
```

## Notes

- Some APIs have typos (e.g., "suname" instead of "surname")
- API versions may vary between endpoints
- Always test in a development environment first
- Check for API updates and deprecations regularly