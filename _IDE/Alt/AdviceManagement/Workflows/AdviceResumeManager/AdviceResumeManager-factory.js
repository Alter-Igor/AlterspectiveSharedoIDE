/**
 * AdviceResumeManager Factory
 * 
 * ShareDo workflow action factory for AdviceResumeManager visual workflow nodes.
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
                newDueDateVariable: null,
                resumeReasonVariable: null,
                successVariable: null,
                messageVariable: null,
                restoredCountVariable: null,
                createdCountVariable: null,
                resumedDateVariable: null,
                errorCountVariable: null,
                useWorkflowApproach: true,
                abstractAdviceTypeSystemName: 'AbstractAdvice',
                defaultAdviceTypeSystemName: 'StandardAdvice',
                preserveOriginalDates: false,
                defaultAdviceOffsetDays: 30,
                createDefaultIfNoSavedState: true,
                clearSavedStateAfterRestore: true,
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
        self.config.newDueDateVariable = ko.observable(options.config.newDueDateVariable);
        self.config.resumeReasonVariable = ko.observable(options.config.resumeReasonVariable);
        self.config.successVariable = ko.observable(options.config.successVariable);
        self.config.messageVariable = ko.observable(options.config.messageVariable);
        self.config.restoredCountVariable = ko.observable(options.config.restoredCountVariable);
        self.config.createdCountVariable = ko.observable(options.config.createdCountVariable);
        self.config.resumedDateVariable = ko.observable(options.config.resumedDateVariable);
        self.config.errorCountVariable = ko.observable(options.config.errorCountVariable);
        self.config.useWorkflowApproach = ko.observable(options.config.useWorkflowApproach);
        self.config.abstractAdviceTypeSystemName = ko.observable(options.config.abstractAdviceTypeSystemName);
        self.config.defaultAdviceTypeSystemName = ko.observable(options.config.defaultAdviceTypeSystemName);
        self.config.preserveOriginalDates = ko.observable(options.config.preserveOriginalDates);
        self.config.defaultAdviceOffsetDays = ko.observable(options.config.defaultAdviceOffsetDays);
        self.config.createDefaultIfNoSavedState = ko.observable(options.config.createDefaultIfNoSavedState);
        self.config.clearSavedStateAfterRestore = ko.observable(options.config.clearSavedStateAfterRestore);
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
        self.ui.newDueDateVariable = self.trackVariable(self.config.newDueDateVariable, "/DateTime");
        self.ui.resumeReasonVariable = self.trackVariable(self.config.resumeReasonVariable, "/String");
        self.ui.successVariable = self.trackVariable(self.config.successVariable, "/Boolean");
        self.ui.messageVariable = self.trackVariable(self.config.messageVariable, "/String");
        self.ui.restoredCountVariable = self.trackVariable(self.config.restoredCountVariable, "/Number");
        self.ui.createdCountVariable = self.trackVariable(self.config.createdCountVariable, "/Number");
        self.ui.resumedDateVariable = self.trackVariable(self.config.resumedDateVariable, "/DateTime");
        self.ui.errorCountVariable = self.trackVariable(self.config.errorCountVariable, "/Number");

        // Force addition of outlets for workflow branches
        self.addAvailableOutlet("success", ko.pureComputed(function() { return "Success"; }));
        self.addAvailableOutlet("restored", ko.pureComputed(function() { return "Restored from State"; }));
        self.addAvailableOutlet("created", ko.pureComputed(function() { return "Created New"; }));
        self.addAvailableOutlet("noAction", ko.pureComputed(function() { return "No Action Required"; }));
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
        if (self.ui.newDueDateVariable) self.ui.newDueDateVariable.dispose();
        if (self.ui.resumeReasonVariable) self.ui.resumeReasonVariable.dispose();
        if (self.ui.successVariable) self.ui.successVariable.dispose();
        if (self.ui.messageVariable) self.ui.messageVariable.dispose();
        if (self.ui.restoredCountVariable) self.ui.restoredCountVariable.dispose();
        if (self.ui.createdCountVariable) self.ui.createdCountVariable.dispose();
        if (self.ui.resumedDateVariable) self.ui.resumedDateVariable.dispose();
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