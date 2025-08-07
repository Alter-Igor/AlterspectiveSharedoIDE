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
            config:
            {
                // The work type to create
                sharedoTypeSystemName: null,
                
                // The reference - if left empty will run any generators
                reference: null,

                // The title - if left empty will run any generators
                title: null,

                // The description
                description: null,

                // Optionally create the work item as a child of this parent
                parentWorkItemIdVariable: null,

                // The list of phase transition outlets to hook up
                phaseOutlets: [],

                // The list of role assignments to be made
                assignments: [],

                // Optionally store the id of the created work item in this variable
                outputVariable: null
            },
            
            // The list of connections as persisted
            connections: {}
        };
        var options = $.extend(true, {}, defaults, actionOptions);

        // Extend the action model with custom model
        self.config.sharedoTypeSystemName = ko.observable(options.config.sharedoTypeSystemName);
        self.config.reference = ko.observable(options.config.reference);
        self.config.title = ko.observable(options.config.title);
        self.config.description = ko.observable(options.config.description);
        self.config.parentWorkItemIdVariable = ko.observable(options.config.parentWorkItemIdVariable);
        self.config.outputVariable = ko.observable(options.config.outputVariable);

        // Extend the action model validation
        self.validation.sharedoTypeSystemName = Validator.required(self, self.config.sharedoTypeSystemName, "Specify the work type to create");
        
        self.actionModelErrorCount = ko.pureComputed(() =>
        {
            var fails = 0;
            if (self.validation.sharedoTypeSystemName()) fails++;
            return fails;
        });

        // Track variable references
        self.ui.parentWorkItemIdVariable = self.trackVariable(self.config.parentWorkItemIdVariable, "/Identifier/Work Item Identifier");
        self.ui.outputVariable = self.trackVariable(self.config.outputVariable, "/Identifier/Work Item Identifier");

        // Dynamic phase outlets
        self.ui.phases = new Sharedo.Core.Case.WorkflowEditor.WFPhaseOutlets(self, options.config.phaseOutlets);

        // Assignments
        self.ui.assignments = new Sharedo.Core.Case.WorkflowEditor.WFAssignments(self, options.config.assignments);
    };

    var dispose = function(actionModel)
    {
        var self = actionModel;

        // Dispose variable references
        self.ui.parentWorkItemIdVariable.dispose();
        self.ui.outputVariable.dispose();

        // Dispose outlets
        self.ui.phases.dispose();

        // Dispose assignments
        self.ui.assignments.dispose();
    };

    var getModel = function(actionModel)
    {
        var self = actionModel;
        var config = ko.toJS(self.config);

        // Transform phase outlets
        config.phaseOutlets = self.ui.phases.getModel();

        // Transform assignments
        config.assignments = self.ui.assignments.getModel();

        return config;
    };

    return {
        createModel: createModel,
        dispose: dispose,
        getModel: getModel
    };
})();