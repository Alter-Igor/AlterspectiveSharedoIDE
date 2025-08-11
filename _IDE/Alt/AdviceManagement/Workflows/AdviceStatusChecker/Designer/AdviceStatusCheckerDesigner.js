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
 * Designer widget for the AdviceStatusChecker workflow action
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from workflow designer
 * @param {Object} baseModel - Base model from workflow designer
 */
Alt.AdviceManagement.AdviceStatusCheckerDesigner = function(element, configuration, baseModel) {
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
    
    // Initialize information modal
    self.infoModal = new Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal(
        Alt.AdviceManagement.AdviceStatusCheckerInfo
    );
    
    /**
     * Show information modal
     */
    self.showInfo = function(tab) {
        if (self.infoModal) {
            self.infoModal.show(tab);
        }
    };
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceStatusCheckerDesigner - INITIALIZING");
        $ui.log.debug("  Action available: " + !!self.action);
        $ui.log.debug("  Model available: " + !!self.model);
    }
};

/**
 * Called when the designer is being bound to the DOM
 */
Alt.AdviceManagement.AdviceStatusCheckerDesigner.prototype.loadAndBind = function() {
    var self = this;
    // Designer is ready - the HTML template handles the binding to actionModel.config
};

/**
 * Called when the designer is being destroyed
 */
Alt.AdviceManagement.AdviceStatusCheckerDesigner.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up modal
    if (self.infoModal) {
        self.infoModal.hide();
    }
    
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceStatusCheckerDesigner - Destroyed");
    }
};