namespace("BasicExamplesOfAllIdeComponents");

/**
 * Constructor for your widget - remember the name of this JS type must match the ID of the widget in it's .widget.json manifest
 * @param {} element            The Html DOM element to which this widget will bind
 * @param {} configuration      The configuration passed in from the designer/config
 * @param {} baseModel          The base widget model (contains unique id etc)
 * @returns {} 
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget = function(element, configuration, baseModel)
{
    var self = this;
    var defaults =
    {
        // Parameters from the host
        _host:
        {
            model: null,
            blade: null,
            enabled: false
        },
        
        // Aspect widget config parameters
        todoMessage: null
    };
    
    var options = $.extend(true, {}, defaults, configuration);
    
    // Store host parameters
    self._host = options._host;

    // Setup the local model
    self.model =
    {
        // This is referencing a standard observable item from the main model
        title: options._host.model.title,

        // This is the configured message against the aspect instance
        todoMessage: options.todoMessage || "No message specified",

        // This will hydrate on refresh
        json: ko.observable("<<Click refresh to load the current model>>")
    };

    // Expose validation
    self.validationErrorCount = ko.pureComputed(() =>
    {
        var count = 0;
        if( true ) count++;
        return count;
    });
};

/**
 * Called by the UI framework when this widget is being unloaded - clean up
 * any subscriptions or references here that would keep this instance alive
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.onDestroy = function()
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : onDestroy");
};

/**
 * Called by the UI framework after initial creation and binding to load data
 * into it's model
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.loadAndBind = function()
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : loadAndBind");
};

/**
 * Called by the aspect IDE adapter before the model is saved
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.onBeforeSave = function (model) 
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : onBeforeSave");
}

/**
 * Called by the aspect IDE adapter when the model is saved. Manipulate the
 * model as required.
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.onSave = function (model) 
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : onSave");
}

/**
 * Called by the aspect IDE adapter after the model has been saved.
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.onAfterSave = function (model) 
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : onAfterSave");
}

/**
 * Called by the aspect IDE adapter when it reloads aspect data
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.onReload = function (model) 
{
    var self = this;
    console.log("BasicExamplesOfAllIdeComponents.WidgetAspectWidget : onReload");
}

/**
 * Example method - handle the refresh button click
 */
BasicExamplesOfAllIdeComponents.WidgetAspectWidget.prototype.refreshClicked = function () 
{
    var self = this;
    self.model.json(ko.toJSON(self._host.model, null, 4));
}


