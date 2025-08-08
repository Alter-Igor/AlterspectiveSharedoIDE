# AdviceManager Event System Testing Guide

## Overview

The AdviceManager now implements a comprehensive event broadcasting system that ensures all widgets and components react to status changes in real-time. This document provides testing procedures to verify the event system is working correctly.

## Event Broadcasting Architecture

### Multiple Event Systems
The AdvicePauseResumeBlade now broadcasts to multiple event systems to ensure maximum compatibility:

1. **ShareDo EventManager** (`$ui.eventManager`)
   - Primary system for portal widgets
   - Events: `advice:paused`, `advice:resumed`, `advice:statusChanged`, `advice:statusLoaded`

2. **Common EventBus** (`Alt.AdviceManagement.Common.EventBus`)
   - Internal component communication
   - Events: `ADVICE_PAUSED`, `ADVICE_RESUMED`, `ADVICE_STATUS_CHANGED`

3. **Global AdviceEventBus** (`window.AdviceEventBus`)
   - Global fallback system
   - Same events as ShareDo EventManager

4. **DOM Custom Events**
   - Browser-native event system
   - Bubbling events for maximum reach

## Implementation Changes

### AdvicePauseResumeBlade Changes

1. **New Method: `broadcastStatusChange()`**
   - Centralized event broadcasting
   - Sends to all event systems
   - Includes comprehensive event data
   - Error handling for each system

2. **Event Data Structure**
```javascript
{
    workItemId: string,
    workItemReference: string,
    workItemTitle: string,
    workTypeSystemName: string,
    participantId: string,
    participantRoleId: string,
    status: 'paused' | 'active',
    action: 'paused' | 'resumed' | 'statusLoaded',
    changedBy: string,
    changedDate: ISO timestamp,
    reason: string,
    source: 'AdvicePauseResumeBlade',
    // Conditional fields:
    pausedDate: ISO timestamp (when pausing),
    pausedBy: string (when pausing),
    pauseReason: string (when pausing),
    resumedDate: ISO timestamp (when resuming),
    resumedBy: string (when resuming),
    resumeReason: string (when resuming),
    nextAdviceDate: ISO timestamp (when resuming),
    updates: object (if available)
}
```

3. **Broadcasting on Load**
   - Now broadcasts `advice:statusLoaded` when blade loads
   - Allows widgets to sync with current status

### AdvicePausedWidget Changes

1. **Multi-System Subscription**
   - Subscribes to ShareDo EventManager
   - Subscribes to Common EventBus
   - Listens to DOM custom events
   - Handles `advice:statusLoaded` event

2. **Enhanced Cleanup**
   - Unsubscribes from all event systems
   - Removes DOM event listeners
   - Prevents memory leaks

## Testing Procedures

### Test 1: Basic Event Broadcasting

**Setup:**
1. Open a work item with advice management
2. Open browser console (F12)
3. Enable verbose logging

**Steps:**
1. Open AdvicePauseResumeBlade panel
2. Click "Pause Advice" button
3. Enter reason: "Test pause event"
4. Confirm action

**Expected Console Output:**
```
[AdvicePauseResumeBlade] Broadcasting status change: advice:paused {data}
[AdvicePauseResumeBlade] Broadcasted to $ui.eventManager
[AdvicePauseResumeBlade] Broadcasted to Common.EventBus
[AdvicePauseResumeBlade] Broadcasted to global AdviceEventBus
[AdvicePauseResumeBlade] Dispatched DOM custom events
```

### Test 2: Widget Reaction to Events

**Setup:**
1. Add AdvicePausedWidget to dashboard
2. Open work item
3. Note widget state (should be hidden if advice active)

**Steps:**
1. Open AdvicePauseResumeBlade
2. Pause advice with reason
3. Observe widget

**Expected Results:**
- Widget should appear immediately after pause
- Widget should show pause reason
- Console should show:
```
[AdvicePausedWidget] Received advice:paused event from $ui.eventManager: {data}
[AdvicePausedWidget] Received ADVICE_PAUSED event from Common.EventBus: {data}
[AdvicePausedWidget] Received advice:paused DOM event: {data}
```

### Test 3: Resume Event Broadcasting

**Steps:**
1. With advice paused, open blade
2. Click "Resume Advice"
3. Set next advice date
4. Confirm

**Expected Results:**
- Widget should hide immediately
- Console shows all broadcast confirmations
- Status reflects as "Active"

### Test 4: Multiple Widget Synchronization

**Setup:**
1. Add multiple advice widgets to dashboard:
   - AdvicePausedWidget
   - AdviceSummaryCard
   - AdviceBulkManager

**Steps:**
1. Change status via blade
2. Observe all widgets

**Expected Results:**
- All widgets update simultaneously
- No delays or missed updates
- Each widget logs receipt of event

### Test 5: Cross-Browser Tab Events

**Setup:**
1. Open same work item in two browser tabs
2. Have widgets visible in both

**Steps:**
1. Change status in Tab 1
2. Switch to Tab 2

**Note:** DOM events don't cross tabs, but ShareDo EventManager might if it uses localStorage/sessionStorage

### Test 6: Event Data Validation

**Steps:**
1. Pause advice
2. In console, inspect event data:
```javascript
// Set up listener before action
$ui.eventManager.subscribe('advice:paused', function(data) {
    console.log('Event Data:', JSON.stringify(data, null, 2));
});
```

**Verify:**
- All required fields present
- Timestamps are valid ISO strings
- Status matches action
- Source is 'AdvicePauseResumeBlade'

### Test 7: Error Resilience

**Setup:**
1. Temporarily break one event system:
```javascript
// Save original
var originalBroadcast = $ui.eventManager.broadcast;
// Break it
$ui.eventManager.broadcast = function() { throw new Error('Test error'); };
```

**Steps:**
1. Change advice status
2. Check console for error handling

**Expected:**
- Error logged but not thrown
- Other event systems still receive events
- Operation completes successfully

**Cleanup:**
```javascript
$ui.eventManager.broadcast = originalBroadcast;
```

### Test 8: Performance Testing

**Setup:**
1. Add 10+ widgets to dashboard
2. Open performance profiler (F12 → Performance)

**Steps:**
1. Start recording
2. Toggle advice status 5 times quickly
3. Stop recording

**Verify:**
- No significant lag
- Events processed quickly
- No memory leaks

## Debugging Commands

### Check Event Subscriptions
```javascript
// Check Common EventBus subscriptions
Alt.AdviceManagement.Common.EventBus.getDebugInfo();

// Check specific event
Alt.AdviceManagement.Common.EventBus.getSubscriberCount('advice:paused');

// View event history
Alt.AdviceManagement.Common.EventBus.getHistory();
```

### Manual Event Trigger
```javascript
// Manually trigger pause event
var testData = {
    workItemId: '12345',
    status: 'paused',
    action: 'paused',
    changedBy: 'Test User',
    changedDate: new Date().toISOString(),
    reason: 'Manual test'
};

// Via ShareDo
$ui.eventManager.broadcast('advice:paused', testData);

// Via Common EventBus
Alt.AdviceManagement.Common.EventBus.publish('advice:paused', testData);

// Via DOM
document.dispatchEvent(new CustomEvent('advice:paused', { detail: testData }));
```

### Enable Debug Mode
```javascript
// Enable EventBus debug mode
Alt.AdviceManagement.Common.EventBus.setDebugMode(true);
```

## Troubleshooting

### Issue: Widget Not Updating

**Check:**
1. Verify widget's workItemId matches event's workItemId
2. Check console for subscription confirmations
3. Verify event is being broadcast (check all systems)
4. Check for JavaScript errors

**Debug:**
```javascript
// Check if widget is subscribed
console.log('Widget work item:', widget.model.workItemId());
// Should match event work item
```

### Issue: Events Not Broadcasting

**Check:**
1. Verify blade's broadcastStatusChange method exists
2. Check for errors in console during broadcast
3. Verify event systems are initialized

**Debug:**
```javascript
// Check if systems exist
console.log('$ui.eventManager:', !!window.$ui?.eventManager);
console.log('Common.EventBus:', !!Alt.AdviceManagement.Common?.EventBus);
console.log('AdviceEventBus:', !!window.AdviceEventBus);
```

### Issue: Duplicate Event Handling

**Symptoms:**
- Widget updates multiple times
- Multiple console logs for same event

**Solution:**
- Widget should check if already processing
- Implement debouncing if needed
- Ensure proper cleanup on destroy

## Best Practices

1. **Always Include Work Item ID**
   - Essential for widget filtering
   - Prevents cross-contamination

2. **Use Consistent Event Names**
   - Follow established patterns
   - Check Constants.js for standard names

3. **Include Source Field**
   - Helps with debugging
   - Identifies event origin

4. **Comprehensive Event Data**
   - Include all relevant context
   - Don't assume widgets have other data

5. **Error Handling**
   - Wrap broadcasts in try-catch
   - Log but don't throw errors
   - Continue to other systems if one fails

## Conclusion

The enhanced event system ensures reliable communication between all AdviceManager components. The multi-system approach provides redundancy and maximum compatibility. Regular testing using these procedures will ensure the system continues to function correctly as new features are added.