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
        $.when(
            cachedWorkItem ? $.Deferred().resolve(cachedWorkItem) : $.ajax({
                url: Constants.API.BASE_URL + '/workItem/' + self.model.workItemId(),
                type: 'GET',
                timeout: Constants.API.TIMEOUT
            }),
            cachedAttributes ? $.Deferred().resolve(cachedAttributes) : $.ajax({
                url: Constants.API.BASE_URL + '/workItem/' + self.model.workItemId() + '/attributes',
                type: 'GET',
                timeout: Constants.API.TIMEOUT
            }),
            cachedHistory ? $.Deferred().resolve(cachedHistory) : $.ajax({
                url: Constants.API.BASE_URL + '/workItem/' + self.model.workItemId() + '/history',
                type: 'GET',
                timeout: Constants.API.TIMEOUT
            })
        ).done(function(workItemResponse, attributesResponse, historyResponse) {
            // Handle both cached and fresh responses
            var workItem = workItemResponse[0] || workItemResponse;
            var attributes = (attributesResponse[0] && attributesResponse[0].attributes) || attributesResponse.attributes || attributesResponse || {};
            var history = (historyResponse[0] && historyResponse[0].history) || historyResponse.history || historyResponse || [];
            
            // Cache the fresh data
            if (!cachedWorkItem && workItem) {
                Cache.set('workItem', self.model.workItemId(), workItem, Constants.API.CACHE_TTL);
            }
            if (!cachedAttributes) {
                Cache.set('workItemAttributes', self.model.workItemId(), attributes, Constants.API.CACHE_TTL);
            }
            if (!cachedHistory) {
                Cache.set('workItemHistory', self.model.workItemId(), history, Constants.API.CACHE_TTL);
            }
            
            self.processSummaryData(workItem, attributes, history);
        }).fail(function() {
            console.error("Failed to load advice summary");
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
            
            // Set status
            var adviceStatus = attributes['AdviceStatus'];
            if (adviceStatus && adviceStatus.toLowerCase() === Constants.STATUS.PAUSED) {
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
            
            // Set last action
            var lastActionDate = attributes['AdviceLastActionDate'];
            var lastActionType = attributes['AdviceLastActionType'];
            if (lastActionDate) {
                var actionText = (lastActionType || 'Updated') + ' on ' + self.formatDate(lastActionDate);
                self.model.lastAction(actionText);
            } else {
                self.model.lastAction('No recent actions');
            }
            
            // Set next scheduled action
            var nextAction = attributes['AdviceNextScheduledAction'];
            if (nextAction) {
                self.model.nextScheduledAction(self.formatDate(nextAction));
            } else {
                self.model.nextScheduledAction('');
            }
            
            // Calculate statistics
            var startDate = attributes['AdviceStartDate'];
            if (startDate) {
                var start = new Date(startDate);
                var now = new Date();
                self.model.daysActive(self.daysBetween(start, now));
            }
            
            // Count pause events from history
            var pauseCount = 0;
            history.forEach(function(event) {
                if (event.action === 'advice_paused') {
                    pauseCount++;
                }
            });
            self.model.timesPaused(pauseCount);
            
            // Calculate completion percentage
            var progress = attributes['AdviceCompletionPercent'];
            if (progress !== undefined && progress !== null) {
                self.model.completionPercent(progress + '%');
                self.model.completionValue(progress);
            } else {
                // Estimate based on time if no explicit progress
                var estimatedDuration = attributes['AdviceEstimatedDuration'];
                if (estimatedDuration && startDate) {
                    var elapsed = self.daysBetween(new Date(startDate), new Date());
                    var percent = Math.min(100, Math.round((elapsed / estimatedDuration) * 100));
                    self.model.completionPercent(percent + '%');
                    self.model.completionValue(percent);
                } else {
                    self.model.completionPercent('N/A');
                    self.model.completionValue(0);
                }
            }
        
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