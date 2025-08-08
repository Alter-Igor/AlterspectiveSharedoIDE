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
 * AdviceSummaryCard - Compact card showing current advice state
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdviceSummaryCard = function(element, configuration, baseModel) {
    var self = this;
    
    // Check if Foundation Bundle is loaded
    if (!Alt.AdviceManagement.Common || !Alt.AdviceManagement.Common.Constants) {
        console.error('[AdviceSummaryCard] Foundation Bundle not loaded. Please ensure common modules are included.');
        // Provide fallback defaults
        Alt.AdviceManagement.Common = Alt.AdviceManagement.Common || {};
        Alt.AdviceManagement.Common.Constants = Alt.AdviceManagement.Common.Constants || {
            WIDGETS: { SUMMARY_CARD: { REFRESH_INTERVAL: 60000, SHOW_PROGRESS_BAR: true, SHOW_STATS: true, COMPACT_MODE: false } },
            API: { BASE_URL: '/api/v1/public', TIMEOUT: 30000, CACHE_TTL: 5000 },
            STATUS: { PAUSED: 'paused', ACTIVE: 'active' },
            EVENTS: { ADVICE_STATUS_CHANGED: 'advice:statusChanged', ADVICE_ERROR: 'advice:error', WIDGET_LOADED: 'widget:loaded', WIDGET_DESTROYED: 'widget:destroyed' }
        };
        Alt.AdviceManagement.Common.EventBus = Alt.AdviceManagement.Common.EventBus || { publish: function() {}, subscribe: function() { return { unsubscribe: function() {} }; } };
        Alt.AdviceManagement.Common.CacheManager = Alt.AdviceManagement.Common.CacheManager || { get: function() { return null; }, set: function() {}, remove: function() {} };
    }
    
    // Import Foundation Bundle components
    var Constants = Alt.AdviceManagement.Common.Constants;
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Cache = Alt.AdviceManagement.Common.CacheManager;
    
    var defaults = Constants.WIDGETS.SUMMARY_CARD;
    var options = $.extend(true, {}, defaults, configuration);
    
    // Get work item ID and title from context
    self.getWorkItemContext = function() {
        var context = {
            id: null,
            title: 'Loading...',
            reference: ''
        };
        
        // Try to get from $ui.pageContext (portal context)
        if (window.$ui && window.$ui.pageContext) {
            var pageContext = window.$ui.pageContext;
            
            if (pageContext.sharedoId) {
                context.id = pageContext.sharedoId();
            }
            
            if (pageContext.sharedoName) {
                context.title = pageContext.sharedoName() || 'Loading...';
            }
            
            // Get matter reference if available
            if (pageContext.matterSummary && pageContext.matterSummary.matterReference) {
                context.reference = pageContext.matterSummary.matterReference();
            }
        }
        
        // Fallback to baseModel if provided
        if (!context.id && baseModel && baseModel.workItemId) {
            context.id = ko.unwrap(baseModel.workItemId);
        }
        
        return context;
    };
    
    var initialContext = self.getWorkItemContext();
    
    // Setup the model with KnockoutJS observables
    self.model = {
        // Status
        status: ko.observable('active'), // 'active' or 'paused'
        statusLabel: ko.observable('Active'),
        workItemId: ko.observable(initialContext.id),
        workItemTitle: ko.observable(initialContext.title),
        workItemReference: ko.observable(initialContext.reference),
        
        // Action tracking
        lastAction: ko.observable(''),
        nextScheduledAction: ko.observable(''),
        
        // Statistics
        daysActive: ko.observable(0),
        timesPaused: ko.observable(0),
        completionPercent: ko.observable('0%'),
        completionValue: ko.observable(0),
        
        // UI state
        isLoading: ko.observable(false),
        showProgressBar: ko.observable(options.showProgressBar),
        showStats: ko.observable(options.showStats)
    };
    
    // Store references
    self.element = element;
    self.baseModel = baseModel;
    self.options = options;
    self.refreshIntervalId = null;
    
    // Calculate days between dates
    self.daysBetween = function(date1, date2) {
        var oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    };
    
    // Format date for display
    self.formatDate = function(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };
    
    // Load advice summary data
    self.loadAdviceSummary = function() {
        if (!self.model.workItemId()) {
            return;
        }
        
        self.model.isLoading(true);
        
        // Check cache first for all data
        var cachedWorkItem = Cache.get('workItem', self.model.workItemId());
        var cachedAttributes = Cache.get('workItemAttributes', self.model.workItemId());
        var cachedHistory = Cache.get('workItemHistory', self.model.workItemId());
        
        if (cachedWorkItem && cachedAttributes && cachedHistory) {
            self.processSummaryData(cachedWorkItem, cachedAttributes, cachedHistory);
            return;
        }
        
        // Load work item details and advice attributes
        Promise.all([
            cachedWorkItem ? Promise.resolve(cachedWorkItem) : 
                $ajax.api.get('/api/v1/public/workItem/' + self.model.workItemId(), { displayErrors: false })
                    .catch(function(error) {
                        console.error('Failed to load work item', self.model.workItemId(), error);
                        return null; // Return null if work item can't be loaded
                    }),
            cachedAttributes ? Promise.resolve(cachedAttributes) : 
                $ajax.api.get('/api/v1/public/workItem/' + self.model.workItemId() + '/attributes', { displayErrors: false })
                    .catch(function(error) {
                        // Attributes might not be available - that's OK
                        if (error.status === 404) {
                            console.log('Attributes endpoint not available for work item', self.model.workItemId());
                        }
                        return {}; // Return empty attributes object on error
                    }),
            cachedHistory ? Promise.resolve(cachedHistory) : 
                // History endpoint doesn't exist in current API - return empty history
                // This is a placeholder for future history implementation
                Promise.resolve({ history: [] })
        ]
        ).then(function(results) {
            // Handle both cached and fresh responses
            var workItem = results[0];
            var attributes = results[1] || {}; // Response IS the attributes object
            var history = results[2] && (results[2].history || results[2]) || [];
            
            // Check if work item loaded successfully
            if (!workItem) {
                console.error('Could not load work item', self.model.workItemId());
                self.model.isLoading(false);
                self.model.hasError(true);
                return;
            }
            
            // Cache the fresh data
            if (!cachedWorkItem && workItem) {
                Cache.set('workItem', self.model.workItemId(), workItem, Constants.API.CACHE_TTL);
            }
            if (!cachedAttributes && attributes) {
                Cache.set('workItemAttributes', self.model.workItemId(), attributes, Constants.API.CACHE_TTL);
            }
            if (!cachedHistory && history && history.length > 0) {
                Cache.set('workItemHistory', self.model.workItemId(), history, Constants.API.CACHE_TTL);
            }
            
            self.processSummaryData(workItem, attributes, history);
        }).catch(function(error) {
            console.error("Failed to load advice summary", error);
            self.model.isLoading(false);
            EventBus.publish(Constants.EVENTS.ADVICE_ERROR, {
                workItemId: self.model.workItemId(),
                error: 'Failed to load advice summary'
            });
        });
    };
    
    // Process summary data
    self.processSummaryData = function(workItem, attributes, history) {
            
            // Set work item title if not already set from context
            if (workItem && workItem.title && (!window.$ui || !window.$ui.pageContext || !window.$ui.pageContext.sharedoName)) {
                self.model.workItemTitle(workItem.title);
            }
            
            // Set status using registered attribute name
            var adviceEnabled = attributes['alt_ongoing_advice_enabled'];
            if (adviceEnabled === 'false') {
                self.model.status(Constants.STATUS.PAUSED);
                self.model.statusLabel('Paused');
                EventBus.publish(Constants.EVENTS.ADVICE_STATUS_CHANGED, {
                    workItemId: self.model.workItemId(),
                    status: Constants.STATUS.PAUSED
                });
            } else {
                self.model.status(Constants.STATUS.ACTIVE);
                self.model.statusLabel('Active');
                EventBus.publish(Constants.EVENTS.ADVICE_STATUS_CHANGED, {
                    workItemId: self.model.workItemId(),
                    status: Constants.STATUS.ACTIVE
                });
            }
            
            // Set last action based on pause/resume dates
            var pausedDate = attributes['alt_ongoing_advice_paused_date'];
            var resumedDate = attributes['alt_ongoing_advice_resumed_date'];
            
            // Determine which is more recent
            if (pausedDate || resumedDate) {
                var pausedTime = pausedDate ? new Date(pausedDate).getTime() : 0;
                var resumedTime = resumedDate ? new Date(resumedDate).getTime() : 0;
                
                if (pausedTime > resumedTime) {
                    self.model.lastAction('Paused on ' + self.formatDate(pausedDate));
                } else if (resumedTime > 0) {
                    self.model.lastAction('Resumed on ' + self.formatDate(resumedDate));
                } else {
                    self.model.lastAction('No recent actions');
                }
            } else {
                self.model.lastAction('No recent actions');
            }
            
            // Set next scheduled action
            var nextDate = attributes['alt_ongoing_advice_next_date'];
            if (nextDate && nextDate !== '') {
                self.model.nextScheduledAction(self.formatDate(nextDate));
            } else {
                self.model.nextScheduledAction('');
            }
            
            // Calculate statistics based on work item creation or first resume
            var resumedDate = attributes['alt_ongoing_advice_resumed_date'];
            if (resumedDate) {
                var start = new Date(resumedDate);
                var now = new Date();
                self.model.daysActive(self.daysBetween(start, now));
            } else if (workItem && workItem.createdDate) {
                var start = new Date(workItem.createdDate);
                var now = new Date();
                self.model.daysActive(self.daysBetween(start, now));
            }
            
            // Count pause events - for now just check if currently paused
            // In future, maintain a counter attribute if needed
            var pauseCount = 0;
            if (attributes['alt_ongoing_advice_paused_date']) {
                pauseCount = 1; // At least one pause event
            }
            
            // If history becomes available in the future, count from there
            if (history && history.length > 0) {
                pauseCount = 0;
                history.forEach(function(event) {
                    if (event.action === 'advice_paused') {
                        pauseCount++;
                    }
                });
            }
            self.model.timesPaused(pauseCount);
            
            // Completion percentage - not tracked in registered attributes
            // Set to N/A as we don't have this data
            self.model.completionPercent('N/A');
            self.model.completionValue(0);
        
        self.model.isLoading(false);
    };
    
    // Refresh status
    self.refreshStatus = function() {
        self.loadAdviceSummary();
    };
    
    // Pause advice
    self.pauseAdvice = function() {
        self.openAdvicePanel('pause');
    };
    
    // Resume advice
    self.resumeAdvice = function() {
        self.openAdvicePanel('resume');
    };
    
    // View details
    self.viewDetails = function() {
        self.openAdvicePanel('view');
    };
    
    // Open advice panel
    self.openAdvicePanel = function(mode) {
        if (!self.model.workItemId()) {
            console.warn("No work item ID available");
            return;
        }
        
        var panelOptions = {
            panelId: "Alt.AdviceManagement.AdvicePauseResumeBlade",
            title: mode === 'pause' ? "Pause Advice" : mode === 'resume' ? "Resume Advice" : "Advice Details",
            width: 600,
            height: 400,
            modal: true,
            data: {
                workItemId: self.model.workItemId(),
                mode: mode
            },
            onClose: function() {
                // Refresh after panel closes
                self.loadAdviceSummary();
            }
        };
        
        // Use ShareDo panel opening mechanism
        if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.openPanel) {
            window.ShareDo.UI.openPanel(panelOptions);
        } else if (window.parent && window.parent.ShareDo && window.parent.ShareDo.UI && window.parent.ShareDo.UI.openPanel) {
            window.parent.ShareDo.UI.openPanel(panelOptions);
        } else {
            console.error("Unable to open panel - ShareDo.UI.openPanel not available");
        }
    };
    
    // Subscribe to work item changes
    if (window.$ui && window.$ui.pageContext) {
        var pageContext = window.$ui.pageContext;
        
        // Subscribe to ShareDo ID changes
        if (pageContext.sharedoId && pageContext.sharedoId.subscribe) {
            pageContext.sharedoId.subscribe(function(newSharedoId) {
                self.model.workItemId(newSharedoId);
                self.loadAdviceSummary();
            });
        }
        
        // Subscribe to title changes
        if (pageContext.sharedoName && pageContext.sharedoName.subscribe) {
            pageContext.sharedoName.subscribe(function(newTitle) {
                self.model.workItemTitle(newTitle || 'Loading...');
            });
        }
        
        // Subscribe to reference changes if available
        if (pageContext.matterSummary && pageContext.matterSummary.matterReference && 
            pageContext.matterSummary.matterReference.subscribe) {
            pageContext.matterSummary.matterReference.subscribe(function(newRef) {
                self.model.workItemReference(newRef);
            });
        }
    } else if (baseModel && baseModel.workItemId) {
        // Fallback to baseModel subscription
        self.model.workItemId(baseModel.workItemId);
        
        if (baseModel.workItemId.subscribe) {
            baseModel.workItemId.subscribe(function(newWorkItemId) {
                self.model.workItemId(newWorkItemId);
                self.loadAdviceSummary();
            });
        }
    }
    
    // Setup auto-refresh
    if (options.refreshInterval > 0) {
        self.refreshIntervalId = setInterval(function() {
            self.loadAdviceSummary();
        }, options.refreshInterval);
    }
    
    // Subscribe to advice status change events using ShareDo native event system
    self.initializeEventSubscriptions();
};

/**
 * Initialize event subscriptions using ShareDo native event system
 */
Alt.AdviceManagement.AdviceSummaryCard.prototype.initializeEventSubscriptions = function() {
    var self = this;
    
    if (!window.$ui || !window.$ui.events) {
        console.warn('[AdviceSummaryCard] ShareDo events not available');
        return;
    }
    
    // Store subscription IDs for cleanup
    self.eventSubscriptions = [];
    
    // Helper function to handle events with work item filtering
    var createEventHandler = function(eventName) {
        return function(data) {
            console.log('[AdviceSummaryCard] Received ' + eventName + ' event:', data);
            if (data && data.workItemId === self.model.workItemId()) {
                self.loadAdviceSummary();
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
    
    console.log('[AdviceSummaryCard] Subscribed to ShareDo events:', events);
};

/**
 * Clean up event subscriptions
 */
Alt.AdviceManagement.AdviceSummaryCard.prototype.cleanupEventSubscriptions = function() {
    var self = this;
    
    if (window.$ui && window.$ui.events && self.eventSubscriptions) {
        self.eventSubscriptions.forEach(function(subscriptionId) {
            if (subscriptionId) {
                $ui.events.unsubscribe(subscriptionId);
            }
        });
        console.log('[AdviceSummaryCard] Cleaned up event subscriptions');
    }
    self.eventSubscriptions = [];
};

/**
 * Clean up when widget is destroyed
 */
Alt.AdviceManagement.AdviceSummaryCard.prototype.onDestroy = function() {
    var self = this;
    
    // Clear interval
    if (self.refreshIntervalId) {
        clearInterval(self.refreshIntervalId);
        self.refreshIntervalId = null;
    }
    
    // Unsubscribe from events
    // Clean up event subscriptions
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
        widget: 'AdviceSummaryCard',
        workItemId: self.model.workItemId()
    });
};

/**
 * Load data after widget is bound
 */
Alt.AdviceManagement.AdviceSummaryCard.prototype.loadAndBind = function() {
    var self = this;
    
    // Publish widget loaded event
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Constants = Alt.AdviceManagement.Common.Constants;
    EventBus.publish(Constants.EVENTS.WIDGET_LOADED, {
        widget: 'AdviceSummaryCard',
        workItemId: self.model.workItemId()
    });
    
    // Initial load
    self.loadAdviceSummary();
};