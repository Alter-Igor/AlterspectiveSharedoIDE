// ResumeTasks-factory.js
// Factory function for the ResumeTasks workflow action

(function() {
    var createModel = function(actionModel, actionOptions, wfModel, stepModel) {
        // Reference self as the action model we're extending
        var self = actionModel;
        
        // Setup model defaults and extend from loaded config
        var defaults = {
            // Custom config for resume tasks
            config: {
                workItemIdVariable: null,
                baseWorkType: "AbstractAdvice",
                sourcePhaseFeature: "Paused",
                sourcePhaseSystemName: null,
                restoreFromSaved: true,
                defaultPhase: "InProgress",
                newDueDateVariable: null,
                adjustDueDateBy: null,
                clearPauseMetadata: true,
                suppressEvents: false,
                suppressGuards: false,
                resumeReasonVariable: null,
                resumedByVariable: null,
                successVariable: null,
                resumedCountVariable: null,
                errorMessageVariable: null
            },
            
            // The list of connections as persisted
            connections: {}
        };
        
        var options = $.extend(true, {}, defaults, actionOptions);
        
        // Extend the action model with custom config observables
        self.config.workItemIdVariable = ko.observable(options.config.workItemIdVariable);
        self.config.baseWorkType = ko.observable(options.config.baseWorkType);
        self.config.sourcePhaseFeature = ko.observable(options.config.sourcePhaseFeature);
        self.config.sourcePhaseSystemName = ko.observable(options.config.sourcePhaseSystemName);
        self.config.restoreFromSaved = ko.observable(options.config.restoreFromSaved);
        self.config.defaultPhase = ko.observable(options.config.defaultPhase);
        self.config.newDueDateVariable = ko.observable(options.config.newDueDateVariable);
        self.config.adjustDueDateBy = ko.observable(options.config.adjustDueDateBy);
        self.config.clearPauseMetadata = ko.observable(options.config.clearPauseMetadata);
        self.config.suppressEvents = ko.observable(options.config.suppressEvents);
        self.config.suppressGuards = ko.observable(options.config.suppressGuards);
        self.config.resumeReasonVariable = ko.observable(options.config.resumeReasonVariable);
        self.config.resumedByVariable = ko.observable(options.config.resumedByVariable);
        self.config.successVariable = ko.observable(options.config.successVariable);
        self.config.resumedCountVariable = ko.observable(options.config.resumedCountVariable);
        self.config.errorMessageVariable = ko.observable(options.config.errorMessageVariable);
        
        // Extend the action model validation
        self.validation.workItemIdVariable = Validator.required(self, self.config.workItemIdVariable, "Choose a work item ID variable");
        
        // Validate that either feature or system name is provided
        self.validation.sourcePhase = ko.pureComputed(function() {
            var feature = self.config.sourcePhaseFeature();
            var systemName = self.config.sourcePhaseSystemName();
            
            if ((!feature || feature.trim() === "") && (!systemName || systemName.trim() === "")) {
                return "Either Source Phase Feature or Source Phase System Name must be specified";
            }
            return null;
        });
        
        // Validate due date adjustment
        self.validation.dueDateAdjustment = ko.pureComputed(function() {
            var adjustBy = self.config.adjustDueDateBy();
            var newDateVar = self.config.newDueDateVariable();
            
            // If both are specified, that's an error
            if (adjustBy && newDateVar && newDateVar.trim() !== "") {
                return "Cannot specify both New Due Date Variable and Adjust Due Date By";
            }
            
            // If adjust by is specified, it should be a valid number
            if (adjustBy !== null && adjustBy !== undefined && adjustBy !== "") {
                var num = parseInt(adjustBy, 10);
                if (isNaN(num)) {
                    return "Adjust Due Date By must be a valid number of days";
                }
            }
            
            return null;
        });
        
        self.actionModelErrorCount = ko.pureComputed(function() {
            var fails = 0;
            if (self.validation.workItemIdVariable()) fails++;
            if (self.validation.sourcePhase()) fails++;
            if (self.validation.dueDateAdjustment()) fails++;
            return fails;
        });
        
        // Track variable selections with correct ShareDo data types
        self.ui = self.ui || {};
        self.ui.workItemIdVariable = self.trackVariable(self.config.workItemIdVariable, "/Identifier/Work Item Identifier");
        self.ui.newDueDateVariable = self.trackVariable(self.config.newDueDateVariable, "/DateTime");
        self.ui.resumeReasonVariable = self.trackVariable(self.config.resumeReasonVariable, "/String");
        self.ui.resumedByVariable = self.trackVariable(self.config.resumedByVariable, "/String");
        self.ui.successVariable = self.trackVariable(self.config.successVariable, "/Boolean");
        self.ui.resumedCountVariable = self.trackVariable(self.config.resumedCountVariable, "/Number");
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
            if (self.ui.newDueDateVariable) self.ui.newDueDateVariable.dispose();
            if (self.ui.resumeReasonVariable) self.ui.resumeReasonVariable.dispose();
            if (self.ui.resumedByVariable) self.ui.resumedByVariable.dispose();
            if (self.ui.successVariable) self.ui.successVariable.dispose();
            if (self.ui.resumedCountVariable) self.ui.resumedCountVariable.dispose();
            if (self.ui.errorMessageVariable) self.ui.errorMessageVariable.dispose();
        }
    };
    
    return {
        createModel: createModel,
        dispose: dispose
    };
})();