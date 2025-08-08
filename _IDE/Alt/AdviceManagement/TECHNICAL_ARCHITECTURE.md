# AdviceManager Technical Architecture Documentation

## Executive Summary

The AdviceManager is a sophisticated legal practice management module within the AlterspectiveIDE framework designed to handle ongoing legal advice workflows. It provides comprehensive functionality for pausing, resuming, and managing continuous legal counsel services through an integrated suite of UI components, workflow actions, and API services.

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Portal Widgets │ Management Panels │ Workflow Actions      │
│  • AdvicePaused │ • PauseResume    │ • StatusController   │
│  • SummaryCard  │   Blade          │                      │
│  • BulkManager  │                  │                      │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Data Models    │ Services         │ Event System         │
│  • OngoingAdvice│ • AdviceService  │ • EventBus          │
│    Model        │ • AttributeAPI   │ • PubSub            │
├─────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  API Integration│ Caching          │ Persistence          │
│  • REST APIs    │ • CacheManager   │ • Attribute Storage │
│  • Ajax Wrapper │ • TTL Cache      │ • Work Item State   │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. UI Components

**Portal Widgets**
- **AdvicePausedWidget**: Real-time notification widget displaying paused advice status
- **AdviceSummaryCard**: Compact status display with statistics and quick actions
- **AdviceBulkManager**: Advanced bulk operations interface for multiple advice items

**Management Panels**
- **AdvicePauseResumeBlade**: Primary management interface for individual advice items
- Interactive pause/resume controls with reason capture
- Full history tracking and audit trail display

**Workflow Actions**
- **AdviceStatusController**: Automated workflow action for conditional status management
- Supports complex rule-based automation
- Integrates with ShareDo workflow engine

#### 2. Data Layer

**Models**
- **OngoingAdviceModel**: Core data model with KnockoutJS observables
- Validation logic and computed properties
- State management for advice workflow items

**Attribute System**
- Standardized attribute naming convention: `alt_ongoing_advice_*`
- ISO 8601 date formatting
- String-based boolean values ("true"/"false")

#### 3. Service Layer

**AdviceService**
- Centralized API operations
- Automatic retry logic with exponential backoff
- Response caching with TTL
- Error handling and recovery

**AttributeApiService**
- Direct attribute management
- Bulk operations support
- Optimistic locking implementation

#### 4. Infrastructure

**Event System**
- Publish-subscribe pattern for component communication
- Real-time status updates across widgets
- Workflow event integration

**Cache Management**
- TTL-based caching strategy
- Per-work-item cache invalidation
- Memory-efficient storage

## Technical Stack

### Frontend Technologies
- **JavaScript**: ES5/ES6 with namespace pattern
- **KnockoutJS**: Two-way data binding and MVVM pattern
- **jQuery**: DOM manipulation and AJAX operations
- **HTML5/CSS3**: Responsive UI components
- **Bootstrap**: UI framework and components

### Backend Integration
- **RESTful APIs**: ShareDo platform APIs
- **JSON**: Data exchange format
- **OAuth/Token Auth**: Security layer

### Build and Development
- **Node.js**: Development environment
- **npm**: Package management
- **Jest**: Unit testing framework
- **ESBuild**: Module bundling

## Data Flow Architecture

### Status Check Flow
```
User Request → Widget → CacheManager → [Cache Hit?]
                                          ↓ No
                                    AdviceService
                                          ↓
                                      REST API
                                          ↓
                                    Backend System
                                          ↓
                                    Response Processing
                                          ↓
                                    Cache Update
                                          ↓
                                    UI Update → User
```

### Status Update Flow
```
User Action → Validation → AdviceService → API Call
                                              ↓
                                        Backend Update
                                              ↓
                                        Cache Invalidation
                                              ↓
                                        Event Broadcast
                                              ↓
                                    All Widgets Update
```

## API Architecture

### Endpoint Structure
```
/api/v1/public/
├── workItem/{id}
│   ├── GET - Retrieve work item details
│   └── attributes
│       ├── GET - Retrieve all attributes
│       └── PUT - Update attributes
└── user/{id}
    └── GET - Retrieve user details
```

### Attribute Schema

```javascript
{
  "alt_ongoing_advice_enabled": "true|false",
  "alt_ongoing_advice_paused_date": "ISO 8601 timestamp",
  "alt_ongoing_advice_paused_by": "User name",
  "alt_ongoing_advice_pause_reason": "Text reason",
  "alt_ongoing_advice_resumed_date": "ISO 8601 timestamp",
  "alt_ongoing_advice_resumed_by": "User name",
  "alt_ongoing_advice_resume_reason": "Text reason",
  "alt_ongoing_advice_next_date": "ISO 8601 timestamp"
}
```

## Security Architecture

### Authentication
- Token-based authentication via ShareDo platform
- Session management with timeout
- Secure token storage

### Authorization
- Role-based access control (RBAC)
- Work item level permissions
- Action-specific authorization checks

### Data Protection
- HTTPS encryption for all API calls
- Input validation and sanitization
- XSS protection through proper encoding
- CSRF token validation

## Performance Optimization

### Caching Strategy
- **Level 1**: Browser memory cache (5-minute TTL)
- **Level 2**: SessionStorage for session persistence
- **Level 3**: API response caching headers

### Load Optimization
- Lazy loading of widget components
- Debounced API calls
- Batch operations for bulk updates
- Progressive enhancement approach

### Memory Management
- Automatic cleanup of disposed observables
- Event listener management
- Cache size limits with LRU eviction

## Error Handling

### Client-Side Error Handling
```javascript
try {
    // API call
} catch (error) {
    // Log to console
    // Show user-friendly message
    // Attempt recovery
    // Report to monitoring
}
```

### Retry Logic
- Exponential backoff: 1s, 2s, 4s, 8s
- Maximum 3 retry attempts
- Circuit breaker pattern for repeated failures

### Error Recovery
- Graceful degradation
- Fallback to cached data
- User notification system
- Automatic error reporting

## Scalability Considerations

### Horizontal Scaling
- Stateless widget design
- Load balancer compatible
- CDN support for static assets

### Vertical Scaling
- Efficient memory usage
- Optimized DOM operations
- Minimal CPU overhead

### Performance Metrics
- Widget load time: < 500ms
- API response time: < 1s
- Cache hit ratio: > 80%
- Error rate: < 0.1%

## Integration Points

### ShareDo Platform
- Work item management system
- User authentication service
- Workflow engine integration
- Portal framework compatibility

### External Systems
- Email notification service
- Audit logging system
- Analytics tracking
- Monitoring and alerting

## Development Guidelines

### Code Organization
```
AdviceManagement/
├── common/           # Shared utilities
├── models/          # Data models
├── services/        # API services
├── widgets/         # Portal widgets
├── panels/          # Management panels
└── workflows/       # Workflow actions
```

### Naming Conventions
- **Namespaces**: `Alt.AdviceManagement.*`
- **Classes**: PascalCase
- **Methods**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Attributes**: snake_case with prefix

### Testing Strategy
- Unit tests for business logic
- Integration tests for API calls
- UI component testing with Jest
- End-to-end workflow testing

## Monitoring and Logging

### Application Logging
```javascript
self.log('level', 'message', { data });
// Levels: debug, info, warn, error
```

### Performance Monitoring
- Widget load time tracking
- API call duration metrics
- Error rate monitoring
- User interaction analytics

### Audit Trail
- All status changes logged
- User actions tracked
- Timestamp and user ID captured
- Reason text stored

## Deployment Architecture

### Environment Configuration
- Development: Local testing
- Staging: Pre-production validation
- Production: Live system

### Configuration Management
- Environment variables
- Feature flags
- A/B testing support
- Gradual rollout capability

### Version Control
- Semantic versioning
- Backward compatibility
- Migration scripts
- Rollback procedures

## Disaster Recovery

### Backup Strategy
- Attribute data backed up hourly
- Configuration backed up daily
- Full system backup weekly

### Recovery Procedures
- RTO: 4 hours
- RPO: 1 hour
- Automated failover
- Manual override capability

## Future Architecture Considerations

### Planned Enhancements
- GraphQL API migration
- Real-time WebSocket updates
- Machine learning integration
- Mobile app support

### Technical Debt
- Legacy jQuery dependencies
- KnockoutJS to modern framework migration
- API versioning improvements
- Performance optimization opportunities

## Conclusion

The AdviceManager architecture provides a robust, scalable, and maintainable solution for legal advice workflow management. Its modular design, comprehensive error handling, and performance optimization strategies ensure reliable operation in production environments while maintaining flexibility for future enhancements.