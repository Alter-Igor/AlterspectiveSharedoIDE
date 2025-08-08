# EventBus System Explanation

## Table of Contents
1. [Overview](#overview)
2. [Core Concept](#core-concept)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [How It Works](#how-it-works)
6. [Usage Examples](#usage-examples)
7. [Event Flow Diagrams](#event-flow-diagrams)
8. [Benefits](#benefits)
9. [Best Practices](#best-practices)

## Overview

The EventBus is a **publish-subscribe (pub/sub) messaging pattern** implementation that enables **decoupled communication** between different components in the AdviceManager system. Think of it as a central post office where components can send messages (publish) and receive messages (subscribe) without knowing about each other directly.

## Core Concept

### Traditional Direct Communication (Tightly Coupled)
```
ComponentA → ComponentB
ComponentA → ComponentC  
ComponentA → ComponentD
```
**Problem**: ComponentA needs to know about B, C, and D. If we add ComponentE, we must modify ComponentA.

### EventBus Pattern (Loosely Coupled)
```
ComponentA → EventBus → ComponentB
                     → ComponentC
                     → ComponentD
                     → ComponentE (easily added)
```
**Solution**: Components only know about the EventBus, not each other.

## Architecture

### Three Main Components

1. **EventBus (The Message Broker)**
   - Central hub for all events
   - Maintains subscriber registry
   - Routes messages to subscribers

2. **Publishers (Event Emitters)**
   - Components that trigger events
   - Example: AdvicePauseResumeBlade when status changes

3. **Subscribers (Event Listeners)**
   - Components that react to events
   - Example: AdvicePausedWidget updating its display

### Data Structure
```javascript
// Internal structure of the EventBus
events = {
    'advice:paused': [
        { callback: function1, context: widget1, id: 'sub_001' },
        { callback: function2, context: widget2, id: 'sub_002' }
    ],
    'advice:resumed': [
        { callback: function3, context: widget3, id: 'sub_003' }
    ]
}
```

## Implementation Details

### The AdviceManager EventBus (`Common/EventBus.js`)

```javascript
Alt.AdviceManagement.Common.EventBus = (function() {
    // Private storage for all event subscriptions
    var events = {};
    
    // History tracking for debugging
    var eventHistory = [];
    
    // Core functions
    return {
        subscribe: subscribe,  // Register interest in an event
        publish: publish,      // Trigger an event
        unsubscribe: unsubscribe  // Remove subscription
    };
})();
```

## How It Works

### Step 1: Subscription (Setting up a Listener)

When a widget wants to be notified about status changes:

```javascript
// Widget says: "Tell me when advice is paused"
var subscription = EventBus.subscribe('advice:paused', function(data) {
    console.log('Advice was paused!', data);
    updateMyDisplay(data);
});
```

**What happens internally:**
1. EventBus checks if 'advice:paused' event list exists
2. If not, creates new array for this event
3. Adds the callback function to the array
4. Returns subscription object with unsubscribe method

### Step 2: Publishing (Triggering an Event)

When the blade pauses advice:

```javascript
// Blade says: "Advice has been paused, tell everyone!"
EventBus.publish('advice:paused', {
    workItemId: '12345',
    pausedBy: 'John Doe',
    reason: 'Client requested pause'
});
```

**What happens internally:**
1. EventBus looks up all subscribers for 'advice:paused'
2. Calls each subscriber's callback function
3. Passes the data to each callback
4. Records event in history
5. Handles any errors without breaking other callbacks

### Step 3: Message Delivery

Each subscriber receives the message:

```javascript
// Each subscribed widget receives:
function(data) {
    // data = { workItemId: '12345', pausedBy: 'John Doe', ... }
    if (data.workItemId === myWorkItemId) {
        updateMyDisplay();
    }
}
```

### Step 4: Cleanup (Unsubscribing)

When widget is destroyed:

```javascript
// Widget says: "I'm leaving, stop sending me messages"
subscription.unsubscribe();
```

**What happens internally:**
1. EventBus finds the subscription by ID
2. Removes it from the event's subscriber list
3. Cleans up empty event arrays

## Event Flow Diagrams

### Simple Event Flow
```
1. User clicks "Pause" in AdvicePauseResumeBlade
                    ↓
2. Blade validates and updates database
                    ↓
3. Blade publishes 'advice:paused' event
                    ↓
4. EventBus receives event
                    ↓
5. EventBus notifies all subscribers
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Widget1 updates  Widget2 shows  Widget3 logs
its display      notification   the change
```

### Multiple EventBus Systems

The AdviceManager uses THREE parallel EventBus systems:

```
                 Status Change
                      ↓
           AdvicePauseResumeBlade
                      ↓
    ┌─────────────────┼─────────────────┐
    ↓                 ↓                 ↓
ShareDo          Common            DOM
EventManager     EventBus          Events
($ui)            (Internal)        (Browser)
    ↓                 ↓                 ↓
Portal           Internal          Any DOM
Widgets          Components        Listener
```

## Usage Examples

### Example 1: Basic Subscribe and Publish

```javascript
// SUBSCRIBER (Widget)
// ==================
var MyWidget = function() {
    var self = this;
    
    // Subscribe to pause events
    self.pauseSubscription = EventBus.subscribe('advice:paused', 
        function(data) {
            console.log('Received pause event:', data);
            self.showPauseNotification(data.reason);
        }
    );
    
    // Subscribe to resume events  
    self.resumeSubscription = EventBus.subscribe('advice:resumed',
        function(data) {
            console.log('Received resume event:', data);
            self.hidePauseNotification();
        }
    );
};

// PUBLISHER (Blade)
// =================
var MyBlade = function() {
    var self = this;
    
    self.pauseAdvice = function() {
        // Do the pause operation...
        
        // Tell everyone about it
        EventBus.publish('advice:paused', {
            workItemId: '12345',
            reason: 'Client request',
            pausedBy: 'Current User',
            timestamp: new Date().toISOString()
        });
    };
};
```

### Example 2: One-Time Subscription

```javascript
// Listen for event only once
EventBus.once('advice:saved', function(data) {
    console.log('Advice saved, closing dialog');
    closeDialog();
});
```

### Example 3: Filtered Subscription

```javascript
// Only react to events for specific work item
EventBus.subscribe('advice:statusChanged', function(data) {
    // Filter by work item ID
    if (data.workItemId !== self.currentWorkItemId) {
        return; // Ignore events for other items
    }
    
    // Process relevant event
    self.updateStatus(data.status);
});
```

### Example 4: Error Handling

```javascript
// EventBus handles errors gracefully
EventBus.subscribe('advice:paused', function(data) {
    // Even if this throws an error...
    throw new Error('Something went wrong!');
    // Other subscribers still get notified
});

EventBus.subscribe('advice:paused', function(data) {
    // This still executes despite error above
    console.log('Second subscriber works fine');
});
```

## Real-World Implementation in AdviceManager

### Publishing Events (AdvicePauseResumeBlade)

```javascript
// When status changes, broadcast to all systems
self.broadcastStatusChange = function(action, options, result) {
    var eventData = {
        workItemId: self.workItemId,
        status: action === 'paused' ? 'paused' : 'active',
        action: action,
        changedBy: options.userName,
        reason: options.reason
    };
    
    // 1. ShareDo EventManager (Portal widgets)
    if ($ui && $ui.eventManager) {
        $ui.eventManager.broadcast('advice:paused', eventData);
    }
    
    // 2. Common EventBus (Internal components)
    if (Alt.AdviceManagement.Common.EventBus) {
        EventBus.publish('advice:paused', eventData);
    }
    
    // 3. DOM Events (Browser-native)
    document.dispatchEvent(new CustomEvent('advice:paused', {
        detail: eventData
    }));
};
```

### Subscribing to Events (AdvicePausedWidget)

```javascript
// Widget subscribes to multiple event systems
var AdvicePausedWidget = function() {
    var self = this;
    
    // 1. ShareDo EventManager
    $ui.eventManager.subscribe('advice:paused', function(data) {
        if (data.workItemId === self.workItemId) {
            self.showNotification();
        }
    });
    
    // 2. Common EventBus
    EventBus.subscribe('advice:paused', function(data) {
        if (data.workItemId === self.workItemId) {
            self.showNotification();
        }
    });
    
    // 3. DOM Events
    document.addEventListener('advice:paused', function(event) {
        if (event.detail.workItemId === self.workItemId) {
            self.showNotification();
        }
    });
};
```

## Benefits

### 1. **Loose Coupling**
- Components don't need direct references to each other
- Easy to add/remove components without breaking others

### 2. **Scalability**
- Add new subscribers without modifying publishers
- Remove components cleanly

### 3. **Flexibility**
- Multiple components can react to same event
- Components can subscribe to multiple events

### 4. **Maintainability**
- Clear separation of concerns
- Easier to debug event flow
- Centralized event management

### 5. **Testability**
- Can test components in isolation
- Mock events easily
- Verify event publishing/handling

## Advanced Features

### Event History
```javascript
// View recent events for debugging
var history = EventBus.getHistory();
console.log('Recent events:', history);

// Filter history by event name
var pauseHistory = EventBus.getHistory('advice:paused');
```

### Debug Mode
```javascript
// Enable verbose logging
EventBus.setDebugMode(true);
// Now all pub/sub activity is logged

// Get debug information
var info = EventBus.getDebugInfo();
console.log('Active subscriptions:', info);
```

### Subscriber Count
```javascript
// Check how many listeners for an event
var count = EventBus.getSubscriberCount('advice:paused');
console.log('Pause event has', count, 'subscribers');
```

## Best Practices

### 1. **Always Unsubscribe**
```javascript
// Good - Clean up subscriptions
MyWidget.prototype.destroy = function() {
    this.subscription.unsubscribe();
};
```

### 2. **Use Namespaced Events**
```javascript
// Good - Clear namespace
'advice:paused'
'advice:resumed'
'workflow:started'

// Bad - Ambiguous
'paused'
'update'
```

### 3. **Include Relevant Data**
```javascript
// Good - Complete context
EventBus.publish('advice:paused', {
    workItemId: id,
    reason: reason,
    timestamp: timestamp,
    user: user
});

// Bad - Missing context
EventBus.publish('advice:paused', { id: id });
```

### 4. **Filter Early**
```javascript
// Good - Filter immediately
EventBus.subscribe('advice:paused', function(data) {
    if (data.workItemId !== myId) return;
    // Process...
});
```

### 5. **Handle Errors Gracefully**
```javascript
// Good - Wrap in try-catch
EventBus.subscribe('advice:paused', function(data) {
    try {
        updateDisplay(data);
    } catch (error) {
        console.error('Failed to update:', error);
    }
});
```

## Common Patterns

### Pattern 1: Request-Response
```javascript
// Component requests data
EventBus.publish('data:request', { type: 'adviceStatus' });

// Provider responds
EventBus.subscribe('data:request', function(request) {
    if (request.type === 'adviceStatus') {
        EventBus.publish('data:response', {
            type: 'adviceStatus',
            data: getStatus()
        });
    }
});
```

### Pattern 2: State Synchronization
```javascript
// Multiple widgets stay in sync
var state = { status: 'active' };

EventBus.subscribe('state:changed', function(newState) {
    state = newState;
    render();
});

// Any component can update state
EventBus.publish('state:changed', { status: 'paused' });
```

### Pattern 3: Command Pattern
```javascript
// Execute commands via events
EventBus.subscribe('command:execute', function(cmd) {
    switch(cmd.type) {
        case 'pause':
            pauseAdvice(cmd.params);
            break;
        case 'resume':
            resumeAdvice(cmd.params);
            break;
    }
});

// Trigger commands
EventBus.publish('command:execute', {
    type: 'pause',
    params: { reason: 'User request' }
});
```

## Troubleshooting

### Problem: Events Not Received
```javascript
// Debug checklist:
1. Check event name spelling
2. Verify subscription before publish
3. Check work item ID filtering
4. Enable debug mode
5. Check EventBus initialization
```

### Problem: Memory Leaks
```javascript
// Ensure cleanup:
1. Always unsubscribe in destroy/cleanup
2. Use 'once' for single-use handlers
3. Clear references to callbacks
```

### Problem: Event Storms
```javascript
// Prevent infinite loops:
1. Don't publish same event from subscriber
2. Use flags to prevent re-entry
3. Implement debouncing if needed
```

## Summary

The EventBus is the nervous system of the AdviceManager, enabling components to communicate without tight coupling. It's like a chat room where components can announce changes (publish) and listen for announcements (subscribe) without needing to know who else is in the room. This architecture makes the system flexible, maintainable, and scalable.

**Key Takeaways:**
- **Publish** = Announce something happened
- **Subscribe** = Listen for announcements
- **Unsubscribe** = Stop listening
- **EventBus** = The messenger that connects everything

The multi-system approach (ShareDo, Common, DOM) ensures maximum compatibility and reliability across different components and contexts.