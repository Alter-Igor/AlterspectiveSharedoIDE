namespace("Alt.AdviceManagement");

/**
 * Designer for AdvicePausedWidget configuration
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Current widget configuration
 * @param {Object} baseModel - Base designer model
 */
Alt.AdviceManagement.AdvicePausedWidgetDesigner = function(element, configuration, baseModel) {
    var self = this;
    var defaults = {
        checkInterval: 30000,
        showReason: true,
        autoRefresh: true
    };
    var options = $.extend(true, {}, defaults, configuration);
    
    // Setup the model with KnockoutJS observables
    self.model = {
        checkInterval: ko.observable(options.checkInterval),
        showReason: ko.observable(options.showReason),
        autoRefresh: ko.observable(options.autoRefresh)
    };
    
    // Store references
    self.element = element;
    self.baseModel = baseModel;
    
    // Validation
    self.validationErrorCount = ko.pureComputed(function() {
        var errors = 0;
        
        // Validate check interval
        var interval = parseInt(self.model.checkInterval());
        if (self.model.autoRefresh() && (isNaN(interval) || interval < 5000)) {
            errors++;
        }
        
        return errors;
    });
    
    // Subscribe to validation changes
    if (baseModel && baseModel.validationErrorCount) {
        self.validationErrorCount.subscribe(function(newValue) {
            baseModel.validationErrorCount(newValue);
        });
        
        // Set initial validation state
        baseModel.validationErrorCount(self.validationErrorCount());
    }
};

/**
 * Get the configuration model
 * @returns {Object} Configuration object for the widget
 */
Alt.AdviceManagement.AdvicePausedWidgetDesigner.prototype.getModel = function() {
    var self = this;
    
    return {
        checkInterval: parseInt(self.model.checkInterval()),
        showReason: self.model.showReason(),
        autoRefresh: self.model.autoRefresh()
    };
};

/**
 * Clean up when designer is destroyed
 */
Alt.AdviceManagement.AdvicePausedWidgetDesigner.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up subscriptions
    if (self.validationErrorCount) {
        self.validationErrorCount.dispose();
    }
    
    if (self.model) {
        for (var prop in self.model) {
            if (self.model[prop] && typeof self.model[prop].dispose === 'function') {
                self.model[prop].dispose();
            }
        }
    }
};

/**
 * Load data after designer is bound
 */
Alt.AdviceManagement.AdvicePausedWidgetDesigner.prototype.loadAndBind = function() {
    // No additional loading required for designer
};