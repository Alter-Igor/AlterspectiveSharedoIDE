namespace("Alt.AdviceManagement.Workflows.Shared");

/**
 * WorkflowActionInfoModal - Shared information modal for workflow actions
 * Provides comprehensive documentation, usage examples, and debugging information
 */
Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal = function(actionInfo) {
    var self = this;
    
    // Store action information
    self.actionInfo = actionInfo || {};
    
    // Modal state
    self.isVisible = ko.observable(false);
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
     * Show the modal
     */
    self.show = function(tabId) {
        self.currentTab(tabId || 'overview');
        self.isVisible(true);
        
        // Log modal opening for analytics
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionInfoModal - Opened for action: " + self.actionInfo.name);
            $ui.log.debug("  Initial tab: " + self.currentTab());
        }
    };
    
    /**
     * Hide the modal
     */
    self.hide = function() {
        self.isVisible(false);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionInfoModal - Closed for action: " + self.actionInfo.name);
        }
    };
    
    /**
     * Switch to a specific tab
     */
    self.switchTab = function(tabId) {
        self.currentTab(tabId);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionInfoModal - Switched to tab: " + tabId);
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
     * Copy code example to clipboard
     */
    self.copyToClipboard = function(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("WorkflowActionInfoModal - Copied text to clipboard");
                }
                
                // Show brief success message
                self.showCopySuccess();
            });
        } else {
            // Fallback for older browsers
            var textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            self.showCopySuccess();
        }
    };
    
    /**
     * Show copy success message
     */
    self.showCopySuccess = function() {
        // This would ideally show a toast notification
        // For now, just log it
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("WorkflowActionInfoModal - Code copied to clipboard");
        }
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
     * Handle keyboard navigation
     */
    self.handleKeyPress = function(data, event) {
        if (event.keyCode === 27) { // Escape key
            self.hide();
            return false;
        }
        return true;
    };
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("WorkflowActionInfoModal - Initialized for action: " + (self.actionInfo.name || 'Unknown'));
    }
};

/**
 * Create a standardized info button for workflow designers
 */
Alt.AdviceManagement.Workflows.Shared.createInfoButton = function(actionInfo) {
    return {
        modal: new Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal(actionInfo),
        showInfo: function(tab) {
            this.modal.show(tab);
        },
        getInfoButtonHtml: function() {
            return '<button type="button" class="btn btn-link btn-sm info-button" title="Show detailed information about this workflow action" data-bind="click: function() { showInfo(); }">' +
                   '<i class="fa fa-info-circle text-info"></i>' +
                   '</button>';
        }
    };
};