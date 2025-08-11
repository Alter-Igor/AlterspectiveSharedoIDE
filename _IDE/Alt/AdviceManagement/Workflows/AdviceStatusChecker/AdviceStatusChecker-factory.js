(function()
{
    var createModel = function(actionModel, actionOptions, wfModel, stepModel)
    {
        // Reference self as the action model we're extending
        var self = actionModel;

        // Setup model defaults and extend from loaded config
        var defaults =
        {
            // Custom config for advice status checker
            config:
            {
                workItemIdVariable: null,
                statusVariable: null,
                isEnabledVariable: null,
                pausedDateVariable: null,
                pausedByVariable: null,
                pauseReasonVariable: null,
                resumedDateVariable: null,
                resumedByVariable: null,
                resumeReasonVariable: null,
                nextAdviceDateVariable: null,
                errorMessageVariable: null
            },
            
            // The list of connections as persisted
            connections: {}
        };
        var options = $.extend(true, {}, defaults, actionOptions);

        // Extend the action model with custom config observables
        self.config.workItemIdVariable = ko.observable(options.config.workItemIdVariable);
        self.config.statusVariable = ko.observable(options.config.statusVariable);
        self.config.isEnabledVariable = ko.observable(options.config.isEnabledVariable);
        self.config.pausedDateVariable = ko.observable(options.config.pausedDateVariable);
        self.config.pausedByVariable = ko.observable(options.config.pausedByVariable);
        self.config.pauseReasonVariable = ko.observable(options.config.pauseReasonVariable);
        self.config.resumedDateVariable = ko.observable(options.config.resumedDateVariable);
        self.config.resumedByVariable = ko.observable(options.config.resumedByVariable);
        self.config.resumeReasonVariable = ko.observable(options.config.resumeReasonVariable);
        self.config.nextAdviceDateVariable = ko.observable(options.config.nextAdviceDateVariable);
        self.config.errorMessageVariable = ko.observable(options.config.errorMessageVariable);

        // Extend the action model validation
        self.validation.workItemIdVariable = Validator.required(self, self.config.workItemIdVariable, "Choose a work item ID variable");

        self.actionModelErrorCount = ko.pureComputed(() =>
        {
            var fails = 0;
            if (self.validation.workItemIdVariable()) fails++;
            return fails;
        });

        // Track variable selections with correct ShareDo data types
        self.ui.workItemIdVariable = self.trackVariable(self.config.workItemIdVariable, "/Identifier/Work Item Identifier");
        self.ui.statusVariable = self.trackVariable(self.config.statusVariable, "/String");
        self.ui.isEnabledVariable = self.trackVariable(self.config.isEnabledVariable, "/Boolean");
        self.ui.pausedDateVariable = self.trackVariable(self.config.pausedDateVariable, "/DateTime");
        self.ui.pausedByVariable = self.trackVariable(self.config.pausedByVariable, "/String");
        self.ui.pauseReasonVariable = self.trackVariable(self.config.pauseReasonVariable, "/String");
        self.ui.resumedDateVariable = self.trackVariable(self.config.resumedDateVariable, "/DateTime");
        self.ui.resumedByVariable = self.trackVariable(self.config.resumedByVariable, "/String");
        self.ui.resumeReasonVariable = self.trackVariable(self.config.resumeReasonVariable, "/String");
        self.ui.nextAdviceDateVariable = self.trackVariable(self.config.nextAdviceDateVariable, "/DateTime");
        self.ui.errorMessageVariable = self.trackVariable(self.config.errorMessageVariable, "/String");

        // Force addition of outlets for the two outcomes
        self.addAvailableOutlet("adviceRunning", ko.pureComputed(() => "Advice Running"));
        self.addAvailableOutlet("advicePaused", ko.pureComputed(() => "Advice Paused"));
        self.addAvailableOutlet("error", ko.pureComputed(() => "Error"));
    };

    var dispose = function(actionModel)
    {
        var self = actionModel;
        self.ui.workItemIdVariable.dispose();
        self.ui.statusVariable.dispose();
        self.ui.isEnabledVariable.dispose();
        self.ui.pausedDateVariable.dispose();
        self.ui.pausedByVariable.dispose();
        self.ui.pauseReasonVariable.dispose();
        self.ui.resumedDateVariable.dispose();
        self.ui.resumedByVariable.dispose();
        self.ui.resumeReasonVariable.dispose();
        self.ui.nextAdviceDateVariable.dispose();
        self.ui.errorMessageVariable.dispose();
    };

    return {
        createModel: createModel,
        dispose: dispose
    };
})();