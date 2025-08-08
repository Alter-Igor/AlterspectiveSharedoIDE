// Ensure namespace function exists
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

// Create namespace
namespace("Alt.AdviceManagement");

/**
 * AdvicePausedWidget - Shows notification when advice is paused
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdvicePausedWidget = function(element, configuration, baseModel) {
    var self = this;
    
    // Check if Foundation Bundle is loaded
    if (!Alt.AdviceManagement.Common || !Alt.AdviceManagement.Common.Constants) {
        console.error('[AdvicePausedWidget] Foundation Bundle not loaded. Please ensure common modules are included.');
        // Provide fallback defaults
        Alt.AdviceManagement.Common = Alt.AdviceManagement.Common || {};
        Alt.AdviceManagement.Common.Constants = Alt.AdviceManagement.Common.Constants || {
            WIDGETS: { PAUSED_WIDGET: { CHECK_INTERVAL: 30000, SHOW_REASON: true, AUTO_REFRESH: true, URGENCY_THRESHOLD_HOURS: 24 } },
            API: { BASE_URL: '/api/v1/public', TIMEOUT: 30000, CACHE_TTL: 5000 },
            STATUS: { PAUSED: 'paused', ACTIVE: 'active' },
            EVENTS: { ADVICE_STATUS_CHANGED: 'advice:statusChanged', ADVICE_ERROR: 'advice:error', WIDGET_LOADED: 'widget:loaded', WIDGET_DESTROYED: 'widget:destroyed' },
            STORAGE: { DISMISSED_ITEMS: 'advice_dismissed_items' }
        };
        Alt.AdviceManagement.Common.EventBus = Alt.AdviceManagement.Common.EventBus || { publish: function() {}, subscribe: function() { return { unsubscribe: function() {} }; } };
        Alt.AdviceManagement.Common.CacheManager = Alt.AdviceManagement.Common.CacheManager || { get: function() { return null; }, set: function() {}, remove: function() {} };
    }
    
    // Import Foundation Bundle components
    var Constants = Alt.AdviceManagement.Common.Constants;
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Cache = Alt.AdviceManagement.Common.CacheManager;
    
    var defaults = Constants.WIDGETS.PAUSED_WIDGET;
    var options = $.extend(true, {}, defaults, configuration);
    
    // Get work item ID from context
    self.getWorkItemId = function() {
        // Try to get from $ui.pageContext (portal context)
        if (window.$ui && window.$ui.pageContext) {
            var sharedoId = window.$ui.pageContext.sharedoId();
            if (sharedoId) {
                return sharedoId;
            }
        }
        
        // Fallback to baseModel if provided
        if (baseModel && baseModel.workItemId) {
            return ko.unwrap(baseModel.workItemId);
        }
        
        return null;
    };
    
    // Setup the model with KnockoutJS observables
    self.model = {
        isPaused: ko.observable(false),
        pausedDate: ko.observable(""),
        pausedReason: ko.observable(""),
        pausedBy: ko.observable(""),
        pausedDuration: ko.observable(""),
        isUrgent: ko.observable(false),
        isDismissed: ko.observable(false),
        workItemId: ko.observable(self.getWorkItemId()),
        workItemTitle: ko.observable(''),
        isLoading: ko.observable(false)
    };
    
    // Store references
    self.element = element;
    self.baseModel = baseModel;
    self.options = options;
    self.checkIntervalId = null;
    
    // Calculate time duration
    self.calculateDuration = function(startDate) {
        var now = new Date();
        var start = new Date(startDate);
        var diff = now - start;
        
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(hours / 24);
        
        if (days > 0) {
            return days + (days === 1 ? ' day' : ' days');
        } else if (hours > 0) {
            return hours + (hours === 1 ? ' hour' : ' hours');
        } else {
            var minutes = Math.floor(diff / (1000 * 60));
            return minutes + (minutes === 1 ? ' minute' : ' minutes');
        }
    };
    
    // Function to check advice status
    self.checkAdviceStatus = function() {
        if (!self.model.workItemId() || self.model.isDismissed()) {
            self.model.isPaused(false);
            return;
        }
        
        // Check cache first
        var cached = Cache.get('widgetAdviceStatus', self.model.workItemId());
        if (cached) {
            self.processAdviceStatus(cached);
            return;
        }
        
        self.model.isLoading(true);
        
        // Call API to check if advice is paused
        $ajax.api.get('/api/v1/public/workItem/' + self.model.workItemId() + '/attributes')
        .then(function(response) {
            // Response IS the attributes object directly
            if (response) {
                // Cache the response
                Cache.set('widgetAdviceStatus', self.model.workItemId(), response, Constants.API.CACHE_TTL);
                self.processAdviceStatus(response);
            }
            self.model.isLoading(false);
        })
        .catch(function(error) {
            console.error("Failed to check advice status", error);
            self.model.isLoading(false);
            self.model.isPaused(false);
            EventBus.publish(Constants.EVENTS.ADVICE_ERROR, {
                workItemId: self.model.workItemId(),
                error: 'Failed to check advice status'
            });
        });
    };
    
    // Process advice status response
    self.processAdviceStatus = function(attributes) {
        if (attributes) {
            var adviceEnabled = attributes['alt_ongoing_advice_enabled'];
            var pausedDate = attributes['alt_ongoing_advice_paused_date'];
            var pausedReason = attributes['alt_ongoing_advice_pause_reason'];
            var pausedBy = attributes['alt_ongoing_advice_paused_by'];
            
            if (adviceEnabled === 'false' && !self.model.isDismissed()) {
                        self.model.isPaused(true);
                        
                        // Format the paused date and calculate duration
                        if (pausedDate) {
                            var date = new Date(pausedDate);
                            self.model.pausedDate("Paused on " + date.toLocaleDateString() + " at " + date.toLocaleTimeString());
                            
                            // Calculate and set duration
                            var duration = self.calculateDuration(pausedDate);
                            self.model.pausedDuration("Paused for " + duration);
                            
                            // Check if urgent (based on threshold from constants)
                            var hoursPaused = (new Date() - date) / (1000 * 60 * 60);
                            self.model.isUrgent(hoursPaused > Constants.WIDGETS.PAUSED_WIDGET.URGENCY_THRESHOLD_HOURS);
                        } else {
                            self.model.pausedDate("Advice is currently paused");
                            self.model.pausedDuration("");
                        }
                        
                        // pausedBy now contains the name directly
                        if (pausedBy) {
                            self.model.pausedBy(pausedBy);
                        }
                        
                if (options.showReason && pausedReason) {
                    self.model.pausedReason(pausedReason);
                }
                
                // Publish paused event
                EventBus.publish(Constants.EVENTS.ADVICE_STATUS_CHANGED, {
                    workItemId: self.model.workItemId(),
                    status: Constants.STATUS.PAUSED,
                    pausedDate: pausedDate,
                    pausedReason: pausedReason
                });
            } else {
                // Advice is not paused, hide the widget
                self.model.isPaused(false);
                self.model.isDismissed(false); // Reset dismiss state
            }
        }
    };
    
    // Dismiss notification
    self.dismissNotification = function(data, event) {
        self.model.isDismissed(true);
        self.model.isPaused(false);
        
        // Store dismiss state in local storage with constant prefix
        if (self.model.workItemId() && window.localStorage) {
            var dismissedItems = JSON.parse(localStorage.getItem(Constants.STORAGE.DISMISSED_ITEMS) || '{}');
            dismissedItems[self.model.workItemId()] = new Date().toISOString();
            localStorage.setItem(Constants.STORAGE.DISMISSED_ITEMS, JSON.stringify(dismissedItems));
        }
        
        if (event) {
            event.stopPropagation();
        }
        return false;
    };
    
    // Function to open the resume panel
    self.openResumePanel = function(data, event) {
        console.log('[AdvicePausedWidget] Opening resume panel for work item:', self.model.workItemId());
        
        if (!self.model.workItemId()) {
            console.warn("[AdvicePausedWidget] No work item ID available");
            if (window.$ui && window.$ui.showNotification) {
                window.$ui.showNotification('No work item selected', 'warning');
            }
            return false;
        }
        
        // Stop event propagation to prevent any parent handlers
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        // Open the AdvicePauseResumeBlade panel
        var panelOptions = {
            panelId: "Alt.AdviceManagement.AdvicePauseResumeBlade",
            title: "Resume Advice",
            width: 600,
            height: 500,
            modal: true,
            data: {
                workItemId: self.model.workItemId(),
                workItemTitle: self.model.workItemTitle() || 'Work Item',
                mode: 'resume',
                // Pass additional context
                pausedDate: self.model.pausedDate(),
                pausedReason: self.model.pausedReason(),
                pausedBy: self.model.pausedBy()
            },
            onClose: function(result) {
                console.log('[AdvicePausedWidget] Panel closed with result:', result);
                // Refresh status after panel closes
                self.checkAdviceStatus();
                
                // If advice was resumed, dismiss the notification
                if (result && result.resumed) {
                    self.model.isPaused(false);
                    self.model.isDismissed(false);
                }
            },
            onError: function(error) {
                console.error('[AdvicePausedWidget] Panel error:', error);
                if (window.$ui && window.$ui.showError) {
                    window.$ui.showError('Failed to open resume panel: ' + error);
                }
            }
        };
        
        // Flag to track if panel was opened
        var panelOpened = false;
        
        // Try multiple methods to open panel
        try {
            if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
                // Stack manager method - primary method for ShareDo panels
                console.log('[AdvicePausedWidget] Opening panel using $ui.stacks.openPanel');
                
                // Stack manager uses different parameter structure
                var stackConfig = panelOptions.data || {};
                stackConfig.bladeWidth = panelOptions.width;
                
                // Event handlers for stack manager
                var events = {
                    closing: function(resultData) {
                        console.log('[AdvicePausedWidget] Panel closing with data:', resultData);
                        if (panelOptions.onClose) {
                            panelOptions.onClose(resultData);
                        }
                    },
                    cancelled: function() {
                        console.log('[AdvicePausedWidget] Panel cancelled');
                        if (panelOptions.onClose) {
                            panelOptions.onClose({ cancelled: true });
                        }
                    },
                    onShow: function(stack) {
                        console.log('[AdvicePausedWidget] Panel shown, stack:', stack);
                    }
                };
                
                // Call openPanel with proper parameters: systemName, configuration, events, isInNewWindow, refreshExisting
                window.$ui.stacks.openPanel(
                    panelOptions.panelId,  // systemName
                    stackConfig,           // configuration
                    events,               // events
                    false,               // isInNewWindow
                    false               // refreshExisting
                );
                panelOpened = true;
            } else if (window.$ui && window.$ui.panels && window.$ui.panels.open) {
                // New portal UI panels method
                console.log('[AdvicePausedWidget] Opening panel using $ui.panels.open');
                window.$ui.panels.open(panelOptions);
                panelOpened = true;
            } else if (window.$ui && window.$ui.openPanel) {
                // Standard portal UI method
                console.log('[AdvicePausedWidget] Opening panel using $ui.openPanel');
                window.$ui.openPanel(panelOptions);
                panelOpened = true;
            } else if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.openPanel) {
                // Standard ShareDo method
                console.log('[AdvicePausedWidget] Opening panel using ShareDo.UI.openPanel');
                window.ShareDo.UI.openPanel(panelOptions);
                panelOpened = true;
            } else if (window.parent && window.parent.ShareDo && window.parent.ShareDo.UI && window.parent.ShareDo.UI.openPanel) {
                // Parent frame ShareDo method
                console.log('[AdvicePausedWidget] Opening panel using parent.ShareDo.UI.openPanel');
                window.parent.ShareDo.UI.openPanel(panelOptions);
                panelOpened = true;
            } else if (window.top && window.top.ShareDo && window.top.ShareDo.UI && window.top.ShareDo.UI.openPanel) {
                // Top frame ShareDo method
                console.log('[AdvicePausedWidget] Opening panel using top.ShareDo.UI.openPanel');
                window.top.ShareDo.UI.openPanel(panelOptions);
                panelOpened = true;
            } else if (window.$ui && window.$ui.bladeManager && window.$ui.bladeManager.open) {
                // Blade manager method
                console.log('[AdvicePausedWidget] Opening panel using $ui.bladeManager.open');
                window.$ui.bladeManager.open({
                    blade: panelOptions.panelId,
                    title: panelOptions.title,
                    width: panelOptions.width,
                    height: panelOptions.height,
                    modal: panelOptions.modal,
                    data: panelOptions.data,
                    onClose: panelOptions.onClose
                });
                panelOpened = true;
            } else {
                console.error("[AdvicePausedWidget] Unable to open panel - No panel opening mechanism available");
                console.log('[AdvicePausedWidget] Available window properties:', Object.keys(window));
                if (window.$ui) {
                    console.log('[AdvicePausedWidget] Available $ui properties:', Object.keys(window.$ui));
                }
                
                // Last resort - try to show an alert with instructions
                if (window.$ui && window.$ui.showNotification) {
                    window.$ui.showNotification('Please open the Advice Management panel from the main menu to resume advice.', 'info');
                } else {
                    alert('Please open the Advice Management panel from the main menu to resume advice.');
                }
            }
        } catch (error) {
            console.error('[AdvicePausedWidget] Error opening panel:', error);
            if (window.$ui && window.$ui.showError) {
                window.$ui.showError('Failed to open resume panel: ' + error.message);
            } else {
                alert('Failed to open resume panel. Please try again or contact support.');
            }
        }
        
        // Log success if panel was opened
        if (panelOpened) {
            console.log('[AdvicePausedWidget] Panel opened successfully');
            
            // Publish event for tracking
            var EventBus = Alt.AdviceManagement.Common.EventBus;
            if (EventBus && EventBus.publish) {
                EventBus.publish('advice:resumePanelOpened', {
                    workItemId: self.model.workItemId(),
                    from: 'AdvicePausedWidget'
                });
            }
        }
        
        return false; // Prevent default click behavior
    };
    
    // Subscribe to work item changes
    if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.sharedoId) {
        // Subscribe to ShareDo ID changes from page context
        window.$ui.pageContext.sharedoId.subscribe(function(newSharedoId) {
            self.model.workItemId(newSharedoId);
            self.model.isDismissed(false); // Reset dismiss state on context change
            self.checkAdviceStatus();
        });
        
        // Also get the title from context if available
        if (window.$ui.pageContext.sharedoName) {
            self.model.workItemTitle(window.$ui.pageContext.sharedoName());
            window.$ui.pageContext.sharedoName.subscribe(function(newTitle) {
                self.model.workItemTitle(newTitle);
            });
        }
    } else if (baseModel && baseModel.workItemId) {
        // Fallback to baseModel subscription
        self.model.workItemId(baseModel.workItemId);
        
        if (baseModel.workItemId.subscribe) {
            baseModel.workItemId.subscribe(function(newWorkItemId) {
                self.model.workItemId(newWorkItemId);
                self.model.isDismissed(false);
                self.checkAdviceStatus();
            });
        }
    }
    
    // Setup auto-refresh if enabled
    if (options.autoRefresh && options.checkInterval > 0) {
        self.checkIntervalId = setInterval(function() {
            self.checkAdviceStatus();
        }, options.checkInterval);
    }
    
    // Subscribe to advice status change events using ShareDo native event system
    self.initializeEventSubscriptions();
};

/**
 * Initialize event subscriptions using ShareDo native event system
 * Simplified to use only $ui.events for better performance
 */
Alt.AdviceManagement.AdvicePausedWidget.prototype.initializeEventSubscriptions = function() {
    var self = this;
    
    if (!window.$ui || !window.$ui.events) {
        console.warn('[AdvicePausedWidget] ShareDo events not available');
        return;
    }
    
    // Store subscription IDs for cleanup
    self.eventSubscriptions = [];
    
    // Helper function to handle events with work item filtering
    var createEventHandler = function(eventName) {
        return function(data) {
            console.log('[AdvicePausedWidget] Received ' + eventName + ' event:', data);
            if (data && data.workItemId === self.model.workItemId()) {
                self.checkAdviceStatus();
            }
        };
    };
    
    // Subscribe to all relevant events
    var events = ['advice:paused', 'advice:resumed', 'advice:statusChanged', 'advice:statusLoaded'];
    events.forEach(function(eventName) {
        var subscriptionId = $ui.events.subscribe(eventName, 
            createEventHandler(eventName), self);
        self.eventSubscriptions.push(subscriptionId);
    });
    
    console.log('[AdvicePausedWidget] Subscribed to ShareDo events:', events);
};

/**
 * Clean up event subscriptions
 */
Alt.AdviceManagement.AdvicePausedWidget.prototype.cleanupEventSubscriptions = function() {
    var self = this;
    
    if (window.$ui && window.$ui.events && self.eventSubscriptions) {
        self.eventSubscriptions.forEach(function(subscriptionId) {
            if (subscriptionId) {
                $ui.events.unsubscribe(subscriptionId);
            }
        });
        console.log('[AdvicePausedWidget] Cleaned up event subscriptions');
    }
    self.eventSubscriptions = [];
};

/**
 * Clean up when widget is destroyed
 */
Alt.AdviceManagement.AdvicePausedWidget.prototype.onDestroy = function() {
    var self = this;
    
    // Clear interval if exists
    if (self.checkIntervalId) {
        clearInterval(self.checkIntervalId);
        self.checkIntervalId = null;
    }
    
    // Remove keyboard event handlers
    $(self.element).off('keydown', '.advice-paused-notification');
    
    // Unsubscribe from ShareDo EventManager events
    self.cleanupEventSubscriptions();
    
    // Clean up subscriptions
    if (self.model) {
        for (var prop in self.model) {
            if (self.model[prop] && typeof self.model[prop].dispose === 'function') {
                self.model[prop].dispose();
            }
        }
    }
    
    // Publish widget destroyed event
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Constants = Alt.AdviceManagement.Common.Constants;
    EventBus.publish(Constants.EVENTS.WIDGET_DESTROYED, {
        widget: 'AdvicePausedWidget',
        workItemId: self.model.workItemId()
    });
};

/**
 * Load data after widget is bound
 */
Alt.AdviceManagement.AdvicePausedWidget.prototype.loadAndBind = function() {
    var self = this;
    
    // Publish widget loaded event
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Constants = Alt.AdviceManagement.Common.Constants;
    EventBus.publish(Constants.EVENTS.WIDGET_LOADED, {
        widget: 'AdvicePausedWidget',
        workItemId: self.model.workItemId()
    });
    
    // Add keyboard support for accessibility
    $(self.element).on('keydown', '.advice-paused-notification', function(e) {
        // Handle Enter and Space keys to open panel
        if (e.which === 13 || e.which === 32) {
            e.preventDefault();
            self.openResumePanel(null, e);
        }
    });
    
    // Initial check for advice status
    self.checkAdviceStatus();
};