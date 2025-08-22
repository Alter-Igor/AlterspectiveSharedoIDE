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
 * Designer widget for the PauseTasks workflow action
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from workflow designer
 * @param {Object} baseModel - Base model from workflow designer
 */
Alt.PhaseManagement.PauseTasksDesigner = function(element, configuration, baseModel) {
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
    
    /**
     * Toggle advanced options visibility
     */
    self.toggleAdvancedOptions = function() {
        self.showAdvancedOptions(!self.showAdvancedOptions());
    };
    
    /**
     * Add a phase to exclude list
     */
    self.addExcludePhase = function() {
        var newPhase = prompt("Enter phase name to exclude:");
        if (newPhase && newPhase.trim()) {
            if (!self.action.config.excludePhases) {
                self.action.config.excludePhases = ko.observableArray([]);
            }
            self.action.config.excludePhases.push(newPhase.trim());
        }
    };
    
    /**
     * Remove a phase from exclude list
     */
    self.removeExcludePhase = function(phase) {
        if (self.action.config.excludePhases) {
            self.action.config.excludePhases.remove(phase);
        }
    };
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("PauseTasksDesigner - INITIALIZING");
        $ui.log.debug("  Action available: " + !!self.action);
        $ui.log.debug("  Model available: " + !!self.model);
        $ui.log.debug("  Config: " + JSON.stringify(self.action.config));
    }
};