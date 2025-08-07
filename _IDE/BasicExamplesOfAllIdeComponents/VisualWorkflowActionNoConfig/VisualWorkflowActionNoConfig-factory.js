(function()
{
    var createModel = function(actionModel, actionOptions, wfModel, stepModel)
    {
        // Reference self as the action model we're extending
        var self = actionModel;

        // Setup model defaults and extend from loaded config
        var defaults =
        {
            // Your custom config is passed in this object
            config: { },

            // The list of connections as persisted
            connections: {}
        };
        var options = $.extend(true, {}, defaults, actionOptions);

        // EXAMPLE: Extend the action model with custom model
        // self.config.someProperty = ko.observable(options.config.someProperty);

        // EXAMPLE: Extend the action model validation
        // self.validation.someProperty = Validator.required(self, self.config.someProperty, "Specify something");
        //
        // self.actionModelErrorCount = ko.pureComputed(() =>
        // {
        //     var fails = 0;
        //     if (self.validation.someProperty()) fails++;
        //     return fails;
        // });

        // EXAMPLE: Store non config model properties in the action
        // You normally only need to store things in the action model if you need them outside of the designer widget
        // e.g. to validate the step without the designer widget being loaded
        // self.ui.someThing = true;

        // EXAMPLE: Reference and track variable selections
        // Be aware that variable tracking creates a subscription, so any `trackVariable`'s must be disposed
        // self.config.selectedVariable = ko.observable(options.config.selectedVariable);
        // self.config.outputVariable = ko.observable(options.config.outputVariable);
        // self.ui.selectedVariable = self.trackVariable(self.config.selectedVariable, "/Identifier/Ods Entity Identifier");
        // self.ui.outputVariable = self.trackVariable(self.config.outputVariable);

        // EXAMPLE: force addition of outlets to an action of this type
        //          NOTE the outlet label can be observable to keep in sync in the diagram
        // self.addAvailableOutlet("outlet-id", "Outlet label");
    };

    var dispose = function(actionModel)
    {
        var self = actionModel;
        // EXAMPLE: Dispose of the variable trackers
        // self.ui.selectedVariable.dispose();
        // self.ui.outputVariable.dispose();
    };

    return {
        createModel: createModel,
        dispose: dispose
    };
})();