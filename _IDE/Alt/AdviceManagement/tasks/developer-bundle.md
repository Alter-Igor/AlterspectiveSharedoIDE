# Developer Bundle Task

## For AI Instance 3

Please implement the following improvements for the AdviceManagement module:

### 1. DEBUG MODE
Create `common/DebugMode.js`:

Features:
- Toggle with `Ctrl+Shift+D`
- Show performance overlay in corner
- Log all API calls with timing
- Display current widget states
- Show event bus messages

```javascript
namespace("Alt.AdviceManagement.Common");

Alt.AdviceManagement.Common.DebugMode = (function() {
    var enabled = false;
    var metrics = {};
    
    // Implementation here
    
    return {
        toggle: toggle,
        log: log,
        showMetrics: showMetrics
    };
})();
```

### 2. INTEGRATION TESTS
Create `tests/advice-integration.test.js`:

Test scenarios:
- Widget initialization
- API service calls
- Event bus communication
- Cache functionality
- Error handling

Use existing Jasmine patterns from `AdviceStatusController.test.js`.

### 3. PERFORMANCE MONITORING
Add timing to AdviceService.js:
- Track API call duration
- Monitor cache hit/miss ratio
- Log slow operations (>1s)

Commit when done with message: "Add debug mode and developer tools"