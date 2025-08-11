namespace("Alt.AdviceManagement");

/**
 * Designer for AdviceStatusController workflow action configuration
 */
Alt.AdviceManagement.AdviceStatusControllerDesigner = function(element, configuration, baseModel) {
    var self = this;
    
    // Condition model
    function ConditionModel(data) {
        this.when = ko.observable(data.when || 'active');
        this.then = ko.observable(data.then || 'doNothing');
    }
    
    // Default configuration
    var defaults = {
        defaultAction: 'checkOnly',
        conditions: [],
        pauseReason: 'Workflow automated pause',
        requireConfirmation: false,
        enableLogging: true,
        retryOnFailure: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
    };
    
    var config = $.extend(true, {}, defaults, configuration);
    
    // Setup model
    self.model = {
        defaultAction: ko.observable(config.defaultAction),
        conditions: ko.observableArray([]),
        pauseReason: ko.observable(config.pauseReason),
        requireConfirmation: ko.observable(config.requireConfirmation),
        enableLogging: ko.observable(config.enableLogging),
        retryOnFailure: ko.observable(config.retryOnFailure),
        maxRetries: ko.observable(config.maxRetries),
        retryDelay: ko.observable(config.retryDelay),
        timeout: ko.observable(config.timeout),
        validationErrors: ko.observableArray([])
    };
    
    // Initialize conditions
    if (config.conditions && config.conditions.length > 0) {
        config.conditions.forEach(function(condition) {
            self.model.conditions.push(new ConditionModel(condition));
        });
    } else {
        // Add default conditions
        self.model.conditions.push(new ConditionModel({ when: 'active', then: 'doNothing' }));
        self.model.conditions.push(new ConditionModel({ when: 'paused', then: 'doNothing' }));
    }
    
    // Computed properties
    self.model.showPauseReason = ko.pureComputed(function() {
        var hasPauseAction = false;
        
        // Check default action
        if (self.model.defaultAction() === 'pause' || self.model.defaultAction() === 'toggle') {
            hasPauseAction = true;
        }
        
        // Check conditions
        self.model.conditions().forEach(function(condition) {
            if (condition.then() === 'pause' || condition.then() === 'toggle') {
                hasPauseAction = true;
            }
        });
        
        return hasPauseAction;
    });
    
    // Configuration preview
    self.configurationPreview = ko.pureComputed(function() {
        var config = self.getConfiguration();
        return JSON.stringify(config, null, 2);
    });
    
    // Add condition
    self.addCondition = function() {
        self.model.conditions.push(new ConditionModel({
            when: 'active',
            then: 'doNothing'
        }));
    };
    
    // Remove condition
    self.removeCondition = function(condition) {
        self.model.conditions.remove(condition);
    };
    
    // Validation
    self.validate = function() {
        var errors = [];
        
        // Validate timeout
        var timeout = parseInt(self.model.timeout());
        if (isNaN(timeout) || timeout < 1000 || timeout > 120000) {
            errors.push('Timeout must be between 1000 and 120000 milliseconds');
        }
        
        // Validate retry settings
        if (self.model.retryOnFailure()) {
            var maxRetries = parseInt(self.model.maxRetries());
            if (isNaN(maxRetries) || maxRetries < 1 || maxRetries > 10) {
                errors.push('Max retries must be between 1 and 10');
            }
            
            var retryDelay = parseInt(self.model.retryDelay());
            if (isNaN(retryDelay) || retryDelay < 100 || retryDelay > 10000) {
                errors.push('Retry delay must be between 100 and 10000 milliseconds');
            }
        }
        
        // Validate conditions
        if (self.model.conditions().length === 0) {
            errors.push('At least one condition is required');
        }
        
        // Check for duplicate conditions
        var conditionKeys = {};
        self.model.conditions().forEach(function(condition) {
            var key = condition.when();
            if (conditionKeys[key]) {
                errors.push('Duplicate condition for status: ' + key);
            }
            conditionKeys[key] = true;
        });
        
        // Validate pause reason
        if (self.model.showPauseReason() && !self.model.pauseReason()) {
            errors.push('Pause reason is required when pause action is configured');
        }
        
        self.model.validationErrors(errors);
        return errors.length === 0;
    };
    
    // Get configuration
    self.getConfiguration = function() {
        // Validate first
        if (!self.validate()) {
            return null;
        }
        
        // Build conditions array
        var conditions = [];
        self.model.conditions().forEach(function(condition) {
            conditions.push({
                when: condition.when(),
                then: condition.then()
            });
        });
        
        return {
            defaultAction: self.model.defaultAction(),
            conditions: conditions,
            pauseReason: self.model.pauseReason(),
            requireConfirmation: self.model.requireConfirmation(),
            enableLogging: self.model.enableLogging(),
            retryOnFailure: self.model.retryOnFailure(),
            maxRetries: parseInt(self.model.maxRetries()),
            retryDelay: parseInt(self.model.retryDelay()),
            timeout: parseInt(self.model.timeout())
        };
    };
    
    // Required method for workflow designer
    self.getModel = function() {
        return self.getConfiguration();
    };
    
    // Cleanup
    self.onDestroy = function() {
        // Dispose observables
        if (self.model.showPauseReason) {
            self.model.showPauseReason.dispose();
        }
        if (self.configurationPreview) {
            self.configurationPreview.dispose();
        }
    };
    
    // Load and bind (if needed)
    self.loadAndBind = function() {
        // Initial validation
        self.validate();
    };
    
    // Subscribe to changes for live validation
    self.model.defaultAction.subscribe(function() { self.validate(); });
    self.model.pauseReason.subscribe(function() { self.validate(); });
    self.model.timeout.subscribe(function() { self.validate(); });
    self.model.maxRetries.subscribe(function() { self.validate(); });
    self.model.retryDelay.subscribe(function() { self.validate(); });
    
    // Pass validation state to parent
    if (baseModel && baseModel.validationErrorCount) {
        self.model.validationErrors.subscribe(function(errors) {
            baseModel.validationErrorCount(errors.length);
        });
    }
};