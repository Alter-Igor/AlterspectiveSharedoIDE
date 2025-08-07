# ShareDo API Best Practices

## Key Learning: Use `$ajax` Instead of `$.ajax`

ShareDo provides a custom `$ajax` object that **MUST** be used instead of jQuery's `$.ajax` for all API calls. This is critical for proper authentication and error handling.

## Why Use `$ajax`?

### Automatic Features
1. **Authentication**: Automatically adds bearer token from cookies
2. **Token Refresh**: Handles 401 errors and refreshes tokens
3. **Error Handling**: Provides consistent error dialogs
4. **Toast Messages**: Processes server toast notifications
5. **Path Resolution**: No need to specify full API paths
6. **Session Management**: Handles automatic sign-out

## `$ajax` Methods

### Basic Methods
```javascript
// GET request
$ajax.get(url, data, successCallback, errorCallback)

// POST request  
$ajax.post(url, data, successCallback, errorCallback)

// PUT request
$ajax.put(url, data, successCallback, errorCallback)

// DELETE request
$ajax.delete(url, data, successCallback, errorCallback)
```

### API Methods (Recommended)
These return promises and have better error handling:

```javascript
// GET with promise
$ajax.api.get(url, config)
    .then(function(data) { })
    .catch(function(error) { });

// POST with promise
$ajax.api.post(url, body, config)
    .then(function(data) { })
    .catch(function(error) { });

// PUT with promise
$ajax.api.put(url, body, config)

// DELETE with promise
$ajax.api.delete(url, body, config)
```

### Special Methods
```javascript
// Cached GET (for static resources)
$ajax.cachedGet(url, data, success, error)

// HTML content
$ajax.html(url, data, success, error)

// Passive GET (doesn't extend session)
$ajax.getPassive(url, data, success, error)
```

## Configuration Options

```javascript
$ajax.api.post(url, data, {
    // Display errors automatically (default: true)
    displayErrors: true,
    
    // Content type (default: application/json)
    contentType: "application/json; charset=utf-8",
    
    // Response must be JSON (default: false)
    mustBeJson: false,
    
    // Custom XHR function
    xhr: function() { }
});
```

## Getting Current User

### Use $ui.pageContext.user (No API Call Needed!)

ShareDo provides the current user information in the page context as KnockoutJS observables:

```javascript
// Access current user without API call
var user = $ui.pageContext.user;

// Available properties (all are KO observables)
var userId = user.userid();           // User ID
var username = user.username();       // Username
var firstName = user.firstname();     // First name
var lastName = user.lastname();       // Last name
var presence = user.presence();       // User presence status

// Example usage in blade
var currentUser = {
    id: user.userid(),
    name: user.firstname() + ' ' + user.lastname(),
    username: user.username()
};
```

### Why Not Use API?

- **Performance**: No network request needed
- **Instant**: Data is already available
- **Reliable**: Always current user, no auth issues
- **Observable**: Can subscribe to changes

## Examples

### Work Item Attributes
```javascript
// Get all attributes
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
    .then(function(attributes) {
        console.log('Attributes:', attributes);
    })
    .catch(function(error) {
        console.error('Failed to load attributes:', error);
    });

// Set single attribute (note: value sent as plain text)
$ajax.api.post(
    '/api/v1/public/workItem/' + workItemId + '/attributes/my_attribute',
    'my_value',
    { contentType: 'text/plain; charset=utf-8' }
);
```

### Work Item Comments
```javascript
// Get comments
$ajax.api.get('/api/v1/public/workItem/' + workItemId + '/comments')
    .then(function(response) {
        console.log('Comments:', response.comments);
    });

// Add comment
$ajax.api.post('/api/v1/public/workItem/' + workItemId + '/comments', {
    body: 'This is my comment'
});
```

### Current User
```javascript
// Get current user
$ajax.api.get('/api/users/current')
    .then(function(user) {
        console.log('Current user:', user);
    });
```

## Error Handling

### Automatic Error Dialogs
By default, `$ajax` shows error dialogs automatically:

```javascript
$ajax.api.get('/api/invalid/endpoint')
    // No catch needed - error dialog shown automatically
```

### Custom Error Handling
To handle errors yourself:

```javascript
$ajax.api.get('/api/endpoint', { displayErrors: false })
    .then(function(data) {
        // Success
    })
    .catch(function(error) {
        // Custom error handling
        console.error('Error:', error);
    });
```

## Toast Messages

Server can send toast messages via `X-Toast-Messages-JSON` header:

```javascript
// Server response includes toast
// $ajax automatically displays it as a toast notification
$ajax.api.post('/api/action/save', data)
    .then(function() {
        // Toast appears automatically
    });
```

## Token Management

### Automatic Token Refresh
```javascript
// If token expires, $ajax automatically:
// 1. Intercepts 401 error
// 2. Requests new token via /security/refreshTokens
// 3. Retries original request
// 4. All transparent to your code!
```

### Session Timeout
```javascript
// $ajax monitors session timeout via cookies
// Shows warning dialog before auto-signout
// Redirects to /security/signOut when expired
```

## Common Pitfalls to Avoid

### ❌ DON'T: Use jQuery $.ajax
```javascript
// WRONG - No authentication!
$.ajax({
    url: '/api/v1/public/workItem/123',
    type: 'GET'
});
```

### ✅ DO: Use ShareDo $ajax
```javascript
// CORRECT - Handles auth automatically
$ajax.api.get('/api/v1/public/workItem/123');
```

### ❌ DON'T: Manually add auth headers
```javascript
// WRONG - Unnecessary and error-prone
$.ajax({
    headers: { 
        'Authorization': 'Bearer ' + token 
    }
});
```

### ✅ DO: Let $ajax handle auth
```javascript
// CORRECT - Auth handled automatically
$ajax.api.get('/api/endpoint');
```

### ❌ DON'T: Build full URLs
```javascript
// WRONG - Hardcoded base URL
$ajax.get('https://demo.sharedo.tech/api/endpoint');
```

### ✅ DO: Use relative paths
```javascript
// CORRECT - Base URL handled by $ajax
$ajax.get('/api/endpoint');
```

## Performance Tips

### Use Cached Requests for Static Data
```javascript
// Config files, templates, etc.
$ajax.cachedGet('/_ideFiles/config.json')
    .then(function(config) {
        // Cached for subsequent requests
    });
```

### Use Passive Requests for Polling
```javascript
// Doesn't extend session timeout
$ajax.getPassive('/api/notifications/check')
    .then(function(notifications) {
        // Won't keep session alive indefinitely
    });
```

### Batch Requests When Possible
```javascript
// Use Promise.all for parallel requests
Promise.all([
    $ajax.api.get('/api/endpoint1'),
    $ajax.api.get('/api/endpoint2'),
    $ajax.api.get('/api/endpoint3')
]).then(function(results) {
    // All complete
});
```

## Debugging

### Enable Debug Logging
```javascript
// Check console for detailed logs
// $ajax logs token requests, timings, etc.
```

### View Request Timings
```javascript
// In browser console:
$ajaxClientTimer.dumpLog();      // Show all requests
$ajaxClientTimer.dumpSlowest(100); // Show requests > 100ms
```

## Summary

**Always use `$ajax` for ShareDo API calls:**
- ✅ Automatic authentication
- ✅ Token refresh handling
- ✅ Consistent error handling
- ✅ Toast message support
- ✅ Session management
- ✅ Better debugging

This is a **critical requirement** for ShareDo components!