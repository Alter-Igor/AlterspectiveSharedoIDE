namespace("Alt.AdviceManagement.Workflows.Shared");

/**
 * WorkflowActionHelpBlade - ShareDo blade for displaying workflow action help information
 * @param {Object} element - DOM element
 * @param {Object} options - Blade options
 * @param {Object} viewModel - Parent view model  
 */
Alt.AdviceManagement.Workflows.Shared.WorkflowActionHelpBlade = function(element, options, viewModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.options = options || {};
    self.viewModel = viewModel;
    
    // Store action information from configuration
    self.actionInfo = self.options.actionInfo || {};
    
    // Blade state
    self.currentTab = ko.observable('overview');
    
    // Available tabs
    self.availableTabs = ko.observableArray([
        { id: 'overview', title: 'Overview', icon: 'fa-info-circle' },
        { id: 'configuration', title: 'Configuration', icon: 'fa-cogs' },
        { id: 'examples', title: 'Examples', icon: 'fa-code' },
        { id: 'debugging', title: 'Debugging', icon: 'fa-bug' },
        { id: 'troubleshooting', title: 'Troubleshooting', icon: 'fa-wrench' }
    ]);
    
    /**
     * Switch to a specific tab
     */
    self.switchTab = function(tabId) {
        self.currentTab(tabId);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionHelpBlade - Switched to tab: " + tabId);
        }
    };
    
    /**
     * Get formatted configuration parameters
     */
    self.getConfigurationParameters = ko.computed(function() {
        if (!self.actionInfo.configuration || !self.actionInfo.configuration.parameters) {
            return [];
        }
        
        return self.actionInfo.configuration.parameters.map(function(param) {
            return {
                name: param.name,
                type: param.type || 'String',
                required: param.required || false,
                default: param.default || 'None',
                description: param.description || 'No description available'
            };
        });
    });
    
    /**
     * Get formatted input/output variables
     */
    self.getVariableMappings = ko.computed(function() {
        var mappings = {
            inputs: [],
            outputs: []
        };
        
        if (self.actionInfo.variables) {
            if (self.actionInfo.variables.inputs) {
                mappings.inputs = self.actionInfo.variables.inputs.map(function(variable) {
                    return {
                        name: variable.name,
                        type: variable.type,
                        required: variable.required || false,
                        description: variable.description || 'No description available'
                    };
                });
            }
            
            if (self.actionInfo.variables.outputs) {
                mappings.outputs = self.actionInfo.variables.outputs.map(function(variable) {
                    return {
                        name: variable.name,
                        type: variable.type,
                        description: variable.description || 'No description available'
                    };
                });
            }
        }
        
        return mappings;
    });
    
    /**
     * Get workflow branches information
     */
    self.getWorkflowBranches = ko.computed(function() {
        if (!self.actionInfo.branches) {
            return [];
        }
        
        return self.actionInfo.branches.map(function(branch) {
            return {
                name: branch.name,
                condition: branch.condition || 'Always',
                description: branch.description || 'No description available'
            };
        });
    });
    
    /**
     * Get troubleshooting scenarios
     */
    self.getTroubleshootingScenarios = ko.computed(function() {
        if (!self.actionInfo.troubleshooting) {
            return [];
        }
        
        return self.actionInfo.troubleshooting.map(function(scenario) {
            return {
                problem: scenario.problem,
                symptoms: scenario.symptoms || [],
                causes: scenario.causes || [],
                solutions: scenario.solutions || []
            };
        });
    });
    
    /**
     * Get debugging tips
     */
    self.getDebuggingTips = ko.computed(function() {
        if (!self.actionInfo.debugging) {
            return [];
        }
        
        return self.actionInfo.debugging.map(function(tip) {
            return {
                category: tip.category || 'General',
                title: tip.title,
                description: tip.description,
                code: tip.code || null
            };
        });
    });
    
    /**
     * Get usage examples
     */
    self.getUsageExamples = ko.computed(function() {
        if (!self.actionInfo.examples) {
            return [];
        }
        
        return self.actionInfo.examples.map(function(example) {
            return {
                title: example.title,
                scenario: example.scenario,
                configuration: example.configuration,
                expected: example.expected || 'Success'
            };
        });
    });
    
    /**
     * Copy text to clipboard
     */
    self.copyToClipboard = function(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    self.showCopySuccess();
                }).catch(function(err) {
                    self.fallbackCopyToClipboard(text);
                });
            } else {
                self.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("WorkflowActionHelpBlade - Error copying to clipboard: " + error.message);
            }
        }
    };
    
    /**
     * Fallback clipboard copy for older browsers
     */
    self.fallbackCopyToClipboard = function(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            self.showCopySuccess();
        } catch (err) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("WorkflowActionHelpBlade - Fallback copy failed: " + err.message);
            }
        }
        
        document.body.removeChild(textArea);
    };
    
    /**
     * Show copy success feedback
     */
    self.showCopySuccess = function() {
        // Could show a toast notification here
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionHelpBlade - Text copied to clipboard successfully");
        }
        
        // Simple visual feedback by temporarily changing button text
        // This would need to be implemented with additional UI state if needed
    };
    
    /**
     * Generate debug URL for the action
     */
    self.getDebugUrl = ko.computed(function() {
        var baseUrl = window.location.origin + window.location.pathname;
        var debugParams = [
            'debug-advice=true',
            'debug-workflow=true',
            'verbose-logging=true',
            'ui-log-level=debug'
        ];
        
        return baseUrl + '?' + debugParams.join('&');
    });
    
    /**
     * Close the help blade
     */
    self.closePanel = function() {
        if ($ui && $ui.stacks && $ui.stacks.cancel) {
            // Use StackManager to close this blade
            $ui.stacks.cancel(self.stackModel || self);
        } else if (self.options && self.options.closeCallback) {
            self.options.closeCallback();
        } else {
            if ($ui && $ui.log && $ui.log.warning) {
                $ui.log.warning("WorkflowActionHelpBlade - No close method available");
                $ui.log.warning("  Available $ui methods: " + JSON.stringify(Object.keys($ui || {})));
            }
        }
    };
    
    /**
     * Initialize the blade
     */
    self.initialize = function() {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionHelpBlade - Initializing help blade");
            $ui.log.debug("  Action: " + (self.actionInfo.name || 'Unknown'));
            $ui.log.debug("  Available tabs: " + self.availableTabs().length);
        }
        
        // Set initial tab if specified in options
        if (self.options.initialTab) {
            self.currentTab(self.options.initialTab);
        }
    };
    
    /**
     * Cleanup function
     */
    self.dispose = function() {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionHelpBlade - Disposing help blade");
        }
        
        // Dispose computed observables
        if (self.getConfigurationParameters && self.getConfigurationParameters.dispose) {
            self.getConfigurationParameters.dispose();
        }
        if (self.getVariableMappings && self.getVariableMappings.dispose) {
            self.getVariableMappings.dispose();
        }
        if (self.getWorkflowBranches && self.getWorkflowBranches.dispose) {
            self.getWorkflowBranches.dispose();
        }
        if (self.getTroubleshootingScenarios && self.getTroubleshootingScenarios.dispose) {
            self.getTroubleshootingScenarios.dispose();
        }
        if (self.getDebuggingTips && self.getDebuggingTips.dispose) {
            self.getDebuggingTips.dispose();
        }
        if (self.getUsageExamples && self.getUsageExamples.dispose) {
            self.getUsageExamples.dispose();
        }
        if (self.getDebugUrl && self.getDebugUrl.dispose) {
            self.getDebugUrl.dispose();
        }
    };
    
    // Initialize the blade
    self.initialize();
};