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
    
    // Store action information for help blade
    self.actionInfo = Alt.AdviceManagement.AdviceStatusCheckerInfo;
    
    /**
     * Show help information blade
     */
    self.showInfo = function(tab) {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceStatusCheckerDesigner - Opening help blade");
            $ui.log.debug("  Initial tab: " + (tab || 'overview'));
        }
        
        try {
            // Prepare blade configuration
            var bladeConfig = {
                actionInfo: self.actionInfo,
                initialTab: tab || 'overview'
            };
            
            // Open help blade using correct ShareDo StackManager pattern
            if ($ui && $ui.stacks && $ui.stacks.openPanel) {
                // Add blade width to configuration
                bladeConfig.bladeWidth = 900;
                
                var events = {
                    onShow: function(stack) {
                        if ($ui && $ui.log && $ui.log.debug) {
                            $ui.log.debug("AdviceStatusCheckerDesigner - Help blade opened successfully");
                        }
                    }
                };
                
                $ui.stacks.openPanel('Alt.AdviceManagement.WorkflowActionHelpBlade', bladeConfig, events);
                
            } else {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error("AdviceStatusCheckerDesigner - $ui.stacks.openPanel not available");
                    $ui.log.error("  Available $ui methods: " + JSON.stringify(Object.keys($ui || {})));
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusCheckerDesigner - Error opening help blade: " + error.message);
                $ui.log.error("  Error stack: " + (error.stack || 'No stack trace'));
            }
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
    
    // Clean up resources
    
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceStatusCheckerDesigner - Destroyed");
    }
};