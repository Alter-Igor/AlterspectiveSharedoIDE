namespace("Alt.AdviceManagement");

/**
 * AdviceStatusControllerDesigner - Designer widget for configuring the Advice Status Controller workflow action
 * @param {Object} element - DOM element
 * @param {Object} options - Widget options
 * @param {Object} viewModel - Parent view model (workflow action model)
 */
Alt.AdviceManagement.AdviceStatusControllerDesigner = function(element, options, viewModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.options = options;
    self.viewModel = viewModel; // This is the workflow action model from the factory
    
    // Designer-specific observables
    self.isExpanded = ko.observable(false);
    self.showAdvancedOptions = ko.observable(false);
    
    // Store action information for help blade
    self.actionInfo = Alt.AdviceManagement.AdviceStatusControllerInfo;
    
    // Available condition options
    self.availableConditions = ko.observableArray([
        { value: 'active', text: 'Active' },
        { value: 'paused', text: 'Paused' },
        { value: 'none', text: 'None' },
        { value: '*', text: 'Any Status' }
    ]);
    
    // Available actions
    self.availableActions = ko.observableArray([
        { value: 'checkOnly', text: 'Check Only (No Action)' },
        { value: 'pause', text: 'Pause Advice' },
        { value: 'resume', text: 'Resume Advice' },
        { value: 'toggle', text: 'Toggle Status' },
        { value: 'doNothing', text: 'Do Nothing' }
    ]);
    
    // Initialize configuration with fallback if viewModel doesn't exist yet
    if (!self.viewModel || !self.viewModel.config) {
        // Create a placeholder config structure to prevent binding errors
        if (!self.viewModel) {
            self.viewModel = {};
        }
        if (!self.viewModel.config) {
            self.viewModel.config = {
                defaultAction: ko.observable('checkOnly'),
                conditions: ko.observableArray([]),
                requireConfirmation: ko.observable(false),
                enableLogging: ko.observable(true),
                retryOnFailure: ko.observable(true)
            };
        }
        
        if ($ui && $ui.log && $ui.log.warning) {
            $ui.log.warning("AdviceStatusControllerDesigner - viewModel.config not provided, created placeholder");
        }
    } else {
        // Ensure default action is set
        if (!self.viewModel.config.defaultAction()) {
            self.viewModel.config.defaultAction('checkOnly');
        }
        
        // Ensure conditions array exists
        if (!self.viewModel.config.conditions() || !Array.isArray(self.viewModel.config.conditions())) {
            self.viewModel.config.conditions([]);
        }
        
        // Ensure other observables exist
        if (!self.viewModel.config.requireConfirmation) {
            self.viewModel.config.requireConfirmation = ko.observable(false);
        }
        if (!self.viewModel.config.enableLogging) {
            self.viewModel.config.enableLogging = ko.observable(true);
        }
        if (!self.viewModel.config.retryOnFailure) {
            self.viewModel.config.retryOnFailure = ko.observable(true);
        }
    }
    
    /**
     * Add a new condition
     */
    self.addCondition = function() {
        try {
            if (self.viewModel && self.viewModel.config && self.viewModel.config.conditions && typeof self.viewModel.config.conditions === 'function') {
                var conditions = self.viewModel.config.conditions();
                conditions.push({
                    when: ko.observable('active'),
                    then: ko.observable('doNothing')
                });
                self.viewModel.config.conditions(conditions);
                
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdviceStatusControllerDesigner - Added new condition, total: " + conditions.length);
                }
            } else {
                if ($ui && $ui.log && $ui.log.warning) {
                    $ui.log.warning("AdviceStatusControllerDesigner - Cannot add condition, conditions array not available");
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error adding condition: " + error.message);
            }
        }
    };
    
    /**
     * Remove a condition
     */
    self.removeCondition = function(condition) {
        try {
            if (self.viewModel && self.viewModel.config && self.viewModel.config.conditions && typeof self.viewModel.config.conditions === 'function') {
                var conditions = self.viewModel.config.conditions();
                var index = conditions.indexOf(condition);
                if (index > -1) {
                    conditions.splice(index, 1);
                    self.viewModel.config.conditions(conditions);
                    
                    if ($ui && $ui.log && $ui.log.debug) {
                        $ui.log.debug("AdviceStatusControllerDesigner - Removed condition, remaining: " + conditions.length);
                    }
                } else {
                    if ($ui && $ui.log && $ui.log.warning) {
                        $ui.log.warning("AdviceStatusControllerDesigner - Condition not found for removal");
                    }
                }
            } else {
                if ($ui && $ui.log && $ui.log.warning) {
                    $ui.log.warning("AdviceStatusControllerDesigner - Cannot remove condition, conditions array not available");
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error removing condition: " + error.message);
            }
        }
    };
    
    /**
     * Toggle expanded view
     */
    self.toggleExpanded = function() {
        self.isExpanded(!self.isExpanded());
    };
    
    /**
     * Toggle advanced options
     */
    self.toggleAdvancedOptions = function() {
        self.showAdvancedOptions(!self.showAdvancedOptions());
    };
    
    /**
     * Show help information blade
     */
    self.showInfo = function(tab) {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceStatusControllerDesigner - Opening help blade");
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
                            $ui.log.debug("AdviceStatusControllerDesigner - Help blade opened successfully");
                        }
                    }
                };
                
                $ui.stacks.openPanel('Alt.AdviceManagement.WorkflowActionHelpBlade', bladeConfig, events);
                
            } else {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error("AdviceStatusControllerDesigner - $ui.stacks.openPanel not available");
                    $ui.log.error("  Available $ui methods: " + JSON.stringify(Object.keys($ui || {})));
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error opening help blade: " + error.message);
                $ui.log.error("  Error stack: " + (error.stack || 'No stack trace'));
            }
        }
    };
    
    /**
     * Get display text for current configuration
     */
    self.getConfigurationSummary = ko.computed(function() {
        try {
            if (!self.viewModel || !self.viewModel.config) {
                return "Configuration not available";
            }
            
            var defaultAction = 'checkOnly';
            var conditionsCount = 0;
            
            if (self.viewModel.config.defaultAction && typeof self.viewModel.config.defaultAction === 'function') {
                defaultAction = self.viewModel.config.defaultAction() || 'checkOnly';
            }
            
            if (self.viewModel.config.conditions && typeof self.viewModel.config.conditions === 'function') {
                var conditions = self.viewModel.config.conditions() || [];
                conditionsCount = conditions.length;
            }
            
            var summary = "Default: " + defaultAction;
            if (conditionsCount > 0) {
                summary += ", " + conditionsCount + " condition" + (conditionsCount === 1 ? "" : "s");
            }
            
            return summary;
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error in getConfigurationSummary: " + error.message);
            }
            return "Configuration error";
        }
    });
    
    /**
     * Validation
     */
    self.isValid = ko.computed(function() {
        try {
            if (!self.viewModel || !self.viewModel.config) {
                return false;
            }
            
            // Check if we have a valid default action
            var defaultAction = null;
            if (self.viewModel.config.defaultAction && typeof self.viewModel.config.defaultAction === 'function') {
                defaultAction = self.viewModel.config.defaultAction();
            }
            if (!defaultAction) {
                return false;
            }
            
            // Validate conditions
            var conditions = [];
            if (self.viewModel.config.conditions && typeof self.viewModel.config.conditions === 'function') {
                conditions = self.viewModel.config.conditions() || [];
            }
            
            for (var i = 0; i < conditions.length; i++) {
                var condition = conditions[i];
                if (!condition.when || !condition.then || !condition.when() || !condition.then()) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error in isValid: " + error.message);
            }
            return false;
        }
    });
    
    /**
     * Get validation message
     */
    self.validationMessage = ko.computed(function() {
        try {
            if (self.isValid()) {
                return "";
            }
            
            if (!self.viewModel || !self.viewModel.config) {
                return "Configuration model not available";
            }
            
            var defaultAction = null;
            if (self.viewModel.config.defaultAction && typeof self.viewModel.config.defaultAction === 'function') {
                defaultAction = self.viewModel.config.defaultAction();
            }
            if (!defaultAction) {
                return "Default action is required";
            }
            
            var conditions = [];
            if (self.viewModel.config.conditions && typeof self.viewModel.config.conditions === 'function') {
                conditions = self.viewModel.config.conditions() || [];
            }
            
            for (var i = 0; i < conditions.length; i++) {
                var condition = conditions[i];
                if (!condition.when || !condition.then || !condition.when() || !condition.then()) {
                    return "All conditions must have both 'when' and 'then' values";
                }
            }
            
            return "Configuration is invalid";
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceStatusControllerDesigner - Error in validationMessage: " + error.message);
            }
            return "Validation error: " + error.message;
        }
    });
    
    // Initialize logging and validation for debugging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceStatusControllerDesigner - INITIALIZING");
        $ui.log.debug("  ViewModel available: " + !!self.viewModel);
        $ui.log.debug("  Config available: " + !!(self.viewModel && self.viewModel.config));
        
        if (self.viewModel && self.viewModel.config) {
            $ui.log.debug("  Configuration structure:");
            Object.keys(self.viewModel.config).forEach(function(key) {
                var observable = self.viewModel.config[key];
                var isObservable = typeof observable === 'function';
                var value = isObservable ? observable() : observable;
                $ui.log.debug("    " + key + ": " + JSON.stringify(value) + " (observable: " + isObservable + ")");
            });
        }
        
        if (self.viewModel && self.viewModel.ui) {
            $ui.log.debug("  UI variable trackers:");
            Object.keys(self.viewModel.ui).forEach(function(key) {
                $ui.log.debug("    " + key + ": " + !!self.viewModel.ui[key]);
            });
        }
    }
    
    // Enhanced error checking
    if (!self.viewModel) {
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error("AdviceStatusControllerDesigner - CRITICAL: No viewModel provided");
        }
        console.error("AdviceStatusControllerDesigner: viewModel is required but not provided");
    }
    
    if (self.viewModel && !self.viewModel.config) {
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error("AdviceStatusControllerDesigner - CRITICAL: viewModel.config is missing");
        }
        console.error("AdviceStatusControllerDesigner: viewModel.config is required but not available");
    }
};

/**
 * Dispose function called when widget is destroyed
 */
Alt.AdviceManagement.AdviceStatusControllerDesigner.prototype.dispose = function() {
    var self = this;
    
    // Clean up any subscriptions
    if (self.getConfigurationSummary && self.getConfigurationSummary.dispose) {
        self.getConfigurationSummary.dispose();
    }
    
    if (self.isValid && self.isValid.dispose) {
        self.isValid.dispose();
    }
    
    if (self.validationMessage && self.validationMessage.dispose) {
        self.validationMessage.dispose();
    }
    
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceStatusControllerDesigner - Disposed");
    }
};