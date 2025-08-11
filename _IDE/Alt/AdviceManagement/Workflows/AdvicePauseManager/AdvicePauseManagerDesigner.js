namespace("Alt.AdviceManagement");

/**
 * AdvicePauseManagerDesigner - Designer widget for configuring the Advice Pause Manager workflow action
 * @param {Object} element - DOM element
 * @param {Object} options - Widget options  
 * @param {Object} viewModel - Parent view model (workflow action model)
 */
Alt.AdviceManagement.AdvicePauseManagerDesigner = function(element, options, viewModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.options = options;
    self.viewModel = viewModel;
    
    // Designer-specific observables
    self.isExpanded = ko.observable(false);
    self.showAdvancedOptions = ko.observable(false);
    
    // Initialize information modal
    self.infoModal = new Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal(
        Alt.AdviceManagement.AdvicePauseManagerInfo
    );
    
    // Initialize configuration with fallback if viewModel doesn't exist yet
    if (!self.viewModel || !self.viewModel.config) {
        if (!self.viewModel) {
            self.viewModel = {};
        }
        if (!self.viewModel.config) {
            self.viewModel.config = {
                abstractAdviceTypeSystemName: ko.observable('AbstractAdvice'),
                pausedPhase: ko.observable('Removed'),
                pauseReason: ko.observable('Advice paused by workflow'),
                saveAdviceState: ko.observable(true),
                enableLogging: ko.observable(true),
                timeout: ko.observable(60000)
            };
        }
        
        if ($ui && $ui.log && $ui.log.warning) {
            $ui.log.warning("AdvicePauseManagerDesigner - viewModel.config not provided, created placeholder");
        }
    } else {
        // Ensure all required observables exist
        if (!self.viewModel.config.abstractAdviceTypeSystemName) {
            self.viewModel.config.abstractAdviceTypeSystemName = ko.observable('AbstractAdvice');
        }
        if (!self.viewModel.config.pausedPhase) {
            self.viewModel.config.pausedPhase = ko.observable('Removed');
        }
        if (!self.viewModel.config.pauseReason) {
            self.viewModel.config.pauseReason = ko.observable('Advice paused by workflow');
        }
        if (!self.viewModel.config.saveAdviceState) {
            self.viewModel.config.saveAdviceState = ko.observable(true);
        }
        if (!self.viewModel.config.enableLogging) {
            self.viewModel.config.enableLogging = ko.observable(true);
        }
        if (!self.viewModel.config.timeout) {
            self.viewModel.config.timeout = ko.observable(60000);
        }
    }
    
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
     * Show information modal
     */
    self.showInfo = function(tab) {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdvicePauseManagerDesigner - showInfo called");
            $ui.log.debug("  Tab: " + (tab || 'default'));
            $ui.log.debug("  infoModal exists: " + !!self.infoModal);
        }
        
        try {
            if (self.infoModal) {
                self.infoModal.show(tab);
                
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdvicePauseManagerDesigner - Modal show() called successfully");
                }
            } else {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error("AdvicePauseManagerDesigner - infoModal is null or undefined");
                }
                
                // Try to reinitialize the modal
                if (typeof Alt !== 'undefined' && 
                    Alt.AdviceManagement && 
                    Alt.AdviceManagement.Workflows &&
                    Alt.AdviceManagement.Workflows.Shared &&
                    Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal) {
                    
                    self.infoModal = new Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal(
                        Alt.AdviceManagement.AdvicePauseManagerInfo
                    );
                    self.infoModal.show(tab);
                    
                    if ($ui && $ui.log && $ui.log.warning) {
                        $ui.log.warning("AdvicePauseManagerDesigner - Successfully reinitialized modal");
                    }
                } else {
                    if ($ui && $ui.log && $ui.log.error) {
                        $ui.log.error("AdvicePauseManagerDesigner - Cannot reinitialize modal, namespace not available");
                        $ui.log.error("  Alt available: " + (typeof Alt !== 'undefined'));
                        $ui.log.error("  Full namespace available: " + (typeof Alt !== 'undefined' && Alt.AdviceManagement && Alt.AdviceManagement.Workflows && Alt.AdviceManagement.Workflows.Shared && Alt.AdviceManagement.Workflows.Shared.WorkflowActionInfoModal));
                    }
                }
            }
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdvicePauseManagerDesigner - Error in showInfo: " + error.message);
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
            
            var abstractType = 'AbstractAdvice';
            var phase = 'Removed';
            var saveState = true;
            
            if (self.viewModel.config.abstractAdviceTypeSystemName && typeof self.viewModel.config.abstractAdviceTypeSystemName === 'function') {
                abstractType = self.viewModel.config.abstractAdviceTypeSystemName() || 'AbstractAdvice';
            }
            
            if (self.viewModel.config.pausedPhase && typeof self.viewModel.config.pausedPhase === 'function') {
                phase = self.viewModel.config.pausedPhase() || 'Removed';
            }
            
            if (self.viewModel.config.saveAdviceState && typeof self.viewModel.config.saveAdviceState === 'function') {
                saveState = self.viewModel.config.saveAdviceState();
            }
            
            var summary = "Type: " + abstractType + ", Phase: " + phase;
            if (saveState) {
                summary += ", Save State: Yes";
            }
            
            return summary;
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdvicePauseManagerDesigner - Error in getConfigurationSummary: " + error.message);
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
            
            // Check if we have required fields
            var abstractType = null;
            if (self.viewModel.config.abstractAdviceTypeSystemName && typeof self.viewModel.config.abstractAdviceTypeSystemName === 'function') {
                abstractType = self.viewModel.config.abstractAdviceTypeSystemName();
            }
            
            if (!abstractType || abstractType.trim().length === 0) {
                return false;
            }
            
            var phase = null;
            if (self.viewModel.config.pausedPhase && typeof self.viewModel.config.pausedPhase === 'function') {
                phase = self.viewModel.config.pausedPhase();
            }
            
            if (!phase || phase.trim().length === 0) {
                return false;
            }
            
            return true;
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdvicePauseManagerDesigner - Error in isValid: " + error.message);
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
            
            var abstractType = null;
            if (self.viewModel.config.abstractAdviceTypeSystemName && typeof self.viewModel.config.abstractAdviceTypeSystemName === 'function') {
                abstractType = self.viewModel.config.abstractAdviceTypeSystemName();
            }
            
            if (!abstractType || abstractType.trim().length === 0) {
                return "Abstract advice type system name is required";
            }
            
            var phase = null;
            if (self.viewModel.config.pausedPhase && typeof self.viewModel.config.pausedPhase === 'function') {
                phase = self.viewModel.config.pausedPhase();
            }
            
            if (!phase || phase.trim().length === 0) {
                return "Paused phase name is required";
            }
            
            return "Configuration is invalid";
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdvicePauseManagerDesigner - Error in validationMessage: " + error.message);
            }
            return "Validation error: " + error.message;
        }
    });
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdvicePauseManagerDesigner - INITIALIZING");
        $ui.log.debug("  ViewModel available: " + !!self.viewModel);
        $ui.log.debug("  Config available: " + !!(self.viewModel && self.viewModel.config));
    }
    
    // Enhanced error checking
    if (!self.viewModel) {
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error("AdvicePauseManagerDesigner - CRITICAL: No viewModel provided");
        }
        console.error("AdvicePauseManagerDesigner: viewModel is required but not provided");
    }
    
    if (self.viewModel && !self.viewModel.config) {
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error("AdvicePauseManagerDesigner - CRITICAL: viewModel.config is missing");
        }
        console.error("AdvicePauseManagerDesigner: viewModel.config is required but not available");
    }
};

/**
 * Dispose function called when widget is destroyed
 */
Alt.AdviceManagement.AdvicePauseManagerDesigner.prototype.dispose = function() {
    var self = this;
    
    // Clean up subscriptions
    if (self.getConfigurationSummary && self.getConfigurationSummary.dispose) {
        self.getConfigurationSummary.dispose();
    }
    
    if (self.isValid && self.isValid.dispose) {
        self.isValid.dispose();
    }
    
    if (self.validationMessage && self.validationMessage.dispose) {
        self.validationMessage.dispose();
    }
    
    // Clean up modal
    if (self.infoModal) {
        self.infoModal.hide();
    }
    
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdvicePauseManagerDesigner - Disposed");
    }
};