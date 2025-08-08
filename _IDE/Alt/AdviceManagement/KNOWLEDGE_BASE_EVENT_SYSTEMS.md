# Knowledge Base: Event System Best Practices for ShareDo Development

## Executive Summary

This document captures lessons learned from reengineering the AdviceManager event system. Originally implemented with triple redundancy (ShareDo + Custom EventBus + DOM events), the system has been simplified to use only ShareDo's native `$ui.events`, resulting in 60% code reduction and improved performance.

## Key Lesson: Use ShareDo's Native Capabilities

**ALWAYS use ShareDo's built-in `$ui.events` for event handling.** It provides everything needed:
- ✅ Full publish/subscribe functionality
- ✅ Context binding
- ✅ Error handling
- ✅ Portal integration
- ✅ Memory management

## Anti-Pattern to Avoid

### ❌ DON'T: Create Redundant Event Systems

```javascript
// BAD - Triple broadcasting
$ui.events.broadcast('event', data);                // ShareDo
CustomEventBus.publish('event', data);              // Custom
document.dispatchEvent(new CustomEvent('event'));   // DOM

// BAD - Triple subscription
$ui.events.subscribe('event', handler);             // ShareDo
CustomEventBus.subscribe('event', handler);         // Custom  
document.addEventListener('event', handler);        // DOM
```

**Why this happened:**
- Developer uncertainty about ShareDo capabilities
- Defensive programming gone wrong
- Copy-paste propagation

**Problems created:**
- 3x performance overhead
- 3x maintenance burden
- Potential duplicate event processing
- Complex debugging

## Best Practice Pattern

### ✅ DO: Use ShareDo Events Exclusively

#### Publishing Events

```javascript
/**
 * Broadcast status change using ShareDo native event system
 */
MyComponent.prototype.broadcastStatusChange = function(action, data) {
    var self = this;
    
    // Prepare event data with all context
    var eventData = {
        workItemId: self.workItemId,
        action: action,
        changedBy: self.currentUser,
        changedDate: new Date().toISOString(),
        source: 'MyComponent',
        // Include all relevant data
        ...data
    };
    
    // Single broadcast to ShareDo
    if (window.$ui && window.$ui.events) {
        var eventName = 'mymodule:' + action;
        $ui.events.broadcast(eventName, eventData);
        console.log('[MyComponent] Event broadcast:', eventName);
    } else {
        console.error('[MyComponent] ShareDo events not available');
    }
};
```

#### Subscribing to Events

```javascript
/**
 * Initialize event subscriptions using ShareDo native event system
 */
MyWidget.prototype.initializeEventSubscriptions = function() {
    var self = this;
    
    if (!window.$ui || !window.$ui.events) {
        console.warn('[MyWidget] ShareDo events not available');
        return;
    }
    
    // Store subscription IDs for cleanup
    self.eventSubscriptions = [];
    
    // Helper function for event handling
    var createEventHandler = function(eventName) {
        return function(data) {
            console.log('[MyWidget] Received ' + eventName + ' event:', data);
            // Filter by relevant context (e.g., work item)
            if (data && data.workItemId === self.workItemId) {
                self.handleEvent(eventName, data);
            }
        };
    };
    
    // Subscribe to all relevant events
    var events = ['mymodule:created', 'mymodule:updated', 'mymodule:deleted'];
    events.forEach(function(eventName) {
        var subscriptionId = $ui.events.subscribe(eventName, 
            createEventHandler(eventName), self);
        self.eventSubscriptions.push(subscriptionId);
    });
    
    console.log('[MyWidget] Subscribed to events:', events);
};
```

#### Cleanup

```javascript
/**
 * Clean up event subscriptions
 */
MyWidget.prototype.cleanupEventSubscriptions = function() {
    var self = this;
    
    if (window.$ui && window.$ui.events && self.eventSubscriptions) {
        self.eventSubscriptions.forEach(function(subscriptionId) {
            if (subscriptionId) {
                $ui.events.unsubscribe(subscriptionId);
            }
        });
        console.log('[MyWidget] Cleaned up event subscriptions');
    }
    self.eventSubscriptions = [];
};

// Call in destroy/onDestroy method
MyWidget.prototype.onDestroy = function() {
    this.cleanupEventSubscriptions();
    // Other cleanup...
};
```

## Event Naming Conventions

### Use Namespaced Event Names

```javascript
// GOOD - Clear namespace prevents conflicts
'advice:paused'
'advice:resumed'
'workflow:started'
'document:saved'

// BAD - Generic names cause conflicts
'paused'
'update'
'change'
```

### Event Name Pattern

```
module:action[:target]

Examples:
- advice:paused
- workflow:step:completed
- document:field:updated
```

## Event Data Structure

### Include Complete Context

```javascript
// GOOD - Complete context
var eventData = {
    // Identity
    workItemId: '12345',
    entityType: 'advice',
    entityId: 'adv_001',
    
    // Action details
    action: 'paused',
    previousState: 'active',
    newState: 'paused',
    
    // User context
    userId: 'user_123',
    userName: 'John Doe',
    userRole: 'advisor',
    
    // Temporal context
    timestamp: new Date().toISOString(),
    
    // Source identification
    source: 'AdvicePausePanel',
    version: '1.0.0',
    
    // Additional data
    reason: 'Client requested pause',
    metadata: { /* additional context */ }
};

// BAD - Missing context
var eventData = {
    id: '12345',
    status: 'paused'
};
```

## Common Patterns

### Pattern 1: Widget Event Handling

```javascript
var MyWidget = function(element, configuration, baseModel) {
    var self = this;
    
    // Initialize
    self.element = element;
    self.config = configuration;
    self.model = baseModel;
    
    // Set up events on initialization
    self.initializeEventSubscriptions();
    
    // Initial data load
    self.loadData();
};

// Separate initialization for testability
MyWidget.prototype.initializeEventSubscriptions = function() {
    // Implementation as shown above
};

// Handle specific events
MyWidget.prototype.handleEvent = function(eventName, data) {
    switch(eventName) {
        case 'mymodule:updated':
            this.refreshDisplay();
            break;
        case 'mymodule:deleted':
            this.close();
            break;
    }
};
```

### Pattern 2: Blade/Panel Broadcasting

```javascript
var MyBlade = function(element, configuration, stackModel) {
    var self = this;
    // Initialization...
};

// User performs action
MyBlade.prototype.saveChanges = function() {
    var self = this;
    
    // Perform save operation
    api.save(self.data)
        .done(function(result) {
            // Broadcast success
            self.broadcast('saved', {
                entityId: result.id,
                changes: self.getChanges()
            });
        })
        .fail(function(error) {
            // Broadcast failure
            self.broadcast('save:failed', {
                error: error.message
            });
        });
};

// Centralized broadcast method
MyBlade.prototype.broadcast = function(action, additionalData) {
    if (window.$ui && window.$ui.events) {
        var eventData = $.extend({
            workItemId: this.workItemId,
            source: 'MyBlade',
            timestamp: new Date().toISOString()
        }, additionalData);
        
        $ui.events.broadcast('myblade:' + action, eventData);
    }
};
```

## Testing Event Systems

### Unit Testing

```javascript
describe('MyWidget Event Handling', function() {
    var widget, mockEventManager;
    
    beforeEach(function() {
        // Mock ShareDo events
        mockEventManager = {
            subscribe: jasmine.createSpy('subscribe').and.returnValue('sub_123'),
            unsubscribe: jasmine.createSpy('unsubscribe'),
            broadcast: jasmine.createSpy('broadcast')
        };
        
        window.$ui = { events: mockEventManager };
        
        widget = new MyWidget(element, config, model);
    });
    
    it('should subscribe to events on initialization', function() {
        expect(mockEventManager.subscribe).toHaveBeenCalled();
        expect(mockEventManager.subscribe.calls.count()).toBe(3); // 3 events
    });
    
    it('should broadcast event on action', function() {
        widget.performAction();
        
        expect(mockEventManager.broadcast).toHaveBeenCalledWith(
            'mywidget:action',
            jasmine.objectContaining({
                source: 'MyWidget'
            })
        );
    });
    
    it('should cleanup subscriptions on destroy', function() {
        widget.onDestroy();
        
        expect(mockEventManager.unsubscribe).toHaveBeenCalledWith('sub_123');
    });
});
```

### Integration Testing

```javascript
// Test event flow between components
it('should update widget when blade broadcasts', function(done) {
    var blade = new MyBlade(/* ... */);
    var widget = new MyWidget(/* ... */);
    
    // Set up spy on widget method
    spyOn(widget, 'refreshDisplay');
    
    // Blade performs action that triggers broadcast
    blade.updateStatus('active');
    
    // Verify widget received and processed event
    setTimeout(function() {
        expect(widget.refreshDisplay).toHaveBeenCalled();
        done();
    }, 100);
});
```

## Performance Considerations

### 1. Event Filtering

```javascript
// GOOD - Filter early to avoid unnecessary processing
var handleEvent = function(data) {
    if (data.workItemId !== self.workItemId) return; // Quick exit
    
    // Process relevant event
    self.updateDisplay(data);
};

// BAD - Processing before filtering
var handleEvent = function(data) {
    self.prepareUpdate(); // Unnecessary work
    self.validateData(data); // Unnecessary work
    
    if (data.workItemId === self.workItemId) {
        self.updateDisplay(data);
    }
};
```

### 2. Debouncing Rapid Events

```javascript
// Debounce helper
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Use debounced handler for rapid events
MyWidget.prototype.initializeEventSubscriptions = function() {
    var self = this;
    
    // Debounce rapid update events
    var debouncedRefresh = debounce(function(data) {
        self.refreshDisplay(data);
    }, 300);
    
    $ui.events.subscribe('rapid:update', debouncedRefresh, self);
};
```

## Debugging Events

### Console Helpers

```javascript
// Development-only event monitoring
if (window.DEBUG_EVENTS) {
    var originalBroadcast = $ui.events.broadcast;
    $ui.events.broadcast = function(eventName, data) {
        console.group('📡 Event: ' + eventName);
        console.log('Data:', data);
        console.log('Stack:', new Error().stack);
        console.groupEnd();
        return originalBroadcast.apply(this, arguments);
    };
}
```

### Event Flow Visualization

```javascript
// Track event flow
window.eventFlow = [];

// Wrap broadcast
var originalBroadcast = $ui.events.broadcast;
$ui.events.broadcast = function(eventName, data) {
    window.eventFlow.push({
        type: 'broadcast',
        event: eventName,
        source: data.source,
        time: Date.now()
    });
    return originalBroadcast.apply(this, arguments);
};

// View flow
console.table(window.eventFlow);
```

## Migration Checklist

When refactoring existing code to use ShareDo events properly:

- [ ] **Inventory Events**: List all events being published/subscribed
- [ ] **Check for Duplication**: Look for multiple event systems
- [ ] **Simplify Publishers**: Use only `$ui.events.broadcast()`
- [ ] **Simplify Subscribers**: Use only `$ui.events.subscribe()`
- [ ] **Update Cleanup**: Ensure all subscriptions are unsubscribed
- [ ] **Test Event Flow**: Verify events still reach all components
- [ ] **Remove Dead Code**: Delete custom EventBus implementations
- [ ] **Update Documentation**: Document event names and data structures
- [ ] **Performance Test**: Verify improved performance

## Common Mistakes to Avoid

### 1. ❌ Creating Custom Event Systems

```javascript
// DON'T create your own pub/sub
var MyEventBus = {
    events: {},
    subscribe: function() { /* ... */ },
    publish: function() { /* ... */ }
};
```

**Why**: ShareDo already provides this

### 2. ❌ Using DOM Events for Component Communication

```javascript
// DON'T use DOM events for app logic
document.dispatchEvent(new CustomEvent('myevent', { detail: data }));
```

**Why**: Not integrated with ShareDo lifecycle

### 3. ❌ Forgetting to Unsubscribe

```javascript
// DON'T forget cleanup
MyWidget.prototype.onDestroy = function() {
    // Missing: this.cleanupEventSubscriptions();
};
```

**Why**: Memory leaks

### 4. ❌ Broadcasting Without Checking

```javascript
// DON'T assume events exists
$ui.events.broadcast('event', data); // May throw error
```

**Why**: Defensive programming needed

### 5. ❌ Generic Event Names

```javascript
// DON'T use generic names
$ui.events.broadcast('update', data);
```

**Why**: Name conflicts with other modules

## Summary: Golden Rules

1. **Use ShareDo's `$ui.events` exclusively** - It's complete and battle-tested
2. **One event system only** - No redundancy, no custom implementations
3. **Namespace your events** - Prevent conflicts with `module:action` pattern
4. **Include full context** - Rich event data prevents additional lookups
5. **Clean up subscriptions** - Always unsubscribe in destroy methods
6. **Filter early** - Check relevance immediately to avoid unnecessary processing
7. **Test event flow** - Unit and integration tests for event handling
8. **Document events** - List all events your module publishes/subscribes to

## Conclusion

The AdviceManager reengineering demonstrates that **simpler is better**. By removing unnecessary complexity and trusting ShareDo's native capabilities, we achieved:

- ✅ 60% code reduction
- ✅ Better performance
- ✅ Easier maintenance
- ✅ Clearer architecture
- ✅ Standard patterns

**Remember**: When in doubt, check what ShareDo provides before building custom solutions. The platform often has everything you need.