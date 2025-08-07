namespace("Alt.AdviceManagement");

/**
 * AdvicePausedWidget - Shows notification when advice is paused
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdvicePausedWidget = function(element, configuration, baseModel) {
    var self = this;
    var defaults = {
        checkInterval: 30000, // Check every 30 seconds
        showReason: true,
        autoRefresh: true
    };
    var options = $.extend(true, {}, defaults, configuration);
    
    // Setup the model with KnockoutJS observables
    self.model = {
        isPaused: ko.observable(false),
        pausedDate: ko.observable(""),
        pausedReason: ko.observable(""),
        pausedBy: ko.observable(""),
        pausedDuration: ko.observable(""),
        isUrgent: ko.observable(false),
        isDismissed: ko.observable(false),
        workItemId: ko.observable(baseModel.workItemId || null),
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
        
        self.model.isLoading(true);
        
        // Call API to check if advice is paused
        $.ajax({
            url: '/api/v1/public/workItem/' + self.model.workItemId() + '/attributes',
            type: 'GET',
            success: function(response) {
                if (response && response.attributes) {
                    var adviceStatus = response.attributes['AdviceStatus'];
                    var pausedDate = response.attributes['AdvicePausedDate'];
                    var pausedReason = response.attributes['AdvicePausedReason'];
                    var pausedBy = response.attributes['AdvicePausedBy'];
                    
                    if (adviceStatus && adviceStatus.toLowerCase() === 'paused' && !self.model.isDismissed()) {
                        self.model.isPaused(true);
                        
                        // Format the paused date and calculate duration
                        if (pausedDate) {
                            var date = new Date(pausedDate);
                            self.model.pausedDate("Paused on " + date.toLocaleDateString() + " at " + date.toLocaleTimeString());
                            
                            // Calculate and set duration
                            var duration = self.calculateDuration(pausedDate);
                            self.model.pausedDuration("Paused for " + duration);
                            
                            // Check if urgent (paused for more than 24 hours)
                            var hoursPaused = (new Date() - date) / (1000 * 60 * 60);
                            self.model.isUrgent(hoursPaused > 24);
                        } else {
                            self.model.pausedDate("Advice is currently paused");
                            self.model.pausedDuration("");
                        }
                        
                        if (pausedBy) {
                            self.model.pausedBy(pausedBy);
                        }
                        
                        if (options.showReason && pausedReason) {
                            self.model.pausedReason(pausedReason);
                        }
                    } else {
                        // Advice is not paused, hide the widget
                        self.model.isPaused(false);
                        self.model.isDismissed(false); // Reset dismiss state
                    }
                }
                self.model.isLoading(false);
            },
            error: function() {
                console.error("Failed to check advice status");
                self.model.isLoading(false);
                self.model.isPaused(false);
            }
        });
    };
    
    // Dismiss notification
    self.dismissNotification = function(data, event) {
        self.model.isDismissed(true);
        self.model.isPaused(false);
        
        // Store dismiss state in session storage
        if (self.model.workItemId() && window.sessionStorage) {
            sessionStorage.setItem('advice-dismissed-' + self.model.workItemId(), 'true');
        }
        
        if (event) {
            event.stopPropagation();
        }
        return false;
    };
    
    // Function to open the resume panel
    self.openResumePanel = function() {
        if (!self.model.workItemId()) {
            console.warn("No work item ID available");
            return;
        }
        
        // Open the AdvicePauseResumeBlade panel
        var panelOptions = {
            panelId: "Alt.AdviceManagement.AdvicePauseResumeBlade",
            title: "Resume Advice",
            width: 600,
            height: 400,
            modal: true,
            data: {
                workItemId: self.model.workItemId(),
                mode: 'resume'
            },
            onClose: function() {
                // Refresh status after panel closes
                self.checkAdviceStatus();
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
        
        // Subscribe to work item changes if available
        if (baseModel.workItemId.subscribe) {
            baseModel.workItemId.subscribe(function(newWorkItemId) {
                self.model.workItemId(newWorkItemId);
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
Alt.AdviceManagement.AdvicePausedWidget.prototype.loadAndBind = function() {
    var self = this;
    
    // Initial check for advice status
    self.checkAdviceStatus();
};