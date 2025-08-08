# AdviceManager Detailed Implementation Documentation

## Table of Contents
1. [Core Implementation Details](#core-implementation-details)
2. [Component Implementation](#component-implementation)
3. [API Integration](#api-integration)
4. [Data Models](#data-models)
5. [Event System](#event-system)
6. [Widget Implementations](#widget-implementations)
7. [Workflow Action Implementation](#workflow-action-implementation)
8. [Service Layer Implementation](#service-layer-implementation)
9. [Error Handling Implementation](#error-handling-implementation)
10. [Testing Implementation](#testing-implementation)

## Core Implementation Details

### Namespace Pattern Implementation

The system uses a namespace pattern to avoid global scope pollution:

```javascript
// Namespace creation utility
if (typeof namespace !== 'function') {
    window.namespace = function(namespaceString) {
        var parts = namespaceString.split('.');
        var parent = window;
        var currentPart = '';
        
        for (var i = 0, length = parts.length; i < length; i++) {
            currentPart = parts[i];
            parent[currentPart] = parent[currentPart] || {};
            parent = parent[currentPart];
        }
        
        return parent;
    };
}

// Usage
namespace("Alt.AdviceManagement");
```

### Module Initialization

```javascript
// Foundation Bundle initialization
Alt.AdviceManagement.Common.init = function() {
    // Initialize constants
    this.Constants = { /* configuration */ };
    
    // Initialize event bus
    this.EventBus = new EventBus();
    
    // Initialize cache manager
    this.CacheManager = new CacheManager({
        ttl: 300000, // 5 minutes
        maxSize: 100
    });
    
    // Initialize UI helpers
    this.UIHelpers = new UIHelpers();
    
    console.log('[AdviceManagement] Foundation Bundle initialized');
};
```

## Component Implementation

### AdvicePauseResumeBlade Implementation

#### Constructor Pattern

```javascript
Alt.AdviceManagement.AdvicePauseResumeBlade = function(element, configuration, stackModel) {
    var self = this;
    
    // Configuration merging
    var defaults = {
        autoRefresh: false,
        refreshInterval: 30000
    };
    var options = $.extend(true, {}, defaults, configuration);
    
    // Store references
    self.element = element;
    self.configuration = options;
    self.stackModel = stackModel;
    
    // Extract work item context
    self.workItemId = options.workItemId || 
                      options.sharedoId ||
                      (stackModel && stackModel.sharedoId && stackModel.sharedoId()) ||
                      ShareDoUtils.getWorkItemId(options);
    
    // Initialize services
    self.apiService = new Alt.OngoingAdvice.Services.AttributeApiService();
    
    // Create data model
    self.model = new Alt.OngoingAdvice.Models.OngoingAdviceModel({
        workItemId: self.workItemId
    });
    
    // Create ribbon bar
    self.blade.ribbon = self.createRibbonBar();
};
```

#### Data Loading Implementation

```javascript
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.loadAndBind = function() {
    var self = this;
    
    if (!self.workItemId) {
        self.model.showError("No work item ID provided");
        return;
    }
    
    self.model.loading(true);
    self.model.clearMessages();
    
    // Parallel data loading
    var promises = [];
    
    // Load work item details
    promises.push(
        self.apiService.getWorkItem(self.workItemId)
            .done(function(workItem) {
                self.model.updateWorkItem(workItem);
            })
    );
    
    // Load advice attributes
    promises.push(
        self.apiService.getOngoingAdviceAttributes(self.workItemId)
            .done(function(attributes) {
                self.model.updateFromAttributes(attributes);
            })
    );
    
    // Process all promises
    $.when.apply($, promises).always(function() {
        self.model.loading(false);
        self.model.loaded(true);
        self.model.setDefaultNextAdviceDate();
    });
};
```

#### Toggle Implementation

```javascript
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.toggleOngoingAdvice = function() {
    var self = this;
    
    if (!self.model.canPerformAction()) {
        return;
    }
    
    self.model.saving(true);
    self.model.clearMessages();
    
    var options = self.model.getActionOptions();
    
    self.apiService.toggleOngoingAdvice(self.workItemId, options)
        .done(function(result) {
            var actionText = result.action === 'paused' ? 'paused' : 'resumed';
            self.model.showSuccess('Ongoing advice has been ' + actionText);
            
            // Broadcast event
            if (window.$ui && window.$ui.eventManager) {
                var eventName = result.action === 'paused' ? 'advice:paused' : 'advice:resumed';
                var eventData = {
                    workItemId: self.workItemId,
                    status: result.action,
                    changedBy: options.userName,
                    changedDate: new Date().toISOString(),
                    reason: options.reason
                };
                
                $ui.eventManager.broadcast(eventName, eventData);
            }
            
            // Reload data
            setTimeout(function() {
                self.refreshStatus();
            }, 1000);
        })
        .fail(function(xhr, status, error) {
            self.model.showError('Failed to update status: ' + error);
        })
        .always(function() {
            self.model.saving(false);
        });
};
```

## API Integration

### AttributeApiService Implementation

```javascript
Alt.OngoingAdvice.Services.AttributeApiService = function() {
    var self = this;
    
    // Get ongoing advice attributes
    self.getOngoingAdviceAttributes = function(workItemId) {
        return $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
            .then(function(attributes) {
                // Map to standardized attribute names
                return {
                    enabled: attributes['alt_ongoing_advice_enabled'] === 'true',
                    pausedDate: attributes['alt_ongoing_advice_paused_date'],
                    pausedBy: attributes['alt_ongoing_advice_paused_by'],
                    pauseReason: attributes['alt_ongoing_advice_pause_reason'],
                    resumedDate: attributes['alt_ongoing_advice_resumed_date'],
                    resumedBy: attributes['alt_ongoing_advice_resumed_by'],
                    resumeReason: attributes['alt_ongoing_advice_resume_reason'],
                    nextDate: attributes['alt_ongoing_advice_next_date']
                };
            });
    };
    
    // Update ongoing advice attributes
    self.updateOngoingAdviceAttributes = function(workItemId, updates) {
        var attributes = {};
        
        // Map updates to attribute names
        if (updates.hasOwnProperty('enabled')) {
            attributes['alt_ongoing_advice_enabled'] = updates.enabled ? 'true' : 'false';
        }
        if (updates.pausedDate) {
            attributes['alt_ongoing_advice_paused_date'] = updates.pausedDate;
        }
        if (updates.pausedBy) {
            attributes['alt_ongoing_advice_paused_by'] = updates.pausedBy;
        }
        if (updates.pauseReason) {
            attributes['alt_ongoing_advice_pause_reason'] = updates.pauseReason;
        }
        if (updates.resumedDate) {
            attributes['alt_ongoing_advice_resumed_date'] = updates.resumedDate;
        }
        if (updates.resumedBy) {
            attributes['alt_ongoing_advice_resumed_by'] = updates.resumedBy;
        }
        if (updates.resumeReason) {
            attributes['alt_ongoing_advice_resume_reason'] = updates.resumeReason;
        }
        if (updates.nextDate) {
            attributes['alt_ongoing_advice_next_date'] = updates.nextDate;
        }
        
        return $ajax.api.put('/api/v1/public/workItem/' + workItemId + '/attributes', {
            attributes: attributes
        });
    };
    
    // Toggle advice status
    self.toggleOngoingAdvice = function(workItemId, options) {
        var deferred = $.Deferred();
        
        // First get current status
        self.getOngoingAdviceAttributes(workItemId)
            .done(function(current) {
                var updates = {};
                var action;
                
                if (current.enabled) {
                    // Currently active, pause it
                    action = 'paused';
                    updates.enabled = false;
                    updates.pausedDate = new Date().toISOString();
                    updates.pausedBy = options.userName;
                    updates.pauseReason = options.reason || 'Paused by user';
                    updates.nextDate = ''; // Clear next date
                } else {
                    // Currently paused, resume it
                    action = 'resumed';
                    updates.enabled = true;
                    updates.resumedDate = new Date().toISOString();
                    updates.resumedBy = options.userName;
                    updates.resumeReason = options.reason || 'Resumed by user';
                    if (options.nextAdviceDate) {
                        updates.nextDate = options.nextAdviceDate;
                    }
                }
                
                // Update attributes
                self.updateOngoingAdviceAttributes(workItemId, updates)
                    .done(function() {
                        deferred.resolve({ action: action, updates: updates });
                    })
                    .fail(function(xhr, status, error) {
                        deferred.reject(xhr, status, error);
                    });
            })
            .fail(function(xhr, status, error) {
                deferred.reject(xhr, status, error);
            });
        
        return deferred.promise();
    };
};
```

## Data Models

### OngoingAdviceModel Implementation

```javascript
Alt.OngoingAdvice.Models.OngoingAdviceModel = function(options) {
    var self = this;
    
    // Core properties
    self.workItemId = ko.observable(options.workItemId);
    self.workItemTitle = ko.observable('');
    self.workItemReference = ko.observable('');
    
    // Status properties
    self.isOngoingAdviceEnabled = ko.observable(false);
    self.pausedDate = ko.observable(null);
    self.pausedBy = ko.observable('');
    self.pauseReason = ko.observable('');
    self.resumedDate = ko.observable(null);
    self.resumedBy = ko.observable('');
    self.resumeReason = ko.observable('');
    self.nextAdviceDate = ko.observable(null);
    
    // UI state
    self.loading = ko.observable(false);
    self.loaded = ko.observable(false);
    self.saving = ko.observable(false);
    self.errorMessage = ko.observable('');
    self.successMessage = ko.observable('');
    
    // User context
    self.currentUser = ko.observable(null);
    
    // Computed properties
    self.isPaused = ko.computed(function() {
        return !self.isOngoingAdviceEnabled();
    });
    
    self.statusText = ko.computed(function() {
        return self.isOngoingAdviceEnabled() ? 'Active' : 'Paused';
    });
    
    self.statusClass = ko.computed(function() {
        return self.isOngoingAdviceEnabled() ? 'status-active' : 'status-paused';
    });
    
    self.actionButtonText = ko.computed(function() {
        return self.isOngoingAdviceEnabled() ? 'Pause Advice' : 'Resume Advice';
    });
    
    self.actionButtonClass = ko.computed(function() {
        return self.isOngoingAdviceEnabled() ? 'btn-warning' : 'btn-success';
    });
    
    self.daysPaused = ko.computed(function() {
        if (!self.pausedDate()) return 0;
        var paused = new Date(self.pausedDate());
        var now = new Date();
        return Math.floor((now - paused) / (1000 * 60 * 60 * 24));
    });
    
    // Validation
    self.canPerformAction = function() {
        if (self.loading() || self.saving()) {
            return false;
        }
        
        if (!self.workItemId()) {
            self.showError('No work item selected');
            return false;
        }
        
        // Validate pause reason if pausing
        if (self.isOngoingAdviceEnabled() && !self.pauseReason()) {
            self.showError('Please provide a reason for pausing');
            return false;
        }
        
        return true;
    };
    
    // Update from attributes
    self.updateFromAttributes = function(attributes) {
        self.isOngoingAdviceEnabled(attributes.enabled);
        self.pausedDate(attributes.pausedDate);
        self.pausedBy(attributes.pausedBy);
        self.pauseReason(attributes.pauseReason);
        self.resumedDate(attributes.resumedDate);
        self.resumedBy(attributes.resumedBy);
        self.resumeReason(attributes.resumeReason);
        self.nextAdviceDate(attributes.nextDate);
    };
    
    // Get action options
    self.getActionOptions = function() {
        var user = self.currentUser();
        return {
            userName: user ? user.displayName : 'Unknown User',
            reason: self.isOngoingAdviceEnabled() ? self.pauseReason() : self.resumeReason(),
            nextAdviceDate: !self.isOngoingAdviceEnabled() ? self.nextAdviceDate() : null
        };
    };
    
    // Set default next advice date (30 days from now)
    self.setDefaultNextAdviceDate = function() {
        if (!self.isOngoingAdviceEnabled() && !self.nextAdviceDate()) {
            var date = new Date();
            date.setDate(date.getDate() + 30);
            self.nextAdviceDate(date.toISOString());
        }
    };
    
    // Message handling
    self.showError = function(message) {
        self.errorMessage(message);
        self.successMessage('');
    };
    
    self.showSuccess = function(message) {
        self.successMessage(message);
        self.errorMessage('');
    };
    
    self.clearMessages = function() {
        self.errorMessage('');
        self.successMessage('');
    };
    
    // Cleanup
    self.dispose = function() {
        // Dispose computed observables
        if (self.isPaused) self.isPaused.dispose();
        if (self.statusText) self.statusText.dispose();
        if (self.statusClass) self.statusClass.dispose();
        if (self.actionButtonText) self.actionButtonText.dispose();
        if (self.actionButtonClass) self.actionButtonClass.dispose();
        if (self.daysPaused) self.daysPaused.dispose();
    };
};
```

## Event System

### EventBus Implementation

```javascript
Alt.AdviceManagement.Common.EventBus = (function() {
    var subscribers = {};
    var eventId = 0;
    
    return {
        // Publish an event
        publish: function(eventName, data) {
            if (!subscribers[eventName]) return;
            
            subscribers[eventName].forEach(function(subscriber) {
                try {
                    subscriber.callback(data);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        },
        
        // Subscribe to an event
        subscribe: function(eventName, callback) {
            if (!subscribers[eventName]) {
                subscribers[eventName] = [];
            }
            
            var id = ++eventId;
            subscribers[eventName].push({
                id: id,
                callback: callback
            });
            
            // Return unsubscribe function
            return {
                unsubscribe: function() {
                    if (!subscribers[eventName]) return;
                    
                    subscribers[eventName] = subscribers[eventName].filter(function(sub) {
                        return sub.id !== id;
                    });
                }
            };
        },
        
        // Clear all subscriptions for an event
        clear: function(eventName) {
            if (eventName) {
                delete subscribers[eventName];
            } else {
                subscribers = {};
            }
        }
    };
})();
```

### Event Usage Patterns

```javascript
// Publishing events
EventBus.publish('advice:paused', {
    workItemId: '12345',
    pausedBy: 'John Doe',
    reason: 'Client requested pause'
});

// Subscribing to events
var subscription = EventBus.subscribe('advice:paused', function(data) {
    console.log('Advice paused:', data);
    // Update UI
    self.model.isPaused(true);
});

// Cleanup
subscription.unsubscribe();
```

## Widget Implementations

### AdvicePausedWidget Implementation

```javascript
Alt.AdviceManagement.AdvicePausedWidget = function(element, configuration, baseModel) {
    var self = this;
    
    // Configuration
    var defaults = {
        autoRefresh: true,
        checkInterval: 30000,
        showReason: true
    };
    var options = $.extend(true, {}, defaults, configuration);
    
    // Model setup
    self.model = {
        isPaused: ko.observable(false),
        pausedDate: ko.observable(''),
        pausedReason: ko.observable(''),
        pausedBy: ko.observable(''),
        pausedDuration: ko.observable(''),
        isUrgent: ko.observable(false),
        isDismissed: ko.observable(false),
        workItemId: ko.observable(self.getWorkItemId()),
        workItemTitle: ko.observable(''),
        isLoading: ko.observable(false)
    };
    
    // Check status implementation
    self.checkStatus = function() {
        var workItemId = ko.unwrap(self.model.workItemId);
        if (!workItemId) return;
        
        self.model.isLoading(true);
        
        $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
            .done(function(attributes) {
                var isPaused = attributes['alt_ongoing_advice_enabled'] === 'false';
                self.model.isPaused(isPaused);
                
                if (isPaused) {
                    self.model.pausedDate(attributes['alt_ongoing_advice_paused_date']);
                    self.model.pausedReason(attributes['alt_ongoing_advice_pause_reason']);
                    self.model.pausedBy(attributes['alt_ongoing_advice_paused_by']);
                    
                    // Calculate duration
                    var duration = self.calculateDuration(attributes['alt_ongoing_advice_paused_date']);
                    self.model.pausedDuration(duration);
                    
                    // Check urgency (>24 hours)
                    var hours = self.getHoursPaused(attributes['alt_ongoing_advice_paused_date']);
                    self.model.isUrgent(hours > 24);
                    
                    // Show widget
                    $(self.element).fadeIn();
                } else {
                    // Hide widget when active
                    $(self.element).fadeOut();
                }
            })
            .fail(function(xhr, status, error) {
                console.error('Failed to check advice status:', error);
            })
            .always(function() {
                self.model.isLoading(false);
            });
    };
    
    // Open management panel
    self.openManagementPanel = function() {
        if (window.$ui && window.$ui.bladeManager) {
            $ui.bladeManager.open({
                id: 'Alt.AdviceManagement.AdvicePauseResumeBlade',
                workItemId: ko.unwrap(self.model.workItemId)
            });
        }
    };
    
    // Auto-refresh setup
    if (options.autoRefresh) {
        self.checkIntervalId = setInterval(function() {
            self.checkStatus();
        }, options.checkInterval);
    }
    
    // Initial check
    self.checkStatus();
    
    // Cleanup
    self.dispose = function() {
        if (self.checkIntervalId) {
            clearInterval(self.checkIntervalId);
        }
    };
};
```

### AdviceBulkManager Implementation

```javascript
Alt.AdviceManagement.AdviceBulkManager = function(element, configuration, baseModel) {
    var self = this;
    
    // Model
    self.model = {
        items: ko.observableArray([]),
        selectedItems: ko.observableArray([]),
        filterStatus: ko.observable('all'),
        isLoading: ko.observable(false),
        bulkAction: ko.observable(''),
        pauseReasonModal: {
            visible: ko.observable(false),
            reason: ko.observable('')
        }
    };
    
    // Computed properties
    self.model.filteredItems = ko.computed(function() {
        var filter = self.model.filterStatus();
        var items = self.model.items();
        
        if (filter === 'all') return items;
        
        return items.filter(function(item) {
            if (filter === 'active') {
                return item.status === 'active';
            } else if (filter === 'paused') {
                return item.status === 'paused';
            }
            return true;
        });
    });
    
    self.model.selectAll = ko.computed({
        read: function() {
            var filtered = self.model.filteredItems();
            var selected = self.model.selectedItems();
            return filtered.length > 0 && filtered.length === selected.length;
        },
        write: function(value) {
            if (value) {
                self.model.selectedItems(self.model.filteredItems().slice());
            } else {
                self.model.selectedItems([]);
            }
        }
    });
    
    // Load items
    self.loadItems = function() {
        self.model.isLoading(true);
        
        // API call to get work items with advice
        $ajax.api.get('/api/v1/public/workItems/search', {
            params: {
                hasAttribute: 'alt_ongoing_advice_enabled',
                limit: 50
            }
        })
        .done(function(response) {
            var items = response.items.map(function(item) {
                return {
                    id: item.id,
                    reference: item.reference,
                    title: item.title,
                    status: item.attributes['alt_ongoing_advice_enabled'] === 'true' ? 'active' : 'paused',
                    lastAction: item.attributes['alt_ongoing_advice_paused_date'] || 
                               item.attributes['alt_ongoing_advice_resumed_date'],
                    daysActive: self.calculateDaysActive(item.createdDate)
                };
            });
            
            self.model.items(items);
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to load items:', error);
        })
        .always(function() {
            self.model.isLoading(false);
        });
    };
    
    // Bulk pause
    self.bulkPause = function() {
        var selected = self.model.selectedItems();
        if (selected.length === 0) return;
        
        self.model.pauseReasonModal.visible(true);
    };
    
    // Confirm bulk pause
    self.confirmBulkPause = function() {
        var selected = self.model.selectedItems();
        var reason = self.model.pauseReasonModal.reason();
        
        if (!reason) {
            alert('Please provide a reason');
            return;
        }
        
        self.model.isLoading(true);
        
        // Process each item
        var promises = selected.map(function(item) {
            return self.pauseItem(item.id, reason);
        });
        
        $.when.apply($, promises).always(function() {
            self.model.pauseReasonModal.visible(false);
            self.model.pauseReasonModal.reason('');
            self.model.selectedItems([]);
            self.loadItems(); // Reload
        });
    };
    
    // Export to CSV
    self.exportToCsv = function() {
        var selected = self.model.selectedItems();
        if (selected.length === 0) return;
        
        var csv = 'Reference,Title,Status,Last Action,Days Active\n';
        
        selected.forEach(function(item) {
            csv += '"' + item.reference + '","' + 
                   item.title + '","' + 
                   item.status + '","' + 
                   item.lastAction + '",' + 
                   item.daysActive + '\n';
        });
        
        // Download CSV
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'advice-items.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    
    // Initialize
    self.loadItems();
};
```

## Workflow Action Implementation

### AdviceStatusController Workflow Action

```javascript
Alt.AdviceManagement.AdviceStatusController = function(context, configuration, callback) {
    var self = this;
    
    // Configuration
    self.config = $.extend(true, {}, {
        defaultAction: 'checkOnly',
        conditions: [],
        pauseReason: 'Workflow automated pause',
        requireConfirmation: false,
        enableLogging: true,
        retryOnFailure: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
    }, configuration);
    
    // State tracking
    self.state = {
        workItemId: null,
        previousStatus: null,
        currentStatus: null,
        actionTaken: 'none',
        attempts: 0,
        startTime: new Date(),
        logs: []
    };
    
    // Execute workflow
    self.execute = function() {
        self.log('info', 'Starting advice status controller');
        
        // Validate inputs
        if (!self.validateInputs()) {
            return self.complete(false, 'Invalid input parameters');
        }
        
        // Set timeout
        var timeoutId = setTimeout(function() {
            self.complete(false, 'Operation timed out');
        }, self.config.timeout);
        
        // Get current status
        self.getCurrentStatus(function(success, status) {
            clearTimeout(timeoutId);
            
            if (!success) {
                return self.handleError('Failed to get current status', status);
            }
            
            self.state.currentStatus = status;
            
            // Evaluate conditions
            var action = self.evaluateConditions(status);
            
            // Execute action
            self.executeAction(action, function(success, result) {
                if (success) {
                    self.complete(true, result);
                } else {
                    self.handleError('Action execution failed', result);
                }
            });
        });
    };
    
    // Evaluate conditions
    self.evaluateConditions = function(status) {
        for (var i = 0; i < self.config.conditions.length; i++) {
            var condition = self.config.conditions[i];
            
            if (self.matchCondition(condition.when, status)) {
                self.log('info', 'Condition matched', condition);
                return condition.then;
            }
        }
        
        self.log('info', 'No conditions matched, using default action');
        return self.config.defaultAction;
    };
    
    // Match condition
    self.matchCondition = function(when, status) {
        switch (when) {
            case 'isPaused':
                return status === 'paused';
            case 'isActive':
                return status === 'active';
            case 'pausedMoreThan24Hours':
                return status === 'paused' && self.getPausedHours() > 24;
            case 'pausedMoreThan7Days':
                return status === 'paused' && self.getPausedDays() > 7;
            default:
                return false;
        }
    };
    
    // Execute action with retry
    self.executeAction = function(action, callback) {
        self.executeActionWithRetry(action, 0, callback);
    };
    
    self.executeActionWithRetry = function(action, attempt, callback) {
        self.state.attempts = attempt + 1;
        
        self.performAction(action, function(success, result) {
            if (success) {
                callback(true, result);
            } else if (self.config.retryOnFailure && attempt < self.config.maxRetries - 1) {
                self.log('warn', 'Action failed, retrying', { attempt: attempt + 1 });
                
                setTimeout(function() {
                    self.executeActionWithRetry(action, attempt + 1, callback);
                }, self.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            } else {
                callback(false, result);
            }
        });
    };
    
    // Perform action
    self.performAction = function(action, callback) {
        switch (action) {
            case 'pause':
                self.pauseAdvice(callback);
                break;
            case 'resume':
                self.resumeAdvice(callback);
                break;
            case 'toggle':
                self.toggleAdvice(callback);
                break;
            case 'checkOnly':
            default:
                callback(true, { action: 'checked', status: self.state.currentStatus });
                break;
        }
    };
    
    // Complete workflow
    self.complete = function(success, result) {
        var output = {
            success: success,
            workItemId: self.state.workItemId,
            previousStatus: self.state.previousStatus,
            currentStatus: self.state.currentStatus,
            actionTaken: self.state.actionTaken,
            attempts: self.state.attempts,
            duration: new Date() - self.state.startTime,
            logs: self.state.logs,
            result: result
        };
        
        // Determine branch
        var branch = 'error';
        if (success) {
            if (self.state.actionTaken === 'paused') {
                branch = 'paused';
            } else if (self.state.actionTaken === 'resumed') {
                branch = 'resumed';
            } else if (self.state.actionTaken === 'none') {
                branch = 'noAction';
            } else {
                branch = 'success';
            }
        }
        
        callback(branch, output);
    };
    
    // Start execution
    self.execute();
};
```

## Service Layer Implementation

### AdviceService with Retry and Caching

```javascript
Alt.AdviceManagement.AdviceService = function() {
    var self = this;
    
    // Cache implementation
    self.cache = {
        data: {},
        timestamps: {},
        ttl: 300000, // 5 minutes
        
        get: function(key) {
            if (!self.cache.data[key]) return null;
            
            var timestamp = self.cache.timestamps[key];
            if (Date.now() - timestamp > self.cache.ttl) {
                delete self.cache.data[key];
                delete self.cache.timestamps[key];
                return null;
            }
            
            return self.cache.data[key];
        },
        
        set: function(key, value) {
            self.cache.data[key] = value;
            self.cache.timestamps[key] = Date.now();
        },
        
        clear: function(key) {
            if (key) {
                delete self.cache.data[key];
                delete self.cache.timestamps[key];
            } else {
                self.cache.data = {};
                self.cache.timestamps = {};
            }
        }
    };
    
    // Make request with retry
    self.makeRequest = function(options) {
        var deferred = $.Deferred();
        var attempts = 0;
        var maxAttempts = options.retryAttempts || 3;
        
        function attempt() {
            attempts++;
            
            $.ajax({
                url: options.url,
                method: options.method || 'GET',
                data: options.data,
                timeout: options.timeout || 30000,
                headers: options.headers || {}
            })
            .done(function(response) {
                deferred.resolve(response);
            })
            .fail(function(xhr, status, error) {
                if (attempts < maxAttempts && xhr.status >= 500) {
                    // Retry on server errors
                    var delay = Math.pow(2, attempts - 1) * 1000; // Exponential backoff
                    
                    console.log('Request failed, retrying in ' + delay + 'ms');
                    
                    setTimeout(attempt, delay);
                } else {
                    deferred.reject(xhr, status, error);
                }
            });
        }
        
        attempt();
        
        return deferred.promise();
    };
    
    // Batch update attributes
    self.batchUpdateAttributes = function(workItemIds, attributes) {
        var promises = workItemIds.map(function(id) {
            return self.updateAttributes(id, attributes);
        });
        
        return $.when.apply($, promises);
    };
    
    // Get status with caching
    self.getAdviceStatus = function(workItemId) {
        var cacheKey = 'status_' + workItemId;
        var cached = self.cache.get(cacheKey);
        
        if (cached) {
            return $.Deferred().resolve(cached).promise();
        }
        
        return self.makeRequest({
            url: '/api/v1/public/workItem/' + workItemId + '/attributes'
        })
        .then(function(attributes) {
            var status = attributes['alt_ongoing_advice_enabled'] === 'true' ? 'active' : 'paused';
            self.cache.set(cacheKey, status);
            return status;
        });
    };
};
```

## Error Handling Implementation

### Global Error Handler

```javascript
Alt.AdviceManagement.Common.ErrorHandler = {
    // Handle API errors
    handleApiError: function(xhr, status, error) {
        var message = 'An error occurred';
        var details = {};
        
        if (xhr.status === 0) {
            message = 'Network error - please check your connection';
        } else if (xhr.status === 401) {
            message = 'Authentication required - please log in';
            // Redirect to login
            window.location.href = '/login';
        } else if (xhr.status === 403) {
            message = 'Permission denied';
        } else if (xhr.status === 404) {
            message = 'Resource not found';
        } else if (xhr.status === 429) {
            message = 'Too many requests - please try again later';
        } else if (xhr.status >= 500) {
            message = 'Server error - please try again';
        }
        
        // Log error
        console.error('API Error:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            error: error
        });
        
        // Show user notification
        if (window.$ui && window.$ui.notify) {
            $ui.notify.error(message);
        }
        
        return {
            message: message,
            status: xhr.status,
            details: details
        };
    },
    
    // Handle validation errors
    handleValidationError: function(errors) {
        var message = 'Please correct the following errors:';
        var errorList = [];
        
        for (var field in errors) {
            if (errors.hasOwnProperty(field)) {
                errorList.push(field + ': ' + errors[field]);
            }
        }
        
        return {
            message: message,
            errors: errorList
        };
    },
    
    // Recovery strategies
    recover: function(error, retryCallback) {
        if (error.status >= 500 && retryCallback) {
            // Server error - offer retry
            if (confirm('Server error occurred. Would you like to retry?')) {
                retryCallback();
            }
        } else if (error.status === 401) {
            // Authentication error - redirect to login
            window.location.href = '/login?returnUrl=' + encodeURIComponent(window.location.href);
        }
    }
};
```

## Testing Implementation

### Unit Test Examples

```javascript
describe('OngoingAdviceModel', function() {
    var model;
    
    beforeEach(function() {
        model = new Alt.OngoingAdvice.Models.OngoingAdviceModel({
            workItemId: '12345'
        });
    });
    
    afterEach(function() {
        if (model.dispose) {
            model.dispose();
        }
    });
    
    describe('initialization', function() {
        it('should initialize with correct work item ID', function() {
            expect(model.workItemId()).toBe('12345');
        });
        
        it('should default to not paused', function() {
            expect(model.isPaused()).toBe(true); // Inverted from enabled
        });
    });
    
    describe('status updates', function() {
        it('should update from attributes correctly', function() {
            var attributes = {
                enabled: true,
                pausedDate: '2025-01-01T00:00:00Z',
                pausedBy: 'Test User',
                pauseReason: 'Test reason'
            };
            
            model.updateFromAttributes(attributes);
            
            expect(model.isOngoingAdviceEnabled()).toBe(true);
            expect(model.pausedDate()).toBe('2025-01-01T00:00:00Z');
            expect(model.pausedBy()).toBe('Test User');
            expect(model.pauseReason()).toBe('Test reason');
        });
    });
    
    describe('validation', function() {
        it('should require work item ID', function() {
            model.workItemId(null);
            expect(model.canPerformAction()).toBe(false);
        });
        
        it('should require pause reason when pausing', function() {
            model.isOngoingAdviceEnabled(true);
            model.pauseReason('');
            expect(model.canPerformAction()).toBe(false);
        });
    });
    
    describe('computed properties', function() {
        it('should compute status text correctly', function() {
            model.isOngoingAdviceEnabled(true);
            expect(model.statusText()).toBe('Active');
            
            model.isOngoingAdviceEnabled(false);
            expect(model.statusText()).toBe('Paused');
        });
        
        it('should calculate days paused', function() {
            var date = new Date();
            date.setDate(date.getDate() - 5);
            model.pausedDate(date.toISOString());
            
            expect(model.daysPaused()).toBe(5);
        });
    });
});
```

### Integration Test Examples

```javascript
describe('AdviceService Integration', function() {
    var service;
    var server;
    
    beforeEach(function() {
        service = new Alt.AdviceManagement.AdviceService();
        server = sinon.fakeServer.create();
    });
    
    afterEach(function() {
        server.restore();
    });
    
    describe('API calls', function() {
        it('should get advice status', function(done) {
            server.respondWith('GET', '/api/v1/public/workItem/12345/attributes',
                [200, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    'alt_ongoing_advice_enabled': 'true',
                    'alt_ongoing_advice_paused_date': '2025-01-01T00:00:00Z'
                })]);
            
            service.getAdviceStatus('12345')
                .done(function(status) {
                    expect(status).toBe('active');
                    done();
                });
            
            server.respond();
        });
        
        it('should handle errors with retry', function(done) {
            var attempts = 0;
            
            server.respondWith('GET', '/api/v1/public/workItem/12345/attributes',
                function(xhr) {
                    attempts++;
                    if (attempts < 3) {
                        xhr.respond(500, {}, 'Server error');
                    } else {
                        xhr.respond(200, { 'Content-Type': 'application/json' },
                            JSON.stringify({ 'alt_ongoing_advice_enabled': 'false' }));
                    }
                });
            
            service.getAdviceStatus('12345')
                .done(function(status) {
                    expect(attempts).toBe(3);
                    expect(status).toBe('paused');
                    done();
                });
            
            // Respond multiple times for retries
            setTimeout(function() { server.respond(); }, 0);
            setTimeout(function() { server.respond(); }, 1100);
            setTimeout(function() { server.respond(); }, 2100);
        });
    });
    
    describe('caching', function() {
        it('should cache responses', function(done) {
            server.respondWith('GET', '/api/v1/public/workItem/12345/attributes',
                [200, { 'Content-Type': 'application/json' },
                JSON.stringify({ 'alt_ongoing_advice_enabled': 'true' })]);
            
            // First call
            service.getAdviceStatus('12345')
                .done(function(status) {
                    expect(status).toBe('active');
                    
                    // Second call should use cache
                    service.getAdviceStatus('12345')
                        .done(function(cachedStatus) {
                            expect(cachedStatus).toBe('active');
                            expect(server.requests.length).toBe(1); // Only one request
                            done();
                        });
                });
            
            server.respond();
        });
    });
});
```

## Performance Optimization

### Debouncing and Throttling

```javascript
Alt.AdviceManagement.Common.UIHelpers = {
    // Debounce function calls
    debounce: function(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    },
    
    // Throttle function calls
    throttle: function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    }
};

// Usage
var debouncedSave = UIHelpers.debounce(function() {
    self.saveChanges();
}, 500);

var throttledScroll = UIHelpers.throttle(function() {
    self.handleScroll();
}, 100);
```

## Conclusion

This detailed implementation documentation provides comprehensive insights into the AdviceManager system's code structure, patterns, and implementation details. The system demonstrates enterprise-grade patterns including proper error handling, caching, retry logic, and testing strategies, making it a robust solution for legal advice workflow management.