# ShareDo API Registry and Usage Tracking

> This document tracks all API usage in the AlterspectiveIDE project, distinguishing between public and private APIs.

## 📋 API Categories

### Public APIs (Safe to Use)
These are documented ShareDo APIs that are officially supported and safe to use in IDE widgets and components.

| API | Base Path | Purpose | Documentation |
|-----|-----------|---------|---------------|
| **Work Item Attributes** | `/api/v1/public/workItem/{id}/attributes` | Store key-value data against work items | [Swagger](./docs/apis/attributes-api.md) |
| **Work Item Comments** | `/api/v1/public/workItem/{id}/comments` | Manage comments on work items | [Swagger](./docs/apis/comments-api.md) |
| **Work Item Chronology** | `/api/v1/public/workItem/{id}/chronology` | Track timeline and events | [Swagger](./docs/apis/chronology-api.md) |
| **Work Item Phase** | `/api/v2/public/workItem/{id}/phase` | Manage workflow states | [Swagger](./docs/apis/phase-api.md) |
| **Work Item CRUD** | `/api/v1/public/workItem` | Create, read, update work items | [Swagger](./docs/apis/workitem-api.md) |
| **Work Item Search** | `/api/v1/public/workItem/search` | Query work items | [Swagger](./docs/apis/search-api.md) |
| **Bookmarks** | `/api/v1/public/workItem/{id}/bookmarks` | User bookmarks | [Swagger](./docs/apis/bookmarks-api.md) |
| **Notifications** | `/api/v1/public/notifications` | Send notifications | [Swagger](./docs/apis/notifications-api.md) |
| **Smart Variables** | `/api/v1/public/workItem/{id}/smartVariables` | Computed attributes | [Swagger](./docs/apis/smartvariables-api.md) |
| **Work Item Types** | `/api/v1/public/workItemTypes` | Type definitions | [Swagger](./docs/apis/types-api.md) |
| **Users** | `/api/v1/public/users` | User profiles | [Swagger](./docs/apis/users-api.md) |

### Private/Internal APIs (Use with Caution)
These are undocumented or internal APIs that should be used sparingly and tracked carefully.

| API | Endpoint | Widget/Component | Reason for Use | Risk Level | Added Date |
|-----|----------|------------------|----------------|------------|------------|
| Example: | `/api/internal/...` | WidgetName | Needed because... | High/Medium/Low | YYYY-MM-DD |

## 🔒 Authentication

All APIs require authentication via bearer token:

```javascript
$.ajax({
    url: '/api/v1/public/workItem/123/attributes',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'X-Requested-With': 'XMLHttpRequest'
    }
});
```

## 📝 Usage Guidelines

### When to Use Public APIs
- ✅ Always prefer public APIs when available
- ✅ Check the swagger documentation first
- ✅ Use standard authentication patterns
- ✅ Handle errors gracefully

### When Private APIs Might Be Needed
- ⚠️ Required functionality not available in public API
- ⚠️ Performance optimization requirements
- ⚠️ Legacy system integration
- ⚠️ Custom ShareDo extensions

### Private API Usage Process
1. **Justify**: Document why public API won't work
2. **Review**: Get team review of the requirement
3. **Document**: Add to registry with full details
4. **Monitor**: Track for deprecation or changes
5. **Migrate**: Plan to move to public API when available

## 🚨 Risk Assessment

### Risk Levels
- **High**: Undocumented internal APIs that may change without notice
- **Medium**: Semi-documented APIs used outside intended scope
- **Low**: Public APIs used in edge cases or unusual patterns

### Mitigation Strategies
1. **Abstraction Layer**: Wrap private APIs in service classes
2. **Version Checking**: Detect ShareDo version and adapt
3. **Fallback Logic**: Provide alternatives when API fails
4. **Error Handling**: Graceful degradation
5. **Testing**: Comprehensive test coverage for private API usage

## 📊 API Usage by Widget/Component

### Widget: [WidgetName]
- **Public APIs Used**: 
  - Attributes API (GET, POST)
  - Comments API (GET)
- **Private APIs Used**: None
- **Notes**: Standard usage patterns

## 🔄 Migration Plan

Track private APIs that need migration to public alternatives:

| Current Private API | Target Public API | Migration Status | Target Date |
|-------------------|------------------|------------------|-------------|
| Example | Example | Not Started/In Progress/Complete | YYYY-MM-DD |

## 📈 Monitoring

### Health Checks
- Regular validation of private API availability
- Version compatibility checks
- Performance monitoring
- Error rate tracking

### Alerts
Set up alerts for:
- Private API failures
- Deprecated API usage
- Authentication failures
- Rate limiting

## 🛠️ Helper Functions

### API Wrapper Service
```javascript
// common/services/api-service.js
class ShareDoAPIService {
    constructor() {
        this.baseUrl = 'https://demo-aus.sharedo.tech';
        this.token = this.getAuthToken();
    }
    
    // Public API wrapper
    async getWorkItemAttributes(workItemId) {
        return this.callAPI('GET', `/api/v1/public/workItem/${workItemId}/attributes`);
    }
    
    // Private API wrapper with tracking
    async callPrivateAPI(endpoint, method, data, reason) {
        console.warn(`Private API Call: ${endpoint}`, { reason, widget: this.widgetName });
        // Log to monitoring service
        this.logPrivateAPIUsage(endpoint, reason);
        return this.callAPI(method, endpoint, data);
    }
    
    async callAPI(method, endpoint, data) {
        const response = await $.ajax({
            url: `${this.baseUrl}${endpoint}`,
            method: method,
            data: data ? JSON.stringify(data) : undefined,
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return response;
    }
    
    logPrivateAPIUsage(endpoint, reason) {
        // Send to monitoring/logging service
        // Store in local registry
    }
}
```

## 📚 Resources

- [ShareDo Developer Guide](https://sharedo.tech/developer)
- [API Authentication](./docs/authentication.md)
- [Swagger Documentation](./docs/apis/)
- [Migration Guides](./docs/migration/)

## ⚡ Quick Reference

### Common API Patterns

#### Get Work Item Data
```javascript
// Attributes
GET /api/v1/public/workItem/{id}/attributes

// Comments
GET /api/v1/public/workItem/{id}/comments?rowsPerPage=20

// Phase/Status
GET /api/v2/public/workItem/{id}/phase
```

#### Update Work Item
```javascript
// Update attributes
POST /api/v1/public/workItem/{id}/attributes
Body: { "key1": "value1", "key2": "value2" }

// Add comment
POST /api/v1/public/workItem/{id}/comments
Body: { "body": "Comment text" }

// Change phase
POST /api/v2/public/workItem/{id}/phase
Body: { "phaseKey": "newPhase", "data": {} }
```

#### Search Work Items
```javascript
POST /api/v1/public/workItem/search
Body: {
    "query": "search terms",
    "filters": {
        "type": "matter",
        "status": "active"
    },
    "pagination": {
        "page": 1,
        "pageSize": 20
    }
}
```

---

**Last Updated**: 2024-01-08
**Maintained By**: Development Team
**Review Schedule**: Monthly