// PauseTasks-factory.js
// Factory function for the PauseTasks workflow action

(function() {
    var createModel = function(actionModel, actionOptions, wfModel, stepModel) {
        // Reference self as the action model we're extending
        var self = actionModel;
        
        // Setup model defaults and extend from loaded config
        var defaults = {
            // Custom config for pause tasks
            config: {
                workItemIdVariable: null,
                baseWorkType: "AbstractAdvice",
                targetPhaseFeature: "Paused",
                targetPhaseSystemName: null,
                saveOriginalState: true,
                excludePhases: ["Completed", "Cancelled", "Removed"],
                suppressEvents: false,
                suppressGuards: false,
                pauseReasonVariable: null,
                pausedByVariable: null,
                successVariable: null,
                pausedCountVariable: null,
                errorMessageVariable: null
            },
            
            // The list of connections as persisted
            connections: {}
        };
        
        var options = $.extend(true, {}, defaults, actionOptions);
        
        // Extend the action model with custom config observables
        self.config.workItemIdVariable = ko.observable(options.config.workItemIdVariable);
        self.config.baseWorkType = ko.observable(options.config.baseWorkType);
        self.config.targetPhaseFeature = ko.observable(options.config.targetPhaseFeature);
        self.config.targetPhaseSystemName = ko.observable(options.config.targetPhaseSystemName);
        self.config.saveOriginalState = ko.observable(options.config.saveOriginalState);
        self.config.excludePhases = ko.observableArray(options.config.excludePhases);
        self.config.suppressEvents = ko.observable(options.config.suppressEvents);
        self.config.suppressGuards = ko.observable(options.config.suppressGuards);
        self.config.pauseReasonVariable = ko.observable(options.config.pauseReasonVariable);
        self.config.pausedByVariable = ko.observable(options.config.pausedByVariable);
        self.config.successVariable = ko.observable(options.config.successVariable);
        self.config.pausedCountVariable = ko.observable(options.config.pausedCountVariable);
        self.config.errorMessageVariable = ko.observable(options.config.errorMessageVariable);
        
        // Extend the action model validation
        self.validation.workItemIdVariable = Validator.required(self, self.config.workItemIdVariable, "Choose a work item ID variable");
        
        // Validate that either feature or system name is provided
        self.validation.targetPhase = ko.pureComputed(function() {
            var feature = self.config.targetPhaseFeature();
            var systemName = self.config.targetPhaseSystemName();
            
            if ((!feature || feature.trim() === "") && (!systemName || systemName.trim() === "")) {
                return "Either Target Phase Feature or Target Phase System Name must be specified";
            }
            return null;
        });
        
        self.actionModelErrorCount = ko.pureComputed(function() {
            var fails = 0;
            if (self.validation.workItemIdVariable()) fails++;
            if (self.validation.targetPhase()) fails++;
            return fails;
        });
        
        // Track variable selections with correct ShareDo data types
        self.ui = self.ui || {};
        self.ui.workItemIdVariable = self.trackVariable(self.config.workItemIdVariable, "/Identifier/Work Item Identifier");
        self.ui.pauseReasonVariable = self.trackVariable(self.config.pauseReasonVariable, "/String");
        self.ui.pausedByVariable = self.trackVariable(self.config.pausedByVariable, "/String");
        self.ui.successVariable = self.trackVariable(self.config.successVariable, "/Boolean");
        self.ui.pausedCountVariable = self.trackVariable(self.config.pausedCountVariable, "/Number");
        self.ui.errorMessageVariable = self.trackVariable(self.config.errorMessageVariable, "/String");
        
        // Force addition of outlets for the outcomes
        self.addAvailableOutlet("success", ko.pureComputed(function() { return "Success"; }));
        self.addAvailableOutlet("partial", ko.pureComputed(function() { return "Partial Success"; }));
        self.addAvailableOutlet("noTasks", ko.pureComputed(function() { return "No Tasks"; }));
        self.addAvailableOutlet("error", ko.pureComputed(function() { return "Error"; }));
    };
    
    var dispose = function(actionModel) {
        var self = actionModel;
        if (self.ui) {
            if (self.ui.workItemIdVariable) self.ui.workItemIdVariable.dispose();
            if (self.ui.pauseReasonVariable) self.ui.pauseReasonVariable.dispose();
            if (self.ui.pausedByVariable) self.ui.pausedByVariable.dispose();
            if (self.ui.successVariable) self.ui.successVariable.dispose();
            if (self.ui.pausedCountVariable) self.ui.pausedCountVariable.dispose();
            if (self.ui.errorMessageVariable) self.ui.errorMessageVariable.dispose();
        }
    };
    
    return {
        createModel: createModel,
        dispose: dispose
    };
})();