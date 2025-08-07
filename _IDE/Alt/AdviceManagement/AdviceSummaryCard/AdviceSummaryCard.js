namespace("Alt.AdviceManagement");

/**
 * AdviceSummaryCard - Compact card showing current advice state
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdviceSummaryCard = function(element, configuration, baseModel) {
    var self = this;
    var defaults = {
        refreshInterval: 60000, // Refresh every minute
        showProgressBar: true,
        showStats: true,
        compactMode: false
    };
    var options = $.extend(true, {}, defaults, configuration);
    
    // Setup the model with KnockoutJS observables
    self.model = {
        // Status
        status: ko.observable('active'), // 'active' or 'paused'
        statusLabel: ko.observable('Active'),
        workItemId: ko.observable(baseModel.workItemId || null),
        workItemTitle: ko.observable('Loading...'),
        
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
        
        // Load work item details and advice attributes
        $.when(
            $.ajax({
                url: '/api/v1/public/workItem/' + self.model.workItemId(),
                type: 'GET'
            }),
            $.ajax({
                url: '/api/v1/public/workItem/' + self.model.workItemId() + '/attributes',
                type: 'GET'
            }),
            $.ajax({
                url: '/api/v1/public/workItem/' + self.model.workItemId() + '/history',
                type: 'GET'
            })
        ).done(function(workItemResponse, attributesResponse, historyResponse) {
            var workItem = workItemResponse[0];
            var attributes = attributesResponse[0].attributes || {};
            var history = historyResponse[0].history || [];
            
            // Set work item title
            if (workItem && workItem.title) {
                self.model.workItemTitle(workItem.title);
            }
            
            // Set status
            var adviceStatus = attributes['AdviceStatus'];
            if (adviceStatus && adviceStatus.toLowerCase() === 'paused') {
                self.model.status('paused');
                self.model.statusLabel('Paused');
            } else {
                self.model.status('active');
                self.model.statusLabel('Active');
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
        }).fail(function() {
            console.error("Failed to load advice summary");
            self.model.isLoading(false);
        });
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
    if (baseModel && baseModel.workItemId) {
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
};

/**
 * Load data after widget is bound
 */
Alt.AdviceManagement.AdviceSummaryCard.prototype.loadAndBind = function() {
    var self = this;
    
    // Initial load
    self.loadAdviceSummary();
};