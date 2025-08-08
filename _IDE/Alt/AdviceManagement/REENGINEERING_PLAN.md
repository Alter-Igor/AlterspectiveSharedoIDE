# Reengineering Plan: Migration to ShareDo Native Event System

## Version 1.0 - Initial Plan

### Objective
Eliminate redundant custom EventBus implementation and migrate all event handling to ShareDo's native `$ui.eventManager` system.

### Current State Analysis

#### Files Requiring Changes
1. **Publishers (Event Broadcasters)**
   - `AdvicePauseResumeBlade/blade.js` - Triple broadcasting in `broadcastStatusChange()`
   
2. **Subscribers (Event Listeners)**
   - `AdvicePausedWidget/AdvicePausedWidget.js` - Triple subscription
   - `AdviceSummaryCard/AdviceSummaryCard.js` - Triple subscription
   - `AdviceBulkManager/AdviceBulkManager.js` - Triple subscription

3. **Infrastructure to Remove**
   - `common/EventBus.js` - Entire file
   - `common/Constants.js` - EventBus references
   - `common/init.js` - EventBus initialization

### Migration Strategy

#### Phase 1: Inventory Current Events
- [ ] Document all events currently being used
- [ ] Map event names between systems
- [ ] Identify any EventBus-specific features in use

#### Phase 2: Simplify Publishers
- [ ] Update `broadcastStatusChange()` to use only ShareDo
- [ ] Remove DOM event dispatching
- [ ] Remove Common.EventBus publishing

#### Phase 3: Simplify Subscribers
- [ ] Update widgets to subscribe only to ShareDo
- [ ] Remove DOM event listeners
- [ ] Remove Common.EventBus subscriptions

#### Phase 4: Clean Up
- [ ] Remove EventBus.js file
- [ ] Update Constants.js
- [ ] Update documentation

### Risk Assessment
- **Low Risk**: ShareDo eventManager is proven and stable
- **Medium Risk**: Ensuring all widgets still receive events
- **Mitigation**: Phased rollout with testing

### Testing Plan
1. Unit test each widget after changes
2. Integration test event flow
3. Manual testing of all user scenarios

---

## Version 2.0 - First Review with Improvements

### Objective (Refined)
Eliminate redundant custom EventBus implementation and migrate all event handling to ShareDo's native `$ui.eventManager` system while maintaining backward compatibility during transition.

### Current State Analysis (Enhanced)

#### Files Requiring Changes (Complete List)
1. **Publishers (Event Broadcasters)**
   - `AdvicePauseResumeBlade/blade.js` - 2 broadcasting methods
   - `AdviceStatusController/AdviceStatusController.js` - Check for any broadcasting
   - `services/AdviceService.js` - May have event publishing

2. **Subscribers (Event Listeners)**
   - `AdvicePausedWidget/AdvicePausedWidget.js` - Triple subscription
   - `AdviceSummaryCard/AdviceSummaryCard.js` - Triple subscription  
   - `AdviceBulkManager/AdviceBulkManager.js` - Triple subscription

3. **Infrastructure to Modify/Remove**
   - `common/EventBus.js` - Remove entirely
   - `common/Constants.js` - Keep events constants, remove EventBus refs
   - `common/init.js` - Remove EventBus initialization
   - Test files - Update any that reference EventBus

### Improved Migration Strategy

#### Phase 0: Pre-Migration Setup (NEW)
- [ ] Create feature flag to toggle between old/new system
- [ ] Add logging to track event flow
- [ ] Create rollback plan

#### Phase 1: Event Inventory and Mapping
- [ ] Document all events:
  - `advice:paused`
  - `advice:resumed`
  - `advice:statusChanged`
  - `advice:statusLoaded`
- [ ] Check for any component-specific events
- [ ] Verify no external dependencies on EventBus

#### Phase 2: Create Compatibility Layer (NEW)
- [ ] Create temporary wrapper for gradual migration
- [ ] Ensure both systems work during transition
- [ ] Add deprecation warnings

#### Phase 3: Migrate Publishers (Refined)
- [ ] Create shared broadcasting utility
- [ ] Update blade.js with backward compatibility
- [ ] Test each publisher independently

#### Phase 4: Migrate Subscribers (Refined)
- [ ] Update one widget at a time
- [ ] Verify events still received
- [ ] Clean up subscription management

#### Phase 5: Remove Legacy Code
- [ ] Remove EventBus after all components migrated
- [ ] Clean up Constants
- [ ] Update all documentation

### Enhanced Risk Assessment
- **Performance Risk**: Triple events currently - need to ensure single events don't break anything
- **Timing Risk**: Some components might depend on event order
- **Compatibility Risk**: Other modules might use EventBus

### Rollback Plan (NEW)
1. Keep EventBus.js in place initially
2. Use feature flag to toggle
3. Monitor for issues for 1 week
4. Remove only after confirmation

### Success Metrics (NEW)
- 60% code reduction in event handling
- 0 lost events in testing
- Performance improvement measurable
- All widgets continue functioning

---

## Version 3.0 - Second Review with Code Cross-Check

### Objective (Final)
Safely migrate from triple event system (ShareDo + EventBus + DOM) to single ShareDo native event system while ensuring zero functionality loss.

### Code Cross-Check Results

#### Actual Event Usage (Verified)
After checking the codebase:

1. **Events Actually Used**:
   - `advice:paused` - When advice is paused
   - `advice:resumed` - When advice is resumed  
   - `advice:statusChanged` - Generic status change
   - `advice:statusLoaded` - When blade loads status (NEW finding)

2. **Publisher Analysis**:
   - `blade.js` line 187: Publishes `advice:statusLoaded` on load
   - `blade.js` line 223: Calls `broadcastStatusChange()` on toggle
   - `blade.js` lines 242-304: Triple broadcasting in `broadcastStatusChange()`

3. **Subscriber Analysis**:
   ```
   AdvicePausedWidget: Lines 431-519 (89 lines of subscription code!)
   AdviceSummaryCard: Lines 402-453 (similar pattern)
   AdviceBulkManager: Lines 1082-1096 (similar pattern)
   ```

4. **EventBus Unique Features Check**:
   - History tracking - NOT USED anywhere
   - Debug mode - NOT USED anywhere
   - Subscriber count - NOT USED anywhere
   - Once() method - NOT USED anywhere

### Final Migration Strategy (Optimized)

#### Phase 1: Create Safety Net (Week 1)
```javascript
// temporary-bridge.js - Ensures nothing breaks during migration
if (!window.$ui || !window.$ui.eventManager) {
    console.error('[AdviceManagement] ShareDo eventManager not available!');
    // Create minimal fallback
    window.$ui = window.$ui || {};
    window.$ui.eventManager = {
        broadcast: function(event, data) { 
            console.log('[Fallback] Event:', event, data);
        },
        subscribe: function() { return Math.random(); },
        unsubscribe: function() {}
    };
}
```

#### Phase 2: Simplify Publishers (Week 1)
**File: `AdvicePauseResumeBlade/blade.js`**

Replace lines 199-305 with:
```javascript
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.broadcastStatusChange = function(action, options, result) {
    var self = this;
    
    // Prepare complete event data
    var eventData = {
        workItemId: self.workItemId,
        workItemReference: self.workItemReference,
        workItemTitle: self.workItemTitle,
        workTypeSystemName: self.workTypeSystemName,
        status: action === 'paused' ? 'paused' : 'active',
        action: action,
        changedBy: options.userName,
        changedDate: new Date().toISOString(),
        reason: options.reason || '',
        source: 'AdvicePauseResumeBlade'
    };
    
    // Add action-specific data
    if (action === 'paused') {
        eventData.pausedDate = eventData.changedDate;
        eventData.pausedBy = options.userName;
        eventData.pauseReason = options.reason;
    } else if (action === 'resumed') {
        eventData.resumedDate = eventData.changedDate;
        eventData.resumedBy = options.userName;
        if (options.nextAdviceDate) {
            eventData.nextAdviceDate = options.nextAdviceDate;
        }
    }
    
    // Single broadcast to ShareDo only
    if (window.$ui && window.$ui.eventManager) {
        var eventName = action === 'paused' ? 'advice:paused' : 'advice:resumed';
        $ui.eventManager.broadcast(eventName, eventData);
        $ui.eventManager.broadcast('advice:statusChanged', eventData);
        console.log('[AdvicePauseResumeBlade] Event broadcast:', eventName);
    } else {
        console.error('[AdvicePauseResumeBlade] ShareDo eventManager not available');
    }
};
```

#### Phase 3: Simplify Subscribers (Week 2)
**Pattern for all widgets:**
```javascript
// Initialize in constructor
self.initializeEventSubscriptions = function() {
    if (!window.$ui || !window.$ui.eventManager) {
        console.warn('[Widget] ShareDo eventManager not available');
        return;
    }
    
    // Single subscription per event
    self.subscriptions = {
        paused: $ui.eventManager.subscribe('advice:paused', 
            self.handleAdvicePaused.bind(self), self),
        resumed: $ui.eventManager.subscribe('advice:resumed', 
            self.handleAdviceResumed.bind(self), self),
        statusChanged: $ui.eventManager.subscribe('advice:statusChanged',
            self.handleStatusChanged.bind(self), self)
    };
};

// Cleanup in destroy
self.cleanup = function() {
    if (self.subscriptions) {
        Object.keys(self.subscriptions).forEach(function(key) {
            if (self.subscriptions[key]) {
                $ui.eventManager.unsubscribe(self.subscriptions[key]);
            }
        });
    }
};
```

#### Phase 4: Remove Dead Code (Week 3)
1. Delete `common/EventBus.js`
2. Update `common/Constants.js` - Keep event names, remove EventBus section
3. Remove DOM event code
4. Update documentation

### Implementation Order (Priority Based)

1. **Day 1**: Update `AdvicePauseResumeBlade/blade.js` (Critical - source of events)
2. **Day 2**: Update `AdvicePausedWidget` (Most visible widget)
3. **Day 3**: Update `AdviceSummaryCard` and `AdviceBulkManager`
4. **Day 4**: Testing and verification
5. **Day 5**: Remove EventBus infrastructure
6. **Week 2**: Monitor in production
7. **Week 3**: Final cleanup

### Validation Checklist

Before:
- [ ] Count events in browser DevTools Network tab
- [ ] Note performance metrics
- [ ] Document current behavior

During:
- [ ] Verify single event dispatch
- [ ] Check all widgets update
- [ ] No console errors
- [ ] No duplicate processing

After:
- [ ] Performance improved
- [ ] Code reduced by 50%+
- [ ] All features working
- [ ] Documentation updated

### Specific Code Locations to Update

1. **AdvicePauseResumeBlade/blade.js**
   - Lines 199-305: Replace `broadcastStatusChange` method
   - Lines 186-191: Simplify status loaded broadcasting

2. **AdvicePausedWidget/AdvicePausedWidget.js**
   - Lines 428-519: Replace with 15 lines
   - Lines 537-577: Replace with 5 lines

3. **AdviceSummaryCard/AdviceSummaryCard.js**
   - Lines 400-427: Simplify subscriptions
   - Lines 443-453: Simplify cleanup

4. **AdviceBulkManager/AdviceBulkManager.js**
   - Lines 1082-1096: Simplify subscriptions
   - Lines 1016-1024: Simplify cleanup

5. **common/Constants.js**
   - Lines 68-79: Keep event names only
   - Remove EventBus sections

6. **Delete entirely**:
   - `common/EventBus.js`
   - EventBus tests if any

### Emergency Rollback Procedure

If issues arise:
1. Git revert the commits
2. Restore EventBus.js
3. Re-enable triple broadcasting
4. Investigate issue
5. Fix and retry

### Monitoring Plan

Post-deployment monitoring:
- Check browser console for errors
- Verify events in Network tab
- Monitor user reports
- Check performance metrics

### Success Criteria (Final)

✅ All widgets receive events correctly
✅ No duplicate event processing  
✅ 60%+ code reduction achieved
✅ Performance improved (measure in DevTools)
✅ Zero user-reported issues
✅ Documentation complete