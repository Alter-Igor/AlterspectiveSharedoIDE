/**
 * AdvicePauseManager Factory
 * 
 * ShareDo workflow action factory for AdvicePauseManager visual workflow nodes.
 * Follows ShareDo's standard factory pattern.
 */
(function() {
    'use strict';

    /**
     * Create model function - called by ShareDo when creating workflow action nodes
     * @param {Object} actionModel - The action model provided by ShareDo
     * @param {Object} actionOptions - Configuration options from workflow
     * @param {Object} wfModel - The overall workflow model
     * @param {Object} stepModel - The step model
     * @returns {Object} - Extended action model
     */
    var createModel = function(actionModel, actionOptions, wfModel, stepModel) {
        var self = actionModel;
        
        // Setup model defaults
        var defaults = {
            config: {
                workItemIdVariable: null,
                pauseReasonVariable: null,
                successVariable: null,
                messageVariable: null,
                foundAdviceCountVariable: null,
                pausedAdviceCountVariable: null,
                savedStateVariable: null,
                pausedDateVariable: null,
                errorCountVariable: null,
                useWorkflowApproach: true,
                abstractAdviceTypeSystemName: 'AbstractAdvice',
                pausedPhase: 'Removed',
                saveAdviceState: true,
                overwriteExistingSavedState: true,
                pauseAllAdviceTypes: true,
                includeInactiveAdvice: false,
                enableLogging: true,
                enableRetry: true,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 60000
            },
            connections: {}
        };
        
        var options = $.extend(true, {}, defaults, actionOptions);

        // Extend the action model with config observables
        self.config.workItemIdVariable = ko.observable(options.config.workItemIdVariable);
        self.config.pauseReasonVariable = ko.observable(options.config.pauseReasonVariable);
        self.config.successVariable = ko.observable(options.config.successVariable);
        self.config.messageVariable = ko.observable(options.config.messageVariable);
        self.config.foundAdviceCountVariable = ko.observable(options.config.foundAdviceCountVariable);
        self.config.pausedAdviceCountVariable = ko.observable(options.config.pausedAdviceCountVariable);
        self.config.savedStateVariable = ko.observable(options.config.savedStateVariable);
        self.config.pausedDateVariable = ko.observable(options.config.pausedDateVariable);
        self.config.errorCountVariable = ko.observable(options.config.errorCountVariable);
        self.config.useWorkflowApproach = ko.observable(options.config.useWorkflowApproach);
        self.config.abstractAdviceTypeSystemName = ko.observable(options.config.abstractAdviceTypeSystemName);
        self.config.pausedPhase = ko.observable(options.config.pausedPhase);
        self.config.saveAdviceState = ko.observable(options.config.saveAdviceState);
        self.config.overwriteExistingSavedState = ko.observable(options.config.overwriteExistingSavedState);
        self.config.pauseAllAdviceTypes = ko.observable(options.config.pauseAllAdviceTypes);
        self.config.includeInactiveAdvice = ko.observable(options.config.includeInactiveAdvice);
        self.config.enableLogging = ko.observable(options.config.enableLogging);
        self.config.enableRetry = ko.observable(options.config.enableRetry);
        self.config.maxRetries = ko.observable(options.config.maxRetries);
        self.config.retryDelay = ko.observable(options.config.retryDelay);
        self.config.timeout = ko.observable(options.config.timeout);

        // Extend the action model validation
        self.validation.workItemIdVariable = Validator.required(self, self.config.workItemIdVariable, "Work Item ID variable is required");
        self.validation.abstractAdviceTypeSystemName = ko.computed(function() {
            var systemName = self.config.abstractAdviceTypeSystemName();
            return systemName && systemName.trim() ? null : 'Abstract advice type system name is required';
        });

        // Error count for validation
        self.actionModelErrorCount = ko.pureComputed(function() {
            var fails = 0;
            if (self.validation.workItemIdVariable()) fails++;
            if (self.validation.abstractAdviceTypeSystemName()) fails++;
            return fails;
        });

        // Track variable selections for proper disposal
        self.ui.workItemIdVariable = self.trackVariable(self.config.workItemIdVariable, "/Identifier/Work Item Identifier");
        self.ui.pauseReasonVariable = self.trackVariable(self.config.pauseReasonVariable, "/String");
        self.ui.successVariable = self.trackVariable(self.config.successVariable, "/Boolean");
        self.ui.messageVariable = self.trackVariable(self.config.messageVariable, "/String");
        self.ui.foundAdviceCountVariable = self.trackVariable(self.config.foundAdviceCountVariable, "/Number");
        self.ui.pausedAdviceCountVariable = self.trackVariable(self.config.pausedAdviceCountVariable, "/Number");
        self.ui.savedStateVariable = self.trackVariable(self.config.savedStateVariable, "/Boolean");
        self.ui.pausedDateVariable = self.trackVariable(self.config.pausedDateVariable, "/DateTime");
        self.ui.errorCountVariable = self.trackVariable(self.config.errorCountVariable, "/Number");

        // Force addition of outlets for workflow branches
        self.addAvailableOutlet("success", ko.pureComputed(function() { return "Success"; }));
        self.addAvailableOutlet("paused", ko.pureComputed(function() { return "Advice Paused"; }));
        self.addAvailableOutlet("noAdvice", ko.pureComputed(function() { return "No Advice Found"; }));
        self.addAvailableOutlet("alreadyPaused", ko.pureComputed(function() { return "Already Paused"; }));
        self.addAvailableOutlet("error", ko.pureComputed(function() { return "Error"; }));

        return self;
    };

    /**
     * Dispose function - called by ShareDo when destroying workflow action nodes
     * @param {Object} actionModel - The action model to dispose
     */
    var dispose = function(actionModel) {
        var self = actionModel;
        
        // Dispose tracked variables to prevent memory leaks
        if (self.ui.workItemIdVariable) self.ui.workItemIdVariable.dispose();
        if (self.ui.pauseReasonVariable) self.ui.pauseReasonVariable.dispose();
        if (self.ui.successVariable) self.ui.successVariable.dispose();
        if (self.ui.messageVariable) self.ui.messageVariable.dispose();
        if (self.ui.foundAdviceCountVariable) self.ui.foundAdviceCountVariable.dispose();
        if (self.ui.pausedAdviceCountVariable) self.ui.pausedAdviceCountVariable.dispose();
        if (self.ui.savedStateVariable) self.ui.savedStateVariable.dispose();
        if (self.ui.pausedDateVariable) self.ui.pausedDateVariable.dispose();
        if (self.ui.errorCountVariable) self.ui.errorCountVariable.dispose();
        
        // Dispose computed observables
        if (self.validation.abstractAdviceTypeSystemName) self.validation.abstractAdviceTypeSystemName.dispose();
        if (self.actionModelErrorCount) self.actionModelErrorCount.dispose();
    };

    // Return the factory object that ShareDo expects
    return {
        createModel: createModel,
        dispose: dispose
    };

})();