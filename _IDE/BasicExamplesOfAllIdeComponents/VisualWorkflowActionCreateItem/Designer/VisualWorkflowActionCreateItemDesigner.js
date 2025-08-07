// Namespacing
namespace("BasicExamplesOfAllIdeComponents");

/**
 * Constructor for your widget
 * @param {} element            The Html DOM element to which this widget will bind
 * @param {} configuration      The configuration passed in from the designer/config
 * @param {} baseModel          The base widget model (contains unique id etc)
 * @returns {} 
 */
BasicExamplesOfAllIdeComponents.VisualWorkflowActionCreateItemDesigner = function (element, configuration, baseModel)
{
    var self = this;
    var defaults = 
    {
        /*************************************************************
        These configurations are passed from the WF Action editor host
        *************************************************************/
        
        // The selection [Action] node from the workflow model
        // This widget will be likely populating the node.config {} object
        node: null,

        // The overall [WorkflowEditorModel]
        model: null
    };
    
    var options = $.extend(true, {}, defaults, configuration);

    // Store the action in this view model ready for the widget template to render it
    self.action = options.node;

    // Reference the model as well, for the variable pickers
    self.model = options.model;

    // Create the type picker
    self.sharedoTypePickerOptions =
    {
        multiSelect: false,
        selectMode: "systemName",
        selectedItem: self.action.config.sharedoTypeSystemName
    };

    // Create the phase outlet picker
    self.phases = self.action.ui.phases;
    self.phasePickerOptions =
    {
        action: self.action,
        sharedoTypeSystemName: self.action.config.sharedoTypeSystemName,
        phases: self.phases
    };

    // Create the assignment picker
    self.assignmentPickerOptions =
    {
        action: self.action,
        sharedoTypeSystemName: self.action.config.sharedoTypeSystemName,
        assignments: self.action.ui.assignments
    };
};

