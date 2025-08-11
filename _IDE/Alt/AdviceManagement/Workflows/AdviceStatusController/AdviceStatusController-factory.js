(function()
{
    var createModel = function(actionModel, actionOptions, wfModel, stepModel)
    {
        // Reference self as the action model we're extending
        var self = actionModel;

        // Setup model defaults and extend from loaded config
        var defaults =
        {
            // Custom config for advice status controller
            config:
            {
                workItemIdVariable: null,
                pauseReasonVariable: null,
                actionTakenVariable: null,
                previousStatusVariable: null,
                currentStatusVariable: null,
                successVariable: null,
                errorMessageVariable: null,
                pausedDateVariable: null,
                resumedDateVariable: null,
                lastActionDateVariable: null,
                defaultAction: "checkOnly",
                conditions: [],
                requireConfirmation: false,
                enableLogging: true,
                retryOnFailure: true
            },
            
            // The list of connections as persisted
            connections: {}
        };
        var options = $.extend(true, {}, defaults, actionOptions);

        // Extend the action model with custom config observables
        self.config.workItemIdVariable = ko.observable(options.config.workItemIdVariable);
        self.config.pauseReasonVariable = ko.observable(options.config.pauseReasonVariable);
        self.config.actionTakenVariable = ko.observable(options.config.actionTakenVariable);
        self.config.previousStatusVariable = ko.observable(options.config.previousStatusVariable);
        self.config.currentStatusVariable = ko.observable(options.config.currentStatusVariable);
        self.config.successVariable = ko.observable(options.config.successVariable);
        self.config.errorMessageVariable = ko.observable(options.config.errorMessageVariable);
        self.config.pausedDateVariable = ko.observable(options.config.pausedDateVariable);
        self.config.resumedDateVariable = ko.observable(options.config.resumedDateVariable);
        self.config.lastActionDateVariable = ko.observable(options.config.lastActionDateVariable);
        self.config.defaultAction = ko.observable(options.config.defaultAction);
        self.config.conditions = ko.observableArray(options.config.conditions);
        self.config.requireConfirmation = ko.observable(options.config.requireConfirmation);
        self.config.enableLogging = ko.observable(options.config.enableLogging !== undefined ? options.config.enableLogging : true);
        self.config.retryOnFailure = ko.observable(options.config.retryOnFailure !== undefined ? options.config.retryOnFailure : true);

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
        self.ui.pauseReasonVariable = self.trackVariable(self.config.pauseReasonVariable, "/String");
        self.ui.actionTakenVariable = self.trackVariable(self.config.actionTakenVariable, "/String");
        self.ui.previousStatusVariable = self.trackVariable(self.config.previousStatusVariable, "/String");
        self.ui.currentStatusVariable = self.trackVariable(self.config.currentStatusVariable, "/String");
        self.ui.successVariable = self.trackVariable(self.config.successVariable, "/Boolean");
        self.ui.errorMessageVariable = self.trackVariable(self.config.errorMessageVariable, "/String");
        self.ui.pausedDateVariable = self.trackVariable(self.config.pausedDateVariable, "/DateTime");
        self.ui.resumedDateVariable = self.trackVariable(self.config.resumedDateVariable, "/DateTime");
        self.ui.lastActionDateVariable = self.trackVariable(self.config.lastActionDateVariable, "/DateTime");

        // Force addition of outlets for the different outcomes
        self.addAvailableOutlet("success", ko.pureComputed(() => "Success"));
        self.addAvailableOutlet("paused", ko.pureComputed(() => "Advice Paused"));
        self.addAvailableOutlet("resumed", ko.pureComputed(() => "Advice Resumed"));
        self.addAvailableOutlet("noAction", ko.pureComputed(() => "No Action Taken"));
        self.addAvailableOutlet("error", ko.pureComputed(() => "Error"));
    };

    var dispose = function(actionModel)
    {
        var self = actionModel;
        self.ui.workItemIdVariable.dispose();
        self.ui.pauseReasonVariable.dispose();
        self.ui.actionTakenVariable.dispose();
        self.ui.previousStatusVariable.dispose();
        self.ui.currentStatusVariable.dispose();
        self.ui.successVariable.dispose();
        self.ui.errorMessageVariable.dispose();
        self.ui.pausedDateVariable.dispose();
        self.ui.resumedDateVariable.dispose();
        self.ui.lastActionDateVariable.dispose();
    };

    return {
        createModel: createModel,
        dispose: dispose
    };
})();