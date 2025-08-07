namespace("BasicExamplesOfAllIdeComponents");

/**
 * Blade constructor - remember the name of this JS type must match the ID of the blade in it's .panel.json manifest
 * @param {} element            // The HTML DOM Element to which this blade model is bound 
 * @param {} configuration      // The configuration passed in from the open blade command
 * @param {} stackModel         // The base blade stack model (contains unique id etc)
 * @returns {} 
 */
BasicExamplesOfAllIdeComponents.BasicBlade = function(element, configuration, stackModel)
{
    var self = this;
    var defaults = {};
    var options = $.extend(true, {}, defaults, configuration);

    // Construct the blade model
    self.model = {};

    // Construct the blade validation model
    self.validation = {};

    // Store UI concerns
    self.blade = 
    {
        ribbon: null
    };

    self.blade.ribbon = self.createRibbonBar();
};

/**
 * Create the ribbon for the blade
 */
BasicExamplesOfAllIdeComponents.BasicBlade.prototype.createRibbonBar = function()
{
    var self = this;

    var ribbon = new Components.Core.RibbonBar.Ribbon(
        {
            alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
            sectionTitles: false
        });

    var section = ribbon.createAddSection("Actions", null, true);
    section.createAddButton("Save", self.saveAndClose.bind(self), "btn-success", "fa-save");
    section.createAddButton("Close", self.discard.bind(self), "btn-danger", "fa-times");
    return ribbon;
};

/**
 * Called by the UI framework when this blade is being unloaded - clean up
 * any subscriptions or references here that would keep this instance alive
 */
BasicExamplesOfAllIdeComponents.BasicBlade.prototype.onDestroy = function()
{
    var self = this;
};

/**
 * Called by the UI framework after initial creation and binding to load data
 * into it's model
 */
BasicExamplesOfAllIdeComponents.BasicBlade.prototype.loadAndBind = function()
{
    var self = this;
};

/**
 * Called from the ribbon to save data and close the blade
 */
BasicExamplesOfAllIdeComponents.BasicBlade.prototype.saveAndClose = function ()
{
    var self = this;
    $ui.stacks.close(self, { action: "Saved" });
};

/**
 * Called from the ribbon to discard the blade
 */
BasicExamplesOfAllIdeComponents.BasicBlade.prototype.discard = function ()
{
    var self = this;
    $ui.stacks.cancel(self);
};
