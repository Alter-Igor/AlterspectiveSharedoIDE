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
namespace("Alt.PhaseManagement");

/**
 * Designer widget for the ResumeTasks workflow action
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from workflow designer
 * @param {Object} baseModel - Base model from workflow designer
 */
Alt.PhaseManagement.ResumeTasksDesigner = function(element, configuration, baseModel) {
    var self = this;
    
    var defaults = {
        // The action node from the workflow model
        node: null,
        
        // The overall workflow editor model
        model: null
    };
    
    var options = $.extend(true, {}, defaults, configuration);
    
    // Store the action in this view model ready for the widget template to render it
    self.action = options.node;
    
    // Reference the workflow model as well, for the variable pickers
    self.model = options.model;
    
    // Initialize advanced options visibility
    self.showAdvancedOptions = ko.observable(false);
    
    // Initialize due date options visibility
    self.showDueDateOptions = ko.observable(false);
    
    /**
     * Toggle advanced options visibility
     */
    self.toggleAdvancedOptions = function() {
        self.showAdvancedOptions(!self.showAdvancedOptions());
    };
    
    /**
     * Toggle due date options visibility
     */
    self.toggleDueDateOptions = function() {
        self.showDueDateOptions(!self.showDueDateOptions());
    };
    
    /**
     * Clear due date adjustment
     */
    self.clearDueDateAdjustment = function() {
        if (self.action.config.adjustDueDateBy) {
            self.action.config.adjustDueDateBy(null);
        }
    };
    
    /**
     * Clear new due date variable
     */
    self.clearNewDueDateVariable = function() {
        if (self.action.config.newDueDateVariable) {
            self.action.config.newDueDateVariable("");
        }
    };
    
    // Watch for changes to ensure only one due date method is used
    if (self.action.config.newDueDateVariable) {
        self.action.config.newDueDateVariable.subscribe(function(newValue) {
            if (newValue && newValue.trim() !== "") {
                // Clear adjustment if variable is set
                self.clearDueDateAdjustment();
            }
        });
    }
    
    if (self.action.config.adjustDueDateBy) {
        self.action.config.adjustDueDateBy.subscribe(function(newValue) {
            if (newValue !== null && newValue !== undefined && newValue !== "") {
                // Clear variable if adjustment is set
                self.clearNewDueDateVariable();
            }
        });
    }
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("ResumeTasksDesigner - INITIALIZING");
        $ui.log.debug("  Action available: " + !!self.action);
        $ui.log.debug("  Model available: " + !!self.model);
        $ui.log.debug("  Config: " + JSON.stringify(self.action.config));
    }
};