namespace("Alt.AdviceManagement");

/**
 * AdviceResumeManagerDesigner - Designer widget for configuring the Advice Resume Manager workflow action
 * @param {Object} element - DOM element
 * @param {Object} options - Widget options
 * @param {Object} viewModel - Parent view model (workflow action model)
 */
Alt.AdviceManagement.AdviceResumeManagerDesigner = function(element, options, viewModel) {
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
        Alt.AdviceManagement.AdviceResumeManagerInfo
    );
    
    // Initialize configuration with fallback
    if (!self.viewModel || !self.viewModel.config) {
        if (!self.viewModel) {
            self.viewModel = {};
        }
        if (!self.viewModel.config) {
            self.viewModel.config = {
                abstractAdviceTypeSystemName: ko.observable('AbstractAdvice'),
                defaultAdviceTypeSystemName: ko.observable('StandardAdvice'),
                activePhase: ko.observable('Active'),
                pausedPhase: ko.observable('Removed'),
                newAdviceDueDate: ko.observable(null),
                enableLogging: ko.observable(true),
                timeout: ko.observable(60000)
            };
        }
        
        if ($ui && $ui.log && $ui.log.warning) {
            $ui.log.warning("AdviceResumeManagerDesigner - viewModel.config not provided, created placeholder");
        }
    }
    
    /**
     * Toggle expanded view
     */
    self.toggleExpanded = function() {
        self.isExpanded(!self.isExpanded());
    };
    
    /**
     * Show information modal
     */
    self.showInfo = function(tab) {
        if (self.infoModal) {
            self.infoModal.show(tab);
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
            var defaultType = 'StandardAdvice';
            
            if (self.viewModel.config.abstractAdviceTypeSystemName && typeof self.viewModel.config.abstractAdviceTypeSystemName === 'function') {
                abstractType = self.viewModel.config.abstractAdviceTypeSystemName() || 'AbstractAdvice';
            }
            
            if (self.viewModel.config.defaultAdviceTypeSystemName && typeof self.viewModel.config.defaultAdviceTypeSystemName === 'function') {
                defaultType = self.viewModel.config.defaultAdviceTypeSystemName() || 'StandardAdvice';
            }
            
            return "Base: " + abstractType + ", Default: " + defaultType;
        } catch (error) {
            return "Configuration error";
        }
    });
    
    // Initialize logging
    if ($ui && $ui.log && $ui.log.debug) {
        $ui.log.debug("AdviceResumeManagerDesigner - INITIALIZING");
    }
};