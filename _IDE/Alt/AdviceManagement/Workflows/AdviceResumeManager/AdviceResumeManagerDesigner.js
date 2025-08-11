namespace("Alt.AdviceManagement");

/**
 * AdviceResumeManagerDesigner - Designer widget for configuring the Advice Resume Manager workflow action
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from workflow designer
 * @param {Object} baseModel - Base model from workflow designer
 */
Alt.AdviceManagement.AdviceResumeManagerDesigner = function(element, configuration, baseModel) {
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
    self.actionInfo = Alt.AdviceManagement.AdviceResumeManagerInfo;
    
    /**
     * Show help information blade
     */
    self.showInfo = function(tab) {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceResumeManagerDesigner - Opening help blade");
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
                            $ui.log.debug("AdviceResumeManagerDesigner - Help blade opened successfully");
                        }
                    }
                };
                
                $ui.stacks.openPanel('Alt.AdviceManagement.WorkflowActionHelpBlade', bladeConfig, events);
                
            } else {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error("AdviceResumeManagerDesigner - $ui.stacks.openPanel not available");
                    $ui.log.error("  Available $ui methods: " + JSON.stringify(Object.keys($ui || {})));
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceResumeManagerDesigner - Error opening help blade: " + error.message);
                $ui.log.error("  Error stack: " + (error.stack || 'No stack trace'));
            }
        }
    };
    
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceResumeManagerDesigner - INITIALIZING");
        $ui.log.debug("  Action available: " + !!self.action);
        $ui.log.debug("  Model available: " + !!self.model);
    }
};

/**
 * Called when the designer is being bound to the DOM
 */
Alt.AdviceManagement.AdviceResumeManagerDesigner.prototype.loadAndBind = function() {
    var self = this;
    // Designer is ready - the HTML template handles the binding to actionModel.config
};

/**
 * Called when the designer is being destroyed
 */
Alt.AdviceManagement.AdviceResumeManagerDesigner.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up resources
    
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceResumeManagerDesigner - Destroyed");
    }
};