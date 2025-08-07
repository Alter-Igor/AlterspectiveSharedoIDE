namespace("BasicExamplesOfAllIdeComponents");

/**
 * Constructor for your widget - remember the name of this JS type must match the ID of the widget in it's .widget.json manifest
 * @param {} element            The Html DOM element to which this widget will bind
 * @param {} configuration      The configuration passed in from the designer/config
 * @param {} baseModel          The base widget model (contains unique id etc)
 * @returns {} 
 */
BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesigner = function(element, configuration, baseModel)
{
    var self = this;
    var defaults =
    {
        // id can be passed as a param during widget creation, or will default to the current sharedo Id if not set
        id: null,

        // Model items from the designer widget
        todoMessage: null
    };
    var options = $.extend(true, {}, defaults, configuration);

    // Default the ID from the current sharedo portal if not passed in
    if (!options.id && $ui && $ui.pageContext && $ui.pageContext.sharedoId)
    {
        options.id = $ui.pageContext.sharedoId();
    }

    // Setup the local model
    self.model =
    {
        // Remember, only things that might change need to be observable!
        todoMessage: options.todoMessage,
        id: options.id,
        title: ko.observable(),
        reference: ko.observable(),
        createdDate: ko.observable(),
        updatedDate: ko.observable(),
        owner: ko.observable(),
        client: ko.observable(),
        knownAssociates: ko.observableArray()
    };
};

/**
 * Called by the UI framework when this widget is being unloaded - clean up
 * any subscriptions or references here that would keep this instance alive
 */
BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesigner.prototype.onDestroy = function()
{
    var self = this;
};

/**
 * Called by the UI framework after initial creation and binding to load data
 * into it's model
 */
BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesigner.prototype.loadAndBind = function()
{
    var self = this;

    BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesignerAgent.loadWorkItem(self.model.id).then(function(data)
    {
        self.model.title(data.title);
        self.model.reference(data.reference);
        self.model.createdDate(data.createdDate);
        self.model.updatedDate(data.updatedDate);
        self.model.owner(data.owner);
        self.model.client(data.client);
    });

    BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesignerAgent.getExternalData().then(function(response)
    {
        self.model.knownAssociates(_.map(response.data, function(person)
        {
            return {
                name: person.firstName + " " + person.lastName,
                email: person.email,
                picture: person.picture
            };
        }));
    });
};