namespace("Prototype");

/**
 * Blade constructor - remember the name of this JS type must match the ID of the blade in it's .panel.json manifest
 * @param {} element            // The HTML DOM Element to which this blade model is bound
 * @param {} configuration      // The configuration passed in from the open blade command
 * @param {} stackModel         // The base blade stack model (contains unique id etc)
 * @returns {}
 */
Prototype.CustomFindAndEditParticipant = function (
  element,
  configuration,
  stackModel
) {
  var self = this;
  var defaults = {};
  var options = $.extend(true, {}, defaults, configuration);

  // Construct the blade model
  self.model = {
    role: configuration.role || "client",
  };

  // Construct the blade validation model
  self.validation = {};

  // Store UI concerns
  self.blade = {
    ribbon: null,
  };

  console.log("self.model:", self.model);

  // self.blade.ribbon = self.createRibbonBar();
};

/**
 * Create the ribbon for the blade
 */
// Prototype.CustomFindAndEditParticipant.prototype.createRibbonBar = function()
// {
//     var self = this;

//     var ribbon = new Components.Core.RibbonBar.Ribbon(
//         {
//             alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
//             sectionTitles: false
//         });

//     var section = ribbon.createAddSection("Actions", null, true);
//     section.createAddButton("Save", self.saveAndClose.bind(self), "btn-success", "fa-save");
//     section.createAddButton("Close", self.discard.bind(self), "btn-danger", "fa-times");
//     return ribbon;
// };

/**
 * Called by the UI framework when this blade is being unloaded - clean up
 * any subscriptions or references here that would keep this instance alive
 */
Prototype.CustomFindAndEditParticipant.prototype.onDestroy = function () {
  var self = this;
};

/**
 * Called by the UI framework after initial creation and binding to load data
 * into it's model
 */
Prototype.CustomFindAndEditParticipant.prototype.loadAndBind = function () {
  var self = this;


  let pathToRole = `roles.${self.model.role}.ods.id`;

  let model = {
    search: {
      page: {
        page: 1,
        rowsPerPage: 1,
      },
      workItemIds: [$ui.pageContext.sharedoId()],
    },
    enrich: [
      {
        path: pathToRole,
      },
    ],
  };

  $ajax.post("/api/v1/public/workItem/findByQuery", model).then((d) => {
    console.log(d.results[0].data[pathToRole]);

    let roleOdsId = d.results[0].data[pathToRole]; //use current user, future get passed in role odsId
    //get the client ods Id

    //replace this blade with ods edit panel:Sharedo.Core.Case.Panels.Ods.AddEditPerson

    let config = {
      id: roleOdsId,
    };

    $ui.stacks.close(self, { action: "Saved" });
    $ui.stacks.openPanel("Sharedo.Core.Case.Panels.Ods.AddEditPerson", config);
  });
};

/**
 * Called from the ribbon to save data and close the blade
 */
Prototype.CustomFindAndEditParticipant.prototype.saveAndClose = function () {
  var self = this;
  $ui.stacks.close(self, { action: "Saved" });
};

/**
 * Called from the ribbon to discard the blade
 */
Prototype.CustomFindAndEditParticipant.prototype.discard = function () {
  var self = this;
  $ui.stacks.cancel(self);
};
